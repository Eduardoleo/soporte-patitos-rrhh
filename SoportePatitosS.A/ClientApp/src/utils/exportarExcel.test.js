import ExcelJS from 'exceljs';
import { exportarFilasExcel } from './exportarExcel';

test('exporta hoja, columnas en orden y nombre de archivo como json_to_sheet', async () => {
    let blob;
    let descarga;
    URL.createObjectURL = vi.fn((b) => { blob = b; return 'blob:prueba'; });
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click')
        .mockImplementation(function () { descarga = this.download; });

    await exportarFilasExcel(
        [
            { Fecha: '01/02/2026', IdEmpleado: 7, Nombre: 'Persona Demo' },
            { Fecha: '02/02/2026', IdEmpleado: 8, Nombre: 'Otra Persona', Extra: 'x' }
        ],
        'Asistencia',
        'asistencia_general_2026-02-01.xlsx'
    );

    expect(click).toHaveBeenCalledTimes(1);
    expect(descarga).toBe('asistencia_general_2026-02-01.xlsx');

    const libro = new ExcelJS.Workbook();
    await libro.xlsx.load(await blob.arrayBuffer());
    const hoja = libro.getWorksheet('Asistencia');
    expect(hoja.getRow(1).values.slice(1)).toEqual(['Fecha', 'IdEmpleado', 'Nombre', 'Extra']);
    expect(hoja.getRow(2).values.slice(1)).toEqual(['01/02/2026', 7, 'Persona Demo']);
    expect(hoja.getRow(3).values.slice(1)).toEqual(['02/02/2026', 8, 'Otra Persona', 'x']);
    click.mockRestore();
});
