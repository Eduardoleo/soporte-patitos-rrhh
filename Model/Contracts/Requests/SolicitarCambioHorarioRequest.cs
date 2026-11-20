namespace Model.Requests
{
    public class SolicitarCambioHorarioRequest
    {
        public int Empleado_ID { get; set; }
        public int Horario_Actual_ID { get; set; }
        public int Horario_Solicitado_ID { get; set; }
        public string Motivo { get; set; }
        public int? Jefe_ID { get; set; }
    }
}
