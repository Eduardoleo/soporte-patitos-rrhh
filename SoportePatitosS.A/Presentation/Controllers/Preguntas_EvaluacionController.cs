using BL.Interface;
using Model.Entities;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class Preguntas_EvaluacionController : ControllerBase
    {
        private readonly IPreguntas_EvaluacionBL _preguntasBL;

        public Preguntas_EvaluacionController(IPreguntas_EvaluacionBL preguntasBL)
        {
            _preguntasBL = preguntasBL;
        }

        [HttpGet("ObtenerTodos")]
        public async Task<ActionResult<List<Preguntas_Evaluacion>>> ObtenerTodos()
        {
            var preguntas = await _preguntasBL.ObtenerTodos();
            return Ok(preguntas);
        }

        [HttpGet("ObtenerPorId/{id}")]
        public async Task<ActionResult<Preguntas_Evaluacion>> ObtenerPorId(int id)
        {
            try
            {
                var pregunta = await _preguntasBL.ObtenerPorId(id);

                if (pregunta == null)
                    return NotFound("Pregunta no encontrada");

                return Ok(pregunta);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}