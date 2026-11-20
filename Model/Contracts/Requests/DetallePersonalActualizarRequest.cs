namespace Model.Requests
{
    public class DetallePersonalActualizarRequest
    {
        public string Apellido_Paterno { get; set; }
        public string Apellido_Materno { get; set; }
        public string Primer_Nombre { get; set; }
        public string Segundo_Nombre { get; set; }
        public DateTime Fecha_Ingreso { get; set; }
        public DateTime? Fecha_Nacimiento { get; set; }
        public string Fotografia_Url { get; set; }
        public string Pais_Demografico { get; set; }
        public string Estado_Civil { get; set; }
        public string Genero { get; set; }
        public string Nivel_Educacion_Superior { get; set; }
        public string Pais_Identificacion { get; set; }
        public string Tipo_Identificador_Nacional { get; set; }
        public string Identificador_Nacional { get; set; }
        public string Pais_Seguridad_Social { get; set; }
        public string Tipo_Seguridad_Social { get; set; }
        public string Identificador_Seguridad_Social { get; set; }
        public string Mensaje_Discapacidad { get; set; }
        public string Correo_Electronico { get; set; }
        public string Correo_Electronico_Personal { get; set; }
        public string Telefono_Movil { get; set; }
        public string Direccion_Pais { get; set; }
        public string Direccion_Provincia { get; set; }
        public string Direccion_Canton { get; set; }
        public string Direccion_Distrito { get; set; }
        public string Direccion_Exacta { get; set; }
    }
}
