using API.Security;
using BL.Servicios;
using DA.Context;
using DA.Servicios;
using Microsoft.EntityFrameworkCore;
using Model.Entities;
using Model.Requests;

// Opt-in local integration test. All inserted rows are rolled back.
static class ColillaDemoPersistence
{
    private const string Connection =
        "Server=localhost;Database=SoportePatitos_Portafolio_Demo;" +
        "Integrated Security=True;TrustServerCertificate=True";

    public static async Task Run()
    {
        LocalDevelopmentSettings.Validate(Connection);
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer(Connection).Options;
        await using var context = new AppDbContext(options);
        await using var transaction = await context.Database.BeginTransactionAsync();
        long createdId = 0;
        long fixtureId = 0;
        try
        {
            var employee = await context.Empleados.AsNoTracking()
                .Where(e => e.Puesto != null && e.Puesto.Salario_Base > 1)
                .Select(e => new { e.Empleado_ID, Salary = e.Puesto.Salario_Base })
                .FirstOrDefaultAsync()
                ?? throw new InvalidOperationException("Demo requires an employee with a valid position salary.");
            var planillaId = await context.Planillas
                .Select(p => (long?)p.Planilla_ID).FirstOrDefaultAsync();
            if (planillaId == null)
            {
                var userId = await context.Usuarios.Select(u => u.Usuario_ID).FirstAsync();
                var fixture = new Planillas
                {
                    Periodo_Inicio = new DateTime(2026, 1, 1),
                    Periodo_Fin = new DateTime(2026, 1, 31),
                    Fecha_Generacion = new DateTime(2026, 1, 31),
                    Usuario_Generador_ID = userId,
                    Estado = "PENDIENTE"
                };
                context.Planillas.Add(fixture);
                await context.SaveChangesAsync();
                fixtureId = fixture.Planilla_ID;
                planillaId = fixtureId;
            }
            var service = new Colillas_PagoBL(new Colillas_PagoDA(context));
            await service.CrearColilla(new CrearColillaPagoRequest
            {
                Planilla_ID = planillaId.Value,
                Empleado_ID = employee.Empleado_ID,
                Pago_CCSS = 0.30m,
                Exoneraciones = 0.20m,
                Deducciones_Ausencias = 0.10m,
                Salario_Puesto = 999999m // Must never override the database salary.
            });
            createdId = context.ChangeTracker.Entries<Colillas_Pago>()
                .Single().Entity.Colilla_ID;
            context.ChangeTracker.Clear();
            var stored = await context.Colillas_Pago.AsNoTracking()
                .SingleAsync(c => c.Colilla_ID == createdId);
            if (stored.Salario_Puesto != employee.Salary ||
                stored.Salario_Neto != employee.Salary - 0.60m ||
                stored.Pago_CCSS != 0.30m || stored.Exoneraciones != 0.20m ||
                stored.Deducciones_Ausencias != 0.10m)
                throw new InvalidOperationException("Stored payroll amounts do not match the expected calculation.");
            Console.WriteLine("PASS SQL SP-02: real BL/DA persist salary and calculated net in demo.");
        }
        finally
        {
            await transaction.RollbackAsync();
        }
        context.ChangeTracker.Clear();
        if (await context.Colillas_Pago.AnyAsync(c => c.Colilla_ID == createdId) ||
            (fixtureId != 0 && await context.Planillas.AnyAsync(p => p.Planilla_ID == fixtureId)))
            throw new InvalidOperationException("Rollback did not remove the test rows.");
        Console.WriteLine("PASS SQL SP-02: rollback verified; test rows are absent.");
    }
}
