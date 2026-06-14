using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VestaApi.Models;
using Backend.Data;
using VestaApi.DTOs;
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
        public async Task<ActionResult<Ayuntamiento>> PostAyuntamiento(RegistroAyuntamientoDto dto)
        {
            if (string.IsNullOrEmpty(dto.Email) || string.IsNullOrEmpty(dto.Password))
            {
                return BadRequest("El email y la contraseña son obligatorios.");
            }

            var existeUsuario = await _context.Usuarios.AnyAsync(u => u.Email == dto.Email);
            if (existeUsuario)
            {
                return BadRequest("El correo electrónico ya está registrado en el sistema.");
            }

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var nuevoAyuntamiento = new Ayuntamiento
                {
                    NombreMunicipio = dto.Nombre,
                    Cif = dto.Cif,
                    Direccion = dto.Direccion
                };

                _context.Ayuntamientos.Add(nuevoAyuntamiento);
                await _context.SaveChangesAsync(); 

                var nuevoUsuario = new Usuario
                {
                    Nombre = !string.IsNullOrEmpty(dto.NombreResponsable) ? dto.NombreResponsable.Trim() : "Responsable", 
                    Email = dto.Email.Trim(),
                    Password = BCrypt.Net.BCrypt.HashPassword(dto.Password), 
                    Rol = "Ayuntamiento", 
                    Activo = true,
                    Dni = !string.IsNullOrEmpty(dto.DniResponsable) ? dto.DniResponsable.Trim().ToUpper() : "00000000X", 
                    Telefono = !string.IsNullOrEmpty(dto.TelefonoResponsable) ? dto.TelefonoResponsable.Trim() : "000000000", 
                    IdAyuntamiento = nuevoAyuntamiento.Id 
                };

                _context.Usuarios.Add(nuevoUsuario);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return CreatedAtAction(nameof(GetAyuntamientos), new { id = nuevoAyuntamiento.Id }, nuevoAyuntamiento);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, $"Error interno al crear el ayuntamiento y su gestor: {ex.InnerException?.Message ?? ex.Message}");
            }
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
                return NotFound("El ayuntamiento no existe.");
            }

            var usuariosVinculados = await _context.Usuarios
                .Where(u => u.IdAyuntamiento == id)
                .ToListAsync();

            if (usuariosVinculados.Any())
            {
                _context.Usuarios.RemoveRange(usuariosVinculados);
            }

            _context.Ayuntamientos.Remove(ayuntamiento);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}