

namespace Model.Entities
{
    public class Planillas
    {
    
        public long Planilla_ID { get; set; }

        public DateTime Periodo_Inicio { get; set; }
        public DateTime Periodo_Fin { get; set; }
        public DateTime Fecha_Generacion { get; set; }
        public int Usuario_Generador_ID { get; set; }
        public string Estado { get; set; }
    }
}