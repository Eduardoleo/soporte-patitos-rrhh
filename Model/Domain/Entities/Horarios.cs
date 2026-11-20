

namespace Model.Entities
{
    public class Horarios
    {
        public int Horario_ID { get; set; }
        public string Nombre_Horario { get; set; }
        public TimeSpan Hora_Entrada { get; set; }
        public TimeSpan Hora_Salida { get; set; }
        public string Descripcion { get; set; }
    }
}
