using BL.Interface;
using Microsoft.AspNetCore.Mvc;
using Model.Entities;

namespace SoportePatitosS.A.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HorariosController : ControllerBase
    {
        private readonly IHorariosBL _horariosBL;

        public HorariosController(IHorariosBL horariosBL)
        {
            _horariosBL = horariosBL;
        }

        [HttpGet("ObtenerTodos")]
        public async Task<ActionResult<List<Horarios>>> ObtenerTodos()
        {
            var horarios = await _horariosBL.ObtenerTodos();
            return Ok(horarios);
        }
    }
}
