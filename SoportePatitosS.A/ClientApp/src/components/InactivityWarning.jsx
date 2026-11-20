import React, { useState, useEffect } from 'react';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import './InactivityWarning.css';

/**
 * Componente que muestra una advertencia cuando hay 1 minuto de actividad restante
 */
export const InactivityWarning = () => {
    const [showWarning, setShowWarning] = useState(false);

    useEffect(() => {
        const handleWarning = () => {
            setShowWarning(true);
            // Auto-ocultar después de 30 segundos si el usuario no actúa
            const timer = setTimeout(() => {
                setShowWarning(false);
            }, 30000);
            return () => clearTimeout(timer);
        };

        const handleExpired = () => {
            setShowWarning(false);
        };

        window.addEventListener('inactivityWarning', handleWarning);
        window.addEventListener('sessionExpired', handleExpired);

        return () => {
            window.removeEventListener('inactivityWarning', handleWarning);
            window.removeEventListener('sessionExpired', handleExpired);
        };
    }, []);

    if (!showWarning) return null;

    return (
        <div className="inactivity-warning-container">
            <div className="inactivity-warning-card">
                <div className="warning-header">
                    <div className="warning-icon">
                        <ReportProblemOutlinedIcon fontSize="medium" />
                    </div>
                    <h3>Sesión expirando</h3>
                </div>
                <div>
                    <p>Tu sesión expirará en <strong>1 minuto</strong> por inactividad.</p>
                    <p className="warning-hint">Mueve el mouse o haz click para mantenerte activo.</p>
                </div>
                <div className="warning-progress">
                    <div className="progress-bar"></div>
                </div>
            </div>
        </div>
    );
};

export default InactivityWarning;
