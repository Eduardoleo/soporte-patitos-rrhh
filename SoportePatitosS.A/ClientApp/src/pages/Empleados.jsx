import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Box,
    Typography,
    Card,
    CardContent,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Button,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Snackbar,
    Alert,
    TextField,
    IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const estadoInicialNuevo = {
    nombreUsuario: '',
    password: '',
    cedula: '',
    perfilId: '',
    puestoId: '',
    horarioId: '',
    correoElectronico: '',
    correoElectronicoPersonal: '',
    primerNombre: '',
    segundoNombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    fechaIngreso: '',
    fechaNacimiento: '',
    paisDemografico: 'Costa Rica',
    estadoCivil: '',
    genero: '',
    nivelEducacion: '',
    paisIdentificacion: 'Costa Rica',
    tipoIdentificadorNacional: 'Cédula',
    identificadorNacional: '',
    tipoSeguridadSocial: 'CCSS',
    identificadorSeguridadSocial: '',
    mensajeDiscapacidad: 'Sin condición reportada',
    telefonoMovil: '',
    direccionPais: 'Costa Rica',
    direccionProvincia: '',
    direccionCanton: '',
    direccionDistrito: '',
    direccionExacta: ''
};

const Empleados = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const colors = {
        negro: '#0B0B0B',
        azul: '#1E3A8A',
        celeste: '#00A8CC',
        celesteSuave: '#EAF8FC',
        amarillo: '#F4C542',
        blanco: '#FFFFFF',
        fondo: '#F4F9FC'
    };

    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [empleados, setEmpleados] = useState([]);
    const [departamentosMap, setDepartamentosMap] = useState({});
    const [perfiles, setPerfiles] = useState([]);
    const [puestos, setPuestos] = useState([]);
    const [horarios, setHorarios] = useState([]);

    const [busquedaId, setBusquedaId] = useState('');
    const [busquedaNombre, setBusquedaNombre] = useState('');
    const [busquedaFechaIngreso, setBusquedaFechaIngreso] = useState('');
    const [busquedaGerencia, setBusquedaGerencia] = useState('');

    const [dialogoOpen, setDialogoOpen] = useState(false);
    const [empleadoEditando, setEmpleadoEditando] = useState(null);
    const [estadoEditado, setEstadoEditado] = useState('ACTIVO');
    const [motivoInactivo, setMotivoInactivo] = useState('');

    const [dialogoNuevoOpen, setDialogoNuevoOpen] = useState(false);
    const [nuevoEmpleado, setNuevoEmpleado] = useState(estadoInicialNuevo);

    const [guardando, setGuardando] = useState(false);
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

    const arreglarTexto = (txt) => {
        if (!txt) return txt;
        return txt
            .replaceAll('Ã¡', 'á')
            .replaceAll('Ã©', 'é')
            .replaceAll('Ã­', 'í')
            .replaceAll('Ã³', 'ó')
            .replaceAll('Ãº', 'ú')
            .replaceAll('Ã', 'Á')
            .replaceAll('Ã‰', 'É')
            .replaceAll('Ã', 'Í')
            .replaceAll('Ã“', 'Ó')
            .replaceAll('Ãš', 'Ú')
            .replaceAll('Ã±', 'ñ')
            .replaceAll('Ã‘', 'Ñ');
    };

    const extraerError = (err, predeterminado) => {
        if (typeof err?.response?.data === 'string') return err.response.data;
        return err?.message || predeterminado;
    };

    const cargarDatos = async () => {
        try {
            setCargando(true);
            setError('');

            const [empleadosRes, departamentosRes, perfilesRes, puestosRes, horariosRes] = await Promise.all([
                axios.get(`/api/Empleados/ObtenerTodos?incluirInactivos=true&usuarioSolicitanteId=${user?.usuario_ID || user?.usuarioId || user?.Usuario_ID || 0}`),
                axios.get('/api/Departamentos/ObtenerTodos'),
                axios.get('/api/Perfiles/ObtenerTodos'),
                axios.get('/api/Puestos/ObtenerTodos'),
                axios.get('/api/Horarios/ObtenerTodos')
            ]);

            const listaEmpleados = Array.isArray(empleadosRes.data) ? empleadosRes.data : [];
            const listaDepartamentos = Array.isArray(departamentosRes.data) ? departamentosRes.data : [];

            const deptoMap = {};
            listaDepartamentos.forEach((d) => {
                const id = d.departamento_ID ?? d.departamentoId;
                const nombre = d.nombre_Departamento ?? d.nombreDepartamento;
                deptoMap[id] = arreglarTexto(nombre);
            });

            setDepartamentosMap(deptoMap);
            setEmpleados(listaEmpleados);
            setPerfiles(Array.isArray(perfilesRes.data) ? perfilesRes.data : []);
            setPuestos(Array.isArray(puestosRes.data) ? puestosRes.data : []);
            setHorarios(Array.isArray(horariosRes.data) ? horariosRes.data : []);
        } catch (err) {
            setError(extraerError(err, 'No se pudo cargar la gestión de empleados.'));
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        if (user) {
            cargarDatos();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se conserva cuándo se ejecuta el efecto (comportamiento original)
    }, [user]);

    const abrirEdicion = (empleado) => {
        const estadoCompleto = (empleado?.estado || 'ACTIVO').toUpperCase();
        const [estadoBase, motivo] = estadoCompleto.split(':');
        setEmpleadoEditando(empleado);
        setEstadoEditado(estadoBase || 'ACTIVO');
        setMotivoInactivo(motivo || '');
        setDialogoOpen(true);
    };

    const guardarEstado = async () => {
        if (!empleadoEditando) return;

        if (estadoEditado === 'INACTIVO' && !motivoInactivo) {
            setSnack({ open: true, message: 'Para inactivar debe seleccionar motivo.', severity: 'warning' });
            return;
        }

        try {
            setGuardando(true);
            await axios.put(`/api/Empleados/ActualizarEstado/${empleadoEditando.empleado_ID ?? empleadoEditando.empleadoId}`, {
                estado: estadoEditado,
                motivo_Inactivo: estadoEditado === 'INACTIVO' ? motivoInactivo : null
            });

            setSnack({ open: true, message: 'Estado actualizado correctamente.', severity: 'success' });
            setDialogoOpen(false);
            await cargarDatos();
        } catch (err) {
            setSnack({
                open: true,
                message: extraerError(err, 'No se pudo actualizar el estado.'),
                severity: 'error'
            });
        } finally {
            setGuardando(false);
        }
    };

    const onNuevoEmpleadoChange = (campo, valor) => {
        setNuevoEmpleado((prev) => ({ ...prev, [campo]: valor }));
    };

    const crearEmpleado = async () => {
        const obligatorios = [
            'nombreUsuario', 'password', 'cedula', 'perfilId', 'puestoId', 'horarioId', 'correoElectronico',
            'primerNombre', 'apellidoPaterno', 'apellidoMaterno', 'fechaIngreso', 'fechaNacimiento',
            'paisDemografico', 'estadoCivil', 'genero', 'nivelEducacion', 'paisIdentificacion',
            'tipoIdentificadorNacional', 'identificadorNacional', 'tipoSeguridadSocial',
            'identificadorSeguridadSocial', 'telefonoMovil', 'direccionPais', 'direccionProvincia',
            'direccionCanton', 'direccionDistrito', 'direccionExacta'
        ];

        const faltantes = obligatorios.filter((k) => !`${nuevoEmpleado[k] ?? ''}`.trim());
        if (faltantes.length > 0) {
            setSnack({ open: true, message: 'Debe completar toda la información obligatoria.', severity: 'warning' });
            return;
        }

        try {
            setGuardando(true);

            const usuarioRes = await axios.post('/api/Usuarios/CrearUsuario', {
                nombre_Usuario: nuevoEmpleado.nombreUsuario,
                password_Hash: nuevoEmpleado.password
            });

            const usuarioId = usuarioRes.data?.usuario_ID ?? usuarioRes.data?.usuarioId;
            if (!usuarioId) throw new Error('No se obtuvo el usuario creado.');

            const empleadoRes = await axios.post('/api/Empleados/CrearEmpleado', {
                usuario_ID: Number(nuevoEmpleado.usuarioId || usuarioId),
                perfil_ID: Number(nuevoEmpleado.perfilId),
                puesto_ID: Number(nuevoEmpleado.puestoId),
                horario_ID: Number(nuevoEmpleado.horarioId),
                cedula: nuevoEmpleado.cedula,
                correo_Electronico: nuevoEmpleado.correoElectronico
            });

            const empleadoId = empleadoRes.data?.empleado_ID ?? empleadoRes.data?.empleadoId;
            if (!empleadoId) throw new Error('No se obtuvo el empleado creado.');

            await axios.put(`/api/Empleados/ActualizarDetallePersonal/${empleadoId}`, {
                apellido_Paterno: nuevoEmpleado.apellidoPaterno,
                apellido_Materno: nuevoEmpleado.apellidoMaterno,
                primer_Nombre: nuevoEmpleado.primerNombre,
                segundo_Nombre: nuevoEmpleado.segundoNombre,
                fecha_Ingreso: new Date(nuevoEmpleado.fechaIngreso).toISOString(),
                fecha_Nacimiento: new Date(nuevoEmpleado.fechaNacimiento).toISOString(),
                fotografia_Url: '',
                pais_Demografico: nuevoEmpleado.paisDemografico,
                estado_Civil: nuevoEmpleado.estadoCivil,
                genero: nuevoEmpleado.genero,
                nivel_Educacion_Superior: nuevoEmpleado.nivelEducacion,
                pais_Identificacion: nuevoEmpleado.paisIdentificacion,
                tipo_Identificador_Nacional: nuevoEmpleado.tipoIdentificadorNacional,
                identificador_Nacional: nuevoEmpleado.identificadorNacional,
                pais_Seguridad_Social: nuevoEmpleado.paisIdentificacion,
                tipo_Seguridad_Social: nuevoEmpleado.tipoSeguridadSocial,
                identificador_Seguridad_Social: nuevoEmpleado.identificadorSeguridadSocial,
                mensaje_Discapacidad: nuevoEmpleado.mensajeDiscapacidad,
                correo_Electronico: nuevoEmpleado.correoElectronico,
                correo_Electronico_Personal: nuevoEmpleado.correoElectronicoPersonal,
                telefono_Movil: nuevoEmpleado.telefonoMovil,
                direccion_Pais: nuevoEmpleado.direccionPais,
                direccion_Provincia: nuevoEmpleado.direccionProvincia,
                direccion_Canton: nuevoEmpleado.direccionCanton,
                direccion_Distrito: nuevoEmpleado.direccionDistrito,
                direccion_Exacta: nuevoEmpleado.direccionExacta
            });

            setSnack({ open: true, message: 'Empleado creado correctamente.', severity: 'success' });
            setDialogoNuevoOpen(false);
            setNuevoEmpleado(estadoInicialNuevo);
            await cargarDatos();
        } catch (err) {
            setSnack({ open: true, message: extraerError(err, 'No se pudo crear el empleado.'), severity: 'error' });
        } finally {
            setGuardando(false);
        }
    };

    const filas = useMemo(() => {
        return (empleados || []).map((e) => {
            const info = e.informacionPersonal || {};
            const puesto = e.puesto || {};
            const contacto = (e.contactosEmergencia || [])[0] || {};
            const estadoCompleto = (e.estado || 'ACTIVO').toUpperCase();
            const [estadoBase, motivoInactivoEstado] = estadoCompleto.split(':');

            const empleadoId = e.empleado_ID ?? e.empleadoId;
            const fechaIngreso = e.fecha_Ingreso ?? e.fechaIngreso;
            const nombre = arreglarTexto(info.primer_Nombre ?? info.primerNombre ?? info.nombre_Empleado ?? 'Sin nombre');
            const apellidoP = arreglarTexto(info.apellido_Paterno ?? info.apellidoPaterno ?? '');
            const apellidoM = arreglarTexto(info.apellido_Materno ?? info.apellidoMaterno ?? '');
            const cedula = e.cedula || 'N/A';
            const nombrePuesto = arreglarTexto(puesto.nombre_Puesto ?? puesto.nombrePuesto ?? 'Sin puesto');
            const salario = Number(puesto.salario_Base ?? puesto.salarioBase ?? 0);
            const departamentoId = puesto.departamento_ID ?? puesto.departamentoId;
            const departamento = arreglarTexto(departamentosMap[departamentoId] || 'Sin departamento');
            const contactoEmergencia = contacto.nombre_Completo || contacto.nombreCompleto
                ? `${arreglarTexto(contacto.nombre_Completo || contacto.nombreCompleto)} (${contacto.telefono_Contacto || contacto.telefonoContacto || 'N/A'})`
                : 'Sin contacto';

            return {
                empleadoId,
                fechaIngreso,
                nombre,
                apellidos: `${apellidoP} ${apellidoM}`.trim() || 'N/A',
                cedula,
                nombrePuesto,
                salario,
                departamento,
                estado: estadoBase || 'ACTIVO',
                motivoInactivo: motivoInactivoEstado || '',
                contactoEmergencia,
                raw: e
            };
        });
    }, [empleados, departamentosMap]);

    const filasFiltradas = useMemo(() => {
        return filas.filter((f) => {
            const idOk = !busquedaId || `${f.empleadoId}`.includes(busquedaId.trim());
            const nombreCompleto = `${f.nombre} ${f.apellidos}`.toLowerCase();
            const nombreOk = !busquedaNombre || nombreCompleto.includes(busquedaNombre.toLowerCase().trim());
            const fechaOk = !busquedaFechaIngreso || ((f.fechaIngreso || '').toString().startsWith(busquedaFechaIngreso));
            const gerenciaOk = !busquedaGerencia || (f.departamento || '').toLowerCase().includes(busquedaGerencia.toLowerCase().trim());
            return idOk && nombreOk && fechaOk && gerenciaOk;
        });
    }, [filas, busquedaId, busquedaNombre, busquedaFechaIngreso, busquedaGerencia]);

    const renderEstado = (estado, motivo) => {
        const esActivo = estado === 'ACTIVO';
        const esInactivo = estado === 'INACTIVO';
        const etiqueta = esInactivo && motivo ? `${estado} (${motivo})` : estado;

        return (
            <Chip
                size="small"
                label={etiqueta}
                sx={{
                    fontWeight: 700,
                    backgroundColor: esActivo ? '#E8F7EF' : esInactivo ? '#FFF4E5' : '#FEECEC',
                    color: esActivo ? '#1F8F4E' : esInactivo ? '#A05A00' : '#B42318',
                    border: `1px solid ${esActivo ? '#86D3A8' : esInactivo ? '#F4C542' : '#F7B2AD'}`
                }}
            />
        );
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
                <IconButton onClick={() => navigate('/home')} sx={{ color: colors.blanco }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography sx={{ ml: 1, fontSize: 28, fontWeight: 300 }}>Gestión de empleados</Typography>
            </Box>

            <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: '1500px', mx: 'auto' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5, flex: 1 }}>
                        <TextField label="Buscar por ID empleado" size="small" value={busquedaId} onChange={(e) => setBusquedaId(e.target.value)} />
                        <TextField label="Buscar por nombre" size="small" value={busquedaNombre} onChange={(e) => setBusquedaNombre(e.target.value)} />
                        <TextField label="Buscar por fecha ingreso" type="date" size="small" InputLabelProps={{ shrink: true }} value={busquedaFechaIngreso} onChange={(e) => setBusquedaFechaIngreso(e.target.value)} />
                        <TextField label="Buscar por gerencia" size="small" value={busquedaGerencia} onChange={(e) => setBusquedaGerencia(e.target.value)} />
                    </Box>
                    <Button variant="contained" onClick={() => setDialogoNuevoOpen(true)} sx={{ backgroundColor: colors.azul }}>Agregar empleado</Button>
                </Box>

                {error ? (
                    <Card sx={{ border: '1px solid #F1C0C0', borderRadius: '12px', backgroundColor: colors.blanco }}>
                        <CardContent>
                            <Typography sx={{ color: '#B91C1C' }}>{error}</Typography>
                        </CardContent>
                    </Card>
                ) : (
                    <Card sx={{ border: `1px solid ${colors.celeste}`, borderRadius: '12px', backgroundColor: colors.blanco }}>
                        <CardContent>
                            <Box sx={{ overflowX: 'auto' }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: colors.celesteSuave }}>
                                            <TableCell sx={{ fontWeight: 800 }}>ID_EMPLEADO</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Nombre</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Apellidos</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Cédula</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Puesto</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Salario</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Departamento</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Fecha de ingreso</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Estado</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Contacto de emergencia</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Editar</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filasFiltradas.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={11}>No hay empleados para los filtros seleccionados.</TableCell>
                                            </TableRow>
                                        ) : (
                                            filasFiltradas.map((f) => (
                                                <TableRow key={f.empleadoId} hover>
                                                    <TableCell>{f.empleadoId}</TableCell>
                                                    <TableCell>{f.nombre}</TableCell>
                                                    <TableCell>{f.apellidos}</TableCell>
                                                    <TableCell>{f.cedula}</TableCell>
                                                    <TableCell>{f.nombrePuesto}</TableCell>
                                                    <TableCell>{f.salario.toLocaleString('es-CR', { style: 'currency', currency: 'CRC' })}</TableCell>
                                                    <TableCell>{f.departamento}</TableCell>
                                                    <TableCell>{f.fechaIngreso ? new Date(f.fechaIngreso).toLocaleDateString('es-CR') : 'N/A'}</TableCell>
                                                    <TableCell>{renderEstado(f.estado, f.motivoInactivo)}</TableCell>
                                                    <TableCell>{f.contactoEmergencia}</TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="outlined"
                                                            size="small"
                                                            onClick={() => abrirEdicion(f.raw)}
                                                            sx={{ borderColor: colors.azul, color: colors.azul, '&:hover': { borderColor: colors.celeste, backgroundColor: colors.celesteSuave } }}
                                                        >
                                                            Editar estado
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </Box>
                        </CardContent>
                    </Card>
                )}
            </Box>

            <Dialog open={dialogoOpen} onClose={() => setDialogoOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>Editar estado del empleado</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 1 }}>
                        <InputLabel>Estado</InputLabel>
                        <Select label="Estado" value={estadoEditado} onChange={(e) => setEstadoEditado(e.target.value)}>
                            <MenuItem value="ACTIVO">ACTIVO</MenuItem>
                            <MenuItem value="INACTIVO">INACTIVO</MenuItem>
                            <MenuItem value="BLOQUEADO">BLOQUEADO</MenuItem>
                        </Select>
                    </FormControl>

                    {estadoEditado === 'INACTIVO' && (
                        <FormControl fullWidth sx={{ mt: 2 }}>
                            <InputLabel>Motivo de inactivación</InputLabel>
                            <Select label="Motivo de inactivación" value={motivoInactivo} onChange={(e) => setMotivoInactivo(e.target.value)}>
                                <MenuItem value="DESPIDO">DESPIDO</MenuItem>
                                <MenuItem value="RENUNCIA">RENUNCIA</MenuItem>
                                <MenuItem value="MUERTE">MUERTE</MenuItem>
                            </Select>
                        </FormControl>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogoOpen(false)}>Cancelar</Button>
                    <Button onClick={guardarEstado} disabled={guardando} variant="contained">{guardando ? 'Guardando...' : 'Guardar'}</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={dialogoNuevoOpen} onClose={() => setDialogoNuevoOpen(false)} fullWidth maxWidth="md">
                <DialogTitle>Agregar empleado (todos los campos obligatorios)</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
                        <TextField label="Usuario" value={nuevoEmpleado.nombreUsuario} onChange={(e) => onNuevoEmpleadoChange('nombreUsuario', e.target.value)} required />
                        <TextField label="Contraseña" type="password" value={nuevoEmpleado.password} onChange={(e) => onNuevoEmpleadoChange('password', e.target.value)} required />
                        <TextField label="Cédula" value={nuevoEmpleado.cedula} onChange={(e) => onNuevoEmpleadoChange('cedula', e.target.value)} required />

                        <FormControl>
                            <InputLabel>Perfil</InputLabel>
                            <Select label="Perfil" value={nuevoEmpleado.perfilId} onChange={(e) => onNuevoEmpleadoChange('perfilId', e.target.value)}>
                                {perfiles.map((p) => (
                                    <MenuItem key={p.perfil_ID ?? p.perfilId} value={p.perfil_ID ?? p.perfilId}>{p.nombre_Perfil ?? p.nombrePerfil}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl>
                            <InputLabel>Puesto</InputLabel>
                            <Select label="Puesto" value={nuevoEmpleado.puestoId} onChange={(e) => onNuevoEmpleadoChange('puestoId', e.target.value)}>
                                {puestos.map((p) => (
                                    <MenuItem key={p.puesto_ID ?? p.puestoId} value={p.puesto_ID ?? p.puestoId}>{arreglarTexto(p.nombre_Puesto ?? p.nombrePuesto)}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl>
                            <InputLabel>Horario</InputLabel>
                            <Select label="Horario" value={nuevoEmpleado.horarioId} onChange={(e) => onNuevoEmpleadoChange('horarioId', e.target.value)}>
                                {horarios.map((h) => (
                                    <MenuItem key={h.horario_ID ?? h.horarioId} value={h.horario_ID ?? h.horarioId}>{h.nombre_Horario ?? h.nombreHorario}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField label="Correo corporativo" value={nuevoEmpleado.correoElectronico} onChange={(e) => onNuevoEmpleadoChange('correoElectronico', e.target.value)} required />
                        <TextField label="Correo personal" value={nuevoEmpleado.correoElectronicoPersonal} onChange={(e) => onNuevoEmpleadoChange('correoElectronicoPersonal', e.target.value)} required />
                        <TextField label="Teléfono móvil" value={nuevoEmpleado.telefonoMovil} onChange={(e) => onNuevoEmpleadoChange('telefonoMovil', e.target.value)} required />

                        <TextField label="Primer nombre" value={nuevoEmpleado.primerNombre} onChange={(e) => onNuevoEmpleadoChange('primerNombre', e.target.value)} required />
                        <TextField label="Segundo nombre" value={nuevoEmpleado.segundoNombre} onChange={(e) => onNuevoEmpleadoChange('segundoNombre', e.target.value)} required />
                        <TextField label="Apellido paterno" value={nuevoEmpleado.apellidoPaterno} onChange={(e) => onNuevoEmpleadoChange('apellidoPaterno', e.target.value)} required />
                        <TextField label="Apellido materno" value={nuevoEmpleado.apellidoMaterno} onChange={(e) => onNuevoEmpleadoChange('apellidoMaterno', e.target.value)} required />

                        <TextField label="Fecha ingreso" type="date" InputLabelProps={{ shrink: true }} value={nuevoEmpleado.fechaIngreso} onChange={(e) => onNuevoEmpleadoChange('fechaIngreso', e.target.value)} required />
                        <TextField label="Fecha nacimiento" type="date" InputLabelProps={{ shrink: true }} value={nuevoEmpleado.fechaNacimiento} onChange={(e) => onNuevoEmpleadoChange('fechaNacimiento', e.target.value)} required />

                        <TextField label="País demográfico" value={nuevoEmpleado.paisDemografico} onChange={(e) => onNuevoEmpleadoChange('paisDemografico', e.target.value)} required />
                        <TextField label="Estado civil" value={nuevoEmpleado.estadoCivil} onChange={(e) => onNuevoEmpleadoChange('estadoCivil', e.target.value)} required />
                        <TextField label="Género" value={nuevoEmpleado.genero} onChange={(e) => onNuevoEmpleadoChange('genero', e.target.value)} required />

                        <TextField label="Nivel educación" value={nuevoEmpleado.nivelEducacion} onChange={(e) => onNuevoEmpleadoChange('nivelEducacion', e.target.value)} required />
                        <TextField label="País identificación" value={nuevoEmpleado.paisIdentificacion} onChange={(e) => onNuevoEmpleadoChange('paisIdentificacion', e.target.value)} required />
                        <TextField label="Tipo identificador nacional" value={nuevoEmpleado.tipoIdentificadorNacional} onChange={(e) => onNuevoEmpleadoChange('tipoIdentificadorNacional', e.target.value)} required />
                        <TextField label="Identificador nacional" value={nuevoEmpleado.identificadorNacional} onChange={(e) => onNuevoEmpleadoChange('identificadorNacional', e.target.value)} required />
                        <TextField label="Tipo seguridad social" value={nuevoEmpleado.tipoSeguridadSocial} onChange={(e) => onNuevoEmpleadoChange('tipoSeguridadSocial', e.target.value)} required />
                        <TextField label="Identificador seguridad social" value={nuevoEmpleado.identificadorSeguridadSocial} onChange={(e) => onNuevoEmpleadoChange('identificadorSeguridadSocial', e.target.value)} required />

                        <TextField label="Mensaje discapacidad" value={nuevoEmpleado.mensajeDiscapacidad} onChange={(e) => onNuevoEmpleadoChange('mensajeDiscapacidad', e.target.value)} required />
                        <TextField label="Dirección país" value={nuevoEmpleado.direccionPais} onChange={(e) => onNuevoEmpleadoChange('direccionPais', e.target.value)} required />
                        <TextField label="Provincia" value={nuevoEmpleado.direccionProvincia} onChange={(e) => onNuevoEmpleadoChange('direccionProvincia', e.target.value)} required />
                        <TextField label="Canton" value={nuevoEmpleado.direccionCanton} onChange={(e) => onNuevoEmpleadoChange('direccionCanton', e.target.value)} required />
                        <TextField label="Distrito" value={nuevoEmpleado.direccionDistrito} onChange={(e) => onNuevoEmpleadoChange('direccionDistrito', e.target.value)} required />
                        <TextField label="Dirección exacta" value={nuevoEmpleado.direccionExacta} onChange={(e) => onNuevoEmpleadoChange('direccionExacta', e.target.value)} required />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogoNuevoOpen(false)}>Cancelar</Button>
                    <Button onClick={crearEmpleado} disabled={guardando} variant="contained">{guardando ? 'Guardando...' : 'Crear empleado'}</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snack.open} autoHideDuration={3600} onClose={() => setSnack((p) => ({ ...p, open: false }))}>
                <Alert severity={snack.severity} onClose={() => setSnack((p) => ({ ...p, open: false }))}>
                    {snack.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Empleados;
