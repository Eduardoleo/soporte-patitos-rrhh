namespace Model.Responses
{
    public class ResumenAsistenciaDiaResponse
    {
        public DateTime Fecha { get; set; }
        public string HoraEntrada { get; set; }
        public string HoraSalida { get; set; }
        public int MinutosTardia { get; set; }
        public decimal HorasExtra { get; set; }
        public bool DiaEfectivoLaborado { get; set; }
    }
}
