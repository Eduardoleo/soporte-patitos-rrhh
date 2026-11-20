using BL.Interface;
using BL.Servicios;
using Microsoft.AspNetCore.Mvc;
using Model.Entities;
using Model.Requests;
using Model.Responses;

namespace SoportePatitosS.A.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmpleadosController : ControllerBase
    {
        private readonly IEmpleadosBL _empleadosBL;

        public EmpleadosController(IEmpleadosBL empleadosBL)
        {
            _empleadosBL = empleadosBL;
        }

        [HttpGet("DetallePersonalPorUsuario/{usuarioId}")]
        public async Task<ActionResult<DetallePersonalResponse>> DetallePersonalPorUsuario(int usuarioId)
        {
            try
            {
                if (usuarioId <= 0)
                    return BadRequest("El usuario es inválido");

                var empleado = await _empleadosBL.ObtenerPorUsuarioId(usuarioId);

                if (empleado == null)
                    return NotFound("No se encontró información personal para este usuario");

                return Ok(MapearDetallePersonal(empleado));
            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }

        [HttpPost("ProcesarSolicitudAusencia/{solicitudId}")]
        public async Task<IActionResult> ProcesarSolicitudAusencia(long solicitudId, [FromBody] ProcesarSolicitudAusenciaRequest request)
        {
            try
            {
                var resultado = await _empleadosBL.ProcesarSolicitudAusencia(
                    solicitudId,
                    request.EmpleadoAprobadorId,
                    request.Accion,
                    request.Comentario);

                return Ok(new { mensaje = resultado });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }

        [HttpPut("ActualizarDetallePersonal/{empleadoId}")]
        public async Task<ActionResult<DetallePersonalResponse>> ActualizarDetallePersonal(int empleadoId, [FromBody] DetallePersonalActualizarRequest request)
        {
            try
            {
                var actualizado = await _empleadosBL.ActualizarDetallePersonal(empleadoId, request);
                return Ok(MapearDetallePersonal(actualizado));
            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }

        [HttpGet("DetallePersonalPorEmpleado/{empleadoId}")]
        public async Task<ActionResult<DetallePersonalResponse>> DetallePersonalPorEmpleado(int empleadoId)
        {
            try
            {
                if (empleadoId <= 0)
                    return BadRequest("El empleado es inválido");

                var empleado = await _empleadosBL.ObtenerPorId(empleadoId);

                if (empleado == null)
                    return NotFound("No se encontró información personal para este empleado");

                return Ok(MapearDetallePersonal(empleado));
            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }

        private static DetallePersonalResponse MapearDetallePersonal(Empleados empleado)
        {
            var infoPersonal = empleado.InformacionPersonal;
            var infoContacto = empleado.InformacionContacto;
            var infoDireccion = empleado.InformacionDireccion;
            var infoIdentificacion = empleado.InformacionIdentificacion;

            var identificadorNacional = infoIdentificacion != null && !string.IsNullOrWhiteSpace(infoIdentificacion.Identificador_Nacional)
                ? infoIdentificacion.Identificador_Nacional
                : empleado.Cedula;

            var identificadorSeguridadSocial = infoIdentificacion != null && !string.IsNullOrWhiteSpace(infoIdentificacion.Identificador_Seguridad_Social)
                ? infoIdentificacion.Identificador_Seguridad_Social
                : empleado.Cedula;

            var nombreCompleto = infoPersonal?.Nombre_Empleado ?? "";

            return new DetallePersonalResponse
            {
                EmpleadoId = empleado.Empleado_ID,
                ApellidoPaterno = infoPersonal?.Apellido_Paterno,
                ApellidoMaterno = infoPersonal?.Apellido_Materno,
                Nombre = infoPersonal?.Primer_Nombre,
                SegundoNombre = infoPersonal?.Segundo_Nombre,
                FechaInicio = empleado.Fecha_Ingreso,
                FotografiaUrl = empleado.Fotografia_Url,
                FotografiaDescripcion = string.IsNullOrWhiteSpace(empleado.Fotografia_Url)
                    ? null
                    : $"Fotografía - {nombreCompleto.ToUpperInvariant()}",
                PaisDemografico = infoPersonal?.Pais_Demografico,
                EstadoCivil = infoPersonal?.Estado_Civil,
                Genero = infoPersonal?.Genero,
                NivelEducacionSuperior = infoIdentificacion?.Nivel_Educacion_Superior,
                PaisDocumento = infoIdentificacion?.Pais_Identificacion,
                TipoIdentificadorNacional = infoIdentificacion?.Tipo_Identificador_Nacional,
                IdentificadorNacional = MascararIdentificador(identificadorNacional),
                TipoSeguridadSocial = infoIdentificacion?.Tipo_Seguridad_Social,
                IdentificadorSeguridadSocial = MascararIdentificador(identificadorSeguridadSocial),
                FechaNacimiento = infoPersonal?.Fecha_Nacimiento,
                EdadTexto = CalcularEdadTexto(infoPersonal?.Fecha_Nacimiento),
                MensajeDiscapacidad = infoIdentificacion?.Mensaje_Discapacidad,

                CorreoElectronico = infoContacto?.Correo_Electronico,
                CorreoElectronicoPersonal = infoContacto?.Correo_Electronico_Personal,
                TelefonoMovil = infoContacto?.Telefono_Movil,
                DireccionPais = infoDireccion?.Pais,
                DireccionProvincia = infoDireccion?.Provincia,
                DireccionCanton = infoDireccion?.Canton,
                DireccionDistrito = infoDireccion?.Distrito,
                DireccionExacta = infoDireccion?.Direccion_Exacta
            };
        }

        [HttpGet("ObtenerPorUsuarioId/{usuarioId}")]
        public async Task<ActionResult<Empleados>> ObtenerPorUsuarioId(int usuarioId)
        {
            try
            {
                var empleado = await _empleadosBL.ObtenerPorUsuarioId(usuarioId);

                if (empleado == null)
                    return NotFound("Empleado no encontrado");

                return Ok(empleado);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }

        private static string MascararIdentificador(string valor)
        {
            if (string.IsNullOrWhiteSpace(valor))
                return null;

            if (valor.Length <= 3)
                return new string('•', valor.Length);

            return new string('•', valor.Length - 3) + valor[^3..];
        }

        private static string CalcularEdadTexto(DateTime? fechaNacimiento)
        {
            if (!fechaNacimiento.HasValue)
                return null;

            var hoy = DateTime.Today;
            var fecha = fechaNacimiento.Value.Date;

            var años = hoy.Year - fecha.Year;
            if (fecha > hoy.AddYears(-años)) años--;

            var meses = hoy.Month - fecha.Month;
            if (hoy.Day < fecha.Day) meses--;
            if (meses < 0) meses += 12;

            var inicioMesActual = new DateTime(hoy.Year, hoy.Month, 1);
            var dias = (hoy - inicioMesActual).Days + 1;

            return $"{años} Años {meses} Meses {dias} Días";
        }

        [HttpGet("ObtenerTodos")]
        public async Task<ActionResult<List<EmpleadoGestionResponse>>> ObtenerTodos([FromQuery] bool incluirInactivos = false, [FromQuery] int? usuarioSolicitanteId = null)
        {
            try 
            {
                var permitirInactivos = false;
                if (incluirInactivos && usuarioSolicitanteId.HasValue)
                {
                    var empleadoSolicitante = await _empleadosBL.ObtenerPorUsuarioId(usuarioSolicitanteId.Value);
                    var perfilSolicitante = (empleadoSolicitante?.Perfil?.Nombre_Perfil ?? string.Empty).ToUpperInvariant();
                    permitirInactivos = perfilSolicitante.Contains("ADMIN");
                }

                var empleados = await _empleadosBL.ObtenerTodos(permitirInactivos);
                var response = empleados.Select(e => new EmpleadoGestionResponse
                {
                    Empleado_ID = e.Empleado_ID,
                    Cedula = e.Cedula,
                    Estado = e.Estado,
                    Fecha_Ingreso = e.Fecha_Ingreso,
                    InformacionPersonal = e.InformacionPersonal == null
                        ? null
                        : new EmpleadoGestionInformacionPersonalResponse
                        {
                            Nombre_Empleado = e.InformacionPersonal.Nombre_Empleado,
                            Primer_Nombre = e.InformacionPersonal.Primer_Nombre,
                            Apellido_Paterno = e.InformacionPersonal.Apellido_Paterno,
                            Apellido_Materno = e.InformacionPersonal.Apellido_Materno
                        },
                    Puesto = e.Puesto == null
                        ? null
                        : new EmpleadoGestionPuestoResponse
                        {
                            Puesto_ID = e.Puesto.Puesto_ID,
                            Departamento_ID = e.Puesto.Departamento_ID,
                            Nombre_Puesto = e.Puesto.Nombre_Puesto,
                            Salario_Base = e.Puesto.Salario_Base
                        },
                    ContactosEmergencia = (e.ContactosEmergencia ?? new List<ContactosEmergencia>())
                        .Select(c => new EmpleadoGestionContactoEmergenciaResponse
                        {
                            Contacto_ID = c.Contacto_ID,
                            Nombre_Completo = c.Nombre_Completo,
                            Telefono_Contacto = c.Telefono_Contacto,
                            Relacion = c.Relacion
                        }).ToList()
                }).ToList();

                return Ok(response);

            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }

        [HttpPost("CrearEmpleado")]
        [Microsoft.AspNetCore.Authorization.Authorize(Policy = "Administracion")]
        public async Task<ActionResult<Empleados>> CrearEmpleado([FromBody] CrearEmpleadoRequest request)
        {
            try
            {
                var empleado = new Empleados
                {
                    Usuario_ID = request.Usuario_ID,
                    Perfil_ID = request.Perfil_ID,
                    Puesto_ID = request.Puesto_ID,
                    Horario_ID = request.Horario_ID,
                    Cedula = request.Cedula,
                    InformacionContacto = new InformacionContacto
                    {
                        Correo_Electronico = request.Correo_Electronico
                    }
                };

                var creado = await _empleadosBL.CrearEmpleado(empleado);

                return Ok(creado); 
            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }


        [HttpPut("ActualizarEmpleado/{id}")]
        [Microsoft.AspNetCore.Authorization.Authorize(Policy = "Administracion")]
        public async Task<ActionResult<Empleados>> ActualizarEmpleado(int id, [FromBody] EmpleadoActualizarRequest request)
        {
            try
            {
                var actualizado = await _empleadosBL.ActualizarEmpleado(id, request);
                return Ok(actualizado); 
            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }

        [HttpPut("ActualizarEstado/{id}")]
        [Microsoft.AspNetCore.Authorization.Authorize(Policy = "Administracion")]
        public async Task<ActionResult<Empleados>> ActualizarEstado(int id, [FromBody] ActualizarEstadoEmpleadoRequest request)
        {
            try
            {
                var actualizado = await _empleadosBL.ActualizarEstadoEmpleado(id, request?.Estado, request?.Motivo_Inactivo);
                return Ok(actualizado);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }


        [HttpDelete("EliminarEmpleado/{id}")]
        [Microsoft.AspNetCore.Authorization.Authorize(Policy = "Administracion")]
        public async Task<ActionResult> EliminarUsuario(int id)
        {
            try
            {
                await _empleadosBL.EliminarEmpleado(id);
                return Ok("Usuario eliminado correctamente");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }


        [HttpGet("ObtenerPorNombre")]
        public async Task<ActionResult<Empleados>> ObtenerPorNombre([FromQuery] string nombreEmpleado)
        {
            try
            {
                var empleados = await _empleadosBL.ObtenerPorNombre(nombreEmpleado);
                if (empleados == null)
                    return NotFound("Empleado no encontrado");

                return Ok(empleados);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }


        [HttpGet("ObtenerPorId/{id}")]
        public async Task<ActionResult<Empleados>> ObtenerPorId(int id)
        {
            try 
            {
                var empleados = await _empleadosBL.ObtenerPorId(id);

                if (empleados == null)
                    return NotFound("Empleado no encontrado");

                return Ok(empleados);

            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }



        [HttpGet("ObtenerPorCedula")]
        public async Task<ActionResult<Empleados>> ObtenerPorCedula([FromQuery] string cedula )
        {
            try 
            {
                var empleados = await _empleadosBL.ObtenerPorCedula(cedula);

                if (empleados == null)
                    return NotFound("Empleado no encontrado");

                return Ok(empleados);

            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }



        [HttpGet("ContactosEmergencia/{empleadoId}")]
        public async Task<ActionResult<List<ContactoEmergenciaResponse>>> ContactosEmergencia(int empleadoId)
        {
            try
            {
                var contactos = await _empleadosBL.ObtenerContactosEmergencia(empleadoId);
                var response = contactos.Select(c => new ContactoEmergenciaResponse
                {
                    ContactoId = c.Contacto_ID,
                    EmpleadoId = c.Empleado_ID,
                    NombreCompleto = c.Nombre_Completo,
                    Relacion = c.Relacion,
                    EsCargaFamiliar = c.Es_Carga_Familiar,
                    TelefonoContacto = c.Telefono_Contacto,
                    FechaRegistro = c.Fecha_Registro
                }).ToList();
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }

        [HttpGet("TiposAusencia")]
        public async Task<ActionResult<List<TipoAusencia>>> ObtenerTiposAusencia()
        {
            var tipos = await _empleadosBL.ObtenerTiposAusencia();
            return Ok(tipos);
        }

        [HttpGet("AusenciasEmpleado/{empleadoId}")]
        public async Task<ActionResult<List<SolicitudAusencia>>> ObtenerAusenciasEmpleado(int empleadoId)
        {
            try
            {
                if (empleadoId <= 0)
                    return BadRequest("El ID del empleado es inválido");

                var ausencias = await _empleadosBL.ObtenerAusenciasEmpleado(empleadoId);
                return Ok(ausencias);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }

        [HttpGet("ProgramaEquipo/{empleadoId}")]
        public async Task<ActionResult<List<ProgramaEquipoItemResponse>>> ObtenerProgramaEquipo(int empleadoId)
        {
            try
            {
                if (empleadoId <= 0)
                    return BadRequest("El ID del empleado es inválido");

                var programa = await _empleadosBL.ObtenerProgramaEquipo(empleadoId);
                return Ok(programa);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }

        [HttpGet("DocumentosEmitidos/{empleadoId}")]
        public async Task<ActionResult<List<DocumentoEmpleadoResponse>>> ObtenerDocumentosEmitidos(int empleadoId)
        {
            try
            {
                if (empleadoId <= 0)
                    return BadRequest("El ID del empleado es inválido");

                var docs = await _empleadosBL.ObtenerDocumentosEmitidos(empleadoId);
                return Ok(docs);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }

        [HttpGet("BalanceAusencias/{empleadoId}")]
        public async Task<ActionResult<BalanceAusenciasResponse>> ObtenerBalanceAusencias(int empleadoId, [FromQuery] DateTime? fechaReferencia)
        {
            try
            {
                if (empleadoId <= 0)
                    return BadRequest("El ID del empleado es inválido");

                var fecha = fechaReferencia?.Date ?? DateTime.Today;
                var balance = await _empleadosBL.ObtenerBalanceAusencias(empleadoId, fecha);

                if (balance == null)
                    return NotFound("No se encontró información de balance para este empleado");

                return Ok(balance);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }

        [HttpGet("Feriados")]
        public async Task<ActionResult<List<Feriado>>> ObtenerFeriados()
        {
            try
            {
                var feriados = await _empleadosBL.ObtenerFeriados();
                return Ok(feriados);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }

        [HttpPost("SolicitarAusencia")]
        public async Task<IActionResult> SolicitarAusencia([FromBody] SolicitudAusencia solicitud)
        {
            try
            {
                solicitud.Fecha_Solicitud = DateTime.Now;
                solicitud.Estado_Solicitud = "PENDIENTE";
                await _empleadosBL.SolicitarAusencia(solicitud);
                return Ok(solicitud);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }

        [HttpGet("HorarioActual/{empleadoId}")]
        public async Task<ActionResult<HorarioActualResponse>> ObtenerHorarioActual(int empleadoId)
        {
            try
            {
                if (empleadoId <= 0)
                    return BadRequest("El ID del empleado es inválido");

                var horario = await _empleadosBL.ObtenerHorarioActual(empleadoId);
                if (horario == null)
                    return NotFound("No se encontró horario actual para este empleado");

                return Ok(horario);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }

        [HttpPost("SolicitarCambioHorario")]
        public async Task<IActionResult> SolicitarCambioHorario([FromBody] SolicitarCambioHorarioRequest request)
        {
            try
            {
                await _empleadosBL.SolicitarCambioHorario(request);
                return Ok(new { mensaje = "Solicitud de cambio de horario enviada para aprobación." });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }

        [HttpGet("Notificaciones/{empleadoId}")]
        public async Task<ActionResult<List<Notificacion>>> ObtenerNotificaciones(int empleadoId)
        {
            var notificaciones = await _empleadosBL.ObtenerNotificaciones(empleadoId);
            return Ok(notificaciones);
        }

        [HttpGet("DetalleSolicitudAusencia/{solicitudId}")]
        public async Task<ActionResult<SolicitudAusenciaDetalleResponse>> ObtenerDetalleSolicitudAusencia(long solicitudId, [FromQuery] int empleadoId)
        {
            try
            {
                var detalle = await _empleadosBL.ObtenerDetalleSolicitudAusencia(solicitudId, empleadoId);
                if (detalle == null)
                    return NotFound("No se encontró el detalle de la solicitud de ausencia");

                return Ok(detalle);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }

        [HttpGet("InformacionEmpleo/{empleadoId}")]
        public async Task<ActionResult<InformacionEmpleoResponse>> ObtenerInformacionEmpleo(int empleadoId)
        {
            try
            {
                if (empleadoId <= 0)
                    return BadRequest("El ID del empleado es inválido");

                var info = await _empleadosBL.ObtenerInformacionEmpleo(empleadoId);
                if (info == null)
                    return NotFound("No se encontró información de empleo para este empleado");

                return Ok(info);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }
    }
}
