using BL.Servicios;
using DA.Interfaces;
using Model.Entities;
using Model.Requests;

static class NegocioNomina
{
    public static async Task Run()
    {
        var data = new PlanillasData();
        var service = new PlanillasBL(data);
        CrearPlanillaRequest Valid() => new()
        {
            Periodo_Inicio = new DateTime(2026, 1, 1, 12, 0, 0),
            Periodo_Fin = new DateTime(2026, 1, 31, 18, 0, 0), Usuario_Generador_ID = 1
        };
        await service.CrearPlanilla(Valid());
        Check(data.Last!.Estado == "GENERADA" && data.Last.Periodo_Inicio.TimeOfDay == TimeSpan.Zero
            && data.Last.Periodo_Fin.TimeOfDay == TimeSpan.Zero, "valid planilla normalizes period and initial state");
        foreach (var request in new[] {
            new CrearPlanillaRequest { Periodo_Fin = new DateTime(2026, 1, 31), Usuario_Generador_ID = 1 },
            new CrearPlanillaRequest { Periodo_Inicio = new DateTime(2026, 1, 1), Usuario_Generador_ID = 1 },
            new CrearPlanillaRequest { Periodo_Inicio = new DateTime(2026, 2, 1), Periodo_Fin = new DateTime(2026, 1, 1), Usuario_Generador_ID = 1 },
            new CrearPlanillaRequest { Periodo_Inicio = new DateTime(2026, 1, 1), Periodo_Fin = new DateTime(2026, 1, 31), Usuario_Generador_ID = 0 }
        })
        {
            var before = data.Writes;
            await Reject(() => service.CrearPlanilla(request), "invalid planilla creation rejected");
            Check(data.Writes == before, "invalid creation never persists");
        }
        await Reject(() => service.CrearPlanilla(null!), "missing planilla request rejected");
        await Reject(() => service.ObtenerPorPeriodo(default, DateTime.Today), "missing query period rejected");
        await Reject(() => service.ObtenerPorPeriodo(DateTime.Today, DateTime.Today.AddDays(-1)), "inverted query period rejected");
        await Reject(() => service.ObtenerPorId(0), "invalid planilla ID rejected");
        foreach (var state in new[] { "", "estado-desconocido" })
            await Reject(() => service.ActualizarEstado(1, state), "invalid planilla state rejected");
        foreach (var state in new[] { "GENERADA", "ENVIADA", "ANULADA" })
        {
            await service.ActualizarEstado(1, state);
            Check(data.Last!.Estado == state, "allowed planilla state persisted");
        }
        data.Last = null;
        await Missing(() => service.ObtenerPorId(1), "Planilla no encontrada");
        await Missing(() => service.ActualizarEstado(1, "ENVIADA"), "Planilla no encontrada");

        var colillas = new ColillasData();
        var payment = new Colillas_PagoBL(colillas);
        await Reject(() => payment.ObtenerPorEmpleado(0), "invalid employee rejected");
        await Reject(() => payment.ObtenerPorPlanilla(0), "invalid payment planilla rejected");
        await Reject(() => payment.ObtenerPorId(0), "invalid payment ID rejected");
        await Reject(() => payment.ActualizarEstadoEnvio(0, "ENVIADO"), "invalid payment update ID rejected");
        foreach (var state in new[] { "", "estado-desconocido" })
        {
            var before = colillas.Writes;
            await Reject(() => payment.ActualizarEstadoEnvio(1, state), "invalid payment state rejected");
            Check(colillas.Writes == before, "invalid payment state never persists");
        }
        await payment.ActualizarEstadoEnvio(1, "ENVIADO");
        Check(colillas.Last!.Fecha_Envio != null && colillas.Last.Estado_Envio == "ENVIADO", "sent payment records timestamp");
        foreach (var state in new[] { "PENDIENTE", "ERROR" })
        {
            await payment.ActualizarEstadoEnvio(1, state);
            Check(colillas.Last!.Estado_Envio == state, "allowed payment state persisted");
        }
        colillas.Last = null;
        await Missing(() => payment.ObtenerPorId(1), "Colilla de pago no encontrada");
        await Missing(() => payment.ActualizarEstadoEnvio(1, "ENVIADO"), "Colilla de pago no encontrada");
    }

    private static async Task Reject(Func<Task> action, string name)
    {
        try { await action(); }
        catch (ArgumentException) { Check(true, name); return; }
        throw new Exception("FAIL SP-07: accepted invalid input: " + name);
    }

    private static async Task Missing(Func<Task> action, string expected)
    {
        try { await action(); }
        catch (Exception error) when (error.Message == expected) { Check(true, "missing resource rejected"); return; }
        throw new Exception("FAIL SP-07: missing resource accepted");
    }

    private static void Check(bool condition, string name)
    {
        if (!condition) throw new Exception("FAIL SP-07: " + name);
        Console.WriteLine("PASS SP-07: " + name);
    }

    private sealed class PlanillasData : IPlanillasDA
    {
        public Planillas? Last; public int Writes;
        public Task<List<Planillas>> ObtenerTodos() => Task.FromResult(new List<Planillas>());
        public Task<List<Planillas>> ObtenerPorPeriodo(DateTime start, DateTime end) => ObtenerTodos();
        public Task<Planillas> ObtenerPorId(long id) => Task.FromResult(Last!);
        public Task Insertar(Planillas value) { Last = value; Writes++; return Task.CompletedTask; }
        public Task Actualizar(Planillas value) { Last = value; Writes++; return Task.CompletedTask; }
    }

    private sealed class ColillasData : IColillas_PagoDA
    {
        public Colillas_Pago? Last = new() { Colilla_ID = 1, Empleado_ID = 17 }; public int Writes;
        public Task<List<Colillas_Pago>> ObtenerTodos() => Task.FromResult(new List<Colillas_Pago>());
        public Task<List<Colillas_Pago>> ObtenerPorEmpleado(int id) => ObtenerTodos();
        public Task<List<Colillas_Pago>> ObtenerPorPlanilla(long id) => ObtenerTodos();
        public Task<Colillas_Pago> ObtenerPorId(long id) => Task.FromResult(Last!);
        public Task<decimal?> ObtenerSalarioPuestoEmpleado(int id) => Task.FromResult<decimal?>(1000);
        public Task Insertar(Colillas_Pago value) { Last = value; Writes++; return Task.CompletedTask; }
        public Task Actualizar(Colillas_Pago value) { Last = value; Writes++; return Task.CompletedTask; }
    }
}
