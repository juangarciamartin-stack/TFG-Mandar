namespace VestaApi.DTOs
{
    public class RegistroAyuntamientoDto
    {
        public string Nombre { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Cif { get; set; } = string.Empty;        
        public string Direccion { get; set; } = string.Empty;
        public string NombreResponsable { get; set; } = string.Empty; 
        public string DniResponsable { get; set; } = string.Empty;
        public string TelefonoResponsable { get; set; } = string.Empty;
    }
}