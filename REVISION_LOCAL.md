# Primera entrega: revisión local de Soporte Patitos

Fecha: 1 de octubre de 2026. Alcance: configuración propia, arranque local, protección inicial de API, contraseñas y una optimización del reporte. Los otros proyectos y el despliegue no se modificaron.

## Resultado

- Backend compilado y API ejecutada contra una base demo independiente.
- 23 comprobaciones de lógica, seguridad y configuración correctas tras completar la localización del entorno.
- 95 comprobaciones HTTP correctas, incluidas 72 operaciones de controladores que rechazan peticiones sin autenticar. Esto valida el bloqueo anónimo, no todas las reglas de negocio de esas operaciones.
- Tres pruebas unitarias del formulario de login correctas: éxito, error y dominio no admitido.
- Frontend compila en modo normal, con advertencias. El build estricto `CI=true` falla por advertencias ESLint preexistentes; no se deshabilitaron reglas del proyecto.
- `git diff --check` sin errores. Los cambios previos de Planillas se conservaron.

## Credenciales y destinos

| Elemento | Antes | Después / comprobación |
|---|---|---|
| SQL principal | `soportepatitos.database.windows.net`, Azure SQL con usuario y contraseña incrustados; propiedad no verificada | Se retiró del archivo compartido. No se utilizó ni se probó esa contraseña. El propietario debe revocarla si estuvo expuesta |
| JWT | Clave fija en appsettings versionado | Clave nueva aleatoria de 64 bytes, local y excluida de Git |
| SQL local existente | `Soporte_Patitos`: 13 tablas y una cuenta; modelo de aplicación incompatible | Inspección de esquema y conteos; no se modificó |
| SQL de pruebas | No había entorno independiente preparado | `localhost`, base `SoportePatitos_Portafolio_Demo`, autenticación Windows, tres cuentas ficticias |
| Usuarios de prueba | Accesos heredados de scripts | Claves aleatorias nuevas en `.local/demo-credentials.json`; no son cuentas personales del propietario |
| Cliente → API | Proxy `localhost:5067` | Conservado; la API se verificó temporalmente en 5097 para no ocupar el puerto de trabajo |
| Avatar externo | `ui-avatars.com` recibía el nombre como parámetro | Recurso local `/Logo.Patitos.jpeg` |
| Correo `@patitos.sa` | Regla fija del login | Sigue siendo un identificador de demostración; no configura SMTP ni envía correo |
| Git `origin` | Repositorio de otra cuenta de GitHub | Remoto retirado por solicitud del usuario. No quedan remotos configurados y no se hizo push. Configurar un remoto propio al preparar la publicación |

No se determinó que el servidor de Azure esté apagado ni que sus credenciales sean válidas. No se hicieron llamadas con cuentas de otras personas. Los enlaces de documentación, registros npm y recursos de los scripts SQL no se confundieron con endpoints del backend.

`Scripts/auditar-configuracion.py` produce un inventario estático sin valores de secretos. Es una búsqueda por patrones, no una auditoría completa ni un análisis del historial Git. La contraseña literal de `Verification/Program.cs` es un valor sintético exclusivo de pruebas en memoria, no una credencial de una cuenta.

## Cambios implementados

1. Configuración compartida sin secretos, inicializador local idempotente y errores claros si faltan conexión o clave. Las variables de entorno siguen teniendo prioridad.
2. Autenticación obligatoria por defecto. Login y comprobaciones de salud son públicos explícitamente; Swagger solo está activo en Development.
3. Gestión de usuarios y mutaciones administrativas de empleados restringidas al rol administrador. Planillas exige administrador o nómina. Un empleado no puede cambiar contraseñas ajenas.
4. El reporte de asistencia utiliza el `EmpleadoId` autenticado y rechaza un solicitante distinto enviado por query string.
5. Nuevas contraseñas con `PasswordHasher` de ASP.NET Core Identity. SHA-256/Base64 heredado se acepta para verificar y se reemplaza después de un login correcto de una cuenta activa. Nunca se migra tras un intento fallido. Los hashes dejan de salir en respuestas JSON.
6. Se eliminó de la consola la respuesta de login que incluía el token.
7. Índices en memoria para asistencia y ausencias, conservando la primera asistencia y la ausencia de fecha más reciente, incluidos empates. Se limita la consulta a los empleados del reporte, se evitan conversiones de fecha sobre las columnas de ausencias y se usa lectura sin seguimiento donde no se actualizan entidades.
8. Scripts reproducibles de verificación y documentación de arranque. No se ejecutaron scripts SQL heredados de reset o carga masiva.

## Rendimiento medido

La corrida Release de la primera entrega, con 1.000 empleados, 3.000 asistencias y 5.000 ausencias sintéticas, dio una mediana de **24,57 ms** para las búsquedas originales y **0,21 ms** para las búsquedas con índice. Se incluyó la construcción del índice, hubo calentamiento y nueve muestras por alternativa. Se comprobó igualdad de resultados con duplicados, empates y ausencias de datos.

Estos valores corresponden a la primera entrega. La repetición posterior al endurecimiento local obtuvo 24,31 ms y 0,46 ms. Son mediciones de CPU en memoria; no prueban que la página o la API completa sean ese número de veces más rápidas. La demo de tres cuentas no representa una carga real. Medir SQL, memoria y latencia HTTP con datos representativos es trabajo pendiente.

El bundle principal generado por el frontend mide aproximadamente **460,54 kB gzip** en esta compilación. Es una línea base, no se optimizó la carga de páginas en esta entrega.

## Qué queda pendiente, por prioridad

1. **Completar permisos por registro y por rol.** Quedan rutas de asistencia, datos personales, ausencias, colillas y evaluaciones donde exigir sesión no basta para asegurar pertenencia. Revisar IDs de rutas/cuerpos y acciones de aprobación antes de exponer la aplicación fuera del equipo.
2. **Autenticación y sesión.** Cambio de contraseña no exige contraseña anterior; logout no revoca JWT en el servidor; vigencia de token y respuesta siguen con valores fijos en código. Falta validar rehash con persistencia mediante pruebas específicas del servicio y ampliar cobertura de bloqueos e intentos concurrentes.
3. **Planillas.** Definir la regla día 13/día 20 sin sobrescribir el cambio previo del usuario; trasladar cálculos verificables al servidor y reemplazar las dos peticiones por empleado con consultas agrupadas. No se verificó cumplimiento normativo de deducciones ni fórmulas.
4. **Base de datos reproducible completa.** La demo usa el modelo EF; no equivale a migrar la base antigua ni contiene todas las jerarquías usadas por SQL manual. Preparar migraciones revisadas, datos de negocio y pruebas de concurrencia. No se necesitan ni se deben reutilizar las credenciales antiguas de Azure.
5. **Advertencias y frontend.** La compilación inicial mostró 374 advertencias C#, principalmente nulabilidad. La compilación posterior mostró 373 antes de los últimos cambios de controladores; no hubo errores de compilación. Hay advertencias ESLint de imports/variables sin uso y dependencias de hooks. Corregirlas por módulo con pruebas, sin silenciar globalmente las reglas.
6. **Recorridos completos.** Verificar UI en navegador y casos de alta/edición de empleados, marcas, ausencias, aprobación y colillas. Las pruebas actuales no incluyen revisión visual ni escrituras exitosas de todos esos procesos.
7. **Portafolio y nube.** Capturas, presentación web y selección de beneficios GitHub Student después de estabilizar funcionamiento y seguridad.

## Archivos para revisar

- [README de arranque](README.md).
- [Resultados HTTP](ENDPOINTS_VERIFICADOS.md).
- `Verification/Program.cs`: comprobaciones y generación de demo.
- `Scripts/verificar-api.ps1`: pruebas HTTP y limpieza del proceso que inicia.
- `.local/verification.log`, `.local/test-frontend.log`, `.local/build-frontend-normal.log` y `.local/build-frontend.log`: evidencia local de pruebas y builds, fuera de Git.
- `.local/demo-credentials.json`: accesos nuevos de demostración, solo para revisión local.

Los procesos de API iniciados por las pruebas se detuvieron al terminar. La base demo y los archivos de configuración se conservan para que el usuario pueda arrancar la aplicación siguiendo el README.

## Entorno local completado, solo Soporte Patitos

- Se retiró `origin` de Git; no se contactó GitHub ni se modificó el historial o la autoría.
- No había identidad Git local `user.name`/`user.email` de otra persona configurada. No se modificó la configuración global de Git del equipo.
- Se quitaron rutas absolutas de respaldo del usuario anterior en los proyectos API, BL y DA.
- Se archivaron nueve SQL heredados en `ArchivoSQL/*.sql.txt`, sin ejecutarlos ni restablecer cuentas.
- Development solo acepta conexión Windows a la base demo en loopback. Se probaron rechazos de host externo, base antigua, usuario SQL, failover externo y claves de servidor duplicadas.
- La base original, las claves aleatorias actuales y el cambio preexistente de Planillas se conservaron.
- De los otros proyectos únicamente se leyeron archivos antes de la aclaración del usuario; no se modificaron.
- Esto retira dependencias operativas de cuentas ajenas. Los documentos históricos, SQL archivados e historial Git conservan referencias del proyecto original; no son configuración activa y no se deben publicar sin una revisión independiente.

Referencias técnicas: [configuración de secretos de ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets), [consultas eficientes con EF Core](https://learn.microsoft.com/en-us/ef/core/performance/efficient-querying).
