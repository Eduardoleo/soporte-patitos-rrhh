import React, { createContext, useState, useContext, useEffect } from 'react';
import { validateCorporateEmail } from '../utils/validations';
import { isPayrollAnalyst, isAdmin, isGeneralManager, isManager, isLeader } from '../utils/validations';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(null);

    useEffect(() => {
        // Al reiniciar o dar F5, borramos los datos para obligar al usuario a iniciar sesión nuevamente por seguridad
        console.log("🔐 AuthContext Init - Forzando logout por seguridad en reinicio o F5");
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
        setToken(null);
        setLoading(false);
    }, []);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (user && token) {
                e.preventDefault();
                e.returnValue = "Al realizar esta opción es posible que se te pida iniciar sesión de nuevo por seguridad.";
                return "Al realizar esta opción es posible que se te pida iniciar sesión de nuevo por seguridad.";
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [user, token]);

    const login = async (email, password) => {
        // Validar correo corporativo
        if (!validateCorporateEmail(email)) {
            throw new Error('Solo se permiten correos corporativos @patitos.sa');
        }

        try {
            // Llamada a tu API de backend
            const response = await axios.post('/api/Usuarios/Login', {
                nombreUsuario: email,
                password: password
            });

            const loginResponse = response.data;

            const usuarioBase = {
                usuarioId: loginResponse.usuarioId,
                nombreUsuario: loginResponse.nombreUsuario,
                nombre: loginResponse.nombre,
                perfil: loginResponse.perfil,
                empleadoId: loginResponse.empleadoId,
                fotografiaUrl: loginResponse.fotografiaUrl,
                expiresAt: loginResponse.expiresAt,
                debeCambiarClave: !!loginResponse.debeCambiarClave
            };

            const usuarioConRoles = {
                ...usuarioBase,
                esAnalistaNomina: isPayrollAnalyst(usuarioBase),
                esAdministrador: isAdmin(usuarioBase),
                esGerenteGeneral: isGeneralManager(usuarioBase),
                esGerente: isManager(usuarioBase),
                esJefe: isLeader(usuarioBase)
            };

            const jwtToken = loginResponse.token;

            // Guardar token y usuario
            localStorage.setItem('token', jwtToken);
            localStorage.setItem('user', JSON.stringify(usuarioConRoles));

            axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;

            setToken(jwtToken);
            setUser(usuarioConRoles);
            return loginResponse;
        } catch (error) {
            console.error("❌ ERROR EN LOGIN:", error?.response?.data);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            delete axios.defaults.headers.common['Authorization'];
            if (typeof error?.response?.data === 'string') {
                throw new Error(error.response.data, { cause: error });
            }
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        setToken(null);
        setUser(null);
    };

    const marcarCambioClaveCompletado = () => {
        setUser((prev) => {
            if (!prev) return prev;
            const actualizado = { ...prev, debeCambiarClave: false };
            localStorage.setItem('user', JSON.stringify(actualizado));
            return actualizado;
        });
    };

    const value = {
        user,
        login,
        logout,
        marcarCambioClaveCompletado,
        isAuthenticated: !!user && !!token,
        isPayrollAnalyst: user ? user.esAnalistaNomina : false,
        loading,
        token
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
