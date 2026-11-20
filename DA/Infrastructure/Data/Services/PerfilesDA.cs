

using DA.Context;
using DA.Interfaces;
using Microsoft.EntityFrameworkCore;
using Model.Entities;

namespace DA.Servicios
{
    public class PerfilesDA:IPerfilesDA
    {
        private readonly AppDbContext _context;

        public PerfilesDA(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<Perfiles>> ObtenerTodos()
        {
            return await _context.Perfiles.ToListAsync();
        }
    }
}
