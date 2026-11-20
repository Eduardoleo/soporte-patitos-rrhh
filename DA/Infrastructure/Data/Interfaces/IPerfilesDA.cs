
using Model.Entities;

namespace DA.Interfaces
{
    public interface IPerfilesDA
    {
        Task<List<Perfiles>> ObtenerTodos();
    }
}
