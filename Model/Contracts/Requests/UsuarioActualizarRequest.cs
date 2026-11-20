

namespace Model.Requests
{
    public class UsuarioActualizarRequest
    {
        public string Nombre_Usuario { get; set; }
        public string Password_Hash { get; set; }
        public string Estado { get; set; }
    }
}
