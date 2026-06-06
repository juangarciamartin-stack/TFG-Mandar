using System.ComponentModel.DataAnnotations.Schema;

namespace VestaApi.Models
{
    public class Nomina
    {
        public int Id { get; set; }
        public string Mes { get; set; } = string.Empty;
        public int Anio { get; set; }
        public string RutaArchivoPDF { get; set; } = string.Empty;
         public DateTime FechaSubida { get; set; } = DateTime.UtcNow;
    
        public int UsuarioId { get; set; }

        [ForeignKey("UsuarioId")]
        public virtual Usuario? Usuario { get; set; } 

        public int EmpresaId { get; set; }

        [ForeignKey("EmpresaId")]
        public virtual Empresa? Empresa { get; set; } 
    }
}