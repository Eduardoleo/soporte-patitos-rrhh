
using Model.Entities;

namespace BL.Interface
{
    public interface IPuestosBL
    {
        Task<List<Puestos>> ObtenerTodos();
    }
}
