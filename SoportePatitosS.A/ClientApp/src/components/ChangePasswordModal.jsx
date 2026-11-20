import React, { useState } from 'react';
import axios from 'axios';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    Typography,
    Alert,
    LinearProgress,
    InputAdornment,
    IconButton
} from '@mui/material';
import {
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Lock as LockIcon,
    CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

const ChangePasswordModal = ({ open, usuarioId, usuarioNombre, onPasswordChanged }) => {
    const [passwordActual, setPasswordActual] = useState('');
    const [passwordNueva, setPasswordNueva] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [fortaleza, setFortaleza] = useState(0);

    const calcularFortaleza = (pass) => {
        let fuerza = 0;
        if (pass.length >= 8) fuerza += 1;
        if (pass.length >= 12) fuerza += 1;
        if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) fuerza += 1;
        if (/[0-9]/.test(pass)) fuerza += 1;
        if (/[!@#$%^&*()_+\-=[\]{};:'",.<>?/\\|`~]/.test(pass)) fuerza += 1;
        return Math.min(fuerza * 20, 100);
    };

    const validarPassword = () => {
        if (!passwordActual.trim()) {
            setError('La contraseña actual es requerida');
            return false;
        }
        if (!passwordNueva.trim()) {
            setError('La nueva contraseña es requerida');
            return false;
        }
        if (passwordNueva.length < 8) {
            setError('La nueva contraseña debe tener al menos 8 caracteres');
            return false;
        }
        if (passwordNueva !== passwordConfirm) {
            setError('Las contraseñas no coinciden');
            return false;
        }
        if (passwordActual === passwordNueva) {
            setError('La nueva contraseña no puede ser igual a la actual');
            return false;
        }
        return true;
    };

    const handleCambiarPassword = async () => {
        setError('');
        
        if (!validarPassword()) return;

        setLoading(true);

        try {
            if (!usuarioId) {
                throw new Error('No se pudo identificar el usuario actual.');
            }

            await axios.put(`/api/Usuarios/CambiarPassword/${usuarioId}`, {
                nuevaPassword: passwordNueva
            });

            setPasswordActual('');
            setPasswordNueva('');
            setPasswordConfirm('');
            setFortaleza(0);
            
            onPasswordChanged?.();
        } catch (err) {
            setError(err?.response?.data || err?.message || 'Error al cambiar la contraseña');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            maxWidth="sm"
            fullWidth
            disableEscapeKeyDown
            BackdropProps={{
                sx: {
                    backgroundColor: 'rgba(11, 11, 11, 0.78)',
                    backdropFilter: 'blur(8px)'
                }
            }}
        >
            <DialogTitle sx={{ backgroundColor: '#1976D2', color: '#fff', fontWeight: 'bold' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LockIcon />
                    Cambiar Contraseña - Primer Acceso
                </Box>
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Typography variant="body2" sx={{ color: '#666', mb: 3 }}>
                    Por seguridad, debe cambiar su contraseña antes de continuar.
                </Typography>

                <TextField
                    fullWidth
                    label="Usuario"
                    value={usuarioNombre}
                    disabled
                    sx={{ mb: 2 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <CheckCircleIcon sx={{ color: '#4CAF50' }} />
                            </InputAdornment>
                        )
                    }}
                />

                <TextField
                    fullWidth
                    label="Contraseña Actual"
                    type={showPasswords ? 'text' : 'password'}
                    value={passwordActual}
                    onChange={(e) => setPasswordActual(e.target.value)}
                    sx={{ mb: 2 }}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={() => setShowPasswords(!showPasswords)}
                                    edge="end"
                                >
                                    {showPasswords ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                />

                <TextField
                    fullWidth
                    label="Nueva Contraseña"
                    type={showPasswords ? 'text' : 'password'}
                    value={passwordNueva}
                    onChange={(e) => {
                        setPasswordNueva(e.target.value);
                        setFortaleza(calcularFortaleza(e.target.value));
                    }}
                    sx={{ mb: 1 }}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={() => setShowPasswords(!showPasswords)}
                                    edge="end"
                                >
                                    {showPasswords ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                />

                {passwordNueva && (
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" sx={{ color: '#999' }}>
                                Fortaleza de la contraseña
                            </Typography>
                            <Typography variant="caption" sx={{
                                color: fortaleza < 40 ? '#d32f2f' : fortaleza < 70 ? '#FF9800' : '#4CAF50'
                            }}>
                                {fortaleza < 40 ? 'Débil' : fortaleza < 70 ? 'Media' : 'Fuerte'}
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={fortaleza}
                            sx={{
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: '#e0e0e0',
                                '& .MuiLinearProgress-bar': {
                                    backgroundColor: fortaleza < 40 ? '#d32f2f' : fortaleza < 70 ? '#FF9800' : '#4CAF50',
                                    borderRadius: 3
                                }
                            }}
                        />
                    </Box>
                )}

                <TextField
                    fullWidth
                    label="Confirmar Nueva Contraseña"
                    type={showPasswords ? 'text' : 'password'}
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    sx={{ mb: 2 }}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={() => setShowPasswords(!showPasswords)}
                                    edge="end"
                                >
                                    {showPasswords ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                />

                <Typography variant="caption" sx={{
                    display: 'block',
                    color: '#999',
                    lineHeight: 1.6
                }}>
                    Requisitos de seguridad:
                    <ul style={{ margin: '8px 0 0 16px', paddingLeft: 0 }}>
                        <li>Mínimo 8 caracteres</li>
                        <li>Mayúsculas y minúsculas</li>
                        <li>Números y caracteres especiales</li>
                    </ul>
                </Typography>

                {loading && <LinearProgress sx={{ mt: 2 }} />}
            </DialogContent>

            <DialogActions sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                <Button
                    onClick={handleCambiarPassword}
                    variant="contained"
                    fullWidth
                    sx={{
                        backgroundColor: '#1976D2',
                        color: '#fff',
                        fontWeight: 'bold',
                        py: 1.2,
                        '&:hover': { backgroundColor: '#1565C0' }
                    }}
                    disabled={loading || !passwordActual || !passwordNueva || !passwordConfirm}
                >
                    {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ChangePasswordModal;
