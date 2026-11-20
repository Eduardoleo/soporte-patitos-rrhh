using BL.Interface;
using Microsoft.AspNetCore.Mvc;
using Model.Entities;

namespace SoportePatitosS.A.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PerfilesController:ControllerBase
    {
        private readonly IPerfilesBL _perfilesBL;

        public PerfilesController(IPerfilesBL perfilesBL)
        {
            _perfilesBL = perfilesBL;
        }

        [HttpGet("ObtenerTodos")]
        public async Task<ActionResult<List<Puestos>>> ObtenerTodos()
        {
            var perfiles= await _perfilesBL.ObtenerTodos();
            return Ok(perfiles);
        }
    }
}
