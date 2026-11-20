using API.Controllers;
using BL.Interface;
using BL.Servicios;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Model.Entities;
using Model.Requests;
using System.Security.Claims;

static class ErroresNominaPublicos
{
    public static async Task Run()
    {
        var fake = new FailingServices();
        var planillas = new PlanillasController(fake);
        var colillas = new Colillas_PagoController(fake)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[] {
                        new Claim(ClaimTypes.Role, "Administrador"), new Claim("EmpleadoId", "17")
                    }, "test"))
                }
            }
        };
        var calls = new Func<Task<IActionResult?>>[]
        {
            async () => (await planillas.ObtenerTodos()).Result,
            async () => (await planillas.ObtenerPorId(1)).Result,
            async () => (await planillas.ObtenerPorPeriodo(DateTime.Today, DateTime.Today)).Result,
            async () => await planillas.CrearPlanilla(new()),
            async () => await planillas.ActualizarEstado(1, "GENERADA"),
            async () => (await colillas.ObtenerTodos()).Result,
            async () => (await colillas.ObtenerMisColillas()).Result,
            async () => (await colillas.ObtenerPorId(1)).Result,
            async () => (await colillas.ObtenerPorEmpleado(17)).Result,
            async () => (await colillas.ObtenerPorPlanilla(1)).Result,
            async () => await colillas.CrearColilla(new()),
            async () => await colillas.ActualizarEstadoEnvio(1, "ENVIADO")
        };
        foreach (var call in calls)
        {
            fake.Error = new InvalidOperationException("diagnostico-interno-no-publicar");
            Check(await call() is ObjectResult { StatusCode: 500, Value: string message }
                && !message.Contains("diagnostico"), "unexpected failure hidden with HTTP 500");
        }
        fake.Error = new ArgumentException("detalle-tecnico-interno");
        Check(await planillas.CrearPlanilla(new()) is ObjectResult { StatusCode: 500 }, "unexpected argument error hidden");
        fake.Error = new ValidacionNominaException("Las fechas del período son obligatorias");
        Check(await planillas.CrearPlanilla(new()) is BadRequestObjectResult { Value: "Las fechas del período son obligatorias" }, "explicit business validation returns stable 400");
        fake.Error = new RecursoNominaNoEncontradoException("Planilla no encontrada");
        Check((await planillas.ObtenerPorId(1)).Result is NotFoundObjectResult { Value: "Planilla no encontrada" }, "missing planilla returns stable 404");
        fake.Error = new RecursoNominaNoEncontradoException("Colilla de pago no encontrada");
        Check((await colillas.ObtenerPorId(1)).Result is NotFoundObjectResult { Value: "Colilla de pago no encontrada" }, "missing colilla returns stable 404");
    }

    private static void Check(bool ok, string name)
    {
        if (!ok) throw new Exception("FAIL SP-05: " + name);
        Console.WriteLine("PASS SP-05: " + name);
    }

    private sealed class FailingServices : IPlanillasBL, IColillas_PagoBL
    {
        public Exception Error = new InvalidOperationException();
        Task<List<Planillas>> IPlanillasBL.ObtenerTodos() => throw Error;
        Task<List<Colillas_Pago>> IColillas_PagoBL.ObtenerTodos() => throw Error;
        Task<Planillas> IPlanillasBL.ObtenerPorId(long id) => throw Error;
        Task<Colillas_Pago> IColillas_PagoBL.ObtenerPorId(long id) => throw Error;
        public Task<List<Planillas>> ObtenerPorPeriodo(DateTime start, DateTime end) => throw Error;
        public Task CrearPlanilla(CrearPlanillaRequest request) => throw Error;
        public Task ActualizarEstado(long id, string state) => throw Error;
        public Task<List<Colillas_Pago>> ObtenerPorEmpleado(int id) => throw Error;
        public Task<List<Colillas_Pago>> ObtenerPorPlanilla(long id) => throw Error;
        public Task CrearColilla(CrearColillaPagoRequest request) => throw Error;
        public Task ActualizarEstadoEnvio(long id, string state) => throw Error;
    }
}
