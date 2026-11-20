import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validateCorporateEmail } from '../utils/validations';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validación de correo corporativo
        if (!validateCorporateEmail(email)) {
            setError('❌ Solo se permiten correos corporativos @patitos.sa');
            return;
        }

        if (!password) {
            setError('❌ La contraseña es obligatoria');
            return;
        }

        setLoading(true);

        try {
            await login(email, password);
            navigate('/home');
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <div className="logo-container">
                    <div className="logo-duck">
                        {/* Imagen del Logo Real */}
                        <img src="/Logo.Patitos.jpeg" alt="Soporte Patitos S.A." className="logo-main" />
                    </div>
                    <h1 className="company-name">
                        <span className="soporte">Soporte</span>
                        <span className="patitos">Patitos</span>
                        <span className="sa">S.A.</span>
                    </h1>
                    <p className="tagline">Sistema de Gestión de Recursos Humanos</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="email">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                            </svg>
                            Correo Empresarial
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="usuario@patitos.sa"
                            required
                            disabled={loading}
                        />
                        <small className="form-hint">Debe terminar en @patitos.sa</small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            Contraseña
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Ingrese su contraseña"
                            required
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-block"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="spinner"></span>
                        ) : (
                            <>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                    <polyline points="10 17 15 12 10 7" />
                                    <line x1="15" y1="12" x2="3" y2="12" />
                                </svg>
                                Iniciar Sesión
                            </>
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    <p>&copy; 2026 Soporte Patitos S.A. - Todos los derechos reservados</p>
                    <p className="access-info">Acceso exclusivo para personal autorizado de Recursos Humanos</p>
                </div>
            </div>
        </div>
    );
};

export default Login;