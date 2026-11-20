using API.Security;
using Microsoft.AspNetCore.Authorization;
using BL.Interface;
using Model.Entities;
using Microsoft.AspNetCore.Mvc;
using Model.Requests;

namespace API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class Colillas_PagoController : ControllerBase
    {
        private readonly IColillas_PagoBL _colillasBL;

        public Colillas_PagoController(IColillas_PagoBL colillasBL)
        {
            _colillasBL = colillasBL;
        }

        private bool TryGetEmployeeId(out int employeeId) =>
            int.TryParse(User.FindFirst("EmpleadoId")?.Value, out employeeId) && employeeId > 0;

        [HttpGet("ObtenerMisColillas")]
        public async Task<ActionResult<List<Colillas_Pago>>> ObtenerMisColillas()
        {
            if (!TryGetEmployeeId(out var employeeId)) return Forbid();
            try { return Ok(await _colillasBL.ObtenerPorEmpleado(employeeId)); }
            catch (Exception ex) { return ErroresNomina.Map(ex); }
        }

        [Authorize(Policy = "Nomina")]
        [HttpGet("ObtenerTodos")]
        public async Task<ActionResult<List<Colillas_Pago>>> ObtenerTodos()
        {
            try { return Ok(await _colillasBL.ObtenerTodos()); }
            catch (Exception ex) { return ErroresNomina.Map(ex); }
        }

        [HttpGet("ObtenerPorId/{id}")]
        public async Task<ActionResult<Colillas_Pago>> ObtenerPorId(long id)
        {
            try
            {
                var colilla = await _colillasBL.ObtenerPorId(id);

                if (colilla == null)
                    return NotFound("Colilla de pago no encontrada");

                if (!AccessRules.CanReadPayroll(User) && (!TryGetEmployeeId(out var employeeId) || colilla.Empleado_ID != employeeId))
                    return Forbid();
                return Ok(colilla);
            }
            catch (Exception ex)
            {
                return ErroresNomina.Map(ex);
            }
        }

        [HttpGet("ObtenerPorEmpleado/{empleadoId}")]
        public async Task<ActionResult<List<Colillas_Pago>>> ObtenerPorEmpleado(int empleadoId)
        {
            try
            {
                if (!AccessRules.CanReadPayroll(User))
                {
                    if (!TryGetEmployeeId(out var tokenEmployeeId) || empleadoId != tokenEmployeeId)
                        return Forbid();
                    empleadoId = tokenEmployeeId;
                }
                var colillas = await _colillasBL.ObtenerPorEmpleado(empleadoId);
                return Ok(colillas);
            }
            catch (Exception ex)
            {
                return ErroresNomina.Map(ex);
            }
        }

        [Authorize(Policy = "Nomina")]
        [HttpGet("ObtenerPorPlanilla/{planillaId}")]
        public async Task<ActionResult<List<Colillas_Pago>>> ObtenerPorPlanilla(long planillaId)
        {
            try
            {
                var colillas = await _colillasBL.ObtenerPorPlanilla(planillaId);
                return Ok(colillas);
            }
            catch (Exception ex)
            {
                return ErroresNomina.Map(ex);
            }
        }

        [Authorize(Policy = "Nomina")]
        [HttpPost("CrearColilla")]
        public async Task<ActionResult> CrearColilla([FromBody] CrearColillaPagoRequest request)
        {
            try
            {
                await _colillasBL.CrearColilla(request);
                return Ok("Colilla de pago creada correctamente");
            }
            catch (BL.Servicios.ValidacionNominaException ex)
            {
                return ErroresNomina.Map(ex);
            }
            catch (Exception)
            {
                return StatusCode(500, "No se pudo crear la colilla. Intente nuevamente más tarde.");
            }
        }

        [Authorize(Policy = "Nomina")]
        [HttpPut("ActualizarEstadoEnvio/{id}")]
        public async Task<ActionResult> ActualizarEstadoEnvio(long id, [FromBody] string estadoEnvio)
        {
            try
            {
                await _colillasBL.ActualizarEstadoEnvio(id, estadoEnvio);
                return Ok("Estado de envío actualizado correctamente");
            }
            catch (Exception ex)
            {
                return ErroresNomina.Map(ex);
            }
        }
    }
}