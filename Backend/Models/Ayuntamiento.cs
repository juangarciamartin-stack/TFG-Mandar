using System.Collections.Generic;

namespace VestaApi.Models
{
   public class Ayuntamiento 
{
    public int Id { get; set; } 
    public string NombreMunicipio { get; set; } = string.Empty;
    public string Cif { get; set; } = string.Empty;
    public string Direccion { get; set; } = string.Empty;

    public List<Lote> LotesOfertados { get; set; } = new();
    public List<Centro> Centros { get; set; } = new(); 
    public virtual List<Usuario> UsuariosGestores { get; set; } = new();
}
}