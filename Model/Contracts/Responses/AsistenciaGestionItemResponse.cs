namespace Model.Responses
{
    public class AsistenciaGestionItemResponse
    {
        public DateTime Fecha { get; set; }
        public int EmpleadoId { get; set; }
        public string Nombre { get; set; }
        public string JefeInmediato { get; set; }
        public string Gerencia { get; set; }
        public string HoraEntrada { get; set; }
        public int MinutosTarde { get; set; }
        public string HoraSalida { get; set; }
        public decimal HorasExtra { get; set; }
        public bool AusenciaSolicitada { get; set; }
        public string TipoAusenciaPedida { get; set; }
        public string JustificacionAusencia { get; set; }
        public string ComentarioPuesto { get; set; }
    }
}
