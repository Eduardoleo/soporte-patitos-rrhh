using BL.Interface;
using DA.Interfaces;
using Model.Entities;
using Model.Requests;

namespace BL.Servicios
{
    public class Colillas_PagoBL : IColillas_PagoBL
    {
        private readonly IColillas_PagoDA _colillasDA;
        public async Task<List<Colillas_Pago>> ObtenerTodos()
        {
            return await _colillasDA.ObtenerTodos();
        }
        public Colillas_PagoBL(IColillas_PagoDA colillasDA)
        {
            _colillasDA = colillasDA;
        }

        public async Task<List<Colillas_Pago>> ObtenerPorEmpleado(int empleadoId)
        {
            if (empleadoId <= 0)
                throw new ValidacionNominaException("El ID del empleado es inválido");

            return await _colillasDA.ObtenerPorEmpleado(empleadoId);
        }

        public async Task<List<Colillas_Pago>> ObtenerPorPlanilla(long planillaId)
        {
            if (planillaId <= 0)
                throw new ValidacionNominaException("El ID de la planilla es inválido");

            return await _colillasDA.ObtenerPorPlanilla(planillaId);
        }

        public async Task<Colillas_Pago> ObtenerPorId(long id)
        {
            if (id <= 0)
                throw new ValidacionNominaException("ID inválido");

            var colilla = await _colillasDA.ObtenerPorId(id);

            if (colilla == null)
                throw new RecursoNominaNoEncontradoException("Colilla de pago no encontrada");

            return colilla;
        }

        public async Task CrearColilla(CrearColillaPagoRequest request)
        {
            if (request == null)
                throw new ValidacionNominaException("Los datos son obligatorios");

            if (request.Planilla_ID <= 0)
                throw new ValidacionNominaException("La planilla es obligatoria");

            if (request.Empleado_ID <= 0)
                throw new ValidacionNominaException("El empleado es obligatorio");

            if (request.NetoEnviado)
                throw new ValidacionNominaException("No envíe Salario_Neto: el servidor calcula el neto de la colilla.");
            var salario = await _colillasDA.ObtenerSalarioPuestoEmpleado(request.Empleado_ID);
            var neto = CalculoColilla.CalcularNeto(salario, request.Pago_CCSS, request.Exoneraciones, request.Deducciones_Ausencias);

            var colilla = new Colillas_Pago
            {
                Planilla_ID = request.Planilla_ID,
                Empleado_ID = request.Empleado_ID,
                Pago_CCSS = request.Pago_CCSS,
                Exoneraciones = request.Exoneraciones,
                Deducciones_Ausencias = request.Deducciones_Ausencias,
                Salario_Puesto = salario!.Value,
                Salario_Neto = neto,
                Ruta_PDF = null,
                Fecha_Envio = null,
                Estado_Envio = "PENDIENTE"
            };

            await _colillasDA.Insertar(colilla);
        }

        public async Task ActualizarEstadoEnvio(long id, string estadoEnvio)
        {
            if (id <= 0)
                throw new ValidacionNominaException("ID inválido");

            if (string.IsNullOrWhiteSpace(estadoEnvio))
                throw new ValidacionNominaException("El estado de envío es obligatorio");

            if (estadoEnvio != "PENDIENTE" && estadoEnvio != "ENVIADO" && estadoEnvio != "ERROR")
                throw new ValidacionNominaException("El estado debe ser PENDIENTE, ENVIADO o ERROR");

            var colilla = await _colillasDA.ObtenerPorId(id);

            if (colilla == null)
                throw new RecursoNominaNoEncontradoException("Colilla de pago no encontrada");

            colilla.Estado_Envio = estadoEnvio;

            if (estadoEnvio == "ENVIADO")
                colilla.Fecha_Envio = DateTime.Now;

            await _colillasDA.Actualizar(colilla);
        }
    }
}