import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './components/Login';
import { useInactivityLogout } from './hooks/useInactivityLogout';

// Páginas
import MenuPrincipal from './pages/MenuPrincipal';
import DetallesPersonales from './pages/DetallesPersonales';
import InformacionIdentificacion from './pages/InformacionIdentificacion';
import InformacionContacto from './pages/InformacionContacto';
import InformacionPersonalHub from './pages/InformacionPersonalHub';
import InformacionEmpleo from './pages/InformacionEmpleo';
import RegistrosDocumentos from './pages/RegistrosDocumentos';
import ContactosEmergencia from './pages/ContactosEmergencia';
import Empleados from './pages/Empleados';
import Asistencia from './pages/Asistencia';
import RelojWeb from './pages/RelojWeb';
import TiempoAusencias from './pages/TiempoAusencias';
import Calendario from './pages/Calendario';
import AgregarAusencia from './pages/AgregarAusencia';
import SolicitarCambioHorario from './pages/SolicitarCambioHorario';
import ProgramaEquipo from './pages/ProgramaEquipo';
import BalanceAusencias from './pages/BalanceAusencias';
import Notificaciones from './pages/Notificaciones';
import DetalleSolicitudAusencia from './pages/DetalleSolicitudAusencia';
import Evaluaciones from './pages/Evaluaciones';
import Planillas from './pages/Planillas';

// Módulos de nómina (solo analistas)
import Ausencias from './pages/reportes/Ausencias';
import HorasExtras from './pages/reportes/HorasExtras';
import Vacaciones from './pages/reportes/Vacaciones';
import DiasConGoce from './pages/reportes/DiasConGoce';
import DiasSinGoce from './pages/reportes/DiasSinGoce';
import LicenciaMaternidad from './pages/reportes/LicenciaMaternidad';
import LicenciaPaternidad from './pages/reportes/LicenciaPaternidad';

import './App.css';

// Componente para monitorear inactividad
function InactivityMonitor() {
    useInactivityLogout(5); // 5 minutos de inactividad
    return null;
}

// Componente interno que usa Router
function AppContent() {
    return (
        <Router>
            <InactivityMonitor />
            <Routes>
                {/* Login - Primera página obligatoria */}
                    <Route path="/login" element={<Login />} />

                    {/* Rutas protegidas */}
                    <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                        <Route index element={<Navigate to="/home" replace />} />
                        <Route path="home" element={<ProtectedRoute><MenuPrincipal /></ProtectedRoute>} />
                        <Route path="detalles-personales" element={<ProtectedRoute><DetallesPersonales /></ProtectedRoute>} />
                        <Route path="informacion-personal" element={<ProtectedRoute><InformacionPersonalHub /></ProtectedRoute>} />
                        <Route path="informacion-empleo" element={<ProtectedRoute><InformacionEmpleo /></ProtectedRoute>} />
                        <Route path="registros-documentos" element={<ProtectedRoute><RegistrosDocumentos /></ProtectedRoute>} />
                        <Route path="informacion-identificacion" element={<ProtectedRoute><InformacionIdentificacion /></ProtectedRoute>} />
                        <Route path="informacion-contacto" element={<ProtectedRoute><InformacionContacto /></ProtectedRoute>} />
                        <Route path="contactos-emergencia" element={<ProtectedRoute><ContactosEmergencia /></ProtectedRoute>} />
                        <Route path="empleados" element={<ProtectedRoute module="adminCrud"><Empleados /></ProtectedRoute>} />
                        <Route path="asistencia" element={<ProtectedRoute module="asistenciaGeneral"><Asistencia /></ProtectedRoute>} />
                        <Route path="reloj-web" element={<ProtectedRoute><RelojWeb /></ProtectedRoute>} />
                        <Route path="tiempo-ausencias" element={<ProtectedRoute><TiempoAusencias /></ProtectedRoute>} />
                        <Route path="agregar-ausencia" element={<ProtectedRoute><AgregarAusencia /></ProtectedRoute>} />
                        <Route path="solicitar-cambio-horario" element={<ProtectedRoute><SolicitarCambioHorario /></ProtectedRoute>} />
                        <Route path="programa-equipo" element={<ProtectedRoute><ProgramaEquipo /></ProtectedRoute>} />
                        <Route path="balance-ausencias" element={<ProtectedRoute><BalanceAusencias /></ProtectedRoute>} />
                        <Route path="notificaciones" element={<ProtectedRoute><Notificaciones /></ProtectedRoute>} />
                        <Route path="solicitudes-ausencia/:solicitudId" element={<ProtectedRoute><DetalleSolicitudAusencia /></ProtectedRoute>} />
                        <Route path="calendario" element={<ProtectedRoute><Calendario /></ProtectedRoute>} />
                        <Route path="evaluaciones" element={<ProtectedRoute module="evaluacionesHistoricas"><Evaluaciones /></ProtectedRoute>} />
                        <Route path="mis-evaluaciones" element={<ProtectedRoute><Evaluaciones /></ProtectedRoute>} />
                        <Route path="planillas" element={<ProtectedRoute module="planillas"><Planillas /></ProtectedRoute>} />

                        {/* Módulos SOLO para analistas de nómina */}
                        <Route path="ausencias" element={
                            <ProtectedRoute requirePayrollAccess={true}><Ausencias /></ProtectedRoute>
                        } />
                        <Route path="horas-extras" element={
                            <ProtectedRoute requirePayrollAccess={true}><HorasExtras /></ProtectedRoute>
                        } />
                        <Route path="vacaciones" element={
                            <ProtectedRoute requirePayrollAccess={true}><Vacaciones /></ProtectedRoute>
                        } />
                        <Route path="dias-con-goce" element={
                            <ProtectedRoute requirePayrollAccess={true}><DiasConGoce /></ProtectedRoute>
                        } />
                        <Route path="dias-sin-goce" element={
                            <ProtectedRoute requirePayrollAccess={true}><DiasSinGoce /></ProtectedRoute>
                        } />
                        <Route path="licencia-maternidad" element={
                            <ProtectedRoute requirePayrollAccess={true}><LicenciaMaternidad /></ProtectedRoute>
                        } />
                        <Route path="licencia-paternidad" element={
                            <ProtectedRoute requirePayrollAccess={true}><LicenciaPaternidad /></ProtectedRoute>
                        } />
                    </Route>

                    {/* Ruta de no autorizado */}
                    <Route path="/unauthorized" element={<Unauthorized />} />

                    {/* Redirección por defecto */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </Router>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

const Unauthorized = () => (
    <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #4A90E2 0%, #2E5C8A 100%)'
    }}>
        <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '20px',
            textAlign: 'center',
            boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
        }}>
            <h1 style={{ color: '#f44336', fontSize: '48px', margin: '0 0 20px 0' }}></h1>
            <h2 style={{ color: '#1a1a1a', margin: '0 0 10px 0' }}>Acceso Denegado</h2>
            <p style={{ color: '#666' }}>No tiene permisos para acceder a este módulo</p>
            <a href="/home" style={{
                display: 'inline-block',
                marginTop: '20px',
                padding: '12px 24px',
                background: '#FFC107',
                color: '#1a1a1a',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '600'
            }}>Volver al Dashboard</a>
        </div>
    </div>
);

export default App;