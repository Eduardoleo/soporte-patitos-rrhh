
using Model.Entities;

namespace DA.Interfaces
{
    public interface IHorariosDA
    {
        Task<List<Horarios>> ObtenerTodos();
    }
}
