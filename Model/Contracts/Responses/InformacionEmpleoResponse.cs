using System;
using System.Collections.Generic;

namespace Model.Responses
{
    public class InformacionEmpleoResponse
    {
        public DetallesPuesto DetallesPuesto { get; set; } = new DetallesPuesto();
        public DetallesIndividuales DetallesIndividuales { get; set; } = new DetallesIndividuales();
        public List<HistorialPuesto> HistorialPuestos { get; set; } = new List<HistorialPuesto>();
    }

    public class DetallesPuesto
    {
        public string Gerencia { get; set; }
        public string Gerente { get; set; }
        public string JefeInmediato { get; set; }
        public string Empleado { get; set; }
        public string PuestoDesempenado { get; set; }
    }

    public class DetallesIndividuales
    {
        public string Puesto { get; set; }
        public string Horario { get; set; }
        public decimal Salario { get; set; }
    }

    public class HistorialPuesto
    {
        public string Gerencia { get; set; }
        public string Puesto { get; set; }
        public decimal Salario { get; set; }
        public DateTime FechaInicio { get; set; }
        public DateTime? FechaFin { get; set; }
    }
}
