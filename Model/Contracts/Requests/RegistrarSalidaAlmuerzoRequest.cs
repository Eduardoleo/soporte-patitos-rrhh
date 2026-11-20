namespace Model.Requests
{
    public class RegistrarSalidaAlmuerzoRequest
    {
        public int Empleado_ID { get; set; }
        public DateTime Fecha_Hora_Salida_Almuerzo { get; set; }
    }
}
