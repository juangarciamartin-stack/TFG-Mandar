using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace VestaApi.Models
{
    public class Usuario 
    {
        [Key]
        public int Id { get; set; }

        [Required(ErrorMessage = "El nombre es obligatorio.")]
        [StringLength(100, MinimumLength = 3, ErrorMessage = "El nombre debe tener entre 3 y 100 caracteres.")]
        [RegularExpression(@"^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$", ErrorMessage = "El nombre solo puede contener letras y espacios.")]
        public string Nombre { get; set; } = string.Empty;

        [Required(ErrorMessage = "El correo electronico es obligatorio.")]
        [EmailAddress(ErrorMessage = "El formato del correo electronico no es valido.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "La contraseña es obligatoria.")]
        [StringLength(255, MinimumLength = 6, ErrorMessage = "La contraseña debe tener al menos 6 caracteres.")]
        public string Password { get; set; } = string.Empty;

        public string Rol { get; set; } = string.Empty;

        [Required(ErrorMessage = "El DNI/NIE es obligatorio.")]
        [RegularExpression(@"^[0-9XYZxyz][0-9]{7}[A-Za-z]$", ErrorMessage = "El formato del DNI o NIE español no es valido.")]
        public string Dni { get; set; } = string.Empty;

        [Required(ErrorMessage = "El telefono es obligatorio.")]
        [RegularExpression(@"^[6789]\d{8}$", ErrorMessage = "El telefono debe ser un numero español valido de 9 digitos.")]
        public string Telefono { get; set; } = string.Empty;

        public bool Disponibilidad { get; set; } = true;

        public virtual ICollection<Nomina> MisNominas { get; set; } = new HashSet<Nomina>();
        public virtual ICollection<Incidencia> IncidenciasReportadas { get; set; } = new HashSet<Incidencia>();
        public virtual ICollection<UsuarioEmpresa> Vinculaciones { get; set; } = new HashSet<UsuarioEmpresa>();

        public Usuario() { }

        public int? IdAyuntamiento { get; set; }
        
        [ForeignKey("IdAyuntamiento")]
        [JsonIgnore] 
        public virtual Ayuntamiento? Ayuntamiento { get; set; }
    }
}