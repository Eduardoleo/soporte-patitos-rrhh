using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace Model.Entities
{
    public class Empleados
    {
        public int Empleado_ID { get; set; }
        public int Usuario_ID { get; set; }
        public int Perfil_ID { get; set; }
        public int Puesto_ID { get; set; }
        public int Horario_ID { get; set; }
        public string Cedula { get; set; }
        public DateTime Fecha_Ingreso { get; set; }
        public string Fotografia_Url { get; set; }
        public string Estado { get; set; } = "ACTIVO";
        public DateTime Fecha_Registro { get; set; } = DateTime.UtcNow;

        // Navegación a datos relacionados
        [ForeignKey("Usuario_ID")]
        public virtual Usuarios Usuario { get; set; }

        [ForeignKey("Perfil_ID")]
        public virtual Perfiles Perfil { get; set; }

        [ForeignKey("Puesto_ID")]
        public virtual Puestos Puesto { get; set; }

        [ForeignKey("Horario_ID")]
        public virtual Horarios Horario { get; set; }

        // Datos complementarios separados por responsabilidad
        public virtual InformacionPersonal InformacionPersonal { get; set; }
        public virtual InformacionContacto InformacionContacto { get; set; }
        public virtual InformacionDireccion InformacionDireccion { get; set; }
        public virtual InformacionIdentificacion InformacionIdentificacion { get; set; }

        // Relaciones existentes
        public virtual ICollection<ContactosEmergencia> ContactosEmergencia { get; set; } = new List<ContactosEmergencia>();
        public virtual ICollection<Asistencia> Asistencias { get; set; } = new List<Asistencia>();
        public virtual ICollection<SolicitudAusencia> SolicitudesAusencia { get; set; } = new List<SolicitudAusencia>();
        public virtual ICollection<Evaluaciones> Evaluaciones { get; set; } = new List<Evaluaciones>();
        public virtual ICollection<Colillas_Pago> ColillasPago { get; set; } = new List<Colillas_Pago>();
        public virtual ICollection<SolicitudAusencia> SolicitudesAusenciaAprobadas { get; set; } = new List<SolicitudAusencia>();
        public virtual ICollection<Notificacion> NotificacionesDestino { get; set; } = new List<Notificacion>();
        public virtual ICollection<Notificacion> NotificacionesOrigen { get; set; } = new List<Notificacion>();
    }
}