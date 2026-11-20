import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
    Box,
    Typography,
    Card,
    CardContent,
    IconButton,
    Snackbar,
    Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import GroupIcon from '@mui/icons-material/Group';
import DescriptionIcon from '@mui/icons-material/Description';
import WorkIcon from '@mui/icons-material/Work';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';

const InformacionPersonalHub = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [, setEmpleadoNombre] = useState('USUARIO');
    const [, setEmpleadoFoto] = useState('');
    const [snackOpen, setSnackOpen] = useState(false);

    useEffect(() => {
        const cargarCabecera = async () => {
            try {
                const usuarioId = user?.usuario_ID || user?.usuarioId || user?.Usuario_ID;
                const empleadoIdSesion = user?.empleado_ID || user?.empleadoId || user?.Empleado_ID;

                let empleadoId = empleadoIdSesion;
                if (!empleadoId && usuarioId) {
                    try {
                        const empRes = await axios.get(`/api/Empleados/ObtenerPorUsuarioId/${usuarioId}`);
                        empleadoId = empRes.data?.empleado_ID || empRes.data?.empleadoId || empRes.data?.Empleado_ID;
                    } catch {
                        const detalleUsuarioRes = await axios.get(`/api/Empleados/DetallePersonalPorUsuario/${usuarioId}`);
                        empleadoId = detalleUsuarioRes.data?.empleadoId || detalleUsuarioRes.data?.empleado_ID || detalleUsuarioRes.data?.EmpleadoId;
                    }
                }

                if (empleadoId) {
                    const detalleRes = await axios.get(`/api/Empleados/DetallePersonalPorEmpleado/${empleadoId}`);
                    const det = detalleRes.data || {};
                    const nombre = `${det?.nombre || ''} ${det?.apellidoPaterno || ''} ${det?.apellidoMaterno || ''}`.toUpperCase().trim();
                    if (nombre) setEmpleadoNombre(nombre);
                    setEmpleadoFoto(det?.fotografiaUrl || '');
                }
            } catch {
                const nombreSesion = user?.nombre_Usuario || user?.nombreUsuario || user?.Nombre_Usuario || 'USUARIO';
                setEmpleadoNombre(nombreSesion.toUpperCase());
            }
        };

        if (user) {
            cargarCabecera();
        }
    }, [user]);

    const tarjetas = [
        {
            titulo: 'Detalles personales',
            descripcion: 'Detalles sobre usted, como nombre y fecha de nacimiento.',
            icon: <PersonIcon sx={{ color: '#00A8CC' }} />,
            onClick: () => navigate('/detalles-personales')
        },
        {
            titulo: 'Información de identificación',
            descripcion: 'Consulte y edite la información de identificación nacional.',
            icon: <BadgeIcon sx={{ color: '#00A8CC' }} />,
            onClick: () => navigate('/informacion-identificacion')
        },
        {
            titulo: 'Información de contacto',
            descripcion: 'Actualice correo, teléfono y datos de localización.',
            icon: <ContactMailIcon sx={{ color: '#00A8CC' }} />,
            onClick: () => navigate('/informacion-contacto')
        },
        {
            titulo: 'Contactos de familiares y de emergencia',
            descripcion: 'Gestione contactos para notificación en emergencias.',
            icon: <GroupIcon sx={{ color: '#00A8CC' }} />,
            onClick: () => navigate('/contactos-emergencia')
        },
        {
            titulo: 'Registros de documentos',
            descripcion: 'Gestione documentos asociados al colaborador.',
            icon: <DescriptionIcon sx={{ color: '#00A8CC' }} />,
            onClick: () => navigate('/registros-documentos')
        },
        {
            titulo: 'Puestos actuales',
            descripcion: 'Revise detalles del puesto, salario e historial laboral.',
            icon: <WorkIcon sx={{ color: '#00A8CC' }} />,
            onClick: () => navigate('/informacion-empleo?origen=informacion-personal')
        },
        {
            titulo: 'Información de asignación adicional',
            descripcion: 'Más detalles de asignación y funciones adicionales.',
            icon: <AssignmentIndIcon sx={{ color: '#00A8CC' }} />,
            onClick: () => setSnackOpen(true)
        }
    ];

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#F1F4F8' }}>
            <Box sx={{ backgroundColor: '#0B0B0B', color: '#fff', py: 2, px: 2, display: 'flex', alignItems: 'center' }}>
                <IconButton onClick={() => navigate('/home')} sx={{ color: '#fff' }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography sx={{ ml: 1, fontSize: 28, fontWeight: 300 }}>Información personal</Typography>
            </Box>

            <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: '980px', mx: 'auto' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                    {tarjetas.map((item, idx) => (
                        <Card
                            key={idx}
                            onClick={item.onClick}
                            sx={{
                                cursor: 'pointer',
                                border: '1px solid #D7E3EA',
                                borderRadius: '12px',
                                minHeight: 145,
                                boxShadow: '0 6px 14px rgba(15,23,42,0.06)',
                                '&:hover': {
                                    borderColor: '#00A8CC',
                                    boxShadow: '0 10px 20px rgba(15,23,42,0.12)'
                                }
                            }}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.2 }}>
                                    {item.icon}
                                    <Typography sx={{ fontWeight: 700, color: '#1E3A8A' }}>{item.titulo}</Typography>
                                </Box>
                                <Typography sx={{ color: '#475569', fontSize: 13 }}>
                                    {item.descripcion}
                                </Typography>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            </Box>

            <Snackbar open={snackOpen} autoHideDuration={3000} onClose={() => setSnackOpen(false)}>
                <Alert severity="info" onClose={() => setSnackOpen(false)}>
                    Módulo en construcción.
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default InformacionPersonalHub;
