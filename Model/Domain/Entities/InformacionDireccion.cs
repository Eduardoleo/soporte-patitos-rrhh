namespace Model.Entities
{
    public class InformacionDireccion
    {
        public int Informacion_Direccion_ID { get; set; }
        public int Empleado_ID { get; set; }
        public string Pais { get; set; }
        public string Provincia { get; set; }
        public string Canton { get; set; }
        public string Distrito { get; set; }
        public string Direccion_Exacta { get; set; }
        public DateTime Fecha_Actualizacion { get; set; } = DateTime.UtcNow;

        // Navegación
        public virtual Empleados Empleado { get; set; }
    }
}
