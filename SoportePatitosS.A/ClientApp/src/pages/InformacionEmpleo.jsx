import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Box,
    Typography,
    Card,
    CardContent,
    IconButton,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const InformacionEmpleo = () => {
    const colors = {
        negro: '#0B0B0B',
        azul: '#1E3A8A',
        celeste: '#00A8CC',
        fondo: '#F4F9FC',
        blanco: '#FFFFFF',
        amarillo: '#F4C542'
    };

    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [informacion, setInformacion] = useState(null);

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

                const empleadoId = await resolverEmpleadoId();
                if (!empleadoId) {
                    throw new Error('No se pudo identificar el empleado actual.');
                }

                const res = await axios.get(`/api/Empleados/InformacionEmpleo/${empleadoId}`);
                setInformacion(res.data || null);
            } catch (err) {
                setError(err?.response?.data || err.message || 'No se pudo cargar la información de empleo.');
                setInformacion(null);
            } finally {
                setCargando(false);
            }
        };

        if (user) {
            cargar();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se conserva cuándo se ejecuta el efecto (comportamiento original)
    }, [user]);

    const formatFecha = (value) => {
        if (!value) return 'Actual';
        return new Date(value).toLocaleDateString('es-CR');
    };

    const resolverRutaRegreso = () => {
        const params = new URLSearchParams(location.search);
        const origen = (params.get('origen') || '').toLowerCase();

        if (origen === 'menu-principal') return '/home';
        if (origen === 'informacion-personal') return '/informacion-personal';

        return '/informacion-personal';
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
                <IconButton onClick={() => navigate(resolverRutaRegreso())} sx={{ color: colors.blanco }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography sx={{ ml: 1, fontSize: 28, fontWeight: 300 }}>Puestos actuales</Typography>
            </Box>

            <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: '1100px', mx: 'auto' }}>
                {error ? (
                    <Card sx={{ border: '1px solid #F1C0C0', borderRadius: '12px', backgroundColor: colors.blanco }}>
                        <CardContent>
                            <Typography sx={{ color: '#B91C1C' }}>{error}</Typography>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <Card sx={{ border: `1px solid ${colors.celeste}`, borderRadius: '12px', mb: 2, backgroundColor: colors.blanco }}>
                            <CardContent>
                                <Typography sx={{ fontWeight: 700, color: colors.azul, mb: 2 }}>Detalles del puesto</Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
                                    <Campo label="Gerencia" valor={informacion?.detallesPuesto?.gerencia} />
                                    <Campo label="Gerente" valor={informacion?.detallesPuesto?.gerente} />
                                    <Campo label="Jefe inmediato" valor={informacion?.detallesPuesto?.jefeInmediato} />
                                    <Campo label="Empleado" valor={informacion?.detallesPuesto?.empleado} />
                                    <Campo label="Puesto desempeñado" valor={informacion?.detallesPuesto?.puestoDesempenado} />
                                </Box>
                            </CardContent>
                        </Card>

                        <Card sx={{ border: `1px solid ${colors.celeste}`, borderRadius: '12px', mb: 2, backgroundColor: colors.blanco }}>
                            <CardContent>
                                <Typography sx={{ fontWeight: 700, color: colors.azul, mb: 2 }}>Detalles individuales</Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                                    <Campo label="Puesto" valor={informacion?.detallesIndividuales?.puesto} />
                                    <Campo label="Horario" valor={informacion?.detallesIndividuales?.horario} />
                                    <Campo
                                        label="Salario"
                                        valor={(informacion?.detallesIndividuales?.salario ?? 0).toLocaleString('es-CR', {
                                            style: 'currency',
                                            currency: 'CRC'
                                        })}
                                    />
                                </Box>
                            </CardContent>
                        </Card>

                        <Card sx={{ border: `1px solid ${colors.celeste}`, borderRadius: '12px', backgroundColor: colors.blanco }}>
                            <CardContent>
                                <Typography sx={{ fontWeight: 700, color: colors.azul, mb: 2 }}>Historial de puestos</Typography>
                                <Box sx={{ overflowX: 'auto' }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700 }}>Gerencia</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Puesto</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Salario</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Fecha inicio</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Fecha fin</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {(informacion?.historialPuestos || []).length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} sx={{ color: '#64748B' }}>
                                                        No hay historial de puestos registrado.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                (informacion?.historialPuestos || []).map((item, idx) => (
                                                    <TableRow key={idx}>
                                                        <TableCell>{item?.gerencia || 'Sin asignar'}</TableCell>
                                                        <TableCell>{item?.puesto || 'Sin asignar'}</TableCell>
                                                        <TableCell>
                                                            {(item?.salario ?? 0).toLocaleString('es-CR', {
                                                                style: 'currency',
                                                                currency: 'CRC'
                                                            })}
                                                        </TableCell>
                                                        <TableCell>{formatFecha(item?.fechaInicio)}</TableCell>
                                                        <TableCell>{formatFecha(item?.fechaFin)}</TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </Box>
                            </CardContent>
                        </Card>
                    </>
                )}
            </Box>
        </Box>
    );
};

const Campo = ({ label, valor }) => (
    <Box sx={{ border: '1px solid #E5ECF3', borderRadius: '10px', p: 1.4, backgroundColor: '#FAFCFE' }}>
        <Typography sx={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{label}</Typography>
        <Typography sx={{ fontSize: 15, color: '#0F172A', fontWeight: 700 }}>
            {valor && `${valor}`.trim().length > 0 ? valor : 'Sin asignar'}
        </Typography>
    </Box>
);

export default InformacionEmpleo;
