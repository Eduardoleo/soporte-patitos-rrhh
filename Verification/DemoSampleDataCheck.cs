using System.Text.RegularExpressions;
using DA.Context;
using Microsoft.EntityFrameworkCore;
using Model.Entities;

// Verifica el generador de datos demo sin SQL Server (proveedor InMemory).
static class DemoSampleDataCheck
{
    public static async Task Run()
    {
        var first = await Generate();
        var second = await Generate();
        void Check(bool condition, string name)
        {
            if (!condition) throw new Exception("FAIL: " + name);
            Console.WriteLine("PASS: " + name);
        }

        Check(first.Names.Count == DemoSampleData.EmployeeCount && first.Names.Distinct().Count() == first.Names.Count, "Datos demo: 24 empleados con nombres únicos");
        Check(first.Names.SequenceEqual(second.Names), "Datos demo deterministas (semilla fija)");
        var org = first.Structure;
        Check(org.Count == DemoSampleData.EmployeeCount + 3 && org.Select(r => r.EmpleadoId).Distinct().Count() == org.Count, "Estructura demo: una fila por empleado (24 de ejemplo + 3 cuentas)");
        Check(org.Count(r => r.Nivel == "GERENTE_GENERAL") == 1 && org.Single(r => r.Nivel == "GERENTE_GENERAL") is { JefeEmpleadoId: null } gg && gg.EmpleadoId == first.AdminId, "Estructura demo: el administrador es el único gerente general");
        var heads = org.Where(r => r.Nivel == "JEFE_AREA").ToList();
        Check(heads.Count == 4 && heads.Select(r => r.AreaDepartamentoId).Distinct().Count() == 4 && heads.All(r => r.JefeEmpleadoId == first.AdminId), "Estructura demo: un jefe de área por departamento, que reporta al administrador");
        var ids = org.Select(r => r.EmpleadoId).ToHashSet();
        Check(org.Where(r => r.Nivel != "GERENTE_GENERAL").All(r => r.JefeEmpleadoId is int jefe && ids.Contains(jefe) && jefe != r.EmpleadoId), "Estructura demo: toda persona tiene jefatura dentro de la estructura");
        Check(org.Where(r => r.Nivel == "EMPLEADO_AREA" && r.JefeEmpleadoId != first.AdminId).All(r => heads.Any(h => h.EmpleadoId == r.JefeEmpleadoId && h.AreaDepartamentoId == r.AreaDepartamentoId)), "Estructura demo: cada empleado reporta al jefe de su departamento");
        Check(first.Attendance == DemoSampleData.EmployeeCount * DemoSampleData.WorkDays && first.Absences > 0 && first.Holidays == 7, "Datos demo: asistencia, ausencias y feriados");
        Check(first.Cedulas.All(c => Regex.IsMatch(c, "^DEMO-[A-Za-z0-9.]+$")), "Datos demo: cédulas ficticias DEMO-");
        Check(first.Emails.All(e => e.EndsWith("@" + DemoSampleData.ContactDomain)), "Datos demo: correos de contacto en ejemplo.test");
        Check(first.Phones.All(p => p.StartsWith("0000-")), "Datos demo: teléfonos ficticios 0000-");
        Check(first.SampleUsers.All(u => u.Estado == "BLOQUEADO" && u.Debe_Cambiar_Clave), "Datos demo: cuentas de ejemplo bloqueadas");
        Check(first.SampleUsers.Select(u => u.Password_Hash).Intersect(second.SampleUsers.Select(u => u.Password_Hash)).Count() == 0, "Datos demo: hashes de secretos descartados, no reutilizables");
    }

    sealed record Result(List<string> Names, int Attendance, int Absences, int Holidays, List<string> Cedulas, List<string> Emails, List<string> Phones, List<Usuarios> SampleUsers,
        List<DemoSampleData.OrgRow> Structure, int AdminId);

    static async Task<Result> Generate()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase("demo-" + Guid.NewGuid()).Options;
        await using var db = new AppDbContext(options);
        var passwords = new Dictionary<string, string> { ["Administrador"] = "solo-prueba-admin", ["Empleado"] = "solo-prueba-empleado", ["Analista de Nómina"] = "solo-prueba-nomina" };
        var accounts = await DemoDatabase.SeedAccounts(db, passwords, ".check");
        await DemoSampleData.Seed(db, accounts[1].Perfil, accounts[0].Horario, accounts[0]);
        var structure = await DemoSampleData.SeedOrgStructure(db, accounts);
        var sample = await db.Empleados.Include(e => e.Usuario).Include(e => e.InformacionPersonal).Include(e => e.InformacionContacto)
            .Where(e => e.Cedula.StartsWith("DEMO-0")).OrderBy(e => e.Cedula).ToListAsync();
        return new Result(
            sample.Select(e => e.InformacionPersonal.Nombre_Empleado).ToList(),
            await db.Asistencia.CountAsync(), await db.Solicitudes_Ausencia.CountAsync(), await db.Feriados.CountAsync(),
            await db.Empleados.Select(e => e.Cedula).ToListAsync(),
            sample.Select(e => e.InformacionContacto.Correo_Electronico).ToList(),
            sample.Select(e => e.InformacionContacto.Telefono_Movil).ToList(),
            sample.Select(e => e.Usuario).ToList(),
            structure, accounts[0].Empleado_ID);
    }
}
