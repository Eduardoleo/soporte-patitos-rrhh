using BL.Servicios;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

internal static class ErroresNomina
{
    public const string Unavailable = "No se pudo procesar la solicitud. Intente nuevamente más tarde.";

    public static ObjectResult Map(Exception error, string unavailable = Unavailable) => error switch
    {
        ValidacionNominaException validation => new BadRequestObjectResult(validation.Message),
        RecursoNominaNoEncontradoException missing => new NotFoundObjectResult(missing.Message),
        _ => new ObjectResult(unavailable) { StatusCode = 500 }
    };
}
