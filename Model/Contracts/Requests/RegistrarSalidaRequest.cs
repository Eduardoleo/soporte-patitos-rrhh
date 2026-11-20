namespace Model.Requests
{
    public class RegistrarSalidaRequest
    {
        public int Empleado_ID { get; set; }
        public DateTime Fecha_Hora_Salida { get; set; }
    }
}