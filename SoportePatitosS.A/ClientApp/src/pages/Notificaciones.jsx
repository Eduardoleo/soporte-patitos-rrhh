import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
    Box, Typography, Tabs, Tab, TextField, Button, Snackbar, Alert, Paper, IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';

const Notificaciones = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [notificaciones, setNotificaciones] = useState([]);
    const [, setCargando] = useState(true);
    const [empleadoIdActual, setEmpleadoIdActual] = useState(null);

    // Notificación en Snackbar
    const [snackOpen, setSnackOpen] = useState(false);
    const [snackMessage, setSnackMessage] = useState('');

    useEffect(() => {
        if (location.state?.showSuccessMessage) {
            setSnackMessage(location.state.showSuccessMessage);
            setSnackOpen(true);
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    useEffect(() => {
        const fetchNotificaciones = async () => {
            try {
                const usuarioId = user?.usuario_ID || user?.usuarioId || user?.Usuario_ID;
                const empId = user?.empleado_ID || user?.empleadoId || user?.Empleado_ID;

                let id = empId;
                if (!id && usuarioId) {
                    try {
                        const empRes = await axios.get(`/api/Empleados/ObtenerPorUsuarioId/${usuarioId}`);
                        id = empRes.data?.empleado_ID || empRes.data?.empleadoId || empRes.data?.Empleado_ID;
                    } catch {
                        const detalleRes = await axios.get(`/api/Empleados/DetallePersonalPorUsuario/${usuarioId}`);
                        id = detalleRes.data?.empleadoId || detalleRes.data?.empleado_ID || detalleRes.data?.EmpleadoId;
                    }
                }

                if (id) {
                    setEmpleadoIdActual(id);
                    const res = await axios.get(`/api/Empleados/Notificaciones/${id}`);
                    setNotificaciones(Array.isArray(res.data) ? res.data : []);
                }
            } catch (err) {
                console.error("Error fetching notifications", err);
            } finally {
                setCargando(false);
            }
        };

        fetchNotificaciones();
    }, [user]);

    const [tabVal, setTabVal] = useState(0); 
    const [showAll, setShowAll] = useState(false);

    const handleTabChange = (event, newValue) => {
        setTabVal(newValue);
        setShowAll(false);
    };

    const empleIdFinal = empleadoIdActual || user?.empleado_ID || user?.empleadoId || user?.Empleado_ID;

    const getDestinoId = (n) => n?.empleado_Destino_ID ?? n?.empleadoDestinoId ?? n?.empleado_DestinoId;
    const getOrigenId = (n) => n?.empleado_Origen_ID ?? n?.empleadoOrigenId ?? n?.empleado_OrigenId;
    const getNotificacionId = (n) => n?.notificacion_ID ?? n?.notificacionId;
    const getReferenciaId = (n) => n?.referencia_ID ?? n?.referenciaId;
    const getReferenciaTipo = (n) => n?.referencia_Tipo ?? n?.referenciaTipo;
    const getTipoNotificacion = (n) => `${n?.tipo_Notificacion ?? n?.tipoNotificacion ?? ''}`.toUpperCase();

    const abrirDetalleNotificacion = (item) => {
        const referenciaId = getReferenciaId(item);
        const referenciaTipo = getReferenciaTipo(item);

        if (referenciaTipo === 'AUSENCIA' && referenciaId) {
            navigate(`/solicitudes-ausencia/${referenciaId}`);
        }
    };

    // Asignadas (destinadas a mí y no creadas por mí, o solo destinadas a mí)
    const asignadas = notificaciones.filter(n =>
        getDestinoId(n) === empleIdFinal
        && getOrigenId(n) !== empleIdFinal
    );

    // Creadas (origen yo)
    const creadasPorMiTodas = notificaciones.filter(n =>
        getOrigenId(n) === empleIdFinal && (
            getTipoNotificacion(n) === 'SOLICITUD' || getTipoNotificacion(n) === ''
        )
    );

    // Mock Creadas por mí (última semana) - just split for UI effect if needed, taking first part
    const creadasPorMiRecientes = creadasPorMiTodas.slice(0, 5); 

    const countAsignadas = asignadas.length;
    const countCreadas = creadasPorMiTodas.length;

    const RenderEmptyState = ({ withButton }) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 10 }}>
            {/* Ícono de estado vacío corporativo */}
            <Typography sx={{ color: '#666', fontSize: '18px', mt: 2 }}>
                No hay notificaciones para mostrar.
            </Typography>
            {withButton && creadasPorMiTodas.length > 0 && (
                <Button 
                    variant="contained" 
                    sx={{ backgroundColor: '#00A8CC', mt: 3, textTransform: 'none', borderRadius: 0, '&:hover': { backgroundColor: '#008ba8' } }}
                    onClick={() => setShowAll(true)}
                >
                    Mostrar todo
                </Button>
            )}
        </Box>
    );

    const renderListado = (items, permitirRetirar) => {
        if (!items || items.length === 0) {
            return <RenderEmptyState withButton={false} />;
        }

        return (
            <Box sx={{ p: 3 }}>
                {items.map((item, idx) => (
                    <Box key={getNotificacionId(item) || idx} sx={{ mb: 2, pb: 2, borderBottom: idx !== items.length - 1 ? '1px solid #E0E0E0' : 'none' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography sx={{ fontSize: '13px', color: '#666' }}>{item.estado}</Typography>
                            <Typography sx={{ fontSize: '13px', color: '#999' }}>{new Date(item.fecha_Creacion || item.fechaCreacion).toLocaleDateString()}</Typography>
                        </Box>
                        <Typography onClick={() => abrirDetalleNotificacion(item)} sx={{ fontSize: '14px', color: '#00A8CC', mb: 1, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                            {item.titulo}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography sx={{ fontSize: '13px', color: '#666' }}>{item.mensaje}</Typography>
                            {permitirRetirar && item.estado === 'EN CURSO' && (
                                <Button size="small" sx={{ backgroundColor: '#FFD700', color: '#000', borderRadius: 0, textTransform: 'none', '&:hover': { backgroundColor: '#E5C100' }, minWidth: '80px', px: 2 }}>
                                    Retirar
                                </Button>
                            )}
                        </Box>
                    </Box>
                ))}
            </Box>
        );
    };

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#F0F2F5', fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>

            {/* Header Fluido */}
            <Box sx={{ backgroundColor: '#0B0B0B', color: '#fff', pt: 2, pb: 4, px: { xs: 2, md: 4 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton onClick={() => navigate(-1)} sx={{ color: '#fff', mr: 1 }}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography sx={{ fontWeight: 700, fontSize: '1.4rem' }}>
                            Notificaciones
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Button 
                            variant="outlined"
                            sx={{ color: '#fff', borderColor: '#334155', textTransform: 'none', borderRadius: '8px', px: 2, '&:hover': { borderColor: '#475569', backgroundColor: 'rgba(255,255,255,0.05)' } }}
                        >
                            Lista de trabajo
                        </Button>
                    </Box>
                </Box>
            </Box>

            {/* Sub Header con tabs */}
            <Box sx={{ backgroundColor: '#FFF', borderBottom: '1px solid #E0E0E0', mt: -2, borderRadius: '8px 8px 0 0', mx: { xs: 2, md: 4 }, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <Tabs 
                    value={tabVal} 
                    onChange={handleTabChange}
                    TabIndicatorProps={{ style: { backgroundColor: '#FDB913' } }}
                    sx={{
                        px: { xs: 2, md: 3 },
                        minHeight: '48px',
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            color: '#666',
                            minHeight: '48px',
                            fontWeight: '600',
                            fontSize: '14px',
                            '&.Mui-selected': { color: '#0B0B0B' }
                        }
                    }}
                >
                    <Tab label={`Asignadas a mí (${countAsignadas})`} />
                    <Tab label={`Creadas por mí (${countCreadas})`} />
                    <Tab label="Todo" />
                </Tabs>
            </Box>

            {/* Contenido */}
            <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: '1000px', mx: 'auto' }}>
                
                {tabVal === 0 && (
                    <Paper sx={{ p: 4, minHeight: '400px', borderRadius: 0, boxShadow: 'none', border: '1px solid #E0E0E0' }}>
                        {renderListado(asignadas, false)}
                    </Paper>
                )}

                {tabVal === 1 && (
                    <Paper sx={{ p: 0, minHeight: '400px', borderRadius: 0, boxShadow: 'none', border: '1px solid #E0E0E0' }}>
                        {showAll ? (
                            <Box sx={{ p: 3 }}>
                                {/* Mostrando todos sin botón si se hizo clic */}
                                {creadasPorMiTodas.map((item, idx) => (
                                    <Box key={getNotificacionId(item)} sx={{ mb: 2, pb: 2, borderBottom: idx !== creadasPorMiTodas.length - 1 ? '1px solid #E0E0E0' : 'none' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography sx={{ fontSize: '13px', color: '#666' }}>{item.estado}</Typography>
                                            <Typography sx={{ fontSize: '13px', color: '#999' }}>{new Date(item.fecha_Creacion).toLocaleDateString()}</Typography>
                                        </Box>
                                        <Typography onClick={() => abrirDetalleNotificacion(item)} sx={{ fontSize: '14px', color: '#00A8CC', mb: 1, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                                            {item.titulo}
                                        </Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography sx={{ fontSize: '13px', color: '#666' }}>{item.mensaje}</Typography>
                                            {item.estado === 'EN CURSO' && (
                                                <Button size="small" sx={{ backgroundColor: '#FFD700', color: '#000', borderRadius: 0, textTransform: 'none', '&:hover': { backgroundColor: '#E5C100' }, minWidth: '80px', px: 2 }}>
                                                    Retirar
                                                </Button>
                                            )}
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        ) : (
                            <Box sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #CCC', p: '4px 8px', width: '300px', mb: 3 }}>
                                    <SearchIcon sx={{ color: '#999', fontSize: '20px', mr: 1 }} />
                                    <TextField 
                                        variant="standard" 
                                        placeholder="Buscar"
                                        InputProps={{ disableUnderline: true }}
                                        fullWidth
                                    />
                                </Box>
                                {creadasPorMiRecientes.map((item, idx) => (
                                    <Box key={getNotificacionId(item)} sx={{ mb: 2, pb: 2, borderBottom: idx !== creadasPorMiRecientes.length - 1 ? '1px solid #E0E0E0' : 'none' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography sx={{ fontSize: '13px', color: '#666' }}>{item.estado}</Typography>
                                            <Typography sx={{ fontSize: '13px', color: '#999' }}>{new Date(item.fecha_Creacion).toLocaleDateString()}</Typography>
                                        </Box>
                                        <Typography onClick={() => abrirDetalleNotificacion(item)} sx={{ fontSize: '14px', color: '#00A8CC', mb: 1, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                                            {item.titulo}
                                        </Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography sx={{ fontSize: '13px', color: '#666' }}>{item.mensaje}</Typography>
                                            {item.estado === 'EN CURSO' && (
                                                <Button size="small" sx={{ backgroundColor: '#FFD700', color: '#000', borderRadius: 0, textTransform: 'none', '&:hover': { backgroundColor: '#E5C100' }, minWidth: '80px', px: 2 }}>
                                                    Retirar
                                                </Button>
                                            )}
                                        </Box>
                                    </Box>
                                ))}
                                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                                    <RenderEmptyState withButton={true} />
                                </Box>
                            </Box>
                        )}
                    </Paper>
                )}

                {tabVal === 2 && (
                    <Paper sx={{ p: 4, minHeight: '400px', borderRadius: 0, boxShadow: 'none', border: '1px solid #E0E0E0' }}>
                        {renderListado(notificaciones, false)}
                    </Paper>
                )}

            </Box>

            <Snackbar
                open={snackOpen}
                autoHideDuration={5000}
                onClose={() => setSnackOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <Alert onClose={() => setSnackOpen(false)} severity="success" sx={{ width: '100%', backgroundColor: '#4CAF50', color: '#FFF', '& .MuiAlert-icon': { color: '#FFF' } }}>
                    {snackMessage}
                </Alert>
            </Snackbar>

        </Box>
    );
};

export default Notificaciones;