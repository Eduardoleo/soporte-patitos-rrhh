using DA.Context;
using DA.Interfaces;
using Microsoft.EntityFrameworkCore;
using Model.Entities;

namespace DA.Servicios
{
    public class Preguntas_EvaluacionDA : IPreguntas_EvaluacionDA
    {
        private readonly AppDbContext _context;

        public Preguntas_EvaluacionDA(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<Preguntas_Evaluacion>> ObtenerTodos()
        {
            return await _context.Preguntas_Evaluacion.ToListAsync();
        }

        public async Task<Preguntas_Evaluacion> ObtenerPorId(int id)
        {
            return await _context.Preguntas_Evaluacion
                .FirstOrDefaultAsync(p => p.Pregunta_ID == id);
        }
    }
}