using DA.Context;
using DA.Interfaces;
using Microsoft.EntityFrameworkCore;
using Model.Entities;

namespace DA.Servicios
{
    public class EvaluacionesDA : IEvaluacionesDA
    {
        private readonly AppDbContext _context;

        private class EstructuraActual
        {
            public int EmpleadoId { get; set; }
            public int? JefeEmpleadoId { get; set; }
        }

        public async Task<List<Evaluaciones>> ObtenerTodos(int? empleadoSolicitanteId = null, bool soloPropias = false)
        {
            var query = _context.Evaluaciones.AsQueryable();

            if (empleadoSolicitanteId.HasValue && empleadoSolicitanteId.Value > 0)
            {
                if (soloPropias)
                {
                    query = query.Where(e => e.Empleado_ID == empleadoSolicitanteId.Value);
                }
                else
                {
                    var estructura = await ObtenerEstructuraActual();
                    var permitidos = ObtenerDescendientes(empleadoSolicitanteId.Value, estructura);
                    query = query.Where(e => permitidos.Contains(e.Empleado_ID));
                }
            }

            query = query.Where(e => _context.Empleados
                .Any(emp => emp.Empleado_ID == e.Empleado_ID && (emp.Estado ?? string.Empty).ToUpper().StartsWith("ACTIVO")));

            return await query.ToListAsync();
        }

        public EvaluacionesDA(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<Evaluaciones>> ObtenerPorEmpleado(int empleadoId)
        {
            return await _context.Evaluaciones
                .Where(e => e.Empleado_ID == empleadoId)
                .ToListAsync();
        }

        public async Task<Evaluaciones> ObtenerPorId(long id)
        {
            return await _context.Evaluaciones
                .FirstOrDefaultAsync(e => e.Evaluacion_ID == id);
        }

        public async Task<long> Insertar(Evaluaciones evaluacion)
        {
            await _context.Evaluaciones.AddAsync(evaluacion);
            await _context.SaveChangesAsync();
            return evaluacion.Evaluacion_ID;
        }

        public async Task Actualizar(Evaluaciones evaluacion)
        {
            _context.Evaluaciones.Update(evaluacion);
            await _context.SaveChangesAsync();
        }

        private async Task<List<EstructuraActual>> ObtenerEstructuraActual()
        {
            var resultado = new List<EstructuraActual>();

            using var command = _context.Database.GetDbConnection().CreateCommand();
            command.CommandText = @"
                IF OBJECT_ID('dbo.Estructura_Organizacional', 'U') IS NOT NULL
                BEGIN
                    WITH Ultima AS (
                        SELECT
                            eo.Empleado_ID,
                            eo.Jefe_Empleado_ID,
                            ROW_NUMBER() OVER (PARTITION BY eo.Empleado_ID ORDER BY eo.Fecha_Registro DESC) AS rn
                        FROM Estructura_Organizacional eo
                    )
                    SELECT Empleado_ID, Jefe_Empleado_ID
                    FROM Ultima
                    WHERE rn = 1
                END
            ";

            if (command.Connection.State != System.Data.ConnectionState.Open)
                await command.Connection.OpenAsync();

            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var empleadoId = reader["Empleado_ID"] == DBNull.Value ? 0 : Convert.ToInt32(reader["Empleado_ID"]);
                if (empleadoId <= 0)
                    continue;

                resultado.Add(new EstructuraActual
                {
                    EmpleadoId = empleadoId,
                    JefeEmpleadoId = reader["Jefe_Empleado_ID"] == DBNull.Value ? null : Convert.ToInt32(reader["Jefe_Empleado_ID"])
                });
            }

            return resultado;
        }

        private static HashSet<int> ObtenerDescendientes(int jefeRaizId, List<EstructuraActual> estructura)
        {
            var resultado = new HashSet<int>();
            var pendientes = new Queue<int>();
            pendientes.Enqueue(jefeRaizId);

            while (pendientes.Count > 0)
            {
                var actual = pendientes.Dequeue();
                var hijos = estructura
                    .Where(x => x.JefeEmpleadoId == actual)
                    .Select(x => x.EmpleadoId)
                    .ToList();

                foreach (var hijo in hijos)
                {
                    if (resultado.Add(hijo))
                        pendientes.Enqueue(hijo);
                }
            }

            return resultado;
        }
    }
}