using Model.Entities;

namespace BL.Interface
{
    public interface IDepartamentosBL
    {
        Task<List<Departamentos>> ObtenerTodos();
    }
}
