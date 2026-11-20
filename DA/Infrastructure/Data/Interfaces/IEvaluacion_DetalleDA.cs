using Model.Entities;

namespace DA.Interfaces
{
    public interface IEvaluacion_DetalleDA
    {
        Task<List<Evaluacion_Detalle>> ObtenerTodos();
        Task<List<Evaluacion_Detalle>> ObtenerPorEvaluacion(long evaluacionId);
        Task<Evaluacion_Detalle> ObtenerPorId(long id);
        Task Insertar(Evaluacion_Detalle detalle);
        Task Actualizar(Evaluacion_Detalle detalle);
    }
}