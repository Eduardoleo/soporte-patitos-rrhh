namespace Model.Responses
{
    public class ProgramaEquipoItemResponse
    {
        public int EmpleadoId { get; set; }
        public string CodigoEmpleado { get; set; }
        public string NombreCompleto { get; set; }
        public string Puesto { get; set; }
        public string Area { get; set; }
        public string HorarioNombre { get; set; }
        public string HoraEntrada { get; set; }
        public string HoraSalida { get; set; }
        public decimal HorasSemanales { get; set; }
    }
}
