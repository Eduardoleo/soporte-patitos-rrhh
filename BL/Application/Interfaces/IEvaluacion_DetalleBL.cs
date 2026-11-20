using Model.Entities;
using Model.Requests;

namespace BL.Interface
{
    public interface IEvaluacion_DetalleBL
    {
        Task<List<Evaluacion_Detalle>> ObtenerTodos();
        Task<List<Evaluacion_Detalle>> ObtenerPorEvaluacion(long evaluacionId);
        Task<Evaluacion_Detalle> ObtenerPorId(long id);
        Task CrearDetalle(CrearEvaluacionDetalleRequest request);
        Task ActualizarCalificacion(long id, int calificacion);
    }
}