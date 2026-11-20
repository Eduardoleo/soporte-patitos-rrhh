

namespace Model.Entities
{
    public class Evaluacion_Detalle
    {
       
        public long Evaluacion_Detalle_ID { get; set; }

        public long Evaluacion_ID { get; set; }
        public int Pregunta_ID { get; set; }
        public int Calificacion { get; set; }
    }
}