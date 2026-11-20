import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import GlobalPageHeader from './GlobalPageHeader';
import InactivityWarning from './InactivityWarning';
import ChangePasswordModal from './ChangePasswordModal';
import { useAuth } from '../context/AuthContext';
import { Box } from '@mui/material';
import './Layout.css';

const Layout = () => {
    const { user, marcarCambioClaveCompletado } = useAuth();

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
            <Navbar />
            <GlobalPageHeader />
            <Box component="main" sx={{ flex: 1 }}>
                <Outlet />
            </Box>
            <InactivityWarning />
            <ChangePasswordModal
                open={!!user?.debeCambiarClave}
                usuarioId={user?.usuarioId}
                usuarioNombre={user?.nombreUsuario || ''}
                onPasswordChanged={marcarCambioClaveCompletado}
            />
        </Box>
    );
};

export default Layout;