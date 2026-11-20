# SQL histórico, fuera del entorno activo

Estos archivos se conservan como referencia del proyecto original, con extensión `.sql.txt`.
No forman parte del arranque local, no son migraciones vigentes y no deben ejecutarse sobre la demo ni sobre la base original.
Incluyen datos de ejemplo y operaciones de borrado o restablecimiento.

La creación local actual se hace con `Verification --create-demo`: una base separada, tres cuentas
demo con contraseñas que se piden al momento y 24 empleados de ejemplo generados (`Verification/DemoSampleData.cs`).
Esos empleados tienen nombres inventados, cédulas `DEMO-`, correos `@ejemplo.test` y cuentas bloqueadas.

El 19-11-2026 se retiraron de esta carpeta `BD_Soporte_Patitos.sql.txt`,
`fix_login_seed_patitos.sql.txt` y `reset_seed_estructura_masiva.sql.txt`, porque contenían hashes
de contraseña heredados. El esquema lo crea `EnsureCreated` desde el modelo de EF Core.
No se reescribe la autoría ni el historial Git.
