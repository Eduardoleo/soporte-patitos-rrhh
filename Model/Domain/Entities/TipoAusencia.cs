using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Model.Entities
{
    [Table("Tipos_Ausencia")]
    public class TipoAusencia
    {
        [Key]
        public int Tipo_Ausencia_ID { get; set; }
        public string Nombre_Ausencia { get; set; } = string.Empty;
        public decimal Porcentaje_Pago_Patrono { get; set; }
        public bool Requiere_Aprobacion { get; set; }
        public string? Descripcion { get; set; }
    }
}
