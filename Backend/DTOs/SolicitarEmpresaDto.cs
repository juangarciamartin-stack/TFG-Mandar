namespace VestaApi.DTOs
{
    public class SolicitarEmpresaDto
    {
        public string NombreEmpresa { get; set; } = null!;
        public string Cif { get; set; } = null!;
        public string Direccion { get; set; } = null!;
        public string EmailContacto { get; set; } = null!;
        public int UsuarioId { get; set; }
    }
}