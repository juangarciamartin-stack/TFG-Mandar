using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VestaApi.Models;
using Backend.Data;
using Microsoft.AspNetCore.Authorization;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AyuntamientosController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public AyuntamientosController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Ayuntamiento>>> GetAyuntamientos()
        {
            var ayuntamientos = await _context.Ayuntamientos.ToListAsync();
            return Ok(ayuntamientos);
        }

        [HttpPost]
        public async Task<ActionResult<Ayuntamiento>> PostAyuntamiento(Ayuntamiento ayuntamiento)
        {
            _context.Ayuntamientos.Add(ayuntamiento);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAyuntamientos), new { id = ayuntamiento.Id }, ayuntamiento);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutAyuntamiento(int id, Ayuntamiento ayuntamiento)
        {
            if (id != ayuntamiento.Id)
            {
                return BadRequest("El ID no coincide");
            }

            _context.Entry(ayuntamiento).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Ayuntamientos.Any(e => e.Id == id))
                {
                    return NotFound("El ayuntamiento no existe.");
                }
                else
                {
                    throw;
                }
            }

            return NoContent(); 
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAyuntamiento(int id)
        {

            var ayuntamiento = await _context.Ayuntamientos.FindAsync(id);
            if (ayuntamiento == null)
            {
                return NotFound("Ayuntamiento no encontrado");
            }

            _context.Ayuntamientos.Remove(ayuntamiento);
            await _context.SaveChangesAsync();

            return NoContent(); 
        }
    }
}