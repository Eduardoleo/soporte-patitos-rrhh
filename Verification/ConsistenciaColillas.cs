using BL.Servicios;
using DA.Interfaces;
using Model.Entities;
using Model.Requests;
using System.Text.Json;
using API.Controllers;
using Microsoft.AspNetCore.Mvc;

static class ConsistenciaColillas
{
    public static async Task Run()
    {
        var fake = new Fake(); var bl = new Colillas_PagoBL(fake);
        await bl.CrearColilla(Request());
        Check(fake.Last!.Salario_Puesto == 1000 && fake.Last.Salario_Neto == 825, "correct net and salary sourced from employee position; client salary ignored");
        foreach (var (field, message) in new[] { ("ccss", "Pago_CCSS no puede ser negativo."), ("exon", "Exoneraciones no puede ser negativo."), ("aus", "Deducciones_Ausencias no puede ser negativo.") })
        {
            var request = Request();
            if (field == "ccss") request.Pago_CCSS = -1;
            if (field == "exon") request.Exoneraciones = -1;
            if (field == "aus") request.Deducciones_Ausencias = -1;
            await Reject(bl, fake, request, message);
        }
        var excess = Request(); excess.Pago_CCSS = 1001;
        await Reject(bl, fake, excess, "El total de deducciones no puede superar el salario del puesto.");
        var combined = Request(); combined.Exoneraciones = 950;
        await Reject(bl, fake, combined, "El total de deducciones no puede superar el salario del puesto.");
        foreach (var json in new[] { "{\"Salario_Neto\":123}", "{\"Salario_Neto\":0}", "{\"salario_neto\":null}" })
        {
            var request = JsonSerializer.Deserialize<CrearColillaPagoRequest>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true })!;
            request.Planilla_ID=1; request.Empleado_ID=17;
            await Reject(bl, fake, request, "No envíe Salario_Neto: el servidor calcula el neto de la colilla.");
        }
        foreach (decimal? salary in new decimal?[] { null, 0, -1 })
        {
            fake.Salary=salary;
            await Reject(bl, fake, Request(), "El puesto del empleado debe tener un salario mayor que cero.");
        }
        fake.Salary=1000; var zero=Request(); zero.Pago_CCSS=1000; zero.Exoneraciones=0; zero.Deducciones_Ausencias=0;
        await bl.CrearColilla(zero); Check(fake.Last!.Salario_Neto==0, "deductions equal salary accepted");
        fake.Salary=decimal.MaxValue; var large=Request(); large.Pago_CCSS=decimal.MaxValue; large.Exoneraciones=1;
        await Reject(bl, fake, large, "El total de deducciones no puede superar el salario del puesto.");
        fake.Fail=true; var controller=new Colillas_PagoController(bl);
        var result=await controller.CrearColilla(Request());
        Check(result is ObjectResult { StatusCode:500, Value:"No se pudo crear la colilla. Intente nuevamente más tarde." }, "internal error details suppressed");
    }
    static CrearColillaPagoRequest Request()=>new() { Planilla_ID=1, Empleado_ID=17, Pago_CCSS=100, Exoneraciones=50, Deducciones_Ausencias=25, Salario_Puesto=999999 };
    static async Task Reject(Colillas_PagoBL bl, Fake fake, CrearColillaPagoRequest request, string expected)
    {
        var before=fake.Inserts;
        try { await bl.CrearColilla(request); throw new Exception("Unexpected acceptance"); }
        catch (ArgumentException ex) { Check(ex.Message==expected && fake.Inserts==before, expected); }
    }
    static void Check(bool ok,string name) { if(!ok) throw new Exception("FAIL SP-02: "+name); Console.WriteLine("PASS SP-02: "+name); }
    sealed class Fake : IColillas_PagoDA
    {
        public decimal? Salary=1000; public Colillas_Pago? Last; public int Inserts; public bool Fail;
        public Task<decimal?> ObtenerSalarioPuestoEmpleado(int id) { if(Fail) throw new Exception("private database diagnostic"); return Task.FromResult(Salary); }
        public Task Insertar(Colillas_Pago c) { Last=c; Inserts++; return Task.CompletedTask; }
        public Task Actualizar(Colillas_Pago c)=>Task.CompletedTask;
        public Task<List<Colillas_Pago>> ObtenerTodos()=>Task.FromResult(new List<Colillas_Pago>());
        public Task<List<Colillas_Pago>> ObtenerPorEmpleado(int id)=>ObtenerTodos();
        public Task<List<Colillas_Pago>> ObtenerPorPlanilla(long id)=>ObtenerTodos();
        public Task<Colillas_Pago> ObtenerPorId(long id)=>Task.FromResult(Last!);
    }
}
