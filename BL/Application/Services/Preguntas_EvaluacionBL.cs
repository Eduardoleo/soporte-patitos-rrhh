using BL.Interface;
using DA.Interfaces;
using Model.Entities;

namespace BL.Servicios
{
    public class Preguntas_EvaluacionBL : IPreguntas_EvaluacionBL
    {
        private readonly IPreguntas_EvaluacionDA _preguntasDA;

        public Preguntas_EvaluacionBL(IPreguntas_EvaluacionDA preguntasDA)
        {
            _preguntasDA = preguntasDA;
        }

        public async Task<List<Preguntas_Evaluacion>> ObtenerTodos()
        {
            return await _preguntasDA.ObtenerTodos();
        }

        public async Task<Preguntas_Evaluacion> ObtenerPorId(int id)
        {
            if (id <= 0)
                throw new ArgumentException("ID inválido");

            var pregunta = await _preguntasDA.ObtenerPorId(id);

            if (pregunta == null)
                throw new Exception("Pregunta no encontrada");

            return pregunta;
        }
    }
}