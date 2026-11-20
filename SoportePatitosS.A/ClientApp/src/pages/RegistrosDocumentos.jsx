import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
    Box,
    Typography,
    Card,
    CardContent,
    IconButton,
    Button,
    Stack,
    TextField,
    Select,
    MenuItem,
    FormControl,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

const RegistrosDocumentos = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [documentos, setDocumentos] = useState([]);
    const [empleadoNombre, setEmpleadoNombre] = useState('USUARIO');
    const [, setEmpleadoFoto] = useState('');

    const [busqueda, setBusqueda] = useState('');
    const [orden, setOrden] = useState('actualizacion-desc');
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [previewTitulo, setPreviewTitulo] = useState('Colilla de pago');

    const normalizarDocumento = (d) => ({
        documentoId: d?.documentoId ?? d?.DocumentoId,
        tipoDocumento: d?.tipoDocumento ?? d?.TipoDocumento ?? 'COLILLA_PAGO',
        titulo: d?.titulo ?? d?.Titulo ?? 'COLILLA DE PAGO',
        descripcion: d?.descripcion ?? d?.Descripcion ?? 'Comprobante de pago',
        fechaDocumento: d?.fechaDocumento ?? d?.FechaDocumento,
        ultimaActualizacion: d?.ultimaActualizacion ?? d?.UltimaActualizacion,
        estado: d?.estado ?? d?.Estado,
        categoria: d?.categoria ?? d?.Categoria,
        cantidadAnexos: d?.cantidadAnexos ?? d?.CantidadAnexos ?? 0,
        rutaPdf: d?.rutaPdf ?? d?.RutaPdf
    });

    const normalizarColilla = (c) => ({
        documentoId: c?.colilla_ID ?? c?.colillaId ?? c?.Colilla_ID,
        tipoDocumento: 'COLILLA_PAGO',
        titulo: 'COLILLA DE PAGO',
        descripcion: `Colilla planilla #${c?.planilla_ID ?? c?.planillaId ?? c?.Planilla_ID ?? 'N/A'}`,
        fechaDocumento: c?.fecha_Envio ?? c?.fechaEnvio ?? c?.Fecha_Envio,
        ultimaActualizacion: c?.fecha_Envio ?? c?.fechaEnvio ?? c?.Fecha_Envio,
        estado: c?.estado_Envio ?? c?.estadoEnvio ?? c?.Estado_Envio ?? 'PENDIENTE',
        categoria: 'Nómina',
        cantidadAnexos: 1,
        rutaPdf: c?.ruta_PDF ?? c?.rutaPdf ?? c?.Ruta_PDF,
        planillaId: c?.planilla_ID ?? c?.planillaId ?? c?.Planilla_ID,
        salarioPuesto: Number(c?.salario_Puesto ?? c?.salarioPuesto ?? c?.Salario_Puesto ?? 0),
        salarioNeto: Number(c?.salario_Neto ?? c?.salarioNeto ?? c?.Salario_Neto ?? 0),
        pagoCcss: Number(c?.pago_CCSS ?? c?.pagoCCSS ?? c?.Pago_CCSS ?? 0),
        deduccionesAusencias: Number(c?.deducciones_Ausencias ?? c?.deduccionesAusencias ?? c?.Deducciones_Ausencias ?? 0),
        exoneraciones: Number(c?.exoneraciones ?? c?.Exoneraciones ?? 0)
    });

    const monedaPdf = (valor) => {
        const n = Number(valor || 0);
        const formateado = n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return `¢${formateado}`;
    };

    const generarPdfColilla = (doc) => {
        const pdf = new jsPDF('p', 'pt', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 32;
        const negro = [11, 11, 11];
        const azul = [30, 58, 138];
        const celeste = [0, 168, 204];
        const amarillo = [244, 197, 66];
        const grisSuave = [243, 246, 250];
        const grisLinea = [186, 196, 208];

        const fechaDoc = doc?.fechaDocumento ? new Date(doc.fechaDocumento) : new Date();
        const year = fechaDoc.getFullYear();
        const month = fechaDoc.getMonth() + 1;
        const nombreMes = new Date(year, month - 1, 1).toLocaleString('es-CR', { month: 'long' }).toUpperCase();
        const periodoInicio = new Date(year, month - 1, 1).toLocaleDateString('es-CR');
        const periodoFin = new Date(year, month, 0).toLocaleDateString('es-CR');

        const fila = {
            empleadoId: user?.empleadoId || user?.empleado_ID || user?.Empleado_ID || 'N/A',
            nombre: empleadoNombre || user?.nombre || 'Empleado',
            cedula: 'N/A',
            area: 'N/A',
            cargoActual: 'N/A',
            cuentaBancaria: 'N/A',
            salarioGlobal: Number(doc?.salarioPuesto || 0),
            horasExtras: 0,
            montoExtras: 0,
            deduccionCcss: Number(doc?.pagoCcss || 0),
            deduccionIncapacidades: Number(doc?.deduccionesAusencias || 0),
            vacaciones: Number(doc?.exoneraciones || 0),
            otrosRebajos: 0,
            salarioTotal: Number(doc?.salarioNeto || 0)
        };

        pdf.setDrawColor(grisLinea[0], grisLinea[1], grisLinea[2]);
        pdf.setLineWidth(0.7);
        pdf.rect(margin - 10, margin - 10, pageWidth - ((margin - 10) * 2), pageHeight - ((margin - 10) * 2));
        pdf.setFillColor(grisSuave[0], grisSuave[1], grisSuave[2]);
        pdf.rect(margin - 10, margin - 10, pageWidth - ((margin - 10) * 2), 96, 'F');
        pdf.setFillColor(azul[0], azul[1], azul[2]);
        pdf.rect(margin - 10, margin - 10, pageWidth - ((margin - 10) * 2), 10, 'F');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.setTextColor(negro[0], negro[1], negro[2]);
        pdf.text('SOPORTE PATITOS, S.A.', pageWidth / 2, 42, { align: 'center' });
        pdf.setFontSize(11);
        pdf.text('COMPROBANTE DE PAGO', pageWidth / 2, 64, { align: 'center' });
        pdf.setFontSize(12.5);
        pdf.text(`NÓMINA MENSUAL DE ${nombreMes} ${year}`, pageWidth / 2, 86, { align: 'center' });
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10.5);
        pdf.text(`Del ${periodoInicio} al ${periodoFin}`, pageWidth / 2, 104, { align: 'center' });
        pdf.setDrawColor(celeste[0], celeste[1], celeste[2]);
        pdf.setLineWidth(0.9);
        pdf.line(margin, 112, pageWidth - margin, 112);

        autoTable(pdf, {
            startY: 126,
            head: [['NO EMPLEADO', 'NOMBRES Y APELLIDOS', 'SUELDO MENSUAL', 'NO SEGURO SOCIAL']],
            body: [[`${fila.empleadoId}`, fila.nombre, monedaPdf(fila.salarioGlobal), fila.cedula]],
            styles: { fontSize: 8.6, font: 'helvetica', lineColor: [55, 65, 81], lineWidth: 0.35, cellPadding: 4 },
            headStyles: { fillColor: negro, textColor: 255, fontStyle: 'bold' },
            columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: 180 }, 2: { cellWidth: 110, halign: 'right' }, 3: { cellWidth: 145 } },
            margin: { left: margin, right: margin }
        });

        autoTable(pdf, {
            startY: pdf.lastAutoTable.finalY,
            head: [['ÁREA/UBICACIÓN', 'CARGO ACTUAL', 'CUENTA BANCARIA']],
            body: [[fila.area, fila.cargoActual, fila.cuentaBancaria]],
            styles: { fontSize: 8.6, font: 'helvetica', lineColor: [55, 65, 81], lineWidth: 0.35, cellPadding: 4 },
            headStyles: { fillColor: azul, textColor: 255, fontStyle: 'bold' },
            columnStyles: { 0: { cellWidth: 170 }, 1: { cellWidth: 170 }, 2: { cellWidth: 185 } },
            margin: { left: margin, right: margin }
        });

        const yInfo = pdf.lastAutoTable.finalY + 16;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8.8);
        pdf.text('Días suspensión sin goce de salario:  0.00', margin + 8, yInfo);
        pdf.text('Días de incapacidad CCSS:  0.00', pageWidth / 2 + 18, yInfo);

        const ingresosTotal = fila.salarioGlobal + fila.montoExtras + fila.vacaciones;
        const deduccionesTotal = fila.deduccionCcss + fila.deduccionIncapacidades + fila.otrosRebajos;

        autoTable(pdf, {
            startY: yInfo + 28,
            head: [['CONCEPTO', 'TIEMPO', 'INGRESOS', 'DEDUCCIONES']],
            body: [
                ['SUELDO ORDINARIO', '30.00', monedaPdf(fila.salarioGlobal), '-'],
                ['HORAS EXTRAS', '0.00', monedaPdf(fila.montoExtras), '-'],
                ['VACACIONES', 'N/A', monedaPdf(fila.vacaciones), '-'],
                ['DEDUCCIÓN INCAPACIDADES', 'N/A', '-', monedaPdf(fila.deduccionIncapacidades)],
                ['SEGURO SOCIAL CCSS', 'N/A', '-', monedaPdf(fila.deduccionCcss)]
            ],
            foot: [
                ['TOTAL CONCEPTOS', '', monedaPdf(ingresosTotal), monedaPdf(deduccionesTotal)],
                ['', '', 'NETO A PAGAR', monedaPdf(fila.salarioTotal)]
            ],
            styles: { fontSize: 8.6, font: 'helvetica', lineColor: [55, 65, 81], lineWidth: 0.35, cellPadding: 4 },
            headStyles: { fillColor: celeste, textColor: 255, fontStyle: 'bold' },
            columnStyles: { 0: { cellWidth: 220 }, 1: { cellWidth: 70, halign: 'center' }, 2: { cellWidth: 120, halign: 'right' }, 3: { cellWidth: 120, halign: 'right' } },
            footStyles: { fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [15, 23, 42] },
            didParseCell: (data) => {
                if (data.section === 'foot' && data.row.index === 1 && (data.column.index === 2 || data.column.index === 3)) {
                    data.cell.styles.fillColor = amarillo;
                    data.cell.styles.textColor = negro;
                }
            },
            margin: { left: margin, right: margin }
        });

        const firmaY = Math.min(pageHeight - 70, pdf.lastAutoTable.finalY + 110);
        pdf.setDrawColor(0, 0, 0);
        pdf.line(margin, firmaY, margin + 160, firmaY);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.text('Firma Recibido', margin + 52, firmaY + 12);

        return pdf;
    };

    const construirUrlPdf = (rutaPdf) => {
        if (!rutaPdf) return '';
        const normalizada = `${rutaPdf}`.replaceAll('\\', '/').replace(/^\/+/, '');
        const esUrlCompleta = /^https?:\/\//i.test(normalizada);
        return esUrlCompleta ? normalizada : `${window.location.origin}/${normalizada}`;
    };

    const obtenerBlobPdf = async (rutaPdf) => {
        if (!rutaPdf) return null;

        try {
            const url = construirUrlPdf(rutaPdf);
            const response = await fetch(url, { method: 'GET', credentials: 'include' });
            if (!response.ok) return null;

            const contentType = `${response.headers.get('content-type') || ''}`.toLowerCase();
            const blob = await response.blob();
            const blobType = `${blob?.type || ''}`.toLowerCase();

            if (!contentType.includes('pdf') && !blobType.includes('pdf'))
                return null;

            return blob;
        } catch {
            return null;
        }
    };

    const previsualizar = async (doc) => {
        if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);

        if (doc?.rutaPdf) {
            const blobPdf = await obtenerBlobPdf(doc.rutaPdf);
            if (blobPdf) {
                const urlPdf = URL.createObjectURL(blobPdf);
                setPreviewUrl(urlPdf);
                setPreviewTitulo(doc?.titulo || 'Colilla de pago');
                setPreviewOpen(true);
                return;
            }
        }

        const pdf = generarPdfColilla(doc);
        const blob = pdf.output('blob');
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setPreviewTitulo(doc?.titulo || 'Colilla de pago');
        setPreviewOpen(true);
    };

    const descargar = async (doc) => {
        if (doc?.rutaPdf) {
            const blobPdf = await obtenerBlobPdf(doc.rutaPdf);
            if (blobPdf) {
                const url = URL.createObjectURL(blobPdf);
                const a = document.createElement('a');
                a.href = url;
                a.download = `colilla_${doc?.documentoId || 'empleado'}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
                return;
            }
        }

        const pdf = generarPdfColilla(doc);
        pdf.save(`colilla_${doc?.documentoId || 'empleado'}.pdf`);
    };

    const colillaYaPagada = (doc) => {
        const fechaBase = doc?.fechaDocumento || doc?.ultimaActualizacion;
        if (!fechaBase) return false;

        const fechaDoc = new Date(fechaBase);
        if (Number.isNaN(fechaDoc.getTime())) return false;

        const hoy = new Date();
        const mesDoc = new Date(fechaDoc.getFullYear(), fechaDoc.getMonth(), 1);
        const mesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

        // Regla corporativa: todo mes anterior al actual ya se considera pagado.
        if (mesDoc < mesActual) return true;

        const fechaPagoEsperada = new Date(fechaDoc.getFullYear(), fechaDoc.getMonth(), 28, 23, 59, 59, 999);
        const estado = `${doc?.estado || ''}`.toUpperCase();
        const estadoNoPagado = estado.includes('PENDIENTE') || estado.includes('ERROR');

        return hoy >= fechaPagoEsperada && !estadoNoPagado;
    };

    const resolverEmpleadoId = async () => {
        const usuarioId = user?.usuario_ID || user?.usuarioId || user?.Usuario_ID;
        let empleadoId = user?.empleado_ID || user?.empleadoId || user?.Empleado_ID;

        if (!empleadoId && usuarioId) {
            try {
                const empRes = await axios.get(`/api/Empleados/ObtenerPorUsuarioId/${usuarioId}`);
                empleadoId = empRes.data?.empleado_ID || empRes.data?.empleadoId || empRes.data?.Empleado_ID;
            } catch {
                const detalleUsuarioRes = await axios.get(`/api/Empleados/DetallePersonalPorUsuario/${usuarioId}`);
                empleadoId = detalleUsuarioRes.data?.empleadoId || detalleUsuarioRes.data?.empleado_ID || detalleUsuarioRes.data?.EmpleadoId;
            }
        }

        return empleadoId;
    };

    useEffect(() => {
        const cargar = async () => {
            try {
                setCargando(true);
                setError('');
                const empleadoId = await resolverEmpleadoId();
                if (!empleadoId) {
                    setDocumentos([]);
                    setError('No se pudo identificar el empleado en sesión.');
                    return;
                }

                const [docsRes, colillasRes] = await Promise.all([
                    axios.get(`/api/Empleados/DocumentosEmitidos/${empleadoId}`),
                    axios.get(`/api/Colillas_Pago/ObtenerPorEmpleado/${empleadoId}`)
                ]);

                const docsApi = (Array.isArray(docsRes.data) ? docsRes.data : []).map(normalizarDocumento);
                const colillasApi = (Array.isArray(colillasRes.data) ? colillasRes.data : []).map(normalizarColilla);

                const docsCombinados = [...docsApi];
                colillasApi.forEach((c) => {
                    const existente = docsCombinados.find((d) => `${d.documentoId}` === `${c.documentoId}`);
                    if (!existente) {
                        docsCombinados.push(c);
                    } else {
                        Object.assign(existente, { ...existente, ...c });
                    }
                });

                const docsPagadas = docsCombinados.filter(colillaYaPagada);
                setDocumentos(docsPagadas.length > 0 ? docsPagadas : docsCombinados);

                try {
                    const detalleRes = await axios.get(`/api/Empleados/DetallePersonalPorEmpleado/${empleadoId}`);
                    const det = detalleRes.data || {};
                    const nombre = `${det?.nombre || ''} ${det?.apellidoPaterno || ''} ${det?.apellidoMaterno || ''}`.toUpperCase().trim();
                    if (nombre) setEmpleadoNombre(nombre);
                    setEmpleadoFoto(det?.fotografiaUrl || '');
                } catch {
                    // Detalle personal no es crítico para mostrar colillas
                }
            } catch (err) {
                setDocumentos([]);
                setError(typeof err?.response?.data === 'string' ? err.response.data : 'No se pudieron cargar las colillas del empleado.');
            } finally {
                setCargando(false);
            }
        };

        if (user) {
            cargar();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se conserva cuándo se ejecuta el efecto (comportamiento original)
    }, [user]);

    const docsFiltrados = useMemo(() => {
        let lista = [...documentos];

        if (busqueda.trim()) {
            const q = busqueda.toLowerCase();
            lista = lista.filter(d =>
                (d.titulo || '').toLowerCase().includes(q) ||
                (d.descripcion || '').toLowerCase().includes(q) ||
                (d.tipoDocumento || '').toLowerCase().includes(q)
            );
        }

        if (orden === 'actualizacion-desc') {
            lista.sort((a, b) => new Date(b.ultimaActualizacion || b.fechaDocumento) - new Date(a.ultimaActualizacion || a.fechaDocumento));
        } else if (orden === 'actualizacion-asc') {
            lista.sort((a, b) => new Date(a.ultimaActualizacion || a.fechaDocumento) - new Date(b.ultimaActualizacion || b.fechaDocumento));
        }

        return lista;
    }, [documentos, busqueda, orden]);

    if (cargando) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#F1F4F8' }}>
            <Box sx={{ backgroundColor: '#0B0B0B', color: '#fff', pt: 1, pb: 3, px: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton onClick={() => navigate('/informacion-personal')} sx={{ color: '#fff' }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Box sx={{ ml: 1 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '1.2rem' }}>Registros de documentos</Typography>
                    </Box>
                </Box>

                <Box sx={{ mt: 1.8, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar por tipo, nombre o número"
                        size="small"
                        InputProps={{
                            startAdornment: <SearchIcon sx={{ color: '#94A3B8', mr: 1 }} />
                        }}
                        sx={{ minWidth: 360, backgroundColor: '#0B0B0B', '& .MuiOutlinedInput-root': { color: '#fff' } }}
                    />

                    <FormControl size="small" sx={{ minWidth: 320, backgroundColor: '#fff', borderRadius: '6px' }}>
                        <Select value={orden} onChange={(e) => setOrden(e.target.value)}>
                            <MenuItem value="actualizacion-desc">Ordenar por última actualización · De reciente a antiguo</MenuItem>
                            <MenuItem value="actualizacion-asc">Ordenar por última actualización · De antiguo a reciente</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Box>

            <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: '1100px', mx: 'auto' }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Card sx={{ border: '1px solid #D7E3EA', borderRadius: '12px', boxShadow: '0 6px 16px rgba(15,23,42,0.06)' }}>
                    <CardContent sx={{ p: 0 }}>
                        {docsFiltrados.length === 0 ? (
                            <Box sx={{ p: 3 }}>
                                <Typography sx={{ color: '#64748B' }}>
                                    No hay colillas de pago efectivamente pagadas para mostrar.
                                </Typography>
                            </Box>
                        ) : (
                            docsFiltrados.map((doc, idx) => (
                                <Box key={doc.documentoId || idx} sx={{ p: 2.2, borderBottom: idx === docsFiltrados.length - 1 ? 'none' : '1px solid #EEF2F7' }}>
                                    <Typography sx={{ fontWeight: 800, color: '#1E3A8A' }}>{doc.titulo}</Typography>
                                    <Typography sx={{ color: '#475569', fontSize: 13 }}>{doc.descripcion}</Typography>

                                    <Box sx={{ mt: 1.2, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 1 }}>
                                        <Typography sx={{ fontSize: 12, color: '#64748B' }}>
                                            Última actualización: {doc.ultimaActualizacion ? new Date(doc.ultimaActualizacion).toLocaleString('es-CR') : 'N/A'}
                                        </Typography>
                                        <Typography sx={{ fontSize: 12, color: '#64748B' }}>
                                            Recuento de anexos: {doc.cantidadAnexos || 0}
                                        </Typography>
                                        <Typography sx={{ fontSize: 12, color: '#64748B' }}>
                                            De fecha: {doc.fechaDocumento ? new Date(doc.fechaDocumento).toLocaleDateString('es-CR') : 'N/A'}
                                        </Typography>
                                    </Box>

                                    <Stack direction="row" spacing={1} sx={{ mt: 1.2 }}>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => previsualizar(doc)}
                                            sx={{ borderColor: '#1E3A8A', color: '#1E3A8A', fontWeight: 700 }}
                                        >
                                            Visualizar PDF
                                        </Button>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={() => descargar(doc)}
                                            sx={{ backgroundColor: '#1E3A8A', fontWeight: 700 }}
                                        >
                                            Descargar PDF
                                        </Button>
                                    </Stack>
                                </Box>
                            ))
                        )}
                    </CardContent>
                </Card>
            </Box>

            <Dialog
                open={previewOpen}
                onClose={() => {
                    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
                    setPreviewOpen(false);
                    setPreviewUrl('');
                }}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>{previewTitulo}</DialogTitle>
                <DialogContent dividers sx={{ p: 0 }}>
                    {previewUrl ? (
                        <iframe
                            src={previewUrl}
                            title="Vista previa colilla"
                            style={{ width: '100%', height: '78vh', border: 'none' }}
                        />
                    ) : (
                        <Box sx={{ p: 2 }}>
                            <Typography>No se pudo generar la vista previa.</Typography>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default RegistrosDocumentos;
