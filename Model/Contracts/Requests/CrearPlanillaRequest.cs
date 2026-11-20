using System;

namespace Model.Requests
{
    public class CrearPlanillaRequest
    {
        public DateTime Periodo_Inicio { get; set; }
        public DateTime Periodo_Fin { get; set; }
        public int Usuario_Generador_ID { get; set; }
    }
}