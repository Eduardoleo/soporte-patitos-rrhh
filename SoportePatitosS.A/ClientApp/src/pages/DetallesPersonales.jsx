import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Box,
    Typography,
    Card,
    CardContent,
    IconButton,
    Button,
    TextField,
    Snackbar,
    Alert
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Person as PersonIcon } from '@mui/icons-material';

const DetallesPersonales = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [detallePersonal, setDetallePersonal] = useState({});
    const [formData, setFormData] = useState({});
    const [editando, setEditando] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');
    const [openSnackbar, setOpenSnackbar] = useState(false);

    const handleFuncionalidad = () => {
        setOpenSnackbar(true);
    };


    const formatearFecha = (fecha) => {
        if (!fecha) return 'No registrado';
        const date = new Date(fecha);
        return date.toLocaleDateString('es-CR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const mostrarValor = (valor) => {
        if (valor === null || valor === undefined) return 'No registrado';
        const texto = `${valor}`.trim();
        return texto.length > 0 ? texto : 'No registrado';
    };

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

    const renderCampo = (label, value, campoKey = null, tipo = 'text') => (
        <Box sx={campoBoxSx}>
            <Typography sx={{ fontSize: '12px', color: '#5F6B7A', fontWeight: '600', mb: 0.3 }}>
                {label}
            </Typography>
            {editando && campoKey ? (
                <TextField
                    variant="standard"
                    value={formData[campoKey] ?? ''}
                    onChange={(e) => onCampoChange(campoKey, e.target.value)}
                    type={tipo}
                    fullWidth
                    InputProps={{ disableUnderline: true, sx: { fontSize: '15px', fontWeight: '700' } }}
                />
            ) : (
                <Typography sx={{ fontSize: '15px', color: '#000', fontWeight: '700', lineHeight: 1.2 }}>
                    {value}
                </Typography>
            )}
        </Box>
    );

    const onCampoChange = (campo, valor) => {
        setFormData((prev) => ({ ...prev, [campo]: valor }));
    };

    const guardarCambios = async () => {
        if (!detallePersonal?.empleadoId) return;

        setGuardando(true);
        setError('');

        try {
            const payload = {
                Apellido_Paterno: formData.apellidoPaterno ?? '',
                Apellido_Materno: formData.apellidoMaterno ?? '',
                Primer_Nombre: formData.nombre ?? '',
                Segundo_Nombre: formData.segundoNombre ?? '',
                Fecha_Ingreso: formData.fechaInicio ? new Date(formData.fechaInicio).toISOString() : new Date().toISOString(),
                Fecha_Nacimiento: formData.fechaNacimiento ? new Date(formData.fechaNacimiento).toISOString() : null,
                Fotografia_Url: formData.fotografiaUrl ?? '',
                Pais_Demografico: formData.paisDemografico ?? '',
                Estado_Civil: formData.estadoCivil ?? '',
                Genero: formData.genero ?? '',
                Nivel_Educacion_Superior: formData.nivelEducacionSuperior ?? '',
                Pais_Identificacion: formData.paisDocumento ?? '',
                Tipo_Identificador_Nacional: formData.tipoIdentificadorNacional ?? '',
                Identificador_Nacional: formData.identificadorNacional ?? '',
                Pais_Seguridad_Social: formData.paisDocumento ?? '',
                Tipo_Seguridad_Social: formData.tipoSeguridadSocial ?? '',
                Identificador_Seguridad_Social: formData.identificadorSeguridadSocial ?? '',
                Mensaje_Discapacidad: formData.mensajeDiscapacidad ?? ''
            };

            const response = await axios.put(`/api/Empleados/ActualizarDetallePersonal/${detallePersonal.empleadoId}`, payload);
            setDetallePersonal(response.data || {});
            setFormData(response.data || {});
            setEditando(false);
        } catch (err) {
            setError(typeof err?.response?.data === 'string' ? err.response.data : 'No se pudieron guardar los cambios');
        } finally {
            setGuardando(false);
        }
    };

    const nombreCompletoHeader = [
        detallePersonal?.nombre,
        detallePersonal?.segundoNombre,
        detallePersonal?.apellidoPaterno,
        detallePersonal?.apellidoMaterno
    ].filter((x) => x && `${x}`.trim().length > 0).join(' ');

    useEffect(() => {
        const cargarDetallePersonal = async () => {
            if (!user) return;

            const usuarioId = user?.usuario_ID ?? user?.usuarioId ?? user?.Usuario_ID;
            const empleadoIdSesion = user?.empleado_ID ?? user?.empleadoId ?? user?.Empleado_ID;

            if (!usuarioId && !empleadoIdSesion) return;

            setCargando(true);
            setError('');

            try {
                let empleadoId = empleadoIdSesion;
                let response;

                if (!empleadoId && usuarioId) {
                    const empleadoResponse = await axios.get(`/api/Empleados/ObtenerPorUsuarioId/${usuarioId}`);
                    empleadoId = empleadoResponse.data?.empleado_ID
                        ?? empleadoResponse.data?.empleadoId
                        ?? empleadoResponse.data?.Empleado_ID;
                }

                if (!empleadoId) {
                    throw new Error('No se pudo obtener el empleado asociado al usuario');
                }

                response = await axios.get(`/api/Empleados/DetallePersonalPorEmpleado/${empleadoId}`);
                setDetallePersonal(response.data || {});
                setFormData(response.data || {});
            } catch (err) {
                try {
                    if (usuarioId) {
                        const fallback = await axios.get(`/api/Empleados/DetallePersonalPorUsuario/${usuarioId}`);
                        setDetallePersonal(fallback.data || {});
                        setFormData(fallback.data || {});
                        setError('');
                        return;
                    }
                } catch {
                    // Sin respaldo disponible: se muestra el error generico de abajo.
                }

                setError(
                    typeof err?.response?.data === 'string'
                        ? err.response.data
                        : 'No se pudo cargar la información personal'
                );
            } finally {
                setCargando(false);
            }
        };

        cargarDetallePersonal();
    }, [user]);

    return (
        <Box sx={{ py: 2, width: { xs: '96%', md: '75%' }, maxWidth: '1100px', mx: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
                <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="h4" sx={{ fontWeight: '700', mb: 0.3 }}>
                        Detalles Personales
                    </Typography>
                    <Typography sx={{ color: '#5F6B7A', fontSize: '16px', fontWeight: '600' }}>
                        {mostrarValor(nombreCompletoHeader)}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {!editando ? (
                        <Button
                            variant="contained"
                            onClick={() => setEditando(true)}
                            sx={{
                                backgroundColor: '#00A8CC',
                                color: '#fff',
                                fontWeight: '700',
                                '&:hover': { backgroundColor: '#0087A3' }
                            }}
                        >
                            Editar
                        </Button>
                    ) : (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    setEditando(false);
                                    setFormData(detallePersonal || {});
                                }}
                                sx={{ borderColor: '#999', color: '#444', fontWeight: '700' }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="contained"
                                onClick={guardarCambios}
                                disabled={guardando}
                                sx={{
                                    backgroundColor: '#00A8CC',
                                    color: '#fff',
                                    fontWeight: '700',
                                    '&:hover': { backgroundColor: '#0087A3' }
                                }}
                            >
                                {guardando ? 'Guardando...' : 'Guardar cambios'}
                            </Button>
                        </Box>
                    )}

                    <Box
                        sx={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            border: '2px solid #00A8CC',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#E8F7FB'
                        }}
                    >
                        {detallePersonal?.fotografiaUrl ? (
                            <Box
                                component="img"
                                src={detallePersonal.fotografiaUrl}
                                alt="Fotografía del empleado"
                                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <PersonIcon sx={{ color: '#00A8CC', fontSize: '32px' }} />
                        )}
                    </Box>

                    <IconButton
                        onClick={() => navigate(-1)}
                        sx={{
                            border: '1px solid #00A8CC',
                            color: '#00A8CC',
                            width: '42px',
                            height: '42px'
                        }}
                        aria-label="Volver atrás"
                    >
                        <ArrowBackIcon />
                    </IconButton>
                </Box>
            </Box>

            {cargando && (
                <Typography sx={{ color: '#666', fontSize: '15px' }}>
                    Cargando información personal...
                </Typography>
            )}

            {error && (
                <Typography sx={{ color: '#D32F2F', fontSize: '15px', fontWeight: '600', mb: 2 }}>
                    {error}
                </Typography>
            )}

            {!cargando && !error && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                    <Card sx={{ border: '1px solid #E0E0E0', boxShadow: '0 6px 20px rgba(0,0,0,0.06)', borderRadius: '14px', width: '100%', maxWidth: '920px' }}>
                        <CardContent>
                            <Typography sx={{ fontWeight: '700', mb: 1.5 }}>Información básica</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1.5 }}>
                                    {[
                                        { label: 'Apellido paterno', value: mostrarValor(detallePersonal.apellidoPaterno) },
                                        { label: 'Apellido materno', value: mostrarValor(detallePersonal.apellidoMaterno) },
                                        { label: 'Nombre', value: mostrarValor(detallePersonal.nombre) }
                                    ].map((campo) => (
                                        <Box key={campo.label}>{renderCampo(campo.label, campo.value, campo.label === 'Apellido paterno' ? 'apellidoPaterno' : campo.label === 'Apellido materno' ? 'apellidoMaterno' : 'nombre')}</Box>
                                    ))}
                                </Box>

                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5 }}>
                                    {[
                                        { label: 'Segundo nombre', value: mostrarValor(detallePersonal.segundoNombre) },
                                        { label: 'Fecha de inicio', value: formatearFecha(detallePersonal.fechaInicio) }
                                    ].map((campo) => (
                                        <Box key={campo.label}>{renderCampo(campo.label, campo.value, campo.label === 'Segundo nombre' ? 'segundoNombre' : 'fechaInicio', campo.label === 'Fecha de inicio' ? 'date' : 'text')}</Box>
                                    ))}
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>

                    <Card sx={{ border: '1px solid #E0E0E0', boxShadow: '0 6px 20px rgba(0,0,0,0.06)', borderRadius: '14px', width: '100%', maxWidth: '920px' }}>
                        <CardContent>
                            <Typography sx={{ color: '#999', fontWeight: '600', mb: 0.5 }}>Cargado</Typography>
                            <Typography sx={{ fontWeight: '700', mb: 1.5 }}>Fotografía</Typography>
                            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                                {detallePersonal.fotografiaUrl && detallePersonal.fotografiaUrl !== 'No registrado' && (
                                    <Box
                                        component="img"
                                        src={detallePersonal.fotografiaUrl}
                                        alt="Fotografía"
                                        sx={{ flexShrink: 0, width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '2px solid #E0E0E0', backgroundColor: '#f0f0f0' }}
                                    />
                                )}
                                <Box sx={{ flex: 1, width: '100%' }}>
                                    <Typography sx={{ color: '#00A8CC', fontWeight: '600', mb: 1 }}>URL de la Fotografía</Typography>
                                    {renderCampo('URL de fotografía', mostrarValor(detallePersonal.fotografiaUrl), 'fotografiaUrl')}
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>

                    <Card sx={{ border: '1px solid #E0E0E0', boxShadow: '0 6px 20px rgba(0,0,0,0.06)', borderRadius: '14px', width: '100%', maxWidth: '920px' }}>
                        <CardContent>
                            <Typography sx={{ fontWeight: '700', mb: 1.5 }}>Información demográfica</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1.5 }}>
                                    {renderCampo('País para informe demográfico', mostrarValor(detallePersonal.paisDemografico), 'paisDemografico')}
                                    {renderCampo('Estado civil', mostrarValor(detallePersonal.estadoCivil), 'estadoCivil')}
                                    {renderCampo('Fecha de inicio', formatearFecha(detallePersonal.fechaInicio), 'fechaInicio', 'date')}
                                </Box>
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5 }}>
                                    {renderCampo('Género', mostrarValor(detallePersonal.genero), 'genero')}
                                    {renderCampo('Nivel de educación superior', mostrarValor(detallePersonal.nivelEducacionSuperior), 'nivelEducacionSuperior')}
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>

                    <Card sx={{ border: '1px solid #E0E0E0', boxShadow: '0 6px 20px rgba(0,0,0,0.06)', borderRadius: '14px', width: '100%', maxWidth: '920px' }}>
                        <CardContent>
                            <Typography sx={{ color: '#999', fontWeight: '600', mb: 0.5 }}>Cargado</Typography>
                            <Typography sx={{ fontWeight: '700', mb: 1.5 }}>Documentos de identidad</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1.5 }}>
                                    {renderCampo('País', mostrarValor(detallePersonal.paisDocumento), 'paisDocumento')}
                                    {renderCampo('Tipo de identificador nacional', mostrarValor(detallePersonal.tipoIdentificadorNacional), 'tipoIdentificadorNacional')}
                                    {renderCampo('Identificador nacional', mostrarValor(detallePersonal.identificadorNacional), 'identificadorNacional')}
                                </Box>
                                <Typography sx={{ fontWeight: '700', mt: 0.5 }}>Principal</Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1.5 }}>
                                    {renderCampo('País', mostrarValor(detallePersonal.paisDocumento), 'paisDocumento')}
                                    {renderCampo('Tipo de identificador nacional', mostrarValor(detallePersonal.tipoSeguridadSocial), 'tipoSeguridadSocial')}
                                    {renderCampo('Identificador nacional', mostrarValor(detallePersonal.identificadorSeguridadSocial), 'identificadorSeguridadSocial')}
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>

                    <Card sx={{ border: '1px solid #E0E0E0', boxShadow: '0 6px 20px rgba(0,0,0,0.06)', borderRadius: '14px', width: '100%', maxWidth: '920px' }}>
                        <CardContent>
                            <Typography sx={{ color: '#999', fontWeight: '600', mb: 0.5 }}>Cargado</Typography>
                            <Typography sx={{ fontWeight: '700', mb: 1.5 }}>Información biográfica</Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5 }}>
                                {renderCampo('Fecha de nacimiento', formatearFecha(detallePersonal.fechaNacimiento), 'fechaNacimiento', 'date')}
                                {renderCampo('Edad', mostrarValor(detallePersonal.edadTexto))}
                            </Box>
                        </CardContent>
                    </Card>

                    <Card sx={{ border: '1px solid #E0E0E0', boxShadow: '0 6px 20px rgba(0,0,0,0.06)', borderRadius: '14px', width: '100%', maxWidth: '920px' }}>
                        <CardContent>
                            <Typography sx={{ fontWeight: '700', mb: 1.5 }}>Información de discapacidad</Typography>
                            <Typography onClick={handleFuncionalidad} sx={{ color: '#00A8CC', fontWeight: '600', mb: 1, cursor: 'pointer' }}>Agregar Información de discapacidad</Typography>
                            {renderCampo('Descripción', mostrarValor(detallePersonal.mensajeDiscapacidad), 'mensajeDiscapacidad')}
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

export default DetallesPersonales;
