using Model.Entities;
using Model.Requests;

namespace BL.Interface
{
    public interface IColillas_PagoBL
    {
        Task<List<Colillas_Pago>> ObtenerTodos();
        Task<List<Colillas_Pago>> ObtenerPorEmpleado(int empleadoId);
        Task<List<Colillas_Pago>> ObtenerPorPlanilla(long planillaId);
        Task<Colillas_Pago> ObtenerPorId(long id);
        Task CrearColilla(CrearColillaPagoRequest request);
        Task ActualizarEstadoEnvio(long id, string estadoEnvio);
    }
}