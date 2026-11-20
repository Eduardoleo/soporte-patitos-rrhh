using BL.Interface;
using DA.Interfaces;
using Microsoft.EntityFrameworkCore;
using Model.Entities;
using Model.Requests;
using System.Text;
using System.Security.Cryptography;
using DA.Servicios;
using System.Collections.Concurrent;
using BL.Application.Services;
using Microsoft.AspNetCore.Identity;

namespace BL.Servicios
{
    public class UsuariosBL : IUsuariosBL
    {
        private readonly IUsuariosDA _usuariosDA;
        private readonly IEmpleadosDA _empleadosDA;
        private static readonly ConcurrentDictionary<string, int> IntentosFallidos = new();

        public UsuariosBL(IUsuariosDA usuariosDA, IEmpleadosDA empleadosDA)
        {
            _usuariosDA = usuariosDA;
            _empleadosDA = empleadosDA;
        }

        public async Task<List<Usuarios>> ObtenerTodos()
        {
            return await _usuariosDA.ObtenerTodos();
        }

        public async Task<Usuarios> ObtenerPorId(int id)
        {
            if (id <= 0)
                throw new ArgumentException("ID inválido");

            return await _usuariosDA.ObtenerPorId(id);
        }

        public async Task<Usuarios> ObtenerPorNombre(string nombreUsuario)
        {
            if (nombreUsuario == null)
                throw new ArgumentException("El nombre es obligatorio");

            return await _usuariosDA.ObtenerPorNombre(nombreUsuario);
        }

        public async Task<Usuarios> CrearUsuario(Usuarios usuario)
        {
            if (usuario == null)
                throw new Exception("El usuario no puede estar vacío");

            if (string.IsNullOrWhiteSpace(usuario.Nombre_Usuario))
                throw new ArgumentException("El nombre de usuario es obligatorio");

            if (string.IsNullOrWhiteSpace(usuario.Password_Hash))
                throw new ArgumentException("La contraseña es obligatoria");

            var existente = await _usuariosDA.ObtenerPorNombre(usuario.Nombre_Usuario);
            if (existente != null)
                throw new InvalidOperationException("El nombre de usuario ya existe");

            usuario.Password_Hash = CrearHash(usuario.Password_Hash);
            usuario.Fecha_Creacion = DateTime.Now;
            usuario.Estado = "ACTIVO";
            usuario.Debe_Cambiar_Clave = true;
            usuario.Ultimo_Acceso = null;

            await _usuariosDA.InsertarDatos(usuario);

            return usuario; 
        }

        public async Task<Usuarios> ActualizarUsuario(int id, UsuarioActualizarRequest request)
        {
            if (id <= 0)
                throw new ArgumentException("ID inválido");

            if (request == null)
                throw new ArgumentException("Datos obligatorios");

            if (string.IsNullOrWhiteSpace(request.Nombre_Usuario))
                throw new ArgumentException("El nombre de usuario es obligatorio");

            if (string.IsNullOrWhiteSpace(request.Estado))
                throw new ArgumentException("El estado es obligatorio");

            if (request.Estado != "Activo" && request.Estado != "Inactivo" && request.Estado != "Bloqueado")
                throw new Exception("El estado debe ser 'Activo', 'Inactivo' o 'Bloqueado'");

            var usuarioActual = await _usuariosDA.ObtenerPorId(id);
            if (usuarioActual == null)
                throw new Exception("El usuario no existe");

            if (usuarioActual.Nombre_Usuario != request.Nombre_Usuario)
            {
                var existente = await _usuariosDA.ObtenerPorNombre(request.Nombre_Usuario);
                if (existente != null)
                    throw new Exception("El nombre de usuario ya está en uso");

                usuarioActual.Nombre_Usuario = request.Nombre_Usuario;
            }

            usuarioActual.Estado = request.Estado;

            if (!string.IsNullOrWhiteSpace(request.Password_Hash))
            {
                usuarioActual.Password_Hash = CrearHash(request.Password_Hash);
            }

            await _usuariosDA.ActualizarDatos(usuarioActual);

            return usuarioActual; 
        }

        public async Task CambiarPassword(int id, string nuevaPassword)
        {
            if (id <= 0)
                throw new ArgumentException("ID inválido");

            if (string.IsNullOrWhiteSpace(nuevaPassword))
                throw new ArgumentException("La contraseña es obligatoria");

            
            var usuario = await _usuariosDA.ObtenerPorId(id);
            if (usuario == null)
                throw new Exception("El usuario no existe");

            
            var nuevaPasswordHash = CrearHash(nuevaPassword);

          
            if (PasswordSecurity.Verify(usuario.Password_Hash, nuevaPassword) != PasswordVerificationResult.Failed)
                throw new InvalidOperationException("La nueva contraseña no puede ser igual a la actual");

            
            usuario.Password_Hash = nuevaPasswordHash;
            usuario.Debe_Cambiar_Clave = false;

            
            await _usuariosDA.CambiarPassword(usuario);
        }

        public async Task EliminarUsuario(int id)
        {
            if (id <= 0)
                throw new ArgumentException("ID inválido");

            var existente = await _usuariosDA.ObtenerPorId(id);
            if (existente == null)
                throw new InvalidOperationException("El usuario no existe");

            await _usuariosDA.EliminarDatos(existente);
        }


        public async Task<Usuarios> Login(string usuario, string password)
        {
            if (string.IsNullOrWhiteSpace(usuario) || string.IsNullOrWhiteSpace(password))
                throw new Exception("Usuario y contraseña son obligatorios.");

            var user = await _usuariosDA.ObtenerPorNombre(usuario);
            if (user == null)
                return null;

            if (!string.Equals((user.Estado ?? string.Empty).Trim(), "ACTIVO", StringComparison.OrdinalIgnoreCase))
                throw new Exception("El usuario se encuentra bloqueado o inactivo.");

            var verificacion = PasswordSecurity.Verify(user.Password_Hash, password);

            if (verificacion == PasswordVerificationResult.Failed)
            {
                var intentos = IntentosFallidos.AddOrUpdate(usuario.ToUpperInvariant(), 1, (_, actual) => actual + 1);
                if (intentos >= 5)
                {
                    user.Estado = "BLOQUEADO";
                    await _usuariosDA.ActualizarDatos(user);
                    IntentosFallidos.TryRemove(usuario.ToUpperInvariant(), out _);
                    throw new Exception("Usuario bloqueado por máximo de intentos fallidos.");
                }

                return null;
            }

            var empleado = await _empleadosDA.ObtenerPorUsuarioId(user.Usuario_ID);
            if (empleado == null)
                throw new Exception("No se encontró un empleado asociado al usuario.");

            if (!string.Equals((empleado.Estado ?? string.Empty).Trim(), "ACTIVO", StringComparison.OrdinalIgnoreCase))
                throw new Exception("El empleado no tiene estado ACTIVO y no puede ingresar a la plataforma.");

            IntentosFallidos.TryRemove(usuario.ToUpperInvariant(), out _);

            if (verificacion == PasswordVerificationResult.SuccessRehashNeeded)
            {
                user.Password_Hash = CrearHash(password);
                await _usuariosDA.CambiarPassword(user);
            }

            await ActualizarUltimoAcceso(user.Usuario_ID, DateTime.Now);

            return user;
        }


        private string CrearHash(string password)
        {
            return PasswordSecurity.Hash(password);
        }

        public async Task ActualizarUltimoAcceso(int id, DateTime fecha)
        {
            if (id <= 0)
                throw new ArgumentException("ID inválido");

            if (fecha == DateTime.MinValue)
                throw new ArgumentException("La fecha es obligatoria");

            var usuario = await _usuariosDA.ObtenerPorId(id);
            if (usuario == null)
                throw new Exception("El usuario no existe");

            usuario.Ultimo_Acceso = fecha;

            await _usuariosDA.ActualizarUltimoAcceso(usuario);
        }

       
    }
}
