namespace Model.Responses
{
    public class DetallePersonalResponse
    {
        public int EmpleadoId { get; set; }
        public string ApellidoPaterno { get; set; }
        public string ApellidoMaterno { get; set; }
        public string Nombre { get; set; }
        public string SegundoNombre { get; set; }
        public DateTime FechaInicio { get; set; }
        public string FotografiaUrl { get; set; }
        public string FotografiaDescripcion { get; set; }
        public string PaisDemografico { get; set; }
        public string EstadoCivil { get; set; }
        public string Genero { get; set; }
        public string NivelEducacionSuperior { get; set; }
        public string PaisDocumento { get; set; }
        public string TipoIdentificadorNacional { get; set; }
        public string IdentificadorNacional { get; set; }
        public string TipoSeguridadSocial { get; set; }
        public string IdentificadorSeguridadSocial { get; set; }
        public DateTime? FechaNacimiento { get; set; }
        public string EdadTexto { get; set; }
        public string MensajeDiscapacidad { get; set; }

        public string CorreoElectronico { get; set; }
        public string CorreoElectronicoPersonal { get; set; }
        public string TelefonoMovil { get; set; }
        public string DireccionPais { get; set; }
        public string DireccionProvincia { get; set; }
        public string DireccionCanton { get; set; }
        public string DireccionDistrito { get; set; }
        public string DireccionExacta { get; set; }
    }
}
