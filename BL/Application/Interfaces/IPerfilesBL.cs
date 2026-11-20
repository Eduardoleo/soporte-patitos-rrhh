using Model.Entities;

namespace BL.Interface
{
    public interface IPerfilesBL
    {
        Task<List<Perfiles>> ObtenerTodos();
    }
}
