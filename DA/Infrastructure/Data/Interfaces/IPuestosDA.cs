
using Model.Entities;

namespace DA.Interfaces
{
    public interface IPuestosDA
    {
        Task<List<Puestos>> ObtenerTodos();
    }
}
