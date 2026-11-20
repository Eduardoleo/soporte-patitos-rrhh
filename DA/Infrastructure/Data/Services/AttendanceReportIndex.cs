using Model.Entities;

namespace DA.Servicios;

// Construir una vez por reporte; conserva la primera asistencia y la ausencia más reciente.
public sealed class AttendanceReportIndex
{
    private readonly Dictionary<int, Asistencia> attendance;
    private readonly Dictionary<int, SolicitudAusencia> absences;

    public AttendanceReportIndex(IEnumerable<Asistencia> attendance, IEnumerable<SolicitudAusencia> absences)
    {
        this.attendance = new();
        foreach (var item in attendance) this.attendance.TryAdd(item.Empleado_ID, item);
        this.absences = new();
        foreach (var item in absences)
            if (!this.absences.TryGetValue(item.Empleado_ID, out var current) || item.Fecha_Solicitud > current.Fecha_Solicitud)
                this.absences[item.Empleado_ID] = item;
    }

    public Asistencia? AttendanceFor(int employeeId) => attendance.GetValueOrDefault(employeeId);
    public SolicitudAusencia? AbsenceFor(int employeeId) => absences.GetValueOrDefault(employeeId);
}
