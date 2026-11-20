namespace Model.Contracts.Responses
{
    public class LoginResponse
    {
        public int UsuarioId { get; set; }
        public string NombreUsuario { get; set; }
        public string Nombre { get; set; }
        public string Perfil { get; set; }
        public string Token { get; set; }
        public DateTime ExpiresAt { get; set; }
        public int EmpleadoId { get; set; }
        public string FotografiaUrl { get; set; }
        public bool DebeCambiarClave { get; set; }
    }
}
