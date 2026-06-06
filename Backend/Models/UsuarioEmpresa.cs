namespace VestaApi.Models
{
    public class UsuarioEmpresa 
    {
        public int Id { get; set; }
        public int UsuarioId { get; set; }
        public int EmpresaId { get; set; }
        public string EstadoSolicitud { get; set; } = "Pendiente"; 
        public string TipoRelacion { get; set; } = string.Empty;
        public string Disponibilidad { get; set; } = string.Empty;
        public string Notas { get; set; } = string.Empty;
        public string CurriculumURl { get; set; } = string.Empty;
        public DateTime FechaSubida { get; set; } = DateTime.UtcNow;
        
        public virtual Usuario? Usuario { get; set; }
        public virtual Empresa? Empresa { get; set; }
    }
}