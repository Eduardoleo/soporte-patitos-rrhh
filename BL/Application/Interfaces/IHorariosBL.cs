
using Model.Entities;

namespace BL.Interface
{
    public interface IHorariosBL
    {
        Task<List<Horarios>> ObtenerTodos();
    }
}
