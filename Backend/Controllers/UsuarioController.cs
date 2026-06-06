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

namespace VestaApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UsuariosController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UsuariosController(ApplicationDbContext context)
        {
            _context = context;
        }

        //Autentificacion y registro
        [HttpPost("registrar")]
        [AllowAnonymous] 
        public async Task<ActionResult<Usuario>> Registrar(Usuario usuario)
        {
            if (string.IsNullOrEmpty(usuario.Password)) return BadRequest("La contraseña es obligatoria.");

            usuario.Password = BCrypt.Net.BCrypt.HashPassword(usuario.Password);  //Hashear la contraseña

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUsuario), new { id = usuario.Id }, usuario); 
        }

        //login
        [HttpPost("login")]
        [AllowAnonymous] 
        public async Task<IActionResult> Login([FromBody] LoginRequest login)
        {
            var user = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Email == login.Email); 

            if (user == null)
            {
                return Unauthorized("El usuario no existe");
            }

            bool contraseniaValida = BCrypt.Net.BCrypt.Verify(login.Password, user.Password);

            if (!contraseniaValida) 
            {
                return Unauthorized("Contraseña incorrecta");
            }

            return Ok(new { 
                Mensaje = "Login exitoso", 
                UsuarioId = user.Id,
                Rol = user.Rol 
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

       // GET: api/Usuarios/mis-empresas-selector
        [HttpGet("mis-empresas-selector")]
        public async Task<IActionResult> GetMisEmpresasSelector()
        {
            try
            {
                if (User.IsInRole("Admin") || User.IsInRole("Ayuntamiento"))
                {
                    var todas = await _context.Empresas
                        .Where(e => e.EstadoAprobacion == "Aprobado" 
                                 && e.EstadoAprobacion != "Baja"
                                 && e.EstadoAprobacion != "Inactiva") 
                        .Select(e => new { e.Id, e.NombreEmpresa })
                        .ToListAsync();
                        
                    return Ok(todas);
                }

                var usuarioIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(usuarioIdStr)) return Unauthorized("Identificador de usuario no encontrado en el token.");
                int usuarioId = int.Parse(usuarioIdStr);

                var misEmpresas = await _context.Empresas
                    .Where(e => e.UsuarioId == usuarioId 
                             && e.EstadoAprobacion == "Aprobado"
                             && e.EstadoAprobacion != "Baja"
                             && e.EstadoAprobacion != "Inactiva")
                    .Select(e => new { e.Id, e.NombreEmpresa })
                    .ToListAsync();

                return Ok(misEmpresas);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = $"Error al obtener tus empresas: {ex.Message}" });
            }
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

        //Para que el Admin pueda ver todos los operarios del municipio 
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