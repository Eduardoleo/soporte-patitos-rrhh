namespace BL.Servicios;

public static class CalculoColilla
{
    public static decimal CalcularNeto(decimal? salario, decimal pagoCcss, decimal exoneraciones, decimal deduccionesAusencias)
    {
        if (!salario.HasValue || salario.Value <= 0)
            throw new ValidacionNominaException("El puesto del empleado debe tener un salario mayor que cero.");
        if (pagoCcss < 0) throw new ValidacionNominaException("Pago_CCSS no puede ser negativo.");
        if (exoneraciones < 0) throw new ValidacionNominaException("Exoneraciones no puede ser negativo.");
        if (deduccionesAusencias < 0) throw new ValidacionNominaException("Deducciones_Ausencias no puede ser negativo.");
        // Validate by remaining balance to avoid overflow when adding large deductions.
        if (pagoCcss > salario.Value || exoneraciones > salario.Value - pagoCcss ||
            deduccionesAusencias > salario.Value - pagoCcss - exoneraciones)
            throw new ValidacionNominaException("El total de deducciones no puede superar el salario del puesto.");
        return salario.Value - pagoCcss - exoneraciones - deduccionesAusencias;
    }
}
