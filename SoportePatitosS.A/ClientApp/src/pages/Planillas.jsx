import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
    Box,
    Typography,
    Card,
    CardContent,
    CircularProgress,
    Alert,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Button,
    IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

const Planillas = () => {
    const navigate = useNavigate();

    const colors = {
        negro: '#0B0B0B',
        azul: '#1E3A8A',
        celeste: '#00A8CC',
        celesteSuave: '#EAF8FC',
        amarillo: '#F4C542',
        blanco: '#FFFFFF',
        fondo: '#F4F9FC'
    };

    const [mes, setMes] = useState(new Date().toISOString().slice(0, 7));
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [filas, setFilas] = useState([]);

    const maxMesVisible = useMemo(() => {
        const hoy = new Date();
        const anio = hoy.getFullYear();
        const mesActual = hoy.getMonth() + 1;
        const mesPermitido = hoy.getDate() >= 20 ? mesActual : mesActual - 1;

        if (mesPermitido <= 0) {
            return `${anio - 1}-12`;
        }

        return `${anio}-${String(mesPermitido).padStart(2, '0')}`;
    }, []);

    const normalizar = (txt) => {
        if (!txt) return txt;
        return `${txt}`
            .replaceAll('Ã¡', 'á')
            .replaceAll('Ã©', 'é')
            .replaceAll('Ã­', 'í')
            .replaceAll('Ã³', 'ó')
            .replaceAll('Ãº', 'ú')
            .replaceAll('Ã±', 'ñ')
            .replaceAll('Ã', 'Á')
            .replaceAll('Ã‰', 'É')
            .replaceAll('Ã', 'Í')
            .replaceAll('Ã“', 'Ó')
            .replaceAll('Ãš', 'Ú')
            .replaceAll('Ã‘', 'Ñ');
    };

    const calcularPeriodoMes = (mesValor) => {
        const [year, month] = mesValor.split('-').map(Number);
        const inicioMes = new Date(year, month - 1, 1);
        const finMes = new Date(year, month, 0);

        const inicioExtras = new Date(year, month - 2, 20);
        const finExtras = new Date(year, month - 1, 20);

        return { inicioMes, finMes, inicioExtras, finExtras };
    };

    const diasEntre = (inicio, fin) => {
        const i = new Date(inicio);
        const f = new Date(fin);
        i.setHours(0, 0, 0, 0);
        f.setHours(0, 0, 0, 0);
        const diff = Math.floor((f - i) / (1000 * 60 * 60 * 24));
        return diff + 1;
    };

    const cargarPlanilla = async () => {
        try {
            setCargando(true);
            setError('');

            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            const [anioSeleccionado, mesSeleccionado] = mes.split('-').map(Number);
            const inicioMesSeleccionado = new Date(anioSeleccionado, mesSeleccionado - 1, 1);
            const inicioMesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

            const esMesFuturo = inicioMesSeleccionado > inicioMesActual;
            const esMesActualBloqueado =
                inicioMesSeleccionado.getFullYear() === inicioMesActual.getFullYear()
                && inicioMesSeleccionado.getMonth() === inicioMesActual.getMonth()
                && hoy.getDate() < 13;


            if (esMesFuturo || esMesActualBloqueado) {
                setFilas([]);
                setError('La planilla del mes seleccionado se habilita después del día 20 del mismo mes.');
                return;
            }

            const { inicioMes, finMes, inicioExtras, finExtras } = calcularPeriodoMes(mes);

            const [empleadosRes, tiposAusRes, departamentosRes] = await Promise.all([
                axios.get('/api/Empleados/ObtenerTodos'),
                axios.get('/api/Empleados/TiposAusencia'),
                axios.get('/api/Departamentos/ObtenerTodos')
            ]);

            const empleados = Array.isArray(empleadosRes.data) ? empleadosRes.data : [];
            const tiposAusencia = Array.isArray(tiposAusRes.data) ? tiposAusRes.data : [];
            const departamentos = Array.isArray(departamentosRes.data) ? departamentosRes.data : [];
            const departamentoMap = {};
            departamentos.forEach((d) => {
                const id = d.departamento_ID ?? d.departamentoId;
                const nombre = normalizar(d.nombre_Departamento ?? d.nombreDepartamento ?? 'N/A');
                departamentoMap[id] = nombre;
            });
            const tipoMap = {};
            tiposAusencia.forEach((t) => {
                const id = t.tipo_Ausencia_ID ?? t.tipoAusenciaId;
                const nombre = normalizar(t.nombre_Ausencia ?? t.nombreAusencia ?? '');
                tipoMap[id] = nombre;
            });

            const empleadosActivos = empleados.filter((e) => {
                const estado = `${(e.estado || 'ACTIVO').toUpperCase()}`;
                if (!estado.startsWith('ACTIVO')) return false;

                const fechaIngresoRaw =
                    e.fecha_Ingreso
                    ?? e.fechaIngreso
                    ?? e.Fecha_Ingreso
                    ?? e.fecha_Registro
                    ?? e.fechaRegistro
                    ?? e.Fecha_Registro;

                if (!fechaIngresoRaw) return false;

                const fechaIngreso = new Date(fechaIngresoRaw);
                if (Number.isNaN(fechaIngreso.getTime())) return false;

                fechaIngreso.setHours(0, 0, 0, 0);
                const finMesComparacion = new Date(finMes);
                finMesComparacion.setHours(23, 59, 59, 999);

                return fechaIngreso <= finMesComparacion;
            });

            const resultado = await Promise.all(
                empleadosActivos.map(async (e) => {
                    const empleadoId = e.empleado_ID ?? e.empleadoId;
                    const info = e.informacionPersonal || {};
                    const nombre = normalizar(
                        info.nombre_Empleado
                        || [info.primer_Nombre, info.segundo_Nombre, info.apellido_Paterno, info.apellido_Materno]
                            .filter(Boolean)
                            .join(' ')
                    ) || `Empleado #${empleadoId}`;

                    const puestoObj = e.puesto || e.Puesto || {};
                    const salarioGlobal = Number(puestoObj.salario_Base ?? puestoObj.salarioBase ?? puestoObj.Salario_Base ?? 0);
                    const puesto = normalizar(
                        puestoObj.nombre_Puesto
                        ?? puestoObj.nombrePuesto
                        ?? puestoObj.Nombre_Puesto
                        ?? puestoObj.NombrePuesto
                        ?? 'No definido'
                    );
                    const departamentoId = puestoObj.departamento_ID ?? puestoObj.departamentoId ?? puestoObj.Departamento_ID;
                    const area = departamentoMap[departamentoId] || 'No definida';

                    const [resumenExtrasRes, ausenciasRes] = await Promise.all([
                        axios.get(`/api/Asistencia/ResumenPeriodo/${empleadoId}?desde=${inicioExtras.toISOString().slice(0, 10)}&hasta=${finExtras.toISOString().slice(0, 10)}`),
                        axios.get(`/api/Empleados/AusenciasEmpleado/${empleadoId}`)
                    ]);

                    const resumenExtras = Array.isArray(resumenExtrasRes.data) ? resumenExtrasRes.data : [];
                    const ausencias = Array.isArray(ausenciasRes.data) ? ausenciasRes.data : [];

                    const horasExtras = resumenExtras.reduce((acc, r) => acc + Number(r.horasExtra ?? 0), 0);
                    const valorHora = salarioGlobal > 0 ? salarioGlobal / 176 : 0;
                    const montoExtras = horasExtras * valorHora * 1.5;

                    const ccss = salarioGlobal * 0.1067;

                    let deduccionIncapacidades = 0;
                    let vacaciones = 0;
                    let otrosRebajos = 0;

                    ausencias.forEach((a) => {
                        const estado = `${a.estado_Solicitud ?? a.estadoSolicitud ?? ''}`.toUpperCase();
                        if (!estado.includes('APROBAD')) return;

                        const fechaAprobacionRaw = a.fecha_Aprobacion ?? a.fechaAprobacion;
                        const fechaAprobacion = fechaAprobacionRaw ? new Date(fechaAprobacionRaw) : null;
                        if (!fechaAprobacion || Number.isNaN(fechaAprobacion.getTime())) return;

                        const tipoId = a.tipo_Ausencia_ID ?? a.tipoAusenciaId;
                        const tipoNombre = (tipoMap[tipoId] || '').toUpperCase();
                        const fi = new Date(a.fecha_Inicio ?? a.fechaInicio);
                        const ff = new Date(a.fecha_Fin ?? a.fechaFin);

                        const aprobacionDentroCorte = fechaAprobacion >= inicioExtras && fechaAprobacion <= finExtras;
                        if (!aprobacionDentroCorte) return;

                        const intersectaCorteNomina = fi <= finExtras && ff >= inicioExtras;
                        if (!intersectaCorteNomina) return;

                        const inicio = fi < inicioExtras ? inicioExtras : fi;
                        const fin = ff > finExtras ? finExtras : ff;
                        const dias = Math.max(0, diasEntre(inicio, fin));
                        const montoDia = salarioGlobal / 30;

                        if (tipoNombre.includes('INCAP')) {
                            deduccionIncapacidades += dias * montoDia * 0.4;
                        } else if (tipoNombre.includes('VACAC')) {
                            vacaciones += dias * montoDia;
                        } else {
                            otrosRebajos += dias * montoDia;
                        }
                    });

                    const salarioTotal = salarioGlobal + montoExtras - ccss - deduccionIncapacidades - otrosRebajos;

                    return {
                        empleadoId,
                        nombre,
                        cedula: e.cedula || 'N/A',
                        area,
                        cargoActual: puesto,
                        cuentaBancaria: `CR${String(empleadoId).padStart(2, '0')} 0001 2000 0000 0000`,
                        salarioGlobal,
                        horasExtras,
                        montoExtras,
                        deduccionCcss: ccss,
                        deduccionIncapacidades,
                        vacaciones,
                        otrosRebajos,
                        salarioTotal,
                        periodoMes: `${inicioMes.toLocaleDateString('es-CR')} - ${finMes.toLocaleDateString('es-CR')}`,
                        periodoExtras: `${inicioExtras.toLocaleDateString('es-CR')} - ${finExtras.toLocaleDateString('es-CR')}`
                    };
                })
            );

            setFilas(resultado.sort((a, b) => a.empleadoId - b.empleadoId));
        } catch (err) {
            setError(typeof err?.response?.data === 'string' ? err.response.data : 'No se pudo calcular la planilla mensual.');
            setFilas([]);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarPlanilla();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se conserva cuándo se ejecuta el efecto (comportamiento original)
    }, [mes]);

    const moneda = (valor) => Number(valor || 0).toLocaleString('es-CR', { style: 'currency', currency: 'CRC' });

    const monedaPdf = (valor) => {
        const n = Number(valor || 0);
        const formateado = n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return `¢${formateado}`;
    };

    const exportarColillaPdf = (fila) => {
        const doc = new jsPDF('p', 'pt', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 32;
        const negro = [11, 11, 11];
        const azul = [30, 58, 138];
        const celeste = [0, 168, 204];
        const amarillo = [244, 197, 66];
        const grisSuave = [243, 246, 250];
        const grisLinea = [186, 196, 208];

        const [year, month] = mes.split('-').map(Number);
        const nombreMes = new Date(year, month - 1, 1).toLocaleString('es-CR', { month: 'long' }).toUpperCase();
        const [periodoInicio, periodoFin] = (fila.periodoMes || '').split(' - ');

        doc.setDrawColor(grisLinea[0], grisLinea[1], grisLinea[2]);
        doc.setLineWidth(0.7);
        doc.rect(margin - 10, margin - 10, pageWidth - ((margin - 10) * 2), pageHeight - ((margin - 10) * 2));
        doc.setFillColor(grisSuave[0], grisSuave[1], grisSuave[2]);
        doc.rect(margin - 10, margin - 10, pageWidth - ((margin - 10) * 2), 96, 'F');
        doc.setFillColor(azul[0], azul[1], azul[2]);
        doc.rect(margin - 10, margin - 10, pageWidth - ((margin - 10) * 2), 10, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(negro[0], negro[1], negro[2]);
        doc.text('SOPORTE PATITOS, S.A.', pageWidth / 2, 42, { align: 'center' });
        doc.setFontSize(11);
        doc.text('COMPROBANTE DE PAGO', pageWidth / 2, 64, { align: 'center' });
        doc.setFontSize(12.5);
        doc.text(`NÓMINA MENSUAL DE ${nombreMes} ${year}`, pageWidth / 2, 86, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10.5);
        doc.text(`Del ${periodoInicio || ''} al ${periodoFin || ''}`, pageWidth / 2, 104, { align: 'center' });
        doc.setDrawColor(celeste[0], celeste[1], celeste[2]);
        doc.setLineWidth(0.9);
        doc.line(margin, 112, pageWidth - margin, 112);

        autoTable(doc, {
            startY: 126,
            head: [['NO EMPLEADO', 'NOMBRES Y APELLIDOS', 'SUELDO MENSUAL', 'NO SEGURO SOCIAL']],
            body: [[`${fila.empleadoId}`, fila.nombre, monedaPdf(fila.salarioGlobal), fila.cedula]],
            styles: { fontSize: 8.6, font: 'helvetica', lineColor: [55, 65, 81], lineWidth: 0.35, cellPadding: 4 },
            headStyles: { fillColor: negro, textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [252, 252, 252] },
            columnStyles: {
                0: { cellWidth: 90 },
                1: { cellWidth: 180 },
                2: { cellWidth: 110, halign: 'right' },
                3: { cellWidth: 145 }
            },
            margin: { left: margin, right: margin }
        });

        autoTable(doc, {
            startY: doc.lastAutoTable.finalY,
            head: [['ÁREA/UBICACIÓN', 'CARGO ACTUAL', 'CUENTA BANCARIA']],
            body: [[fila.area, fila.cargoActual, fila.cuentaBancaria]],
            styles: { fontSize: 8.6, font: 'helvetica', lineColor: [55, 65, 81], lineWidth: 0.35, cellPadding: 4 },
            headStyles: { fillColor: azul, textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [252, 252, 252] },
            columnStyles: {
                0: { cellWidth: 170 },
                1: { cellWidth: 170 },
                2: { cellWidth: 185 }
            },
            margin: { left: margin, right: margin }
        });

        const yInfo = doc.lastAutoTable.finalY + 16;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.8);
        doc.text('Días suspensión sin goce de salario:  0.00', margin + 8, yInfo);
        doc.text('Días de incapacidad CCSS:  0.00', pageWidth / 2 + 18, yInfo);
        doc.text('Días permiso sin goce de salario:    0.00', margin + 8, yInfo + 14);
        doc.text('Días de incapacidad INSS:  0.00', pageWidth / 2 + 18, yInfo + 14);
        doc.text('Días de maternidad/paternidad:  0.00', pageWidth / 2 + 18, yInfo + 28);

        const ingresosTotal = fila.salarioGlobal + fila.montoExtras + fila.vacaciones;
        const deduccionesTotal = fila.deduccionCcss + fila.deduccionIncapacidades + fila.otrosRebajos;

        autoTable(doc, {
            startY: yInfo + 40,
            head: [['CONCEPTO', 'TIEMPO', 'INGRESOS', 'DEDUCCIONES']],
            body: [
                ['SUELDO ORDINARIO', '30.00', monedaPdf(fila.salarioGlobal), '-'],
                ['HORAS EXTRAS', Number(fila.horasExtras || 0).toFixed(2), monedaPdf(fila.montoExtras), '-'],
                ['VACACIONES', 'N/A', monedaPdf(fila.vacaciones), '-'],
                ['ANTICIPO QUINCENAL', 'N/A', '-', '-'],
                ['DEDUCCIÓN INCAPACIDADES', 'N/A', '-', monedaPdf(fila.deduccionIncapacidades)],
                ['SEGURO SOCIAL CCSS', 'N/A', '-', monedaPdf(fila.deduccionCcss)],
                ['OTROS REBAJOS', 'N/A', '-', monedaPdf(fila.otrosRebajos)]
            ],
            foot: [
                ['TOTAL CONCEPTOS', '', monedaPdf(ingresosTotal), monedaPdf(deduccionesTotal)],
                ['', '', 'NETO A PAGAR', monedaPdf(fila.salarioTotal)]
            ],
            styles: { fontSize: 8.6, font: 'helvetica', lineColor: [55, 65, 81], lineWidth: 0.35, cellPadding: 4 },
            headStyles: { fillColor: celeste, textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 251, 255] },
            columnStyles: {
                0: { cellWidth: 220 },
                1: { cellWidth: 70, halign: 'center' },
                2: { cellWidth: 120, halign: 'right' },
                3: { cellWidth: 120, halign: 'right' }
            },
            footStyles: { fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [15, 23, 42] },
            didParseCell: (data) => {
                if (data.section === 'foot' && data.row.index === 1 && (data.column.index === 2 || data.column.index === 3)) {
                    data.cell.styles.fillColor = amarillo;
                    data.cell.styles.textColor = negro;
                    data.cell.styles.halign = data.column.index === 2 ? 'center' : 'right';
                }
                if (data.section === 'foot' && data.row.index === 0 && data.column.index === 0) {
                    data.cell.styles.fillColor = [239, 244, 252];
                }
            },
            margin: { left: margin, right: margin }
        });

        const firmaY = Math.min(pageHeight - 70, doc.lastAutoTable.finalY + 110);
        doc.setDrawColor(0, 0, 0);
        doc.line(margin, firmaY, margin + 160, firmaY);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Firma Recibido', margin + 52, firmaY + 12);

        doc.save(`colilla_${fila.empleadoId}_${mes}.pdf`);
    };

    const totalNomina = useMemo(() => filas.reduce((acc, f) => acc + Number(f.salarioTotal || 0), 0), [filas]);

    if (cargando) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: colors.fondo }}>
            <Box sx={{ backgroundColor: colors.negro, color: colors.blanco, py: 2, px: 2, display: 'flex', alignItems: 'center', borderBottom: `3px solid ${colors.amarillo}` }}>
                <IconButton onClick={() => navigate('/home')} sx={{ color: colors.blanco }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography sx={{ ml: 1, fontSize: 28, fontWeight: 300 }}>Planilla mensual de pago</Typography>
            </Box>

            <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: '1700px', mx: 'auto' }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Card sx={{ border: `1px solid ${colors.celeste}`, borderRadius: '12px', mb: 2 }}>
                    <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                        <TextField
                            label="Mes"
                            type="month"
                            size="small"
                            value={mes}
                            onChange={(e) => setMes(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ max: maxMesVisible }}
                        />
                        <Typography sx={{ fontWeight: 700, color: colors.azul }}>
                            Nómina total: {moneda(totalNomina)}
                        </Typography>
                        <Typography sx={{ color: '#475569' }}>
                            Horas extra y ausencias se calculan por corte de nómina (del día 20 al día 20) y solo se consideran solicitudes aprobadas dentro de ese corte.
                        </Typography>
                    </CardContent>
                </Card>

                <Card sx={{ border: `1px solid ${colors.celeste}`, borderRadius: '12px' }}>
                    <CardContent>
                        <Box sx={{ overflowX: 'auto' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: colors.celesteSuave }}>
                                        <TableCell sx={{ fontWeight: 800 }}>ID empleado</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Nombre empleado</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Salario global</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Monto extras (h)</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Deducción CCSS</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Deducción incapacidades</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Vacaciones</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Otros rebajos</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Salario total</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Colilla</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filas.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={10}>No hay datos de planilla para el mes seleccionado.</TableCell>
                                        </TableRow>
                                    ) : (
                                        filas.map((f) => (
                                            <TableRow key={f.empleadoId} hover>
                                                <TableCell>{f.empleadoId}</TableCell>
                                                <TableCell>{f.nombre}</TableCell>
                                                <TableCell>{moneda(f.salarioGlobal)}</TableCell>
                                                <TableCell>{`${moneda(f.montoExtras)} (${Number(f.horasExtras || 0).toFixed(2)} h)`}</TableCell>
                                                <TableCell>{moneda(f.deduccionCcss)}</TableCell>
                                                <TableCell>{moneda(f.deduccionIncapacidades)}</TableCell>
                                                <TableCell>{moneda(f.vacaciones)}</TableCell>
                                                <TableCell>{moneda(f.otrosRebajos)}</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: colors.azul }}>{moneda(f.salarioTotal)}</TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        startIcon={<DownloadIcon />}
                                                        onClick={() => exportarColillaPdf(f)}
                                                        sx={{ backgroundColor: colors.azul }}
                                                    >
                                                        PDF
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
};

export default Planillas;