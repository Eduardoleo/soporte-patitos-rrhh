using BL.Interface;
using DA.Interfaces;
using Model.Entities;

namespace BL.Servicios
{
    public class PerfilesBL:IPerfilesBL
    {
        private readonly IPerfilesDA _perfilesDA;

        public PerfilesBL(IPerfilesDA perfilesDA)
        {
            _perfilesDA = perfilesDA;
        }
        public async Task<List<Perfiles>> ObtenerTodos()
        {
            return await _perfilesDA.ObtenerTodos();
        }
    }
}
