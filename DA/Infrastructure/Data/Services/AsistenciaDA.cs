using DA.Context;
using DA.Interfaces;
using Microsoft.EntityFrameworkCore;
using Model.Entities;
using Model.Requests;
using Model.Responses;
using System.Text.Json;

namespace DA.Servicios
{
    public class AsistenciaDA : IAsistenciaDA
    {
        private readonly AppDbContext _context;

        private class ObservacionAsistenciaData
        {
            public DateTime? SalidaAlmuerzo { get; set; }
            public DateTime? RegresoAlmuerzo { get; set; }
            public string MotivoTardanza { get; set; }
            public string MotivoAusencia { get; set; }
        }

        private class EstructuraOrgActual
        {
            public int EmpleadoId { get; set; }
            public int? JefeEmpleadoId { get; set; }
            public int? GerenciaDepartamentoId { get; set; }
        }

        public async Task<List<Asistencia>> ObtenerTodos()
        {
            return await _context.Asistencia.ToListAsync();
        }

        public AsistenciaDA(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<Asistencia>> ObtenerPorEmpleado(int empleadoId)
        {
            return await _context.Asistencia
                .Where(a => a.Empleado_ID == empleadoId)
                .ToListAsync();
        }

        public async Task<Asistencia> ObtenerPorFecha(int empleadoId, DateTime fecha)
        {
            return await _context.Asistencia
                .FirstOrDefaultAsync(a => a.Empleado_ID == empleadoId && a.Fecha == fecha.Date);
        }

        public async Task RegistrarEntrada(int empleadoId, DateTime fechaHora)
        {
            var fechaHoraCr = NormalizarAHoraCostaRica(fechaHora);

            var asistencia = new Asistencia
            {
                Empleado_ID = empleadoId,
                Fecha = fechaHoraCr.Date,
                Fecha_Hora_Entrada = fechaHoraCr,
                Fecha_Hora_Salida = null,
                Estado_Asistencia = "PRESENTE",
                Observaciones = null,
                Fecha_Registro = ObtenerAhoraCostaRica()
            };

            await _context.Asistencia.AddAsync(asistencia);
            await _context.SaveChangesAsync();
        }

        public async Task RegistrarSalida(int empleadoId, DateTime fechaHora)
        {
            var fechaHoraCr = NormalizarAHoraCostaRica(fechaHora);

            var asistencia = await _context.Asistencia
                .FirstOrDefaultAsync(a => a.Empleado_ID == empleadoId && a.Fecha == fechaHoraCr.Date);

            if (asistencia != null)
            {
                asistencia.Fecha_Hora_Salida = fechaHoraCr;
                _context.Asistencia.Update(asistencia);
                await _context.SaveChangesAsync();
            }
        }

        public async Task RegistrarSalidaAlmuerzo(int empleadoId, DateTime fechaHora)
        {
            var fechaHoraCr = NormalizarAHoraCostaRica(fechaHora);

            var asistencia = await _context.Asistencia
                .FirstOrDefaultAsync(a => a.Empleado_ID == empleadoId && a.Fecha == fechaHoraCr.Date);

            if (asistencia == null)
                return;

            var data = LeerObservaciones(asistencia.Observaciones);
            data.SalidaAlmuerzo = fechaHoraCr;
            asistencia.Observaciones = EscribirObservaciones(data);

            _context.Asistencia.Update(asistencia);
            await _context.SaveChangesAsync();
        }

        public async Task RegistrarRegresoAlmuerzo(int empleadoId, DateTime fechaHora)
        {
            var fechaHoraCr = NormalizarAHoraCostaRica(fechaHora);

            var asistencia = await _context.Asistencia
                .FirstOrDefaultAsync(a => a.Empleado_ID == empleadoId && a.Fecha == fechaHoraCr.Date);

            if (asistencia == null)
                return;

            var data = LeerObservaciones(asistencia.Observaciones);
            data.RegresoAlmuerzo = fechaHoraCr;
            asistencia.Observaciones = EscribirObservaciones(data);

            _context.Asistencia.Update(asistencia);
            await _context.SaveChangesAsync();
        }

        public async Task JustificarIncidencia(JustificarIncidenciaAsistenciaRequest request)
        {
            var fechaCr = NormalizarAHoraCostaRica(request.Fecha);

            var asistencia = await _context.Asistencia
                .FirstOrDefaultAsync(a => a.Empleado_ID == request.Empleado_ID && a.Fecha == fechaCr.Date);

            if (asistencia == null)
            {
                asistencia = new Asistencia
                {
                    Empleado_ID = request.Empleado_ID,
                    Fecha = fechaCr.Date,
                    Estado_Asistencia = "AUSENTE",
                    Fecha_Registro = ObtenerAhoraCostaRica()
                };

                await _context.Asistencia.AddAsync(asistencia);
            }

            var data = LeerObservaciones(asistencia.Observaciones);

            if ((request.Tipo ?? string.Empty).Equals("TARDANZA", StringComparison.OrdinalIgnoreCase))
            {
                data.MotivoTardanza = request.Motivo;
            }
            else
            {
                data.MotivoAusencia = request.Motivo;
            }

            asistencia.Observaciones = EscribirObservaciones(data);
            _context.Asistencia.Update(asistencia);

            var destinoAprobacion = await ObtenerDestinoAprobacion(request.Empleado_ID);
            var notificacion = new Notificacion
            {
                Empleado_Origen_ID = request.Empleado_ID,
                Empleado_Destino_ID = destinoAprobacion,
                Titulo = "Justificación de asistencia",
                Mensaje = $"Se registró una justificación de {(request.Tipo ?? "INCIDENCIA")} para la fecha {fechaCr:dd/MM/yyyy}.",
                Referencia_Tipo = "ASISTENCIA",
                Referencia_ID = asistencia.Asistencia_ID,
                Estado = "EN CURSO"
            };

            await _context.Notificaciones.AddAsync(notificacion);
            await _context.SaveChangesAsync();
        }

        public async Task<EstadoRelojWebResponse> ObtenerEstadoRelojWeb(int empleadoId, DateTime fecha)
        {
            var horarioEmpleado = await (from e in _context.Empleados
                                         where e.Empleado_ID == empleadoId
                                         join h in _context.Horarios on e.Horario_ID equals h.Horario_ID into horarios
                                         from h in horarios.DefaultIfEmpty()
                                         select new
                                         {
                                             EmpleadoId = e.Empleado_ID,
                                             HoraEntrada = (TimeSpan?)h.Hora_Entrada,
                                             HoraSalida = (TimeSpan?)h.Hora_Salida
                                         })
                                .FirstOrDefaultAsync();

            if (horarioEmpleado == null)
                return null;

            var asistencia = await _context.Asistencia
                .FirstOrDefaultAsync(a => a.Empleado_ID == empleadoId && a.Fecha == fecha.Date);

            var data = LeerObservaciones(asistencia?.Observaciones);

            var horaEntradaProgramada = fecha.Date.Add(horarioEmpleado.HoraEntrada ?? TimeSpan.Zero);
            var horaSalidaProgramada = fecha.Date.Add(horarioEmpleado.HoraSalida ?? TimeSpan.Zero);

            var minutosTardia = 0;
            if (asistencia?.Fecha_Hora_Entrada != null && asistencia.Fecha_Hora_Entrada.Value > horaEntradaProgramada)
            {
                minutosTardia = (int)Math.Round((asistencia.Fecha_Hora_Entrada.Value - horaEntradaProgramada).TotalMinutes);
            }

            var horasExtra = 0m;
            if (asistencia?.Fecha_Hora_Salida != null && asistencia.Fecha_Hora_Salida.Value > horaSalidaProgramada)
            {
                horasExtra = (decimal)Math.Round((asistencia.Fecha_Hora_Salida.Value - horaSalidaProgramada).TotalHours, 2);
            }

            var requiereJustificacionTardia = minutosTardia > 20 && string.IsNullOrWhiteSpace(data.MotivoTardanza);

            var ahora = ObtenerAhoraCostaRica();
            var noMarcoEntrada = asistencia?.Fecha_Hora_Entrada == null;
            var pasoMediaHora = ahora > horaEntradaProgramada.AddMinutes(30);
            var requiereJustificacionAusencia = noMarcoEntrada && pasoMediaHora && string.IsNullOrWhiteSpace(data.MotivoAusencia);

            var estadoDia = asistencia?.Estado_Asistencia ?? "PENDIENTE";

            return new EstadoRelojWebResponse
            {
                EmpleadoId = empleadoId,
                Fecha = fecha.Date,
                HoraEntradaProgramada = horaEntradaProgramada.ToString("HH:mm"),
                HoraSalidaProgramada = horaSalidaProgramada.ToString("HH:mm"),
                HoraEntradaMarcada = asistencia?.Fecha_Hora_Entrada?.ToString("HH:mm:ss"),
                HoraSalidaAlmuerzo = data.SalidaAlmuerzo?.ToString("HH:mm:ss"),
                HoraRegresoAlmuerzo = data.RegresoAlmuerzo?.ToString("HH:mm:ss"),
                HoraSalidaMarcada = asistencia?.Fecha_Hora_Salida?.ToString("HH:mm:ss"),
                MinutosTardia = minutosTardia,
                HorasExtra = horasExtra,
                RequiereJustificacionTardia = requiereJustificacionTardia,
                RequiereJustificacionAusencia = requiereJustificacionAusencia,
                EstadoDia = estadoDia
            };
        }

        public async Task<List<ResumenAsistenciaDiaResponse>> ObtenerResumenPeriodo(int empleadoId, DateTime desde, DateTime hasta)
        {
            var horarioEmpleado = await (from e in _context.Empleados
                                         where e.Empleado_ID == empleadoId
                                         join h in _context.Horarios on e.Horario_ID equals h.Horario_ID into horarios
                                         from h in horarios.DefaultIfEmpty()
                                         select new
                                         {
                                             HoraEntrada = (TimeSpan?)h.Hora_Entrada,
                                             HoraSalida = (TimeSpan?)h.Hora_Salida
                                         })
                                .FirstOrDefaultAsync();

            if (horarioEmpleado == null)
                return new List<ResumenAsistenciaDiaResponse>();

            var asistencias = await _context.Asistencia
                .Where(a => a.Empleado_ID == empleadoId && a.Fecha >= desde.Date && a.Fecha <= hasta.Date)
                .OrderBy(a => a.Fecha)
                .ToListAsync();

            return asistencias.Select(a =>
            {
                var fechaBase = a.Fecha.Date;
                var entradaProgramada = fechaBase.Add(horarioEmpleado.HoraEntrada ?? TimeSpan.Zero);
                var salidaProgramada = fechaBase.Add(horarioEmpleado.HoraSalida ?? TimeSpan.Zero);

                var tardia = 0;
                if (a.Fecha_Hora_Entrada.HasValue && a.Fecha_Hora_Entrada.Value > entradaProgramada)
                {
                    tardia = (int)Math.Round((a.Fecha_Hora_Entrada.Value - entradaProgramada).TotalMinutes);
                }

                var extra = 0m;
                if (a.Fecha_Hora_Salida.HasValue && a.Fecha_Hora_Salida.Value > salidaProgramada)
                {
                    extra = (decimal)Math.Round((a.Fecha_Hora_Salida.Value - salidaProgramada).TotalHours, 2);
                }

                return new ResumenAsistenciaDiaResponse
                {
                    Fecha = fechaBase,
                    HoraEntrada = a.Fecha_Hora_Entrada?.ToString("HH:mm:ss"),
                    HoraSalida = a.Fecha_Hora_Salida?.ToString("HH:mm:ss"),
                    MinutosTardia = tardia,
                    HorasExtra = extra,
                    DiaEfectivoLaborado = a.Fecha_Hora_Entrada.HasValue && a.Fecha_Hora_Salida.HasValue
                };
            }).ToList();
        }

        public async Task<List<AsistenciaGestionItemResponse>> ObtenerReporteGestion(DateTime fecha, int empleadoSolicitanteId, int? empleadoId, string? nombreEmpleado, string? gerencia)
        {
            var fechaFiltro = fecha.Date;

            var solicitante = await _context.Empleados
                .Include(e => e.Perfil)
                .Include(e => e.Puesto)
                .FirstOrDefaultAsync(e => e.Empleado_ID == empleadoSolicitanteId);

            if (solicitante == null)
                throw new Exception("No se encontró el empleado solicitante para generar el reporte");

            var estructuraActual = await ObtenerEstructuraOrganizacionalActual();
            var empleadosPermitidos = ResolverEmpleadosPermitidos(solicitante, estructuraActual);

            var empleados = await _context.Empleados
                .AsNoTracking()
                .Include(e => e.InformacionPersonal)
                .Include(e => e.Puesto)
                .Include(e => e.Horario)
                .Where(e => empleadosPermitidos.Contains(e.Empleado_ID))
                .Where(e => (e.Estado ?? string.Empty).ToUpper().StartsWith("ACTIVO"))
                .Where(e => !empleadoId.HasValue || e.Empleado_ID == empleadoId.Value)
                .ToListAsync();

            var departamentos = await _context.Departamentos
                .ToDictionaryAsync(d => d.Departamento_ID, d => d.Nombre_Departamento ?? string.Empty);

            var employeeIds = empleados.Select(e => e.Empleado_ID).ToArray();
            var asistenciasDia = await _context.Asistencia.AsNoTracking()
                .Where(a => a.Fecha == fechaFiltro && employeeIds.Contains(a.Empleado_ID))
                .ToListAsync();

            var tipoAusenciaMap = await _context.Tipos_Ausencia
                .ToDictionaryAsync(t => t.Tipo_Ausencia_ID, t => t.Nombre_Ausencia ?? string.Empty);

            var nextDay = fechaFiltro.AddDays(1);
            var ausenciasDia = await _context.Solicitudes_Ausencia.AsNoTracking()
                .Where(s => s.Fecha_Inicio < nextDay && s.Fecha_Fin >= fechaFiltro && employeeIds.Contains(s.Empleado_ID))
                .ToListAsync();

            var jefeMap = await ObtenerJefaturasEmpleado();

            var resultados = new List<AsistenciaGestionItemResponse>();
            var reportIndex = new AttendanceReportIndex(asistenciasDia, ausenciasDia);

            foreach (var e in empleados)
            {
                var asistencia = reportIndex.AttendanceFor(e.Empleado_ID);
                var ausencia = reportIndex.AbsenceFor(e.Empleado_ID);

                var horaEntradaProgramada = fechaFiltro.Add((e.Horario?.Hora_Entrada) ?? TimeSpan.Zero);
                var horaSalidaProgramada = fechaFiltro.Add((e.Horario?.Hora_Salida) ?? TimeSpan.Zero);

                var minutosTarde = 0;
                if (asistencia?.Fecha_Hora_Entrada != null && e.Horario != null && asistencia.Fecha_Hora_Entrada.Value > horaEntradaProgramada)
                {
                    minutosTarde = (int)Math.Round((asistencia.Fecha_Hora_Entrada.Value - horaEntradaProgramada).TotalMinutes);
                }

                var horasExtra = 0m;
                if (asistencia?.Fecha_Hora_Salida != null && e.Horario != null && asistencia.Fecha_Hora_Salida.Value > horaSalidaProgramada)
                {
                    horasExtra = (decimal)Math.Round((asistencia.Fecha_Hora_Salida.Value - horaSalidaProgramada).TotalHours, 2);
                }

                var dataObs = LeerObservaciones(asistencia?.Observaciones);
                var nombre = e.InformacionPersonal?.Nombre_Empleado
                    ?? $"{e.InformacionPersonal?.Primer_Nombre} {e.InformacionPersonal?.Apellido_Paterno} {e.InformacionPersonal?.Apellido_Materno}".Trim();

                if (string.IsNullOrWhiteSpace(nombre))
                    nombre = $"Empleado #{e.Empleado_ID}";

                var gerenciaNombre = (e.Puesto != null && departamentos.TryGetValue(e.Puesto.Departamento_ID, out var depNombre))
                    ? depNombre
                    : "Sin gerencia";

                var item = new AsistenciaGestionItemResponse
                {
                    Fecha = fechaFiltro,
                    EmpleadoId = e.Empleado_ID,
                    Nombre = nombre,
                    JefeInmediato = jefeMap.TryGetValue(e.Empleado_ID, out var jefe) ? jefe : "Sin jefatura",
                    Gerencia = gerenciaNombre,
                    HoraEntrada = asistencia?.Fecha_Hora_Entrada?.ToString("HH:mm:ss") ?? "--:--:--",
                    MinutosTarde = minutosTarde,
                    HoraSalida = asistencia?.Fecha_Hora_Salida?.ToString("HH:mm:ss") ?? "--:--:--",
                    HorasExtra = horasExtra,
                    AusenciaSolicitada = ausencia != null,
                    TipoAusenciaPedida = ausencia != null && tipoAusenciaMap.TryGetValue(ausencia.Tipo_Ausencia_ID, out var tipoAus)
                        ? tipoAus
                        : "N/A",
                    JustificacionAusencia = dataObs.MotivoAusencia ?? "N/A",
                    ComentarioPuesto = e.Puesto?.Nombre_Puesto ?? "Sin comentario"
                };

                resultados.Add(item);
            }

            if (!string.IsNullOrWhiteSpace(nombreEmpleado))
            {
                resultados = resultados
                    .Where(r => (r.Nombre ?? string.Empty).Contains(nombreEmpleado, StringComparison.OrdinalIgnoreCase))
                    .ToList();
            }

            if (!string.IsNullOrWhiteSpace(gerencia))
            {
                resultados = resultados
                    .Where(r => (r.Gerencia ?? string.Empty).Contains(gerencia, StringComparison.OrdinalIgnoreCase))
                    .ToList();
            }

            return resultados
                .OrderBy(r => r.Nombre)
                .ToList();
        }

        private static HashSet<int> ResolverEmpleadosPermitidos(Empleados solicitante, List<EstructuraOrgActual> estructuraActual)
        {
            var permitidos = new HashSet<int>();

            var perfil = (solicitante.Perfil?.Nombre_Perfil ?? string.Empty).ToUpperInvariant();
            var puesto = (solicitante.Puesto?.Nombre_Puesto ?? string.Empty).ToUpperInvariant();

            var esAdmin = perfil.Contains("ADMIN") || puesto.Contains("ADMIN");
            var esGerenteGeneral = perfil.Contains("GERENTE GENERAL") || perfil.Contains("DIRECTOR GENERAL") || puesto.Contains("GERENTE GENERAL") || puesto.Contains("DIRECTOR GENERAL");
            var esGerente = (perfil.Contains("GERENTE") || puesto.Contains("GERENTE")) && !esGerenteGeneral;
            var esJefe = perfil.Contains("JEFE") || puesto.Contains("JEFE");

            if (esAdmin || esGerenteGeneral)
            {
                foreach (var item in estructuraActual)
                    permitidos.Add(item.EmpleadoId);

                permitidos.Add(solicitante.Empleado_ID);
                return permitidos;
            }

            if (esGerente)
            {
                permitidos.Add(solicitante.Empleado_ID);

                var directos = estructuraActual
                    .Where(x => x.JefeEmpleadoId == solicitante.Empleado_ID)
                    .Select(x => x.EmpleadoId)
                    .ToHashSet();

                foreach (var id in directos)
                    permitidos.Add(id);

                var segundoNivel = estructuraActual
                    .Where(x => x.JefeEmpleadoId.HasValue && directos.Contains(x.JefeEmpleadoId.Value))
                    .Select(x => x.EmpleadoId);

                foreach (var id in segundoNivel)
                    permitidos.Add(id);

                return permitidos;
            }

            if (esJefe)
            {
                permitidos.Add(solicitante.Empleado_ID);

                var directos = estructuraActual
                    .Where(x => x.JefeEmpleadoId == solicitante.Empleado_ID)
                    .Select(x => x.EmpleadoId);

                foreach (var id in directos)
                    permitidos.Add(id);

                return permitidos;
            }

            var jefeActual = estructuraActual
                .Where(x => x.EmpleadoId == solicitante.Empleado_ID)
                .Select(x => x.JefeEmpleadoId)
                .FirstOrDefault();

            if (!jefeActual.HasValue)
            {
                permitidos.Add(solicitante.Empleado_ID);
                return permitidos;
            }

            var companeros = estructuraActual
                .Where(x => x.JefeEmpleadoId == jefeActual.Value)
                .Select(x => x.EmpleadoId);

            foreach (var id in companeros)
                permitidos.Add(id);

            permitidos.Add(solicitante.Empleado_ID);
            return permitidos;
        }

        private async Task<List<EstructuraOrgActual>> ObtenerEstructuraOrganizacionalActual()
        {
            var resultado = new List<EstructuraOrgActual>();

            using var command = _context.Database.GetDbConnection().CreateCommand();
            command.CommandText = @"
                IF OBJECT_ID('dbo.Estructura_Organizacional', 'U') IS NOT NULL
                BEGIN
                    WITH Ultima AS (
                        SELECT
                            eo.Empleado_ID,
                            eo.Jefe_Empleado_ID,
                            eo.Gerencia_Departamento_ID,
                            ROW_NUMBER() OVER (PARTITION BY eo.Empleado_ID ORDER BY eo.Fecha_Registro DESC) AS rn
                        FROM Estructura_Organizacional eo
                    )
                    SELECT Empleado_ID, Jefe_Empleado_ID, Gerencia_Departamento_ID
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

                resultado.Add(new EstructuraOrgActual
                {
                    EmpleadoId = empleadoId,
                    JefeEmpleadoId = reader["Jefe_Empleado_ID"] == DBNull.Value ? null : Convert.ToInt32(reader["Jefe_Empleado_ID"]),
                    GerenciaDepartamentoId = reader["Gerencia_Departamento_ID"] == DBNull.Value ? null : Convert.ToInt32(reader["Gerencia_Departamento_ID"])
                });
            }

            return resultado;
        }

        public async Task Actualizar(Asistencia asistencia)
        {
            _context.Asistencia.Update(asistencia);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> TieneAusenciaActivaEnFecha(int empleadoId, DateTime fecha)
        {
            var fechaBase = fecha.Date;
            return await _context.Solicitudes_Ausencia.AnyAsync(s =>
                s.Empleado_ID == empleadoId
                && s.Fecha_Inicio.Date <= fechaBase
                && s.Fecha_Fin.Date >= fechaBase
                && (
                    s.Estado_Solicitud.ToUpper() == "PENDIENTE"
                    || s.Estado_Solicitud.ToUpper().Contains("APROBAD")
                ));
        }

        private static ObservacionAsistenciaData LeerObservaciones(string observaciones)
        {
            if (string.IsNullOrWhiteSpace(observaciones))
                return new ObservacionAsistenciaData();

            try
            {
                return JsonSerializer.Deserialize<ObservacionAsistenciaData>(observaciones) ?? new ObservacionAsistenciaData();
            }
            catch
            {
                return new ObservacionAsistenciaData();
            }
        }

        private static string EscribirObservaciones(ObservacionAsistenciaData data)
        {
            return JsonSerializer.Serialize(data);
        }

        private async Task<int> ObtenerDestinoAprobacion(int empleadoId)
        {
            var jefe = await _context.Solicitudes_Ausencia
                .Where(s => s.Empleado_ID == empleadoId && s.Aprobador_ID.HasValue)
                .OrderByDescending(s => s.Fecha_Solicitud)
                .Select(s => s.Aprobador_ID)
                .FirstOrDefaultAsync();

            if (jefe.HasValue && jefe.Value != empleadoId)
                return jefe.Value;

            var rrhh = await _context.Empleados
                .Include(e => e.Perfil)
                .FirstOrDefaultAsync(e => e.Perfil != null && e.Perfil.Nombre_Perfil != null &&
                    (e.Perfil.Nombre_Perfil.ToUpper().Contains("RRHH") || e.Perfil.Nombre_Perfil.ToUpper().Contains("RECURSOS")));

            return rrhh?.Empleado_ID ?? empleadoId;
        }

        private async Task<Dictionary<int, string>> ObtenerJefaturasEmpleado()
        {
            var mapa = new Dictionary<int, string>();

            try
            {
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
                        SELECT u.Empleado_ID, ip.Nombre_Empleado AS JefeInmediato
                        FROM Ultima u
                        LEFT JOIN Informacion_Personal ip ON ip.Empleado_ID = u.Jefe_Empleado_ID
                        WHERE u.rn = 1
                    END
                ";

                if (command.Connection.State != System.Data.ConnectionState.Open)
                    await command.Connection.OpenAsync();

                using var reader = await command.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    var empleadoId = reader["Empleado_ID"] != DBNull.Value ? Convert.ToInt32(reader["Empleado_ID"]) : 0;
                    var jefe = reader["JefeInmediato"] != DBNull.Value ? reader["JefeInmediato"].ToString() : "Sin jefatura";
                    if (empleadoId > 0)
                        mapa[empleadoId] = jefe;
                }
            }
            catch
            {
                return mapa;
            }

            return mapa;
        }

        private static DateTime ObtenerAhoraCostaRica()
        {
            return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, ObtenerZonaCostaRica());
        }

        private static DateTime NormalizarAHoraCostaRica(DateTime fechaHora)
        {
            if (fechaHora == DateTime.MinValue)
                return ObtenerAhoraCostaRica();

            var utc = fechaHora.Kind switch
            {
                DateTimeKind.Utc => fechaHora,
                DateTimeKind.Local => fechaHora.ToUniversalTime(),
                _ => DateTime.SpecifyKind(fechaHora, DateTimeKind.Unspecified)
            };

            if (utc.Kind == DateTimeKind.Unspecified)
                return utc;

            return TimeZoneInfo.ConvertTimeFromUtc(utc, ObtenerZonaCostaRica());
        }

        private static TimeZoneInfo ObtenerZonaCostaRica()
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById("Central America Standard Time");
            }
            catch
            {
                return TimeZoneInfo.FindSystemTimeZoneById("America/Costa_Rica");
            }
        }
    }
}
