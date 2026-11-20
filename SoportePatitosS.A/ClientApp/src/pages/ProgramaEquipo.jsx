import React, { useEffect, useMemo, useState } from 'react';
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
    TextField,
    Select,
    MenuItem,
    FormControl,
    Avatar
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

const ProgramaEquipo = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [programa, setPrograma] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [ordenarPor, setOrdenarPor] = useState('apellidos');
    const hoy = new Date();
    const [mesSeleccionado, setMesSeleccionado] = useState(hoy.getMonth());
    const [anioSeleccionado, setAnioSeleccionado] = useState(hoy.getFullYear());
    const [offsetSemana, setOffsetSemana] = useState(0);

    const calcularOffsetSemanaActual = (mes, anio) => {
        const hoyLocal = new Date();

        if (hoyLocal.getMonth() !== mes || hoyLocal.getFullYear() !== anio) {
            return 0;
        }

        const inicioMes = new Date(anio, mes, 1);
        const diaSemanaInicio = inicioMes.getDay();
        const primerLunes = new Date(inicioMes);

        if (diaSemanaInicio === 0) {
            primerLunes.setDate(inicioMes.getDate() + 1);
        } else if (diaSemanaInicio !== 1) {
            primerLunes.setDate(inicioMes.getDate() + (8 - diaSemanaInicio));
        }

        const diaHoy = hoyLocal.getDay();
        const lunesSemanaActual = new Date(hoyLocal);
        if (diaHoy === 0) {
            lunesSemanaActual.setDate(hoyLocal.getDate() + 1);
        } else {
            lunesSemanaActual.setDate(hoyLocal.getDate() - (diaHoy - 1));
        }

        const diffDias = Math.floor((lunesSemanaActual - primerLunes) / (1000 * 60 * 60 * 24));
        const offset = Math.floor(diffDias / 7);
        return offset < 0 ? 0 : offset;
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

    useEffect(() => {
        const cargarPrograma = async () => {
            try {
                setCargando(true);
                setError('');

                const empleadoId = await resolverEmpleadoId();
                if (!empleadoId) {
                    throw new Error('No se pudo identificar el empleado actual.');
                }

                const res = await axios.get(`/api/Empleados/ProgramaEquipo/${empleadoId}`);
                setPrograma(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                setError(err?.response?.data || err.message || 'No se pudo cargar el programa de equipo.');
                setPrograma([]);
            } finally {
                setCargando(false);
            }
        };

        if (user) {
            cargarPrograma();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se conserva cuándo se ejecuta el efecto (comportamiento original)
    }, [user]);

    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const aniosDisponibles = useMemo(() => {
        const base = new Date().getFullYear();
        return [base - 1, base, base + 1, base + 2];
    }, []);

    useEffect(() => {
        setOffsetSemana(calcularOffsetSemanaActual(mesSeleccionado, anioSeleccionado));
    }, [mesSeleccionado, anioSeleccionado]);

    const diasSemana = useMemo(() => {
        const inicioMes = new Date(anioSeleccionado, mesSeleccionado, 1);
        const diaSemana = inicioMes.getDay();

        const lunes = new Date(inicioMes);
        if (diaSemana === 0) {
            lunes.setDate(inicioMes.getDate() + 1);
        } else if (diaSemana !== 1) {
            lunes.setDate(inicioMes.getDate() + (8 - diaSemana));
        }

        lunes.setDate(lunes.getDate() + (offsetSemana * 7));

        const nombres = ['lun', 'mar', 'mié', 'jue', 'vie'];
        return nombres.map((n, idx) => {
            const fecha = new Date(lunes);
            fecha.setDate(lunes.getDate() + idx);
            return `${n} ${fecha.getDate()}`;
        });
    }, [mesSeleccionado, anioSeleccionado, offsetSemana]);

    const programaFiltrado = useMemo(() => {
        let lista = [...programa];

        if (busqueda.trim()) {
            const q = busqueda.toLowerCase();
            lista = lista.filter((e) =>
                (e.nombreCompleto || '').toLowerCase().includes(q) ||
                (e.puesto || '').toLowerCase().includes(q) ||
                (e.area || '').toLowerCase().includes(q)
            );
        }

        if (ordenarPor === 'apellidos') {
            lista.sort((a, b) => (a.nombreCompleto || '').localeCompare(b.nombreCompleto || ''));
        } else if (ordenarPor === 'horario') {
            lista.sort((a, b) => (a.horaEntrada || '').localeCompare(b.horaEntrada || ''));
        }

        return lista;
    }, [programa, busqueda, ordenarPor]);

    const iniciales = (nombre) => {
        if (!nombre) return 'NA';
        const partes = nombre.split(' ').filter(Boolean);
        return `${partes[0]?.[0] || ''}${partes[1]?.[0] || ''}`.toUpperCase();
    };

    if (cargando) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#F0F2F5', p: { xs: 2, md: 4 } }}>
            <Box sx={{ maxWidth: '1300px', mx: 'auto' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <IconButton onClick={() => navigate('/tiempo-ausencias')} sx={{ mr: 1 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        Programa de equipo
                    </Typography>
                </Box>

                {error && (
                    <Typography color="error" sx={{ mb: 2 }}>
                        {error}
                    </Typography>
                )}

                <Card sx={{ borderRadius: 0, border: '1px solid #E0E0E0', boxShadow: 'none' }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                                <TextField
                                    size="small"
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    placeholder="Buscar por nombre o área"
                                    InputProps={{
                                        startAdornment: <SearchIcon sx={{ color: '#777', mr: 1 }} />
                                    }}
                                    sx={{ minWidth: '280px', backgroundColor: '#fff' }}
                                />

                                <FormControl size="small" sx={{ minWidth: 170 }}>
                                    <Select value={mesSeleccionado} onChange={(e) => setMesSeleccionado(e.target.value)}>
                                        {meses.map((m, idx) => (
                                            <MenuItem key={m} value={idx}>{m}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <Select value={anioSeleccionado} onChange={(e) => setAnioSeleccionado(e.target.value)}>
                                        {aniosDisponibles.map((a) => (
                                            <MenuItem key={a} value={a}>{a}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, border: '1px solid #D0D7DE', borderRadius: '4px', px: 0.5 }}>
                                    <IconButton size="small" onClick={() => setOffsetSemana((prev) => prev - 1)}>
                                        <NavigateBeforeIcon />
                                    </IconButton>
                                    <Typography sx={{ fontSize: 13, minWidth: 90, textAlign: 'center' }}>
                                        Semana {offsetSemana + 1}
                                    </Typography>
                                    <IconButton size="small" onClick={() => setOffsetSemana((prev) => prev + 1)}>
                                        <NavigateNextIcon />
                                    </IconButton>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography sx={{ fontSize: 14 }}>Ordenar por</Typography>
                                <FormControl size="small" sx={{ minWidth: 190 }}>
                                    <Select value={ordenarPor} onChange={(e) => setOrdenarPor(e.target.value)}>
                                        <MenuItem value="apellidos">Apellidos, A-Z</MenuItem>
                                        <MenuItem value="horario">Horario entrada</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </Box>

                        <Box sx={{ borderTop: '1px solid #E0E0E0', borderBottom: '1px solid #E0E0E0', py: 1, display: 'grid', gridTemplateColumns: '300px repeat(5, 1fr)', gap: 1 }}>
                            <Typography sx={{ fontSize: 13, color: '#666', pl: 1 }}>Empleado</Typography>
                            {diasSemana.map((dia) => (
                                <Typography key={dia} sx={{ fontSize: 13, color: '#666', textAlign: 'center' }}>{dia}</Typography>
                            ))}
                        </Box>

                        {programaFiltrado.length === 0 ? (
                            <Box sx={{ py: 4, textAlign: 'center' }}>
                                <Typography sx={{ color: '#666' }}>No hay colaboradores para mostrar en su área.</Typography>
                            </Box>
                        ) : (
                            programaFiltrado.map((empleado) => (
                                <Box key={empleado.empleadoId} sx={{ display: 'grid', gridTemplateColumns: '300px repeat(5, 1fr)', gap: 1, borderBottom: '1px solid #EAEAEA', py: 1.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pl: 1 }}>
                                        <Avatar sx={{ width: 34, height: 34, backgroundColor: '#ECEFF1', color: '#333', fontSize: 13 }}>
                                            {iniciales(empleado.nombreCompleto)}
                                        </Avatar>
                                        <Box>
                                            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{empleado.nombreCompleto}</Typography>
                                            <Typography sx={{ fontSize: 12, color: '#555' }}>{empleado.codigoEmpleado}</Typography>
                                            <Typography sx={{ fontSize: 12, color: '#333' }}>{empleado.puesto}</Typography>
                                            <Typography sx={{ fontSize: 12, color: '#666' }}>{empleado.area} · {empleado.horasSemanales}h/sem</Typography>
                                        </Box>
                                    </Box>

                                    {diasSemana.map((dia) => (
                                        <Box key={`${empleado.empleadoId}-${dia}`} sx={{ backgroundColor: '#82C9E8', color: '#033B4A', px: 1, py: 1, borderRadius: '2px', minHeight: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>
                                            {empleado.horaEntrada} - {empleado.horaSalida}
                                        </Box>
                                    ))}
                                </Box>
                            ))
                        )}
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
};

export default ProgramaEquipo;
