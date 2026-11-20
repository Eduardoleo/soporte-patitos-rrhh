import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Menu as MenuIcon,
    Home as HomeIcon,
    Star as StarIcon,
    Flag as FlagIcon,
    Notifications as NotificationsIcon,
    AccountCircle as AccountCircleIcon,
    Logout as LogoutIcon
} from '@mui/icons-material';
import {
    AppBar,
    Toolbar,
    IconButton,
    Box,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Badge,
    Menu as MuiMenu,
    MenuItem,
    Divider,
    Typography
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { hasAccessToModule, isAdmin, isLeader, isManager, isGeneralManager } from '../utils/validations';
import './Navbar.css';

const Navbar = ({ onMenuOpen }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [notificationsAnchor, setNotificationsAnchor] = useState(null);
    const [flagMenuAnchor, setFlagMenuAnchor] = useState(null);
    const [profileAnchor, setProfileAnchor] = useState(null);
    const [notificationCount] = useState(3);

    const handleDrawerToggle = () => {
        setDrawerOpen(!drawerOpen);
    };

    const handleNotificationsClick = () => {
        navigate('/notificaciones');
    };

    const handleNotificationsClose = () => {
        setNotificationsAnchor(null);
    };

    const handleFlagMenuClick = (event) => {
        setFlagMenuAnchor(event.currentTarget);
    };

    const handleFlagMenuClose = () => {
        setFlagMenuAnchor(null);
    };

    const handleProfileClick = (event) => {
        setProfileAnchor(event.currentTarget);
    };

    const handleProfileClose = () => {
        setProfileAnchor(null);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const notifications = [
        { id: 1, title: 'Vacaciones Pendientes', description: 'Tu solicitud está en espera de aprobación' },
        { id: 2, title: 'Incapacidad', description: 'Nuevo documento para revisar' },
        { id: 3, title: 'Constancia de Salario', description: 'Tu solicitud ha sido aprobada' }
    ];

    const drawer = (
        <List className="drawer-content">
            <ListItem className="drawer-header">
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#fff' }}>
                    Menú
                </Typography>
            </ListItem>
            <Divider />
            <ListItem button onClick={() => { navigate('/home'); setDrawerOpen(false); }}>
                <ListItemIcon><HomeIcon sx={{ color: '#00A8CC' }} /></ListItemIcon>
                <ListItemText primary="Menú Principal" />
            </ListItem>
            {isAdmin(user) && (
                <ListItem button onClick={() => { navigate('/empleados'); setDrawerOpen(false); }}>
                    <ListItemIcon><HomeIcon sx={{ color: '#00A8CC' }} /></ListItemIcon>
                    <ListItemText primary="Empleados" />
                </ListItem>
            )}
            {hasAccessToModule(user, 'asistenciaGeneral') && (
                <ListItem button onClick={() => { navigate('/asistencia'); setDrawerOpen(false); }}>
                    <ListItemIcon><HomeIcon sx={{ color: '#00A8CC' }} /></ListItemIcon>
                    <ListItemText primary="Asistencia" />
                </ListItem>
            )}
            {(isLeader(user) || isManager(user) || isGeneralManager(user)) && (
                <ListItem button onClick={() => { navigate('/evaluaciones'); setDrawerOpen(false); }}>
                    <ListItemIcon><HomeIcon sx={{ color: '#00A8CC' }} /></ListItemIcon>
                    <ListItemText primary="Evaluaciones" />
                </ListItem>
            )}
            {hasAccessToModule(user, 'planillas') && (
                <ListItem button onClick={() => { navigate('/planillas'); setDrawerOpen(false); }}>
                    <ListItemIcon><HomeIcon sx={{ color: '#00A8CC' }} /></ListItemIcon>
                    <ListItemText primary="Planillas" />
                </ListItem>
            )}
        </List>
    );

    return (
        <>
            <AppBar position="static" sx={{ backgroundColor: '#000', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
                <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', py: 1, px: 4, minHeight: '60px' }}>
                    {/* Lado Izquierdo: Menú + Logo */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <IconButton
                            color="inherit"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ color: '#fff', '&:hover': { backgroundColor: 'rgba(255, 215, 0, 0.1)' } }}
                        >
                            <MenuIcon sx={{ fontSize: 32 }} />
                        </IconButton>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box
                                sx={{
                                    width: 72,
                                    height: 72,
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #FFD700 0%, #FFF8DC 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '3px solid #FFD700',
                                    boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3)',
                                    padding: '4px'
                                }}
                            >
                                <img
                                    src="/Logo.Patitos.jpeg"
                                    alt="Soporte Patitos"
                                    style={{ height: '64px', width: '64px', borderRadius: '8px', objectFit: 'cover' }}
                                />
                            </Box>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#fff', lineHeight: 1, fontSize: '22px' }}>
                                    Soporte
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 700, color: '#FFD700', lineHeight: 1, fontSize: '16px' }}>
                                    Patitos S.A.
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* Lado Derecho: Iconos */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton
                            color="inherit"
                            onClick={() => navigate('/home')}
                            title="Menú Principal"
                            sx={{ color: '#fff', '&:hover': { backgroundColor: 'rgba(255, 215, 0, 0.1)' } }}
                        >
                            <HomeIcon sx={{ fontSize: 30 }} />
                        </IconButton>

                        <IconButton
                            color="inherit"
                            title="Favoritos"
                            sx={{ color: '#fff', '&:hover': { backgroundColor: 'rgba(255, 215, 0, 0.1)' } }}
                        >
                            <StarIcon sx={{ fontSize: 30 }} />
                        </IconButton>

                        <IconButton
                            color="inherit"
                            onClick={handleFlagMenuClick}
                            title="Menú Rápido"
                            sx={{ color: '#fff', '&:hover': { backgroundColor: 'rgba(255, 215, 0, 0.1)' } }}
                        >
                            <FlagIcon sx={{ fontSize: 30 }} />
                        </IconButton>

                        <IconButton
                            color="inherit"
                            onClick={handleNotificationsClick}
                            title="Notificaciones"
                            sx={{ color: '#fff', '&:hover': { backgroundColor: 'rgba(255, 215, 0, 0.1)' } }}
                        >
                            <Badge badgeContent={notificationCount} color="error">
                                <NotificationsIcon sx={{ fontSize: 30 }} />
                            </Badge>
                        </IconButton>

                        <IconButton
                            color="inherit"
                            onClick={handleProfileClick}
                            title="Perfil"
                            sx={{ color: '#fff', '&:hover': { backgroundColor: 'rgba(255, 215, 0, 0.1)' } }}
                        >
                            <AccountCircleIcon sx={{ fontSize: 30 }} />
                        </IconButton>
                    </Box>
                </Toolbar>
            </AppBar>

            <Drawer anchor="left" open={drawerOpen} onClose={handleDrawerToggle}>
                <Box sx={{ width: 280 }}>
                    {drawer}
                </Box>
            </Drawer>

            <MuiMenu
                anchorEl={flagMenuAnchor}
                open={Boolean(flagMenuAnchor)}
                onClose={handleFlagMenuClose}
            >
                <MenuItem onClick={handleFlagMenuClose}>
                    <Typography sx={{ color: '#000' }}>Ausencias</Typography>
                </MenuItem>
                <MenuItem onClick={handleFlagMenuClose}>
                    <Typography sx={{ color: '#000' }}>Incapacidades</Typography>
                </MenuItem>
                <MenuItem onClick={handleFlagMenuClose}>
                    <Typography sx={{ color: '#000' }}>Vacaciones</Typography>
                </MenuItem>
                <MenuItem onClick={handleFlagMenuClose}>
                    <Typography sx={{ color: '#000' }}>Nómina</Typography>
                </MenuItem>
                <MenuItem onClick={handleFlagMenuClose}>
                    <Typography sx={{ color: '#000' }}>Informes Retenidos</Typography>
                </MenuItem>
            </MuiMenu>

            <MuiMenu
                anchorEl={notificationsAnchor}
                open={Boolean(notificationsAnchor)}
                onClose={handleNotificationsClose}
                PaperProps={{
                    sx: {
                        minWidth: '350px',
                        maxHeight: '400px'
                    }
                }}
            >
                <MenuItem disabled>
                    <Typography sx={{ fontWeight: 'bold', color: '#000' }}>
                        Notificaciones
                    </Typography>
                </MenuItem>
                <Divider />
                {notifications.length > 0 ? (
                    notifications.map((notif, index) => (
                        <MenuItem key={index} sx={{ whiteSpace: 'normal', py: 1.5 }}>
                            <Box>
                                <Typography sx={{ fontWeight: 'bold', fontSize: '14px', color: '#000' }}>
                                    {notif.title}
                                </Typography>
                                <Typography sx={{ fontSize: '12px', color: '#999' }}>
                                    {notif.description}
                                </Typography>
                            </Box>
                        </MenuItem>
                    ))
                ) : (
                    <MenuItem disabled>
                        <Typography>No hay notificaciones</Typography>
                    </MenuItem>
                )}
            </MuiMenu>

            <MuiMenu
                anchorEl={profileAnchor}
                open={Boolean(profileAnchor)}
                onClose={handleProfileClose}
            >
                <MenuItem disabled>
                    <Typography sx={{ fontWeight: 'bold', color: '#000' }}>
                        {user?.nombreUsuario || 'Usuario'}
                    </Typography>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleProfileClose}>Mi Perfil</MenuItem>
                <MenuItem onClick={handleProfileClose}>Configuración</MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ color: '#d32f2f' }}>
                    <LogoutIcon sx={{ mr: 1, fontSize: 18 }} /> Cerrar Sesión
                </MenuItem>
            </MuiMenu>
        </>
    );
};

export default Navbar;
