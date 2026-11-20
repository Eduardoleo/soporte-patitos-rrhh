using Model.Entities;

namespace BL.Interface
{
    public interface IPreguntas_EvaluacionBL
    {
        Task<List<Preguntas_Evaluacion>> ObtenerTodos();
        Task<Preguntas_Evaluacion> ObtenerPorId(int id);
    }
}