using DA.Context;
using DA.Interfaces;
using Microsoft.EntityFrameworkCore;
using Model.Entities;


namespace DA.Servicios
{
    public class UsuariosDA : IUsuariosDA
    {
        private readonly AppDbContext _context;

        public UsuariosDA(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<Usuarios>> ObtenerTodos()
        {
            return await _context.Usuarios.ToListAsync();
        }

        public async Task<Usuarios> ObtenerPorId(int id)
        {
            return await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Usuario_ID == id);
        }

        public async Task<Usuarios> ObtenerPorNombre(string nombreUsuario)
        {
            return await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Nombre_Usuario == nombreUsuario);
        }

        public async Task InsertarDatos(Usuarios usuario)
        {
            await _context.Usuarios.AddAsync(usuario);
            await _context.SaveChangesAsync();
        }


        public async Task EliminarDatos(Usuarios usuario)
        {
            _context.Usuarios.Remove(usuario);
            await _context.SaveChangesAsync();
        }

        public async Task ActualizarDatos(Usuarios usuario)
        {
            await _context.SaveChangesAsync();
        }

        public async Task CambiarPassword(Usuarios usuario)
        {
            await _context.SaveChangesAsync();
        }

        public async Task ActualizarUltimoAcceso(Usuarios usuario)
        {
           
           await _context.SaveChangesAsync();
            
        }

        
    }
}
