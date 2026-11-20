namespace Model.Requests
{
    public class CrearEvaluacionRequest
    {
        public int Empleado_ID { get; set; }
        public int Usuario_Evaluador_ID { get; set; }
        public string Observaciones { get; set; }
    }
}
