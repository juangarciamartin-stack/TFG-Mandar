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
using Microsoft.AspNetCore.Identity; 

namespace VestaApi.Controllers
{
    [Route("api/[controller]")] 
    [ApiController] 
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context; 
        private readonly IConfiguration _config;
        private readonly PasswordHasher<Usuario> _passwordHasher; 

        public AuthController(ApplicationDbContext context, IConfiguration config) 
        {
            _context = context;
            _config = config;
            _passwordHasher = new PasswordHasher<Usuario>(); 
        }

        [HttpPost("login")] 
        public IActionResult Login([FromBody] LoginRequest request) 
        {
            try
            {
                var usuario = _context.Usuarios.FirstOrDefault(u => u.Email == request.Email);

                if (usuario == null)
                {
                    return Unauthorized(new { mensaje = "Email o contraseña incorrectos" });
                }

                var resultadoVerificacion = _passwordHasher.VerifyHashedPassword(usuario, usuario.Password, request.Password);

                if (resultadoVerificacion == PasswordVerificationResult.Failed)
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

                int? miAyuntamientoId = null;
                if (usuario.Rol == "Ayuntamiento")
                {
                    try {
                        var ayuntamientoPropio = _context.Ayuntamientos.FirstOrDefault(a => a.Id == usuario.Id);
                        miAyuntamientoId = ayuntamientoPropio?.Id; 
                    } catch (Exception ex) {
                        Console.WriteLine($"Error al buscar ayuntamiento: {ex.Message}");
                    }
                }

                var claims = new[]
                {
                    new Claim(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
                    new Claim(JwtRegisteredClaimNames.Email, usuario.Email),
                    new Claim(ClaimTypes.Role, usuario.Rol) 
                };

                var keyValue = _config["Jwt:Key"];
                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyValue!));
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
                    rol = usuario.Rol, 
                    empresaId = miEmpresaId, 
                    idAyuntamiento = miAyuntamientoId, 
                    tieneContratoActivo = tieneContratoActivo 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error interno en el servidor.", ex });
            }
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
        {
            try
            {
                if (_context.Usuarios.Any(u => u.Email == request.Email))
                {
                    return BadRequest(new { mensaje = "El correo electrónico ya está registrado." });
                }

                var nuevoUsuario = new Usuario
                {
                    Nombre = request.Nombre,
                    Email = request.Email,
                    Dni = request.Dni,               
                    Telefono = request.Telefono,     
                    Rol = "Trabajador", 
                    Disponibilidad = true,
                    Activo = true,                                   
                    TokenVerificacion = null,
                    TokenExpiracion = null
                };

                nuevoUsuario.Password = _passwordHasher.HashPassword(nuevoUsuario, request.Password);

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