using DA.Interfaces;
using DA.Context;
using Model.Entities;
using Microsoft.EntityFrameworkCore;

namespace DA.Servicios
{
    public class DepartamentosDA:IDepartamentosDA
    {
        private readonly AppDbContext _context;

        public DepartamentosDA(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<Departamentos>> ObtenerTodos()
        {
            return await _context.Departamentos.ToListAsync();
        }
    }
}
