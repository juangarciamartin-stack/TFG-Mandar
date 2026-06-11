using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using VestaApi.Models;
using Backend.Data;
using Microsoft.AspNetCore.Authorization;

namespace VestaApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Ayuntamiento, Admin , Empresa")]
    public class CentrosController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CentrosController(ApplicationDbContext context)
        {
            _context = context;
        }

    [HttpGet]
    public async Task<IActionResult> GetCentros()
    {
        var centros = await _context.Centros
            .Include(c => c.Lotes) 
            .Select(c => new {
                c.Id,
                c.Nombre,
                c.Direccion,
                c.Localidad,
                c.IdAyuntamiento,
                Lotes = c.Lotes.Select(l => new {
                    l.Id,
                    l.Nombre,
                    l.Descripcion
                }).ToList()
            })
            .ToListAsync();

        return Ok(centros);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetCentro(int id)
    {
        var centro = await _context.Centros
            .Include(c => c.Lotes)
            .Select(c => new {
                c.Id,
                c.Nombre,
                c.Direccion,
                c.Localidad,
                c.IdAyuntamiento,
                Lotes = c.Lotes.Select(l => new {
                    l.Id,
                    l.Nombre,
                    l.Descripcion
                }).ToList()
            })
            .FirstOrDefaultAsync(c => c.Id == id);

        if (centro == null) return NotFound();

        return Ok(centro);
    }

        [HttpPost]
        public async Task<ActionResult<Centro>> PostCentro(Centro centro)
        {
            _context.Centros.Add(centro);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetCentro", new { id = centro.Id }, centro);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutCentro(int id, Centro centro)
        {
            if (id != centro.Id)
            {
                return BadRequest();
            }

            _context.Entry(centro).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CentroExists(id))
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

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCentro(int id)
        {
            var centro = await _context.Centros.FindAsync(id);
            if (centro == null)
            {
                return NotFound();
            }

            _context.Centros.Remove(centro);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        

        private bool CentroExists(int id)
        {
            return _context.Centros.Any(e => e.Id == id);
        }
    }
}