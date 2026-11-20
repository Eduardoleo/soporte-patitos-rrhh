import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Select,
    MenuItem,
    FormControl,
    CircularProgress,
    TextField,
    Divider,
    IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const AgregarAusencia = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [cargando, setCargando] = useState(true);
    const [, setEmpleadoNombre] = useState('');
    const [, setEmpleadoFoto] = useState('');

    const [tipoAusencia, setTipoAusencia] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [motivo, setMotivo] = useState('');
    const [infoAdicional, setInfoAdicional] = useState('');
    const [anexos, setAnexos] = useState([]);

    const usuarioId = user?.usuario_ID || user?.usuarioId || user?.Usuario_ID;
    const empleadoIdSesion = user?.empleado_ID || user?.empleadoId || user?.Empleado_ID;

    const [tiposDb, setTiposDb] = useState([]);

    const resolverEmpleado = async () => {
        let id = empleadoIdSesion;
        let nombre = '';
        let foto = '';

        if (!id && usuarioId) {
            try {
                const empRes = await axios.get(`/api/Empleados/ObtenerPorUsuarioId/${usuarioId}`);
                id = empRes.data?.empleado_ID || empRes.data?.empleadoId || empRes.data?.Empleado_ID;

                const infoPersonal = empRes.data?.informacionPersonal || empRes.data?.InformacionPersonal;
                if (infoPersonal) {
                    nombre = `${infoPersonal?.primer_Nombre || ''} ${infoPersonal?.apellido_Paterno || ''} ${infoPersonal?.apellido_Materno || ''}`.toUpperCase().trim();
                }

                foto = empRes.data?.fotografia_Url || empRes.data?.fotografiaUrl || '';
            } catch {
                const detalleUsuarioRes = await axios.get(`/api/Empleados/DetallePersonalPorUsuario/${usuarioId}`);
                const detalleUsuario = detalleUsuarioRes.data || {};

                id = detalleUsuario?.empleadoId || detalleUsuario?.empleado_ID || detalleUsuario?.EmpleadoId;
                nombre = `${detalleUsuario?.nombre || ''} ${detalleUsuario?.apellidoPaterno || ''} ${detalleUsuario?.apellidoMaterno || ''}`.toUpperCase().trim();
                foto = detalleUsuario?.fotografiaUrl || detalleUsuario?.fotografia_Url || '';
            }
        }

        if (id && (!nombre || !foto)) {
            const resDetalle = await axios.get(`/api/Empleados/DetallePersonalPorEmpleado/${id}`);
            const det = resDetalle.data || {};

            if (!nombre) {
                nombre = `${det?.nombre || ''} ${det?.apellidoPaterno || ''} ${det?.apellidoMaterno || ''}`.toUpperCase().trim();
            }

            if (!foto) {
                foto = det?.fotografiaUrl || det?.fotografia_Url || '';
            }
        }

        return { id, nombre, foto };
    };

    useEffect(() => {
        const cargarData = async () => {
            if (!user) {
                setCargando(false);
                return;
            }

            const usuarioId = user?.usuario_ID || user?.usuarioId || user?.Usuario_ID;
            const empleadoIdSesion = user?.empleado_ID || user?.empleadoId || user?.Empleado_ID;

            if (!usuarioId && !empleadoIdSesion) {
                setCargando(false);
                return;
            }
            setCargando(true);
            try {
                const { id, nombre, foto } = await resolverEmpleado();

                if (nombre) setEmpleadoNombre(nombre);
                if (foto) setEmpleadoFoto(foto);

                if (!id) throw new Error('No se pudo encontrar el empleado');

                // Fetch tipos ausencia
                try {
                    const tiposRes = await axios.get('/api/Empleados/TiposAusencia');
                    if (tiposRes.data && tiposRes.data.length > 0) {
                        const tiposNormalizados = tiposRes.data
                            .map((t) => ({
                                tipo_Ausencia_ID: t?.tipo_Ausencia_ID ?? t?.tipoAusenciaId ?? t?.tipo_AusenciaId,
                                nombre_Ausencia: t?.nombre_Ausencia ?? t?.nombreAusencia
                            }))
                            .filter((t) => t.tipo_Ausencia_ID && t.nombre_Ausencia);

                        if (tiposNormalizados.length > 0) {
                            setTiposDb(tiposNormalizados);
                        } else {
                            throw new Error("Sin tipos válidos");
                        }
                    } else {
                        throw new Error("Array vacío");
                    }
                } catch (e) {
                    console.warn("Usando tipos de ausencia locales por falla en API", e);
                    setTiposDb([
                        { tipo_Ausencia_ID: 1, nombre_Ausencia: "Incapacidad CCSS (Pago parcial según ley)" },
                        { tipo_Ausencia_ID: 2, nombre_Ausencia: "Incapacidad INS (Riesgos del trabajo)" },
                        { tipo_Ausencia_ID: 3, nombre_Ausencia: "Justificación de ausencia (Sin rebajo)" },
                        { tipo_Ausencia_ID: 4, nombre_Ausencia: "Licencias de cuido (Ley 9908)" },
                        { tipo_Ausencia_ID: 5, nombre_Ausencia: "Días sin goce de salario" },
                        { tipo_Ausencia_ID: 6, nombre_Ausencia: "Vacaciones" },
                        { tipo_Ausencia_ID: 7, nombre_Ausencia: "Licencia por maternidad/paternidad" },
                        { tipo_Ausencia_ID: 8, nombre_Ausencia: "Licencia por fallecimiento de familiar" }
                    ]);
                }

            } catch (err) {
                console.warn("Fallo cargando empleado", err);
            } finally {
                setCargando(false);
            }
        };

        cargarData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se conserva cuándo se ejecuta el efecto (comportamiento original)
    }, [user]);

    if (cargando) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setAnexos([...anexos, ...newFiles]);
        }
    };

    const handleRemoveFile = (index) => {
        const newArr = [...anexos];
        newArr.splice(index, 1);
        setAnexos(newArr);
    };

    const handleSubmit = async () => {
        try {
            const { id } = await resolverEmpleado();

            if (!id) {
                throw new Error('No se pudo identificar al empleado para enviar la solicitud.');
            }

            const payload = {
                empleado_ID: id,
                tipo_Ausencia_ID: parseInt(tipoAusencia, 10),
                fecha_Inicio: fechaInicio ? new Date(fechaInicio).toISOString() : new Date().toISOString(),
                fecha_Fin: fechaFin ? new Date(fechaFin).toISOString() : new Date().toISOString(),
                motivo: motivo,
                comentarios: infoAdicional
            };

            await axios.post('/api/Empleados/SolicitarAusencia', payload);

            const tipoObj = tiposDb.find(t => t.tipo_Ausencia_ID === parseInt(tipoAusencia, 10));
            const msg = `Se ha enviado la solicitud de ausencia tipo: ${tipoObj?.nombre_Ausencia || ''}. Para su revisión por Jefatura / RRHH.`;
            navigate('/notificaciones', { state: { showSuccessMessage: msg } });
        } catch(error) {
            console.error('Error solicitando ausencia', error.response?.data || error.message);
            alert(`Error solicitando ausencia: ${error.response?.data || error.message}`);
        }
    };

    const getOpcionesMotivo = () => {
        const id = parseInt(tipoAusencia, 10);
        if (id === 1) return ["Enfermedad común", "Maternidad", "Accidente fuera del trabajo", "Otros"];
        if (id === 2) return ["Póliza personal", "Póliza de la empresa", "Otros"];
        if (id === 3) return ["Cita médica", "Diligencia legal", "Otros"];
        return ["Otros"];
    };

    const calcularDuracion = () => {
        if (fechaInicio && fechaFin) {
            const start = new Date(fechaInicio);
            const end = new Date(fechaFin);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
            return diffDays;
        }
        return 0;
    };

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#F0F2F5', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>

            {/* Header Fluido */}
            <Box sx={{ backgroundColor: '#0B0B0B', color: '#fff', pt: 2, pb: 4, px: { xs: 2, md: 4 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton onClick={() => navigate('/tiempo-ausencias')} sx={{ color: '#fff', mr: 1 }}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography sx={{ fontWeight: 700, fontSize: '1.4rem' }}>
                            Agregar ausencia
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Button 
                            variant="outlined"
                            onClick={() => navigate('/tiempo-ausencias')}
                            sx={{ color: '#fff', borderColor: '#334155', textTransform: 'none', borderRadius: '8px', px: 2, '&:hover': { borderColor: '#475569', backgroundColor: 'rgba(255,255,255,0.05)' } }}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            variant="outlined" 
                            onClick={() => navigate('/tiempo-ausencias')}
                            sx={{ color: '#fff', borderColor: '#334155', textTransform: 'none', borderRadius: '8px', px: 2, '&:hover': { borderColor: '#475569', backgroundColor: 'rgba(255,255,255,0.05)' } }}
                        >
                            Guardar y Cerrar
                        </Button>
                        <Button 
                            variant="contained" 
                            onClick={handleSubmit}
                            disabled={!tipoAusencia || !fechaInicio || !fechaFin || !motivo}
                            sx={{ backgroundColor: '#FDB913', color: '#000', textTransform: 'none', borderRadius: '8px', px: 3, fontWeight: 600, '&:hover': { backgroundColor: '#E5A710' }, '&.Mui-disabled': { backgroundColor: '#334155', color: '#94A3B8' } }}
                        >
                            Enviar
                        </Button>
                    </Box>
                </Box>
            </Box>

            {/* Contenido Formularios */}
            <Box sx={{ p: { xs: 2, md: 4 }, mt: -3, maxWidth: '900px', mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>

                {/* Tipo */}
                <Card sx={{ borderRadius: 0, boxShadow: 'none', border: '1px solid #E0E0E0' }}>
                    <CardContent sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography sx={{ fontWeight: '600', color: '#333', fontSize: '15px', width: '200px' }}>
                                <span style={{ color: '#00A8CC' }}>*</span>Tipo
                            </Typography>
                            <FormControl fullWidth variant="standard" sx={{ maxWidth: '600px' }}>
                                <Select
                                    value={tipoAusencia}
                                    onChange={(e) => {
                                        setTipoAusencia(e.target.value);
                                        setMotivo('');
                                    }}
                                    displayEmpty
                                    sx={{ 
                                        '&:before': { borderBottom: '1px solid #CCC' },
                                        fontSize: '14px',
                                        color: tipoAusencia ? '#000' : '#888'
                                    }}
                                >
                                    <MenuItem value="" disabled>
                                        Seleccionar un valor
                                    </MenuItem>
                                    {tiposDb.map((tipo) => (
                                        <MenuItem key={tipo.tipo_Ausencia_ID} value={tipo.tipo_Ausencia_ID}>{tipo.nombre_Ausencia}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </CardContent>
                </Card>

                {/* Cuándo */}
                <Card sx={{ borderRadius: 0, boxShadow: 'none', border: '1px solid #E0E0E0' }}>
                    <CardContent sx={{ p: 3, pb: '24px !important' }}>
                        <Typography sx={{ fontWeight: '400', fontSize: '20px', color: '#555', mb: 2 }}>
                            Cuándo
                        </Typography>
                        <Divider />
                        <Box sx={{ mt: 3, ml: 2 }}>
                            <Typography sx={{ fontSize: '12px', fontWeight: 'bold' }}><span style={{ color: '#00A8CC' }}>*</span>Fecha de inicio</Typography>
                            <TextField
                                type="date"
                                variant="outlined"
                                size="small"
                                sx={{ maxWidth: '300px', mb: 2 }}
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />

                            <Typography sx={{ fontSize: '12px', fontWeight: 'bold' }}><span style={{ color: '#00A8CC' }}>*</span>Fecha de finalización</Typography>
                            <TextField
                                type="date"
                                variant="outlined"
                                size="small"
                                sx={{ maxWidth: '300px', mb: 3 }}
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />

                            <Typography sx={{ fontSize: '14px', fontWeight: 'bold' }}>
                                Duración de ausencia <span style={{ fontSize: '20px', fontWeight: 'normal', color: '#666', borderBottom: '1px dotted #ccc', display: 'inline-block', minWidth: '40px', textAlign: 'center' }}> {isNaN(calcularDuracion()) ? 0 : calcularDuracion()} </span> <span style={{ fontWeight: 'normal', color: '#666' }}>Días naturales</span>
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>

                {/* Información Legislativa */}
                <Card sx={{ borderRadius: 0, boxShadow: 'none', border: '1px solid #E0E0E0' }}>
                    <CardContent sx={{ p: 3, pb: '24px !important' }}>
                        <Typography sx={{ fontWeight: '400', fontSize: '20px', color: '#555', mb: 2 }}>
                            Información legislativa
                        </Typography>
                        <Divider />
                        {tipoAusencia && (
                            <Typography sx={{ mt: 2, fontSize: '14px', color: '#666' }}>
                                Esta ausencia se regirá bajo los términos del Código de Trabajo de Costa Rica correspondientes a la categoría seleccionada. Su aprobación dependerá de su jefatura inmediata o del departamento de Recursos Humanos.
                            </Typography>
                        )}
                    </CardContent>
                </Card>

                {/* Detalles (Motivo) */}
                {tipoAusencia && (
                    <Card sx={{ borderRadius: 0, boxShadow: 'none', border: '1px solid #E0E0E0' }}>
                        <CardContent sx={{ p: 3, pb: '24px !important' }}>
                            <Typography sx={{ fontWeight: '400', fontSize: '20px', color: '#555', mb: 2 }}>
                                Detalles
                            </Typography>
                            <Divider />
                            <Box sx={{ mt: 3, ml: 2 }}>
                                <Typography sx={{ fontSize: '12px', fontWeight: 'bold' }}><span style={{ color: '#00A8CC' }}>*</span>Motivo</Typography>
                                <FormControl fullWidth variant="outlined" size="small" sx={{ maxWidth: '300px', mt: 1 }}>
                                    <Select
                                        value={motivo}
                                        onChange={(e) => setMotivo(e.target.value)}
                                        displayEmpty
                                    >
                                        <MenuItem value="" disabled>Seleccionar un valor</MenuItem>
                                        {getOpcionesMotivo().map((m) => (
                                            <MenuItem key={m} value={m}>{m}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        </CardContent>
                    </Card>
                )}

                {/* Información Adicional */}
                <Card sx={{ borderRadius: 0, boxShadow: 'none', border: '1px solid #E0E0E0' }}>
                    <CardContent sx={{ p: 3, pb: '24px !important' }}>
                        <Typography sx={{ fontWeight: '400', fontSize: '20px', color: '#555', mb: 2 }}>
                            Información adicional
                        </Typography>
                        <Divider />
                        <Box sx={{ mt: 3, display: 'flex', alignItems: 'flex-start' }}>
                            <Typography sx={{ fontWeight: '600', color: '#333', fontSize: '15px', width: '200px', pt: 1 }}>
                                Comentarios
                            </Typography>
                            <TextField
                                multiline
                                rows={3}
                                fullWidth
                                variant="outlined"
                                placeholder="Añada detalles adicionales o justificaciones aquí..."
                                value={infoAdicional}
                                onChange={(e) => setInfoAdicional(e.target.value)}
                                sx={{ maxWidth: '600px' }}
                            />
                        </Box>
                    </CardContent>
                </Card>

                {/* Anexos (Solo cuando se selecciona un tipo) */}
                {tipoAusencia && (
                    <Card sx={{ borderRadius: 0, boxShadow: 'none', border: '1px solid #E0E0E0' }}>
                        <CardContent sx={{ p: 3, pb: '24px !important' }}>
                            <Typography sx={{ fontWeight: '400', fontSize: '20px', color: '#555', mb: 2 }}>
                                Anexos y Respaldos
                            </Typography>
                            <Divider />
                            <Box sx={{ mt: 3 }}>
                                <Typography sx={{ fontSize: '14px', color: '#666', mb: 2 }}>
                                    Adjunte documentos de respaldo correspondientes (Ej: Incapacidad del INS, comprobantes médicos). Formatos permitidos: PNG, JPG, PDF.
                                </Typography>
                                <Button 
                                    variant="outlined" 
                                    component="label" 
                                    startIcon={<UploadFileIcon />}
                                    sx={{ textTransform: 'none', borderColor: '#00A8CC', color: '#00A8CC', borderRadius: 0 }}
                                >
                                    Adjuntar Documento
                                    <input 
                                        type="file" 
                                        hidden 
                                        multiple 
                                        accept=".png, .jpg, .jpeg, .pdf" 
                                        onChange={handleFileChange}
                                    />
                                </Button>

                                {anexos.length > 0 && (
                                    <Box sx={{ mt: 3, border: '1px solid #EEE', p: 2 }}>
                                        {anexos.map((file, idx) => (
                                            <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: idx !== anexos.length -1 ? '1px solid #EEE' : 'none' }}>
                                                <Typography sx={{ fontSize: '14px', color: '#333' }}>
                                                    {file.name}
                                                </Typography>
                                                <IconButton onClick={() => handleRemoveFile(idx)} size="small" sx={{ color: '#D32F2F' }}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                )}

            </Box>
        </Box>
    );
};

export default AgregarAusencia;
