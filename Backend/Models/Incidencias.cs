using System;

namespace VestaApi.Models
{
    public class Incidencia 
    { 
        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty; 
        public string Estado { get; set; } = "Pendiente"; 
        public string Descripcion { get; set; } = string.Empty;
        public string Gravedad { get; set; } = "Baja"; 

        public int UsuarioId { get; set; }
        public int? LoteId { get; set; } 

        public int? EmpresaId { get; set; }

        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
        
        public virtual Usuario? Autor { get; set; }
        public virtual Lote? LoteAfectado { get; set; }
        public virtual Empresa? Empresa { get; set; }

        public void Resolver() {
            this.Estado = "Resuelto";
        }
    }
}