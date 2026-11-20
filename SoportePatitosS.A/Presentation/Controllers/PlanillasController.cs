using BL.Interface;
using Model.Entities;
using Microsoft.AspNetCore.Mvc;
using Model.Requests;

namespace API.Controllers
{
    [ApiController]
    [Microsoft.AspNetCore.Authorization.Authorize(Policy = "Nomina")]
    [Route("api/[controller]")]
    public class PlanillasController : ControllerBase
    {
        private readonly IPlanillasBL _planillasBL;

        public PlanillasController(IPlanillasBL planillasBL)
        {
            _planillasBL = planillasBL;
        }

        [HttpGet("ObtenerTodos")]
        public async Task<ActionResult<List<Planillas>>> ObtenerTodos()
        {
            try { return Ok(await _planillasBL.ObtenerTodos()); }
            catch (Exception ex) { return ErroresNomina.Map(ex); }
        }

        [HttpGet("ObtenerPorId/{id}")]
        public async Task<ActionResult<Planillas>> ObtenerPorId(long id)
        {
            try
            {
                var planilla = await _planillasBL.ObtenerPorId(id);

                if (planilla == null)
                    return NotFound("Planilla no encontrada");

                return Ok(planilla);
            }
            catch (Exception ex)
            {
                return ErroresNomina.Map(ex);
            }
        }

        [HttpGet("ObtenerPorPeriodo")]
        public async Task<ActionResult<List<Planillas>>> ObtenerPorPeriodo([FromQuery] DateTime periodoInicio, [FromQuery] DateTime periodoFin)
        {
            try
            {
                var planillas = await _planillasBL.ObtenerPorPeriodo(periodoInicio, periodoFin);
                return Ok(planillas);
            }
            catch (Exception ex)
            {
                return ErroresNomina.Map(ex);
            }
        }

        [HttpPost("CrearPlanilla")]
        public async Task<ActionResult> CrearPlanilla([FromBody] CrearPlanillaRequest request)
        {
            try
            {
                await _planillasBL.CrearPlanilla(request);
                return Ok("Planilla creada correctamente");
            }
            catch (Exception ex)
            {
                return ErroresNomina.Map(ex);
            }
        }

        [HttpPut("ActualizarEstado/{id}")]
        public async Task<ActionResult> ActualizarEstado(long id, [FromBody] string estado)
        {
            try
            {
                await _planillasBL.ActualizarEstado(id, estado);
                return Ok("Estado de la planilla actualizado correctamente");
            }
            catch (Exception ex)
            {
                return ErroresNomina.Map(ex);
            }
        }
    }
}
