using System.Text.Json.Serialization;

namespace Model.Requests
{
    public class CrearColillaPagoRequest
    {
        public long Planilla_ID { get; set; }
        public int Empleado_ID { get; set; }
        public decimal Pago_CCSS { get; set; }
        public decimal Exoneraciones { get; set; }
        public decimal Deducciones_Ausencias { get; set; }
        // Compatibility only: never used as a salary source.
        public decimal? Salario_Puesto { get; set; }
        private decimal? _salarioNeto;
        public decimal? Salario_Neto
        {
            get => _salarioNeto;
            set { _salarioNeto = value; NetoEnviado = true; }
        }
        [JsonIgnore]
        public bool NetoEnviado { get; private set; }
    }
}