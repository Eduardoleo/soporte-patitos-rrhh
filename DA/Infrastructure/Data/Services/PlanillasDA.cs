using DA.Context;
using DA.Interfaces;
using Microsoft.EntityFrameworkCore;
using Model.Entities;

namespace DA.Servicios
{
    public class PlanillasDA : IPlanillasDA
    {
        private readonly AppDbContext _context;
        public async Task<List<Planillas>> ObtenerTodos()
        {
            return await _context.Planillas.ToListAsync();
        }
        public PlanillasDA(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<Planillas>> ObtenerPorPeriodo(DateTime periodoInicio, DateTime periodoFin)
        {
            return await _context.Planillas
                .Where(p => p.Periodo_Inicio == periodoInicio.Date && p.Periodo_Fin == periodoFin.Date)
                .ToListAsync();
        }

        public async Task<Planillas> ObtenerPorId(long id)
        {
            return await _context.Planillas
                .FirstOrDefaultAsync(p => p.Planilla_ID == id);
        }

        public async Task Insertar(Planillas planilla)
        {
            await _context.Planillas.AddAsync(planilla);
            await _context.SaveChangesAsync();
        }

        public async Task Actualizar(Planillas planilla)
        {
            _context.Planillas.Update(planilla);
            await _context.SaveChangesAsync();
        }
    }
}