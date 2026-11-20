namespace Model.Responses
{
    public class BalanceAusenciasResponse
    {
        public int EmpleadoId { get; set; }
        public string PlanNombre { get; set; }
        public DateTime FechaReferencia { get; set; }
        public DateTime VigenciaInicio { get; set; }
        public DateTime VigenciaFin { get; set; }
        public int MesesLaborados { get; set; }
        public int DiasAnualesPlan { get; set; }
        public decimal Ajustes { get; set; }
        public decimal Arrastre { get; set; }
        public decimal AusenciasAprobadas { get; set; }
        public decimal BalanceTotal { get; set; }
        public bool PuedeSolicitarVacaciones { get; set; }
        public string MensajeReglaVacaciones { get; set; }
    }
}
