import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Card,
    IconButton,
    CircularProgress,
    Snackbar,
    Alert,
    Select,
    MenuItem,
    TextField,
    FormControl,
    InputAdornment,
    Chip,
    Button
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';

// Icons
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SubjectIcon from '@mui/icons-material/Subject';
import ScheduleSendIcon from '@mui/icons-material/ScheduleSend';
import GroupIcon from '@mui/icons-material/Group';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import CalculateIcon from '@mui/icons-material/Calculate';
import HistoryIcon from '@mui/icons-material/History';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

const TiempoAusencias = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [cargando, setCargando] = useState(true);
    const [, setError] = useState('');
    const [empleadoNombre, setEmpleadoNombre] = useState('');
    const [empleadoFoto, setEmpleadoFoto] = useState('');
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [showAusencias, setShowAusencias] = useState(false);

    // Estados para ausencias existentes
    const [ausencias, setAusencias] = useState([]);
    const [tiposAusencia, setTiposAusencia] = useState([]);
    const [filtroMeses, setFiltroMeses] = useState('6');
    const [busqueda, setBusqueda] = useState('');
    const [ordenar, setOrdenar] = useState('fecha');
    const [cargandoAusencias, setCargandoAusencias] = useState(false);

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
                setError('No se pudo identificar el empleado actual.');
                setCargando(false);
                return;
            }
            setCargando(true);
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

                        setEmpleadoFoto(empRes.data?.fotografia_Url || empRes.data?.fotografiaUrl || '');
                    } catch {
                        const detalleUsuarioRes = await axios.get(`/api/Empleados/DetallePersonalPorUsuario/${usuarioId}`);
                        const detalleUsuario = detalleUsuarioRes.data || {};

                        id = detalleUsuario?.empleadoId || detalleUsuario?.empleado_ID || detalleUsuario?.EmpleadoId;

                        const nombre = `${detalleUsuario?.nombre || ''} ${detalleUsuario?.apellidoPaterno || ''} ${detalleUsuario?.apellidoMaterno || ''}`;
                        if (nombre.trim()) {
                            setEmpleadoNombre(nombre.toUpperCase().trim());
                        }

                        setEmpleadoFoto(detalleUsuario?.fotografiaUrl || detalleUsuario?.fotografia_Url || '');
                    }
                }

                if (!id) throw new Error('No se pudo encontrar el empleado');

                if (!empleadoNombre || !empleadoFoto) {
                    const resDetalle = await axios.get(`/api/Empleados/DetallePersonalPorEmpleado/${id}`);
                    const det = resDetalle.data;
                    setEmpleadoNombre(`${det?.nombre || ''} ${det?.apellidoPaterno || ''} ${det?.apellidoMaterno || ''}`.toUpperCase().trim());
                    setEmpleadoFoto(det?.fotografiaUrl || '');
                }

                // Cargar ausencias y tipos
                await cargarAusenciasYTipos(id);
            } catch (err) {
                console.error("❌ ERROR EN TIEMPO AUSENCIAS:", err?.response?.status, err?.response?.data, err.message);
                setError('No se pudo cargar la información de tiempo y ausencias.');
            } finally {
                setCargando(false);
            }
        };

        cargarData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se conserva cuándo se ejecuta el efecto (comportamiento original)
    }, [user]);

    const cargarAusenciasYTipos = async (empleadoId) => {
        try {
            setCargandoAusencias(true);
            const [ausRes, tiposRes] = await Promise.all([
                axios.get(`/api/Empleados/AusenciasEmpleado/${empleadoId}`),
                axios.get('/api/Empleados/TiposAusencia')
            ]);
            setAusencias(ausRes.data || []);
            setTiposAusencia(tiposRes.data || []);
        } catch (err) {
            console.warn("Error cargando ausencias", err);
            setAusencias([]);
        } finally {
            setCargandoAusencias(false);
        }
    };

    const handleFuncionalidad = () => {
        setOpenSnackbar(true);
    };

    const getNombreTipoAusencia = (tipoId) => {
        const tipo = tiposAusencia.find(t => t.tipo_Ausencia_ID === tipoId);
        return tipo?.nombre_Ausencia || 'Ausencia desconocida';
    };

    const getColorEstado = (estado) => {
        if (estado === 'PENDIENTE') return '#ff9800';
        if (estado === 'APROBADO') return '#4caf50';
        if (estado === 'COMPLETADO') return '#2196f3';
        if (estado === 'RETIRADA') return '#f44336';
        return '#999';
    };

    const getEtiquetaEstado = (estado) => {
        if (estado === 'PENDIENTE') return 'En espera de aprobación';
        if (estado === 'APROBADO') return 'Aprobado';
        if (estado === 'COMPLETADO') return 'Completado';
        if (estado === 'RETIRADA') return 'Retirada';
        return estado;
    };

    const filtrarAusencias = () => {
        let resultado = [...ausencias];

        // Filtrar por fecha
        if (filtroMeses !== 'todo') {
            const meses = parseInt(filtroMeses);
            const fechaLimite = new Date();
            fechaLimite.setMonth(fechaLimite.getMonth() - meses);
            resultado = resultado.filter(a => new Date(a.fecha_Solicitud) >= fechaLimite);
        }

        // Filtrar por búsqueda (tipo o estado)
        if (busqueda) {
            const busquedaLower = busqueda.toLowerCase();
            resultado = resultado.filter(a => {
                const tipo = getNombreTipoAusencia(a.tipo_Ausencia_ID).toLowerCase();
                const estado = getEtiquetaEstado(a.estado_Solicitud).toLowerCase();
                return tipo.includes(busquedaLower) || estado.includes(busquedaLower);
            });
        }

        // Ordenar
        if (ordenar === 'fecha') {
            resultado.sort((a, b) => new Date(b.fecha_Solicitud) - new Date(a.fecha_Solicitud));
        }

        return resultado;
    };

    const calcularDias = (inicio, fin) => {
        const d1 = new Date(inicio);
        const d2 = new Date(fin);
        const diferencia = Math.abs(d2 - d1);
        const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24)) + 1;
        return dias;
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return '';
        const d = new Date(fecha);
        return d.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
    };

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
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    const cardsDatos = [
        {
            titulo: 'Ficha de horas actual',
            descripcion: 'Abra su ficha de horas actual',
            icon: <AccessTimeIcon sx={{ fontSize: '36px', color: '#ffb020' }} />
        },
        {
            titulo: 'Fichas de horas existentes',
            descripcion: 'Acceda a todas sus fichas de horas',
            icon: <SubjectIcon sx={{ fontSize: '36px', color: '#ffb020' }} />
        },
        {
            titulo: 'Solicitar cambios de hora',
            descripcion: 'Envíe una solicitud para cambiar el tiempo trabajado',
            icon: <ScheduleSendIcon sx={{ fontSize: '36px', color: '#ffb020' }} />
        },
        {
            titulo: 'Programa de equipo',
            descripcion: 'Vea los turnos y ausencias de su equipo',
            icon: <GroupIcon sx={{ fontSize: '36px', color: '#ffb020' }} />
        },
        {
            titulo: 'Agregar ausencia',
            descripcion: 'Permite solicitar una ausencia y enviarla para su aprobación.',
            icon: <EditCalendarIcon sx={{ fontSize: '36px', color: '#ffb020' }} />
        },
        {
            titulo: 'Balance de ausencias',
            descripcion: 'Permite revisar las ausencias disfrutadas o solicitadas y los balances del plan actual.',
            icon: <CalculateIcon sx={{ fontSize: '36px', color: '#ffb020' }} />
        },
        {
            titulo: 'Ausencias existentes',
            descripcion: 'Permite ver, cambiar o retirar las solicitudes de ausencias existentes.',
            icon: <HistoryIcon sx={{ fontSize: '36px', color: '#ffb020' }} />
        },
        {
            titulo: 'Calendario',
            descripcion: 'Vea sus turnos, ausencias y días festivos',
            icon: <CalendarMonthIcon sx={{ fontSize: '36px', color: '#ffb020' }} />
        }
    ];

    const ausenciasFiltra = filtrarAusencias();

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#F0F2F5', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>

            {/* Header Fluido */}
            <Box sx={{ backgroundColor: '#0B0B0B', color: '#fff', pt: 2, pb: 2, px: { xs: 2, md: 4 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton onClick={() => navigate('/home')} sx={{ color: '#fff', mr: 1, p: 0.5 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.4rem' }}>
                        Tiempo y ausencias
                    </Typography>
                </Box>
            </Box>

            {!showAusencias ? (
                // Mostrar grid de opciones
                <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: '1200px', mx: 'auto' }}>
                    <Box sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                        gap: 2 
                    }}>
                        {cardsDatos.map((card, idx) => (
                            <Card 
                                key={idx} 
                                onClick={
                                    card.titulo === 'Agregar ausencia' ? () => navigate('/agregar-ausencia') : 
                                    card.titulo === 'Solicitar cambios de hora' ? () => navigate('/solicitar-cambio-horario') :
                                    card.titulo === 'Programa de equipo' ? () => navigate('/programa-equipo') :
                                    card.titulo === 'Balance de ausencias' ? () => navigate('/balance-ausencias') :
                                    card.titulo === 'Calendario' ? () => navigate('/calendario') :
                                    card.titulo === 'Ausencias existentes' ? () => setShowAusencias(true) :
                                    handleFuncionalidad
                                }
                                sx={{
                                    display: 'flex', 
                                    flexDirection: 'row', 
                                    alignItems: 'center', 
                                    p: 0,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    border: '1px solid #E0E0E0',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                    '&:hover': {
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        transform: 'translateY(-2px)'
                                    }
                                }}
                            >
                                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {card.icon}
                                </Box>
                                <Box sx={{ p: 2, pl: 0, flex: 1 }}>
                                    <Typography sx={{ fontWeight: 'bold', fontSize: '15px', color: '#333', mb: 0.5 }}>
                                        {card.titulo}
                                    </Typography>
                                    <Typography sx={{ fontSize: '13px', color: '#666', lineHeight: 1.3 }}>
                                        {card.descripcion}
                                    </Typography>
                                </Box>
                            </Card>
                        ))}
                    </Box>
                </Box>
            ) : (
                // Mostrar ausencias existentes
                <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: '1200px', mx: 'auto' }}>
                    {/* Header con título y botones */}
                    <Box sx={{ 
                        mb: 4, 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        borderBottom: '2px solid #f0f0f0',
                        pb: 2
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <IconButton 
                                onClick={() => setShowAusencias(false)}
                                sx={{ color: '#000' }}
                            >
                                <ArrowBackIcon />
                            </IconButton>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>Ausencias</Typography>
                        </Box>
                        <IconButton 
                            onClick={() => navigate('/agregar-ausencia')}
                            sx={{ 
                                borderRadius: '50%',
                                border: '2px solid #d32f2f',
                                color: '#fff',
                                backgroundColor: '#d32f2f',
                                width: '44px',
                                height: '44px',
                                '&:hover': { 
                                    backgroundColor: '#b71c1c',
                                    border: '2px solid #b71c1c'
                                }
                            }}
                        >
                            <AddIcon />
                        </IconButton>
                    </Box>

                    {/* Filtros y búsqueda */}
                    <Box sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' },
                        gap: 2, 
                        mb: 3 
                    }}>
                        <FormControl fullWidth size="small">
                            <Typography sx={{ fontSize: '12px', color: '#666', mb: 0.8, fontWeight: '500' }}>Período</Typography>
                            <Select
                                value={filtroMeses}
                                onChange={(e) => setFiltroMeses(e.target.value)}
                                sx={{ 
                                    backgroundColor: '#fff',
                                    '& .MuiOutlinedInput-root': {
                                        height: '40px'
                                    }
                                }}
                            >
                                <MenuItem value="1">Último mes</MenuItem>
                                <MenuItem value="3">Últimos 3 meses</MenuItem>
                                <MenuItem value="6">Últimos 6 meses</MenuItem>
                                <MenuItem value="12">Último año</MenuItem>
                                <MenuItem value="todo">Todo</MenuItem>
                            </Select>
                        </FormControl>

                        <Box>
                            <Typography sx={{ fontSize: '12px', color: '#666', mb: 0.8, fontWeight: '500' }}>Búsqueda</Typography>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Buscar por tipo o estado"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: '#999', fontSize: '18px' }} />
                                        </InputAdornment>
                                    )
                                }}
                                sx={{ 
                                    backgroundColor: '#fff',
                                    '& .MuiOutlinedInput-root': {
                                        height: '40px'
                                    }
                                }}
                            />
                        </Box>

                        <FormControl fullWidth size="small">
                            <Typography sx={{ fontSize: '12px', color: '#666', mb: 0.8, fontWeight: '500' }}>Ordenar por</Typography>
                            <Select
                                value={ordenar}
                                onChange={(e) => setOrdenar(e.target.value)}
                                sx={{ 
                                    backgroundColor: '#fff',
                                    '& .MuiOutlinedInput-root': {
                                        height: '40px'
                                    }
                                }}
                            >
                                <MenuItem value="fecha">Fecha</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Listado de ausencias */}
                    {cargandoAusencias ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : ausenciasFiltra.length === 0 ? (
                        <Card sx={{ backgroundColor: '#f5f5f5', p: 3, textAlign: 'center' }}>
                            <Typography sx={{ color: '#999' }}>No hay ausencias registradas</Typography>
                        </Card>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {ausenciasFiltra.map((ausencia, idx) => (
                                <Box key={idx} sx={{
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr auto', md: '1fr auto auto' },
                                    gap: 2,
                                    alignItems: 'center',
                                    backgroundColor: '#fff',
                                    p: { xs: 2, md: 3 },
                                    borderRadius: '4px',
                                    borderLeft: `4px solid ${getColorEstado(ausencia.estado_Solicitud)}`,
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                }}>
                                    <Box sx={{ gridColumn: { xs: '1 / -1', md: 'auto' } }}>
                                        <Typography sx={{ fontWeight: 'bold', color: getColorEstado(ausencia.estado_Solicitud), mb: 1, fontSize: '14px' }}>
                                            {getNombreTipoAusencia(ausencia.tipo_Ausencia_ID)}: {calcularDias(ausencia.fecha_Inicio, ausencia.fecha_Fin)} Día(s)
                                        </Typography>
                                        <Typography sx={{ fontSize: '12px', color: '#666' }}>
                                            {formatearFecha(ausencia.fecha_Inicio)} - {formatearFecha(ausencia.fecha_Fin)}
                                        </Typography>
                                    </Box>
                                    <Chip 
                                        label={getEtiquetaEstado(ausencia.estado_Solicitud)}
                                        sx={{
                                            backgroundColor: getColorEstado(ausencia.estado_Solicitud),
                                            color: '#fff',
                                            fontWeight: 'bold',
                                            fontSize: '11px',
                                            height: '28px'
                                        }}
                                    />
                                    {ausencia.estado_Solicitud === 'PENDIENTE' && (
                                        <IconButton 
                                            size="small" 
                                            sx={{ color: '#00A8CC' }}
                                            onClick={() => navigate('/agregar-ausencia')}
                                            title="Editar ausencia"
                                        >
                                            <EditIcon sx={{ fontSize: '18px' }} />
                                        </IconButton>
                                    )}
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box>
            )}

            <Snackbar open={openSnackbar} autoHideDuration={4000} onClose={() => setOpenSnackbar(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setOpenSnackbar(false)} severity="info" sx={{ width: '100%', fontSize: '15px', fontWeight: '600' }}>
                    ¡Funcionalidad en construcción! Pronto estará disponible.
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default TiempoAusencias;
