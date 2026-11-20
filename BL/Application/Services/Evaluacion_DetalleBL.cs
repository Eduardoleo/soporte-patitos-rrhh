using BL.Interface;
using DA.Interfaces;
using Model.Entities;
using Model.Requests;

namespace BL.Servicios
{
    public class Evaluacion_DetalleBL : IEvaluacion_DetalleBL
    {
        private readonly IEvaluacion_DetalleDA _detalleDA;
        public async Task<List<Evaluacion_Detalle>> ObtenerTodos()
        {
            return await _detalleDA.ObtenerTodos();
        }
        public Evaluacion_DetalleBL(IEvaluacion_DetalleDA detalleDA)
        {
            _detalleDA = detalleDA;
        }

        public async Task<List<Evaluacion_Detalle>> ObtenerPorEvaluacion(long evaluacionId)
        {
            if (evaluacionId <= 0)
                throw new ArgumentException("El ID de la evaluación es inválido");

            return await _detalleDA.ObtenerPorEvaluacion(evaluacionId);
        }

        public async Task<Evaluacion_Detalle> ObtenerPorId(long id)
        {
            if (id <= 0)
                throw new ArgumentException("ID inválido");

            var detalle = await _detalleDA.ObtenerPorId(id);

            if (detalle == null)
                throw new Exception("Detalle de evaluación no encontrado");

            return detalle;
        }

        public async Task CrearDetalle(CrearEvaluacionDetalleRequest request)
        {
            if (request == null)
                throw new ArgumentException("Los datos son obligatorios");

            if (request.Evaluacion_ID <= 0)
                throw new ArgumentException("La evaluación es obligatoria");

            if (request.Pregunta_ID <= 0)
                throw new ArgumentException("La pregunta es obligatoria");

            if (request.Calificacion < 1 || request.Calificacion > 10)
                throw new ArgumentException("La calificación debe estar entre 1 y 10");

            var detalle = new Evaluacion_Detalle
            {
                Evaluacion_ID = request.Evaluacion_ID,
                Pregunta_ID = request.Pregunta_ID,
                Calificacion = request.Calificacion
            };

            await _detalleDA.Insertar(detalle);
        }

        public async Task ActualizarCalificacion(long id, int calificacion)
        {
            if (id <= 0)
                throw new ArgumentException("ID inválido");

            if (calificacion < 1 || calificacion > 10)
                throw new ArgumentException("La calificación debe estar entre 1 y 10");

            var detalle = await _detalleDA.ObtenerPorId(id);

            if (detalle == null)
                throw new Exception("Detalle de evaluación no encontrado");

            detalle.Calificacion = calificacion;

            await _detalleDA.Actualizar(detalle);
        }
    }
}