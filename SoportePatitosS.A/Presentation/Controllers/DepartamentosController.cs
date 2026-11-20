using BL.Interface;
using BL.Servicios;
using Microsoft.AspNetCore.Mvc;
using Model.Entities;

namespace SoportePatitosS.A.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DepartamentosController : ControllerBase
    {
        private readonly IDepartamentosBL _departamentosBL;

        public DepartamentosController(IDepartamentosBL departamentosBL)
        {
            _departamentosBL = departamentosBL;
        }

        [HttpGet("ObtenerTodos")]
        public async Task<ActionResult<List<Departamentos>>> ObtenerTodos()
        {
            var departamentos = await _departamentosBL.ObtenerTodos();
            return Ok(departamentos);
        }
    }
}
