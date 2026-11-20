namespace Model.Requests
{
    public class ProcesarSolicitudAusenciaRequest
    {
        public int EmpleadoAprobadorId { get; set; }
        public string Accion { get; set; } = string.Empty; // APROBAR | RECHAZAR
        public string? Comentario { get; set; }
    }
}
