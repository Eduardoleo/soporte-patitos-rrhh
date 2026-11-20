using BL.Interface;
using Model.Entities;
using Microsoft.AspNetCore.Mvc;
using Model.Requests;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class Evaluacion_DetalleController : ControllerBase
    {
        private readonly IEvaluacion_DetalleBL _detalleBL;

        public Evaluacion_DetalleController(IEvaluacion_DetalleBL detalleBL)
        {
            _detalleBL = detalleBL;
        }

        [HttpGet("ObtenerTodos")]
        public async Task<ActionResult<List<Evaluacion_Detalle>>> ObtenerTodos()
        {
            var detalles = await _detalleBL.ObtenerTodos();
            return Ok(detalles);
        }

        [HttpGet("ObtenerPorId/{id}")]
        public async Task<ActionResult<Evaluacion_Detalle>> ObtenerPorId(long id)
        {
            try
            {
                var detalle = await _detalleBL.ObtenerPorId(id);

                if (detalle == null)
                    return NotFound("Detalle de evaluación no encontrado");

                return Ok(detalle);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("ObtenerPorEvaluacion/{evaluacionId}")]
        public async Task<ActionResult<List<Evaluacion_Detalle>>> ObtenerPorEvaluacion(long evaluacionId)
        {
            try
            {
                var detalles = await _detalleBL.ObtenerPorEvaluacion(evaluacionId);
                return Ok(detalles);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("CrearDetalle")]
        public async Task<ActionResult> CrearDetalle([FromBody] CrearEvaluacionDetalleRequest request)
        {
            try
            {
                await _detalleBL.CrearDetalle(request);
                return Ok("Detalle de evaluación creado correctamente");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("ActualizarCalificacion/{id}")]
        public async Task<ActionResult> ActualizarCalificacion(long id, [FromBody] int calificacion)
        {
            try
            {
                await _detalleBL.ActualizarCalificacion(id, calificacion);
                return Ok("Calificación actualizada correctamente");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}