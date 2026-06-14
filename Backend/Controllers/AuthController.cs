using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks; 
using VestaApi.DTOs;
using Backend.Data;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using VestaApi.Models; 

namespace VestaApi.Controllers
{
    [Route("api/[controller]")] 
    [ApiController] 
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context; 
        private readonly IConfiguration _config;

        public AuthController(ApplicationDbContext context, IConfiguration config) 
        {
            _context = context;
            _config = config;
        }

        [HttpPost("login")] 
        public IActionResult Login([FromBody] LoginRequest request) 
        {
            try
            {
                if (request == null || string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
                {
                    return BadRequest(new { mensaje = "El email y la contraseña son obligatorios." });
                }

                var emailLimpio = request.Email.Trim().ToLower();
                var usuario = _context.Usuarios.FirstOrDefault(u => u.Email.Trim().ToLower() == emailLimpio);

                if (usuario == null)
                {
                    return Unauthorized(new { mensaje = "Email o contraseña incorrectos" });
                }

                bool contraseniaValida = false;
                try 
                {
                    contraseniaValida = BCrypt.Net.BCrypt.Verify(request.Password.Trim(), usuario.Password.Trim());
                }
                catch 
                {
                    contraseniaValida = false;
                }

                if (!contraseniaValida && (usuario.Password == request.Password || usuario.Password.Trim() == request.Password.Trim()))
                {
                    contraseniaValida = true;
                }

                if (!contraseniaValida)
                {
                    return Unauthorized(new { mensaje = "Email o contraseña incorrectos" });
                }

                int? miEmpresaId = null;
                try {
                    var empresaPropia = _context.Empresas.FirstOrDefault(e => e.UsuarioId == usuario.Id); 
                    miEmpresaId = empresaPropia?.Id;
                } catch (Exception ex) {
                    Console.WriteLine($"Error al buscar empresa: {ex.Message}");
                }

                bool tieneContratoActivo = false;
                try {
                    tieneContratoActivo = _context.UsuarioEmpresas
                        .Any(ue => ue.UsuarioId == usuario.Id && ue.EstadoSolicitud == "Contratado");
                } catch (Exception ex) {
                    Console.WriteLine($"Error al buscar contratos: {ex.Message}");
                }

                int? miAyuntamientoId = usuario.IdAyuntamiento;

                var claims = new[]
                {
                    new Claim(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
                    new Claim(JwtRegisteredClaimNames.Email, usuario.Email),
                    new Claim(ClaimTypes.Role, usuario.Rol ?? "Trabajador") 
                };

                var keyValue = _config["Jwt:Key"] ?? "ClaveSuperSecretaDeRespaldoParaVestaTFG2026";
                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyValue));
                var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

                var token = new JwtSecurityToken(
                    issuer: _config["Jwt:Issuer"],
                    audience: _config["Jwt:Audience"],
                    claims: claims,
                    expires: DateTime.Now.AddHours(2), 
                    signingCredentials: creds
                );

                return Ok(new
                {
                    token = new JwtSecurityTokenHandler().WriteToken(token),
                    usuarioId = usuario.Id,
                    nombre = usuario.Nombre,
                    rol = usuario.Rol ?? "Trabajador", 
                    empresaId = miEmpresaId, 
                    idAyuntamiento = miAyuntamientoId, 
                    ayuntamientoId = miAyuntamientoId,
                    tieneContratoActivo = tieneContratoActivo 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error interno en el servidor.", error = ex.Message });
            }
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
        {
            try
            {
                if (request == null || string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
                {
                    return BadRequest(new { mensaje = "Datos de registro incompletos." });
                }

                var emailLimpio = request.Email.Trim().ToLower();

                if (_context.Usuarios.Any(u => u.Email.Trim().ToLower() == emailLimpio))
                {
                    return BadRequest(new { mensaje = "El correo electrónico ya está registrado." });
                }

                var nuevoUsuario = new Usuario
                {
                    Nombre = request.Nombre?.Trim(),
                    Email = emailLimpio,
                    Dni = request.Dni?.Trim().ToUpper(),              
                    Telefono = request.Telefono?.Trim(),     
                    Rol = "Trabajador", 
                    Disponibilidad = true,
                    Activo = true,                                                   
                    TokenVerificacion = null,
                    TokenExpiracion = null,
                    Password = BCrypt.Net.BCrypt.HashPassword(request.Password.Trim())
                };

                _context.Usuarios.Add(nuevoUsuario);
                await _context.SaveChangesAsync();

                return Ok(new { mensaje = "¡Cuenta creada con éxito! Ya puedes iniciar sesión." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = $"Error al guardar en base de datos: {ex.Message}" });
            }
        }

        [HttpGet("lista-usuarios")]
        public IActionResult GetUsuarios()
        {
            var usuarios = _context.Usuarios.Select(u => new { u.Id, u.Email, u.Rol }).ToList();
            return Ok(usuarios);
        }
    }

    public class RegisterRequestDto
    {
        public string Nombre { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Dni { get; set; } = string.Empty;       
        public string Telefono { get; set; } = string.Empty;  
    }
}