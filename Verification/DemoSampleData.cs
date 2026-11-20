using System.Security.Cryptography;
using BL.Application.Services;
using DA.Context;
using Microsoft.EntityFrameworkCore;
using Model.Entities;

// Datos ficticios generados para la base demo (capturas y pruebas manuales).
// Deterministas (semilla fija), sin datos personales y sin hashes reutilizables:
// las cuentas de ejemplo quedan BLOQUEADAS y su hash proviene de un secreto
// aleatorio que se descarta. Solo las tres cuentas demo de SeedAccounts inician sesión.
static class DemoSampleData
{
    public const int EmployeeCount = 24;
    public const int WorkDays = 20;
    public const string ContactDomain = "ejemplo.test";
    static readonly DateTime FirstWorkDay = new(2026, 10, 5); // lunes

    static readonly string[] FirstNames = { "Ana", "Luis", "Carla", "Diego", "Elena", "Marco", "Sofía", "Andrés", "Lucía", "Pablo", "Valeria", "Jorge" };
    static readonly string[] LastNames = { "Mora", "Rojas", "Vargas", "Jiménez", "Solano", "Araya", "Castro", "Quesada", "Chaves", "Ulate", "Brenes", "Salas" };

    static readonly (string Department, (string Name, decimal Salary)[] Positions)[] Structure =
    {
        ("Soporte Técnico", new[] { ("Técnico de soporte", 650000m), ("Coordinador de soporte", 980000m) }),
        ("Recursos Humanos", new[] { ("Asistente de RR. HH.", 600000m), ("Analista de RR. HH.", 850000m) }),
        ("Finanzas", new[] { ("Asistente contable", 620000m), ("Analista financiero", 900000m) }),
        ("Operaciones", new[] { ("Operario", 520000m), ("Supervisor de operaciones", 870000m) }),
    };

    public static async Task<int> Seed(AppDbContext db, Perfiles employeeProfile, Horarios shift, Empleados approver)
    {
        var random = new Random(2026);
        var positions = new List<Puestos>();
        foreach (var (departmentName, positionList) in Structure)
        {
            var department = new Departamentos { Nombre_Departamento = departmentName };
            db.Departamentos.Add(department);
            await db.SaveChangesAsync();
            foreach (var (name, salary) in positionList)
            {
                var position = new Puestos { Departamento_ID = department.Departamento_ID, Nombre_Puesto = name, Salario_Base = salary, Estado = "ACTIVO" };
                db.Puestos.Add(position);
                positions.Add(position);
            }
        }

        var absenceTypes = new[]
        {
            new TipoAusencia { Nombre_Ausencia = "Vacaciones", Porcentaje_Pago_Patrono = 100m, Requiere_Aprobacion = true, Descripcion = "Valor ficticio para la demo" },
            new TipoAusencia { Nombre_Ausencia = "Permiso con goce", Porcentaje_Pago_Patrono = 100m, Requiere_Aprobacion = true, Descripcion = "Valor ficticio para la demo" },
            new TipoAusencia { Nombre_Ausencia = "Permiso sin goce", Porcentaje_Pago_Patrono = 0m, Requiere_Aprobacion = true, Descripcion = "Valor ficticio para la demo" },
        };
        db.Tipos_Ausencia.AddRange(absenceTypes);
        await db.SaveChangesAsync();

        foreach (var (name, month, day) in new[] { ("Año Nuevo", 1, 1), ("Día de Juan Santamaría", 4, 11), ("Día del Trabajador", 5, 1),
                     ("Anexión de Guanacaste", 7, 25), ("Día de la Madre", 8, 15), ("Día de la Independencia", 9, 15), ("Navidad", 12, 25) })
            db.Feriados.Add(new Feriado { Nombre_Feriado = name, Fecha = new DateTime(2026, month, day), Es_Recurrente = true, Descripcion = "Feriado de Costa Rica", Fecha_Registro = FirstWorkDay });

        var used = new HashSet<string>();
        for (var i = 1; i <= EmployeeCount; i++)
        {
            string first, last1, last2;
            do
            {
                first = FirstNames[random.Next(FirstNames.Length)];
                last1 = LastNames[random.Next(LastNames.Length)];
                last2 = LastNames[random.Next(LastNames.Length)];
            } while (last1 == last2 || !used.Add(first + last1 + last2));

            var code = i.ToString("D4");
            var user = new Usuarios
            {
                Nombre_Usuario = $"empleado{code}.ejemplo@patitos.sa",
                Password_Hash = PasswordSecurity.Hash(Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))),
                Estado = "BLOQUEADO", Debe_Cambiar_Clave = true, Fecha_Creacion = FirstWorkDay,
            };
            var employee = new Empleados
            {
                Usuario = user, Perfil = employeeProfile, Puesto = positions[(i - 1) % positions.Count], Horario = shift,
                Cedula = "DEMO-" + code, Fecha_Ingreso = new DateTime(2024, 1, 8).AddDays(random.Next(600)),
                Fotografia_Url = "", Estado = i % 12 == 0 ? "INACTIVO" : "ACTIVO", Fecha_Registro = FirstWorkDay,
                InformacionPersonal = new InformacionPersonal
                {
                    Nombre_Empleado = $"{first} {last1} {last2}", Primer_Nombre = first, Segundo_Nombre = "",
                    Apellido_Paterno = last1, Apellido_Materno = last2, Fecha_Nacimiento = new DateTime(1985, 1, 1).AddDays(random.Next(5500)),
                    Genero = "No indicado", Estado_Civil = "No indicado", Pais_Demografico = "Costa Rica", Fecha_Actualizacion = FirstWorkDay,
                },
                InformacionContacto = new InformacionContacto
                {
                    Correo_Electronico = $"empleado{code}@{ContactDomain}", Correo_Electronico_Personal = "",
                    Telefono_Movil = "0000-" + code, Telefono_Fijo = "", Fecha_Actualizacion = FirstWorkDay,
                },
            };
            db.Empleados.Add(employee);

            for (var d = 0; d < WorkDays; d++)
            {
                var date = FirstWorkDay.AddDays(d / 5 * 7 + d % 5);
                var absent = random.NextDouble() < 0.05;
                employee.Asistencias.Add(new Asistencia
                {
                    Fecha = date, Estado_Asistencia = absent ? "AUSENTE" : "PRESENTE",
                    Fecha_Hora_Entrada = absent ? null : date.AddHours(8).AddMinutes(random.Next(-10, 25)),
                    Fecha_Hora_Salida = absent ? null : date.AddHours(17).AddMinutes(random.Next(-5, 40)),
                    Observaciones = absent ? "Registro ficticio" : null, Fecha_Registro = date,
                });
            }

            if (i % 3 == 0)
            {
                var start = FirstWorkDay.AddDays(28 + random.Next(30));
                var state = new[] { "PENDIENTE", "APROBADA", "RECHAZADA" }[random.Next(3)];
                employee.SolicitudesAusencia.Add(new SolicitudAusencia
                {
                    Tipo_Ausencia_ID = absenceTypes[random.Next(absenceTypes.Length)].Tipo_Ausencia_ID, Fecha_Inicio = start, Fecha_Fin = start.AddDays(random.Next(1, 4)),
                    Motivo = "Solicitud ficticia", Comentarios = "", Estado_Solicitud = state, Fecha_Solicitud = FirstWorkDay.AddDays(random.Next(20)),
                    Aprobador_ID = state == "PENDIENTE" ? null : approver.Empleado_ID, Fecha_Aprobacion = state == "PENDIENTE" ? null : FirstWorkDay.AddDays(21),
                });
            }
        }

        await db.SaveChangesAsync();
        return EmployeeCount;
    }

    public sealed record OrgRow(int EmpleadoId, int? JefeEmpleadoId, string Nivel, int GerenciaDepartamentoId, int AreaDepartamentoId);

    // Jerarquía demo para Estructura_Organizacional (la leen los reportes de asistencia,
    // empleados y evaluaciones; no está en el modelo de EF Core). El administrador es
    // gerente general; en cada departamento el primer empleado activo con el puesto de
    // mayor salario es jefe de área y el resto le reporta; las otras dos cuentas demo
    // reportan al administrador.
    public static List<OrgRow> BuildOrgStructure(IReadOnlyList<Empleados> accounts, IEnumerable<Empleados> sample)
    {
        var admin = accounts[0];
        var adminDepartment = admin.Puesto.Departamento_ID;
        var rows = new List<OrgRow> { new(admin.Empleado_ID, null, "GERENTE_GENERAL", adminDepartment, adminDepartment) };
        rows.AddRange(accounts.Skip(1).Select(e => new OrgRow(e.Empleado_ID, admin.Empleado_ID, "EMPLEADO_AREA", adminDepartment, adminDepartment)));

        foreach (var group in sample.GroupBy(e => e.Puesto.Departamento_ID).OrderBy(g => g.Key))
        {
            var members = group.OrderBy(e => e.Cedula).ToList();
            var topSalary = members.Max(e => e.Puesto.Salario_Base);
            var head = members.Where(e => e.Puesto.Salario_Base == topSalary)
                .OrderByDescending(e => e.Estado == "ACTIVO").First();
            rows.Add(new(head.Empleado_ID, admin.Empleado_ID, "JEFE_AREA", group.Key, group.Key));
            rows.AddRange(members.Where(e => e != head)
                .Select(e => new OrgRow(e.Empleado_ID, head.Empleado_ID, "EMPLEADO_AREA", group.Key, group.Key)));
        }
        return rows;
    }

    // Misma definición que la tabla heredada de ArchivoSQL; solo se escribe en SQL Server.
    // Con el proveedor InMemory (verificación sin base) devuelve las filas sin escribirlas.
    public static async Task<List<OrgRow>> SeedOrgStructure(AppDbContext db, IReadOnlyList<Empleados> accounts)
    {
        var accountIds = accounts.Select(e => e.Empleado_ID).ToHashSet();
        var sample = await db.Empleados.Include(e => e.Puesto)
            .Where(e => !accountIds.Contains(e.Empleado_ID)).ToListAsync();
        var rows = BuildOrgStructure(accounts, sample);
        if (!db.Database.IsRelational())
            return rows;

        await db.Database.ExecuteSqlRawAsync(@"
            IF OBJECT_ID('dbo.Estructura_Organizacional', 'U') IS NULL
            CREATE TABLE dbo.Estructura_Organizacional (
                Empleado_ID INT NOT NULL PRIMARY KEY,
                Jefe_Empleado_ID INT NULL,
                Nivel VARCHAR(30) NOT NULL,
                Gerencia_Departamento_ID INT NULL,
                Area_Departamento_ID INT NULL,
                Fecha_Registro DATETIME2(0) NOT NULL DEFAULT GETDATE(),
                CONSTRAINT FK_EO_Empleado FOREIGN KEY (Empleado_ID) REFERENCES Empleados(Empleado_ID),
                CONSTRAINT FK_EO_Jefe FOREIGN KEY (Jefe_Empleado_ID) REFERENCES Empleados(Empleado_ID),
                CONSTRAINT FK_EO_Gerencia FOREIGN KEY (Gerencia_Departamento_ID) REFERENCES Departamentos(Departamento_ID),
                CONSTRAINT FK_EO_Area FOREIGN KEY (Area_Departamento_ID) REFERENCES Departamentos(Departamento_ID)
            );");
        foreach (var row in rows)
            await db.Database.ExecuteSqlInterpolatedAsync($@"
                INSERT INTO dbo.Estructura_Organizacional
                    (Empleado_ID, Jefe_Empleado_ID, Nivel, Gerencia_Departamento_ID, Area_Departamento_ID, Fecha_Registro)
                VALUES ({row.EmpleadoId}, {row.JefeEmpleadoId}, {row.Nivel}, {row.GerenciaDepartamentoId}, {row.AreaDepartamentoId}, {FirstWorkDay})");
        return rows;
    }
}
