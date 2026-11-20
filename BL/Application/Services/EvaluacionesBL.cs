using BL.Interface;
using DA.Interfaces;
using Model.Entities;
using Model.Requests;

namespace BL.Servicios
{
    public class EvaluacionesBL : IEvaluacionesBL
    {
        private readonly IEvaluacionesDA _evaluacionesDA;

        public async Task<List<Evaluaciones>> ObtenerTodos(int? empleadoSolicitanteId = null, bool soloPropias = false)
        {
            return await _evaluacionesDA.ObtenerTodos(empleadoSolicitanteId, soloPropias);
        }

        public EvaluacionesBL(IEvaluacionesDA evaluacionesDA)
        {
            _evaluacionesDA = evaluacionesDA;
        }

        public async Task<long> CrearEvaluacion(CrearEvaluacionRequest request)
        {
            if (request == null)
                throw new ArgumentException("Los datos son obligatorios");

            if (request.Empleado_ID <= 0)
                throw new ArgumentException("El empleado es obligatorio");

            if (request.Usuario_Evaluador_ID <= 0)
                throw new ArgumentException("El usuario evaluador es obligatorio");

            var evaluacion = new Evaluaciones
            {
                Empleado_ID = request.Empleado_ID,
                Usuario_Evaluador_ID = request.Usuario_Evaluador_ID,
                Fecha_Evaluacion = DateTime.Now,
                Observaciones = request.Observaciones,
                Promedio = null
            };

            return await _evaluacionesDA.Insertar(evaluacion);
        }

        public async Task<List<Evaluaciones>> ObtenerPorEmpleado(int empleadoId)
        {
            if (empleadoId <= 0)
                throw new ArgumentException("El ID del empleado es inválido");

            return await _evaluacionesDA.ObtenerPorEmpleado(empleadoId);
        }

        public async Task<Evaluaciones> ObtenerPorId(long id)
        {
            if (id <= 0)
                throw new ArgumentException("ID inválido");

            var evaluacion = await _evaluacionesDA.ObtenerPorId(id);

            if (evaluacion == null)
                throw new Exception("Evaluación no encontrada");

            return evaluacion;
        }

        public async Task ActualizarPromedio(long id, decimal promedio)
        {
            if (id <= 0)
                throw new ArgumentException("ID inválido");

            if (promedio < 0 || promedio > 10)
                throw new ArgumentException("El promedio debe estar entre 0 y 10");

            var evaluacion = await _evaluacionesDA.ObtenerPorId(id);

            if (evaluacion == null)
                throw new Exception("Evaluación no encontrada");

            evaluacion.Promedio = promedio;

            await _evaluacionesDA.Actualizar(evaluacion);
        }
    }
}