using DA.Context;
using DA.Interfaces;
using Microsoft.EntityFrameworkCore;
using Model.Entities;

namespace DA.Servicios
{
    public class Evaluacion_DetalleDA : IEvaluacion_DetalleDA
    {
        private readonly AppDbContext _context;

        public async Task<List<Evaluacion_Detalle>> ObtenerTodos()
        {
            return await _context.Evaluacion_Detalle.ToListAsync();
        }

        public Evaluacion_DetalleDA(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<Evaluacion_Detalle>> ObtenerPorEvaluacion(long evaluacionId)
        {
            return await _context.Evaluacion_Detalle
                .Where(ed => ed.Evaluacion_ID == evaluacionId)
                .ToListAsync();
        }

        public async Task<Evaluacion_Detalle> ObtenerPorId(long id)
        {
            return await _context.Evaluacion_Detalle
                .FirstOrDefaultAsync(ed => ed.Evaluacion_Detalle_ID == id);
        }

        public async Task Insertar(Evaluacion_Detalle detalle)
        {
            await _context.Evaluacion_Detalle.AddAsync(detalle);
            await _context.SaveChangesAsync();
        }

        public async Task Actualizar(Evaluacion_Detalle detalle)
        {
            _context.Evaluacion_Detalle.Update(detalle);
            await _context.SaveChangesAsync();
        }
    }
}