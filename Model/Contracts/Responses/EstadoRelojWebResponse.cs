namespace Model.Responses
{
    public class EstadoRelojWebResponse
    {
        public int EmpleadoId { get; set; }
        public DateTime Fecha { get; set; }
        public string HoraEntradaProgramada { get; set; }
        public string HoraSalidaProgramada { get; set; }
        public string HoraEntradaMarcada { get; set; }
        public string HoraSalidaAlmuerzo { get; set; }
        public string HoraRegresoAlmuerzo { get; set; }
        public string HoraSalidaMarcada { get; set; }
        public int MinutosTardia { get; set; }
        public decimal HorasExtra { get; set; }
        public bool RequiereJustificacionTardia { get; set; }
        public bool RequiereJustificacionAusencia { get; set; }
        public string EstadoDia { get; set; }
    }
}
