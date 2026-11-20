

namespace Model.Entities
{
    public class Colillas_Pago
    {
      
        public long Colilla_ID { get; set; }

        public long Planilla_ID { get; set; }
        public int Empleado_ID { get; set; }
        public decimal Pago_CCSS { get; set; }
        public decimal Exoneraciones { get; set; }
        public decimal Deducciones_Ausencias { get; set; }
        public decimal Salario_Puesto { get; set; }
        public decimal Salario_Neto { get; set; }
        public string? Ruta_PDF { get; set; }
        public DateTime? Fecha_Envio { get; set; }
        public string? Estado_Envio { get; set; }
    }
}