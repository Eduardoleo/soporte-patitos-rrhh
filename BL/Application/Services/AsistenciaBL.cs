using BL.Interface;
using DA.Interfaces;
using Model.Entities;
using Model.Requests;
using Model.Responses;

namespace BL.Servicios
{
    public class AsistenciaBL : IAsistenciaBL
    {
        private readonly IAsistenciaDA _asistenciaDA;
        public async Task<List<Asistencia>> ObtenerTodos()
        {
            return await _asistenciaDA.ObtenerTodos();
        }
        public AsistenciaBL(IAsistenciaDA asistenciaDA)
        {
            _asistenciaDA = asistenciaDA;
        }

        public async Task<List<Asistencia>> ObtenerPorEmpleado(int empleadoId)
        {
            if (empleadoId <= 0)
                throw new ArgumentException("El ID del empleado es inválido");

            return await _asistenciaDA.ObtenerPorEmpleado(empleadoId);
        }

        public async Task RegistrarEntrada(RegistrarEntradaRequest request)
        {
            if (request == null)
                throw new ArgumentException("Los datos son obligatorios");

            if (request.Empleado_ID <= 0)
                throw new ArgumentException("El empleado es obligatorio");

            ValidarMarcaSoloDiaActual(request.Fecha_Hora_Entrada);
            await ValidarSinAusenciaActiva(request.Empleado_ID, request.Fecha_Hora_Entrada);

            var existente = await _asistenciaDA.ObtenerPorFecha(
                request.Empleado_ID,
                request.Fecha_Hora_Entrada);

            if (existente != null)
                throw new Exception("Ya existe un registro de asistencia para este empleado en esa fecha");

            await _asistenciaDA.RegistrarEntrada(request.Empleado_ID, request.Fecha_Hora_Entrada);
        }

        public async Task RegistrarSalida(RegistrarSalidaRequest request)
        {
            if (request == null)
                throw new ArgumentException("Los datos son obligatorios");

            if (request.Empleado_ID <= 0)
                throw new ArgumentException("El empleado es obligatorio");

            ValidarMarcaSoloDiaActual(request.Fecha_Hora_Salida);
            await ValidarSinAusenciaActiva(request.Empleado_ID, request.Fecha_Hora_Salida);

            var asistencia = await _asistenciaDA.ObtenerPorFecha(
                request.Empleado_ID,
                request.Fecha_Hora_Salida);

            if (asistencia == null)
                throw new Exception("No existe una asistencia registrada para este empleado en esa fecha");

            if (asistencia.Fecha_Hora_Entrada == null)
                throw new Exception("No se puede registrar salida sin una entrada previa");

            await _asistenciaDA.RegistrarSalida(request.Empleado_ID, request.Fecha_Hora_Salida);
        }

        public async Task RegistrarSalidaAlmuerzo(RegistrarSalidaAlmuerzoRequest request)
        {
            if (request == null)
                throw new ArgumentException("Los datos son obligatorios");

            if (request.Empleado_ID <= 0)
                throw new ArgumentException("El empleado es obligatorio");

            ValidarMarcaSoloDiaActual(request.Fecha_Hora_Salida_Almuerzo);
            await ValidarSinAusenciaActiva(request.Empleado_ID, request.Fecha_Hora_Salida_Almuerzo);

            var asistencia = await _asistenciaDA.ObtenerPorFecha(request.Empleado_ID, request.Fecha_Hora_Salida_Almuerzo);
            if (asistencia == null || asistencia.Fecha_Hora_Entrada == null)
                throw new Exception("Debe registrar entrada antes de salida de almuerzo");

            await _asistenciaDA.RegistrarSalidaAlmuerzo(request.Empleado_ID, request.Fecha_Hora_Salida_Almuerzo);
        }

        public async Task RegistrarRegresoAlmuerzo(RegistrarRegresoAlmuerzoRequest request)
        {
            if (request == null)
                throw new ArgumentException("Los datos son obligatorios");

            if (request.Empleado_ID <= 0)
                throw new ArgumentException("El empleado es obligatorio");

            ValidarMarcaSoloDiaActual(request.Fecha_Hora_Regreso_Almuerzo);
            await ValidarSinAusenciaActiva(request.Empleado_ID, request.Fecha_Hora_Regreso_Almuerzo);

            var asistencia = await _asistenciaDA.ObtenerPorFecha(request.Empleado_ID, request.Fecha_Hora_Regreso_Almuerzo);
            if (asistencia == null || asistencia.Fecha_Hora_Entrada == null)
                throw new Exception("Debe registrar entrada antes del regreso de almuerzo");

            await _asistenciaDA.RegistrarRegresoAlmuerzo(request.Empleado_ID, request.Fecha_Hora_Regreso_Almuerzo);
        }

        public async Task JustificarIncidencia(JustificarIncidenciaAsistenciaRequest request)
        {
            if (request == null)
                throw new ArgumentException("Los datos son obligatorios");

            if (request.Empleado_ID <= 0)
                throw new ArgumentException("El empleado es obligatorio");

            if (string.IsNullOrWhiteSpace(request.Motivo))
                throw new ArgumentException("El motivo es obligatorio");

            if (string.IsNullOrWhiteSpace(request.Tipo))
                throw new ArgumentException("Debe indicar el tipo de incidencia");

            await _asistenciaDA.JustificarIncidencia(request);
        }

        public async Task<EstadoRelojWebResponse> ObtenerEstadoRelojWeb(int empleadoId, DateTime fecha)
        {
            if (empleadoId <= 0)
                throw new ArgumentException("El ID del empleado es inválido");

            return await _asistenciaDA.ObtenerEstadoRelojWeb(empleadoId, fecha);
        }

        public async Task<List<ResumenAsistenciaDiaResponse>> ObtenerResumenPeriodo(int empleadoId, DateTime desde, DateTime hasta)
        {
            if (empleadoId <= 0)
                throw new ArgumentException("El ID del empleado es inválido");

            if (hasta.Date < desde.Date)
                throw new ArgumentException("El rango de fechas es inválido");

            return await _asistenciaDA.ObtenerResumenPeriodo(empleadoId, desde.Date, hasta.Date);
        }

        public async Task<List<AsistenciaGestionItemResponse>> ObtenerReporteGestion(DateTime fecha, int empleadoSolicitanteId, int? empleadoId, string? nombreEmpleado, string? gerencia)
        {
            var fechaFiltro = fecha == DateTime.MinValue ? DateTime.Today : fecha.Date;

            if (empleadoSolicitanteId <= 0)
                throw new ArgumentException("El empleado solicitante es inválido");

            if (empleadoId.HasValue && empleadoId.Value <= 0)
                throw new ArgumentException("El ID del empleado es inválido");

            return await _asistenciaDA.ObtenerReporteGestion(fechaFiltro, empleadoSolicitanteId, empleadoId, nombreEmpleado, gerencia);
        }

        private static void ValidarMarcaSoloDiaActual(DateTime fechaMarca)
        {
            var hoyCr = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, ObtenerZonaCostaRica()).Date;
            if (fechaMarca.Date != hoyCr)
                throw new Exception("Reloj Web solo permite marcas del día actual.");
        }

        private async Task ValidarSinAusenciaActiva(int empleadoId, DateTime fechaMarca)
        {
            var tieneAusencia = await _asistenciaDA.TieneAusenciaActivaEnFecha(empleadoId, fechaMarca.Date);
            if (tieneAusencia)
                throw new Exception("No se puede marcar asistencia en una fecha con ausencia activa (pendiente o aprobada).");
        }

        private static TimeZoneInfo ObtenerZonaCostaRica()
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById("Central America Standard Time");
            }
            catch
            {
                return TimeZoneInfo.FindSystemTimeZoneById("America/Costa_Rica");
            }
        }
    }
}