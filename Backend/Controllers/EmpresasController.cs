using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VestaApi.Models;
using Backend.Data;
using Microsoft.AspNetCore.Authorization;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System;
using System.IO; 
using Microsoft.AspNetCore.Http; 
using VestaApi.DTOs;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] 
    public class EmpresasController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public EmpresasController(ApplicationDbContext context)
        {
            _context = context;
        }

       // GET: api/Empresas
        [HttpGet]
        public async Task<IActionResult> GetEmpresas()
        {
            try
            {
                var empresasCatálogo = await _context.Empresas
                    .Where(e => e.EstadoAprobacion == "Aprobado" || e.EstadoAprobacion == "Baja" || string.IsNullOrEmpty(e.EstadoAprobacion))
                    .Select(e => new {
                        e.Id,
                        e.NombreEmpresa,
                        e.Cif,
                        e.Direccion,
                        e.EmailContacto,
                        e.UsuarioId,
                        EstadoAprobacion = e.EstadoAprobacion ?? "Aprobado" 
                    })
                    .ToListAsync();

                return Ok(empresasCatálogo);
            }
            catch (Exception ex) {
                Console.WriteLine($"ERROR EN GET EMPRESAS: {ex.Message}");
                return Ok(new List<object>());
            }
        }

        // POST: api/Empresas/postularse
        [HttpPost("postularse")]
        public async Task<IActionResult> PostularseAEmpresa([FromForm] int usuarioId, [FromForm] int empresaId, [FromForm] string notas, [FromForm] IFormFile curriculumFile)
        {
            if (usuarioId <= 0 || empresaId <= 0) return BadRequest("Identificadores de usuario o empresa inválidos.");
            if (curriculumFile == null || curriculumFile.Length == 0) return BadRequest("Es obligatorio adjuntar un archivo de currículum en formato PDF.");

            var existeRelacionActiva = await _context.UsuarioEmpresas
                .AnyAsync(ue => ue.UsuarioId == usuarioId && 
                                ue.EmpresaId == empresaId && 
                                (ue.EstadoSolicitud == "Pendiente" || ue.EstadoSolicitud == "Contratado" || ue.EstadoSolicitud == "Aprobado"));

            if (existeRelacionActiva) {
                return BadRequest(new { mensaje = "Ya tienes una postulación en trámite o posees una vinculación laboral activa con esta empresa." });
            }

            try 
            {
                var carpetaDestino = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "cv");
                if (!Directory.Exists(carpetaDestino))
                {
                    Directory.CreateDirectory(carpetaDestino);
                }

                var nombreArchivoUnico = $"{usuarioId}_{empresaId}_{Guid.NewGuid().ToString().Substring(0, 8)}_{curriculumFile.FileName}";
                var rutaCompletaFisica = Path.Combine(carpetaDestino, nombreArchivoUnico);

                using (var stream = new FileStream(rutaCompletaFisica, FileMode.Create))
                {
                    await curriculumFile.CopyToAsync(stream);
                }

                var urlRelativaBD = $"/uploads/cv/{nombreArchivoUnico}";
                var notasProcesadas = string.IsNullOrWhiteSpace(notas) ? "" : notas.Trim();

                var nuevaRelacion = new UsuarioEmpresa {
                    UsuarioId = usuarioId,
                    EmpresaId = empresaId,
                    EstadoSolicitud = "Pendiente",
                    Notas = notasProcesadas,
                    CurriculumURl = urlRelativaBD
                };

                _context.UsuarioEmpresas.Add(nuevaRelacion);
                await _context.SaveChangesAsync();

                return Ok(new { mensaje = "Tu currículum físico ha sido guardado y registrado con éxito en la bolsa." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR AL GUARDAR CV EN DISCO: {ex.Message}");
                return StatusCode(500, new { mensaje = $"Error interno al procesar el archivo binario: {ex.Message}" });
            }
        }

        // GET: api/Empresas/mis-candidatos/{idEmpresa}
        [HttpGet("mis-candidatos/{idEmpresa}")]
        public async Task<IActionResult> GetCandidatosEmpresa(int idEmpresa)
        {
            try
            {
                var empresa = await _context.Empresas
                    .Include(e => e.Relaciones)
                    .ThenInclude(r => r.Usuario) 
                    .FirstOrDefaultAsync(e => e.Id == idEmpresa);

                if (empresa == null) return NotFound("Empresa no encontrada.");

                var candidatos = empresa.ObtenerCandidatos()
                    .Select(c => new {
                        Id = c.UsuarioId,
                        Nombre = c.Usuario != null ? c.Usuario.Nombre : "Candidato Anónimo",
                        Email = c.Usuario != null ? c.Usuario.Email : "---",
                        Notas = c.Notas,
                        CurriculumUrl = c.CurriculumURl 
                    }).ToList();

                return Ok(candidatos);
            }
            catch (Exception ex)
            {
                Console.WriteLine($" ERROR AL OBTENER CANDIDATOS DESDE MODELO: {ex.Message}");
                return StatusCode(500, new { mensaje = "Error interno al recuperar la bolsa de empleo." });
            }
        }

       [HttpGet("mi-plantilla/{idEmpresa}")]
        public async Task<IActionResult> GetPlantillaEmpresa(int idEmpresa)
        {
            try
            {
                var plantilla = await _context.UsuarioEmpresas
                    .Where(ue => ue.EmpresaId == idEmpresa && ue.EstadoSolicitud == "Contratado")
                    .Include(ue => ue.Usuario)
                    .Select(ue => new {
                        idVinculacion = ue.Id, 
                        id = ue.UsuarioId,
                        Nombre = ue.Usuario != null ? ue.Usuario.Nombre : "Operario",
                        Email = ue.Usuario != null ? ue.Usuario.Email : "---",
                        RelacionLaboral = string.IsNullOrEmpty(ue.TipoRelacion) ? "Operario de Lote" : ue.TipoRelacion
                    })
                    .ToListAsync();

                return Ok(plantilla);
            }
            catch (Exception ex)
            {
                Console.WriteLine($" ERROR EN GET PLANTILLA: {ex.Message}");
                return Ok(new List<object>());
            }
        }

        // PUT: api/Empresas/{idEmpresa}/aceptar-trabajador
        [HttpPut("{idEmpresa}/aceptar-trabajador")]
        public async Task<IActionResult> AceptarTrabajador(int idEmpresa, [FromBody] PostulacionDto model)
        {
            if (model == null || model.UsuarioId <= 0) return BadRequest("Datos de contratación insuficientes.");

            var relacion = await _context.UsuarioEmpresas
                .FirstOrDefaultAsync(ue => ue.EmpresaId == idEmpresa && ue.UsuarioId == model.UsuarioId);

            if (relacion == null) return NotFound("No se encontró la postulación de este operario.");

            relacion.EstadoSolicitud = "Contratado"; 
            relacion.TipoRelacion = "Operario de Lote";
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Trabajador contratado y añadido a la plantilla con éxito." });
        }

        // POST: api/Empresas/subir-nomina
        [HttpPost("subir-nomina")]
        public async Task<IActionResult> SubirNomina([FromForm] int usuarioId, [FromForm] string periodo, [FromForm] IFormFile archivoNomina)
        {
            if (usuarioId <= 0 || archivoNomina == null || archivoNomina.Length == 0)
            {
                return BadRequest("Datos de nómina o archivo binario inválidos.");
            }

            try
            {
                var carpetaDestino = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "nominas");
                if (!Directory.Exists(carpetaDestino))
                {
                    Directory.CreateDirectory(carpetaDestino);
                }

                var periodoLimpio = periodo.Replace(" / ", "_");
                var nombreArchivoUnico = $"nomina_{usuarioId}_{periodoLimpio}.pdf"; 
                var rutaCompletaFisica = Path.Combine(carpetaDestino, nombreArchivoUnico);

                using (var stream = new FileStream(rutaCompletaFisica, FileMode.Create))
                {
                    await archivoNomina.CopyToAsync(stream);
                }

                var urlRelativaBD = $"/uploads/nominas/{nombreArchivoUnico}";
                return Ok(new { mensaje = "Nómina guardada y asociada al operario con éxito.", url = urlRelativaBD });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = $"Error al escribir el archivo: {ex.Message}" });
            }
        }

        // GET: api/Empresas/mis-nominas/{usuarioId}
        [HttpGet("mis-nominas/{usuarioId}")]
        public async Task<IActionResult> GetNominasUsuario(int usuarioId)
        {
            try
            {
                var nominasRaw = await _context.Nominas
                    .Where(n => n.UsuarioId == usuarioId)
                    .ToListAsync();

                var empresasDict = await _context.Empresas.ToDictionaryAsync(e => e.Id, e => e.NombreEmpresa);

                var listaNominas = nominasRaw.Select((n, index) => {
                    empresasDict.TryGetValue(n.EmpresaId, out string nombreEmpresaReal);

                    return new {
                        id = n.Id,
                        usuarioId = n.UsuarioId,
                        nombreEmpleado = "Mi Nómina",
                        mes = n.Mes,
                        anio = n.Anio.ToString(),
                        estado = "Disponible",
                        empresaSource = nombreEmpresaReal ?? "Ayuntamiento / Vesta", 
                        pdfName = Path.GetFileName(n.RutaArchivoPDF),
                        url = n.RutaArchivoPDF
                    };
                }).ToList();

                return Ok(listaNominas);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = $"Error al recuperar nóminas del usuario: {ex.Message}" });
            }
        }

        // GET: api/Empresas/obtener-todas-nominas
        [HttpGet("obtener-todas-nominas")]
        public async Task<IActionResult> ObtenerTodasLasNominas()
        {
            try
            {
                var nominasRaw = await _context.Nominas.ToListAsync();

                var usuariosDict = await _context.Usuarios.ToDictionaryAsync(u => u.Id, u => u.Nombre);
                var empresasDict = await _context.Empresas.ToDictionaryAsync(e => e.Id, e => e.NombreEmpresa);

                var lista = nominasRaw.Select(n => {
                    usuariosDict.TryGetValue(n.UsuarioId, out string nombreEmpleado);
                    empresasDict.TryGetValue(n.EmpresaId, out string nombreEmpresaReal);

                    return new {
                        id = n.Id,
                        usuarioId = n.UsuarioId,
                        nombreEmpleado = nombreEmpleado ?? $"Operario N° {n.UsuarioId}",
                        mes = n.Mes,
                        anio = n.Anio.ToString(),
                        estado = "Disponible",
                        empresaSource = nombreEmpresaReal ?? "Ayuntamiento / Vesta",
                        pdfName = Path.GetFileName(n.RutaArchivoPDF),
                        url = n.RutaArchivoPDF
                    };
                }).ToList();

                return Ok(lista);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = $"Error al recuperar todas las nóminas: {ex.Message}" });
            }
        }

        // GET: api/Empresas/nominas-por-empresa/{empresaId}
        [HttpGet("nominas-por-empresa/{empresaId}")]
        public async Task<IActionResult> GetNominasPorEmpresa(int empresaId)
        {
            try
            {
                var nominasRaw = await _context.Nominas
                    .Where(n => n.EmpresaId == empresaId)
                    .ToListAsync();

                var usuariosDict = await _context.Usuarios.ToDictionaryAsync(u => u.Id, u => u.Nombre);

                var lista = nominasRaw.Select(n => {
                    usuariosDict.TryGetValue(n.UsuarioId, out string nombreEmpleado);

                    return new {
                        id = n.Id,
                        usuarioId = n.UsuarioId,
                        nombreEmpleado = nombreEmpleado ?? $"Operario N° {n.UsuarioId}",
                        mes = n.Mes,
                        anio = n.Anio.ToString(),
                        estado = "Disponible",
                        pdfName = Path.GetFileName(n.RutaArchivoPDF),
                        url = n.RutaArchivoPDF
                    };
                }).ToList();

                return Ok(lista);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = $"Error al recuperar nóminas de la empresa: {ex.Message}" });
            }
        }

        //PUT
        [HttpPut("{id}")]
        public async Task<IActionResult> PutEmpresa(int id, Empresa empresa)
        {
            if (id != empresa.Id) return BadRequest();

            var empresaExistente = await _context.Empresas.AsNoTracking().FirstOrDefaultAsync(e => e.Id == id);
            if (empresaExistente == null) return NotFound();
            int idUsuarioGestor = empresaExistente.UsuarioId;

            _context.Entry(empresa).State = EntityState.Modified;

            try
            {
                if (empresa.EstadoAprobacion == "Baja")
                {
                    var relacionesAfectadas = _context.UsuarioEmpresas.Where(ue => ue.EmpresaId == id);
                    _context.UsuarioEmpresas.RemoveRange(relacionesAfectadas);

                    bool tieneMasEmpresas = await _context.Empresas
                        .AnyAsync(e => e.UsuarioId == idUsuarioGestor && e.EstadoAprobacion == "Aprobado" && e.Id != id);

                    if (!tieneMasEmpresas)
                    {
                        var usuario = await _context.Usuarios.FindAsync(idUsuarioGestor);
                        if (usuario != null)
                        {
                            usuario.Rol = "Trabajador";
                            _context.Entry(usuario).State = EntityState.Modified;
                            Console.WriteLine($"[Vesta] El dueño cerró su última empresa. Rol de Usuario ID {usuario.Id} cambiado a 'Trabajador'.");
                        }
                    }
                }

                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!EmpresaExists(id)) return NotFound();
                else throw;
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEmpresa(int id)
        {
            try
            {
                var empresa = await _context.Empresas.FindAsync(id);
                if (empresa == null) return NotFound();

                int idUsuarioGestor = empresa.UsuarioId;

                empresa.EstadoAprobacion = "Baja"; 
                _context.Entry(empresa).State = EntityState.Modified;


                var relacionesAfectadas = _context.UsuarioEmpresas.Where(ue => ue.EmpresaId == id);
                _context.UsuarioEmpresas.RemoveRange(relacionesAfectadas);


                bool tieneMasEmpresas = await _context.Empresas
                    .AnyAsync(e => e.UsuarioId == idUsuarioGestor && e.EstadoAprobacion == "Aprobado" && e.Id != id);

                if (!tieneMasEmpresas)
                {
                    var usuario = await _context.Usuarios.FindAsync(idUsuarioGestor);
                    if (usuario != null)
                    {
                        usuario.Rol = "Trabajador";
                        _context.Entry(usuario).State = EntityState.Modified;
                        Console.WriteLine($"[Vesta] Ayuntamiento eliminó última empresa activa. Rol de Usuario ID {idUsuarioGestor} cambiado a 'Trabajador'.");
                    }
                }

                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = $"Error al procesar la baja de la empresa: {ex.Message}" });
            }
        }

 
        [HttpPut("{id}/cambiar-estado")]
        public async Task<IActionResult> CambiarEstado(int id, [FromBody] CambiarEstadoDto model)
        {
            try
            {
                var empresa = await _context.Empresas.FindAsync(id);
                if (empresa == null) return NotFound("Empresa no encontrada.");

                int idUsuarioGestor = empresa.UsuarioId;

                if (model.Estado == "Aprobado")
                {
                    bool yaEstaTrabajando = await _context.UsuarioEmpresas
                        .AnyAsync(ue => ue.UsuarioId == idUsuarioGestor && ue.EstadoSolicitud == "Contratado");

                    if (yaEstaTrabajando)
                    {
                        return BadRequest(new { 
                            mensaje = "OPERACIÓN DENEGADA: El dueño figura actualmente como empleado activo en otra adjudicataria. Debe tramitar su dimisión antes." 
                        });
                    }
                }

                empresa.EstadoAprobacion = model.Estado;
                _context.Entry(empresa).State = EntityState.Modified;
                
                var usuario = await _context.Usuarios.FindAsync(idUsuarioGestor);
                if (usuario != null)
                {
                    if (model.Estado == "Aprobado")
                    {
                        usuario.Rol = "Empresa";
                        _context.Entry(usuario).State = EntityState.Modified;
                    }
                    else if (model.Estado == "Baja")
                    {
                        bool tieneMasEmpresas = await _context.Empresas
                            .AnyAsync(e => e.UsuarioId == idUsuarioGestor && e.EstadoAprobacion == "Aprobado" && e.Id != id);

                        if (!tieneMasEmpresas)
                        {
                            usuario.Rol = "Trabajador";
                            _context.Entry(usuario).State = EntityState.Modified;
                        }
                    }
                }

                await _context.SaveChangesAsync();
                return Ok(new { mensaje = "Estado actualizado y rol de usuario sincronizado con éxito." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = $"Error al cambiar estado: {ex.Message}" });
            }
        }

        // DELETE: api/Empresas/{idEmpresa}/despedir-trabajador/{usuarioId}
        [HttpDelete("{idEmpresa}/despedir-trabajador/{usuarioId}")]
        public async Task<IActionResult> DespedirTrabajador(int idEmpresa, int usuarioId)
        {
            try
            {
                var contratoActivo = await _context.UsuarioEmpresas
                    .FirstOrDefaultAsync(ue => ue.EmpresaId == idEmpresa && ue.UsuarioId == usuarioId && ue.EstadoSolicitud == "Contratado");

                if (contratoActivo == null)
                {
                    return NotFound(new { mensaje = "No se ha encontrado ninguna relación laboral activa para este operario en tu empresa." });
                }

                contratoActivo.EstadoSolicitud = "Despedido";
                await _context.SaveChangesAsync();

                return Ok(new { mensaje = "Contrato rescindido con éxito. El operario ha sido retirado de la plantilla activa." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = $"Error interno al tramitar la rescisión contractual: {ex.Message}" });
            }
        }

        // GET: api/Empresas/inactivas
        [HttpGet("inactivas")]
        public async Task<IActionResult> GetEmpresasInactivas()
        {
            try
            {
                var inactivas = await _context.Empresas
                    .Where(e => e.EstadoAprobacion == "Baja") 
                    .Select(e => new {
                        e.Id,
                        e.NombreEmpresa,
                        e.Cif,
                        e.Direccion,
                        e.EmailContacto,
                        e.UsuarioId 
                    }).ToListAsync();

                return Ok(inactivas);
            }
            catch (Exception ex) {
                Console.WriteLine($"ERROR EN GET INACTIVAS: {ex.Message}");
                return Ok(new List<object>());
            }
        }

       [HttpPost("solicitar")]
        [AllowAnonymous] 
        public async Task<IActionResult> SolicitarCreacionEmpresa([FromBody] SolicitarEmpresaDto model)
        {
            if (model == null) return BadRequest("Datos inválidos.");

            var existeCif = _context.Empresas.Any(e => e.Cif == model.Cif);
            if (existeCif) return BadRequest(new { mensaje = "Ya existe una empresa registrada con ese CIF." });

            // 1. Creamos la empresa pendiente
            var nuevaEmpresa = new Empresa {
                NombreEmpresa = model.NombreEmpresa,
                Cif = model.Cif,
                Direccion = model.Direccion,
                EmailContacto = model.EmailContacto,
                UsuarioId = model.UsuarioId,
                EstadoAprobacion = "Pendiente" 
            };
            _context.Empresas.Add(nuevaEmpresa);

            var usuario = await _context.Usuarios.FindAsync(model.UsuarioId);
            if (usuario != null)
            {
                usuario.Rol = "Empresa"; 
                _context.Entry(usuario).State = EntityState.Modified;
            }

            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Solicitud enviada con éxito. Tu rol ha sido actualizado a Empresa." });
        }

        // GET: api/Empresas/pendientes
        [HttpGet("pendientes")]
        public async Task<IActionResult> GetEmpresasPendientes()
        {
            try
            {
                var pendientes = await _context.Empresas
                    .Where(e => e.EstadoAprobacion == "Pendiente") 
                    .ToListAsync();

                return Ok(pendientes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno: {ex.Message}");
            }
        }

        // GET: api/Empresas/mis-empresas-gestor/{usuarioId}
        [HttpGet("mis-empresas-gestor/{usuarioId}")]
        public async Task<IActionResult> GetEmpresasDelGestor(int usuarioId)
        {
            try
            {
                var empresas = await _context.Empresas
                    .Where(e => e.UsuarioId == usuarioId && (e.EstadoAprobacion == "Aprobado" || e.EstadoAprobacion == "Baja"))
                    .Select(e => new {
                        e.Id,
                        e.NombreEmpresa,
                        e.Cif,
                        e.EstadoAprobacion 
                    })
                    .ToListAsync();

                return Ok(empresas);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR EN GET MIS EMPRESAS GESTOR: {ex.Message}");
                return StatusCode(500, new { mensaje = "Error al recuperar tus empresas asociadas." });
            }
        }
     

        private bool EmpresaExists(int id)
        {
            return _context.Empresas.Any(e => e.Id == id);
        }
    }
}