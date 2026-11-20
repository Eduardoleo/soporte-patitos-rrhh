namespace Model.Responses
{
    public class DocumentoEmpleadoResponse
    {
        public long DocumentoId { get; set; }
        public string TipoDocumento { get; set; }
        public string Titulo { get; set; }
        public string Descripcion { get; set; }
        public DateTime FechaDocumento { get; set; }
        public DateTime? UltimaActualizacion { get; set; }
        public string Estado { get; set; }
        public string Categoria { get; set; }
        public int CantidadAnexos { get; set; }
        public string RutaPdf { get; set; }
    }
}
