using BL.Interface;
using Model.Entities;
using Microsoft.AspNetCore.Mvc;
using Model.Requests;
using Model.Responses;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AsistenciaController : ControllerBase
    {
        private readonly IAsistenciaBL _asistenciaBL;

        public AsistenciaController(IAsistenciaBL asistenciaBL)
        {
            _asistenciaBL = asistenciaBL;
        }

        [HttpGet("ObtenerTodos")]
        public async Task<ActionResult<List<Asistencia>>> ObtenerTodos()
        {
            var asistencias = await _asistenciaBL.ObtenerTodos();
            return Ok(asistencias);
        }

        [HttpGet("ObtenerPorEmpleado/{empleadoId}")]
        public async Task<ActionResult<List<Asistencia>>> ObtenerPorEmpleado(int empleadoId)
        {
            try
            {
                var asistencias = await _asistenciaBL.ObtenerPorEmpleado(empleadoId);
                return Ok(asistencias);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("RegistrarEntrada")]
        public async Task<ActionResult> RegistrarEntrada([FromBody] RegistrarEntradaRequest request)
        {
            try
            {
                await _asistenciaBL.RegistrarEntrada(request);
                return Ok("Entrada registrada correctamente");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("RegistrarSalida")]
        public async Task<ActionResult> RegistrarSalida([FromBody] RegistrarSalidaRequest request)
        {
            try
            {
                await _asistenciaBL.RegistrarSalida(request);
                return Ok("Salida registrada correctamente");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("RegistrarSalidaAlmuerzo")]
        public async Task<ActionResult> RegistrarSalidaAlmuerzo([FromBody] RegistrarSalidaAlmuerzoRequest request)
        {
            try
            {
                await _asistenciaBL.RegistrarSalidaAlmuerzo(request);
                return Ok("Salida de almuerzo registrada correctamente");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("RegistrarRegresoAlmuerzo")]
        public async Task<ActionResult> RegistrarRegresoAlmuerzo([FromBody] RegistrarRegresoAlmuerzoRequest request)
        {
            try
            {
                await _asistenciaBL.RegistrarRegresoAlmuerzo(request);
                return Ok("Regreso de almuerzo registrado correctamente");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("JustificarIncidencia")]
        public async Task<ActionResult> JustificarIncidencia([FromBody] JustificarIncidenciaAsistenciaRequest request)
        {
            try
            {
                await _asistenciaBL.JustificarIncidencia(request);
                return Ok("Justificación enviada para aprobación");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("EstadoRelojWeb/{empleadoId}")]
        public async Task<ActionResult<EstadoRelojWebResponse>> ObtenerEstadoRelojWeb(int empleadoId, [FromQuery] DateTime? fecha)
        {
            try
            {
                var estado = await _asistenciaBL.ObtenerEstadoRelojWeb(empleadoId, fecha?.Date ?? DateTime.Today);
                if (estado == null)
                    return NotFound("No se encontró estado para el empleado");

                return Ok(estado);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("ResumenPeriodo/{empleadoId}")]
        public async Task<ActionResult<List<ResumenAsistenciaDiaResponse>>> ObtenerResumenPeriodo(int empleadoId, [FromQuery] DateTime desde, [FromQuery] DateTime hasta)
        {
            try
            {
                var resumen = await _asistenciaBL.ObtenerResumenPeriodo(empleadoId, desde, hasta);
                return Ok(resumen);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("ReporteGestion")]
        public async Task<ActionResult<List<AsistenciaGestionItemResponse>>> ObtenerReporteGestion([FromQuery] DateTime? fecha, [FromQuery] int empleadoSolicitanteId, [FromQuery] int? empleadoId, [FromQuery] string? nombreEmpleado, [FromQuery] string? gerencia)
        {
            if (!int.TryParse(User.FindFirst("EmpleadoId")?.Value, out var actorId) || actorId <= 0)
                return Forbid();
            if (empleadoSolicitanteId != 0 && empleadoSolicitanteId != actorId)
                return Forbid();
            try
            {
                var reporte = await _asistenciaBL.ObtenerReporteGestion(fecha?.Date ?? DateTime.Today, actorId, empleadoId, nombreEmpleado, gerencia);
                return Ok(reporte);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
