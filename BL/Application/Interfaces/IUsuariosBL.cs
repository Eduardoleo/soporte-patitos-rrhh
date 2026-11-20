
using Model.Entities;
using Model.Requests;

namespace BL.Interface
{
    public interface IUsuariosBL
    {
        Task<List<Usuarios>> ObtenerTodos();
        Task<Usuarios> ObtenerPorId(int id);
        Task<Usuarios> ObtenerPorNombre(string nombreUsuario);
        Task <Usuarios>CrearUsuario(Usuarios usuario);
        Task<Usuarios> ActualizarUsuario(int id ,UsuarioActualizarRequest request);
        Task EliminarUsuario(int id);
        Task CambiarPassword(int id, string nuevaPassword);
        Task ActualizarUltimoAcceso(int id, DateTime fecha);
        Task<Usuarios> Login(string usuario, string password);
    }
}
