using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace VestaApi.Models
{
    public class Lote
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;

        public int IdAyuntamiento { get; set; }
        [ForeignKey("IdAyuntamiento")]
        public virtual Ayuntamiento? Ayuntamiento { get; set; }

        public int? IdEmpresa { get; set; }
        [ForeignKey("IdEmpresa")]
        public virtual Empresa? Empresa { get; set; }

        // RELACIONES
        public virtual List<Centro> Centros { get; set; } = new();
        
        public virtual List<Pliego> Pliegos { get; set; } = new();

        public void AsignarEmpresa(int empresa) => IdEmpresa = empresa;
        public void AñadirCentro(Centro centro) => Centros.Add(centro);
        public void AñadirPliego(Pliego pliego) => Pliegos.Add(pliego);
    }
}