

using Azure.Core;
using BL.Interface;
using DA.Interfaces;
using Model.Entities;
using Model.Requests;
using Model.Responses;

namespace BL.Servicios
{
    public class EmpleadosBL : IEmpleadosBL
    {
        private readonly IEmpleadosDA _empleadosDA;

        public EmpleadosBL(IEmpleadosDA empleadosDA)
        {
            _empleadosDA = empleadosDA;
        }

        public async Task<Empleados> ActualizarEmpleado(int id, EmpleadoActualizarRequest request)
        {
            if (id <= 0)
                throw new ArgumentException("ID inválido");

            if (request == null)
                throw new ArgumentException("Datos obligatorios");

            if (string.IsNullOrWhiteSpace(request.Nombre_Empleado))
                throw new ArgumentException("El nombre del empleado es obligatorio");

            if (string.IsNullOrWhiteSpace(request.Correo_Electronico))
                throw new ArgumentException("El correo electrónico es obligatorio");

            if (string.IsNullOrWhiteSpace(request.Estado))
                throw new ArgumentException("El estado es obligatorio");

            if (request.Usuario_ID <= 0)
                throw new ArgumentException("El ID de usuario es obligatorio y debe ser mayor a 0");

            if (request.Perfil_ID <= 0)
                throw new ArgumentException("El ID de perfil es obligatorio y debe ser mayor a 0");

            if (request.Puesto_ID <= 0)
                throw new ArgumentException("El ID de puesto es obligatorio y debe ser mayor a 0");

            if (request.Horario_ID <= 0)
                throw new ArgumentException("El ID de horario es obligatorio y debe ser mayor a 0");

            if (request.Estado != "Activo" && request.Estado != "Inactivo" && request.Estado != "Bloqueado")
                throw new Exception("El estado debe ser 'Activo', 'Inactivo' o 'Bloqueado'");

            if (!request.Correo_Electronico.EndsWith("@patitos.sa.com"))
                throw new ArgumentException("El correo debe terminar en @patitos.sa.com");

            var empleadoActual = await _empleadosDA.ObtenerPorId(id);
            if (empleadoActual == null)
                throw new Exception("El empleado no existe");

            // Actualizar datos laborales
            empleadoActual.Estado = request.Estado;
            empleadoActual.Usuario_ID = request.Usuario_ID;
            empleadoActual.Perfil_ID = request.Perfil_ID;
            empleadoActual.Puesto_ID = request.Puesto_ID;
            empleadoActual.Horario_ID = request.Horario_ID;

            // Actualizar información de contacto
            if (empleadoActual.InformacionContacto == null)
            {
                empleadoActual.InformacionContacto = new InformacionContacto
                {
                    Empleado_ID = id
                };
            }

            empleadoActual.InformacionContacto.Correo_Electronico = request.Correo_Electronico;

            await _empleadosDA.ActualizarDatos(empleadoActual);

            return empleadoActual; 
        }

        public async Task<Empleados> ActualizarEstadoEmpleado(int id, string estado, string motivoInactivo = null)
        {
            if (id <= 0)
                throw new ArgumentException("ID inválido");

            if (string.IsNullOrWhiteSpace(estado))
                throw new ArgumentException("El estado es obligatorio");

            var estadoNormalizado = estado.Trim().ToUpperInvariant();
            var estadosValidos = new[] { "ACTIVO", "INACTIVO", "BLOQUEADO" };
            if (!Array.Exists(estadosValidos, e => e == estadoNormalizado))
                throw new ArgumentException("El estado debe ser ACTIVO, INACTIVO o BLOQUEADO");

            var motivoNormalizado = (motivoInactivo ?? string.Empty).Trim().ToUpperInvariant();
            var motivosValidosInactivo = new[] { "DESPIDO", "RENUNCIA", "MUERTE" };
            if (estadoNormalizado == "INACTIVO")
            {
                if (!Array.Exists(motivosValidosInactivo, m => m == motivoNormalizado))
                    throw new ArgumentException("Para INACTIVO debe indicar un motivo válido: DESPIDO, RENUNCIA o MUERTE");
            }

            var empleado = await _empleadosDA.ObtenerPorId(id);
            if (empleado == null)
                throw new Exception("El empleado no existe");

            empleado.Estado = estadoNormalizado == "INACTIVO"
                ? $"INACTIVO:{motivoNormalizado}"
                : estadoNormalizado;
            await _empleadosDA.ActualizarDatos(empleado);

            if (estadoNormalizado == "INACTIVO")
                await _empleadosDA.NotificarVacantePorInactivacion(id, motivoNormalizado);

            return empleado;
        }

        public async Task<Empleados> ActualizarDetallePersonal(int empleadoId, DetallePersonalActualizarRequest request)
        {
            if (empleadoId <= 0)
                throw new ArgumentException("ID de empleado inválido");

            if (request == null)
                throw new ArgumentException("Los datos son obligatorios");

            var empleado = await _empleadosDA.ObtenerPorId(empleadoId);
            if (empleado == null)
                throw new Exception("Empleado no encontrado");

            // Actualizar datos laborales del empleado
            empleado.Fotografia_Url = request.Fotografia_Url;
            empleado.Fecha_Ingreso = request.Fecha_Ingreso;

            // Actualizar información personal si no existe, crearla
            if (empleado.InformacionPersonal == null)
            {
                empleado.InformacionPersonal = new InformacionPersonal
                {
                    Empleado_ID = empleadoId
                };
            }

            empleado.InformacionPersonal.Primer_Nombre = request.Primer_Nombre;
            empleado.InformacionPersonal.Segundo_Nombre = request.Segundo_Nombre;
            empleado.InformacionPersonal.Apellido_Paterno = request.Apellido_Paterno;
            empleado.InformacionPersonal.Apellido_Materno = request.Apellido_Materno;
            empleado.InformacionPersonal.Fecha_Nacimiento = request.Fecha_Nacimiento;
            empleado.InformacionPersonal.Pais_Demografico = request.Pais_Demografico;
            empleado.InformacionPersonal.Estado_Civil = request.Estado_Civil;
            empleado.InformacionPersonal.Genero = request.Genero;

            // Actualizar información de contacto si no existe, crearla
            if (empleado.InformacionContacto == null)
            {
                empleado.InformacionContacto = new InformacionContacto
                {
                    Empleado_ID = empleadoId
                };
            }

            empleado.InformacionContacto.Correo_Electronico = request.Correo_Electronico;
            empleado.InformacionContacto.Correo_Electronico_Personal = request.Correo_Electronico_Personal;
            empleado.InformacionContacto.Telefono_Movil = request.Telefono_Movil;

            // Actualizar información de dirección si no existe, crearla
            if (empleado.InformacionDireccion == null)
            {
                empleado.InformacionDireccion = new InformacionDireccion
                {
                    Empleado_ID = empleadoId
                };
            }

            empleado.InformacionDireccion.Pais = request.Direccion_Pais;
            empleado.InformacionDireccion.Provincia = request.Direccion_Provincia;
            empleado.InformacionDireccion.Canton = request.Direccion_Canton;
            empleado.InformacionDireccion.Distrito = request.Direccion_Distrito;
            empleado.InformacionDireccion.Direccion_Exacta = request.Direccion_Exacta;

            // Actualizar información de identificación si no existe, crearla
            if (empleado.InformacionIdentificacion == null)
            {
                empleado.InformacionIdentificacion = new InformacionIdentificacion
                {
                    Empleado_ID = empleadoId
                };
            }

            empleado.InformacionIdentificacion.Nivel_Educacion_Superior = request.Nivel_Educacion_Superior;
            empleado.InformacionIdentificacion.Pais_Identificacion = request.Pais_Identificacion;
            empleado.InformacionIdentificacion.Tipo_Identificador_Nacional = request.Tipo_Identificador_Nacional;
            empleado.InformacionIdentificacion.Identificador_Nacional = request.Identificador_Nacional;
            empleado.InformacionIdentificacion.Pais_Seguridad_Social = request.Pais_Seguridad_Social;
            empleado.InformacionIdentificacion.Tipo_Seguridad_Social = request.Tipo_Seguridad_Social;
            empleado.InformacionIdentificacion.Identificador_Seguridad_Social = request.Identificador_Seguridad_Social;
            empleado.InformacionIdentificacion.Mensaje_Discapacidad = request.Mensaje_Discapacidad;

            await _empleadosDA.ActualizarDatos(empleado);
            return empleado;
        }

        public async Task<Empleados> CrearEmpleado(Empleados empleado)
        {
            if (empleado == null)
                throw new Exception("El empleado no puede ser nulo");

            if (string.IsNullOrWhiteSpace(empleado.Cedula))
                throw new ArgumentException("La cédula es obligatoria");

            if (empleado.Usuario_ID <= 0)
                throw new ArgumentException("El ID de usuario es obligatorio y debe ser mayor a 0");

            if (empleado.Perfil_ID <= 0)
                throw new ArgumentException("El ID de perfil es obligatorio y debe ser mayor a 0");

            if (empleado.Puesto_ID <= 0)
                throw new ArgumentException("El ID de puesto es obligatorio y debe ser mayor a 0");

            if (empleado.Horario_ID <= 0)
                throw new ArgumentException("El ID de horario es obligatorio y debe ser mayor a 0");

            var existente = await _empleadosDA.ObtenerPorCedula(empleado.Cedula);

            if (existente != null)
                throw new InvalidOperationException("El numero de cedula ya existe");

            empleado.Estado = "ACTIVO";
            empleado.Fecha_Ingreso = DateTime.Now;

            await _empleadosDA.InsertarDatos(empleado);

            return empleado;
        }

        public async Task EliminarEmpleado(int id)
        {
            if (id <= 0)
                throw new ArgumentException("ID inválido");

            var existente = await _empleadosDA.ObtenerPorId(id);
            if (existente == null)
                throw new InvalidOperationException("El empleado no existe");

            await _empleadosDA.EliminarDatos(existente);
        }


        public async Task<Empleados> ObtenerPorCedula(string cedula)
        {
           
            if (string.IsNullOrWhiteSpace(cedula))
                throw new ArgumentException("La cédula es obligatoria");

            if (cedula.Length != 9)
                throw new ArgumentException("La cédula debe tener 9 dígitos");

            foreach (char c in cedula)
            {
                if (c < '0' || c > '9')
                    throw new ArgumentException("La cédula solo debe contener números");
            }

            var empleado = await _empleadosDA.ObtenerPorCedula(cedula);

            if (empleado == null)
                throw new Exception("Empleado no encontrado");

            return empleado;
        }


        public async Task<Empleados> ObtenerPorId(int id)
        {
            if(id <= 0)
                throw new ArgumentException("ID inválido");

            return await _empleadosDA.ObtenerPorId(id);
        }

        public async Task<Empleados> ObtenerPorUsuarioId(int usuarioId)
        {
            if (usuarioId <= 0)
                throw new ArgumentException("ID de usuario inválido");

            return await _empleadosDA.ObtenerPorUsuarioId(usuarioId);
        }

        public async Task<Empleados> ObtenerEmpleadoPorUsuarioId(int usuarioId)
        {
            if (usuarioId <= 0)
                throw new ArgumentException("ID de usuario inválido");

            return await _empleadosDA.ObtenerPorUsuarioId(usuarioId);
        }

        public async Task<Empleados> ObtenerPorNombre(string nombreEmpleado)
        {
            if(nombreEmpleado == null)
                throw new ArgumentException("El nombre es obligatorio");

            // La búsqueda de nombre es en InformacionPersonal ahora
            return await _empleadosDA.ObtenerPorNombre(nombreEmpleado);
        }

        public async Task<List<Empleados>> ObtenerTodos(bool incluirInactivos = false)
        {
            return await _empleadosDA.ObtenerTodos(incluirInactivos);
        }

            public async Task<List<ContactosEmergencia>> ObtenerContactosEmergencia(int empleadoId)
            {
                if (empleadoId <= 0)
                    throw new ArgumentException("El ID del empleado es inválido");
                return await _empleadosDA.ObtenerContactosEmergencia(empleadoId);
            }

            public async Task<List<TipoAusencia>> ObtenerTiposAusencia()
            {
                return await _empleadosDA.ObtenerTiposAusencia();
            }

            public async Task<List<SolicitudAusencia>> ObtenerAusenciasEmpleado(int empleadoId)
            {
                if (empleadoId <= 0)
                    throw new ArgumentException("El ID del empleado es inválido");
                return await _empleadosDA.ObtenerAusenciasEmpleado(empleadoId);
            }

            public async Task<List<ProgramaEquipoItemResponse>> ObtenerProgramaEquipo(int empleadoId)
            {
                if (empleadoId <= 0)
                    throw new ArgumentException("El ID del empleado es inválido");

                return await _empleadosDA.ObtenerProgramaEquipo(empleadoId);
            }

            public async Task<List<DocumentoEmpleadoResponse>> ObtenerDocumentosEmitidos(int empleadoId)
            {
                if (empleadoId <= 0)
                    throw new ArgumentException("El ID del empleado es inválido");

                return await _empleadosDA.ObtenerDocumentosEmitidos(empleadoId);
            }

            public async Task<BalanceAusenciasResponse> ObtenerBalanceAusencias(int empleadoId, DateTime fechaReferencia)
            {
                if (empleadoId <= 0)
                    throw new ArgumentException("El ID del empleado es inválido");

                return await _empleadosDA.ObtenerBalanceAusencias(empleadoId, fechaReferencia);
            }

            public async Task<List<Feriado>> ObtenerFeriados()
            {
                return await _empleadosDA.ObtenerFeriados();
            }

            public async Task SolicitarAusencia(SolicitudAusencia solicitud)
            {
                await _empleadosDA.SolicitarAusencia(solicitud);
            }

            public async Task SolicitarCambioHorario(SolicitarCambioHorarioRequest request)
            {
                if (request == null)
                    throw new ArgumentException("La solicitud es obligatoria");

                if (request.Empleado_ID <= 0)
                    throw new ArgumentException("El ID del empleado es inválido");

                if (request.Horario_Actual_ID <= 0 || request.Horario_Solicitado_ID <= 0)
                    throw new ArgumentException("Debe indicar horario actual y horario solicitado");

                if (request.Horario_Actual_ID == request.Horario_Solicitado_ID)
                    throw new ArgumentException("El horario solicitado debe ser diferente al actual");

                if (string.IsNullOrWhiteSpace(request.Motivo))
                    throw new ArgumentException("Debe indicar el motivo o justificación del cambio");

                await _empleadosDA.SolicitarCambioHorario(request);
            }

            public async Task<List<Notificacion>> ObtenerNotificaciones(int empleadoId)
            {
                return await _empleadosDA.ObtenerNotificaciones(empleadoId);
            }

            public async Task<HorarioActualResponse> ObtenerHorarioActual(int empleadoId)
            {
                if (empleadoId <= 0)
                    throw new ArgumentException("El ID del empleado es inválido");

                return await _empleadosDA.ObtenerHorarioActual(empleadoId);
            }

            public async Task<SolicitudAusenciaDetalleResponse> ObtenerDetalleSolicitudAusencia(long solicitudId, int empleadoId)
            {
                if (solicitudId <= 0)
                    throw new ArgumentException("El ID de solicitud es inválido");

                if (empleadoId <= 0)
                    throw new ArgumentException("El ID de empleado es inválido");

                return await _empleadosDA.ObtenerDetalleSolicitudAusencia(solicitudId, empleadoId);
            }

            public async Task<string> ProcesarSolicitudAusencia(long solicitudId, int empleadoAprobadorId, string accion, string? comentario)
            {
                if (solicitudId <= 0)
                    throw new ArgumentException("El ID de solicitud es inválido");

                if (empleadoAprobadorId <= 0)
                    throw new ArgumentException("El aprobador es inválido");

                if (string.IsNullOrWhiteSpace(accion))
                    throw new ArgumentException("La acción es obligatoria");

                var accionNormalizada = accion.Trim().ToUpperInvariant();
                if (accionNormalizada != "APROBAR" && accionNormalizada != "RECHAZAR")
                    throw new ArgumentException("La acción debe ser APROBAR o RECHAZAR");

                return await _empleadosDA.ProcesarSolicitudAusencia(solicitudId, empleadoAprobadorId, accionNormalizada, comentario);
            }

            public async Task CancelarAusencia(long solicitudId, int empleadoId)
            {
                await _empleadosDA.CancelarAusencia(solicitudId, empleadoId);
            }

            public async Task<InformacionEmpleoResponse> ObtenerInformacionEmpleo(int empleadoId)
            {
                if (empleadoId <= 0)
                    throw new ArgumentException("El ID del empleado es inválido");

                return await _empleadosDA.ObtenerInformacionEmpleo(empleadoId);
            }
        }
    }
