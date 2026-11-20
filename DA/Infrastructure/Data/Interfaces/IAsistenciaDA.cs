using Model.Entities;
using Model.Requests;
using Model.Responses;

namespace DA.Interfaces
{
    public interface IAsistenciaDA
    {
        Task<List<Asistencia>> ObtenerTodos();
        Task<List<Asistencia>> ObtenerPorEmpleado(int empleadoId);
        Task<Asistencia> ObtenerPorFecha(int empleadoId, DateTime fecha);
        Task RegistrarEntrada(int empleadoId, DateTime fechaHora);
        Task RegistrarSalida(int empleadoId, DateTime fechaHora);
        Task RegistrarSalidaAlmuerzo(int empleadoId, DateTime fechaHora);
        Task RegistrarRegresoAlmuerzo(int empleadoId, DateTime fechaHora);
        Task JustificarIncidencia(JustificarIncidenciaAsistenciaRequest request);
        Task<EstadoRelojWebResponse> ObtenerEstadoRelojWeb(int empleadoId, DateTime fecha);
        Task<List<ResumenAsistenciaDiaResponse>> ObtenerResumenPeriodo(int empleadoId, DateTime desde, DateTime hasta);
        Task<List<AsistenciaGestionItemResponse>> ObtenerReporteGestion(DateTime fecha, int empleadoSolicitanteId, int? empleadoId, string? nombreEmpleado, string? gerencia);
        Task Actualizar(Asistencia asistencia);
        Task<bool> TieneAusenciaActivaEnFecha(int empleadoId, DateTime fecha);
    }
}