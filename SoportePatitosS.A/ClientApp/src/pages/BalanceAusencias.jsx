import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Card,
    CardContent,
    CircularProgress,
    IconButton,
    TextField,
    Divider,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const BalanceAusencias = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [fechaReferencia, setFechaReferencia] = useState(new Date().toISOString().split('T')[0]);
    const [balance, setBalance] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

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

    const cargarBalance = async (fecha) => {
        try {
            setCargando(true);
            setError('');

            const empleadoId = await resolverEmpleadoId();
            if (!empleadoId) {
                throw new Error('No se pudo identificar el empleado actual.');
            }

            const res = await axios.get(`/api/Empleados/BalanceAusencias/${empleadoId}?fechaReferencia=${fecha}`);
            setBalance(res.data || null);
        } catch (err) {
            setError(err?.response?.data || err.message || 'No se pudo cargar el balance de ausencias.');
            setBalance(null);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        if (user) {
            cargarBalance(fechaReferencia);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se conserva cuándo se ejecuta el efecto (comportamiento original)
    }, [user]);

    const onFechaChange = async (e) => {
        const value = e.target.value;
        setFechaReferencia(value);
        await cargarBalance(value);
    };

    const formatFecha = (value) => {
        if (!value) return '-';
        return new Date(value).toLocaleDateString('es-CR');
    };

    if (cargando) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <IconButton onClick={() => navigate('/tiempo-ausencias')}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#F0F2F5', p: { xs: 2, md: 4 } }}>
            <Box sx={{ maxWidth: '1020px', mx: 'auto' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <IconButton onClick={() => navigate('/tiempo-ausencias')} sx={{ mr: 1 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#1A1A1A' }}>
                        Balance de ausencias
                    </Typography>
                </Box>

                <Card sx={{ border: '1px solid #E0E0E0', boxShadow: 'none', borderRadius: 0, mb: 2 }}>
                    <CardContent>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '180px 1fr auto' }, gap: 2, alignItems: 'center' }}>
                            <Box>
                                <Typography sx={{ fontSize: 12, color: '#666' }}>Plan</Typography>
                                <Typography sx={{ fontSize: 16, fontWeight: 600 }}>{balance?.planNombre || '-'}</Typography>
                            </Box>

                            <Box>
                                <Typography sx={{ fontSize: 12, color: '#666', mb: 0.5 }}>* Fecha de referencia de balance</Typography>
                                <TextField
                                    type="date"
                                    value={fechaReferencia}
                                    onChange={onFechaChange}
                                    size="small"
                                    sx={{ width: { xs: '100%', md: '230px' } }}
                                />
                            </Box>

                            <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                                <Typography sx={{ fontSize: 12, color: '#666' }}>Balance de plan</Typography>
                                <Typography sx={{ fontSize: 34, fontWeight: 700, color: '#1A1A1A' }}>
                                    {balance?.balanceTotal ?? 0} Días
                                </Typography>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>

                <Accordion defaultExpanded sx={{ borderRadius: 0, boxShadow: 'none', border: '1px solid #E0E0E0', mb: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">Resumen</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography sx={{ color: '#888', fontSize: 12, mb: 1 }}>Importes en días</Typography>
                        <Typography sx={{ fontWeight: 700, mb: 0.3 }}>Vigencia del plan</Typography>
                        <Typography sx={{ color: '#444', mb: 2 }}>{formatFecha(balance?.vigenciaInicio)} - {formatFecha(balance?.vigenciaFin)}</Typography>

                        <Divider sx={{ mb: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                            <Typography>Arrastre</Typography>
                            <Typography>{balance?.arrastre ?? 0}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                            <Typography>Ausencias aprobadas (vacaciones)</Typography>
                            <Typography>-{balance?.ausenciasAprobadas ?? 0}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                            <Typography>Ajustes (acumulado automático)</Typography>
                            <Typography>{balance?.ajustes ?? 0}</Typography>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                            <Typography sx={{ fontWeight: 700 }}>Balance total</Typography>
                            <Typography sx={{ fontSize: 30, lineHeight: 1 }}>{balance?.balanceTotal ?? 0}</Typography>
                        </Box>
                    </AccordionDetails>
                </Accordion>

                <Accordion sx={{ borderRadius: 0, boxShadow: 'none', border: '1px solid #E0E0E0', mb: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">Detalles</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '260px 1fr', rowGap: 1.2 }}>
                            <Typography color="text.secondary">Meses laborados</Typography><Typography>{balance?.mesesLaborados ?? 0}</Typography>
                            <Typography color="text.secondary">Días anuales del plan</Typography><Typography>{balance?.diasAnualesPlan ?? 0}</Typography>
                            <Typography color="text.secondary">¿Puede solicitar vacaciones?</Typography><Typography>{balance?.puedeSolicitarVacaciones ? 'Sí' : 'No'}</Typography>
                        </Box>
                    </AccordionDetails>
                </Accordion>

                <Accordion sx={{ borderRadius: 0, boxShadow: 'none', border: '1px solid #E0E0E0' }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">Detalles de fin de año</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography sx={{ color: '#444' }}>
                            {balance?.mensajeReglaVacaciones}
                        </Typography>
                    </AccordionDetails>
                </Accordion>
            </Box>
        </Box>
    );
};

export default BalanceAusencias;
