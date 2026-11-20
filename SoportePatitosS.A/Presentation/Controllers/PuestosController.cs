using BL.Interface;
using Microsoft.AspNetCore.Mvc;
using Model.Entities;

namespace SoportePatitosS.A.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PuestosController : ControllerBase
    {
        private readonly IPuestosBL _puestosBL;

        public PuestosController(IPuestosBL puestosBL)
        {
            _puestosBL = puestosBL;
        }

        [HttpGet("ObtenerTodos")]
        public async Task<ActionResult<List<Puestos>>> ObtenerTodos()
        {
            var puestos = await _puestosBL.ObtenerTodos();
            return Ok(puestos);
        }
    }
}
