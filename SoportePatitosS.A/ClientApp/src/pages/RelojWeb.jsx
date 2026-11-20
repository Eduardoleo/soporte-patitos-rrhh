import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    TextField,
    CircularProgress,
    Alert,
    FormControlLabel,
    Switch,
    IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const RelojWeb = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [empleadoId, setEmpleadoId] = useState(null);
    const [estado, setEstado] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');
    const [motivo, setMotivo] = useState('');
    const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);
    const [resumenPeriodo, setResumenPeriodo] = useState([]);
    const [soloEfectivos, setSoloEfectivos] = useState(false);
    const [tieneAusenciaActiva, setTieneAusenciaActiva] = useState(false);

    const horaASegundos = (hora) => {
        if (!hora) return null;
        const [h = '0', m = '0', s = '0'] = hora.split(':');
        return (parseInt(h, 10) * 3600) + (parseInt(m, 10) * 60) + parseInt(s, 10);
    };

    const resolverEmpleadoId = async () => {
        const usuarioId = user?.usuario_ID || user?.usuarioId || user?.Usuario_ID;
        let id = user?.empleado_ID || user?.empleadoId || user?.Empleado_ID;

        if (!id && usuarioId) {
            try {
                const empRes = await axios.get(`/api/Empleados/ObtenerPorUsuarioId/${usuarioId}`);
                id = empRes.data?.empleado_ID || empRes.data?.empleadoId || empRes.data?.Empleado_ID;
            } catch {
                const detalleRes = await axios.get(`/api/Empleados/DetallePersonalPorUsuario/${usuarioId}`);
                id = detalleRes.data?.empleadoId || detalleRes.data?.empleado_ID || detalleRes.data?.EmpleadoId;
            }
        }

        return id;
    };

    const cargarEstado = async (id, fecha = fechaSeleccionada) => {
        const res = await axios.get(`/api/Asistencia/EstadoRelojWeb/${id}?fecha=${fecha}`);
        setEstado(res.data || null);
    };

    const cargarResumenPeriodo = async (id, fecha = fechaSeleccionada) => {
        const base = new Date(`${fecha}T00:00:00`);
        const desde = new Date(base.getFullYear(), base.getMonth(), 1).toISOString().split('T')[0];
        const hasta = new Date(base.getFullYear(), base.getMonth() + 1, 0).toISOString().split('T')[0];

        const res = await axios.get(`/api/Asistencia/ResumenPeriodo/${id}?desde=${desde}&hasta=${hasta}`);
        setResumenPeriodo(Array.isArray(res.data) ? res.data : []);
    };

    const cargarAusenciasActivas = async (id, fecha = fechaSeleccionada) => {
        const res = await axios.get(`/api/Empleados/AusenciasEmpleado/${id}`);
        const lista = Array.isArray(res.data) ? res.data : [];
        const fechaBase = new Date(`${fecha}T00:00:00`);

        const existe = lista.some((a) => {
            const estado = `${a?.estado_Solicitud ?? a?.estadoSolicitud ?? ''}`.toUpperCase();
            if (!(estado === 'PENDIENTE' || estado.includes('APROBAD'))) return false;

            const fi = new Date(a?.fecha_Inicio ?? a?.fechaInicio);
            const ff = new Date(a?.fecha_Fin ?? a?.fechaFin);
            if (Number.isNaN(fi.getTime()) || Number.isNaN(ff.getTime())) return false;

            fi.setHours(0, 0, 0, 0);
            ff.setHours(0, 0, 0, 0);
            return fi <= fechaBase && ff >= fechaBase;
        });

        setTieneAusenciaActiva(existe);
    };

    const obtenerHoraCostaRica = () => {
        const ahora = new Date();
        return new Intl.DateTimeFormat('en-GB', {
            timeZone: 'America/Costa_Rica',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).format(ahora);
    };

    const construirFechaHoraMarca = () => {
        return `${fechaSeleccionada}T${obtenerHoraCostaRica()}`;
    };

    useEffect(() => {
        const init = async () => {
            try {
                setCargando(true);
                const id = await resolverEmpleadoId();
                setEmpleadoId(id);
                if (id) {
                    await Promise.all([
                        cargarEstado(id),
                        cargarResumenPeriodo(id),
                        cargarAusenciasActivas(id)
                    ]);
                }
            } catch (err) {
                setError(err?.response?.data || err.message || 'No se pudo cargar el reloj web.');
            } finally {
                setCargando(false);
            }
        };

        if (user) {
            init();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se conserva cuándo se ejecuta el efecto (comportamiento original)
    }, [user]);

    useEffect(() => {
        const recargar = async () => {
            if (!empleadoId) return;
            try {
                await Promise.all([
                    cargarEstado(empleadoId, fechaSeleccionada),
                    cargarResumenPeriodo(empleadoId, fechaSeleccionada),
                    cargarAusenciasActivas(empleadoId, fechaSeleccionada)
                ]);
            } catch (err) {
                setError(err?.response?.data || err.message || 'No se pudo recargar la fecha seleccionada.');
            }
        };

        recargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se conserva cuándo se ejecuta el efecto (comportamiento original)
    }, [fechaSeleccionada, empleadoId]);

    const postMarca = async (url, body) => {
        try {
            setError('');
            setMensaje('');
            await axios.post(url, body);
            if (empleadoId) {
                await Promise.all([
                    cargarEstado(empleadoId, fechaSeleccionada),
                    cargarResumenPeriodo(empleadoId, fechaSeleccionada),
                    cargarAusenciasActivas(empleadoId, fechaSeleccionada)
                ]);
            }
            setMensaje('Marca registrada correctamente.');
        } catch (err) {
            setError(err?.response?.data || err.message || 'No se pudo registrar la marca.');
        }
    };

    const registrarEntrada = () => postMarca('/api/Asistencia/RegistrarEntrada', {
        empleado_ID: empleadoId,
        fecha_Hora_Entrada: construirFechaHoraMarca()
    });

    const registrarSalidaAlmuerzo = () => postMarca('/api/Asistencia/RegistrarSalidaAlmuerzo', {
        empleado_ID: empleadoId,
        fecha_Hora_Salida_Almuerzo: construirFechaHoraMarca()
    });

    const registrarRegresoAlmuerzo = () => postMarca('/api/Asistencia/RegistrarRegresoAlmuerzo', {
        empleado_ID: empleadoId,
        fecha_Hora_Regreso_Almuerzo: construirFechaHoraMarca()
    });

    const registrarSalida = () => postMarca('/api/Asistencia/RegistrarSalida', {
        empleado_ID: empleadoId,
        fecha_Hora_Salida: construirFechaHoraMarca()
    });

    const justificar = async (tipo) => {
        if (!motivo.trim()) {
            setError('Debe ingresar un motivo para justificar.');
            return;
        }

        try {
            await axios.post('/api/Asistencia/JustificarIncidencia', {
                empleado_ID: empleadoId,
                fecha: `${fechaSeleccionada}T00:00:00`,
                motivo: motivo.trim(),
                tipo
            });
            setMensaje('Justificación enviada para aprobación de jefatura/RRHH.');
            setMotivo('');
            await Promise.all([
                cargarEstado(empleadoId, fechaSeleccionada),
                cargarResumenPeriodo(empleadoId, fechaSeleccionada)
            ]);
        } catch (err) {
            setError(err?.response?.data || err.message || 'No se pudo enviar la justificación.');
        }
    };

    if (cargando) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    const entradaMarcadaSeg = horaASegundos(estado?.horaEntradaMarcada);
    const entradaProgramadaSeg = horaASegundos(estado?.horaEntradaProgramada ? `${estado.horaEntradaProgramada}:00` : null);
    const fueraDeRangoEntrada =
        entradaMarcadaSeg !== null &&
        entradaProgramadaSeg !== null &&
        entradaMarcadaSeg > (entradaProgramadaSeg + (20 * 60));

    const resumenFiltrado = soloEfectivos
        ? resumenPeriodo.filter(r => r.diaEfectivoLaborado)
        : resumenPeriodo;

    const totalExtrasMes = resumenFiltrado.reduce((acc, r) => acc + (Number(r.horasExtra) || 0), 0).toFixed(2);

    const fechaHoyCr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Costa_Rica',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(new Date());

    const esDiaActual = fechaSeleccionada === fechaHoyCr;
    const puedeMarcar = esDiaActual && !tieneAusenciaActiva;

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: '#F1F4F8', minHeight: '100vh' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <IconButton onClick={() => navigate('/home')} sx={{ mr: 0.5, color: '#0B0B0B' }}>
                    <ArrowBackIcon />
                </IconButton>
                <Box sx={{ width: 6, height: 34, backgroundColor: '#00A8CC', borderRadius: '6px', mr: 1.5 }} />
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#0B0B0B', letterSpacing: '.4px' }}>Reloj Web</Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {mensaje && <Alert severity="success" sx={{ mb: 2 }}>{mensaje}</Alert>}
            {!esDiaActual && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    Reloj Web solo permite marcar asistencia del día actual.
                </Alert>
            )}
            {tieneAusenciaActiva && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    Existe una ausencia activa en la fecha seleccionada. El marcado queda bloqueado.
                </Alert>
            )}
            {fueraDeRangoEntrada && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    La hora de entrada superó la tolerancia de 20 minutos después del horario programado ({estado?.horaEntradaProgramada}). Debe justificar la incidencia.
                </Alert>
            )}

            <Card sx={{ mb: 2, border: '1px solid #D7E3EA', borderRadius: '12px', boxShadow: '0 6px 16px rgba(15, 23, 42, 0.06)', backgroundColor: '#FFFFFF' }}>
                <CardContent>
                    <Typography sx={{ fontWeight: 800, mb: 1.5, color: '#0B0B0B' }}>Filtro por día trabajado</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Button variant="outlined" sx={{ borderColor: '#1E3A8A', color: '#1E3A8A', '&:hover': { borderColor: '#162C69', backgroundColor: 'rgba(30,58,138,0.06)' } }} onClick={() => setFechaSeleccionada(prev => {
                            const d = new Date(`${prev}T00:00:00`);
                            d.setDate(d.getDate() - 1);
                            return d.toISOString().split('T')[0];
                        })}>Día anterior</Button>

                        <TextField
                            type="date"
                            value={fechaSeleccionada}
                            onChange={(e) => setFechaSeleccionada(e.target.value)}
                            size="small"
                        />

                        <Button variant="outlined" sx={{ borderColor: '#1E3A8A', color: '#1E3A8A', '&:hover': { borderColor: '#162C69', backgroundColor: 'rgba(30,58,138,0.06)' } }} onClick={() => setFechaSeleccionada(prev => {
                            const d = new Date(`${prev}T00:00:00`);
                            d.setDate(d.getDate() + 1);
                            return d.toISOString().split('T')[0];
                        })}>Día siguiente</Button>

                        <FormControlLabel
                            control={<Switch checked={soloEfectivos} onChange={(e) => setSoloEfectivos(e.target.checked)} />}
                            label="Solo días efectivos laborados"
                        />
                    </Box>
                </CardContent>
            </Card>

            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
                gap: 2,
                mb: 2
            }}>
                <Card onClick={puedeMarcar ? registrarEntrada : undefined} sx={{ cursor: puedeMarcar ? 'pointer' : 'not-allowed', opacity: puedeMarcar ? 1 : 0.6, border: '1px solid #D7E3EA', borderTop: '4px solid #00A8CC', boxShadow: '0 6px 16px rgba(15,23,42,0.06)', minHeight: 156, borderRadius: '12px', backgroundColor: '#FFFFFF', color: '#0B0B0B', transition: 'all .2s ease', '&:hover': { transform: puedeMarcar ? 'translateY(-2px)' : 'none', boxShadow: puedeMarcar ? '0 12px 24px rgba(15,23,42,0.10)' : '0 6px 16px rgba(15,23,42,0.06)' } }}>
                    <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <Typography sx={{ fontWeight: 700, mb: 1, letterSpacing: '.6px', color: '#1E3A8A' }}>ENTRADA</Typography>
                        <Typography sx={{ fontSize: 30, fontWeight: 800, fontFamily: 'monospace', letterSpacing: '1px', color: '#0B0B0B' }}>{estado?.horaEntradaMarcada || '--:--:--'}</Typography>
                    </CardContent>
                </Card>

                <Card onClick={puedeMarcar ? registrarSalidaAlmuerzo : undefined} sx={{ cursor: puedeMarcar ? 'pointer' : 'not-allowed', opacity: puedeMarcar ? 1 : 0.6, border: '1px solid #D7E3EA', borderTop: '4px solid #1E3A8A', boxShadow: '0 6px 16px rgba(15,23,42,0.06)', minHeight: 156, borderRadius: '12px', backgroundColor: '#FFFFFF', color: '#0B0B0B', transition: 'all .2s ease', '&:hover': { transform: puedeMarcar ? 'translateY(-2px)' : 'none', boxShadow: puedeMarcar ? '0 12px 24px rgba(15,23,42,0.10)' : '0 6px 16px rgba(15,23,42,0.06)' } }}>
                    <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <Typography sx={{ fontWeight: 700, mb: 1, letterSpacing: '.6px', color: '#1E3A8A' }}>SALIDA A ALMUERZO</Typography>
                        <Typography sx={{ fontSize: 30, fontWeight: 800, fontFamily: 'monospace', letterSpacing: '1px', color: '#0B0B0B' }}>{estado?.horaSalidaAlmuerzo || '--:--:--'}</Typography>
                    </CardContent>
                </Card>

                <Card onClick={puedeMarcar ? registrarRegresoAlmuerzo : undefined} sx={{ cursor: puedeMarcar ? 'pointer' : 'not-allowed', opacity: puedeMarcar ? 1 : 0.6, border: '1px solid #D7E3EA', borderTop: '4px solid #00A8CC', boxShadow: '0 6px 16px rgba(15,23,42,0.06)', minHeight: 156, borderRadius: '12px', backgroundColor: '#FFFFFF', color: '#0B0B0B', transition: 'all .2s ease', '&:hover': { transform: puedeMarcar ? 'translateY(-2px)' : 'none', boxShadow: puedeMarcar ? '0 12px 24px rgba(15,23,42,0.10)' : '0 6px 16px rgba(15,23,42,0.06)' } }}>
                    <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <Typography sx={{ fontWeight: 700, mb: 1, letterSpacing: '.6px', color: '#1E3A8A' }}>ENTRADA A ALMUERZO</Typography>
                        <Typography sx={{ fontSize: 30, fontWeight: 800, fontFamily: 'monospace', letterSpacing: '1px', color: '#0B0B0B' }}>{estado?.horaRegresoAlmuerzo || '--:--:--'}</Typography>
                    </CardContent>
                </Card>

                <Card onClick={puedeMarcar ? registrarSalida : undefined} sx={{ cursor: puedeMarcar ? 'pointer' : 'not-allowed', opacity: puedeMarcar ? 1 : 0.6, border: '1px solid #F5D87A', borderTop: '4px solid #FFC107', boxShadow: '0 6px 16px rgba(15,23,42,0.06)', minHeight: 156, borderRadius: '12px', backgroundColor: '#FFFFFF', color: '#0B0B0B', transition: 'all .2s ease', '&:hover': { transform: puedeMarcar ? 'translateY(-2px)' : 'none', boxShadow: puedeMarcar ? '0 12px 24px rgba(15,23,42,0.10)' : '0 6px 16px rgba(15,23,42,0.06)' } }}>
                    <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <Typography sx={{ fontWeight: 700, mb: 1, letterSpacing: '.6px', color: '#1E3A8A' }}>SALIDA DEL TRABAJO</Typography>
                        <Typography sx={{ fontSize: 30, fontWeight: 800, fontFamily: 'monospace', letterSpacing: '1px', color: '#0B0B0B' }}>{estado?.horaSalidaMarcada || '--:--:--'}</Typography>
                    </CardContent>
                </Card>
            </Box>

            <Card sx={{ mb: 2, border: '1px solid #D7E3EA', borderRadius: '12px', boxShadow: '0 6px 16px rgba(15, 23, 42, 0.06)', backgroundColor: '#FFFFFF' }}>
                <CardContent>
                    <Typography sx={{ fontWeight: 800, mb: 2, fontSize: '1.15rem', color: '#0B0B0B' }}>Control de incidencias</Typography>

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 1.5, mb: 2 }}>
                        <Box sx={{ p: 1.5, borderRadius: '10px', backgroundColor: '#FFFFFF', border: '1px solid #D7E3EA' }}>
                            <Typography sx={{ fontSize: 12, color: '#1E3A8A' }}>Minutos de tardía</Typography>
                            <Typography sx={{ fontWeight: 800, fontSize: 22, color: '#0B0B0B' }}>{estado?.minutosTardia ?? 0}</Typography>
                        </Box>
                        <Box sx={{ p: 1.5, borderRadius: '10px', backgroundColor: '#FFFFFF', border: '1px solid #D7E3EA' }}>
                            <Typography sx={{ fontSize: 12, color: '#1E3A8A' }}>Horas extra</Typography>
                            <Typography sx={{ fontWeight: 800, fontSize: 22, color: '#0B0B0B' }}>{estado?.horasExtra ?? 0}</Typography>
                        </Box>
                        <Box sx={{ p: 1.5, borderRadius: '10px', backgroundColor: '#FFFFFF', border: '1px solid #D7E3EA' }}>
                            <Typography sx={{ fontSize: 12, color: '#1E3A8A' }}>Justificación tardanza</Typography>
                            <Typography sx={{ fontWeight: 700, color: estado?.requiereJustificacionTardia ? '#B45309' : '#1E3A8A' }}>{estado?.requiereJustificacionTardia ? 'Requerida' : 'Al día'}</Typography>
                        </Box>
                        <Box sx={{ p: 1.5, borderRadius: '10px', backgroundColor: '#FFFFFF', border: '1px solid #D7E3EA' }}>
                            <Typography sx={{ fontSize: 12, color: '#1E3A8A' }}>Justificación ausencia</Typography>
                            <Typography sx={{ fontWeight: 700, color: estado?.requiereJustificacionAusencia ? '#B45309' : '#1E3A8A' }}>{estado?.requiereJustificacionAusencia ? 'Requerida' : 'Al día'}</Typography>
                        </Box>
                    </Box>

                    <TextField
                        sx={{ mt: 2 }}
                        fullWidth
                        multiline
                        rows={3}
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        placeholder="Describa el motivo/justificación"
                    />

                    <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button onClick={() => justificar('TARDANZA')} variant="contained" sx={{ backgroundColor: '#00A8CC', '&:hover': { backgroundColor: '#008CAA' } }}>Justificar tardanza</Button>
                        <Button onClick={() => justificar('AUSENCIA')} variant="contained" sx={{ backgroundColor: '#1E3A8A', '&:hover': { backgroundColor: '#162C69' } }}>Justificar ausencia</Button>
                    </Box>
                </CardContent>
            </Card>

            <Card sx={{ mb: 2, border: '1px solid #D7E3EA', borderRadius: '12px', boxShadow: '0 6px 16px rgba(15, 23, 42, 0.06)', backgroundColor: '#FFFFFF' }}>
                <CardContent>
                    <Typography sx={{ fontWeight: 800, mb: 1.5, color: '#0B0B0B' }}>
                        Historial del mes ({resumenFiltrado.length} día(s)) · Total extras: {totalExtrasMes} h
                    </Typography>
                    <Box sx={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
                        {resumenFiltrado.length === 0 ? (
                            <Typography sx={{ p: 2, color: '#6B7280' }}>No hay marcas para el período seleccionado.</Typography>
                        ) : (
                            resumenFiltrado.map((dia, idx) => (
                                <Box key={`${dia.fecha}-${idx}`} sx={{ display: 'grid', gridTemplateColumns: '140px 140px 140px 120px 120px', gap: 1, p: 1.2, borderBottom: idx !== resumenFiltrado.length - 1 ? '1px solid #EEF2F7' : 'none' }}>
                                    <Typography sx={{ fontSize: 13 }}>{new Date(dia.fecha).toLocaleDateString('es-CR')}</Typography>
                                    <Typography sx={{ fontSize: 13 }}>Entrada: {dia.horaEntrada || '--:--:--'}</Typography>
                                    <Typography sx={{ fontSize: 13 }}>Salida: {dia.horaSalida || '--:--:--'}</Typography>
                                    <Typography sx={{ fontSize: 13 }}>Tardía: {dia.minutosTardia} min</Typography>
                                    <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Extra: {dia.horasExtra} h</Typography>
                                </Box>
                            ))
                        )}
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default RelojWeb;
