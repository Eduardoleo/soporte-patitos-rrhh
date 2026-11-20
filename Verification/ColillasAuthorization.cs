using System.Security.Claims;
using API.Controllers;
using BL.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Model.Entities;
using Model.Requests;

static class ColillasAuthorization
{
    public static async Task Run()
    {
        var fake = new Fake();
        var controller = new Colillas_PagoController(fake) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        controller.HttpContext.User = User(17);
        Require((await controller.ObtenerPorEmpleado(18)).Result is ForbidResult, "employee cannot request another employee");
        Require(fake.LastEmployee == null, "foreign ID never reaches business service");
        Require((await controller.ObtenerMisColillas()).Result is OkObjectResult && fake.LastEmployee == 17, "personal list derives ID from token");
        Require((await controller.ObtenerPorEmpleado(17)).Result is OkObjectResult, "own employee route accepted");
        Require((await controller.ObtenerPorId(1)).Result is OkObjectResult, "owned colilla accepted");
        controller.HttpContext.User = User(18);
        Require((await controller.ObtenerPorId(1)).Result is ForbidResult, "foreign colilla rejected");
        controller.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.Role, "Empleado") }, "test"));
        Require((await controller.ObtenerMisColillas()).Result is ForbidResult, "missing employee claim rejected");
        foreach (var method in new[] { "ObtenerTodos", "ObtenerPorPlanilla", "CrearColilla", "ActualizarEstadoEnvio" })
            Require(typeof(Colillas_PagoController).GetMethod(method)!.GetCustomAttributes(typeof(AuthorizeAttribute), false).Cast<AuthorizeAttribute>().Any(a => a.Policy == "Nomina"), method + " requires payroll policy");
    }
    static ClaimsPrincipal User(int id) => new(new ClaimsIdentity(new[] { new Claim(ClaimTypes.Role, "Empleado"), new Claim("EmpleadoId", id.ToString()) }, "test"));
    static void Require(bool ok, string name) { if (!ok) throw new Exception("FAIL SP-01: " + name); Console.WriteLine("PASS SP-01: " + name); }
    sealed class Fake : IColillas_PagoBL
    {
        public int? LastEmployee;
        public Task<List<Colillas_Pago>> ObtenerTodos() => Task.FromResult(new List<Colillas_Pago>());
        public Task<List<Colillas_Pago>> ObtenerPorEmpleado(int id) { LastEmployee=id; return ObtenerTodos(); }
        public Task<List<Colillas_Pago>> ObtenerPorPlanilla(long id) => ObtenerTodos();
        public Task<Colillas_Pago> ObtenerPorId(long id) => Task.FromResult(new Colillas_Pago { Colilla_ID=1, Empleado_ID=17 });
        public Task CrearColilla(CrearColillaPagoRequest request) => Task.CompletedTask;
        public Task ActualizarEstadoEnvio(long id, string state) => Task.CompletedTask;
    }
}
