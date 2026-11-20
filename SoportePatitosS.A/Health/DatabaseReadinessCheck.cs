using DA.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace API.Health;

public sealed class DatabaseReadinessCheck(AppDbContext db) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            // Verifica columnas del modelo sin leer registros personales.
            foreach (var entity in db.Model.GetEntityTypes())
            {
                var table = entity.GetTableName();
                if (table == null) continue;
                var schema = entity.GetSchema() ?? "dbo";
                var store = Microsoft.EntityFrameworkCore.Metadata.StoreObjectIdentifier.Table(table, entity.GetSchema());
                var columns = entity.GetProperties().Select(p => p.GetColumnName(store) ?? p.Name).Distinct();
                static string Quote(string name) => "[" + name.Replace("]", "]]") + "]";
                var sql = $"SELECT TOP (0) {string.Join(",", columns.Select(Quote))} FROM {Quote(schema)}.{Quote(table)}";
                await db.Database.ExecuteSqlRawAsync(sql, cancellationToken);
            }
            return HealthCheckResult.Healthy();
        }
        catch (Exception) when (!cancellationToken.IsCancellationRequested)
        {
            return HealthCheckResult.Unhealthy("Base de datos no disponible o esquema incompatible.");
        }
    }
}
