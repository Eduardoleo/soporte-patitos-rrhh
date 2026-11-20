import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Tab,
    Tabs,
    Card,
    Paper,
} from '@mui/material';
import {
    AssignmentTurnedIn as AssignmentIcon,
    ListAlt as ToolsIcon,
    Description as DocumentIcon,
    AccessTime as TimeIcon,
    TrendingUp as CareerIcon,
    Person as PersonIcon,
    Dashboard as CenterIcon,
    School as LearningIcon,
    Work as JobIcon,
    Schedule as ClockIcon,
    Security as RolesIcon,
    Badge as BadgeIcon,
    ContactMail as ContactMailIcon,
    Group as GroupIcon,
    AccountTree as AccountTreeIcon,
    Public as PublicIcon,
    Login as LoginIcon,
    Logout as LogoutIconApp,
    GetApp as DownloadIcon
} from '@mui/icons-material';
import { isStandardEmployee, isLeader, isManager, isGeneralManager, isPayrollAnalyst, isAdmin, hasAccessToModule } from '../utils/validations';
import './MenuPrincipal.css';

const MenuPrincipal = () => {
    const colors = {
        negro: '#0B0B0B',
        azul: '#1E3A8A',
        celeste: '#00A8CC',
        celesteSuave: '#EAF8FC',
        amarillo: '#F4C542',
        blanco: '#FFFFFF'
    };

    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(0);

    const nombreUsuarioMostrado = (
        user?.nombre_Usuario ||
        user?.nombreUsuario ||
        user?.Nombre_Usuario ||
        user?.username ||
        user?.email ||
        user?.correo_Electronico ||
        user?.correoElectronico
    ) || 'USUARIO CORPORATIVO';

    const obtenerSaludo = () => {
        const hora = new Date().getHours();
        if (hora < 12) return 'Buenos días,';
        if (hora < 18) return 'Buenas tardes,';
        return 'Buenas noches,';
    };

    // Aplicaciones (Tab "Yo") - Ahora son Acciones Rápidas
    const accionesRapidasYoBase = [
        { id: 1, nombre: 'Hojas de Ruta' },
        { id: 2, nombre: 'Tiempo y Ausencias' },
        { id: 3, nombre: 'Evaluaciones Empleados' },
        { id: 4, nombre: 'Información Personal' },
        { id: 5, nombre: 'Mi Centro de Actividades' },
        { id: 6, nombre: 'Aprendizaje' },
        { id: 7, nombre: 'Puestos Actuales' },
        { id: 8, nombre: 'Reloj Web' },
        { id: 9, nombre: 'Roles y Delegaciones' },
        { id: 10, nombre: 'Evaluaciones' }
    ];

    const accionesRapidasYo = accionesRapidasYoBase.filter((x) => {
        if (x.nombre === 'Evaluaciones Empleados' && !hasAccessToModule(user, 'evaluacionesEquipo')) {
            return false;
        }
        return true;
    });
    if (isLeader(user) || isManager(user) || isGeneralManager(user) || isAdmin(user)) {
        accionesRapidasYo.push({ id: 11, nombre: 'Asistencia General' });
    }
    if (isPayrollAnalyst(user) || isAdmin(user)) {
        accionesRapidasYo.push({ id: 12, nombre: 'Planillas' });
    }

    const soloTabYo = isStandardEmployee(user);

    // Aplicaciones Tab "Yo" - Ahora son Detalles Personales
    const aplicacionesYo = [
        { id: 1, nombre: 'Detalles Personales' },
        { id: 2, nombre: 'Información de Identificación' },
        { id: 3, nombre: 'Información de Contacto' },
        { id: 4, nombre: 'Contactos de familiares y de emergencia' },
        { id: 5, nombre: 'Gráfico Organizacional' },
        { id: 6, nombre: 'Mi información pública' }
    ];

    // Mapeo de iconos para Acciones Rápidas Tab "Yo" - Iconos pequeños
    const iconosAccionesRapidasYo = {
        'Detalles Personales': <PersonIcon sx={{ fontSize: '28px', color: '#00A8CC' }} />,
        'Información de Identificación': <BadgeIcon sx={{ fontSize: '28px', color: '#00A8CC' }} />,
        'Información de Contacto': <ContactMailIcon sx={{ fontSize: '28px', color: '#00A8CC' }} />,
        'Contactos de familiares y de emergencia': <GroupIcon sx={{ fontSize: '28px', color: '#00A8CC' }} />,
        'Gráfico Organizacional': <AccountTreeIcon sx={{ fontSize: '28px', color: '#00A8CC' }} />,
        'Mi información pública': <PublicIcon sx={{ fontSize: '28px', color: '#00A8CC' }} />
    };

    // Mapeo de iconos para Acciones Rápidas Tab "Herramientas" - Iconos pequeños
    const iconosAccionesHerramientasLista = {
        'Establece Preferencias': <AssignmentIcon sx={{ fontSize: '28px', color: '#00A8CC' }} />,
        'Lista de Trabajo': <ToolsIcon sx={{ fontSize: '28px', color: '#00A8CC' }} />,
        'Informes y Análisis': <DocumentIcon sx={{ fontSize: '28px', color: '#00A8CC' }} />,
        'Procesos Programados': <ClockIcon sx={{ fontSize: '28px', color: '#00A8CC' }} />
    };

    // Mapeo de iconos para Aplicaciones Tab "Yo" - Iconos grandes
    const iconosAccionesYo = {
        'Hojas de Ruta': <DocumentIcon sx={{ fontSize: '45px', color: '#00A8CC' }} />,
        'Tiempo y Ausencias': <TimeIcon sx={{ fontSize: '45px', color: '#00A8CC' }} />,
        'Evaluaciones Empleados': <CareerIcon sx={{ fontSize: '45px', color: '#00A8CC' }} />,
        'Información Personal': <PersonIcon sx={{ fontSize: '45px', color: '#00A8CC' }} />,
        'Mi Centro de Actividades': <CenterIcon sx={{ fontSize: '45px', color: '#00A8CC' }} />,
        'Evaluaciones': <CareerIcon sx={{ fontSize: '45px', color: '#00A8CC' }} />,
        'Aprendizaje': <LearningIcon sx={{ fontSize: '45px', color: '#00A8CC' }} />,
        'Puestos Actuales': <JobIcon sx={{ fontSize: '45px', color: '#00A8CC' }} />,
        'Reloj Web': <ClockIcon sx={{ fontSize: '45px', color: '#00A8CC' }} />,
        'Roles y Delegaciones': <RolesIcon sx={{ fontSize: '45px', color: '#00A8CC' }} />
    };

    // Mapeo de iconos para Aplicaciones Tab "Herramientas" - Iconos grandes
    const iconosAccionesHerramientas = {
        'Registrar Entrada': <LoginIcon sx={{ fontSize: '45px', color: '#00A8CC' }} />,
        'Registrar Salida': <LogoutIconApp sx={{ fontSize: '45px', color: '#00A8CC' }} />,
        'Descargar Constancia': <DownloadIcon sx={{ fontSize: '45px', color: '#00A8CC' }} />
    };

    // Acciones rápidas antiguas (Tab "Yo") - Ya no se usan aquí
    const accionesRapidas = [
        { id: 1, nombre: 'Registrar Entrada' },
        { id: 2, nombre: 'Registrar Salida' },
        { id: 3, nombre: 'Descargar Constancia' }
    ];

    // Aplicaciones Tab "Herramientas"
    const aplicacionesHerramientas = [
        { id: 1, nombre: 'Establece Preferencias' },
        { id: 2, nombre: 'Lista de Trabajo' },
        { id: 3, nombre: 'Informes y Análisis' },
        { id: 4, nombre: 'Procesos Programados' }
    ];

    return (
        <Box sx={{ backgroundColor: colors.blanco, minHeight: '100vh', pb: 4 }}>
            {/* Sección de Bienvenida */}
            <Box sx={{
                backgroundColor: colors.blanco,
                borderBottom: `2px solid ${colors.celeste}`,
                py: 6,
                mb: 3,
                width: '100%',
                display: 'flex',
                justifyContent: 'center'
            }}>
                <Box sx={{
                    width: '80%',
                    px: { xs: 2, sm: 4, md: 6 },
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    flexWrap: 'wrap'
                }}>
                    <Typography variant="body1" sx={{ color: colors.azul, fontWeight: '500', fontSize: '28px' }}>
                        {obtenerSaludo()}
                    </Typography>
                    <Typography variant="h2" sx={{
                        color: colors.azul,
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontSize: '56px'
                    }}>
                        {nombreUsuarioMostrado}
                    </Typography>
                </Box>
            </Box>

            {/* Sistema de Tabs */}
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mb: 3 }}>
                <Box sx={{ width: '80%', px: { xs: 2, sm: 4, md: 6 } }}>
                    <Paper sx={{ boxShadow: 'none', borderBottom: `2px solid ${colors.celeste}` }}>
                        <Tabs
                            value={activeTab}
                            onChange={(event, newValue) => setActiveTab(newValue)}
                            sx={{
                                backgroundColor: colors.blanco,
                                '& .MuiTabs-indicator': {
                                    backgroundColor: colors.azul,
                                    height: '4px'
                                }
                            }}
                        >
                            <Tab
                                label="Yo"
                                sx={{
                                    fontWeight: activeTab === 0 ? '600' : 'normal',
                                    color: activeTab === 0 ? colors.azul : '#666',
                                    fontSize: '20px',
                                    textTransform: 'none',
                                    py: 3,
                                    '&:hover': { backgroundColor: colors.celesteSuave }
                                }}
                            />
                            {!soloTabYo && (
                                <Tab
                                    label="Herramientas"
                                    sx={{
                                        fontWeight: activeTab === 1 ? '600' : 'normal',
                                        color: activeTab === 1 ? colors.azul : '#666',
                                        fontSize: '20px',
                                        textTransform: 'none',
                                        py: 3,
                                        '&:hover': { backgroundColor: colors.celesteSuave }
                                    }}
                                />
                            )}
                            {!soloTabYo && (
                                <Tab
                                    label="Otras"
                                    sx={{
                                        fontWeight: activeTab === 2 ? '600' : 'normal',
                                        color: activeTab === 2 ? colors.azul : '#666',
                                        fontSize: '20px',
                                        textTransform: 'none',
                                        py: 3,
                                        '&:hover': { backgroundColor: colors.celesteSuave }
                                    }}
                                />
                            )}
                        </Tabs>
                    </Paper>
                </Box>
            </Box>

            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ width: '80%', px: { xs: 2, sm: 4, md: 6 } }}>
                {/* TAB "YO" */}
                {activeTab === 0 && (
                    <Box sx={{ animation: 'fadeIn 0.3s ease-in', py: 2 }}>
                        <Box sx={{ display: 'flex', gap: '150px', flexWrap: 'nowrap' }}>
                            {/* Izquierda: Acciones Rápidas */}
                            <Box sx={{ flex: '0 0 360px', display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="h5" sx={{
                                    mb: 3,
                                    fontWeight: '700',
                                    color: '#000',
                                    fontSize: '24px'
                                }}>
                                    Acciones Rápidas
                                </Typography>
                                <Box sx={{ 
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'stretch',
                                    gap: '12px',
                                    width: '100%',
                                    maxWidth: '360px'
                                }}>
                                    {aplicacionesYo.map((app) => (
                                        <Box
                                            key={app.id}
                                            onClick={() => {
                                                if (app.nombre === 'Detalles Personales') {
                                                    navigate('/detalles-personales');
                                                } else if (app.nombre === 'Información de Identificación') {
                                                    navigate('/informacion-identificacion');
                                                } else if (app.nombre === 'Información de Contacto') {
                                                    navigate('/informacion-contacto');
                                                } else if (app.nombre === 'Contactos de familiares y de emergencia') {
                                                    navigate('/contactos-emergencia');
                                                }
                                            }}
                                            sx={{
                                                px: 1.5,
                                                py: 1,
                                                borderRadius: '8px',
                                                transition: 'all 0.3s ease',
                                                cursor: 'pointer',
                                                border: '1px solid #E0E0E0',
                                                backgroundColor: '#fff',
                                                width: '100%',
                                                minHeight: '64px',
                                                display: 'flex',
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'flex-start',
                                                gap: '12px',
                                                '&:hover': {
                                                    borderColor: '#00A8CC',
                                                    boxShadow: '0 3px 8px rgba(0, 168, 204, 0.15)',
                                                    backgroundColor: 'rgba(0, 168, 204, 0.05)',
                                                    transform: 'translateX(2px)'
                                                }
                                            }}
                                        >
                                            <Box sx={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '8px',
                                                flexShrink: 0,
                                                ml: 0.5,
                                                border: '1px solid #E0E0E0',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: 'rgba(0, 168, 204, 0.08)'
                                            }}>
                                                {iconosAccionesRapidasYo[app.nombre]}
                                            </Box>
                                            <Typography sx={{ 
                                                fontWeight: '600', 
                                                color: '#000', 
                                                fontSize: '15px',
                                                textAlign: 'left',
                                                lineHeight: '1.25',
                                                whiteSpace: 'normal',
                                                pr: 1
                                            }}>
                                                {app.nombre}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>

                            {/* Derecha: Aplicaciones - Layout Cuadros */}
                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="h5" sx={{
                                    mb: 3,
                                    fontWeight: '700',
                                    color: '#000',
                                    fontSize: '32px'
                                }}>
                                    Aplicaciones
                                </Typography>
                                <Box sx={{ 
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                                    gap: '22px',
                                    rowGap: '28px'
                                }}>
                                    {accionesRapidasYo.map((accion) => (
                                        <Box
                                            key={accion.id}
                                            onClick={() => {
                                                if (accion.nombre === 'Tiempo y Ausencias') {
                                                    navigate('/tiempo-ausencias');
                                                } else if (accion.nombre === 'Evaluaciones Empleados') {
                                                    navigate('/evaluaciones?origen=menu-principal');
                                                } else if (accion.nombre === 'Información Personal') {
                                                    navigate('/informacion-personal');
                                                } else if (accion.nombre === 'Puestos Actuales') {
                                                    navigate('/informacion-empleo?origen=menu-principal');
                                                } else if (accion.nombre === 'Reloj Web') {
                                                    navigate('/reloj-web');
                                                } else if (accion.nombre === 'Asistencia General') {
                                                    navigate('/asistencia');
                                                } else if (accion.nombre === 'Evaluaciones') {
                                                    navigate('/mis-evaluaciones');
                                                } else if (accion.nombre === 'Planillas') {
                                                    navigate('/planillas');
                                                }
                                            }}
                                            sx={{
                                                borderRadius: '8px',
                                                transition: 'all 0.3s ease',
                                                cursor: 'pointer',
                                                border: '2px solid #E0E0E0',
                                                backgroundColor: '#fff',
                                                width: '120px',
                                                height: '120px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'flex-start',
                                                padding: '12px 8px',
                                                gap: '8px',
                                                '&:hover': {
                                                    borderColor: '#00A8CC',
                                                    boxShadow: '0 6px 16px rgba(0, 168, 204, 0.2)',
                                                    backgroundColor: 'rgba(0, 168, 204, 0.08)',
                                                    transform: 'translateY(-4px)'
                                                }
                                            }}
                                        >
                                            <Box sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                height: '48px',
                                                width: '100%'
                                            }}>
                                                {iconosAccionesYo[accion.nombre]}
                                            </Box>
                                            <Typography sx={{ 
                                                fontWeight: '600', 
                                                color: '#000', 
                                                fontSize: '15px',
                                                textAlign: 'center',
                                                lineHeight: '1.2',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                maxHeight: '36px',
                                                width: '100%'
                                            }}>
                                                {accion.nombre}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                )}

                {/* TAB "HERRAMIENTAS" */}
                {!soloTabYo && activeTab === 1 && (
                    <Box sx={{ animation: 'fadeIn 0.3s ease-in', py: 2 }}>
                        <Box sx={{ display: 'flex', gap: '150px', flexWrap: 'nowrap' }}>
                            {/* Izquierda: Acciones Rápidas */}
                            <Box sx={{ flex: '0 0 360px', display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="h5" sx={{
                                    mb: 3,
                                    fontWeight: '700',
                                    color: '#000',
                                    fontSize: '24px'
                                }}>
                                    Acciones Rápidas
                                </Typography>
                                <Box sx={{ 
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'stretch',
                                    gap: '12px',
                                    width: '100%',
                                    maxWidth: '360px'
                                }}>
                                    {aplicacionesHerramientas.map((app) => (
                                        <Box
                                            key={app.id}
                                            sx={{
                                                px: 1.5,
                                                py: 1,
                                                borderRadius: '8px',
                                                transition: 'all 0.3s ease',
                                                cursor: 'pointer',
                                                border: '1px solid #E0E0E0',
                                                backgroundColor: '#fff',
                                                width: '100%',
                                                minHeight: '64px',
                                                display: 'flex',
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'flex-start',
                                                gap: '12px',
                                                '&:hover': {
                                                    borderColor: '#00A8CC',
                                                    boxShadow: '0 3px 8px rgba(0, 168, 204, 0.15)',
                                                    backgroundColor: 'rgba(0, 168, 204, 0.05)',
                                                    transform: 'translateX(2px)'
                                                }
                                            }}
                                        >
                                            <Box sx={{ 
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '8px',
                                                flexShrink: 0,
                                                ml: 0.5,
                                                border: '1px solid #E0E0E0',
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                backgroundColor: 'rgba(0, 168, 204, 0.08)'
                                            }}>
                                                {iconosAccionesHerramientasLista[app.nombre]}
                                            </Box>
                                            <Typography sx={{ 
                                                fontWeight: '600', 
                                                color: '#000', 
                                                fontSize: '15px',
                                                textAlign: 'left',
                                                lineHeight: '1.25',
                                                whiteSpace: 'normal',
                                                pr: 1
                                            }}>
                                                {app.nombre}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                                </Box>

                            {/* Derecha: Aplicaciones + Notificaciones */}
                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="h5" sx={{
                                    mb: 3,
                                    fontWeight: '700',
                                    color: '#000',
                                    fontSize: '32px'
                                }}>
                                    Aplicaciones
                                </Typography>
                                <Box sx={{ 
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                                    gap: '22px',
                                    rowGap: '28px',
                                    mb: 4
                                }}>
                                    {accionesRapidas.map((accion) => (
                                        <Box
                                            key={accion.id}
                                            sx={{
                                                borderRadius: '8px',
                                                transition: 'all 0.3s ease',
                                                cursor: 'pointer',
                                                border: '2px solid #E0E0E0',
                                                backgroundColor: '#fff',
                                                width: '120px',
                                                height: '120px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'flex-start',
                                                padding: '12px 8px',
                                                gap: '8px',
                                                '&:hover': {
                                                    borderColor: '#00A8CC',
                                                    boxShadow: '0 6px 16px rgba(0, 168, 204, 0.2)',
                                                    backgroundColor: 'rgba(0, 168, 204, 0.08)',
                                                    transform: 'translateY(-4px)'
                                                }
                                            }}
                                        >
                                            <Box sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                height: '48px',
                                                width: '100%'
                                            }}>
                                                {iconosAccionesHerramientas[accion.nombre]}
                                            </Box>
                                            <Typography sx={{ 
                                                fontWeight: '600', 
                                                color: '#000', 
                                                fontSize: '15px',
                                                textAlign: 'center',
                                                lineHeight: '1.2',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                maxHeight: '36px',
                                                width: '100%'
                                            }}>
                                                {accion.nombre}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                )}

                {/* TAB "OTRAS" */}
                {!soloTabYo && activeTab === 2 && (
                    <Box sx={{ animation: 'fadeIn 0.3s ease-in' }}>
                        <Card sx={{ backgroundColor: '#f9f9f9', p: 4, textAlign: 'center', border: '1px solid #E0E0E0' }}>
                            <Typography variant="body1" sx={{ color: '#999', fontWeight: '400' }}>
                                Esta sección está disponible próximamente
                            </Typography>
                        </Card>
                    </Box>
                )}
                </Box>
            </Box>
        </Box>
    );
};

export default MenuPrincipal;