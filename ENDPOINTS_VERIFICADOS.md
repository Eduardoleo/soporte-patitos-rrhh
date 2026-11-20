# Endpoints verificados localmente

Fecha: 1 de octubre de 2026. Base: SoportePatitos_Portafolio_Demo. Puerto temporal: 5097.

Actualizado tras validar la configuración exclusivamente local. Los casos anónimos prueban rechazo HTTP 401; no prueban ejecución del negocio. Las lecturas y logins usan únicamente cuentas demo.

| Comprobación | HTTP | Esperado | Resultado |
|---|---:|---:|---|
| Proceso API | 200 | 200 | Correcto |
| SQL y columnas del modelo | 200 | 200 | Correcto |
| OpenAPI | 200 | 200 | Correcto |
| Anónimo get /api/Asistencia/ObtenerTodos | 401 | 401 | Correcto |
| Anónimo get /api/Asistencia/ObtenerPorEmpleado/{empleadoId} | 401 | 401 | Correcto |
| Anónimo post /api/Asistencia/RegistrarEntrada | 401 | 401 | Correcto |
| Anónimo post /api/Asistencia/RegistrarSalida | 401 | 401 | Correcto |
| Anónimo post /api/Asistencia/RegistrarSalidaAlmuerzo | 401 | 401 | Correcto |
| Anónimo post /api/Asistencia/RegistrarRegresoAlmuerzo | 401 | 401 | Correcto |
| Anónimo post /api/Asistencia/JustificarIncidencia | 401 | 401 | Correcto |
| Anónimo get /api/Asistencia/EstadoRelojWeb/{empleadoId} | 401 | 401 | Correcto |
| Anónimo get /api/Asistencia/ResumenPeriodo/{empleadoId} | 401 | 401 | Correcto |
| Anónimo get /api/Asistencia/ReporteGestion | 401 | 401 | Correcto |
| Anónimo get /api/Colillas_Pago/ObtenerTodos | 401 | 401 | Correcto |
| Anónimo get /api/Colillas_Pago/ObtenerPorId/{id} | 401 | 401 | Correcto |
| Anónimo get /api/Colillas_Pago/ObtenerPorEmpleado/{empleadoId} | 401 | 401 | Correcto |
| Anónimo get /api/Colillas_Pago/ObtenerPorPlanilla/{planillaId} | 401 | 401 | Correcto |
| Anónimo post /api/Colillas_Pago/CrearColilla | 401 | 401 | Correcto |
| Anónimo put /api/Colillas_Pago/ActualizarEstadoEnvio/{id} | 401 | 401 | Correcto |
| Anónimo get /api/Departamentos/ObtenerTodos | 401 | 401 | Correcto |
| Anónimo get /api/Empleados/DetallePersonalPorUsuario/{usuarioId} | 401 | 401 | Correcto |
| Anónimo post /api/Empleados/ProcesarSolicitudAusencia/{solicitudId} | 401 | 401 | Correcto |
| Anónimo put /api/Empleados/ActualizarDetallePersonal/{empleadoId} | 401 | 401 | Correcto |
| Anónimo get /api/Empleados/DetallePersonalPorEmpleado/{empleadoId} | 401 | 401 | Correcto |
| Anónimo get /api/Empleados/ObtenerPorUsuarioId/{usuarioId} | 401 | 401 | Correcto |
| Anónimo get /api/Empleados/ObtenerTodos | 401 | 401 | Correcto |
| Anónimo post /api/Empleados/CrearEmpleado | 401 | 401 | Correcto |
| Anónimo put /api/Empleados/ActualizarEmpleado/{id} | 401 | 401 | Correcto |
| Anónimo put /api/Empleados/ActualizarEstado/{id} | 401 | 401 | Correcto |
| Anónimo delete /api/Empleados/EliminarEmpleado/{id} | 401 | 401 | Correcto |
| Anónimo get /api/Empleados/ObtenerPorNombre | 401 | 401 | Correcto |
| Anónimo get /api/Empleados/ObtenerPorId/{id} | 401 | 401 | Correcto |
| Anónimo get /api/Empleados/ObtenerPorCedula | 401 | 401 | Correcto |
| Anónimo get /api/Empleados/ContactosEmergencia/{empleadoId} | 401 | 401 | Correcto |
| Anónimo get /api/Empleados/TiposAusencia | 401 | 401 | Correcto |
| Anónimo get /api/Empleados/AusenciasEmpleado/{empleadoId} | 401 | 401 | Correcto |
| Anónimo get /api/Empleados/ProgramaEquipo/{empleadoId} | 401 | 401 | Correcto |
| Anónimo get /api/Empleados/DocumentosEmitidos/{empleadoId} | 401 | 401 | Correcto |
| Anónimo get /api/Empleados/BalanceAusencias/{empleadoId} | 401 | 401 | Correcto |
| Anónimo get /api/Empleados/Feriados | 401 | 401 | Correcto |
| Anónimo post /api/Empleados/SolicitarAusencia | 401 | 401 | Correcto |
| Anónimo get /api/Empleados/HorarioActual/{empleadoId} | 401 | 401 | Correcto |
| Anónimo post /api/Empleados/SolicitarCambioHorario | 401 | 401 | Correcto |
| Anónimo get /api/Empleados/Notificaciones/{empleadoId} | 401 | 401 | Correcto |
| Anónimo get /api/Empleados/DetalleSolicitudAusencia/{solicitudId} | 401 | 401 | Correcto |
| Anónimo get /api/Empleados/InformacionEmpleo/{empleadoId} | 401 | 401 | Correcto |
| Anónimo get /api/Evaluacion_Detalle/ObtenerTodos | 401 | 401 | Correcto |
| Anónimo get /api/Evaluacion_Detalle/ObtenerPorId/{id} | 401 | 401 | Correcto |
| Anónimo get /api/Evaluacion_Detalle/ObtenerPorEvaluacion/{evaluacionId} | 401 | 401 | Correcto |
| Anónimo post /api/Evaluacion_Detalle/CrearDetalle | 401 | 401 | Correcto |
| Anónimo put /api/Evaluacion_Detalle/ActualizarCalificacion/{id} | 401 | 401 | Correcto |
| Anónimo get /api/Evaluaciones/ObtenerTodos | 401 | 401 | Correcto |
| Anónimo get /api/Evaluaciones/ObtenerPorId/{id} | 401 | 401 | Correcto |
| Anónimo get /api/Evaluaciones/ObtenerPorEmpleado/{empleadoId} | 401 | 401 | Correcto |
| Anónimo post /api/Evaluaciones/CrearEvaluacion | 401 | 401 | Correcto |
| Anónimo put /api/Evaluaciones/ActualizarPromedio/{id} | 401 | 401 | Correcto |
| Anónimo get /api/Horarios/ObtenerTodos | 401 | 401 | Correcto |
| Anónimo get /api/Perfiles/ObtenerTodos | 401 | 401 | Correcto |
| Anónimo get /api/Planillas/ObtenerTodos | 401 | 401 | Correcto |
| Anónimo get /api/Planillas/ObtenerPorId/{id} | 401 | 401 | Correcto |
| Anónimo get /api/Planillas/ObtenerPorPeriodo | 401 | 401 | Correcto |
| Anónimo post /api/Planillas/CrearPlanilla | 401 | 401 | Correcto |
| Anónimo put /api/Planillas/ActualizarEstado/{id} | 401 | 401 | Correcto |
| Anónimo get /api/Preguntas_Evaluacion/ObtenerTodos | 401 | 401 | Correcto |
| Anónimo get /api/Preguntas_Evaluacion/ObtenerPorId/{id} | 401 | 401 | Correcto |
| Anónimo get /api/Puestos/ObtenerTodos | 401 | 401 | Correcto |
| Anónimo get /api/Usuarios/ObtenerTodos | 401 | 401 | Correcto |
| Anónimo get /api/Usuarios/ObtenerPorId/{id} | 401 | 401 | Correcto |
| Anónimo get /api/Usuarios/ObtenerPorNombre | 401 | 401 | Correcto |
| Anónimo post /api/Usuarios/CrearUsuario | 401 | 401 | Correcto |
| Anónimo put /api/Usuarios/ActualizarUsuario/{id} | 401 | 401 | Correcto |
| Anónimo put /api/Usuarios/CambiarPassword/{id} | 401 | 401 | Correcto |
| Anónimo delete /api/Usuarios/EliminarUsuario/{id} | 401 | 401 | Correcto |
| Anónimo post /api/Usuarios/Logout | 401 | 401 | Correcto |
| Anónimo post /api/Usuarios/ValidateToken | 401 | 401 | Correcto |
| Login demo Administrador | 200 | 200 | Correcto |
| Login demo Empleado | 200 | 200 | Correcto |
| Login demo Analista de Nómina | 200 | 200 | Correcto |
| Empleado no lista usuarios | 403 | 403 | Correcto |
| Empleado no lista planillas | 403 | 403 | Correcto |
| Empleado no cambia clave ajena | 403 | 403 | Correcto |
| Admin lista usuarios | 200 | 200 | Correcto |
| Nómina lista planillas | 200 | 200 | Correcto |
| Token válido | 200 | 200 | Correcto |
| Token inválido | 401 | 401 | Correcto |
| Lectura demo /api/Empleados/ObtenerTodos | 200 | 200 | Correcto |
| Lectura demo /api/Departamentos/ObtenerTodos | 200 | 200 | Correcto |
| Lectura demo /api/Horarios/ObtenerTodos | 200 | 200 | Correcto |
| Lectura demo /api/Perfiles/ObtenerTodos | 200 | 200 | Correcto |
| Lectura demo /api/Empleados/TiposAusencia | 200 | 200 | Correcto |
| Lectura demo /api/Asistencia/ObtenerTodos | 200 | 200 | Correcto |
| Reporte de asistencia demo | 200 | 200 | Correcto |
| Reporte no acepta suplantar solicitante | 403 | 403 | Correcto |
| Empleado no crea empleados | 403 | 403 | Correcto |
| Empleado no elimina empleados | 403 | 403 | Correcto |
