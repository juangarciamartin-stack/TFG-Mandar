using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using VestaApi.Models;
using Backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using System.IO;
using Microsoft.AspNetCore.Hosting;
using System;
using System.Linq;

namespace VestaApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NominasController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;

        public NominasController(ApplicationDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        // GET: api/Nominas
        [HttpGet]
        public async Task<IActionResult> GetNominas()
        {
            try
            {
                var nominasLimpias = await _context.Nominas
                    .Include(n => n.Usuario)
                    .Include(n => n.Empresa)
                    .Select(n => new
                    {
                        n.Id,
                        n.Mes,
                        n.Anio,
                        n.RutaArchivoPDF,
                        n.UsuarioId,
                        NombreEmpleado = n.Usuario != null ? n.Usuario.Nombre : "Operario no asignado",
                        EmailEmpleado = n.Usuario != null ? n.Usuario.Email : "Sin correo electrónico",
                        n.EmpresaId,
                        NombreEmpresa = n.Empresa != null ? n.Empresa.NombreEmpresa : "Empresa externa"
                    })
                    .ToListAsync();

                return Ok(nominasLimpias);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR EN GET NOMINAS: {ex.Message}");
                return StatusCode(500, new { mensaje = "Error interno del servidor al procesar la lista de nóminas." });
            }
        }

        // GET: api/Nominas/5
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetNomina(int id)
        {
            try
            {
                var n = await _context.Nominas
                    .Include(n => n.Usuario)
                    .Include(n => n.Empresa)
                    .FirstOrDefaultAsync(n => n.Id == id);

                if (n == null) return NotFound();

                return Ok(new
                {
                    n.Id,
                    n.Mes,
                    n.Anio,
                    n.RutaArchivoPDF,
                    n.UsuarioId,
                    NombreEmpleado = n.Usuario != null ? n.Usuario.Nombre : "Operario no asignado",
                    EmailEmpleado = n.Usuario != null ? n.Usuario.Email : "Sin correo electrónico",
                    n.EmpresaId,
                    NombreEmpresa = n.Empresa != null ? n.Empresa.NombreEmpresa : "Empresa externa"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR EN GET NOMINA POR ID: {ex.Message}");
                return StatusCode(500, new { mensaje = "Error al procesar la nómina individual." });
            }
        }

    // POST: api/Nominas/subir
        [HttpPost("subir")]
        public async Task<IActionResult> SubirNomina([FromForm] int idUsuario, [FromForm] string mes, [FromForm] int anio, [FromForm] int empresaId, IFormFile archivo)
        {
            if (archivo == null || archivo.Length == 0) return BadRequest("No se ha enviado ningún archivo.");

            try
            {
                var baseFolder = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
                var uploadsFolder = Path.Combine(baseFolder, "uploads", "nominas");
                
                if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

                var uniqueFileName = Guid.NewGuid().ToString() + "_" + archivo.FileName;
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await archivo.CopyToAsync(stream);
                }

                var nomina = new Nomina
                {
                    Mes = mes,
                    Anio = anio,
                    RutaArchivoPDF = $"/uploads/nominas/{uniqueFileName}",
                    UsuarioId = idUsuario,
                    EmpresaId = empresaId 
                };

                _context.Nominas.Add(nomina);
                await _context.SaveChangesAsync();

                return Ok(new { mensaje = "Nómina guardada y asociada al operario con éxito.", nomina });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = $"Error al procesar la nómina en la BD: {ex.Message}" });
            }
        }

        // GET: api/Nominas/descargar/5
        [HttpGet("descargar/{id}")]
        public async Task<IActionResult> DescargarNomina(int id)
        {
            var nomina = await _context.Nominas.FindAsync(id);
            if (nomina == null) return NotFound();

            var baseFolder = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
            var filePath = Path.Combine(baseFolder, "uploads", "nominas", Path.GetFileName(nomina.RutaArchivoPDF));

            if (!System.IO.File.Exists(filePath)) return NotFound("El archivo físico no existe.");

            var bytes = await System.IO.File.ReadAllBytesAsync(filePath);
            return File(bytes, "application/pdf", Path.GetFileName(nomina.RutaArchivoPDF));
        }

        // GET: api/Nominas/mis-nominas
        [HttpGet("mis-nominas")]
        public IActionResult GetMisNominas()
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Unauthorized();

            var nominas = _context.Nominas
                .Include(n => n.Empresa)
                .Where(n => n.UsuarioId == int.Parse(userIdClaim))
                .ToList();

            return Ok(nominas);
        }

        // DELETE: api/Nominas/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNomina(int id)
        {
            var nomina = await _context.Nominas.FindAsync(id);
            if (nomina == null) return NotFound();

            _context.Nominas.Remove(nomina);
            await _context.SaveChangesAsync();
            return NoContent();
        }
        
       // GET: api/Nominas/historial-empresario
        [HttpGet("historial-empresario")]
        public async Task<IActionResult> GetNominasHistorialEmpresario()
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (userIdClaim == null) return Unauthorized();
                int miUsuarioId = int.Parse(userIdClaim);

                var usuarioReal = await _context.Usuarios.FindAsync(miUsuarioId);
                bool esAdmin = usuarioReal?.Rol == "Admin" || usuarioReal?.Rol == "Ayuntamiento";

                var query = _context.Nominas
                    .Include(n => n.Usuario)
                    .Include(n => n.Empresa)
                    .AsQueryable();

                if (!esAdmin)
                {
                    query = query.Where(n => n.Empresa.UsuarioId == miUsuarioId);
                }

                var nominasEmitidas = await query
                    .Select(n => new
                    {
                        n.Id,
                        n.Mes,
                        n.Anio,
                        n.RutaArchivoPDF,
                        n.UsuarioId,
                        NombreEmpleado = n.Usuario != null ? n.Usuario.Nombre : "Operario Desvinculado",
                        EmailEmpleado = n.Usuario != null ? n.Usuario.Email : "Sin Correo",
                        n.EmpresaId,
                        NombreEmpresa = n.Empresa != null ? n.Empresa.NombreEmpresa : "Empresa externa",
                        EstadoEmpresa = n.Empresa != null ? n.Empresa.EstadoAprobacion : "Desconocido"
                    })
                    .ToListAsync();

                return Ok(nominasEmitidas);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR EN HISTORIAL EMPRESARIO: {ex.Message}");
                return StatusCode(500, new { mensaje = "Error al recuperar el histórico de nóminas." });
            }
        }

        private bool NominaExists(int id) => _context.Nominas.Any(e => e.Id == id);
    }
}