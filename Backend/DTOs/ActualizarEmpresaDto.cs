namespace VestaApi.DTOs
{
    public class ActualizarEmpresaDto
    {
        public int Id { get; set; }
        public string NombreEmpresa { get; set; }
        public string Cif { get; set; }
        public string Direccion { get; set; }
        public string EmailContacto { get; set; }
        public int UsuarioId { get; set; }
        public string EstadoAprobacion { get; set; }
    }
}