using Model.Entities;
using Model.Requests;

namespace BL.Interface
{
    public interface IEvaluacionesBL
    {
        Task<List<Evaluaciones>> ObtenerTodos(int? empleadoSolicitanteId = null, bool soloPropias = false);
        Task<List<Evaluaciones>> ObtenerPorEmpleado(int empleadoId);
        Task<Evaluaciones> ObtenerPorId(long id);
        Task<long> CrearEvaluacion(CrearEvaluacionRequest request);
        Task ActualizarPromedio(long id, decimal promedio);
    }
}