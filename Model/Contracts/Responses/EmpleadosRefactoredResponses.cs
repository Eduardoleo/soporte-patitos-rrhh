namespace SoportePatitosS.A.Model.Contracts.Responses
{
    using System;

    /// <summary>
    /// Response completo de un empleado con toda su información desglosada
    /// </summary>
    public class EmpleadoCompletoResponse
    {
        public int EmpleadoId { get; set; }
        public int UsuarioId { get; set; }
        public string Estado { get; set; }
        public DateTime FechaIngreso { get; set; }
        public string FotografiaUrl { get; set; }
        public string Cedula { get; set; }

        public InformacionPersonalResponse InformacionPersonal { get; set; }
        public InformacionContactoResponse InformacionContacto { get; set; }
        public InformacionDireccionResponse InformacionDireccion { get; set; }
        public InformacionIdentificacionResponse InformacionIdentificacion { get; set; }

        public int PuestoId { get; set; }
        public string NombrePuesto { get; set; }
        public int HorarioId { get; set; }
        public string NombreHorario { get; set; }
    }

    /// <summary>
    /// Response de Información Personal
    /// </summary>
    public class InformacionPersonalResponse
    {
        public int InformacionPersonalId { get; set; }
        public string NombreEmpleado { get; set; }
        public string PrimerNombre { get; set; }
        public string SegundoNombre { get; set; }
        public string ApellidoPaterno { get; set; }
        public string ApellidoMaterno { get; set; }
        public DateTime? FechaNacimiento { get; set; }
        public string Genero { get; set; }
        public string EstadoCivil { get; set; }
        public string PaisDemografico { get; set; }
        public DateTime FechaActualizacion { get; set; }
    }

    /// <summary>
    /// Response de Información de Contacto
    /// </summary>
    public class InformacionContactoResponse
    {
        public int InformacionContactoId { get; set; }
        public string CorreoElectronico { get; set; }
        public string CorreoElectronicoPersonal { get; set; }
        public string TelefonoMovil { get; set; }
        public string TelefonoFijo { get; set; }
        public DateTime FechaActualizacion { get; set; }
    }

    /// <summary>
    /// Response de Información de Dirección
    /// </summary>
    public class InformacionDireccionResponse
    {
        public int InformacionDireccionId { get; set; }
        public string Pais { get; set; }
        public string Provincia { get; set; }
        public string Canton { get; set; }
        public string Distrito { get; set; }
        public string DireccionExacta { get; set; }
        public DateTime FechaActualizacion { get; set; }
    }

    /// <summary>
    /// Response de Información de Identificación
    /// </summary>
    public class InformacionIdentificacionResponse
    {
        public int InformacionIdentificacionId { get; set; }
        public string PaisIdentificacion { get; set; }
        public string TipoIdentificadorNacional { get; set; }
        public string IdentificadorNacional { get; set; }
        public string PaisSeguridadSocial { get; set; }
        public string TipoSeguridadSocial { get; set; }
        public string IdentificadorSeguridadSocial { get; set; }
        public string NivelEducacionSuperior { get; set; }
        public string MensajeDiscapacidad { get; set; }
        public DateTime FechaActualizacion { get; set; }
    }
}
