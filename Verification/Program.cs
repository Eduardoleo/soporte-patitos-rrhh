using System.Diagnostics;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using API.Security;
using BL.Application.Services;
using DA.Context;
using DA.Servicios;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Model.Entities;

if (args.Contains("--verify-demo-provisioning"))
{
    await DemoProvisioningVerification.Run();
    return;
}

if (args.Contains("--verify-colilla-demo"))
{
    await ColillaDemoPersistence.Run();
    return;
}

if (args.Contains("--create-demo"))
{
    await DemoDatabase.Create();
    return;
}

await NegocioNomina.Run();
await ColillasAuthorization.Run();
await ConsistenciaColillas.Run();
await ErroresNominaPublicos.Run();
await DemoSampleDataCheck.Run();

int checks = 0;
void Check(bool condition, string name)
{
    if (!condition) throw new Exception("FAIL: " + name);
    checks++;
    Console.WriteLine("PASS: " + name);
}
bool AcceptsLocal(string connection)
{
    try { LocalDevelopmentSettings.Validate(connection); return true; }
    catch (Exception ex) when (ex is ArgumentException or InvalidOperationException) { return false; }
}
const string local = "Server=localhost;Database=SoportePatitos_Portafolio_Demo;Integrated Security=True";
foreach (var alias in new[] { ".", "127.0.0.1" })
    Check(AcceptsLocal(local.Replace("localhost", alias)), "Alias local estándar permitido: " + alias);
foreach (var alias in new[] { "(local)", "::1", "localhost\\SQLEXPRESS", "localhost,1433" })
    Check(!AcceptsLocal(local.Replace("localhost", alias)), "Alias fuera de la lista bloqueado: " + alias);
Check(AcceptsLocal(local), "Conexión local con identidad Windows permitida");
Check(!AcceptsLocal(local.Replace("localhost", "servidor.example.invalid")), "Servidor ajeno bloqueado");
Check(!AcceptsLocal(local.Replace("SoportePatitos_Portafolio_Demo", "Soporte_Patitos")), "Base original bloqueada en Development");
Check(!AcceptsLocal(local.Replace("Integrated Security=True", "User ID=usuario_demo;Password=solo-prueba")), "Cuenta SQL heredada bloqueada");
Check(!AcceptsLocal(local + ";Failover Partner=servidor.example.invalid"), "Destino alternativo externo bloqueado");
Check(!AcceptsLocal(local + ";Server=servidor.example.invalid"), "Servidor duplicado no evita validación");
var password = "Solo-para-pruebas-123!";
var hash = PasswordSecurity.Hash(password);
Check(hash != PasswordSecurity.Hash(password), "Hash con salt distinto para la misma contraseña");
Check(PasswordSecurity.Verify(hash, password) == PasswordVerificationResult.Success, "Contraseña nueva válida");
Check(PasswordSecurity.Verify(hash, "incorrecta") == PasswordVerificationResult.Failed, "Rechazo de contraseña incorrecta");
var oldHash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(password)));
Check(PasswordSecurity.Verify(oldHash, password) == PasswordVerificationResult.SuccessRehashNeeded, "Migración SHA-256 tras validación");
Check(PasswordSecurity.Verify(oldHash, "incorrecta") == PasswordVerificationResult.Failed, "SHA-256 incorrecto no se migra");
Check(PasswordSecurity.Verify("malformado", password) == PasswordVerificationResult.Failed, "Hash malformado rechazado");
Check(!JsonSerializer.Serialize(new Usuarios { Password_Hash = hash }).Contains(hash), "Hash no aparece en JSON");
ClaimsPrincipal User(string role, string id = "1") => new(new ClaimsIdentity(new[] {
    new Claim(ClaimTypes.Role, role), new Claim(ClaimTypes.NameIdentifier, id)
}, "test"));
Check(AccessRules.IsAdmin(User("Administrador")), "Rol administrador válido");
Check(!AccessRules.IsAdmin(User("NO_ADMIN")), "No se conceden roles por subcadenas");
Check(AccessRules.CanReadPayroll(User("Analista de Nómina")), "Nómina con acento");
Check(!AccessRules.CanReadPayroll(User("Empleado")), "Empleado sin permiso de planillas");
Check(AccessRules.CanChangePassword(User("Empleado"), 1), "Cambio de clave propia");
Check(!AccessRules.CanChangePassword(User("Empleado"), 2), "Cambio de clave ajena bloqueado");
Check(!AccessRules.CanReadPayroll(new ClaimsPrincipal()), "Identidad anónima rechazada");

var random = new Random(42);
var attendance = Enumerable.Range(0, 3000).Select(i => new Asistencia {
    Asistencia_ID = i + 1, Empleado_ID = random.Next(1, 1001)
}).ToList();
var absences = Enumerable.Range(0, 5000).Select(i => new SolicitudAusencia {
    Solicitud_ID = i + 1, Empleado_ID = random.Next(1, 1001), Fecha_Solicitud = new DateTime(2026, 1, 1).AddDays(random.Next(30))
}).ToList();
var index = new AttendanceReportIndex(attendance, absences);
Check(Enumerable.Range(0, 1002).All(id =>
    ReferenceEquals(index.AttendanceFor(id), attendance.FirstOrDefault(a => a.Empleado_ID == id)) &&
    ReferenceEquals(index.AbsenceFor(id), absences.Where(a => a.Empleado_ID == id).OrderByDescending(a => a.Fecha_Solicitud).FirstOrDefault())),
    "Reporte equivalente con duplicados, empates y empleados sin registros");
Check(new AttendanceReportIndex(Array.Empty<Asistencia>(), Array.Empty<SolicitudAusencia>()).AbsenceFor(1) == null, "Reporte vacío");

long OldLoop() => Enumerable.Range(1, 1000).Sum(id =>
    (attendance.FirstOrDefault(a => a.Empleado_ID == id)?.Asistencia_ID ?? 0) +
    (absences.Where(a => a.Empleado_ID == id).OrderByDescending(a => a.Fecha_Solicitud).FirstOrDefault()?.Solicitud_ID ?? 0));
long NewLoop()
{
    var lookup = new AttendanceReportIndex(attendance, absences);
    return Enumerable.Range(1, 1000).Sum(id => (lookup.AttendanceFor(id)?.Asistencia_ID ?? 0) + (lookup.AbsenceFor(id)?.Solicitud_ID ?? 0));
}
Check(OldLoop() == NewLoop(), "Benchmark conserva resultados");
double Measure(Func<long> action)
{
    var times = new List<double>();
    for (var i = 0; i < 9; i++) { var sw = Stopwatch.StartNew(); var result = action(); sw.Stop(); GC.KeepAlive(result); times.Add(sw.Elapsed.TotalMilliseconds); }
    return times.Order().ElementAt(4);
}
Console.WriteLine(JsonSerializer.Serialize(new { checks, employees = 1000, attendance = 3000, absences = 5000,
    originalMedianMs = Measure(OldLoop), indexedMedianMs = Measure(NewLoop), scope = "Solo CPU en memoria; incluye construir índice; no mide SQL ni HTTP" }));

static class DemoDatabase
{
    public static async Task Create()
    {
        // Destino fijo: nunca reutilizar ni resetear la base original.
        const string connection = "Server=localhost;Database=SoportePatitos_Portafolio_Demo;Integrated Security=True;Encrypt=True;TrustServerCertificate=True;Connect Timeout=5";
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlServer(connection).Options);
        if (await db.Database.CanConnectAsync())
            throw new InvalidOperationException("La base demo ya existe. Se conserva sin cambios; no se restablecen usuarios ni claves.");
        var demoRoles = new[] { ("Administrador", "admin.demo"), ("Empleado", "empleado.demo"), ("Analista de Nómina", "nomina.demo") };
        var demoPasswords = demoRoles.ToDictionary(item => item.Item1, item => ReadDemoPassword(item.Item1));
        await db.Database.EnsureCreatedAsync();
        await using var transaction = await db.Database.BeginTransactionAsync();
        var accounts = await SeedAccounts(db, demoPasswords);
        var sample = await DemoSampleData.Seed(db, accounts[1].Perfil, accounts[0].Horario, accounts[0]);
        var structure = await DemoSampleData.SeedOrgStructure(db, accounts);
        await transaction.CommitAsync();
        Console.WriteLine($"Base demo creada con tres identidades ficticias, {sample} empleados de ejemplo bloqueados y {structure.Count} filas de Estructura_Organizacional. No se guardaron contraseñas en archivos.");
    }

    // Shared by new-database provisioning and the isolated integration fixture.
    public static async Task<List<Empleados>> SeedAccounts(
        AppDbContext db, IReadOnlyDictionary<string, string> demoPasswords,
        string suffix = "")
    {
        var employees = new List<Empleados>();
        var demoRoles = new[] { ("Administrador", "admin.demo"), ("Empleado", "empleado.demo"), ("Analista de Nómina", "nomina.demo") };
        var department = Fill(new Departamentos());
        department.Nombre_Departamento = "Departamento Demo " + suffix;
        db.Departamentos.Add(department);
        var shift = new Horarios { Nombre_Horario = "Demo diurno " + suffix, Hora_Entrada = TimeSpan.FromHours(8), Hora_Salida = TimeSpan.FromHours(17), Descripcion = "Horario ficticio" };
        db.Horarios.Add(shift);
        await db.SaveChangesAsync();
        var position = Fill(new Puestos());
        position.Departamento_ID = department.Departamento_ID;
        position.Nombre_Puesto = "Puesto Demo " + suffix;
        position.Salario_Base = 500000m;
        position.Estado = "ACTIVO";
        db.Puestos.Add(position);
        await db.SaveChangesAsync();
        foreach (var (role, name) in demoRoles)
        {
            var profile = Fill(new Perfiles());
            profile.Nombre_Perfil = role;
            var secret = demoPasswords[role];
            var user = new Usuarios { Nombre_Usuario = name + suffix + "@patitos.sa", Password_Hash = PasswordSecurity.Hash(secret),
                Estado = "ACTIVO", Fecha_Creacion = DateTime.UtcNow, Debe_Cambiar_Clave = false };
            var employee = new Empleados { Usuario = user, Perfil = profile, Puesto = position, Horario = shift,
                Cedula = "DEMO-" + name + suffix, Fecha_Ingreso = new DateTime(2025, 1, 1), Fotografia_Url = "", Estado = "ACTIVO" };
            var personal = Fill(new InformacionPersonal());
            personal.Nombre_Empleado = "Persona " + name;
            employee.InformacionPersonal = personal;
            db.Empleados.Add(employee);
            await db.SaveChangesAsync();
            employees.Add(employee);
        }
        return employees;
    }

    private static string ReadDemoPassword(string role)
    {
        if (Console.IsInputRedirected)
            throw new InvalidOperationException("La provisión requiere una terminal interactiva para contraseñas demo.");
        Console.Write("Contraseña ficticia para " + role + " (entrada oculta): ");
        var password = new StringBuilder();
        while (true)
        {
            var key = Console.ReadKey(intercept: true);
            if (key.Key == ConsoleKey.Enter) break;
            if (key.Key == ConsoleKey.Backspace)
            {
                if (password.Length > 0) password.Length--;
            }
            else if (!char.IsControl(key.KeyChar)) password.Append(key.KeyChar);
        }
        Console.WriteLine();
        if (password.Length < 12)
            throw new InvalidOperationException("La contraseña demo debe tener al menos 12 caracteres.");
        return password.ToString();
    }

    private static T Fill<T>(T entity)
    {
        foreach (var property in typeof(T).GetProperties().Where(p => p.PropertyType == typeof(string) && p.CanWrite))
            property.SetValue(entity, "Demo");
        return entity;
    }
}
