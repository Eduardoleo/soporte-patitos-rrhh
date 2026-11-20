using Microsoft.Data.SqlClient;

namespace API.Security;

public static class LocalDevelopmentSettings
{
    public const string DatabaseName = "SoportePatitos_Portafolio_Demo";

    public static void Validate(string connectionString)
    {
        var connection = new SqlConnectionStringBuilder(connectionString);
        var hosts = new[] { "localhost", ".", "127.0.0.1" };
        if (!hosts.Contains(connection.DataSource, StringComparer.OrdinalIgnoreCase)
            || !string.Equals(connection.InitialCatalog, DatabaseName, StringComparison.OrdinalIgnoreCase)
            || !connection.IntegratedSecurity
            || !string.IsNullOrEmpty(connection.UserID)
            || !string.IsNullOrEmpty(connection.Password)
            || !string.IsNullOrEmpty(connection.AttachDBFilename)
            || !string.IsNullOrEmpty(connection.FailoverPartner))
        {
            throw new InvalidOperationException("Development requiere SQL Server local, autenticación de Windows y la base SoportePatitos_Portafolio_Demo. No se admiten cuentas SQL ni servidores heredados.");
        }
    }
}
