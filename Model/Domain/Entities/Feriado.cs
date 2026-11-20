using System;

namespace Model.Entities
{
    public class Feriado
    {
        public int Feriado_ID { get; set; }
        public string Nombre_Feriado { get; set; }
        public DateTime Fecha { get; set; }
        public bool Es_Recurrente { get; set; }
        public string Descripcion { get; set; }
        public DateTime Fecha_Registro { get; set; }
    }
}
