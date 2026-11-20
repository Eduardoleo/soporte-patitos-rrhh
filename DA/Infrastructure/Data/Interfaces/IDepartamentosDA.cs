
using Model.Entities;

namespace DA.Interfaces
{
    public interface IDepartamentosDA
    {
        Task<List<Departamentos>> ObtenerTodos();
    }
}
