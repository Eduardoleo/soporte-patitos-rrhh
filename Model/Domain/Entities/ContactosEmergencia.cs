namespace Model.Entities
{
    public class ContactosEmergencia
    {
        public int Contacto_ID { get; set; }
        public int Empleado_ID { get; set; }
        public string Nombre_Completo { get; set; }
        public string Relacion { get; set; }
        public bool Es_Carga_Familiar { get; set; }
        public string Telefono_Contacto { get; set; }
        public DateTime Fecha_Registro { get; set; }
    }
}
