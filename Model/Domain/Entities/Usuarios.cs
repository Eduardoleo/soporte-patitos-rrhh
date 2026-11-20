using System.ComponentModel.DataAnnotations.Schema;

namespace Model.Entities
{
    public class Usuarios
    {

        public int Usuario_ID { get; set; }

        public string Nombre_Usuario { get; set; }
        [System.Text.Json.Serialization.JsonIgnore]
        public string Password_Hash { get; set; }
        public bool Debe_Cambiar_Clave { get; set; }
        public string Estado { get; set; }
        public DateTime Fecha_Creacion { get; set; }
        public DateTime? Ultimo_Acceso { get; set; }

        // Para obtener el perfil a través del empleado
        [NotMapped]
        public virtual Perfiles Perfil { get; set; }
    }
}
