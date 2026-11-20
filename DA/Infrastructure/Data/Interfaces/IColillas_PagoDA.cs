using Model.Entities;

namespace DA.Interfaces
{
    public interface IColillas_PagoDA
    {
        Task<List<Colillas_Pago>> ObtenerTodos();
        Task<List<Colillas_Pago>> ObtenerPorEmpleado(int empleadoId);
        Task<List<Colillas_Pago>> ObtenerPorPlanilla(long planillaId);
        Task<Colillas_Pago> ObtenerPorId(long id);
        Task<decimal?> ObtenerSalarioPuestoEmpleado(int empleadoId);
        Task Insertar(Colillas_Pago colilla);
        Task Actualizar(Colillas_Pago colilla);
    }
}