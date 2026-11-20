import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { isStandardEmployee } from '../utils/validations';
import {
    Box,
    Typography,
    Card,
    CardContent,
    CircularProgress,
    IconButton,
    Divider,
    Chip,
    Button
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const DetalleSolicitudAusencia = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { solicitudId } = useParams();

    const [detalle, setDetalle] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [procesando, setProcesando] = useState(false);

    const cargarDetalle = async () => {
        const empleadoId = await resolverEmpleadoId();
        if (!empleadoId) {
            throw new Error('No se pudo identificar el empleado actual.');
        }

        const res = await axios.get(`/api/Empleados/DetalleSolicitudAusencia/${solicitudId}?empleadoId=${empleadoId}`);
        setDetalle(res.data);
        return empleadoId;
    };

    const resolverEmpleadoId = async () => {
        const usuarioId = user?.usuario_ID || user?.usuarioId || user?.Usuario_ID;
        let empleadoId = user?.empleado_ID || user?.empleadoId || user?.Empleado_ID;

        if (!empleadoId && usuarioId) {
            try {
                const empRes = await axios.get(`/api/Empleados/ObtenerPorUsuarioId/${usuarioId}`);
                empleadoId = empRes.data?.empleado_ID || empRes.data?.empleadoId || empRes.data?.Empleado_ID;
            } catch {
                const detalleRes = await axios.get(`/api/Empleados/DetallePersonalPorUsuario/${usuarioId}`);
                empleadoId = detalleRes.data?.empleadoId || detalleRes.data?.empleado_ID || detalleRes.data?.EmpleadoId;
            }
        }

        return empleadoId;
    };

    useEffect(() => {
        const cargar = async () => {
            try {
                setCargando(true);
                setError('');
                await cargarDetalle();
            } catch (err) {
                setError(err?.response?.data || err.message || 'No se pudo cargar el detalle de la solicitud.');
            } finally {
                setCargando(false);
            }
        };

        if (user && solicitudId) {
            cargar();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se conserva cuándo se ejecuta el efecto (comportamiento original)
    }, [user, solicitudId]);

    const procesarSolicitud = async (accion) => {
        try {
            const permisoFallback = detalle?.puedeAprobar;
            if (permisoFallback === false || (permisoFallback === undefined && isStandardEmployee(user))) {
                setError('No tienes permisos para aprobar o rechazar esta solicitud.');
                return;
            }

            setProcesando(true);
            setError('');
            const empleadoAprobadorId = await resolverEmpleadoId();
            if (!empleadoAprobadorId) throw new Error('No se pudo identificar el aprobador actual.');

            await axios.post(`/api/Empleados/ProcesarSolicitudAusencia/${solicitudId}`, {
                empleadoAprobadorId,
                accion,
                comentario: null
            });

            await cargarDetalle();
        } catch (err) {
            setError(err?.response?.data || err.message || 'No se pudo procesar la solicitud.');
        } finally {
            setProcesando(false);
        }
    };

    const formatDate = (value) => {
        if (!value) return 'Pendiente';
        return new Date(value).toLocaleString('es-CR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const estadoColor = (estado) => {
        if (estado === 'APROBADA') return 'success';
        if (estado === 'RECHAZADA' || estado === 'RETIRADA') return 'error';
        if (estado === 'ENVIADA') return 'info';
        return 'warning';
    };

    if (cargando) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !detalle) {
        return (
            <Box sx={{ p: 4 }}>
                <IconButton onClick={() => navigate(-1)} sx={{ mb: 2 }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography color="error">{error || 'No se encontró información de la solicitud.'}</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#F0F2F5', py: 3, px: 2 }}>
            <Box sx={{ maxWidth: '980px', mx: 'auto' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <IconButton onClick={() => navigate('/notificaciones')} sx={{ mr: 1 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: '#1A1A1A' }}>
                        Aprobación de solicitud de ausencia
                    </Typography>
                </Box>

                <Card sx={{ borderRadius: 0, border: '1px solid #E0E0E0', mb: 2 }}>
                    <CardContent>
                        <Typography sx={{ color: '#666', fontSize: 13 }}>Colaborador</Typography>
                        <Typography sx={{ fontWeight: 700, fontSize: 24, mb: 1 }}>{detalle.empleadoNombre}</Typography>
                        <Typography sx={{ color: '#444', mb: 0.5 }}>
                            {new Date(detalle.fechaInicio).toLocaleDateString('es-CR')} - {new Date(detalle.fechaFin).toLocaleDateString('es-CR')}
                        </Typography>
                        <Chip label={detalle.estadoSolicitud} color={estadoColor(detalle.estadoSolicitud)} size="small" />

                        {detalle.estadoSolicitud === 'PENDIENTE' && (
                            (detalle.puedeAprobar === true)
                            || (detalle.puedeAprobar === undefined && !isStandardEmployee(user))
                        ) && (
                            <Box sx={{ mt: 2, display: 'flex', gap: 1.5 }}>
                                <Button
                                    variant="contained"
                                    disabled={procesando}
                                    onClick={() => procesarSolicitud('APROBAR')}
                                    sx={{ backgroundColor: '#1E3A8A' }}
                                >
                                    Aprobar
                                </Button>
                                <Button
                                    variant="outlined"
                                    disabled={procesando}
                                    onClick={() => procesarSolicitud('RECHAZAR')}
                                    sx={{ borderColor: '#B91C1C', color: '#B91C1C' }}
                                >
                                    Rechazar
                                </Button>
                            </Box>
                        )}
                    </CardContent>
                </Card>

                <Card sx={{ borderRadius: 0, border: '1px solid #E0E0E0', mb: 2 }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 2 }}>Detalles de solicitud de ausencia</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '220px 1fr', rowGap: 1.2 }}>
                            <Typography color="text.secondary">Tipo de ausencia</Typography><Typography>{detalle.tipoAusencia}</Typography>
                            <Typography color="text.secondary">Motivo</Typography><Typography>{detalle.motivo || 'No indicado'}</Typography>
                            <Typography color="text.secondary">Fecha de inicio</Typography><Typography>{formatDate(detalle.fechaInicio)}</Typography>
                            <Typography color="text.secondary">Fecha de finalización</Typography><Typography>{formatDate(detalle.fechaFin)}</Typography>
                            <Typography color="text.secondary">Comentarios</Typography><Typography>{detalle.comentarios || 'Sin comentarios'}</Typography>
                        </Box>
                    </CardContent>
                </Card>

                <Card sx={{ borderRadius: 0, border: '1px solid #E0E0E0' }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 2 }}>Historial de aprobaciones</Typography>
                        {detalle.flujoAprobacion?.map((paso, index) => (
                            <Box key={`${paso.etapa}-${index}`} sx={{ mb: index === detalle.flujoAprobacion.length - 1 ? 0 : 2.5 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                    <Typography sx={{ fontWeight: 600 }}>{paso.etapa}</Typography>
                                    <Chip label={paso.estado} color={estadoColor(paso.estado)} size="small" />
                                </Box>
                                <Typography sx={{ color: '#333' }}>{paso.responsable}</Typography>
                                <Typography sx={{ color: '#666', fontSize: 13 }}>{paso.descripcion}</Typography>
                                <Typography sx={{ color: '#666', fontSize: 12 }}>{formatDate(paso.fecha)}</Typography>
                                {index < detalle.flujoAprobacion.length - 1 && <Divider sx={{ mt: 2 }} />}
                            </Box>
                        ))}
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
};

export default DetalleSolicitudAusencia;
