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
    Snackbar,
    Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const InformacionContacto = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [detalle, setDetalle] = useState(null);
    const [openSnackbar, setOpenSnackbar] = useState(false);

    const handleFuncionalidad = () => {
        setOpenSnackbar(true);
    };

    useEffect(() => {
        const cargarData = async () => {
            if (!user) return;

            const usuarioId = user?.usuario_ID || user?.usuarioId || user?.Usuario_ID;
            const empleadoIdSesion = user?.empleado_ID || user?.empleadoId || user?.Empleado_ID;

            if (!usuarioId && !empleadoIdSesion) return;

            setCargando(true);
            setError('');

            try {
                let id = empleadoIdSesion;
                if (!id && usuarioId) {
                    const empRes = await axios.get(`/api/Empleados/ObtenerPorUsuarioId/${usuarioId}`);
                    id = empRes.data?.empleado_ID || empRes.data?.empleadoId || empRes.data?.Empleado_ID;
                }

                if (!id) throw new Error('No se pudo encontrar el empleado');

                const res = await axios.get(`/api/Empleados/DetallePersonalPorEmpleado/${id}`);
                setDetalle(res.data || {});
            } catch (err) {
                try {
                    if (usuarioId) {
                        const fallback = await axios.get(`/api/Empleados/DetallePersonalPorUsuario/${usuarioId}`);
                        setDetalle(fallback.data || {});
                        setError('');
                        return;
                    }
                } catch {
                    // Sin respaldo disponible: se muestra el error generico de abajo.
                }
                setError('No se pudo cargar la información');
            } finally {
                setCargando(false);
            }
        };

        cargarData();
    }, [user]);

    const nombreCompleto = detalle 
        ? [detalle.apellidoPaterno, detalle.apellidoMaterno, detalle.nombre, detalle.segundoNombre]
            .filter(x => x && `${x}`.trim().length > 0).join(' ')
        : 'Cargando...';

    const nombreCompletoUpper = nombreCompleto.toUpperCase();

    const campoBoxSx = {
        border: '1px solid #E8EEF3',
        borderRadius: '10px',
        px: 1.5,
        py: 1.2,
        minHeight: '68px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: '#FAFCFE'
    };

    const renderCampo = (label, value) => (
        <Box sx={campoBoxSx}>
            <Typography sx={{ fontSize: '12px', color: '#5F6B7A', fontWeight: '600', mb: 0.3 }}>
                {label}
            </Typography>
            <Typography sx={{ fontSize: '15px', color: '#000', fontWeight: '700', lineHeight: 1.2 }}>
                {value || 'No registrado'}
            </Typography>
        </Box>
    );

    return (
        <Box sx={{ py: 2, width: { xs: '96%', md: '75%' }, maxWidth: '1100px', mx: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
                <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="h4" sx={{ fontWeight: '700', mb: 0.3 }}>
                        Información de Contacto
                    </Typography>
                    <Typography sx={{ color: '#5F6B7A', fontSize: '16px', fontWeight: '600' }}>
                        {nombreCompletoUpper !== 'CARGANDO...' ? nombreCompletoUpper : 'Cargando nombre...'}
                    </Typography>
                </Box>
                <IconButton
                    onClick={() => navigate(-1)}
                    sx={{
                        border: '1px solid #00A8CC',
                        color: '#00A8CC',
                        width: '42px', height: '42px'
                    }}
                >
                    <ArrowBackIcon />
                </IconButton>
            </Box>

            {cargando && <CircularProgress sx={{ display: 'block', margin: '20px auto', color: '#00A8CC' }} />}
            {error && <Typography sx={{ color: '#D32F2F', fontWeight: '600' }}>{error}</Typography>}

            {!cargando && !error && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                    
                    {/* Detalles de teléfono */}
                    <Card sx={{ border: '1px solid #E0E0E0', boxShadow: '0 6px 20px rgba(0,0,0,0.06)', borderRadius: '14px', width: '100%', maxWidth: '920px' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                <Typography sx={{ fontWeight: '700' }}>Detalles de teléfono</Typography>
                                <Typography onClick={handleFuncionalidad} sx={{ color: '#00A8CC', fontWeight: '600', cursor: 'pointer' }}>Agregar Detalles de teléfono</Typography>
                            </Box>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1.5 }}>
                                {renderCampo('Tipo', 'Teléfono móvil particular')}
                                {renderCampo('Número', detalle?.telefonoMovil || 'No registrado')}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#FAFCFE', border: '1px solid #E8EEF3', borderRadius: '10px', px: 1.5 }}>
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#00A8CC' }} />
                                    <Typography sx={{ fontWeight: '600', fontSize: '14px', color: '#000' }}>Principal</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Detalles de correo electrónico */}
                    <Card sx={{ border: '1px solid #E0E0E0', boxShadow: '0 6px 20px rgba(0,0,0,0.06)', borderRadius: '14px', width: '100%', maxWidth: '920px' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography sx={{ color: '#999', fontWeight: '600', fontSize: '13px' }}>Cargado</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                <Typography sx={{ fontWeight: '700' }}>Detalles de correo electrónico</Typography>
                                <Typography onClick={handleFuncionalidad} sx={{ color: '#00A8CC', fontWeight: '600', cursor: 'pointer' }}>Agregar Detalles de correo electrónico</Typography>
                            </Box>

                            {/* Correo Laboral */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(200px, 1fr))', gap: 1.5, mb: 2 }}>
                                {renderCampo('Tipo', 'Correo electrónico laboral')}
                                {renderCampo('Correo electrónico', detalle?.correoElectronico || 'No registrado')}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#FAFCFE', border: '1px solid #E8EEF3', borderRadius: '10px', px: 1.5 }}>
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#00A8CC' }} />
                                    <Typography sx={{ fontWeight: '600', fontSize: '14px', color: '#000' }}>Principal</Typography>
                                </Box>
                            </Box>

                            {/* Correo Personal */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(200px, 1fr))', gap: 1.5 }}>
                                {renderCampo('Tipo', 'Correo electrónico particular')}
                                {renderCampo('Correo electrónico', detalle?.correoElectronicoPersonal || 'No registrado')}
                                <Box sx={{ backgroundColor: '#FAFCFE', border: '1px solid #E8EEF3', borderRadius: '10px' }}></Box>
                            </Box>

                        </CardContent>
                    </Card>

                    {/* Otras cuentas de comunicación */}
                    <Card sx={{ border: '1px solid #E0E0E0', boxShadow: '0 6px 20px rgba(0,0,0,0.06)', borderRadius: '14px', width: '100%', maxWidth: '920px' }}>
                        <CardContent sx={{ pb: '16px !important' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography sx={{ color: '#999', fontWeight: '600', fontSize: '13px' }}>Cargado</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography sx={{ fontWeight: '700' }}>Otras cuentas de comunicación</Typography>
                                <Typography onClick={handleFuncionalidad} sx={{ color: '#00A8CC', fontWeight: '600', cursor: 'pointer' }}>Agregar Otras cuentas de comunicación</Typography>
                            </Box>
                            <Typography sx={{ color: '#5F6B7A', fontSize: '14px' }}>
                                Agregue métodos de comunicación que no sean un teléfono, un correo electrónico ni una dirección para usar en las comunicaciones de trabajo.
                            </Typography>
                        </CardContent>
                    </Card>

                    {/* Dirección */}
                    <Card sx={{ border: '1px solid #E0E0E0', boxShadow: '0 6px 20px rgba(0,0,0,0.06)', borderRadius: '14px', width: '100%', maxWidth: '920px' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography sx={{ color: '#999', fontWeight: '600', fontSize: '13px' }}>Cargado</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                <Typography sx={{ fontWeight: '700' }}>Dirección</Typography>
                                <Typography onClick={handleFuncionalidad} sx={{ color: '#00A8CC', fontWeight: '600', cursor: 'pointer' }}>Agregar Dirección</Typography>
                            </Box>

                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1.5 }}>
                                {renderCampo('Tipo', 'Dirección particular')}
                                <Box sx={campoBoxSx}>
                                    <Typography sx={{ fontSize: '12px', color: '#5F6B7A', fontWeight: '600', mb: 0.3 }}>
                                        Dirección
                                    </Typography>
                                    <Typography sx={{ fontSize: '15px', color: '#000', fontWeight: '700', lineHeight: 1.2 }}>
                                        {detalle?.direccionPais || 'No registrado'}
                                        <br />
                                        {detalle?.direccionProvincia || 'No registrado'}
                                        <br />
                                        {detalle?.direccionCanton || 'No registrado'}
                                        <br />
                                        {detalle?.direccionDistrito || 'No registrado'}
                                        <br />
                                        {detalle?.direccionExacta || 'No registrado'}
                                    </Typography>
                                </Box>
                                {renderCampo('Fecha de inicio', '01-nov-2023')}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#FAFCFE', border: '1px solid #E8EEF3', borderRadius: '10px', px: 1.5 }}>
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#00A8CC' }} />
                                    <Typography sx={{ fontWeight: '600', fontSize: '14px', color: '#000' }}>Principal</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>

                </Box>
            )}
            <Snackbar open={openSnackbar} autoHideDuration={5000} onClose={() => setOpenSnackbar(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setOpenSnackbar(false)} severity="info" sx={{ width: '100%', fontSize: '15px', fontWeight: '600' }}>
                    ¡Funcionalidad en construcción! Pronto estará disponible.
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default InformacionContacto;
