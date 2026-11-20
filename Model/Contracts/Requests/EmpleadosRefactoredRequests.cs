namespace SoportePatitosS.A.Model.Contracts.Requests
{
    using System;

    /// <summary>
    /// Request para crear un empleado completo con toda su información
    /// </summary>
    public class CrearEmpleadoCompletoRequest
    {
        public int UsuarioId { get; set; }
        public int PerfilId { get; set; }
        public int PuestoId { get; set; }
        public int HorarioId { get; set; }
        public string Cedula { get; set; }
        public DateTime FechaIngreso { get; set; }
        public string FotografiaUrl { get; set; }

        public CrearInformacionPersonalRequest InformacionPersonal { get; set; }
        public CrearInformacionContactoRequest InformacionContacto { get; set; }
        public CrearInformacionDireccionRequest InformacionDireccion { get; set; }
        public CrearInformacionIdentificacionRequest InformacionIdentificacion { get; set; }
    }

    /// <summary>
    /// Request para actualizar información personal
    /// </summary>
    public class ActualizarInformacionPersonalRequest
    {
        public string NombreEmpleado { get; set; }
        public string PrimerNombre { get; set; }
        public string SegundoNombre { get; set; }
        public string ApellidoPaterno { get; set; }
        public string ApellidoMaterno { get; set; }
        public DateTime? FechaNacimiento { get; set; }
        public string Genero { get; set; }
        public string EstadoCivil { get; set; }
        public string PaisDemografico { get; set; }
    }

    /// <summary>
    /// Request para crear información personal
    /// </summary>
    public class CrearInformacionPersonalRequest
    {
        public string NombreEmpleado { get; set; }
        public string PrimerNombre { get; set; }
        public string SegundoNombre { get; set; }
        public string ApellidoPaterno { get; set; }
        public string ApellidoMaterno { get; set; }
        public DateTime? FechaNacimiento { get; set; }
        public string Genero { get; set; }
        public string EstadoCivil { get; set; }
        public string PaisDemografico { get; set; }
    }

    /// <summary>
    /// Request para actualizar información de contacto
    /// </summary>
    public class ActualizarInformacionContactoRequest
    {
        public string CorreoElectronico { get; set; }
        public string CorreoElectronicoPersonal { get; set; }
        public string TelefonoMovil { get; set; }
        public string TelefonoFijo { get; set; }
    }

    /// <summary>
    /// Request para crear información de contacto
    /// </summary>
    public class CrearInformacionContactoRequest
    {
        public string CorreoElectronico { get; set; }
        public string CorreoElectronicoPersonal { get; set; }
        public string TelefonoMovil { get; set; }
        public string TelefonoFijo { get; set; }
    }

    /// <summary>
    /// Request para actualizar información de dirección
    /// </summary>
    public class ActualizarInformacionDireccionRequest
    {
        public string Pais { get; set; }
        public string Provincia { get; set; }
        public string Canton { get; set; }
        public string Distrito { get; set; }
        public string DireccionExacta { get; set; }
    }

    /// <summary>
    /// Request para crear información de dirección
    /// </summary>
    public class CrearInformacionDireccionRequest
    {
        public string Pais { get; set; }
        public string Provincia { get; set; }
        public string Canton { get; set; }
        public string Distrito { get; set; }
        public string DireccionExacta { get; set; }
    }

    /// <summary>
    /// Request para actualizar información de identificación
    /// </summary>
    public class ActualizarInformacionIdentificacionRequest
    {
        public string PaisIdentificacion { get; set; }
        public string TipoIdentificadorNacional { get; set; }
        public string IdentificadorNacional { get; set; }
        public string PaisSeguridadSocial { get; set; }
        public string TipoSeguridadSocial { get; set; }
        public string IdentificadorSeguridadSocial { get; set; }
        public string NivelEducacionSuperior { get; set; }
        public string MensajeDiscapacidad { get; set; }
    }

    /// <summary>
    /// Request para crear información de identificación
    /// </summary>
    public class CrearInformacionIdentificacionRequest
    {
        public string PaisIdentificacion { get; set; }
        public string TipoIdentificadorNacional { get; set; }
        public string IdentificadorNacional { get; set; }
        public string PaisSeguridadSocial { get; set; }
        public string TipoSeguridadSocial { get; set; }
        public string IdentificadorSeguridadSocial { get; set; }
        public string NivelEducacionSuperior { get; set; }
        public string MensajeDiscapacidad { get; set; }
    }
}
