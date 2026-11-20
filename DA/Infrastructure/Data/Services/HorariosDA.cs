using DA.Interfaces;
using DA.Context;
using Model.Entities;
using Microsoft.EntityFrameworkCore;

namespace DA.Servicios
{
    public class HorariosDA:IHorariosDA
    {
        private readonly AppDbContext _context;

        public HorariosDA(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<Horarios>> ObtenerTodos()
        {
            return await _context.Horarios.ToListAsync();
        }

    }
}
