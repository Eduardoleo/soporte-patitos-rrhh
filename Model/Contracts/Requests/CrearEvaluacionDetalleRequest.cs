namespace Model.Requests
{
    public class CrearEvaluacionDetalleRequest
    {
        public long Evaluacion_ID { get; set; }
        public int Pregunta_ID { get; set; }
        public int Calificacion { get; set; }
    }
}