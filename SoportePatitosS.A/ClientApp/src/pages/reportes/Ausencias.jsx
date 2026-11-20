import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Ausencias = () => {
    const [ausencias, setAusencias] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAusencias();
    }, []);

    const fetchAusencias = async () => {
        try {
            const response = await axios.get('/api/ausencias');
            setAusencias(response.data);
        } catch (error) {
            console.error('Error al cargar ausencias:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>📅 Gestión de Ausencias</h1>
                <button className="btn btn-primary">+ Nueva Ausencia</button>
            </div>

            <div className="card">
                <div className="card-body">
                    {loading ? (
                        <div className="loading">Cargando...</div>
                    ) : (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Empleado</th>
                                        <th>Fecha</th>
                                        <th>Tipo</th>
                                        <th>Días</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ausencias.map((ausencia) => (
                                        <tr key={ausencia.id}>
                                            <td>{ausencia.empleado}</td>
                                            <td>{new Date(ausencia.fecha).toLocaleDateString()}</td>
                                            <td>{ausencia.tipo}</td>
                                            <td>{ausencia.dias}</td>
                                            <td>
                                                <span className={`badge badge-${ausencia.estado === 'Aprobada' ? 'success' : 'warning'}`}>
                                                    {ausencia.estado}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="btn btn-secondary">Editar</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Ausencias;