using Model.Entities;
using Model.Requests;
using Model.Responses;

namespace BL.Interface
{
    public interface IAsistenciaBL
    {
        Task<List<Asistencia>> ObtenerTodos();
        Task<List<Asistencia>> ObtenerPorEmpleado(int empleadoId);
        Task RegistrarEntrada(RegistrarEntradaRequest request);
        Task RegistrarSalida(RegistrarSalidaRequest request);
        Task RegistrarSalidaAlmuerzo(RegistrarSalidaAlmuerzoRequest request);
        Task RegistrarRegresoAlmuerzo(RegistrarRegresoAlmuerzoRequest request);
        Task JustificarIncidencia(JustificarIncidenciaAsistenciaRequest request);
        Task<EstadoRelojWebResponse> ObtenerEstadoRelojWeb(int empleadoId, DateTime fecha);
        Task<List<ResumenAsistenciaDiaResponse>> ObtenerResumenPeriodo(int empleadoId, DateTime desde, DateTime hasta);
        Task<List<AsistenciaGestionItemResponse>> ObtenerReporteGestion(DateTime fecha, int empleadoSolicitanteId, int? empleadoId, string? nombreEmpleado, string? gerencia);
    }
}