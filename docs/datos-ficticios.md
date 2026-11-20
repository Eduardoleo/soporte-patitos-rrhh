# SP-08: datos ficticios en archivos

Sustituciones aplicadas a ejemplos versionados, sin ejecutar SQL ni modificar la base demo. Los correos de contacto usan `ejemplo.test` y los nombres literales de personas se sustituyen por nombres inventados.

| Archivo | Correo | Nombre | Teléfono |
| --- | ---: | ---: | ---: |
| ArchivoSQL/BD_Soporte_Patitos.sql.txt | 1 | 7 | 2 |
| ArchivoSQL/reset_seed_estructura_masiva.sql.txt | 6 | 34 | 13 |
| ArchivoSQL/seed_ecosistema_empresa_soporte.sql.txt | 30 | 51 | 21 |
| ArchivoSQL/seed_jerarquias_usuarios_demo.sql.txt | 0 | 25 | 0 |
| SoportePatitosS.A/ClientApp/package-lock.json | 1 | 0 | 0 |
| SoportePatitosS.A/ClientApp/src/App.test.jsx | 1 | 0 | 0 |

## Excepciones necesarias para conservar login y relaciones

El cliente valida exclusivamente el dominio corporativo actual. Se conservaron los identificadores corporativos usados por cuentas y referencias, el placeholder del login y los dos valores del test de login válido. Sustituirlos por `ejemplo.test` sin cambiar la política de autenticación rompería el flujo; esa política no se cambia en SP-08.

Se conservaron los alias técnicos no personales que vinculan cuentas, generadores y referencias entre filas. Los identificadores corporativos restantes aparecen en los siguientes archivos:

- `ArchivoSQL/BD_Soporte_Patitos.sql.txt`: 5 referencias conservadas.
- `ArchivoSQL/fix_login_seed_patitos.sql.txt`: 12 referencias conservadas.
- `ArchivoSQL/reset_seed_estructura_masiva.sql.txt`: 13 referencias conservadas.
- `ArchivoSQL/seed_historico_evaluaciones_masivo.sql.txt`: 1 referencias conservadas.
- `ArchivoSQL/seed_jerarquias_usuarios_demo.sql.txt`: 20 referencias conservadas.
- `Scripts/verificar-api.ps1`: 1 referencias conservadas.
- `SoportePatitosS.A/ClientApp/src/App.test.jsx`: 2 referencias conservadas.
- `SoportePatitosS.A/ClientApp/src/components/Login.jsx`: 1 referencias conservadas.

La estructura SQL, las variables, los IDs, las fechas y los importes se conservaron. No se afirma que los SQL heredados sean ejecutables ni que sustituyan la base demo; no forman parte del arranque. Los teléfonos ficticios no identifican contactos reales.

Tres pruebas unitarias de Login aprobaron después de conservar los identificadores válidos y cambiar el correo del caso rechazado. La estructura de dependencias, versiones e integridad del lockfile se mantiene; solo cambia texto informativo de contacto.

El historial Git publicado conserva datos anteriores. No se reescribió el historial ni se modificaron binarios.

> **19-11-2026:** `BD_Soporte_Patitos.sql.txt`, `fix_login_seed_patitos.sql.txt` y `reset_seed_estructura_masiva.sql.txt` se retiraron de HEAD porque contenían hashes heredados (ver `ArchivoSQL/README.md`). Los datos demo ahora se generan con `Verification/DemoSampleData.cs`.
