import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasAccessToModule, isLeader, isManager, isGeneralManager } from '../utils/validations';

const ProtectedRoute = ({
    children,
    requirePayrollAccess = false,
    module = null
}) => {
    const { user, isAuthenticated, loading } = useAuth();

    // Si aún está cargando, mostrar un loading o retornar null
    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', color: '#00A8CC' }}>Cargando...</div>
            </div>
        </div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Si requiere acceso de nómina
    if (requirePayrollAccess && !user.esAnalistaNomina) {
        return (
            <Navigate
                to="/unauthorized"
                state={{ message: 'Solo analistas de nómina pueden acceder a este módulo' }}
                replace
            />
        );
    }

    // Validar acceso por módulo específico
    if (module === 'evaluacionesHistoricas' && !(isLeader(user) || isManager(user) || isGeneralManager(user))) {
        return (
            <Navigate
                to="/unauthorized"
                state={{ message: 'Solo jefaturas y gerencias pueden acceder al histórico de evaluaciones' }}
                replace
            />
        );
    }

    if (module && !hasAccessToModule(user, module)) {
        return (
            <Navigate
                to="/unauthorized"
                state={{ message: 'No tiene permisos para acceder a este módulo' }}
                replace
            />
        );
    }

    return children;
};

export default ProtectedRoute;