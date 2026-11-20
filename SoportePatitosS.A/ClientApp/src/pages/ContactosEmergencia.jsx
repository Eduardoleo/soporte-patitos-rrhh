import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Card,
    CardContent,
    IconButton,
    CircularProgress,
    Button,
    Snackbar,
    Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const ContactosEmergencia = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [contactos, setContactos] = useState([]);
    const [empleadoNombre, setEmpleadoNombre] = useState('');
    const [openSnackbar, setOpenSnackbar] = useState(false);

    const handleFuncionalidad = () => {
        setOpenSnackbar(true);
    };

    useEffect(() => {
        const cargarData = async () => {
            if (!user) {
                console.log("❌ USER ES NULL - Esperando autenticación");
                return;
            }

            console.log("✅ USER CARGADO:", user);

            const usuarioId = user?.usuario_ID || user?.usuarioId || user?.Usuario_ID;
            const empleadoIdSesion = user?.empleado_ID || user?.empleadoId || user?.Empleado_ID;

            console.log("📊 IDs extraidos - usuarioId:", usuarioId, "empleadoIdSesion:", empleadoIdSesion);

            if (!usuarioId && !empleadoIdSesion) {
                console.log("❌ AMBOS IDS SON NULL");
                return;
            }

            setCargando(true);
            setError('');

            try {
                let id = empleadoIdSesion;
                if (!id && usuarioId) {
                    try {
                        const empRes = await axios.get(`/api/Empleados/ObtenerPorUsuarioId/${usuarioId}`);
                        id = empRes.data?.empleado_ID || empRes.data?.empleadoId || empRes.data?.Empleado_ID;

                        const infoPersonal = empRes.data?.informacionPersonal || empRes.data?.InformacionPersonal;
                        const nombre = infoPersonal
                            ? `${infoPersonal?.primer_Nombre || ''} ${infoPersonal?.apellido_Paterno || ''} ${infoPersonal?.apellido_Materno || ''}`
                            : '';

                        if (nombre.trim()) {
                            setEmpleadoNombre(nombre.toUpperCase().trim());
                        }
                    } catch {
                        const detalleUsuarioRes = await axios.get(`/api/Empleados/DetallePersonalPorUsuario/${usuarioId}`);
                        const detalleUsuario = detalleUsuarioRes.data || {};
                        id = detalleUsuario?.empleadoId || detalleUsuario?.empleado_ID || detalleUsuario?.EmpleadoId;

                        const nombre = `${detalleUsuario?.nombre || ''} ${detalleUsuario?.apellidoPaterno || ''} ${detalleUsuario?.apellidoMaterno || ''}`;
                        if (nombre.trim()) {
                            setEmpleadoNombre(nombre.toUpperCase().trim());
                        }
                    }
                }

                if (!id) throw new Error('No se pudo encontrar el empleado');

                const res = await axios.get(`/api/Empleados/ContactosEmergencia/${id}`);
                setContactos(res.data || []);
                
                if(!empleadoNombre) {
                    const resDetalle = await axios.get(`/api/Empleados/DetallePersonalPorEmpleado/${id}`);
                    const det = resDetalle.data;
                    setEmpleadoNombre(`${det?.nombre || ''} ${det?.apellidoPaterno || ''} ${det?.apellidoMaterno || ''}`.toUpperCase().trim());
                }

            } catch (err) {
                console.error("❌ ERROR EN CONTACTOS EMERGENCIA:", err?.response?.status, err?.response?.data, err.message);
                setError('No se pudo cargar la información de contactos.');
            } finally {
                setCargando(false);
            }
        };

        cargarData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se conserva cuándo se ejecuta el efecto (comportamiento original)
    }, [user]);

    if (!user) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 2 }}>
                <Typography sx={{ color: '#d32f2f', fontSize: '18px', fontWeight: 'bold' }}>
                    ⚠️ Sesión no encontrada
                </Typography>
                <Typography sx={{ color: '#666', fontSize: '14px' }}>
                    Por favor inicia sesión nuevamente
                </Typography>
                <Button variant="contained" onClick={() => navigate('/login')} sx={{ mt: 2 }}>
                    Ir a Login
                </Button>
            </Box>
        );
    }

    if (cargando) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', flexDirection: 'column', gap: 2 }}>
                <CircularProgress />
                <Typography sx={{ color: '#999', fontSize: '14px' }}>Cargando contactos de emergencia...</Typography>
                <Typography sx={{ color: '#ccc', fontSize: '12px' }}>
                    (Abre DevTools → Console para ver logs de debug)
                </Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', flexDirection: 'column', gap: 2 }}>
                <Typography color="error">{error}</Typography>
                <Button variant="contained" onClick={() => window.location.reload()}>
                    Reintentar
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ padding: '30px', backgroundColor: '#F9FAFB', minHeight: '100vh', fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, ml: 2 }}>
                <IconButton onClick={() => navigate('/home')} sx={{ backgroundColor: '#F0F4F8', mr: 2, '&:hover': { backgroundColor: '#E2E8F0' } }}>
                    <ArrowBackIcon />
                </IconButton>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1A2b3c', fontSize: '22px' }}>
                        Contactos de familiares y de emergencia
                    </Typography>
                    <Typography sx={{ color: '#5F6B7A', fontSize: '14px', mt: 0.5 }}>
                        {empleadoNombre}
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ ml: 2 }}>

                {/* Mis contactos */}
                <Card sx={{ border: '1px solid #E0E0E0', boxShadow: '0 6px 20px rgba(0,0,0,0.06)', borderRadius: '14px', width: '100%', maxWidth: '920px' }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography sx={{ color: '#999', fontWeight: '600', fontSize: '13px' }}>Cargado</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography sx={{ fontWeight: '700', fontSize: '18px' }}>Mis contactos</Typography>
                            <Typography onClick={handleFuncionalidad} sx={{ color: '#00A8CC', fontWeight: '600', cursor: 'pointer' }}>Agregar Mis contactos</Typography>
                        </Box>

                        {contactos.length === 0 ? (
                            <Typography sx={{ color: '#5F6B7A', fontSize: '14px', textAlign: 'center', py: 2 }}>
                                No hay contactos de emergencia registrados.
                            </Typography>
                        ) : (
                            contactos.map((contacto, idx) => (
                                <Box key={idx} sx={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    p: 2, 
                                    mb: idx < contactos.length - 1 ? 2 : 0, 
                                    border: '1px solid #E8EEF3', 
                                    borderRadius: '10px', 
                                    backgroundColor: '#FAFCFE' 
                                }}>
                                    <Typography sx={{ fontWeight: 'bold', fontSize: '16px', color: '#333' }}>
                                        {contacto.nombreCompleto}
                                    </Typography>
                                    <Typography sx={{ color: '#666', fontSize: '14px', mb: 1 }}>
                                        {contacto.relacion}
                                    </Typography>
                                </Box>
                            ))
                        )}

                    </CardContent>
                </Card>

            </Box>
            <Snackbar open={openSnackbar} autoHideDuration={5000} onClose={() => setOpenSnackbar(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setOpenSnackbar(false)} severity="info" sx={{ width: '100%', fontSize: '15px', fontWeight: '600' }}>
                    ¡Funcionalidad en construcción! Pronto estará disponible.
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ContactosEmergencia;
