# Revisión técnica y evidencia histórica

Este documento conserva las notas del README anterior para trazabilidad. Sus
instrucciones de arranque y afirmaciones de estado son históricas; el procedimiento
vigente es exclusivamente el README principal. No ejecutar los comandos heredados
para generar archivos locales de claves. No hay rotaciones de secretos pendientes
según la confirmación del propietario.

## Verificaciones recientes

- Integración de SP-01 con SP-02: 49 comprobaciones sin SQL aprobadas.
- Persistencia de colilla mediante BL/DA: cálculo guardado y rollback aprobados en
  `localhost`, exclusivamente `SoportePatitos_Portafolio_Demo`.
- SP-03: arranque/readiness con clave de user-secrets aprobado.
- SP-04: seis casos nuevos de alias aprobados, además de los existentes.
- SP-06: 76 comprobaciones HTTP sin login aprobadas en una copia temporal con
  SP-01 integrada. El modo opcional de login se verificó con tres cuentas
  temporales provisionadas en la demo: 96 comprobaciones HTTP aprobadas y
  limpieza exacta, sin modificar las cuentas originales. No se probó la creación
  del esquema de una base nueva ni la entrada interactiva oculta.
- No se ejecutaron scripts de reset. No se adjuntan capturas nuevas ni métricas
  de rendimiento para el portafolio.

## Integración final local (sin mezcla en main)

En una worktree temporal se combinaron SP-01, SP-02, SP-03, SP-04 y SP-06 con
este README. Pasaron 55 verificaciones sin SQL (49 existentes más seis de alias),
la prueba de persistencia/rollback, el arranque con user-secrets, las ocho
comprobaciones HTTP de colillas y las 76 comprobaciones HTTP generales sin login.
La conexión local de user-secrets usa localhost y la misma base demo autorizada;
la clave JWT se conservó. Se verificó después la provisión compartida de tres cuentas temporales y el
login opcional (96 comprobaciones); se eliminaron sus filas y se conservaron
las cuentas originales. No se ejecutó provisión de un esquema nuevo.

## Notas anteriores (no describen el estado actual)

Consultar [el informe de revisión](REVISION_LOCAL.md) y [el detalle HTTP](ENDPOINTS_VERIFICADOS.md). Se conserva el cambio preexistente en `ClientApp/src/pages/Planillas.js`; su copia de referencia está en `.local/planillas-cambios-previos.patch`.

La protección anónima cubre los controladores; la matriz completa de roles y pertenencia de registros sigue pendiente. También faltan pruebas de flujos completos de ausencias, colillas, cálculos y concurrencia. No publicar esta demo como aplicación de producción.

Los secretos retirados pueden permanecer en el historial Git anterior. El propietario de la cuenta externa debe revocarlos o rotarlos; cambiar el archivo local no los revoca. No se intentó utilizar las credenciales de Azure. Los nueve SQL heredados están en `ArchivoSQL/`, con extensión `.sql.txt`, como referencias fuera del arranque local. Incluyen datos y accesos históricos y no se ejecutaron en esta revisión.

El remoto Git ajeno fue retirado. No hay remotos configurados ni identidad `user.name`/`user.email` impuesta por este repositorio. El historial y los créditos de autoría se conservan; configurar tu remoto se hará cuando preparemos la publicación, sin inventar una cuenta de GitHub.

La web del portafolio, GitHub Student y el despliegue en nube corresponden a una etapa posterior.
