using BL.Interface;
using DA.Interfaces;
using DA.Servicios;
using Model.Entities;

namespace BL.Servicios
{
    public class DepartamentosBL : IDepartamentosBL
    {
        private readonly IDepartamentosDA _departamentosDA;

        public DepartamentosBL(IDepartamentosDA departamentosDA)
        {
            _departamentosDA = departamentosDA;
        }
        public async Task<List<Departamentos>> ObtenerTodos()
        {
            return await _departamentosDA.ObtenerTodos();
        }
    }
}
