using BL.Interface;
using DA.Interfaces;
using DA.Servicios;
using Model.Entities;

namespace BL.Servicios
{
    public class HorariosBL:IHorariosBL
    {
        private readonly IHorariosDA _horariosDA;

        public HorariosBL(IHorariosDA horariosDA)
        {
            _horariosDA = horariosDA;
        }
        public async Task<List<Horarios>> ObtenerTodos()
        {
            return await _horariosDA.ObtenerTodos();
        }
    }
}
