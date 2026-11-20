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
    Button,
    FormControl,
    Select,
    MenuItem,
    TextField,
    Snackbar,
    Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const SolicitarCambioHorario = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [empleadoId, setEmpleadoId] = useState(null);
    const [horarioActual, setHorarioActual] = useState(null);
    const [horarios, setHorarios] = useState([]);

    const [horarioSolicitadoId, setHorarioSolicitadoId] = useState('');
    const [motivo, setMotivo] = useState('');

    const [openSnackbar, setOpenSnackbar] = useState(false);

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

    const mapHorario = (h) => {
        if (!h) return null;
        return {
            horarioId: h.horario_ID ?? h.horarioId,
            nombreHorario: h.nombre_Horario ?? h.nombreHorario,
            horaEntrada: h.hora_Entrada?.substring?.(0, 5) || h.horaEntrada?.substring?.(0, 5) || '',
            horaSalida: h.hora_Salida?.substring?.(0, 5) || h.horaSalida?.substring?.(0, 5) || '',
            descripcion: h.descripcion || ''
        };
    };

    useEffect(() => {
        const cargarData = async () => {
            try {
                setCargando(true);
                setError('');

                const id = await resolverEmpleadoId();
                if (!id) {
                    throw new Error('No se pudo identificar el empleado actual.');
                }

                setEmpleadoId(id);

                const horariosRes = await axios.get('/api/Horarios/ObtenerTodos');

                const listaHorarios = Array.isArray(horariosRes.data) ? horariosRes.data : [];
                setHorarios(listaHorarios);

                try {
                    const horarioActualRes = await axios.get(`/api/Empleados/HorarioActual/${id}`);
                    const horarioActualData = horarioActualRes.data
                        ? {
                            horario_ID: horarioActualRes.data?.horarioId,
                            nombre_Horario: horarioActualRes.data?.nombreHorario,
                            hora_Entrada: horarioActualRes.data?.horaEntrada,
                            hora_Salida: horarioActualRes.data?.horaSalida,
                            descripcion: horarioActualRes.data?.descripcion
                        }
                        : null;

                    setHorarioActual(mapHorario(horarioActualData));
                } catch {
                    setHorarioActual(null);
                }
            } catch (err) {
                setError(err?.response?.data || err.message || 'No se pudo cargar la información de horarios.');
            } finally {
                setCargando(false);
            }
        };

        if (user) {
            cargarData();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se conserva cuándo se ejecuta el efecto (comportamiento original)
    }, [user]);

    const enviarSolicitud = async () => {
        try {
            if (!empleadoId || !horarioActual?.horarioId || !horarioSolicitadoId || !motivo.trim()) {
                return;
            }

            const payload = {
                empleado_ID: empleadoId,
                horario_Actual_ID: horarioActual.horarioId,
                horario_Solicitado_ID: parseInt(horarioSolicitadoId, 10),
                motivo: motivo.trim()
            };

            await axios.post('/api/Empleados/SolicitarCambioHorario', payload);

            setOpenSnackbar(true);

            setTimeout(() => {
                navigate('/notificaciones', {
                    state: {
                        showSuccessMessage: 'Solicitud de cambio de horario enviada. Pasará por jefatura y luego RRHH.'
                    }
                });
            }, 900);
        } catch (err) {
            if (err?.response?.status === 404) {
                setError('El endpoint de solicitud de cambio de horario no está disponible. Reinicie la API para aplicar los cambios recientes.');
            } else {
                setError(err?.response?.data || err.message || 'No se pudo enviar la solicitud de cambio de horario.');
            }
        }
    };

    const horariosDisponibles = horarios.filter((h) => h.horario_ID !== horarioActual?.horarioId);

    if (cargando) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#F0F2F5', p: { xs: 2, md: 4 } }}>
            <Box sx={{ maxWidth: '900px', mx: 'auto' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <IconButton onClick={() => navigate('/tiempo-ausencias')} sx={{ mr: 1 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>Solicitar cambio de horario</Typography>
                </Box>

                {error && (
                    <Typography color="error" sx={{ mb: 2 }}>
                        {error}
                    </Typography>
                )}

                <Card sx={{ border: '1px solid #E0E0E0', boxShadow: 'none', borderRadius: 0, mb: 2 }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 2 }}>Horas actual</Typography>
                        <Typography sx={{ fontWeight: 700 }}>{horarioActual?.nombreHorario || 'No disponible'}</Typography>
                        <Typography sx={{ color: '#555' }}>
                            {horarioActual ? `${horarioActual.horaEntrada} - ${horarioActual.horaSalida}` : '-'}
                        </Typography>
                        <Typography sx={{ color: '#777', fontSize: 14 }}>{horarioActual?.descripcion || ''}</Typography>
                    </CardContent>
                </Card>

                <Card sx={{ border: '1px solid #E0E0E0', boxShadow: 'none', borderRadius: 0, mb: 2 }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 2 }}>Otros horarios disponibles</Typography>
                        <FormControl fullWidth>
                            <Select
                                value={horarioSolicitadoId}
                                onChange={(e) => setHorarioSolicitadoId(e.target.value)}
                                displayEmpty
                            >
                                <MenuItem value="" disabled>Seleccionar horario</MenuItem>
                                {horariosDisponibles.map((h) => (
                                    <MenuItem key={h.horario_ID} value={h.horario_ID}>
                                        {h.nombre_Horario} ({h.hora_Entrada?.substring?.(0, 5) || ''} - {h.hora_Salida?.substring?.(0, 5) || ''})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </CardContent>
                </Card>

                <Card sx={{ border: '1px solid #E0E0E0', boxShadow: 'none', borderRadius: 0, mb: 2 }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 2 }}>Motivo o justificación del cambio</Typography>
                        <TextField
                            multiline
                            rows={4}
                            fullWidth
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            placeholder="Detalle por qué solicita el cambio de horario"
                        />
                    </CardContent>
                </Card>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                    <Button variant="outlined" onClick={() => navigate('/tiempo-ausencias')} sx={{ textTransform: 'none' }}>
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={enviarSolicitud}
                        disabled={!horarioSolicitadoId || !motivo.trim()}
                        sx={{ textTransform: 'none', backgroundColor: '#1A1A1A' }}
                    >
                        Enviar solicitud
                    </Button>
                </Box>
            </Box>

            <Snackbar open={openSnackbar} autoHideDuration={3500} onClose={() => setOpenSnackbar(false)}>
                <Alert onClose={() => setOpenSnackbar(false)} severity="success" sx={{ width: '100%' }}>
                    Solicitud enviada correctamente
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default SolicitarCambioHorario;
