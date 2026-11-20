


namespace Model.Entities
{
    public class Evaluaciones
    {
      
        public long Evaluacion_ID { get; set; }

        public int Empleado_ID { get; set; }
        public int Usuario_Evaluador_ID { get; set; }
        public DateTime Fecha_Evaluacion { get; set; }
        public decimal? Promedio { get; set; }
        public string Observaciones { get; set; }
    }
}
