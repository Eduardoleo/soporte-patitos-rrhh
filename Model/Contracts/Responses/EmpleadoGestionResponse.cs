namespace Model.Responses
{
    public class EmpleadoGestionResponse
    {
        public int Empleado_ID { get; set; }
        public string Cedula { get; set; }
        public string Estado { get; set; }
        public DateTime Fecha_Ingreso { get; set; }
        public EmpleadoGestionInformacionPersonalResponse InformacionPersonal { get; set; }
        public EmpleadoGestionPuestoResponse Puesto { get; set; }
        public List<EmpleadoGestionContactoEmergenciaResponse> ContactosEmergencia { get; set; } = new();
    }

    public class EmpleadoGestionInformacionPersonalResponse
    {
        public string Nombre_Empleado { get; set; }
        public string Primer_Nombre { get; set; }
        public string Apellido_Paterno { get; set; }
        public string Apellido_Materno { get; set; }
    }

    public class EmpleadoGestionPuestoResponse
    {
        public int Puesto_ID { get; set; }
        public int Departamento_ID { get; set; }
        public string Nombre_Puesto { get; set; }
        public decimal Salario_Base { get; set; }
    }

    public class EmpleadoGestionContactoEmergenciaResponse
    {
        public int Contacto_ID { get; set; }
        public string Nombre_Completo { get; set; }
        public string Telefono_Contacto { get; set; }
        public string Relacion { get; set; }
    }
}
