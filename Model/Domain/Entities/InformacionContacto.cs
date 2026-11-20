namespace Model.Entities
{
    public class InformacionContacto
    {
        public int Informacion_Contacto_ID { get; set; }
        public int Empleado_ID { get; set; }
        public string Correo_Electronico { get; set; }
        public string Correo_Electronico_Personal { get; set; }
        public string Telefono_Movil { get; set; }
        public string Telefono_Fijo { get; set; }
        public DateTime Fecha_Actualizacion { get; set; } = DateTime.UtcNow;

        // Navegación
        public virtual Empleados Empleado { get; set; }
    }
}
