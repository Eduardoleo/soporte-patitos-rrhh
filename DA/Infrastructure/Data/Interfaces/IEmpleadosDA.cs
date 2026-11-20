

using Model.Entities;
using Model.Requests;
using Model.Responses;

namespace DA.Interfaces
{
    public interface IEmpleadosDA
    {
        Task<List<Empleados>> ObtenerTodos(bool incluirInactivos = false);
        Task<Empleados> ObtenerPorId(int id);
        Task<Empleados> ObtenerPorUsuarioId(int usuarioId);
        Task<Empleados> ObtenerPorCedula(string cedula);
        Task<Empleados> ObtenerPorNombre(string nombreEmpleado);
        Task InsertarDatos(Empleados empleado);
        Task ActualizarDatos(Empleados empleados);
        Task EliminarDatos(Empleados empleados);
        Task<List<ContactosEmergencia>> ObtenerContactosEmergencia(int empleadoId);

        // Ausencias y Notificaciones
        Task<List<TipoAusencia>> ObtenerTiposAusencia();
        Task<List<SolicitudAusencia>> ObtenerAusenciasEmpleado(int empleadoId);
        Task<List<ProgramaEquipoItemResponse>> ObtenerProgramaEquipo(int empleadoId);
        Task<List<DocumentoEmpleadoResponse>> ObtenerDocumentosEmitidos(int empleadoId);
        Task<BalanceAusenciasResponse> ObtenerBalanceAusencias(int empleadoId, DateTime fechaReferencia);
        Task<List<Feriado>> ObtenerFeriados();
        Task SolicitarAusencia(SolicitudAusencia solicitud);
        Task SolicitarCambioHorario(SolicitarCambioHorarioRequest request);
        Task<List<Notificacion>> ObtenerNotificaciones(int empleadoId);
        Task<SolicitudAusenciaDetalleResponse> ObtenerDetalleSolicitudAusencia(long solicitudId, int empleadoId);
        Task<string> ProcesarSolicitudAusencia(long solicitudId, int empleadoAprobadorId, string accion, string? comentario);
        Task<HorarioActualResponse> ObtenerHorarioActual(int empleadoId);
        Task CancelarAusencia(long solicitudId, int empleadoId);
        Task<InformacionEmpleoResponse> ObtenerInformacionEmpleo(int empleadoId);
        Task NotificarVacantePorInactivacion(int empleadoId, string motivoInactivo);
    }
}

