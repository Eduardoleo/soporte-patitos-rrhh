// Exporta filas planas a un .xlsx con ExcelJS (reemplaza a SheetJS 0.18.5,
// vulnerable y sin corrección publicada en npm).
// Igual que XLSX.utils.json_to_sheet: la primera fila son las claves de los
// objetos en su orden de aparición y cada objeto es una fila.
// ExcelJS se carga bajo demanda para no inflar el bundle inicial.
export async function exportarFilasExcel(filas, nombreHoja, nombreArchivo) {
    const modulo = await import('exceljs');
    const ExcelJS = modulo.default ?? modulo;

    const columnas = [];
    filas.forEach((fila) => {
        Object.keys(fila).forEach((clave) => {
            if (!columnas.includes(clave)) columnas.push(clave);
        });
    });

    const libro = new ExcelJS.Workbook();
    const hoja = libro.addWorksheet(nombreHoja);
    hoja.addRow(columnas);
    filas.forEach((fila) => {
        hoja.addRow(columnas.map((clave) => fila[clave] ?? null));
    });

    const buffer = await libro.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombreArchivo;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
