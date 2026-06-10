using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace VestaApi.Models 
{
    public class Empresa 
    {
        [Key]
        public int Id { get; set; }

        [Required(ErrorMessage = "El nombre de la empresa es obligatorio.")]
        [StringLength(150, MinimumLength = 2, ErrorMessage = "El nombre de la empresa debe tener entre 2 y 150 caracteres.")]
        public string NombreEmpresa { get; set; } = string.Empty;
      
        [Required(ErrorMessage = "El CIF es obligatorio.")]
        [RegularExpression(@"^[ABCDEFGHJNPQRSUVWabcdefghjnpqrsuvw][0-9]{7}[0-9A-Jany]$", ErrorMessage = "El formato del CIF español no es valido.")]
        public string Cif { get; set; } = string.Empty;

        [Required(ErrorMessage = "La direccion de la sede es obligatoria.")]
        public string Direccion { get; set; } = string.Empty;

        [Required(ErrorMessage = "El email de contacto comercial es obligatorio.")]
        [EmailAddress(ErrorMessage = "El formato del correo electronico de la empresa no es valido.")]
        public string EmailContacto { get; set; } = string.Empty;

        [Required]
        public int UsuarioId { get; set; }
        [Required(ErrorMessage = "El Ayuntamiento regulador es obligatorio.")]
        public int AyuntamientoId { get; set; }

        public string EstadoAprobacion { get; set; } = "Pendiente";

        public virtual ICollection<UsuarioEmpresa> Relaciones { get; set; } = new HashSet<UsuarioEmpresa>();
        public virtual ICollection<Lote> LotesAsignados { get; set; } = new HashSet<Lote>();


        public List<UsuarioEmpresa> ObtenerPlantilla() => 
            Relaciones.Where(r => r.EstadoSolicitud == "Contratado").ToList();

        public List<UsuarioEmpresa> ObtenerCandidatos() => 
            Relaciones.Where(r => r.EstadoSolicitud == "Pendiente").ToList();
    }
}