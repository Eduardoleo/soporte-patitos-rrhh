

namespace Model.Entities
{
    public class Puestos
    {
     
        public int Puesto_ID { get; set; }

        public int Departamento_ID { get; set; }
        public string Nombre_Puesto { get; set; }
        public decimal Salario_Base { get; set; }
        public string Estado { get; set; }
    }
}
