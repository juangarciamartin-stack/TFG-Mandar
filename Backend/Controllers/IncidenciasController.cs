using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VestaApi.Models;
using Backend.Data;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace VestaApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class IncidenciasController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public IncidenciasController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Incidencias/empresa
        [HttpGet("empresa/{empresaId}")]
        public async Task<IActionResult> GetIncidenciasPorEmpresa(int empresaId)
        {
            try
            {
                var incidencias = await _context.Incidencias
                    .Include(i => i.Empresa)
                    .Where(i => i.EmpresaId == empresaId)
                    .OrderByDescending(i => i.FechaCreacion)
                    .Select(i => new {
                        i.Id,
                        i.Titulo,
                        i.Descripcion,
                        i.Estado,
                        i.Gravedad,
                        i.UsuarioId,
                        i.LoteId,
                        i.EmpresaId,
                        i.FechaCreacion,
                        NombreEmpresa = i.Empresa != null ? i.Empresa.NombreEmpresa : "Sin Empresa",
                        DuenoEmpresaId = i.Empresa != null ? i.Empresa.UsuarioId : 0
                    })
                    .ToListAsync();

                return Ok(incidencias);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR EN GetIncidenciasPorEmpresa: {ex.Message}");
                return StatusCode(500, new { mensaje = "Error interno al recuperar las incidencias de la contrata." });
            }
        }


        // GET: api/Incidencias/mis-contratas-trabajador
        [HttpGet("mis-contratas-trabajador")]
        public async Task<IActionResult> GetMisContratasTrabajador()
        {
            var usuarioIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(usuarioIdStr)) return Unauthorized();
            int usuarioId = int.Parse(usuarioIdStr);

            var usuarioReal = await _context.Usuarios.FindAsync(usuarioId);
            string rolReal = usuarioReal?.Rol ?? "Trabajador";

            try
            {
                if (rolReal == "Admin" || rolReal == "Ayuntamiento")
                {
                    var todasLasEmpresasActivas = await _context.Empresas
                        .Where(e => e.EstadoAprobacion == "Aprobado" || e.EstadoAprobacion == null)
                        .Select(e => new {
                            Id = e.Id,
                            NombreEmpresa = e.NombreEmpresa,
                            TipoRelacion = "Supervisor",
                            EstadoEmpresa = e.EstadoAprobacion ?? "Aprobado"
                        })
                        .ToListAsync();

                    return Ok(todasLasEmpresasActivas);
                }

                var empresasDondeTrabajo = await _context.UsuarioEmpresas
                    .Where(ue => ue.UsuarioId == usuarioId && 
                                 (ue.EstadoSolicitud == "Contratado" || ue.EstadoSolicitud == "contratado"))
                    .Select(ue => new { 
                        Id = ue.EmpresaId, 
                        NombreEmpresa = ue.Empresa != null ? ue.Empresa.NombreEmpresa : "Empresa Adjudicataria",
                        TipoRelacion = "Empleado",
                        EstadoEmpresa = ue.Empresa != null ? ue.Empresa.EstadoAprobacion : "Aprobado"
                    })
                    .ToListAsync();

                var misPropiasEmpresas = await _context.Empresas
                    .Where(e => e.UsuarioId == usuarioId)
                    .Select(e => new {
                        Id = e.Id,
                        NombreEmpresa = e.NombreEmpresa + (e.EstadoAprobacion == "Baja" ? " (Histórico - De Baja)" : " (Mi Empresa)"),
                        TipoRelacion = "Dueño",
                        EstadoEmpresa = e.EstadoAprobacion
                    })
                    .ToListAsync();

                var listaCompleta = empresasDondeTrabajo.Concat(misPropiasEmpresas).ToList();
                return Ok(listaCompleta);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR EN GetMisContratasTrabajador Unificado: {ex.Message}");
                return StatusCode(500, new { mensaje = "Error al compilar el registro de contratas." });
            }
        }

        // GET: api/Incidencias?empresaId
        [HttpGet]
        public async Task<IActionResult> GetIncidencias([FromQuery] int? empresaId)
        {
            var usuarioIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(usuarioIdStr)) return Unauthorized();
            int usuarioId = int.Parse(usuarioIdStr);

            var usuarioReal = await _context.Usuarios.FindAsync(usuarioId);
            string rolReal = usuarioReal?.Rol ?? "Trabajador";

            try
            {
                var query = _context.Incidencias.Include(i => i.Empresa).AsQueryable();

                if (empresaId.HasValue && empresaId.Value > 0)
                {
                    int idEmpresaLimpia = empresaId.Value;

                    bool esDueno = await _context.Empresas.AnyAsync(e => e.Id == idEmpresaLimpia && e.UsuarioId == usuarioId);
                    bool esEmpleado = await _context.UsuarioEmpresas.AnyAsync(ue => ue.EmpresaId == idEmpresaLimpia && ue.UsuarioId == usuarioId && (ue.EstadoSolicitud == "Contratado" || ue.EstadoSolicitud == "contratado"));

                    if (!esDueno && !esEmpleado && rolReal != "Admin" && rolReal != "Ayuntamiento")
                    {
                        return StatusCode(403, new { mensaje = "No tienes autorización para consultar esta contrata." });
                    }

                    query = query.Where(i => i.EmpresaId == idEmpresaLimpia);
                }
                else
                {
                    if (rolReal == "Empresa")
                    {
                        query = query.Where(i => i.Empresa != null && i.Empresa.UsuarioId == usuarioId);
                    }
                    else if (rolReal == "Trabajador")
                    {
                        var misEmpresasIds = await _context.UsuarioEmpresas
                            .Where(ue => ue.UsuarioId == usuarioId && (ue.EstadoSolicitud == "Contratado" || ue.EstadoSolicitud == "contratado"))
                            .Select(ue => ue.EmpresaId)
                            .ToListAsync();

                        query = query.Where(i => i.EmpresaId.HasValue && misEmpresasIds.Contains(i.EmpresaId.Value));
                    }
                }

                var incidencias = await query
                    .OrderByDescending(i => i.FechaCreacion)
                    .Select(i => new {
                        i.Id,
                        i.Titulo,
                        i.Descripcion,
                        i.Estado,
                        i.Gravedad,
                        i.UsuarioId,
                        i.LoteId,
                        i.EmpresaId,
                        i.FechaCreacion,
                        NombreEmpresa = i.Empresa != null ? i.Empresa.NombreEmpresa : "Sin Empresa",
                        DuenoEmpresaId = i.Empresa != null ? i.Empresa.UsuarioId : 0
                    })
                    .ToListAsync();

                return Ok(incidencias);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR EN GetIncidencias Query: {ex.Message}");
                return StatusCode(500, new { mensaje = "Error al procesar el listado de avisos." });
            }
        }

        // GET: api/Incidencias
        [HttpGet("{id}")]
        public async Task<ActionResult<Incidencia>> GetIncidencia(int id)
        {
            var incidencia = await _context.Incidencias.FindAsync(id);
            if (incidencia == null) return NotFound();
            return Ok(incidencia);
        }

        // POST: api/Incidencias
        [HttpPost]
        public async Task<ActionResult<Incidencia>> PostIncidencia(Incidencia incidencia)
        {
            incidencia.FechaCreacion = DateTime.UtcNow;
            incidencia.Autor = null;
            incidencia.LoteAfectado = null;
            incidencia.Empresa = null;

            _context.Incidencias.Add(incidencia);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetIncidencia", new { id = incidencia.Id }, incidencia);
        }

        // PUT: api/Incidencias
        [HttpPut("{id}")]
        public async Task<IActionResult> PutIncidencia(int id, Incidencia incidencia)
        {
            if (id != incidencia.Id) return BadRequest();

            var usuarioIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var rolClaim = User.FindFirst(ClaimTypes.Role)?.Value;
            if (string.IsNullOrEmpty(usuarioIdStr)) return Unauthorized();
            int usuarioLogueadoId = int.Parse(usuarioIdStr);

            var incidenciaOriginal = await _context.Incidencias
                .Include(i => i.Empresa)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (incidenciaOriginal == null) return NotFound("La incidencia especificada no existe.");

            bool esAdminOAyuntamiento = (rolClaim == "Admin" || rolClaim == "Ayuntamiento");
            
            bool esDuenoDeLaEmpresa = (incidenciaOriginal.Empresa != null && incidenciaOriginal.Empresa.UsuarioId == usuarioLogueadoId);

            if (!esAdminOAyuntamiento && !esDuenoDeLaEmpresa)
            {
                return StatusCode(403, new { mensaje = "Acceso denegado. Solo los administradores o los propietarios de la contrata pueden modificar el estado técnico de una incidencia." });
            }

            incidenciaOriginal.Estado = incidencia.Estado;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!IncidenciaExists(id)) return NotFound();
                else throw;
            }

            return NoContent();
        }

        // DELETE: api/Incidencias
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteIncidencia(int id)
        {
            var incidencia = await _context.Incidencias.FindAsync(id);
            if (incidencia == null) return NotFound();

            _context.Incidencias.Remove(incidencia);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool IncidenciaExists(int id)
        {
            return _context.Incidencias.Any(e => e.Id == id);
        }
    }
}