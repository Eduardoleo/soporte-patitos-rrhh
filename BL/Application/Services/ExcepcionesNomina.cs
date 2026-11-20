namespace BL.Servicios;

// Only explicit, constant business messages may be exposed by the API.
public sealed class ValidacionNominaException(string message) : ArgumentException(message);
public sealed class RecursoNominaNoEncontradoException(string message) : Exception(message);
