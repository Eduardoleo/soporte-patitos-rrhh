using BL.Application.Services;
using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using API.Security;
using DA.Context;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Model.Entities;

// Opt-in integration check. Commits temporary accounts for HTTP, then removes only its rows.
static class DemoProvisioningVerification
{
    private const string Connection =
        "Server=localhost;Database=SoportePatitos_Portafolio_Demo;" +
        "Integrated Security=True;TrustServerCertificate=True";

    private static AppDbContext Context() => new(
        new DbContextOptionsBuilder<AppDbContext>().UseSqlServer(Connection).Options);

    public static async Task Run()
    {
        LocalDevelopmentSettings.Validate(Connection);
        var suffix = "-" + Guid.NewGuid().ToString("N")[..8];
        var passwords = new[] { "Administrador", "Empleado", "Analista de Nómina" }
            .ToDictionary(role => role, _ => Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)));
        List<Empleados> employees = new();
        var fixtureCommitted = false;
        await using var db = Context();
        var before = await Counts(db);
        var originalUsers = await db.Usuarios.AsNoTracking()
            .Select(u => new { u.Usuario_ID, u.Password_Hash, u.Ultimo_Acceso, u.Estado }).ToListAsync();
        try
        {
            await using (var transaction = await db.Database.BeginTransactionAsync())
            {
                employees = await DemoDatabase.SeedAccounts(db, passwords, suffix);
                if (employees.Count != 3 || employees.Any(e =>
                    PasswordSecurity.Verify(e.Usuario.Password_Hash, passwords[e.Perfil.Nombre_Perfil])
                        == PasswordVerificationResult.Failed))
                    throw new InvalidOperationException("Demo provision/hash verification failed.");
                await transaction.CommitAsync();
                fixtureCommitted = true;
            }
            db.ChangeTracker.Clear();
            var ids = employees.Select(e => e.Empleado_ID).ToArray();
            var stored = await db.Empleados.AsNoTracking().Include(e => e.Perfil)
                .Include(e => e.Usuario).Include(e => e.Puesto).Include(e => e.InformacionPersonal)
                .Where(e => ids.Contains(e.Empleado_ID)).ToListAsync();
            if (stored.Count != 3 || stored.Any(e => e.Puesto.Salario_Base <= 0 ||
                e.InformacionPersonal == null || e.Usuario.Estado != "ACTIVO"))
                throw new InvalidOperationException("Demo account relationships failed.");
            Console.WriteLine("PASS SP-06: three accounts provisioned through the shared real seeder; hashes and relationships verified.");
            var credentials = stored.Select(e => new
            {
                username = e.Usuario.Nombre_Usuario,
                password = passwords[e.Perfil.Nombre_Perfil],
                role = e.Perfil.Nombre_Perfil
            }).ToArray();
            await VerifyHttp(credentials);
        }
        finally
        {
            if (fixtureCommitted) await Cleanup(employees);
        }
        await using var clean = Context();
        var after = await Counts(clean);
        var usersAfter = await clean.Usuarios.AsNoTracking()
            .Select(u => new { u.Usuario_ID, u.Password_Hash, u.Ultimo_Acceso, u.Estado }).ToListAsync();
        if (!before.SequenceEqual(after) || !originalUsers.OrderBy(u => u.Usuario_ID)
            .SequenceEqual(usersAfter.OrderBy(u => u.Usuario_ID)))
            throw new InvalidOperationException("Demo cleanup/original-account preservation failed.");
        Console.WriteLine("PASS SP-06: temporary rows removed; original accounts, passwords and last-access values unchanged.");
    }

    private static async Task VerifyHttp<T>(T credentials)
    {
        var root = Directory.GetCurrentDirectory();
        var script = Path.Combine(root, "Scripts", "verificar-api.ps1");
        var start = new ProcessStartInfo("powershell")
        {
            WorkingDirectory = root,
            RedirectStandardInput = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            StandardInputEncoding = new UTF8Encoding(false),
            StandardOutputEncoding = Encoding.UTF8,
            UseShellExecute = false,
            CreateNoWindow = true
        };
        start.ArgumentList.Add("-NoProfile");
        start.ArgumentList.Add("-Command");
        start.ArgumentList.Add("[Console]::InputEncoding=[Text.UTF8Encoding]::new($false); " +
            "[Console]::OutputEncoding=[Text.UTF8Encoding]::new($false); " +
            "& '" + script.Replace("'", "''") +
            "' -VerifyDemoLogins -DemoCredentialsFromStdin");
        using var process = Process.Start(start)
            ?? throw new InvalidOperationException("Unable to start local HTTP verification.");
        var output = process.StandardOutput.ReadToEndAsync();
        var errors = process.StandardError.ReadToEndAsync();
        await process.StandardInput.WriteAsync(JsonSerializer.Serialize(credentials));
        process.StandardInput.Close();
        using var timeout = new CancellationTokenSource(TimeSpan.FromMinutes(2));
        try { await process.WaitForExitAsync(timeout.Token); }
        catch (OperationCanceledException)
        {
            process.Kill(entireProcessTree: true);
            throw new InvalidOperationException("Local HTTP verification timed out; values omitted.");
        }
        var summary = await output;
        await errors; // Never print captured credentials or diagnostics.
        if (process.ExitCode != 0)
            throw new InvalidOperationException("Optional HTTP login verification failed; values omitted.");
        var count = System.Text.RegularExpressions.Regex.Match(summary, @"(\d+) verificaciones HTTP correctas");
        if (!count.Success) throw new InvalidOperationException("Missing HTTP verification summary.");
        Console.WriteLine("PASS SP-06: optional real HTTP login/role verification, " + count.Groups[1].Value + " checks.");
    }

    private static async Task<int[]> Counts(AppDbContext db) => new[]
    {
        await db.Usuarios.CountAsync(), await db.Empleados.CountAsync(),
        await db.Informacion_Personal.CountAsync(), await db.Perfiles.CountAsync(),
        await db.Puestos.CountAsync(), await db.Horarios.CountAsync(),
        await db.Departamentos.CountAsync()
    };

    private static async Task Cleanup(List<Empleados> employees)
    {
        await using var db = Context();
        await using var transaction = await db.Database.BeginTransactionAsync();
        var ids = employees.Select(e => e.Empleado_ID).ToArray();
        db.Informacion_Personal.RemoveRange(await db.Informacion_Personal.Where(p => ids.Contains(p.Empleado_ID)).ToListAsync());
        db.Empleados.RemoveRange(await db.Empleados.Where(e => ids.Contains(e.Empleado_ID)).ToListAsync());
        await db.SaveChangesAsync();
        var users = employees.Select(e => e.Usuario_ID).ToArray();
        var profiles = employees.Select(e => e.Perfil_ID).ToArray();
        db.Usuarios.RemoveRange(await db.Usuarios.Where(u => users.Contains(u.Usuario_ID)).ToListAsync());
        db.Perfiles.RemoveRange(await db.Perfiles.Where(p => profiles.Contains(p.Perfil_ID)).ToListAsync());
        db.Puestos.Remove(await db.Puestos.SingleAsync(p => p.Puesto_ID == employees[0].Puesto_ID));
        db.Horarios.Remove(await db.Horarios.SingleAsync(h => h.Horario_ID == employees[0].Horario_ID));
        await db.SaveChangesAsync();
        var departmentId = employees[0].Puesto.Departamento_ID;
        db.Departamentos.Remove(await db.Departamentos.SingleAsync(d => d.Departamento_ID == departmentId));
        await db.SaveChangesAsync();
        await transaction.CommitAsync();
    }
}
