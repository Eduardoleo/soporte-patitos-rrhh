using DA.Context;
using DA.Interfaces;
using Microsoft.EntityFrameworkCore;
using Model.Entities;

namespace DA.Servicios
{
    public class Colillas_PagoDA : IColillas_PagoDA
    {
        private readonly AppDbContext _context;
        public async Task<List<Colillas_Pago>> ObtenerTodos()
        {
            return await _context.Colillas_Pago.ToListAsync();
        }
        public Colillas_PagoDA(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<Colillas_Pago>> ObtenerPorEmpleado(int empleadoId)
        {
            return await _context.Colillas_Pago
                .Where(c => c.Empleado_ID == empleadoId)
                .ToListAsync();
        }

        public async Task<List<Colillas_Pago>> ObtenerPorPlanilla(long planillaId)
        {
            return await _context.Colillas_Pago
                .Where(c => c.Planilla_ID == planillaId)
                .ToListAsync();
        }

        public async Task<Colillas_Pago> ObtenerPorId(long id)
        {
            return await _context.Colillas_Pago
                .FirstOrDefaultAsync(c => c.Colilla_ID == id);
        }

        public async Task<decimal?> ObtenerSalarioPuestoEmpleado(int empleadoId)
        {
            return await _context.Empleados
                .Where(e => e.Empleado_ID == empleadoId && e.Puesto != null)
                .Select(e => (decimal?)e.Puesto.Salario_Base)
                .SingleOrDefaultAsync();
        }

        public async Task Insertar(Colillas_Pago colilla)
        {
            await _context.Colillas_Pago.AddAsync(colilla);
            await _context.SaveChangesAsync();
        }

        public async Task Actualizar(Colillas_Pago colilla)
        {
            _context.Colillas_Pago.Update(colilla);
            await _context.SaveChangesAsync();
        }
    }
}