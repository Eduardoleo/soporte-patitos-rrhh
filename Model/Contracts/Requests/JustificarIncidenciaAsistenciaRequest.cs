namespace Model.Requests
{
    public class JustificarIncidenciaAsistenciaRequest
    {
        public int Empleado_ID { get; set; }
        public DateTime Fecha { get; set; }
        public string Motivo { get; set; }
        public string Tipo { get; set; } // TARDANZA | AUSENCIA
    }
}
