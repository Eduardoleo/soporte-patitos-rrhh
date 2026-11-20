using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Model.Entities
{
    [Table("Solicitudes_Ausencia")]
    public class SolicitudAusencia
    {
        [Key]
        public long Solicitud_ID { get; set; }
        public int Empleado_ID { get; set; }
        public int Tipo_Ausencia_ID { get; set; }
        public DateTime Fecha_Inicio { get; set; }
        public DateTime Fecha_Fin { get; set; }
        public string? Motivo { get; set; }
        public string? Comentarios { get; set; }
        public string Estado_Solicitud { get; set; } = "PENDIENTE";
        public DateTime Fecha_Solicitud { get; set; } = DateTime.Now;
        public int? Aprobador_ID { get; set; }
        public DateTime? Fecha_Aprobacion { get; set; }
    }
}