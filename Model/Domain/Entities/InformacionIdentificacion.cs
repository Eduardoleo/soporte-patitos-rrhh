namespace Model.Entities
{
    public class InformacionIdentificacion
    {
        public int Informacion_Identificacion_ID { get; set; }
        public int Empleado_ID { get; set; }
        public string Pais_Identificacion { get; set; }
        public string Tipo_Identificador_Nacional { get; set; }
        public string Identificador_Nacional { get; set; }
        public string Pais_Seguridad_Social { get; set; }
        public string Tipo_Seguridad_Social { get; set; }
        public string Identificador_Seguridad_Social { get; set; }
        public string Nivel_Educacion_Superior { get; set; }
        public string Mensaje_Discapacidad { get; set; }
        public DateTime Fecha_Actualizacion { get; set; } = DateTime.UtcNow;

        // Navegación
        public virtual Empleados Empleado { get; set; }
    }
}
