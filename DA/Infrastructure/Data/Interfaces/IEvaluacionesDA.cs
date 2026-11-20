using Model.Entities;

namespace DA.Interfaces
{
    public interface IEvaluacionesDA
    {
        Task<List<Evaluaciones>> ObtenerTodos(int? empleadoSolicitanteId = null, bool soloPropias = false);
        Task<List<Evaluaciones>> ObtenerPorEmpleado(int empleadoId);
        Task<Evaluaciones> ObtenerPorId(long id);
        Task<long> Insertar(Evaluaciones evaluacion);
        Task Actualizar(Evaluaciones evaluacion);
    }
}