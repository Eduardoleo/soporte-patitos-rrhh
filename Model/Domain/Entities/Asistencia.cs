

namespace Model.Entities
{
    public class Asistencia
    {
       
        public long Asistencia_ID { get; set; }

        public int Empleado_ID { get; set; }
        public DateTime Fecha { get; set; }
        public DateTime? Fecha_Hora_Entrada { get; set; }
        public DateTime? Fecha_Hora_Salida { get; set; }
        public string? Estado_Asistencia { get; set; }
        public string? Observaciones { get; set; }
        public DateTime Fecha_Registro { get; set; }
    }
}
