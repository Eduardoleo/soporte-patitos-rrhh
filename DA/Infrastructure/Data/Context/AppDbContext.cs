using Microsoft.EntityFrameworkCore;
using Model.Entities;

namespace DA.Context
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        // DbSets
        public DbSet<Usuarios> Usuarios { get; set; }
        public DbSet<Departamentos> Departamentos { get; set; }
        public DbSet<Horarios> Horarios { get; set; }
        public DbSet<Puestos> Puestos { get; set; }
        public DbSet<Perfiles> Perfiles { get; set; }
        public DbSet<Empleados> Empleados { get; set; }
        public DbSet<InformacionPersonal> Informacion_Personal { get; set; }
        public DbSet<InformacionContacto> Informacion_Contacto { get; set; }
        public DbSet<InformacionDireccion> Informacion_Direccion { get; set; }
        public DbSet<InformacionIdentificacion> Informacion_Identificacion { get; set; }
        public DbSet<ContactosEmergencia> Contactos_Emergencia { get; set; }
        public DbSet<Asistencia> Asistencia { get; set; }
        public DbSet<Colillas_Pago> Colillas_Pago { get; set; }
        public DbSet<Evaluacion_Detalle> Evaluacion_Detalle { get; set; }
        public DbSet<Evaluaciones> Evaluaciones { get; set; }
        public DbSet<Planillas> Planillas { get; set; }
        public DbSet<Preguntas_Evaluacion> Preguntas_Evaluacion { get; set; }
        public DbSet<TipoAusencia> Tipos_Ausencia { get; set; }
        public DbSet<SolicitudAusencia> Solicitudes_Ausencia { get; set; }
        public DbSet<Notificacion> Notificaciones { get; set; }
        public DbSet<Feriado> Feriados { get; set; }

        // Configuración de Primary Key
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Usuarios>()
                .HasKey(u => u.Usuario_ID);

            modelBuilder.Entity<Departamentos>()
                .HasKey(d => d.Departamento_ID);

            modelBuilder.Entity<Horarios>()
                .HasKey(h => h.Horario_ID);

            modelBuilder.Entity<Puestos>()
                .HasKey(p => p.Puesto_ID);

            modelBuilder.Entity<Perfiles>()
                .HasKey(pe => pe.Perfil_ID);

            modelBuilder.Entity<Empleados>()
                .HasKey(e => e.Empleado_ID);

            modelBuilder.Entity<InformacionPersonal>()
                .HasKey(ip => ip.Informacion_Personal_ID);

            modelBuilder.Entity<InformacionContacto>()
                .HasKey(ic => ic.Informacion_Contacto_ID);

            modelBuilder.Entity<InformacionDireccion>()
                .HasKey(id => id.Informacion_Direccion_ID);

            modelBuilder.Entity<InformacionIdentificacion>()
                .HasKey(ii => ii.Informacion_Identificacion_ID);

            modelBuilder.Entity<ContactosEmergencia>()
                .HasKey(ce => ce.Contacto_ID);

            modelBuilder.Entity<Asistencia>()
                .HasKey(a => a.Asistencia_ID);

            modelBuilder.Entity<Colillas_Pago>()
                .HasKey(c => c.Colilla_ID);

            modelBuilder.Entity<Evaluacion_Detalle>()
                .HasKey(ed => ed.Evaluacion_Detalle_ID);

            modelBuilder.Entity<Evaluaciones>()
                .HasKey(ev => ev.Evaluacion_ID);

            modelBuilder.Entity<Planillas>()
                .HasKey(p => p.Planilla_ID);

            modelBuilder.Entity<Preguntas_Evaluacion>()
                .HasKey(pe => pe.Pregunta_ID);

            modelBuilder.Entity<TipoAusencia>()
                .HasKey(ta => ta.Tipo_Ausencia_ID);

            modelBuilder.Entity<SolicitudAusencia>()
                .HasKey(sa => sa.Solicitud_ID);

            modelBuilder.Entity<Notificacion>()
                .HasKey(n => n.Notificacion_ID);

            modelBuilder.Entity<Feriado>()
                .HasKey(f => f.Feriado_ID);

            // Configurar relaciones
            modelBuilder.Entity<InformacionPersonal>()
                .HasOne(ip => ip.Empleado)
                .WithOne(e => e.InformacionPersonal)
                .HasForeignKey<InformacionPersonal>(ip => ip.Empleado_ID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<InformacionContacto>()
                .HasOne(ic => ic.Empleado)
                .WithOne(e => e.InformacionContacto)
                .HasForeignKey<InformacionContacto>(ic => ic.Empleado_ID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<InformacionDireccion>()
                .HasOne(id => id.Empleado)
                .WithOne(e => e.InformacionDireccion)
                .HasForeignKey<InformacionDireccion>(id => id.Empleado_ID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<InformacionIdentificacion>()
                .HasOne(ii => ii.Empleado)
                .WithOne(e => e.InformacionIdentificacion)
                .HasForeignKey<InformacionIdentificacion>(ii => ii.Empleado_ID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Empleados>()
                .HasOne(e => e.Usuario)
                .WithMany()
                .HasForeignKey(e => e.Usuario_ID);

            modelBuilder.Entity<Empleados>()
                .HasOne(e => e.Perfil)
                .WithMany()
                .HasForeignKey(e => e.Perfil_ID);

            modelBuilder.Entity<Empleados>()
                .HasOne(e => e.Puesto)
                .WithMany()
                .HasForeignKey(e => e.Puesto_ID);

            modelBuilder.Entity<Empleados>()
                .HasOne(e => e.Horario)
                .WithMany()
                .HasForeignKey(e => e.Horario_ID);

            modelBuilder.Entity<Empleados>()
                .HasMany(e => e.ContactosEmergencia)
                .WithOne()
                .HasForeignKey(c => c.Empleado_ID);

            modelBuilder.Entity<Empleados>()
                .HasMany(e => e.Asistencias)
                .WithOne()
                .HasForeignKey(a => a.Empleado_ID);

            modelBuilder.Entity<Empleados>()
                .HasMany(e => e.Evaluaciones)
                .WithOne()
                .HasForeignKey(ev => ev.Empleado_ID);

            modelBuilder.Entity<Empleados>()
                .HasMany(e => e.SolicitudesAusencia)
                .WithOne()
                .HasForeignKey(sa => sa.Empleado_ID)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Empleados>()
                .HasMany(e => e.SolicitudesAusenciaAprobadas)
                .WithOne()
                .HasForeignKey(sa => sa.Aprobador_ID)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Empleados>()
                .HasMany(e => e.ColillasPago)
                .WithOne()
                .HasForeignKey(cp => cp.Empleado_ID)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Empleados>()
                .HasMany(e => e.NotificacionesDestino)
                .WithOne()
                .HasForeignKey(n => n.Empleado_Destino_ID)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Empleados>()
                .HasMany(e => e.NotificacionesOrigen)
                .WithOne()
                .HasForeignKey(n => n.Empleado_Origen_ID)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}