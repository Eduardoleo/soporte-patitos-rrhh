import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { exportarFilasExcel } from '../utils/exportarExcel';
import {
    Box,
    Typography,
    Card,
    CardContent,
    CircularProgress,
    TextField,
    Button,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    IconButton,
    Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import DownloadIcon from '@mui/icons-material/Download';
import { useAuth } from '../context/AuthContext';
import { isStandardEmployee } from '../utils/validations';

const Asistencia = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const colors = {
        negro: '#0B0B0B',
        azul: '#1E3A8A',
        celeste: '#00A8CC',
        celesteSuave: '#EAF8FC',
        amarillo: '#F4C542',
        blanco: '#FFFFFF',
        fondo: '#F4F9FC'
    };

    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [items, setItems] = useState([]);

    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [empleadoId, setEmpleadoId] = useState('');
    const [nombreEmpleado, setNombreEmpleado] = useState('');
    const [gerencia, setGerencia] = useState('');

    const normalizarTexto = (valor) => {
        if (!valor) return valor;
        return `${valor}`
            .replaceAll('Ã¡', 'á')
            .replaceAll('Ã©', 'é')
            .replaceAll('Ã­', 'í')
            .replaceAll('Ã³', 'ó')
            .replaceAll('Ãº', 'ú')
            .replaceAll('Ã', 'Á')
            .replaceAll('Ã‰', 'É')
            .replaceAll('Ã', 'Í')
            .replaceAll('Ã“', 'Ó')
            .replaceAll('Ãš', 'Ú')
            .replaceAll('Ã±', 'ñ')
            .replaceAll('Ã‘', 'Ñ');
    };

    const cargar = async () => {
        try {
            setCargando(true);
            setError('');

            const usuarioId = user?.usuario_ID || user?.usuarioId || user?.Usuario_ID;
            let empleadoSesionId = user?.empleado_ID || user?.empleadoId || user?.Empleado_ID;

            if (!empleadoSesionId && usuarioId) {
                try {
                    const empRes = await axios.get(`/api/Empleados/ObtenerPorUsuarioId/${usuarioId}`);
                    empleadoSesionId = empRes.data?.empleado_ID || empRes.data?.empleadoId || empRes.data?.Empleado_ID;
                } catch {
                    const detalleUsuarioRes = await axios.get(`/api/Empleados/DetallePersonalPorUsuario/${usuarioId}`);
                    empleadoSesionId = detalleUsuarioRes.data?.empleadoId || detalleUsuarioRes.data?.empleado_ID || detalleUsuarioRes.data?.EmpleadoId;
                }
            }

            if (!empleadoSesionId) {
                throw new Error('No se pudo identificar el empleado solicitante para cargar asistencia general.');
            }

            const query = new URLSearchParams();
            query.append('fecha', fecha);
            query.append('empleadoSolicitanteId', `${empleadoSesionId}`);
            if (`${empleadoId}`.trim()) {
                query.append('empleadoId', empleadoId.trim());
            } else if (isStandardEmployee(user) && empleadoSesionId) {
                query.append('empleadoId', `${empleadoSesionId}`);
            }
            query.append('nombreEmpleado', `${nombreEmpleado}`.trim());
            query.append('gerencia', `${gerencia}`.trim());

            const res = await axios.get(`/api/Asistencia/ReporteGestion?${query.toString()}`);

            setItems(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            setError(typeof err?.response?.data === 'string' ? err.response.data : 'No se pudo cargar la asistencia general.');
            setItems([]);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se conserva cuándo se ejecuta el efecto (comportamiento original)
    }, [user]);

    const rows = useMemo(() => {
        return (items || []).map((i) => ({
            fecha: i.fecha,
            empleadoId: i.empleadoId,
            nombre: i.nombre,
            jefeInmediato: i.jefeInmediato,
            horaEntrada: i.horaEntrada,
            minutosTarde: i.minutosTarde,
            horaSalida: i.horaSalida,
            horasExtra: Number(i.horasExtra ?? 0),
            ausenciaSolicitada: i.ausenciaSolicitada ? 'Sí' : 'No',
            tipoAusenciaPedida: normalizarTexto(i.tipoAusenciaPedida || 'N/A'),
            justificacionAusencia: normalizarTexto(i.justificacionAusencia || 'N/A'),
            puesto: normalizarTexto(i.comentarioPuesto || 'N/A'),
            gerencia: normalizarTexto(i.gerencia || 'N/A'),
            nombreNormalizado: normalizarTexto(i.nombre),
            jefeNormalizado: normalizarTexto(i.jefeInmediato)
        }));
    }, [items]);

    const exportarExcel = () => {
        const excelRows = rows.map((r) => ({
            Fecha: r.fecha ? new Date(r.fecha).toLocaleDateString('es-CR') : '',
            IdEmpleado: r.empleadoId,
            Nombre: r.nombreNormalizado,
            JefeInmediato: r.jefeNormalizado,
            Gerencia: r.gerencia,
            HoraEntrada: r.horaEntrada,
            MinutosTarde: r.minutosTarde,
            HoraSalida: r.horaSalida,
            HorasExtra: r.horasExtra,
            AusenciaSolicitada: r.ausenciaSolicitada,
            TipoAusencia: r.tipoAusenciaPedida,
            JustificacionAusencia: r.justificacionAusencia,
            Puesto: r.puesto
        }));

        exportarFilasExcel(excelRows, 'Asistencia', `asistencia_general_${fecha}.xlsx`)
            .catch(() => setError('No se pudo generar el archivo Excel.'));
    };

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
                <Typography sx={{ ml: 1, fontSize: 28, fontWeight: 300 }}>Asistencia general</Typography>
            </Box>

            <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: '1600px', mx: 'auto' }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Card sx={{ border: `1px solid ${colors.celeste}`, borderRadius: '16px', backgroundColor: colors.blanco, mb: 2, boxShadow: '0 12px 30px rgba(15,23,42,0.10)' }}>
                    <CardContent>
                        <Typography sx={{ fontWeight: 800, color: colors.azul, mb: 1.5 }}>Filtros de reporte</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr) 300px' }, gap: 1.5 }}>
                            <TextField
                                label="Fecha"
                                type="date"
                                size="small"
                                InputLabelProps={{ shrink: true }}
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                            />
                            <TextField
                                label="ID empleado"
                                size="small"
                                value={empleadoId}
                                onChange={(e) => setEmpleadoId(e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                            />
                            <TextField
                                label="Nombre empleado"
                                size="small"
                                value={nombreEmpleado}
                                onChange={(e) => setNombreEmpleado(e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                            />
                            <TextField
                                label="Gerencia"
                                size="small"
                                value={gerencia}
                                onChange={(e) => setGerencia(e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                            />
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                                <Button
                                    variant="contained"
                                    startIcon={<FilterAltIcon />}
                                    onClick={cargar}
                                    sx={{
                                        background: `linear-gradient(135deg, ${colors.azul} 0%, #2749A6 100%)`,
                                        fontWeight: 800,
                                        borderRadius: '10px',
                                        boxShadow: '0 8px 18px rgba(30,58,138,0.35)',
                                        '&:hover': { background: 'linear-gradient(135deg, #162C69 0%, #1E3A8A 100%)' }
                                    }}
                                >
                                    Filtrar
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<DownloadIcon />}
                                    onClick={exportarExcel}
                                    sx={{
                                        background: `linear-gradient(135deg, ${colors.amarillo} 0%, #E9B531 100%)`,
                                        color: '#1A1A1A',
                                        whiteSpace: 'nowrap',
                                        fontWeight: 800,
                                        borderRadius: '10px',
                                        boxShadow: '0 8px 18px rgba(233,181,49,0.35)',
                                        '&:hover': { background: 'linear-gradient(135deg, #E2A200 0%, #D39500 100%)' }
                                    }}
                                >
                                    Exportar Excel
                                </Button>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>

                <Card sx={{ border: `1px solid ${colors.celeste}`, borderRadius: '14px', backgroundColor: colors.blanco, boxShadow: '0 10px 24px rgba(15,23,42,0.08)' }}>
                    <CardContent>
                        <Typography sx={{ fontWeight: 800, color: colors.azul, mb: 1.5 }}>
                            Resultado ({rows.length} registro{rows.length === 1 ? '' : 's'})
                        </Typography>
                        <Box sx={{ overflowX: 'auto' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: colors.celesteSuave }}>
                                        <TableCell sx={{ fontWeight: 800 }}>ID Empleado</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Nombre</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Jefe inmediato</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Gerencia</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Hora entrada</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Minutos tarde</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Hora salida</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Horas extra</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Ausencia solicitada</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Tipo de ausencia</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Justificación ausencia</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Puesto</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {rows.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={12}>No hay registros para los filtros seleccionados.</TableCell>
                                        </TableRow>
                                    ) : (
                                        rows.map((r, idx) => (
                                            <TableRow key={`${r.empleadoId}-${r.fecha}`} hover sx={{ backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFCFF' }}>
                                                <TableCell>{r.empleadoId}</TableCell>
                                                <TableCell>{r.nombreNormalizado}</TableCell>
                                                <TableCell>{r.jefeNormalizado}</TableCell>
                                                <TableCell>{r.gerencia}</TableCell>
                                                <TableCell>{r.horaEntrada}</TableCell>
                                                <TableCell>{r.minutosTarde}</TableCell>
                                                <TableCell>{r.horaSalida}</TableCell>
                                                <TableCell>{r.horasExtra.toFixed(2)}</TableCell>
                                                <TableCell>{r.ausenciaSolicitada}</TableCell>
                                                <TableCell>{r.tipoAusenciaPedida}</TableCell>
                                                <TableCell>{r.justificacionAusencia}</TableCell>
                                                <TableCell>{r.puesto}</TableCell>
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

export default Asistencia;
