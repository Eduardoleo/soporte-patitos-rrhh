namespace Model.Responses
{
    public class SolicitudAusenciaDetalleResponse
    {
        public long SolicitudId { get; set; }
        public int EmpleadoId { get; set; }
        public string EmpleadoNombre { get; set; }
        public string TipoAusencia { get; set; }
        public string Motivo { get; set; }
        public string Comentarios { get; set; }
        public DateTime FechaInicio { get; set; }
        public DateTime FechaFin { get; set; }
        public DateTime FechaSolicitud { get; set; }
        public string EstadoSolicitud { get; set; }
        public bool PuedeAprobar { get; set; }
        public List<SolicitudAusenciaFlujoPasoResponse> FlujoAprobacion { get; set; } = new();
    }

    public class SolicitudAusenciaFlujoPasoResponse
    {
        public string Etapa { get; set; }
        public string Responsable { get; set; }
        public string Estado { get; set; }
        public DateTime? Fecha { get; set; }
        public string Descripcion { get; set; }
    }
}
