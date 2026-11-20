import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
    const { user, logout, isPayrollAnalyst: payrollAccess } = useAuth();

    const menuItems = [
        { path: '/dashboard', label: 'Dashboard', icon: 'dashboard', restricted: false },
        { path: '/empleados', label: 'Empleados', icon: 'people', restricted: false },
        { path: '/asistencia', label: 'Asistencia', icon: 'schedule', restricted: false },
        { path: '/evaluaciones', label: 'Evaluaciones', icon: 'assignment', restricted: false },
        { path: '/planillas', label: 'Planillas', icon: 'receipt', restricted: false },
    ];

    // Módulos SOLO para analistas de nómina
    const payrollModules = [
        { path: '/ausencias', label: 'Ausencias', icon: 'event_busy', restricted: true },
        { path: '/horas-extras', label: 'Horas Extras', icon: 'access_time', restricted: true },
        { path: '/vacaciones', label: 'Vacaciones', icon: 'beach_access', restricted: true },
        { path: '/dias-con-goce', label: 'Días con Goce', icon: 'emoji_events', restricted: true },
        { path: '/dias-sin-goce', label: 'Días sin Goce', icon: 'block', restricted: true },
        { path: '/licencia-maternidad', label: 'Licencia Maternidad', icon: 'pregnant_woman', restricted: true },
        { path: '/licencia-paternidad', label: 'Licencia Paternidad', icon: 'child_care', restricted: true },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    {/* Imagen del Logo Real (versión pequeña) */}
                    <img src="/Logo.Patitos.jpeg" alt="Logo Menú" className="logo-sidebar" />
                </div>
                <h2>Soporte <span>Patitos</span></h2>
                {payrollAccess && (
                    <span className="payroll-badge">Analista de Nómina</span>
                )}
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <span className="nav-icon">{getIcon(item.icon)}</span>
                        <span className="nav-label">{item.label}</span>
                    </NavLink>
                ))}

                {/* Módulos de nómina - Solo visibles para analistas */}
                {payrollAccess && (
                    <>
                        <div className="nav-section-title">Módulos de Nómina</div>
                        {payrollModules.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => `nav-item payroll-item ${isActive ? 'active' : ''}`}
                            >
                                <span className="nav-icon">{getIcon(item.icon)}</span>
                                <span className="nav-label">{item.label}</span>
                            </NavLink>
                        ))}
                    </>
                )}
            </nav>

            <div className="sidebar-footer">
                <div className="user-info">
                    <img
                        src="/Logo.Patitos.jpeg"
                        alt="User"
                    />
                    <div>
                        <div className="user-name">{user?.nombre}</div>
                        <div className="user-role">{user?.perfil}</div>
                    </div>
                </div>
                <button onClick={logout} className="btn-logout">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Cerrar Sesión
                </button>
            </div>
        </aside>
    );
};

const getIcon = (iconName) => {
    const icons = {
        dashboard: '📊',
        people: '👥',
        schedule: '🕐',
        assignment: '📝',
        receipt: '🧾',
        event_busy: '📅',
        access_time: '⏰',
        beach_access: '🏖️',
        emoji_events: '🏆',
        block: '🚫',
        pregnant_woman: '🤰',
        child_care: '👶'
    };
    return icons[iconName] || '📌';
};

export default Sidebar;
