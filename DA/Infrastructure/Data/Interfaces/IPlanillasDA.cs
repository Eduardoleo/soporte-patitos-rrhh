using Model.Entities;

namespace DA.Interfaces
{
    public interface IPlanillasDA
    {
        Task<List<Planillas>> ObtenerTodos();
        Task<List<Planillas>> ObtenerPorPeriodo(DateTime periodoInicio, DateTime periodoFin);
        Task<Planillas> ObtenerPorId(long id);
        Task Insertar(Planillas planilla);
        Task Actualizar(Planillas planilla);
    }
}