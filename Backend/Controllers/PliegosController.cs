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

namespace VestaApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Ayuntamiento,Admin" )] 
    public class PliegosController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;
        public PliegosController(ApplicationDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Pliego>>> GetPliegos()
        {
            return await _context.Pliegos.ToListAsync();
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<Pliego>> GetPliego(int id)
        {
            var pliego = await _context.Pliegos.FindAsync(id);
            if (pliego == null) return NotFound();
            return Ok(pliego);
        }

        // POST NORMAL (Para crear pliegos sin archivo fisico)
        [HttpPost]
        public async Task<ActionResult<Pliego>> PostPliego(Pliego pliego)
        {
            _context.Pliegos.Add(pliego);
            await _context.SaveChangesAsync();
            return CreatedAtAction("GetPliego", new { id = pliego.Id }, pliego);
        }

        // POST ARCHIVOS 
        //  Recibe el PDF fisico y lo guarda en la carpeta wwwroot
        [HttpPost("subir")]
        public async Task<IActionResult> SubirPliego([FromForm] int idLote, IFormFile archivo)
        {
            if (archivo == null || archivo.Length == 0) return BadRequest("No se ha enviado ningún archivo.");

            // Determinar la carpeta wwwroot real del proyecto
            var rootPath = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
            
            // Crear la ruta interna combinando limpiamente 
            var uploadsFolder = Path.Combine(rootPath, "uploads", "pliegos");
            if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

            //Generar un nombre único para evitar sobrescribir archivos
            var uniqueFileName = Guid.NewGuid().ToString() + "_" + archivo.FileName;
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            // Guardar físicamente el PDF en el disco
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await archivo.CopyToAsync(stream);
            }

            // Guardar la URL pública 
            var pliego = new Pliego
            {
                NombreArchivo = archivo.FileName,
                RutaURL = $"/uploads/pliegos/{uniqueFileName}", 
                IdLote = idLote,
                FechaSubida = DateTime.UtcNow 
            };

            _context.Pliegos.Add(pliego);
            await _context.SaveChangesAsync();

            return Ok(pliego);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutPliego(int id, Pliego pliego)
        {
            if (id != pliego.Id) return BadRequest();
            _context.Entry(pliego).State = EntityState.Modified;

            try { await _context.SaveChangesAsync(); }
            catch (DbUpdateConcurrencyException)
            {
                if (!PliegoExists(id)) return NotFound();
                else throw;
            }
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePliego(int id)
        {
            var pliego = await _context.Pliegos.FindAsync(id);
            if (pliego == null) return NotFound();

            _context.Pliegos.Remove(pliego);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private bool PliegoExists(int id) => _context.Pliegos.Any(e => e.Id == id);
    }
}