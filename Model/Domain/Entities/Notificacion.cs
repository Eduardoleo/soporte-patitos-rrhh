using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Model.Entities
{
    [Table("Notificaciones")]
    public class Notificacion
    {
        [Key]
        public long Notificacion_ID { get; set; }
        public int Empleado_Destino_ID { get; set; }
        public int Empleado_Origen_ID { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string? Mensaje { get; set; }
        public string Estado { get; set; } = "EN CURSO";
        public string Tipo_Notificacion { get; set; } = "APROBACION";
        public DateTime Fecha_Creacion { get; set; } = DateTime.Now;
        public long? Referencia_ID { get; set; }
        public string? Referencia_Tipo { get; set; }
    }
}