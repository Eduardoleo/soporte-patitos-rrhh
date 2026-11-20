using Model.Entities;

namespace DA.Interfaces
{
    public interface IPreguntas_EvaluacionDA
    {
        Task<List<Preguntas_Evaluacion>> ObtenerTodos();
        Task<Preguntas_Evaluacion> ObtenerPorId(int id);
    }
}