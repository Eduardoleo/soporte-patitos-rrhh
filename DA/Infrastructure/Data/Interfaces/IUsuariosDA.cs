using Model.Entities;



namespace DA.Interfaces
{
    public interface IUsuariosDA
    {
        Task<List<Usuarios>> ObtenerTodos();
        Task<Usuarios> ObtenerPorId(int id);
        Task<Usuarios> ObtenerPorNombre(string nombreUsuario);
        Task InsertarDatos(Usuarios usuario);
        Task ActualizarDatos(Usuarios usuario);
        Task EliminarDatos(Usuarios usuario);
        Task CambiarPassword(Usuarios usuario); 
        Task ActualizarUltimoAcceso(Usuarios usuario);
        
    }
}
