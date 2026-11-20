using BL.Interface;
using Model.Entities;
using Microsoft.AspNetCore.Mvc;
using Model.Requests;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EvaluacionesController : ControllerBase
    {
        private readonly IEvaluacionesBL _evaluacionesBL;

        public EvaluacionesController(IEvaluacionesBL evaluacionesBL)
        {
            _evaluacionesBL = evaluacionesBL;
        }

        [HttpGet("ObtenerTodos")]
        public async Task<ActionResult<List<Evaluaciones>>> ObtenerTodos([FromQuery] int? empleadoSolicitanteId, [FromQuery] bool soloPropias = false)
        {
            var evaluaciones = await _evaluacionesBL.ObtenerTodos(empleadoSolicitanteId, soloPropias);
            return Ok(evaluaciones);
        }

        [HttpGet("ObtenerPorId/{id}")]
        public async Task<ActionResult<Evaluaciones>> ObtenerPorId(long id)
        {
            try
            {
                var evaluacion = await _evaluacionesBL.ObtenerPorId(id);

                if (evaluacion == null)
                    return NotFound("Evaluación no encontrada");

                return Ok(evaluacion);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("ObtenerPorEmpleado/{empleadoId}")]
        public async Task<ActionResult<List<Evaluaciones>>> ObtenerPorEmpleado(int empleadoId)
        {
            try
            {
                var evaluaciones = await _evaluacionesBL.ObtenerPorEmpleado(empleadoId);
                return Ok(evaluaciones);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("CrearEvaluacion")]
        public async Task<ActionResult> CrearEvaluacion([FromBody] CrearEvaluacionRequest request)
        {
            try
            {
                var evaluacionId = await _evaluacionesBL.CrearEvaluacion(request);
                return Ok(new { evaluacionId, mensaje = "Evaluación creada correctamente" });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("ActualizarPromedio/{id}")]
        public async Task<ActionResult> ActualizarPromedio(long id, [FromBody] decimal promedio)
        {
            try
            {
                await _evaluacionesBL.ActualizarPromedio(id, promedio);
                return Ok("Promedio actualizado correctamente");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}