using BL.Interface;
using DA.Interfaces;
using Model.Entities;
using Model.Requests;

namespace BL.Servicios
{
    public class PlanillasBL : IPlanillasBL
    {
        private readonly IPlanillasDA _planillasDA;
        public async Task<List<Planillas>> ObtenerTodos()
        {
            return await _planillasDA.ObtenerTodos();
        }
        public PlanillasBL(IPlanillasDA planillasDA)
        {
            _planillasDA = planillasDA;
        }

        public async Task<List<Planillas>> ObtenerPorPeriodo(DateTime periodoInicio, DateTime periodoFin)
        {
            if (periodoInicio == default || periodoFin == default)
                throw new ValidacionNominaException("Las fechas del período son obligatorias");

            if (periodoInicio > periodoFin)
                throw new ValidacionNominaException("La fecha de inicio no puede ser mayor que la fecha final");

            return await _planillasDA.ObtenerPorPeriodo(periodoInicio, periodoFin);
        }

        public async Task<Planillas> ObtenerPorId(long id)
        {
            if (id <= 0)
                throw new ValidacionNominaException("ID inválido");

            var planilla = await _planillasDA.ObtenerPorId(id);

            if (planilla == null)
                throw new RecursoNominaNoEncontradoException("Planilla no encontrada");

            return planilla;
        }

        public async Task CrearPlanilla(CrearPlanillaRequest request)
        {
            if (request == null)
                throw new ValidacionNominaException("Los datos son obligatorios");

            if (request.Periodo_Inicio == default || request.Periodo_Fin == default)
                throw new ValidacionNominaException("Las fechas del período son obligatorias");

            if (request.Periodo_Inicio > request.Periodo_Fin)
                throw new ValidacionNominaException("La fecha de inicio no puede ser mayor que la fecha final");

            if (request.Usuario_Generador_ID <= 0)
                throw new ValidacionNominaException("El usuario generador es obligatorio");

            var planilla = new Planillas
            {
                Periodo_Inicio = request.Periodo_Inicio.Date,
                Periodo_Fin = request.Periodo_Fin.Date,
                Fecha_Generacion = DateTime.Now,
                Usuario_Generador_ID = request.Usuario_Generador_ID,
                Estado = "GENERADA"
            };

            await _planillasDA.Insertar(planilla);
        }

        public async Task ActualizarEstado(long id, string estado)
        {
            if (id <= 0)
                throw new ValidacionNominaException("ID inválido");

            if (string.IsNullOrWhiteSpace(estado))
                throw new ValidacionNominaException("El estado es obligatorio");

            if (estado != "GENERADA" && estado != "ENVIADA" && estado != "ANULADA")
                throw new ValidacionNominaException("El estado debe ser GENERADA, ENVIADA o ANULADA");

            var planilla = await _planillasDA.ObtenerPorId(id);

            if (planilla == null)
                throw new RecursoNominaNoEncontradoException("Planilla no encontrada");

            planilla.Estado = estado;

            await _planillasDA.Actualizar(planilla);
        }
    }
}