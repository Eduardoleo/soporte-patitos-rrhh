using System.Security.Claims;

namespace API.Security;

public static class AccessRules
{
    public static bool IsAdmin(ClaimsPrincipal user) => HasRole(user, "ADMINISTRADOR", "ADMIN");
    public static bool CanReadPayroll(ClaimsPrincipal user) => IsAdmin(user)
        || HasRole(user, "ANALISTA DE NOMINA", "ANALISTA DE NÓMINA", "ANALISTA NOMINA", "ANALISTA NÓMINA", "RECURSOS HUMANOS", "RRHH");
    public static bool CanChangePassword(ClaimsPrincipal user, int usuarioId) => IsAdmin(user)
        || (user.Identity?.IsAuthenticated == true && user.FindFirstValue(ClaimTypes.NameIdentifier) == usuarioId.ToString());
    private static bool HasRole(ClaimsPrincipal user, params string[] roles) => user.Identity?.IsAuthenticated == true
        && user.FindAll(ClaimTypes.Role).Any(claim => roles.Contains(claim.Value.Trim(), StringComparer.OrdinalIgnoreCase));
}
