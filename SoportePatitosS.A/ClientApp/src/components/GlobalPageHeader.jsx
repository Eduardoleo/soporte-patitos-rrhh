import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Box, Typography, Avatar } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const GlobalPageHeader = () => {
    const { user } = useAuth();
    const location = useLocation();

    const [nombreMostrar, setNombreMostrar] = useState(user?.nombre ? user.nombre.toUpperCase() : 'USUARIO');
    const [iniciales, setIniciales] = useState('U');

    useEffect(() => {
        if (!user) return;

        // Establecer iniciales base
        const ini = user.nombre
            ? user.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
            : 'U';
        setIniciales(ini);

        const fetchNombreReal = async () => {
            let empId = user.empleadoId || user.empleado_ID || user.Empleado_ID;
            const usuarioId = user.usuarioId || user.usuario_ID || user.Usuario_ID;

            try {
                if (!empId && usuarioId) {
                    const empRes = await axios.get(`/api/Empleados/ObtenerPorUsuarioId/${usuarioId}`);
                    empId = empRes.data?.empleado_ID || empRes.data?.empleadoId;
                }

                if (empId) {
                    const detalleRes = await axios.get(`/api/Empleados/DetallePersonalPorEmpleado/${empId}`);
                    const det = detalleRes.data || {};

                    const pNombre = det.nombre || det.primerNombre || '';
                    const aPaterno = det.apellidoPaterno || '';
                    const aMaterno = det.apellidoMaterno || '';

                    const nombreConcatenado = `${pNombre} ${aPaterno} ${aMaterno}`.trim().toUpperCase();

                    if (nombreConcatenado) {
                        setNombreMostrar(nombreConcatenado);
                    }
                }
            } catch (err) {
                console.warn('No se pudo cargar el nombre real del empleado', err);
            }
        };

        fetchNombreReal();
    }, [user]);

    // No mostrar en MenuPrincipal (/home) ni en login ni root (aunque esos no usan Layout siempre)
    if (location.pathname === '/home' || location.pathname === '/' || location.pathname === '/login') {
        return null;
    }

    if (!user) return null;

    return (
        <Box sx={{
            backgroundColor: '#0F0F0F',
            color: '#FFFFFF',
            py: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #1A1A1A'
        }}>
            <Avatar 
                src={user.fotografiaUrl || ''} 
                alt={user.nombre || 'Usuario'}
                sx={{ 
                    width: 72, 
                    height: 72, 
                    mb: 1,
                    border: '2px solid #FFFFFF',
                    backgroundColor: '#1E3A8A'
                }}
            >
                {!user.fotografiaUrl && iniciales}
            </Avatar>
            <Typography variant="body2" sx={{ 
                fontWeight: 500, 
                letterSpacing: '0.5px',
                color: '#658C96', // A soft blue/gray based on the provided screenshot
                fontSize: '13px'
            }}>
                {nombreMostrar}
            </Typography>
        </Box>
    );
};

export default GlobalPageHeader;
