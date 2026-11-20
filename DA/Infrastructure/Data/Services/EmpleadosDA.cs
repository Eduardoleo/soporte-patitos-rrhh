

using DA.Context;
using DA.Interfaces;
using Microsoft.EntityFrameworkCore;
using Model.Entities;
using Model.Requests;
using Model.Responses;

namespace DA.Servicios
{
    public class EmpleadosDA:IEmpleadosDA
    {
        private readonly AppDbContext _context;

        public EmpleadosDA(AppDbContext context)
        {
            _context = context;
        }

        public async Task ActualizarDatos(Empleados empleado)
        {
            await _context.SaveChangesAsync();
        }

        public async Task EliminarDatos(Empleados empleado)
        {
            _context.Empleados.Remove(empleado);
            await _context.SaveChangesAsync();
        }

        public async Task InsertarDatos(Empleados empleado)
        {
            await _context.Empleados.AddAsync(empleado);
            await _context.SaveChangesAsync();
        }

        public async Task<Empleados> ObtenerPorCedula(string cedula)
        {
            return await _context.Empleados
              .Include(e => e.InformacionPersonal)
              .Include(e => e.InformacionContacto)
              .Include(e => e.InformacionDireccion)
              .Include(e => e.InformacionIdentificacion)
              .Include(e => e.Usuario)
              .Include(e => e.Perfil)
              .Include(e => e.Puesto)
              .Include(e => e.Horario)
              .FirstOrDefaultAsync(c => c.Cedula == cedula);
        }

        public async Task<Empleados> ObtenerPorId(int id)
        {
            return await _context.Empleados
              .Include(e => e.InformacionPersonal)
              .Include(e => e.InformacionContacto)
              .Include(e => e.InformacionDireccion)
              .Include(e => e.InformacionIdentificacion)
              .Include(e => e.Usuario)
              .Include(e => e.Perfil)
              .Include(e => e.Puesto)
              .Include(e => e.Horario)
              .FirstOrDefaultAsync(e => e.Empleado_ID == id);
        }

        public async Task<Empleados> ObtenerPorUsuarioId(int usuarioId)
        {
            return await _context.Empleados
              .Include(e => e.InformacionPersonal)
              .Include(e => e.InformacionContacto)
              .Include(e => e.InformacionDireccion)
              .Include(e => e.InformacionIdentificacion)
              .Include(e => e.Usuario)
              .Include(e => e.Perfil)
              .Include(e => e.Puesto)
              .Include(e => e.Horario)
              .FirstOrDefaultAsync(e => e.Usuario_ID == usuarioId);
        }

        public async Task<Empleados> ObtenerPorNombre(string nombreEmpleado)
        {
            return await _context.Empleados
              .Include(e => e.InformacionPersonal)
              .FirstOrDefaultAsync(e => e.InformacionPersonal.Nombre_Empleado == nombreEmpleado);
        }

        public async Task<List<Empleados>> ObtenerTodos(bool incluirInactivos = false)
        {
            var query = _context.Empleados
                .Include(e => e.InformacionPersonal)
                .Include(e => e.Puesto)
                .Include(e => e.ContactosEmergencia)
                .AsQueryable();

            if (!incluirInactivos)
            {
                query = query.Where(e => (e.Estado ?? string.Empty).ToUpper().StartsWith("ACTIVO"));
            }

            return await query.ToListAsync();
        }
            public async Task<List<ContactosEmergencia>> ObtenerContactosEmergencia(int empleadoId)
            {
                return await _context.Contactos_Emergencia
                    .Where(c => c.Empleado_ID == empleadoId)
                    .ToListAsync();
            }

            public async Task<List<TipoAusencia>> ObtenerTiposAusencia()
            {
                return await _context.Tipos_Ausencia.ToListAsync();
            }

            public async Task<List<SolicitudAusencia>> ObtenerAusenciasEmpleado(int empleadoId)
            {
                return await _context.Solicitudes_Ausencia
                    .Where(s => s.Empleado_ID == empleadoId)
                    .OrderByDescending(s => s.Fecha_Solicitud)
                    .ToListAsync();
            }

            public async Task<List<ProgramaEquipoItemResponse>> ObtenerProgramaEquipo(int empleadoId)
            {
                var empleadoBase = await _context.Empleados
                    .Include(e => e.Puesto)
                    .FirstOrDefaultAsync(e => e.Empleado_ID == empleadoId);

                if (empleadoBase?.Puesto == null)
                    return new List<ProgramaEquipoItemResponse>();

                var departamentoId = empleadoBase.Puesto.Departamento_ID;

                var departamentoNombre = await _context.Departamentos
                    .Where(d => d.Departamento_ID == departamentoId)
                    .Select(d => d.Nombre_Departamento)
                    .FirstOrDefaultAsync();

                var equipo = await _context.Empleados
                    .Include(e => e.InformacionPersonal)
                    .Include(e => e.Puesto)
                    .Include(e => e.Horario)
                    .Where(e => e.Puesto != null && e.Puesto.Departamento_ID == departamentoId)
                    .Where(e => (e.Estado ?? string.Empty).ToUpper().StartsWith("ACTIVO"))
                    .OrderBy(e => e.InformacionPersonal.Apellido_Paterno)
                    .ThenBy(e => e.InformacionPersonal.Primer_Nombre)
                    .ToListAsync();

                return equipo.Select(e =>
                {
                    var nombre = e.InformacionPersonal?.Nombre_Empleado;
                    if (string.IsNullOrWhiteSpace(nombre))
                    {
                        nombre = $"{e.InformacionPersonal?.Apellido_Paterno} {e.InformacionPersonal?.Apellido_Materno} {e.InformacionPersonal?.Primer_Nombre}".Trim();
                    }

                    var horasDiarias = e.Horario != null
                        ? (decimal)(e.Horario.Hora_Salida - e.Horario.Hora_Entrada).TotalHours
                        : 0m;

                    var diasSemana = EsJornadaCincoDias(e.Horario) ? 5 : 6;
                    var horasSemanales = Math.Round(horasDiarias * diasSemana, 2);

                    return new ProgramaEquipoItemResponse
                    {
                        EmpleadoId = e.Empleado_ID,
                        CodigoEmpleado = e.Cedula,
                        NombreCompleto = string.IsNullOrWhiteSpace(nombre) ? $"Empleado #{e.Empleado_ID}" : nombre,
                        Puesto = e.Puesto?.Nombre_Puesto ?? "Sin puesto",
                        Area = departamentoNombre ?? "Sin área",
                        HorarioNombre = e.Horario?.Nombre_Horario ?? "Sin horario",
                        HoraEntrada = e.Horario?.Hora_Entrada.ToString(@"hh\:mm") ?? "--:--",
                        HoraSalida = e.Horario?.Hora_Salida.ToString(@"hh\:mm") ?? "--:--",
                        HorasSemanales = horasSemanales
                    };
                }).ToList();
            }

            public async Task<List<DocumentoEmpleadoResponse>> ObtenerDocumentosEmitidos(int empleadoId)
            {
                var documentosPlanilla = await (from cp in _context.Colillas_Pago
                                                join p in _context.Planillas on cp.Planilla_ID equals p.Planilla_ID into planillas
                                                from p in planillas.DefaultIfEmpty()
                                                where cp.Empleado_ID == empleadoId
                                                orderby cp.Fecha_Envio descending
                                                select new DocumentoEmpleadoResponse
                                                {
                                                    DocumentoId = cp.Colilla_ID,
                                                    TipoDocumento = "COLILLA_PAGO",
                                                    Titulo = "COMPROBANTE_PAGO_CR",
                                                    Descripcion = p != null
                                                        ? $"Comprobante de pago nómina {p.Periodo_Fin:MMM yyyy}".ToUpper()
                                                        : "Comprobante de pago nómina",
                                                    FechaDocumento = p != null ? p.Periodo_Fin : (cp.Fecha_Envio ?? DateTime.MinValue),
                                                    UltimaActualizacion = cp.Fecha_Envio,
                                                    Estado = cp.Estado_Envio ?? "PENDIENTE",
                                                    Categoria = "Nómina",
                                                    CantidadAnexos = 1,
                                                    RutaPdf = cp.Ruta_PDF
                                                }).ToListAsync();

                return documentosPlanilla;
            }

            public async Task<BalanceAusenciasResponse> ObtenerBalanceAusencias(int empleadoId, DateTime fechaReferencia)
            {
                var empleado = await _context.Empleados
                    .Include(e => e.Horario)
                    .FirstOrDefaultAsync(e => e.Empleado_ID == empleadoId);

                if (empleado == null)
                    return null;

                var fechaRef = fechaReferencia.Date;
                var fechaIngreso = empleado.Fecha_Ingreso.Date;

                var mesesLaborados = 0;
                if (fechaRef >= fechaIngreso)
                {
                    mesesLaborados = (fechaRef.Year - fechaIngreso.Year) * 12 + (fechaRef.Month - fechaIngreso.Month);
                    if (fechaRef.Day < fechaIngreso.Day)
                        mesesLaborados--;
                    if (mesesLaborados < 0)
                        mesesLaborados = 0;
                }

                var esJornadaCincoDias = EsJornadaCincoDias(empleado.Horario);
                var diasAnualesPlan = esJornadaCincoDias ? 10 : 12;
                var diasGanados = Math.Floor((mesesLaborados / 12m) * diasAnualesPlan * 100m) / 100m;
                var cumpleAnioLaborado = mesesLaborados >= 12;

                var tipoVacaciones = await _context.Tipos_Ausencia
                    .FirstOrDefaultAsync(t => t.Nombre_Ausencia.ToUpper().Contains("VACACION"));

                decimal ausenciasAprobadas = 0m;
                if (tipoVacaciones != null)
                {
                    var vacacionesAprobadas = await _context.Solicitudes_Ausencia
                        .Where(s => s.Empleado_ID == empleadoId
                            && s.Tipo_Ausencia_ID == tipoVacaciones.Tipo_Ausencia_ID
                            && s.Estado_Solicitud == "APROBADO"
                            && s.Fecha_Inicio <= fechaRef)
                        .ToListAsync();

                    ausenciasAprobadas = vacacionesAprobadas.Sum(s => (decimal)(s.Fecha_Fin.Date - s.Fecha_Inicio.Date).TotalDays + 1m);
                }

                var ajuste = cumpleAnioLaborado ? diasGanados : 0m;
                var arrastre = 0m;
                var balanceTotal = ajuste + arrastre - ausenciasAprobadas;

                var vigenciaInicio = new DateTime(fechaRef.Year, 1, 1);
                var vigenciaFin = new DateTime(fechaRef.Year, 12, 31);

                return new BalanceAusenciasResponse
                {
                    EmpleadoId = empleadoId,
                    PlanNombre = esJornadaCincoDias ? "Vacaciones 5 días" : "Vacaciones estándar",
                    FechaReferencia = fechaRef,
                    VigenciaInicio = vigenciaInicio,
                    VigenciaFin = vigenciaFin,
                    MesesLaborados = mesesLaborados,
                    DiasAnualesPlan = diasAnualesPlan,
                    Ajustes = ajuste,
                    Arrastre = arrastre,
                    AusenciasAprobadas = ausenciasAprobadas,
                    BalanceTotal = balanceTotal,
                    PuedeSolicitarVacaciones = cumpleAnioLaborado,
                    MensajeReglaVacaciones = cumpleAnioLaborado
                        ? "Cumple un año laboral. Puede solicitar vacaciones."
                        : "Las vacaciones se habilitan al completar 12 meses laborados."
                };
            }

            public async Task<string> ProcesarSolicitudAusencia(long solicitudId, int empleadoAprobadorId, string accion, string? comentario)
            {
                var solicitud = await _context.Solicitudes_Ausencia.FirstOrDefaultAsync(s => s.Solicitud_ID == solicitudId);
                if (solicitud == null)
                    throw new Exception("La solicitud no existe");

                if (!string.Equals(solicitud.Estado_Solicitud, "PENDIENTE", StringComparison.OrdinalIgnoreCase))
                    throw new Exception("La solicitud ya fue procesada");

                if (solicitud.Empleado_ID == empleadoAprobadorId)
                    throw new Exception("Un colaborador no puede aprobar su propia solicitud.");

                var jefeDirecto = await ObtenerJefaturaDirectaId(solicitud.Empleado_ID);
                var esAprobadorActual = solicitud.Aprobador_ID.HasValue && solicitud.Aprobador_ID.Value == empleadoAprobadorId;
                var esJefeDirecto = jefeDirecto.HasValue && jefeDirecto.Value == empleadoAprobadorId;

                if (solicitud.Aprobador_ID.HasValue && !esAprobadorActual)
                    throw new Exception("No tienes permisos para aprobar/rechazar esta solicitud");

                if (!solicitud.Aprobador_ID.HasValue && !esJefeDirecto)
                    throw new Exception("No tienes permisos para aprobar/rechazar esta solicitud");

                if (!solicitud.Aprobador_ID.HasValue || solicitud.Aprobador_ID.Value != empleadoAprobadorId)
                    solicitud.Aprobador_ID = empleadoAprobadorId;

                var accionNormalizada = (accion ?? string.Empty).Trim().ToUpperInvariant();

                if (accionNormalizada == "RECHAZAR")
                {
                    solicitud.Estado_Solicitud = "RECHAZADA";
                    solicitud.Fecha_Aprobacion = DateTime.Now;
                    solicitud.Comentarios = string.IsNullOrWhiteSpace(comentario)
                        ? solicitud.Comentarios
                        : $"{solicitud.Comentarios} | Rechazo: {comentario}";

                    var pendientes = await _context.Notificaciones
                        .Where(n => n.Referencia_Tipo == "AUSENCIA" && n.Referencia_ID == solicitud.Solicitud_ID)
                        .ToListAsync();
                    pendientes.ForEach(n => n.Estado = "COMPLETADA");

                    await _context.Notificaciones.AddAsync(new Notificacion
                    {
                        Empleado_Origen_ID = empleadoAprobadorId,
                        Empleado_Destino_ID = solicitud.Empleado_ID,
                        Titulo = "Solicitud de ausencia rechazada",
                        Mensaje = "Tu solicitud de ausencia fue rechazada.",
                        Referencia_ID = solicitud.Solicitud_ID,
                        Referencia_Tipo = "AUSENCIA",
                        Estado = "COMPLETADA",
                        Tipo_Notificacion = "SISTEMA"
                    });

                    await _context.SaveChangesAsync();
                    return "Solicitud rechazada correctamente.";
                }

                var siguienteAprobadorId = await ObtenerNominaDestinoId(solicitud.Empleado_ID);
                var requierePasoNomina = jefeDirecto.HasValue
                    && jefeDirecto.Value != solicitud.Empleado_ID
                    && empleadoAprobadorId == jefeDirecto.Value
                    && siguienteAprobadorId != empleadoAprobadorId;

                if (requierePasoNomina)
                {
                    solicitud.Estado_Solicitud = "PENDIENTE";
                    solicitud.Aprobador_ID = siguienteAprobadorId;
                    solicitud.Fecha_Aprobacion = null;
                    solicitud.Comentarios = string.IsNullOrWhiteSpace(comentario)
                        ? solicitud.Comentarios
                        : $"{solicitud.Comentarios} | Aprobación jefatura: {comentario}";

                    var notificacionesJefatura = await _context.Notificaciones
                        .Where(n => n.Referencia_Tipo == "AUSENCIA"
                            && n.Referencia_ID == solicitud.Solicitud_ID
                            && n.Empleado_Destino_ID == empleadoAprobadorId
                            && n.Estado != "COMPLETADA")
                        .ToListAsync();

                    notificacionesJefatura.ForEach(n => n.Estado = "COMPLETADA");

                    await _context.Notificaciones.AddAsync(new Notificacion
                    {
                        Empleado_Origen_ID = empleadoAprobadorId,
                        Empleado_Destino_ID = siguienteAprobadorId,
                        Titulo = "Solicitud de ausencia aprobada por jefatura",
                        Mensaje = "Pendiente de aprobación de analista de nómina para aplicación en planilla.",
                        Referencia_ID = solicitud.Solicitud_ID,
                        Referencia_Tipo = "AUSENCIA",
                        Estado = "EN CURSO",
                        Tipo_Notificacion = "SOLICITUD"
                    });

                    await _context.SaveChangesAsync();
                    return "Solicitud aprobada por jefatura y enviada a nómina.";
                }

                solicitud.Estado_Solicitud = "APROBADA";
                solicitud.Fecha_Aprobacion = DateTime.Now;
                solicitud.Comentarios = string.IsNullOrWhiteSpace(comentario)
                    ? solicitud.Comentarios
                    : $"{solicitud.Comentarios} | Aprobación final: {comentario}";

                var notificacionesPendientes = await _context.Notificaciones
                    .Where(n => n.Referencia_Tipo == "AUSENCIA" && n.Referencia_ID == solicitud.Solicitud_ID)
                    .ToListAsync();
                notificacionesPendientes.ForEach(n => n.Estado = "COMPLETADA");

                await _context.Notificaciones.AddAsync(new Notificacion
                {
                    Empleado_Origen_ID = empleadoAprobadorId,
                    Empleado_Destino_ID = solicitud.Empleado_ID,
                    Titulo = "Solicitud de ausencia aprobada",
                    Mensaje = "Tu solicitud de ausencia fue aprobada final y aplicada para planilla.",
                    Referencia_ID = solicitud.Solicitud_ID,
                    Referencia_Tipo = "AUSENCIA",
                    Estado = "COMPLETADA",
                    Tipo_Notificacion = "SISTEMA"
                });

                await _context.SaveChangesAsync();
                return "Solicitud aprobada correctamente.";
            }

            public async Task<List<Feriado>> ObtenerFeriados()
            {
                return await _context.Feriados
                    .OrderBy(f => f.Fecha)
                    .ToListAsync();
            }

            private async Task<int?> ObtenerSiguienteAprobadorAusencia(int empleadoSolicitanteId)
            {
                var empleado = await _context.Empleados
                    .Include(e => e.Perfil)
                    .FirstOrDefaultAsync(e => e.Empleado_ID == empleadoSolicitanteId);

                if (empleado == null)
                    return null;

                var perfil = (empleado.Perfil?.Nombre_Perfil ?? string.Empty).ToUpperInvariant();

                // Empleado estándar -> Analista de nómina
                if (!perfil.Contains("JEFE") && !perfil.Contains("GERENTE"))
                    return await ObtenerNominaDestinoId(empleadoSolicitanteId);

                // Jefe -> Gerente
                if (perfil.Contains("JEFE"))
                    return await ObtenerJefaturaDirectaId(empleadoSolicitanteId);

                // Gerente general -> RRHH
                if (perfil.Contains("GERENTE GENERAL") || perfil.Contains("DIRECTOR GENERAL"))
                    return await ObtenerRrhhDestinoId(empleadoSolicitanteId);

                // Gerente -> Gerente general (jefatura directa)
                if (perfil.Contains("GERENTE"))
                    return await ObtenerJefaturaDirectaId(empleadoSolicitanteId);

                return null;
            }

            private async Task<int> ObtenerNominaDestinoId(int fallbackEmpleadoId)
            {
                var nomina = await _context.Empleados
                    .Include(e => e.Perfil)
                    .Include(e => e.Puesto)
                    .Where(e => string.IsNullOrWhiteSpace(e.Estado) || e.Estado.ToUpper() == "ACTIVO")
                    .FirstOrDefaultAsync(e =>
                        (e.Perfil != null && e.Perfil.Nombre_Perfil != null &&
                            EF.Functions.Like(e.Perfil.Nombre_Perfil.ToUpper(), "%N%MINA%"))
                        ||
                        (e.Puesto != null && e.Puesto.Nombre_Puesto != null &&
                            EF.Functions.Like(e.Puesto.Nombre_Puesto.ToUpper(), "%N%MINA%")));

                if (nomina != null)
                    return nomina.Empleado_ID;

                var rrhhId = await ObtenerRrhhDestinoId(fallbackEmpleadoId);
                if (rrhhId == fallbackEmpleadoId)
                    throw new Exception("No se encontró analista de nómina o RRHH para continuar la aprobación.");

                return rrhhId;
            }

            public async Task SolicitarAusencia(SolicitudAusencia solicitud)
            {
                if (!solicitud.Aprobador_ID.HasValue)
                {
                    var jefeDirecto = await ObtenerJefaturaDirectaId(solicitud.Empleado_ID);
                    if (jefeDirecto.HasValue && jefeDirecto.Value != solicitud.Empleado_ID)
                    {
                        solicitud.Aprobador_ID = jefeDirecto.Value;
                    }
                }

                await _context.Solicitudes_Ausencia.AddAsync(solicitud);
                await _context.SaveChangesAsync();

                var rrhhId = await ObtenerRrhhDestinoId(solicitud.Empleado_ID);
                var tieneJefaturaDirecta = solicitud.Aprobador_ID.HasValue;
                var destinoAprobacionId = solicitud.Aprobador_ID ?? rrhhId;

                // Add notification directly DA scope
                var notificacionGerencia = new Notificacion 
                {
                    Empleado_Origen_ID = solicitud.Empleado_ID,
                    Empleado_Destino_ID = destinoAprobacionId,
                    Titulo = "Solicitud de ausencia enviada",
                    Mensaje = tieneJefaturaDirecta
                        ? "En revisión de jefatura inmediata."
                        : "Sin jefatura directa asignada. En revisión de RRHH.",
                    Referencia_ID = solicitud.Solicitud_ID,
                    Referencia_Tipo = "AUSENCIA"
                    ,Tipo_Notificacion = "SOLICITUD"
                };

                await _context.Notificaciones.AddAsync(notificacionGerencia);
                await _context.SaveChangesAsync();
            }

            public async Task SolicitarCambioHorario(SolicitarCambioHorarioRequest request)
            {
                var empleado = await _context.Empleados
                    .Include(e => e.Horario)
                    .FirstOrDefaultAsync(e => e.Empleado_ID == request.Empleado_ID);

                if (empleado == null)
                    throw new Exception("Empleado no encontrado");

                var horarioActual = await _context.Horarios.FirstOrDefaultAsync(h => h.Horario_ID == request.Horario_Actual_ID);
                var horarioSolicitado = await _context.Horarios.FirstOrDefaultAsync(h => h.Horario_ID == request.Horario_Solicitado_ID);

                if (horarioActual == null || horarioSolicitado == null)
                    throw new Exception("No se encontraron horarios válidos para la solicitud");

                var rrhhId = await ObtenerRrhhDestinoId(request.Empleado_ID);
                var jefeId = request.Jefe_ID ?? await ObtenerJefaturaDirectaId(request.Empleado_ID);

                if (jefeId == request.Empleado_ID)
                    jefeId = null;

                var destinoInicial = jefeId ?? rrhhId;

                var notificacionJefatura = new Notificacion
                {
                    Empleado_Origen_ID = request.Empleado_ID,
                    Empleado_Destino_ID = destinoInicial,
                    Titulo = "Solicitud de cambio de horario",
                    Mensaje = $"Cambio solicitado de {horarioActual.Nombre_Horario} a {horarioSolicitado.Nombre_Horario}. Motivo: {request.Motivo}",
                    Referencia_ID = request.Empleado_ID,
                    Referencia_Tipo = "CAMBIO_HORARIO",
                    Estado = "EN CURSO"
                };

                await _context.Notificaciones.AddAsync(notificacionJefatura);

                if (jefeId.HasValue && jefeId.Value != rrhhId)
                {
                    var notificacionRrhhPendiente = new Notificacion
                    {
                        Empleado_Origen_ID = request.Empleado_ID,
                        Empleado_Destino_ID = rrhhId,
                        Titulo = "Solicitud de cambio de horario",
                        Mensaje = "Pendiente de aprobación de jefatura inmediata para pasar a RRHH.",
                        Referencia_ID = request.Empleado_ID,
                        Referencia_Tipo = "CAMBIO_HORARIO",
                        Estado = "PENDIENTE JEFATURA"
                    };

                    await _context.Notificaciones.AddAsync(notificacionRrhhPendiente);
                }

                await _context.SaveChangesAsync();
            }

            public async Task<List<Notificacion>> ObtenerNotificaciones(int empleadoId)
            {
                return await _context.Notificaciones
                    .Where(n => n.Empleado_Destino_ID == empleadoId || n.Empleado_Origen_ID == empleadoId)
                    .OrderByDescending(n => n.Fecha_Creacion)
                    .ToListAsync();
            }

            public async Task NotificarVacantePorInactivacion(int empleadoId, string motivoInactivo)
            {
                var empleado = await _context.Empleados
                    .Include(e => e.Perfil)
                    .Include(e => e.InformacionPersonal)
                    .FirstOrDefaultAsync(e => e.Empleado_ID == empleadoId);

                if (empleado == null)
                    return;

                var perfil = (empleado.Perfil?.Nombre_Perfil ?? string.Empty).ToUpperInvariant();
                if (!perfil.Contains("JEFE"))
                    return;

                var nombre = empleado.InformacionPersonal?.Nombre_Empleado;
                if (string.IsNullOrWhiteSpace(nombre))
                    nombre = $"Empleado #{empleadoId}";

                int? gerenteDestinoId = null;
                try
                {
                    using var command = _context.Database.GetDbConnection().CreateCommand();
                    command.CommandText = @"
                        SELECT TOP 1 eo.Jefe_Empleado_ID
                        FROM Estructura_Organizacional eo
                        WHERE eo.Empleado_ID = @empId
                          AND eo.Jefe_Empleado_ID IS NOT NULL
                        ORDER BY eo.Fecha_Registro DESC
                    ";

                    var param = command.CreateParameter();
                    param.ParameterName = "@empId";
                    param.Value = empleadoId;
                    command.Parameters.Add(param);

                    if (command.Connection.State != System.Data.ConnectionState.Open)
                        await command.Connection.OpenAsync();

                    var result = await command.ExecuteScalarAsync();
                    if (result != null && result != DBNull.Value)
                        gerenteDestinoId = Convert.ToInt32(result);
                }
                catch
                {
                    gerenteDestinoId = null;
                }

                var nominaDestinoId = await ObtenerNominaDestinoId(empleadoId);
                var destinos = new HashSet<int>();
                if (gerenteDestinoId.HasValue && gerenteDestinoId.Value != empleadoId)
                    destinos.Add(gerenteDestinoId.Value);
                if (nominaDestinoId != empleadoId)
                    destinos.Add(nominaDestinoId);

                foreach (var destinoId in destinos)
                {
                    await _context.Notificaciones.AddAsync(new Notificacion
                    {
                        Empleado_Origen_ID = empleadoId,
                        Empleado_Destino_ID = destinoId,
                        Titulo = "Vacante por salida de jefatura",
                        Mensaje = $"Jefe inactivado por {motivoInactivo}. Colaborador: {nombre}. Se debe gestionar reemplazo de la vacante.",
                        Referencia_ID = empleadoId,
                        Referencia_Tipo = "VACANTE",
                        Estado = "EN CURSO",
                        Tipo_Notificacion = "SISTEMA"
                    });
                }

                if (destinos.Count > 0)
                    await _context.SaveChangesAsync();
            }

            public async Task<HorarioActualResponse> ObtenerHorarioActual(int empleadoId)
            {
                var empleado = await _context.Empleados
                    .Include(e => e.Horario)
                    .FirstOrDefaultAsync(e => e.Empleado_ID == empleadoId);

                if (empleado?.Horario == null)
                    return null;

                return new HorarioActualResponse
                {
                    EmpleadoId = empleadoId,
                    HorarioId = empleado.Horario_ID,
                    NombreHorario = empleado.Horario.Nombre_Horario,
                    HoraEntrada = empleado.Horario.Hora_Entrada.ToString(@"hh\:mm"),
                    HoraSalida = empleado.Horario.Hora_Salida.ToString(@"hh\:mm"),
                    Descripcion = empleado.Horario.Descripcion
                };
            }

            public async Task<SolicitudAusenciaDetalleResponse> ObtenerDetalleSolicitudAusencia(long solicitudId, int empleadoId)
            {
                var solicitud = await _context.Solicitudes_Ausencia
                    .FirstOrDefaultAsync(s => s.Solicitud_ID == solicitudId);

                if (solicitud == null)
                    return null;

                var participaEnSolicitud = solicitud.Empleado_ID == empleadoId || solicitud.Aprobador_ID == empleadoId;

                if (!participaEnSolicitud)
                {
                    var tieneNotificacionRelacionada = await _context.Notificaciones.AnyAsync(n =>
                        n.Referencia_Tipo == "AUSENCIA" &&
                        n.Referencia_ID == solicitudId &&
                        (n.Empleado_Origen_ID == empleadoId || n.Empleado_Destino_ID == empleadoId));

                    if (!tieneNotificacionRelacionada)
                        return null;
                }

                var tipoAusencia = await _context.Tipos_Ausencia
                    .FirstOrDefaultAsync(t => t.Tipo_Ausencia_ID == solicitud.Tipo_Ausencia_ID);

                var empleadoNombre = await ObtenerNombreEmpleado(solicitud.Empleado_ID);
                var rrhhId = await ObtenerRrhhDestinoId(solicitud.Empleado_ID);
                var rrhhNombre = await ObtenerNombreEmpleado(rrhhId);
                var jefeDirectoId = await ObtenerJefaturaDirectaId(solicitud.Empleado_ID);
                var tieneJefatura = jefeDirectoId.HasValue && jefeDirectoId.Value != solicitud.Empleado_ID;
                string? jefaturaNombre = null;
                if (tieneJefatura)
                    jefaturaNombre = await ObtenerNombreEmpleado(jefeDirectoId.Value);
                var nominaId = await ObtenerNominaDestinoId(solicitud.Empleado_ID);
                var nominaNombre = await ObtenerNombreEmpleado(nominaId);

                var solicitudPendiente = string.Equals(solicitud.Estado_Solicitud, "PENDIENTE", StringComparison.OrdinalIgnoreCase);
                var puedeAprobar = solicitudPendiente
                    && solicitud.Empleado_ID != empleadoId
                    && ((solicitud.Aprobador_ID.HasValue && solicitud.Aprobador_ID.Value == empleadoId)
                        || (!solicitud.Aprobador_ID.HasValue && jefeDirectoId.HasValue && jefeDirectoId.Value == empleadoId));

                var flujo = new List<SolicitudAusenciaFlujoPasoResponse>
                {
                    new()
                    {
                        Etapa = "Solicitud enviada",
                        Responsable = empleadoNombre,
                        Estado = "ENVIADA",
                        Fecha = solicitud.Fecha_Solicitud,
                        Descripcion = "Solicitud registrada por el colaborador."
                    }
                };

                if (tieneJefatura)
                {
                    var jefaturaEstado = "PENDIENTE";

                    if (!string.Equals(solicitud.Estado_Solicitud, "PENDIENTE", StringComparison.OrdinalIgnoreCase))
                        jefaturaEstado = ResolverEstadoAprobacion(solicitud.Estado_Solicitud);
                    else if (solicitud.Aprobador_ID.HasValue && solicitud.Aprobador_ID.Value != jefeDirectoId.Value)
                        jefaturaEstado = "APROBADA";

                    flujo.Add(new SolicitudAusenciaFlujoPasoResponse
                    {
                        Etapa = "Aprobación de jefatura inmediata",
                        Responsable = jefaturaNombre,
                        Estado = jefaturaEstado,
                        Fecha = null,
                        Descripcion = "Revisión inicial por jefatura inmediata."
                    });

                    var estadoEtapaFinal = string.Equals(solicitud.Estado_Solicitud, "PENDIENTE", StringComparison.OrdinalIgnoreCase)
                        ? "PENDIENTE"
                        : ResolverEstadoAprobacion(solicitud.Estado_Solicitud);

                    flujo.Add(new SolicitudAusenciaFlujoPasoResponse
                    {
                        Etapa = await ObtenerNombreEtapaFinal(nominaId),
                        Responsable = nominaNombre,
                        Estado = estadoEtapaFinal,
                        Fecha = estadoEtapaFinal == "PENDIENTE" ? null : solicitud.Fecha_Aprobacion,
                        Descripcion = "Revisión final para aplicación en planilla."
                    });
                }
                else
                {
                    flujo.Add(new SolicitudAusenciaFlujoPasoResponse
                    {
                        Etapa = "Aprobación de jefatura inmediata",
                        Responsable = rrhhNombre,
                        Estado = ResolverEstadoAprobacion(solicitud.Estado_Solicitud),
                        Fecha = solicitud.Fecha_Aprobacion,
                        Descripcion = "Sin jefatura directa asignada; se envía al aprobador configurado."
                    });
                }

                return new SolicitudAusenciaDetalleResponse
                {
                    SolicitudId = solicitud.Solicitud_ID,
                    EmpleadoId = solicitud.Empleado_ID,
                    EmpleadoNombre = empleadoNombre,
                    TipoAusencia = tipoAusencia?.Nombre_Ausencia ?? "No definido",
                    Motivo = solicitud.Motivo,
                    Comentarios = solicitud.Comentarios,
                    FechaInicio = solicitud.Fecha_Inicio,
                    FechaFin = solicitud.Fecha_Fin,
                    FechaSolicitud = solicitud.Fecha_Solicitud,
                    EstadoSolicitud = solicitud.Estado_Solicitud,
                    PuedeAprobar = puedeAprobar,
                    FlujoAprobacion = flujo
                };
            }

            public async Task CancelarAusencia(long solicitudId, int empleadoId)
            {
                var sol = await _context.Solicitudes_Ausencia.FirstOrDefaultAsync(s => s.Solicitud_ID == solicitudId && s.Empleado_ID == empleadoId);
                if (sol != null)
                {
                    sol.Estado_Solicitud = "RETIRADA";

                    var notif = await _context.Notificaciones.FirstOrDefaultAsync(n => n.Referencia_ID == solicitudId && n.Referencia_Tipo == "AUSENCIA" && n.Empleado_Origen_ID == empleadoId);
                    if (notif != null)
                    {
                        notif.Estado = "RETIRADA";
                    }

                    await _context.SaveChangesAsync();
                }
            }

            private async Task<int> ObtenerRrhhDestinoId(int fallbackEmpleadoId)
            {
                var rrhh = await _context.Empleados
                    .Include(e => e.Perfil)
                    .Include(e => e.InformacionPersonal)
                    .FirstOrDefaultAsync(e => e.Perfil != null && e.Perfil.Nombre_Perfil != null &&
                        (e.Perfil.Nombre_Perfil.ToUpper().Contains("RRHH") ||
                         e.Perfil.Nombre_Perfil.ToUpper().Contains("RECURSOS")));

                if (rrhh != null)
                    return rrhh.Empleado_ID;

                var admin = await _context.Empleados
                    .Include(e => e.InformacionPersonal)
                    .FirstOrDefaultAsync(e => e.Empleado_ID == 1 ||
                        (e.InformacionPersonal != null && e.InformacionPersonal.Nombre_Empleado.Contains("Admin")));

                return admin?.Empleado_ID ?? fallbackEmpleadoId;
            }

            private async Task<int?> ObtenerJefaturaDirectaId(int empleadoId)
            {
                try
                {
                    using var command = _context.Database.GetDbConnection().CreateCommand();
                    command.CommandText = @"
                        SELECT TOP 1 eo.Jefe_Empleado_ID
                        FROM Estructura_Organizacional eo
                        WHERE eo.Empleado_ID = @empId
                          AND eo.Jefe_Empleado_ID IS NOT NULL
                        ORDER BY eo.Fecha_Registro DESC
                    ";

                    var param = command.CreateParameter();
                    param.ParameterName = "@empId";
                    param.Value = empleadoId;
                    command.Parameters.Add(param);

                    if (command.Connection.State != System.Data.ConnectionState.Open)
                        await command.Connection.OpenAsync();

                    var result = await command.ExecuteScalarAsync();
                    if (result == null || result == DBNull.Value)
                        return null;

                    return Convert.ToInt32(result);
                }
                catch
                {
                    return null;
                }
            }

            private async Task<string> ObtenerNombreEmpleado(int empleadoId)
            {
                var empleado = await _context.Empleados
                    .Include(e => e.InformacionPersonal)
                    .FirstOrDefaultAsync(e => e.Empleado_ID == empleadoId);

                var nombre = empleado?.InformacionPersonal?.Nombre_Empleado;
                if (!string.IsNullOrWhiteSpace(nombre))
                    return nombre;

                return $"Empleado #{empleadoId}";
            }

            private async Task<string> ObtenerNombreEtapaFinal(int empleadoId)
            {
                var empleado = await _context.Empleados
                    .Include(e => e.Perfil)
                    .Include(e => e.Puesto)
                    .FirstOrDefaultAsync(e => e.Empleado_ID == empleadoId);

                var perfil = (empleado?.Perfil?.Nombre_Perfil ?? string.Empty).ToUpperInvariant();
                var puesto = (empleado?.Puesto?.Nombre_Puesto ?? string.Empty).ToUpperInvariant();
                var perfilNomina = perfil.Contains("NOMINA") || perfil.Contains("NÓMINA") || (perfil.Contains("MINA") && perfil.Contains("N"));
                var puestoNomina = puesto.Contains("NOMINA") || puesto.Contains("NÓMINA") || (puesto.Contains("MINA") && puesto.Contains("N"));

                if (perfilNomina || puestoNomina)
                    return "Aprobación de Analista de Nómina";

                return "Aprobación de RRHH";
            }

            private static string ResolverEstadoAprobacion(string estadoSolicitud)
            {
                if (string.IsNullOrWhiteSpace(estadoSolicitud))
                    return "PENDIENTE";

                if (estadoSolicitud.Equals("APROBADO", StringComparison.OrdinalIgnoreCase)
                    || estadoSolicitud.Equals("APROBADA", StringComparison.OrdinalIgnoreCase))
                    return "APROBADA";

                if (estadoSolicitud.Equals("RECHAZADO", StringComparison.OrdinalIgnoreCase)
                    || estadoSolicitud.Equals("RECHAZADA", StringComparison.OrdinalIgnoreCase))
                    return "RECHAZADA";

                if (estadoSolicitud.Equals("RETIRADA", StringComparison.OrdinalIgnoreCase))
                    return "RETIRADA";

                return "PENDIENTE";
            }

            private static bool EsJornadaCincoDias(Horarios horario)
            {
                if (horario == null)
                    return false;

                var nombre = (horario.Nombre_Horario ?? string.Empty).ToUpper();
                var descripcion = (horario.Descripcion ?? string.Empty).ToUpper();

                return nombre.Contains("5")
                    || nombre.Contains("L-V")
                    || nombre.Contains("LUNES A VIERNES")
                    || descripcion.Contains("5")
                    || descripcion.Contains("L-V")
                    || descripcion.Contains("LUNES A VIERNES");
            }

            public async Task<InformacionEmpleoResponse> ObtenerInformacionEmpleo(int empleadoId)
            {
                var empleado = await _context.Empleados
                    .Include(e => e.InformacionPersonal)
                    .Include(e => e.Puesto)
                    .Include(e => e.Horario)
                    .FirstOrDefaultAsync(e => e.Empleado_ID == empleadoId);

                if (empleado == null) return null;

                var result = new InformacionEmpleoResponse();
                result.DetallesIndividuales.Puesto = empleado.Puesto?.Nombre_Puesto ?? "Sin asignar";
                result.DetallesIndividuales.Horario = empleado.Horario?.Nombre_Horario ?? "Sin asignar";
                result.DetallesIndividuales.Salario = empleado.Puesto?.Salario_Base ?? 0m;

                result.DetallesPuesto.Empleado = empleado.InformacionPersonal?.Nombre_Empleado ?? "Sin asignar";
                result.DetallesPuesto.PuestoDesempenado = result.DetallesIndividuales.Puesto;

                // Query para la Estructura_Organizacional
                using (var command = _context.Database.GetDbConnection().CreateCommand())
                {
                    command.CommandText = @"
                        SELECT 
                            eo.Gerencia_Departamento_ID,
                            dGer.Nombre_Departamento AS Gerencia,
                            jefe.Nombre_Empleado AS JefeInmediato,
                            (
                                SELECT TOP 1 ipG.Nombre_Empleado
                                FROM Estructura_Organizacional eoG
                                INNER JOIN Informacion_Personal ipG ON ipG.Empleado_ID = eoG.Empleado_ID
                                WHERE (eoG.Nivel = 'GERENTE' OR eoG.Nivel = 'GERENTE_GENERAL')
                                  AND (eoG.Gerencia_Departamento_ID = eo.Gerencia_Departamento_ID OR eo.Gerencia_Departamento_ID IS NULL)
                            ) AS Gerente
                        FROM Estructura_Organizacional eo
                        LEFT JOIN Departamentos dGer ON dGer.Departamento_ID = eo.Gerencia_Departamento_ID
                        LEFT JOIN Informacion_Personal jefe ON jefe.Empleado_ID = eo.Jefe_Empleado_ID
                        WHERE eo.Empleado_ID = @empId
                    ";
                    var param = command.CreateParameter();
                    param.ParameterName = "@empId";
                    param.Value = empleadoId;
                    command.Parameters.Add(param);

                    if (command.Connection.State != System.Data.ConnectionState.Open)
                        await command.Connection.OpenAsync();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            result.DetallesPuesto.Gerencia = reader["Gerencia"] != DBNull.Value ? reader["Gerencia"].ToString() : "Sin asignar";
                            result.DetallesPuesto.JefeInmediato = reader["JefeInmediato"] != DBNull.Value ? reader["JefeInmediato"].ToString() : "Sin asignar";
                            result.DetallesPuesto.Gerente = reader["Gerente"] != DBNull.Value ? reader["Gerente"].ToString() : "Sin asignar";
                        }
                        else
                        {
                            result.DetallesPuesto.Gerencia = "N/A";
                            result.DetallesPuesto.JefeInmediato = "N/A";
                            result.DetallesPuesto.Gerente = "N/A";
                        }
                    }
                }

                result.HistorialPuestos.Add(new HistorialPuesto
                {
                    Gerencia = result.DetallesPuesto.Gerencia,
                    Puesto = result.DetallesIndividuales.Puesto,
                    Salario = result.DetallesIndividuales.Salario,
                    FechaInicio = empleado.Fecha_Ingreso,
                    FechaFin = null
                });

                return result;
            }
        }
    }
