namespace Model.Responses
{
    public class ContactoEmergenciaResponse
    {
        public int ContactoId { get; set; }
        public int EmpleadoId { get; set; }
        public string NombreCompleto { get; set; }
        public string Relacion { get; set; }
        public bool EsCargaFamiliar { get; set; }
        public string TelefonoContacto { get; set; }
        public DateTime FechaRegistro { get; set; }
    }
}
