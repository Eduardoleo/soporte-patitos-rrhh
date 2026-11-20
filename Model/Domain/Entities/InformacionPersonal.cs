namespace Model.Entities
{
    public class InformacionPersonal
    {
        public int Informacion_Personal_ID { get; set; }
        public int Empleado_ID { get; set; }
        public string Nombre_Empleado { get; set; }
        public string Primer_Nombre { get; set; }
        public string Segundo_Nombre { get; set; }
        public string Apellido_Paterno { get; set; }
        public string Apellido_Materno { get; set; }
        public DateTime? Fecha_Nacimiento { get; set; }
        public string Genero { get; set; }
        public string Estado_Civil { get; set; }
        public string Pais_Demografico { get; set; }
        public DateTime Fecha_Actualizacion { get; set; } = DateTime.UtcNow;

        // Navegación
        public virtual Empleados Empleado { get; set; }
    }
}
