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
using Microsoft.AspNetCore.Hosting;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class EmpresasController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;

    public EmpresasController(ApplicationDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env; 
        }

    // GET
    [HttpGet]
    public async Task<IActionResult> GetEmpresas([FromQuery] int? ayuntamientoId = null)
    {
        try
        {
            var query = _context.Empresas.AsQueryable();

            if (ayuntamientoId.HasValue && ayuntamientoId.Value > 0)
            {
                var idsEmpresasAdjudicadas = await _context.Lotes
                    .Where(l => l.IdAyuntamiento == ayuntamientoId.Value && l.IdEmpresa.HasValue)
                    .Select(l => l.IdEmpresa.Value)
                    .Distinct()
                    .ToListAsync();

                query = query.Where(e => idsEmpresasAdjudicadas.Contains(e.Id) || e.AyuntamientoId == ayuntamientoId.Value);
            }

            var empresasCatalogo = await query
                .Where(e => e.EstadoAprobacion == "Aprobado" || e.EstadoAprobacion == "Baja" || string.IsNullOrEmpty(e.EstadoAprobacion))
                .Select(e => new {
                    e.Id,
                    e.NombreEmpresa,
                    e.Cif,
                    e.Direccion,
                    e.EmailContacto,
                    e.UsuarioId,
                    e.AyuntamientoId, 
                    EstadoAprobacion = e.EstadoAprobacion ?? "Aprobado",
                    LotesAsignados = _context.Lotes
                        .Where(l => l.IdEmpresa == e.Id)
                        .Select(l => l.Nombre)
                        .ToList()
                })
                .ToListAsync();

            return Ok(empresasCatalogo);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"ERROR EN GET EMPRESAS: {ex.Message}");
            return Ok(new List<object>());
        }
    }

        // GET: api/Empresas/lista-desplegable
        [HttpGet("lista-desplegable")]
        public async Task<IActionResult> GetEmpresasDesplegable([FromQuery] int? ayuntamientoId = null)
        {
            try
            {
                var query = _context.Empresas.Where(e => e.EstadoAprobacion == "Aprobado");

                if (ayuntamientoId.HasValue && ayuntamientoId.Value > 0)
                {
                    var idsEmpresasAdjudicadas = await _context.Lotes
                        .Where(l => l.IdAyuntamiento == ayuntamientoId.Value && l.IdEmpresa.HasValue)
                        .Select(l => l.IdEmpresa.Value)
                        .Distinct()
                        .ToListAsync();

                    query = query.Where(e => idsEmpresasAdjudicadas.Contains(e.Id) || e.AyuntamientoId == ayuntamientoId.Value);
                }

                var empresas = await query
                    .Select(e => new {
                        id = e.Id,
                        nombreEmpresa = e.NombreEmpresa
                    })
                    .ToListAsync();

                return Ok(empresas);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR EN DESPLEGABLE: {ex.Message}");
                return StatusCode(500, "Error en el servidor");
            }
        }

        // GET: api/Empresas/pendientes
        [HttpGet("pendientes")]
        public async Task<IActionResult> GetPendientes([FromQuery] int? ayuntamientoId = null)
        {
            var query = _context.Empresas.Where(e => e.EstadoAprobacion == "Pendiente");

            if (ayuntamientoId.HasValue && ayuntamientoId.Value > 0)
            {
                query = query.Where(e => e.AyuntamientoId == ayuntamientoId.Value);
            }

            var resultado = await query.ToListAsync();
            return Ok(resultado);
        }

        // PUT: api/Empresas/{id}/cambiar-estado
        [HttpPut("{id}/cambiar-estado")]
        public async Task<IActionResult> CambiarEstado(int id, [FromBody] CambiarEstadoDto dto)
        {
            try
            {
                var empresa = await _context.Empresas.FirstOrDefaultAsync(e => e.Id == id);
                if (empresa == null) return NotFound("Empresa no encontrada.");           
                if (dto != null && string.Equals(dto.Estado, "Aprobado", StringComparison.OrdinalIgnoreCase))
                {
                    int idUsuarioGestorPrueba = empresa.UsuarioId;
                    bool yaTieneTrabajoActivo = await _context.UsuarioEmpresas
                        .AnyAsync(ue => ue.UsuarioId == idUsuarioGestorPrueba && ue.EstadoSolicitud == "Contratado");

                    if (yaTieneTrabajoActivo)
                    {
                        return Conflict(new { mensaje = "No se puede validar la empresa: El usuario solicitante figura actualmente como trabajador contratado en activo en otra empresa. Debe tramitar su baja voluntaria primero." });
                    }
                }

                if (dto != null && dto.RolUsuario == "Ayuntamiento")
                {
                    if (dto.AyuntamientoId.HasValue && dto.AyuntamientoId.Value > 0)
                    {
                        if (empresa.AyuntamientoId != dto.AyuntamientoId.Value)
                        {                         
                            empresa.AyuntamientoId = dto.AyuntamientoId.Value; 
                        }
                    }
                }

                string estadoAnterior = empresa.EstadoAprobacion;
                empresa.EstadoAprobacion = dto.Estado; 
                
                int idUsuarioGestor = empresa.UsuarioId;

                if (string.Equals(empresa.EstadoAprobacion, "Aprobado", StringComparison.OrdinalIgnoreCase))
                {
                    var usuario = await _context.Usuarios.FindAsync(idUsuarioGestor);
                    if (usuario != null && usuario.Rol != "Admin")
                    {
                        usuario.Rol = "Empresa";
                        _context.Entry(usuario).State = EntityState.Modified;
                    }

                    var relacionFalsa = await _context.UsuarioEmpresas
                        .FirstOrDefaultAsync(ue => ue.EmpresaId == id && ue.UsuarioId == idUsuarioGestor);
                    if (relacionFalsa != null)
                    {
                        _context.UsuarioEmpresas.Remove(relacionFalsa);
                    }
                }
                
                else if (string.Equals(empresa.EstadoAprobacion, "Baja", StringComparison.OrdinalIgnoreCase) && 
                        !string.Equals(estadoAnterior, "Baja", StringComparison.OrdinalIgnoreCase))
                {
                    var relacionesAfectadas = _context.UsuarioEmpresas.Where(ue => ue.EmpresaId == id);
                    _context.UsuarioEmpresas.RemoveRange(relacionesAfectadas);

                    bool tieneMasEmpresas = await _context.Empresas
                        .AnyAsync(e => e.UsuarioId == idUsuarioGestor && e.EstadoAprobacion == "Aprobado" && e.Id != id);

                    if (!tieneMasEmpresas)
                    {
                        var usuario = await _context.Usuarios.FindAsync(idUsuarioGestor);
                        if (usuario != null && usuario.Rol != "Admin")
                        {
                            usuario.Rol = "Trabajador";
                            _context.Entry(usuario).State = EntityState.Modified;
                        }
                    }
                }

                await _context.SaveChangesAsync();
                return Ok(new { mensaje = "Estado actualizado correctamente, municipio unificado y roles sincronizados." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno: {ex.Message}");
            }
        }

        // POST: api/Empresas/postularse
        [HttpPost("postularse")]
        public async Task<IActionResult> PostularseAEmpresa(
            [FromForm] int usuarioId,
            [FromForm] int empresaId,
            [FromForm] string notas,              
            [FromForm] IFormFile curriculumFile)
        {
            if (usuarioId <= 0 || empresaId <= 0)
                return BadRequest("Identificadores de usuario o empresa inválidos.");

            if (curriculumFile == null || curriculumFile.Length == 0)
                return BadRequest("Es obligatorio adjuntar un archivo de currículum en formato PDF.");

            if (!curriculumFile.ContentType.Equals("application/pdf", StringComparison.OrdinalIgnoreCase))
                return BadRequest("El archivo adjunto debe estar en formato PDF.");

            var existeRelacionActiva = await _context.UsuarioEmpresas
                .AnyAsync(ue => ue.UsuarioId == usuarioId &&
                                ue.EmpresaId == empresaId &&
                                (ue.EstadoSolicitud == "Pendiente" || ue.EstadoSolicitud == "Contratado" || ue.EstadoSolicitud == "Aprobado"));

            if (existeRelacionActiva)
            {
                return BadRequest(new { mensaje = "Ya tienes una postulación en trámite o posees una vinculación laboral activa con esta empresa." });
            }

            try
            {
                var carpetaDestino = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "cv");
                if (!Directory.Exists(carpetaDestino))
                    Directory.CreateDirectory(carpetaDestino);

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

        // GET: api/Empresas/mis-pliegos/{idEmpresa}
        [HttpGet("mis-pliegos/{idEmpresa}")]
        public async Task<IActionResult> GetPliegosPropio(int idEmpresa)
        {
            try
            {
                var loteIds = await _context.Lotes
                    .Where(l => l.IdEmpresa == idEmpresa)
                    .Select(l => l.Id)
                    .ToListAsync();

                if (!loteIds.Any()) return Ok(new List<object>());

                var pliegos = await _context.Pliegos
                    .Where(p => loteIds.Contains(p.IdLote))
                    .Select(p => new {
                        PliegoId = p.Id,
                        NombrePliego = p.NombreArchivo,
                        Descripcion = p.Descripcion,
                        Ruta = p.RutaURL,
                        Fecha = p.FechaSubida,
                        LoteId = p.IdLote
                    })
                    .ToListAsync();

                return Ok(pliegos);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR EN GET MIS PLIEGOS: {ex.Message}");
                return StatusCode(500, new { mensaje = "Error al recuperar los pliegos asignados." });
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
                Console.WriteLine($"ERROR AL OBTENER CANDIDATOS DESDE MODELO: {ex.Message}");
                return StatusCode(500, new { mensaje = "Error interno al recuperar la bolsa de empleo." });
            }
        }

        // GET: api/Empresas/mi-plantilla/{idEmpresa}
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
                Console.WriteLine($"ERROR EN GET PLANTILLA: {ex.Message}");
                return Ok(new List<object>());
            }
        }

        // PUT: api/Empresas/{idEmpresa}/aceptar-trabajador
        [HttpPut("{idEmpresa}/aceptar-trabajador")]
        public async Task<IActionResult> AceptarTrabajador(int idEmpresa, [FromBody] PostulacionDto model)
        {
            if (model == null || model.UsuarioId <= 0)
                return BadRequest("Datos de contratación insuficientes.");

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
        public async Task<IActionResult> SubirNomina(
            [FromForm] int usuarioId,
            [FromForm] int empresaId,
            [FromForm] string periodo,
            [FromForm] IFormFile archivoNomina)
        {
            if (usuarioId <= 0) return BadRequest("El ID de usuario es inválido.");
            if (empresaId <= 0) return BadRequest("El ID de empresa es inválido.");
            if (string.IsNullOrEmpty(periodo)) return BadRequest("El periodo es obligatorio.");
            if (archivoNomina == null || archivoNomina.Length == 0) return BadRequest("El archivo es obligatorio.");

            try
            {
                var baseFolder = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
                var carpetaDestino = Path.Combine(baseFolder, "uploads", "nominas");

                if (!Directory.Exists(carpetaDestino))
                {
                    Directory.CreateDirectory(carpetaDestino);
                }

                string periodoLimpio = Uri.UnescapeDataString(periodo)
                    .Replace(" / ", "_")
                    .Replace("/", "_")
                    .Replace(" ", "")
                    .Trim();
                
                var nombreArchivoUnico = $"nomina_{usuarioId}_{periodoLimpio}.pdf";
                var rutaCompletaFisica = Path.Combine(carpetaDestino, nombreArchivoUnico);

                using (var stream = new FileStream(rutaCompletaFisica, FileMode.Create))
                {
                    await archivoNomina.CopyToAsync(stream);
                }

                var partesPeriodo = Uri.UnescapeDataString(periodo).Split('/');
                string mesNomina = partesPeriodo[0].Trim();
                int anioNomina = DateTime.Now.Year;
                
                if (partesPeriodo.Length > 1 && int.TryParse(partesPeriodo[1].Trim(), out int anioParseado))
                    anioNomina = anioParseado;

                var urlRelativaBD = $"/uploads/nominas/{nombreArchivoUnico}";

                var nuevaNomina = new Nomina {
                    UsuarioId = usuarioId,
                    EmpresaId = empresaId,
                    Mes = mesNomina,
                    Anio = anioNomina,
                    RutaArchivoPDF = urlRelativaBD
                };

                _context.Nominas.Add(nuevaNomina);
                await _context.SaveChangesAsync();

                return Ok(new { mensaje = "Nómina guardada en servidor y BD con éxito.", url = urlRelativaBD });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = $"Error interno en el servidor: {ex.Message}", detalle = ex.ToString() });
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

                var listaNominas = nominasRaw.Select(n => {
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

        // GET: api/Empresas/mis-centros/{idEmpresa}
        [HttpGet("mis-centros/{idEmpresa}")]
        public async Task<IActionResult> GetCentrosPropio(int idEmpresa)
        {
            try
            {
                var lotesConCentros = await _context.Lotes
                    .Where(l => l.IdEmpresa == idEmpresa)
                    .Include(l => l.Centros)
                    .ToListAsync();

                var centros = lotesConCentros
                    .SelectMany(l => l.Centros)
                    .Select(c => new {
                        Id = c.Id,
                        Nombre = c.Nombre,
                        Direccion = c.Direccion,
                        Localidad = c.Localidad
                    })
                    .DistinctBy(c => c.Id)
                    .ToList();

                return Ok(centros);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR EN GET MIS CENTROS: {ex.Message}");
                return StatusCode(500, new { mensaje = "Error al recuperar los centros asignados." });
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


        // PUT: api/Empresas
        [HttpPut("{id}")]
        public async Task<IActionResult> PutEmpresa(int id, [FromBody] ActualizarEmpresaDto dto)
        {
            if (dto == null) return BadRequest("Datos inválidos.");

            var empresaExistente = await _context.Empresas.FirstOrDefaultAsync(e => e.Id == id);
            if (empresaExistente == null) return NotFound("La empresa solicitada no existe.");

            int idUsuarioGestor = empresaExistente.UsuarioId;
            
            string estadoAnterior = empresaExistente.EstadoAprobacion;

            if (!string.IsNullOrEmpty(dto.NombreEmpresa)) empresaExistente.NombreEmpresa = dto.NombreEmpresa;
            if (!string.IsNullOrEmpty(dto.Cif)) empresaExistente.Cif = dto.Cif;
            if (!string.IsNullOrEmpty(dto.Direccion)) empresaExistente.Direccion = dto.Direccion;
            if (!string.IsNullOrEmpty(dto.EmailContacto)) empresaExistente.EmailContacto = dto.EmailContacto;
            
            empresaExistente.EstadoAprobacion = !string.IsNullOrEmpty(dto.EstadoAprobacion) 
                ? dto.EstadoAprobacion 
                : "Aprobado";

            try
            {
                if (string.Equals(empresaExistente.EstadoAprobacion, "Baja", StringComparison.OrdinalIgnoreCase) && 
                    !string.Equals(estadoAnterior, "Baja", StringComparison.OrdinalIgnoreCase))
                {

                    if (await _context.Lotes.AnyAsync(l => l.IdEmpresa == id))
                        return Conflict(new { mensaje = "No se puede dar de baja: existen lotes activos asignados a esta empresa." });

                    var relacionesAfectadas = _context.UsuarioEmpresas.Where(ue => ue.EmpresaId == id);
                    _context.UsuarioEmpresas.RemoveRange(relacionesAfectadas);

                    bool tieneMasEmpresas = await _context.Empresas
                        .AnyAsync(e => e.UsuarioId == idUsuarioGestor && e.EstadoAprobacion == "Aprobado" && e.Id != id);

                    if (!tieneMasEmpresas)
                    {
                        var usuario = await _context.Usuarios.FindAsync(idUsuarioGestor);
                        if (usuario != null && usuario.Rol != "Admin")
                        {
                            usuario.Rol = "Trabajador";
                            _context.Entry(usuario).State = EntityState.Modified;
                            Console.WriteLine($"[Vesta] El dueño cerró su última empresa. Rol de Usuario ID {usuario.Id} cambiado a 'Trabajador'.");
                        }
                    }
                }

                else if (string.Equals(empresaExistente.EstadoAprobacion, "Aprobado", StringComparison.OrdinalIgnoreCase))
                {
                    var usuario = await _context.Usuarios.FindAsync(idUsuarioGestor);
                    if (usuario != null && usuario.Rol != "Empresa" && usuario.Rol != "Admin")
                    {
                        usuario.Rol = "Empresa";
                        _context.Entry(usuario).State = EntityState.Modified;
                        Console.WriteLine($"[Vesta] Empresa reactivada/aprobada. Rol de Usuario ID {usuario.Id} asegurado como 'Empresa'.");
                    }
                }

                await _context.SaveChangesAsync();
                return Ok(new { mensaje = "Empresa actualizada correctamente." });
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!EmpresaExists(id)) return NotFound();
                else throw;
            }
        }

        // DELETE: api/Empresas/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEmpresa(int id)
        {
            try
            {
                var empresa = await _context.Empresas.FindAsync(id);
                if (empresa == null) return NotFound();

                if (await _context.Lotes.AnyAsync(l => l.IdEmpresa == id))
                    return Conflict(new { mensaje = "No se puede dar de baja: existen lotes activos asignados a esta empresa." });

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
                        Console.WriteLine($"[Vesta] Baja empresa ID {id}. Rol de Usuario ID {idUsuarioGestor} cambiado a 'Trabajador'.");
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

        // DELETE: api/Empresas/2/despedir-trabajador/4
        [HttpDelete("{empresaId}/despedir-trabajador/{usuarioId}")]
        public async Task<IActionResult> DespedirTrabajador(int empresaId, int usuarioId)
        {
            try
            {
                var relacion = await _context.UsuarioEmpresas
                    .FirstOrDefaultAsync(ue => ue.EmpresaId == empresaId && ue.UsuarioId == usuarioId);

                if (relacion == null)
                {
                    return NotFound(new { mensaje = "No se ha encontrado ninguna vinculación laboral para este operario en la empresa." });
                }
                _context.UsuarioEmpresas.Remove(relacion);
            
                await _context.SaveChangesAsync();

                return Ok(new { mensaje = "El operario ha sido dado de baja de la empresa con éxito." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR EN DESPEDIR TRABAJADOR: {ex.Message}");
                return StatusCode(500, new { mensaje = $"Error interno en el servidor al tramitar la baja: {ex.Message}" });
            }
        }

        // POST: api/Empresas/solicitar
        [HttpPost("solicitar")]
        [AllowAnonymous]
        public async Task<IActionResult> SolicitarCreacionEmpresa([FromBody] SolicitarEmpresaDto model)
        {
            if (model == null) return BadRequest("Datos inválidos.");

            var existeCif = _context.Empresas.Any(e => e.Cif == model.Cif);
            if (existeCif) return BadRequest(new { mensaje = "Ya existe una empresa registrada con ese CIF." });

            var nuevaEmpresa = new Empresa {
                NombreEmpresa = model.NombreEmpresa,
                Cif = model.Cif,
                Direccion = model.Direccion,
                EmailContacto = model.EmailContacto,
                AyuntamientoId = model.AyuntamientoId,
                UsuarioId = model.UsuarioId,
                EstadoAprobacion = "Pendiente"
            };

            _context.Empresas.Add(nuevaEmpresa);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Solicitud enviada con éxito. Tu empresa está en estado Pendiente de aprobación." });
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
                        e.EstadoAprobacion,
                        LotesAsignados = _context.Lotes
                            .Where(l => l.IdEmpresa == e.Id)
                            .Select(l => l.Nombre)
                            .ToList()
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
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR EN GET INACTIVAS: {ex.Message}");
                return Ok(new List<object>());
            }
        }

        private bool EmpresaExists(int id)
        {
            return _context.Empresas.Any(e => e.Id == id);
        }
    }
}
