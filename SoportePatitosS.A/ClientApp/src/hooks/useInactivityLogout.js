import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * Hook que detecta inactividad basada en movimiento de mouse y clicks
 * Después de 5 minutos sin actividad (sin mover mouse ni hacer click), cierra la sesión
 */
export const useInactivityLogout = (inactivityTimeMinutes = 5) => {
    const { logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const inactivityTimerRef = useRef(null);
    const warningTimerRef = useRef(null);
    const lastActivityRef = useRef(Date.now());
    const inactivityMilliseconds = inactivityTimeMinutes * 60 * 1000;
    const warningThresholdMilliseconds = (inactivityTimeMinutes - 1) * 60 * 1000; // Advertencia 1 min antes

    const resetInactivityTimer = () => {
        lastActivityRef.current = Date.now();
        
        // Limpiar timers previos
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }
        if (warningTimerRef.current) {
            clearTimeout(warningTimerRef.current);
        }

        // Mostrar advertencia en 4 minutos
        warningTimerRef.current = setTimeout(() => {
            if (isAuthenticated) {
                console.warn('⚠️ Sesión expirará en 1 minuto por inactividad');
                // Aquí podrías disparar una notificación visual
                window.dispatchEvent(new CustomEvent('inactivityWarning'));
            }
        }, warningThresholdMilliseconds);

        // Cerrar sesión en 5 minutos
        inactivityTimerRef.current = setTimeout(() => {
            if (isAuthenticated) {
                console.log('🔐 Cerrando sesión por inactividad');
                logout();
                navigate('/login', { replace: true });
                window.dispatchEvent(new CustomEvent('sessionExpired'));
            }
        }, inactivityMilliseconds);
    };

    useEffect(() => {
        if (!isAuthenticated) {
            // Limpiar si no hay autenticación
            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
            if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
            return;
        }

        // Detectar movimiento del mouse
        const handleMouseMove = () => {
            resetInactivityTimer();
        };

        // Detectar clicks
        const handleClick = () => {
            resetInactivityTimer();
        };

        // Detectar teclas presionadas
        const handleKeyPress = () => {
            resetInactivityTimer();
        };

        // Detectar scroll
        const handleScroll = () => {
            resetInactivityTimer();
        };

        // Agregar event listeners
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('click', handleClick);
        window.addEventListener('keypress', handleKeyPress);
        window.addEventListener('scroll', handleScroll);

        // Inicializar el timer
        resetInactivityTimer();

        // Cleanup
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('click', handleClick);
            window.removeEventListener('keypress', handleKeyPress);
            window.removeEventListener('scroll', handleScroll);
            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
            if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se conserva cuándo se ejecuta el efecto (comportamiento original)
    }, [isAuthenticated, logout, navigate]);

    return {
        resetInactivityTimer,
        getTimeRemainingMs: () => {
            const elapsed = Date.now() - lastActivityRef.current;
            const remaining = Math.max(0, inactivityMilliseconds - elapsed);
            return remaining;
        },
        getTimeRemainingSeconds: () => {
            const elapsed = Date.now() - lastActivityRef.current;
            return Math.ceil(Math.max(0, inactivityMilliseconds - elapsed) / 1000);
        }
    };
};
