namespace Model.Responses
{
    public class HorarioActualResponse
    {
        public int EmpleadoId { get; set; }
        public int HorarioId { get; set; }
        public string NombreHorario { get; set; }
        public string HoraEntrada { get; set; }
        public string HoraSalida { get; set; }
        public string Descripcion { get; set; }
    }
}
