using DA.Interfaces;
using DA.Context;
using Model.Entities;
using Microsoft.EntityFrameworkCore;

namespace DA.Servicios
{
    public class PuestosDA:IPuestosDA
    {
        private readonly AppDbContext _context;

        public PuestosDA(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<Puestos>> ObtenerTodos()
        {
            return await _context.Puestos.ToListAsync();
        }
    }
}
