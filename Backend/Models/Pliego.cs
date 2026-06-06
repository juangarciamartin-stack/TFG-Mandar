using System;

namespace VestaApi.Models
{
    public class Pliego
    {
        public int Id { get; set; }
        public string NombreArchivo { get; set; } = string.Empty;
        public string Descripcion  { get; set; } = string.Empty;
        public string RutaURL { get; set; } = string.Empty;
        public DateTime FechaSubida { get; set; } = DateTime.UtcNow; //sin esto da erro al subi archivos por la fecha
        
        public int IdLote { get; set; }
        // el "?" para decir que puede ser nulo al principio
        public virtual Lote? Lote { get; set; }
    }
}