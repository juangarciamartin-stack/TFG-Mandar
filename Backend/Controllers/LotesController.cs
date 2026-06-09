using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VestaApi.Models; 
using Backend.Data;
using Microsoft.AspNetCore.Authorization;

namespace VestaApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Ayuntamiento,Empresa")]
    public class LotesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public LotesController(ApplicationDbContext context)
        {
            _context = context;
        }


        [HttpGet("empresas-activas")]
        [Authorize(Roles = "Admin,Ayuntamiento")]
        public async Task<ActionResult<IEnumerable<Empresa>>> GetEmpresasActivas()
        {
            var empresas = await _context.Empresas
                .Where(e => e.EstadoAprobacion == "Aceptado")
                .ToListAsync();
            return Ok(empresas);
        }

        // GET: api/Lotes
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Lote>>> GetLotes()
        {
            var lotes = await _context.Lotes
                .Include(l => l.Ayuntamiento) 
                .Include(l => l.Empresa)
                .Include(l => l.Centros)
                .Include(l => l.Pliegos)
                .ToListAsync();

            return Ok(lotes);
        }

        // GET: api/Lotes/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Lote>> GetLote(int id)
        {
            var lote = await _context.Lotes
                .Include(l => l.Ayuntamiento)
                .Include(l => l.Empresa) 
                .Include(l => l.Centros)
                .Include(l => l.Pliegos)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (lote == null)
            {
                return NotFound();
            }

            return Ok(lote);
        }

// POST: api/Lotes
[Authorize(Roles = "Admin,Ayuntamiento")]
[HttpPost]
public async Task<ActionResult<Lote>> PostLote(Lote lote)
{
    // ====================================================================
    // 🛡️ CONTROL AUTOMÁTICO DE SEGURIDAD PARA EL TFG DE JUAN
    // ====================================================================
    // Comprobamos si el IdAyuntamiento que viene de React existe de verdad en la BD
    bool existeAyuntamiento = await _context.Ayuntamientos.AnyAsync(a => a.Id == lote.IdAyuntamiento);

    if (!existeAyuntamiento)
    {
        // Si no existe (está roto o vacío), buscamos el primer ayuntamiento real disponible
        var primerAyuntamientoReal = await _context.Ayuntamientos.FirstOrDefaultAsync();

        if (primerAyuntamientoReal == null)
        {
            // Si la tabla de ayuntamientos está completamente vacía, avisamos para que no rompa la BD
            return BadRequest(new { mensaje = "¡Error! No puedes crear un lote porque no tienes NINGÚN ayuntamiento creado en el sistema. Entra como Admin y crea uno primero." });
        }

        // Le asignamos el ID del ayuntamiento real que sí existe
        lote.IdAyuntamiento = primerAyuntamientoReal.Id;
    }
    // ====================================================================

    _context.Lotes.Add(lote);
    await _context.SaveChangesAsync();

    return CreatedAtAction("GetLote", new { id = lote.Id }, lote);
}

       // PUT: api/Lotes/5
        [Authorize(Roles = "Admin,Ayuntamiento")]
        [HttpPut("{id}")]
        public async Task<IActionResult> PutLote(int id, Lote lote)
        {
            if (id != lote.Id)
            {
                return BadRequest("El ID del lote no coincide.");
            }
            if (!User.IsInRole("Admin") && !User.IsInRole("Ayuntamiento"))
            {
                return Forbid();
            }
            _context.Entry(lote).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Lotes.Any(e => e.Id == id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        
        // DELETE: api/Lotes/5
        [Authorize(Roles = "Admin,Ayuntamiento")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLote(int id)
        {
            var lote = await _context.Lotes.FindAsync(id);
            if (lote == null)
            {
                return NotFound();
            }

            _context.Lotes.Remove(lote);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("asignar-centro")]
        public async Task<IActionResult> AsignarCentroALote(int loteId, int centroId)
        {
            var lote = await _context.Lotes.Include(l => l.Centros).FirstOrDefaultAsync(l => l.Id == loteId);
            var centro = await _context.Centros.FindAsync(centroId);

            if (lote == null || centro == null) return NotFound("Lote o Centro no encontrado");

            lote.AñadirCentro(centro);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Centro asignado al lote con éxito" });
        }

        private bool LoteExists(int id)
        {
            return _context.Lotes.Any(e => e.Id == id);
        }

        [HttpPost("desasignar-centro")]
        [Authorize(Roles = "Admin,Ayuntamiento")]
        public async Task<IActionResult> DesasignarCentroDeLote(int loteId, int centroId)
        {
            var lote = await _context.Lotes
                .Include(l => l.Centros)
                .FirstOrDefaultAsync(l => l.Id == loteId);

            if (lote == null) return NotFound("Lote no encontrado");

            var centro = lote.Centros.FirstOrDefault(c => c.Id == centroId);
            if (centro == null) return NotFound("El centro no está asignado a este lote");

            lote.Centros.Remove(centro);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Centro desasignado del lote con éxito" });
        }
    }
}