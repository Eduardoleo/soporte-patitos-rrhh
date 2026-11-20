using Microsoft.AspNetCore.Identity;
using Model.Entities;
using System.Security.Cryptography;
using System.Text;

namespace BL.Application.Services;

public static class PasswordSecurity
{
    private static readonly PasswordHasher<Usuarios> Hasher = new();

    public static string Hash(string password) => Hasher.HashPassword(new Usuarios(), password);

    public static PasswordVerificationResult Verify(string storedHash, string password)
    {
        if (string.IsNullOrEmpty(storedHash) || storedHash.Length > 512 || password == null)
            return PasswordVerificationResult.Failed;
        try
        {
            var bytes = Convert.FromBase64String(storedHash);
            // Compatibilidad con SHA-256/Base64 anterior: migrar solo tras un login válido.
            if (bytes.Length == 32)
            {
                var candidate = SHA256.HashData(Encoding.UTF8.GetBytes(password));
                return CryptographicOperations.FixedTimeEquals(bytes, candidate)
                    ? PasswordVerificationResult.SuccessRehashNeeded
                    : PasswordVerificationResult.Failed;
            }
            return Hasher.VerifyHashedPassword(new Usuarios(), storedHash, password);
        }
        catch (FormatException)
        {
            return PasswordVerificationResult.Failed;
        }
    }
}
