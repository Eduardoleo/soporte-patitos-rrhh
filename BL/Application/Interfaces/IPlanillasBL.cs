using Model.Entities;
using Model.Requests;

namespace BL.Interface
{
    public interface IPlanillasBL
    {
        Task<List<Planillas>> ObtenerTodos();
        Task<List<Planillas>> ObtenerPorPeriodo(DateTime periodoInicio, DateTime periodoFin);
        Task<Planillas> ObtenerPorId(long id);
        Task CrearPlanilla(CrearPlanillaRequest request);
        Task ActualizarEstado(long id, string estado);
    }
}