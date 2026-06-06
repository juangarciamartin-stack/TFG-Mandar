using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema; // arregla el error de foreingkey
using System.Text.Json.Serialization; //Si no se pone cuando el API intente enviarte el Centro, intentará cargar el Ayuntamiento, y ese Ayuntamiento cargará sus Centros, causando el Error 500.

namespace VestaApi.Models
{
    public class Centro
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Direccion { get; set; } = string.Empty;
        public string Localidad { get; set; } = string.Empty;
        
        public int IdAyuntamiento { get; set; } 
        
        [ForeignKey("IdAyuntamiento")]
        [JsonIgnore] //evita el bucle infinito
        public virtual Ayuntamiento? Ayuntamiento { get; set; }
        [JsonIgnore] //para evitar listar los lotes al listar los centros
        public virtual List<Lote> Lotes { get; set; } = new();
    }
}