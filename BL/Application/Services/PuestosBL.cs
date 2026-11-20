using BL.Interface;
using DA.Interfaces;
using Model.Entities;

namespace BL.Servicios
{
    public class PuestosBL : IPuestosBL
    {

        private readonly IPuestosDA  _puestosDA;

        public PuestosBL(IPuestosDA puestosDA)
        {
            _puestosDA = puestosDA;
        }
        public async Task<List<Puestos>> ObtenerTodos()
        {
           return await _puestosDA.ObtenerTodos();
        }
    }
}
