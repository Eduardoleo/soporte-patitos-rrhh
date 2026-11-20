
namespace Model.Requests
{
    public class CrearEmpleadoRequest
    {
        public string Nombre_Empleado { get; set; }
        public string Cedula { get; set; }
        public string Correo_Electronico { get; set; }
        public int Usuario_ID { get; set; }
        public int Perfil_ID { get; set; }
        public int Puesto_ID { get; set; }
        public int Horario_ID { get; set; }

    }
}
