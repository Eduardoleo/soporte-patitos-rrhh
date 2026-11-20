import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Card,
    CardContent,
    IconButton,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { useAuth } from '../context/AuthContext';

const Evaluaciones = () => {
    const colors = {
        negro: '#0B0B0B',
        azul: '#1E3A8A',
        celeste: '#00A8CC',
        celesteSuave: '#EAF8FC',
        amarillo: '#F4C542',
        blanco: '#FFFFFF',
        fondo: '#F4F9FC'
    };

    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const esVistaPropia = location.pathname === '/mis-evaluaciones';

    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [evaluaciones, setEvaluaciones] = useState([]);
    const [preguntasMap, setPreguntasMap] = useState({});
    const [empleadoMap, setEmpleadoMap] = useState({});
    const [jefeMap, setJefeMap] = useState({});

    const [filtroEmpleadoId, setFiltroEmpleadoId] = useState('');
    const [filtroNombre, setFiltroNombre] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [evaluacionSeleccionada, setEvaluacionSeleccionada] = useState(null);
    const [detallesEvaluacion, setDetallesEvaluacion] = useState([]);
    const [detalleGeneral, setDetalleGeneral] = useState(null);
    const [crearOpen, setCrearOpen] = useState(false);
    const [guardandoCreacion, setGuardandoCreacion] = useState(false);
    const [empleadoCrearId, setEmpleadoCrearId] = useState('');
    const [tipoCrear, setTipoCrear] = useState('3 MESES');
    const [comentarioCrear, setComentarioCrear] = useState('');
    const [preguntasDisponibles, setPreguntasDisponibles] = useState([]);
    const [calificacionesCrear, setCalificacionesCrear] = useState({});

    const normalizarTexto = (valor) => {
        if (!valor) return valor;
        return `${valor}`
            .replaceAll('Ã¡', 'á')
            .replaceAll('Ã©', 'é')
            .replaceAll('Ã­', 'í')
            .replaceAll('Ã³', 'ó')
            .replaceAll('Ãº', 'ú')
            .replaceAll('Ã±', 'ñ')
            .replaceAll('Ã', 'Á')
            .replaceAll('Ã‰', 'É')
            .replaceAll('Ã', 'Í')
            .replaceAll('Ã“', 'Ó')
            .replaceAll('Ãš', 'Ú')
            .replaceAll('Ã‘', 'Ñ');
    };

    const inferirTipoEvaluacion = (evaluacion) => {
        const texto = normalizarTexto(evaluacion?.observaciones || '').toLowerCase();
        if (texto.includes('3_me') || texto.includes('3 meses')) return '3 MESES';
        if (texto.includes('4_me') || texto.includes('4 meses')) return '4 MESES';
        if (texto.includes('semestral') || texto.includes('6 meses')) return '6 MESES';
        if (texto.includes('trimes')) return 'TRIMESTRAL';
        if (texto.includes('curso') || texto.includes('capacit')) return 'CURSOS';
        if (texto.includes('desempe')) return 'DESEMPEÑO';
        return 'DESEMPEÑO';
    };

    const formatFecha = (value) => {
        if (!value) return 'N/A';
        return new Date(value).toLocaleDateString('es-CR');
    };

    const resolverEmpleadoIdSesion = async () => {
        const usuarioId = user?.usuario_ID || user?.usuarioId || user?.Usuario_ID;
        let empleadoId = user?.empleado_ID || user?.empleadoId || user?.Empleado_ID;

        if (!empleadoId && usuarioId) {
            try {
                const empRes = await axios.get(`/api/Empleados/ObtenerPorUsuarioId/${usuarioId}`);
                empleadoId = empRes.data?.empleado_ID || empRes.data?.empleadoId || empRes.data?.Empleado_ID;
            } catch {
                const detalleRes = await axios.get(`/api/Empleados/DetallePersonalPorUsuario/${usuarioId}`);
                empleadoId = detalleRes.data?.empleadoId || detalleRes.data?.empleado_ID || detalleRes.data?.EmpleadoId;
            }
        }

        return empleadoId;
    };

    const calcularTiempoLaborado = (fechaInicio) => {
        if (!fechaInicio) return 'N/A';
        const inicio = new Date(fechaInicio);
        if (Number.isNaN(inicio.getTime())) return 'N/A';

        const hoy = new Date();
        let meses = (hoy.getFullYear() - inicio.getFullYear()) * 12 + (hoy.getMonth() - inicio.getMonth());
        if (hoy.getDate() < inicio.getDate()) meses -= 1;

        const anios = Math.max(0, Math.floor(meses / 12));
        const mesesRestantes = Math.max(0, meses % 12);
        return `${anios} año(s) y ${mesesRestantes} mes(es)`;
    };

    const obtenerComentarioEvaluacion = (evaluacion) => {
        const obs = normalizarTexto(evaluacion?.observaciones || '');
        if (!obs) return 'Sin comentarios registrados.';
        if (obs.includes('|')) return obs.split('|').slice(1).join('|').trim();
        return obs;
    };

    const mesesLaborados = (fechaInicio) => {
        if (!fechaInicio) return 0;
        const inicio = new Date(fechaInicio);
        if (Number.isNaN(inicio.getTime())) return 0;
        const hoy = new Date();
        let meses = (hoy.getFullYear() - inicio.getFullYear()) * 12 + (hoy.getMonth() - inicio.getMonth());
        if (hoy.getDate() < inicio.getDate()) meses -= 1;
        return Math.max(0, meses);
    };

    const obtenerNombreEmpleado = (emp, fallbackId = 'N/A') => {
        if (typeof emp === 'string' && emp.trim())
            return emp;

        return emp?.informacionPersonal?.nombre_Empleado
            || [
                emp?.informacionPersonal?.primer_Nombre,
                emp?.informacionPersonal?.apellido_Paterno,
                emp?.informacionPersonal?.apellido_Materno
            ].filter(Boolean).join(' ')
            || `Empleado #${fallbackId}`;
    };

    useEffect(() => {
        const cargar = async () => {
            try {
                setCargando(true);
                setError('');

                const empleadoSesionId = await resolverEmpleadoIdSesion();
                if (!empleadoSesionId) {
                    setEvaluaciones([]);
                    setDetalleGeneral(null);
                    setError('No se pudo identificar el empleado en sesión.');
                    return;
                }

                const [evalRes, preguntasRes] = await Promise.all([
                    axios.get(`/api/Evaluaciones/ObtenerTodos?empleadoSolicitanteId=${empleadoSesionId}&soloPropias=${esVistaPropia}`),
                    axios.get('/api/Preguntas_Evaluacion/ObtenerTodos')
                ]);

                const listaBase = (evalRes.data || [])
                    .slice()
                    .sort((a, b) => new Date(b.fecha_Evaluacion || b.fechaEvaluacion) - new Date(a.fecha_Evaluacion || a.fechaEvaluacion));

                const listaEvaluaciones = listaBase;

                setEvaluaciones(listaEvaluaciones);

                const preguntas = preguntasRes.data || [];
                const pMap = {};
                preguntas.forEach((p) => {
                    const id = p.pregunta_ID ?? p.preguntaId;
                    pMap[id] = normalizarTexto(p.texto_Pregunta ?? p.textoPregunta ?? `Pregunta #${id}`);
                });
                setPreguntasMap(pMap);
                setPreguntasDisponibles(
                    preguntas.map((p) => ({
                        id: p.pregunta_ID ?? p.preguntaId,
                        texto: normalizarTexto(p.texto_Pregunta ?? p.textoPregunta ?? '')
                    })).filter((p) => p.id)
                );

                const empleadoIds = [...new Set(listaEvaluaciones
                    .map((e) => e.empleado_ID ?? e.empleadoId)
                    .filter(Boolean))];

                const evaluadorUsuarioIds = [...new Set(listaEvaluaciones
                    .map((e) => e.usuario_Evaluador_ID ?? e.usuarioEvaluadorId)
                    .filter(Boolean))];

                const empleadosInfo = await Promise.all(
                    empleadoIds.map(async (id) => {
                        try {
                            const res = await axios.get(`/api/Empleados/DetallePersonalPorEmpleado/${id}`);
                            const d = res.data || {};
                            const nombre = [d.nombre, d.segundoNombre, d.apellidoPaterno, d.apellidoMaterno]
                                .filter((x) => x && `${x}`.trim().length > 0)
                                .join(' ')
                                .trim();
                            return [id, nombre || `Empleado #${id}`];
                        } catch {
                            return [id, `Empleado #${id}`];
                        }
                    })
                );

                const jefesInfo = await Promise.all(
                    evaluadorUsuarioIds.map(async (usuarioId) => {
                        try {
                            const res = await axios.get(`/api/Empleados/DetallePersonalPorUsuario/${usuarioId}`);
                            const d = res.data || {};
                            const nombre = [d.nombre, d.segundoNombre, d.apellidoPaterno, d.apellidoMaterno]
                                .filter((x) => x && `${x}`.trim().length > 0)
                                .join(' ')
                                .trim();
                            return [usuarioId, nombre || `Usuario #${usuarioId}`];
                        } catch {
                            return [usuarioId, `Usuario #${usuarioId}`];
                        }
                    })
                );

                setEmpleadoMap(Object.fromEntries(empleadosInfo));
                setJefeMap(Object.fromEntries(jefesInfo));

                if (esVistaPropia && empleadoSesionId) {
                    try {
                        const [detallePersonalRes, infoEmpleoRes] = await Promise.all([
                            axios.get(`/api/Empleados/DetallePersonalPorEmpleado/${empleadoSesionId}`),
                            axios.get(`/api/Empleados/InformacionEmpleo/${empleadoSesionId}`)
                        ]);

                        const dp = detallePersonalRes.data || {};
                        const ie = infoEmpleoRes.data || {};
                        const colaborador = [dp.nombre, dp.segundoNombre, dp.apellidoPaterno, dp.apellidoMaterno]
                            .filter((x) => x && `${x}`.trim().length > 0)
                            .join(' ')
                            .trim() || `Empleado #${empleadoSesionId}`;

                        setDetalleGeneral({
                            codigoEmpleado: empleadoSesionId,
                            colaborador,
                            jefe: ie?.detallesPuesto?.jefeInmediato || 'Sin asignar',
                            puesto: ie?.detallesIndividuales?.puesto || 'Sin asignar',
                            salario: ie?.detallesIndividuales?.salario ?? 0,
                            tiempoLaborado: calcularTiempoLaborado(dp.fechaInicio)
                        });
                    } catch {
                        setDetalleGeneral(null);
                    }
                } else {
                    setDetalleGeneral(null);
                }
            } catch (err) {
                setError(err?.response?.data || err.message || 'No se pudo cargar el histórico de evaluaciones.');
            } finally {
                setCargando(false);
            }
        };

        cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se conserva cuándo se ejecuta el efecto (comportamiento original)
    }, [esVistaPropia, user]);

    const verDetalles = async (evaluacion) => {
        try {
            const evaluacionId = evaluacion?.evaluacion_ID ?? evaluacion?.evaluacionId;
            const res = await axios.get(`/api/Evaluacion_Detalle/ObtenerPorEvaluacion/${evaluacionId}`);
            const detalles = (res.data || []).map((d) => {
                const preguntaId = d.pregunta_ID ?? d.preguntaId;
                const calificacion = d.calificacion ?? 0;
                return {
                    preguntaId,
                    pregunta: preguntasMap[preguntaId] || `Pregunta #${preguntaId}`,
                    calificacion
                };
            });
            setEvaluacionSeleccionada(evaluacion);
            setDetallesEvaluacion(detalles);
            setModalOpen(true);
        } catch {
            setEvaluacionSeleccionada(evaluacion);
            setDetallesEvaluacion([]);
            setModalOpen(true);
        }
    };

    const exportarPdfEvaluacion = async (evaluacion) => {
        const evaluacionId = evaluacion?.evaluacion_ID ?? evaluacion?.evaluacionId;
        const empleadoId = evaluacion?.empleado_ID ?? evaluacion?.empleadoId;
        const usuarioEvalId = evaluacion?.usuario_Evaluador_ID ?? evaluacion?.usuarioEvaluadorId;

        const empleado = empleadoMap[empleadoId];
        const nombreEmpleado = obtenerNombreEmpleado(empleado, empleadoId);
        const nombreJefe = jefeMap[usuarioEvalId] || `Usuario #${usuarioEvalId}`;
        const tipo = inferirTipoEvaluacion(evaluacion);
        const nota = Number(evaluacion?.promedio ?? 0).toFixed(2);
        const fecha = formatFecha(evaluacion?.fecha_Evaluacion ?? evaluacion?.fechaEvaluacion);
        const comentarios = obtenerComentarioEvaluacion(evaluacion);

        let detalles;
        try {
            const res = await axios.get(`/api/Evaluacion_Detalle/ObtenerPorEvaluacion/${evaluacionId}`);
            detalles = (res.data || []).map((d) => {
                const preguntaId = d.pregunta_ID ?? d.preguntaId;
                return {
                    pregunta: preguntasMap[preguntaId] || `Pregunta #${preguntaId}`,
                    calificacion: d.calificacion ?? 0
                };
            });
        } catch {
            detalles = [];
        }

        const doc = new jsPDF('p', 'pt', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const marginX = 40;

        doc.setFillColor(30, 58, 138);
        doc.rect(0, 0, pageWidth, 66, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(15);
        doc.text('SOPORTE PATITOS S.A.', marginX, 28);
        doc.setFontSize(10);
        doc.text('Departamento de Recursos Humanos | Evaluaciones de Desempeño', marginX, 46);

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(16);
        doc.text('Evaluación final del colaborador', marginX, 92);

        doc.setDrawColor(215, 227, 234);
        doc.roundedRect(marginX, 104, pageWidth - (marginX * 2), 170, 6, 6);
        doc.setFontSize(11);

        doc.text(`ID empleado: ${empleadoId}`, marginX + 12, 126);
        doc.text(`Nota final: ${nota}`, marginX + 320, 126);

        doc.text(`Evaluación número: ${evaluacionId}`, marginX + 12, 144);
        doc.text(`Fecha evaluación: ${fecha}`, marginX + 320, 144);

        const nombreLineas = doc.splitTextToSize(`Nombre colaborador: ${nombreEmpleado}`, 500);
        doc.text(nombreLineas, marginX + 12, 162);

        const jefeLineas = doc.splitTextToSize(`Jefe evaluador: ${nombreJefe}`, 500);
        doc.text(jefeLineas, marginX + 12, 184);

        doc.text(`Tipo evaluación: ${tipo}`, marginX + 12, 216);
        doc.text('Área responsable: RRHH', marginX + 320, 216);

        doc.text('Empresa: Soporte Patitos S.A.', marginX + 12, 234);
        doc.text('Estado documento: Aprobado', marginX + 320, 234);

        doc.setFontSize(10);
        doc.text('Comentarios de la evaluación:', marginX + 12, 258);
        const comentarioLineas = doc.splitTextToSize(comentarios, pageWidth - 220);
        doc.text(comentarioLineas, marginX + 150, 258);

        autoTable(doc, {
            startY: 286,
            head: [['Pregunta', 'Nota']],
            body: (detalles.length ? detalles : [{ pregunta: 'Sin detalle registrado', calificacion: '-' }]).map((d) => [d.pregunta, `${d.calificacion}`]),
            styles: { fontSize: 9 },
            headStyles: { fillColor: [30, 58, 138] }
        });

        const y = (doc.lastAutoTable?.finalY || 360) + 56;
        const selloFecha = new Date().toLocaleString('es-CR');

        const firmaAncho = 160;
        const separacion = 18;
        const x1 = marginX;
        const x2 = x1 + firmaAncho + separacion;
        const x3 = x2 + firmaAncho + separacion;

        const dibujarFirma = (x, titulo, firmante) => {
            doc.setDrawColor(200, 210, 222);
            doc.roundedRect(x, y, firmaAncho, 62, 5, 5);
            doc.setFontSize(9);
            doc.text(titulo, x + 8, y + 16);
            doc.setFontSize(10);
            const nombreCorto = `${firmante}`.length > 22 ? `${firmante}`.substring(0, 22) + '…' : `${firmante}`;
            doc.text(nombreCorto, x + 8, y + 33);
            doc.setFontSize(8);
            doc.text(`Firmado: ${selloFecha}`, x + 8, y + 49);
            doc.line(x + 8, y + 56, x + firmaAncho - 8, y + 56);
        };

        dibujarFirma(x1, 'Firma Jefe', nombreJefe);
        dibujarFirma(x2, 'Firma Empleado', nombreEmpleado);
        dibujarFirma(x3, 'Firma RRHH', 'RRHH Corporativo');

        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('Documento generado automáticamente por Soporte Patitos S.A.', marginX, y + 84);

        doc.save(`evaluacion_final_${empleadoId}_${evaluacionId}.pdf`);
    };

    const evaluacionesConNumero = useMemo(() => {
        const agrupado = {};

        const ordenAsc = [...evaluaciones].sort((a, b) => new Date(a.fecha_Evaluacion || a.fechaEvaluacion) - new Date(b.fecha_Evaluacion || b.fechaEvaluacion));
        ordenAsc.forEach((ev) => {
            const empId = ev.empleado_ID ?? ev.empleadoId;
            if (!agrupado[empId]) agrupado[empId] = [];
            agrupado[empId].push(ev);
        });

        const numeroMap = new Map();
        Object.entries(agrupado).forEach(([empId, lista]) => {
            lista.forEach((ev, idx) => {
                const id = ev.evaluacion_ID ?? ev.evaluacionId;
                numeroMap.set(id, idx + 1);
            });
        });

        return evaluaciones
            .map((ev) => {
                const empleadoId = ev.empleado_ID ?? ev.empleadoId;
                const usuarioEvalId = ev.usuario_Evaluador_ID ?? ev.usuarioEvaluadorId;
                const empleado = empleadoMap[empleadoId];
                const id = ev.evaluacion_ID ?? ev.evaluacionId;
                return {
                    ...ev,
                    empleadoId,
                    evaluacionId: id,
                    numeroEvaluacion: numeroMap.get(id) || 1,
                    nombre: obtenerNombreEmpleado(empleado, empleadoId),
                    jefe: jefeMap[usuarioEvalId] || `Usuario #${usuarioEvalId}`,
                    tipo: inferirTipoEvaluacion(ev),
                    nota: Number(ev?.promedio ?? 0).toFixed(2),
                    fechaTexto: formatFecha(ev?.fecha_Evaluacion ?? ev?.fechaEvaluacion),
                    comentario: obtenerComentarioEvaluacion(ev)
                };
            })
            .filter((e) => {
                const idOk = esVistaPropia || !filtroEmpleadoId || `${e.empleadoId}`.includes(filtroEmpleadoId.trim());
                const nombreOk = !filtroNombre || (e.nombre || '').toLowerCase().includes(filtroNombre.toLowerCase().trim());
                return idOk && nombreOk;
            });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se conserva cuándo se ejecuta el efecto (comportamiento original)
    }, [evaluaciones, empleadoMap, jefeMap, filtroEmpleadoId, filtroNombre, esVistaPropia]);

    const empleadosACargo = useMemo(() => {
        const map = new Map();
        evaluaciones.forEach((e) => {
            const empleadoId = e.empleado_ID ?? e.empleadoId;
            if (!empleadoId) return;
            if (!map.has(empleadoId)) {
                map.set(empleadoId, obtenerNombreEmpleado(empleadoMap[empleadoId], empleadoId));
            }
        });
        return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
    }, [evaluaciones, empleadoMap]);

    const crearEvaluacionManual = async () => {
        try {
            if (!empleadoCrearId) {
                setError('Debe seleccionar un colaborador a cargo.');
                return;
            }

            const empleadoIdNum = Number(empleadoCrearId);
            const usuarioEvaluadorId = user?.usuario_ID || user?.usuarioId || user?.Usuario_ID;
            if (!usuarioEvaluadorId) {
                setError('No se pudo identificar el usuario evaluador.');
                return;
            }

            const detalleRes = await axios.get(`/api/Empleados/DetallePersonalPorEmpleado/${empleadoIdNum}`);
            const fechaInicio = detalleRes.data?.fechaInicio;
            const meses = mesesLaborados(fechaInicio);

            const evalsEmpleado = evaluaciones.filter((e) => (e.empleado_ID ?? e.empleadoId) === empleadoIdNum);

            if (tipoCrear === '3 MESES' && meses < 3) {
                setError('No se puede crear evaluación de 3 meses: el colaborador aún no cumple 3 meses desde ingreso/cambio de puesto.');
                return;
            }

            if (tipoCrear === '4 MESES') {
                const fallo3m = evalsEmpleado.some((e) => inferirTipoEvaluacion(e) === '3 MESES' && Number(e?.promedio ?? 0) < 80);
                if (!fallo3m) {
                    setError('La evaluación de 4 meses solo aplica si reprobó la de 3 meses con extensión.');
                    return;
                }
            }

            if (tipoCrear === '6 MESES') {
                const mesActual = new Date().getMonth() + 1;
                if (mesActual !== 1 && mesActual !== 7) {
                    setError('Las evaluaciones de 6 meses solo se crean en enero y julio.');
                    return;
                }
            }

            const observacionesBase = tipoCrear === '3 MESES'
                ? 'EVALUACION_PRIMEROS_3_MESES'
                : (tipoCrear === '4 MESES' ? 'EVALUACION_4_MESES' : 'EVALUACION_SEMESTRAL');

            const preguntasConNivel = preguntasDisponibles.map((p) => ({
                preguntaId: p.id,
                calificacion: Number(calificacionesCrear[p.id] ?? 8)
            }));

            const faltantes = preguntasConNivel.filter((x) => x.calificacion < 1 || x.calificacion > 10);
            if (faltantes.length > 0) {
                setError('Debe asignar nivel de 1 a 10 a todas las preguntas.');
                return;
            }

            setGuardandoCreacion(true);
            const crearRes = await axios.post('/api/Evaluaciones/CrearEvaluacion', {
                empleado_ID: empleadoIdNum,
                usuario_Evaluador_ID: Number(usuarioEvaluadorId),
                observaciones: `[MANUAL] ${observacionesBase}${comentarioCrear?.trim() ? ` | ${comentarioCrear.trim()}` : ''}`
            });

            const evaluacionId = crearRes.data?.evaluacionId;
            if (!evaluacionId) {
                throw new Error('No se pudo obtener el ID de la evaluación creada.');
            }

            await Promise.all(preguntasConNivel.map((item) => axios.post('/api/Evaluacion_Detalle/CrearDetalle', {
                evaluacion_ID: evaluacionId,
                pregunta_ID: item.preguntaId,
                calificacion: item.calificacion
            })));

            const promedio = preguntasConNivel.reduce((acc, x) => acc + x.calificacion, 0) / (preguntasConNivel.length || 1);
            await axios.put(`/api/Evaluaciones/ActualizarPromedio/${evaluacionId}`, Number(promedio.toFixed(2)));

            setCrearOpen(false);
            setEmpleadoCrearId('');
            setTipoCrear('3 MESES');
            setComentarioCrear('');
            setCalificacionesCrear({});
            window.location.reload();
        } catch (err) {
            setError(err?.response?.data || err.message || 'No se pudo crear la evaluación.');
        } finally {
            setGuardandoCreacion(false);
        }
    };

    if (cargando) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: colors.fondo }}>
            <Box sx={{ backgroundColor: colors.negro, color: colors.blanco, py: 2, px: 2, display: 'flex', alignItems: 'center', borderBottom: `3px solid ${colors.amarillo}` }}>
                <IconButton onClick={() => navigate('/home')} sx={{ color: colors.blanco }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography sx={{ ml: 1, fontSize: 28, fontWeight: 300 }}>{esVistaPropia ? 'Mis evaluaciones' : 'Histórico de evaluaciones'}</Typography>
            </Box>

            <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: '1200px', mx: 'auto' }}>
                {error ? (
                    <Card sx={{ border: '1px solid #F1C0C0', borderRadius: '12px', backgroundColor: colors.blanco }}>
                        <CardContent>
                            <Typography sx={{ color: '#B91C1C' }}>{error}</Typography>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {esVistaPropia && detalleGeneral && (
                            <Card sx={{ border: `1px solid ${colors.celeste}`, borderRadius: '12px', mb: 2, backgroundColor: colors.blanco }}>
                                <CardContent>
                                    <Typography sx={{ fontWeight: 700, color: colors.azul, mb: 2 }}>Detalles generales</Typography>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
                                        <Campo label="Código empleado" valor={detalleGeneral.codigoEmpleado} />
                                        <Campo label="Colaborador" valor={detalleGeneral.colaborador} />
                                        <Campo label="Jefe" valor={detalleGeneral.jefe} />
                                        <Campo label="Puesto" valor={detalleGeneral.puesto} />
                                        <Campo label="Salario" valor={Number(detalleGeneral.salario || 0).toLocaleString('es-CR', { style: 'currency', currency: 'CRC' })} />
                                        <Campo label="Tiempo laborado" valor={detalleGeneral.tiempoLaborado} />
                                    </Box>
                                </CardContent>
                            </Card>
                        )}

                        <Card sx={{ border: `1px solid ${colors.celeste}`, borderRadius: '12px', mb: 2, backgroundColor: colors.blanco }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1.5, flexWrap: 'wrap' }}>
                                    <Typography sx={{ fontWeight: 700, color: colors.azul }}>{esVistaPropia ? 'Evaluaciones' : 'Evaluaciones por empleado'}</Typography>
                                    {!esVistaPropia && (
                                        <Button variant="contained" onClick={() => {
                                            const init = {};
                                            preguntasDisponibles.forEach((p) => { init[p.id] = 8; });
                                            setCalificacionesCrear(init);
                                            setCrearOpen(true);
                                        }} sx={{ backgroundColor: colors.azul }}>
                                            Crear evaluación
                                        </Button>
                                    )}
                                </Box>
                                {!esVistaPropia && (
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '220px 1fr' }, gap: 1.5, mb: 2 }}>
                                        <TextField
                                            label="ID empleado"
                                            size="small"
                                            value={filtroEmpleadoId}
                                            onChange={(e) => setFiltroEmpleadoId(e.target.value)}
                                        />
                                        <TextField
                                            label="Nombre"
                                            size="small"
                                            value={filtroNombre}
                                            onChange={(e) => setFiltroNombre(e.target.value)}
                                        />
                                    </Box>
                                )}
                                <Box sx={{ overflowX: 'auto' }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700 }}>ID empleado</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Evaluación número</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Jefe</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Tipo evaluación</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Nota</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Acción</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {evaluacionesConNumero.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={8} sx={{ color: '#64748B' }}>
                                                        No hay evaluaciones registradas para este colaborador.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                evaluacionesConNumero.map((e) => {
                                                    return (
                                                        <TableRow key={e.evaluacionId}>
                                                            <TableCell>{e.empleadoId}</TableCell>
                                                            <TableCell>{e.numeroEvaluacion}</TableCell>
                                                            <TableCell>{e.nombre}</TableCell>
                                                            <TableCell>{e.jefe}</TableCell>
                                                            <TableCell>{e.tipo}</TableCell>
                                                            <TableCell>{e.nota}</TableCell>
                                                            <TableCell>{e.fechaTexto}</TableCell>
                                                            <TableCell>
                                                                <Button size="small" variant="outlined" onClick={() => verDetalles(e)} sx={{ mr: 1, borderColor: colors.azul, color: colors.azul, '&:hover': { borderColor: colors.celeste, backgroundColor: colors.celesteSuave } }}>
                                                                    Ver detalles
                                                                </Button>
                                                                <Button size="small" variant="contained" onClick={() => exportarPdfEvaluacion(e)} sx={{ backgroundColor: colors.azul }}>
                                                                    Exportar PDF
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            )}
                                        </TableBody>
                                    </Table>
                                </Box>
                            </CardContent>
                        </Card>
                    </>
                )}
            </Box>

            <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="md">
                <DialogTitle>
                    Detalle de evaluación #{evaluacionSeleccionada?.evaluacion_ID ?? evaluacionSeleccionada?.evaluacionId}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 2, p: 1.5, border: '1px solid #E5ECF3', borderRadius: '8px', backgroundColor: '#FAFCFE' }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#1E3A8A', mb: 0.5 }}>Comentarios</Typography>
                        <Typography sx={{ fontSize: 13 }}>
                            {obtenerComentarioEvaluacion(evaluacionSeleccionada)}
                        </Typography>
                    </Box>
                    {detallesEvaluacion.length === 0 ? (
                        <Typography sx={{ color: '#64748B' }}>No hay preguntas detalladas registradas para esta evaluación.</Typography>
                    ) : (
                        <Box sx={{ overflowX: 'auto' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Pregunta</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Calificación</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {detallesEvaluacion.map((d, idx) => (
                                        <TableRow key={`${d.preguntaId}-${idx}`}>
                                            <TableCell>{d.pregunta}</TableCell>
                                            <TableCell>{d.calificacion}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={crearOpen} onClose={() => setCrearOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Crear evaluación</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'grid', gap: 1.5, mt: 1 }}>
                        <FormControl size="small" fullWidth>
                            <InputLabel>Colaborador a cargo</InputLabel>
                            <Select
                                label="Colaborador a cargo"
                                value={empleadoCrearId}
                                onChange={(e) => setEmpleadoCrearId(e.target.value)}
                            >
                                {empleadosACargo.map((emp) => (
                                    <MenuItem key={emp.id} value={emp.id}>{emp.id} - {emp.nombre}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl size="small" fullWidth>
                            <InputLabel>Tipo evaluación</InputLabel>
                            <Select
                                label="Tipo evaluación"
                                value={tipoCrear}
                                onChange={(e) => setTipoCrear(e.target.value)}
                            >
                                <MenuItem value="3 MESES">3 MESES</MenuItem>
                                <MenuItem value="4 MESES">4 MESES</MenuItem>
                                <MenuItem value="6 MESES">6 MESES</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            label="Comentario"
                            size="small"
                            multiline
                            minRows={3}
                            value={comentarioCrear}
                            onChange={(e) => setComentarioCrear(e.target.value)}
                        />

                        <Typography sx={{ fontWeight: 700, color: colors.azul, mt: 1 }}>Preguntas y niveles</Typography>
                        <Box sx={{ maxHeight: 260, overflowY: 'auto', border: '1px solid #E5ECF3', borderRadius: '8px', p: 1 }}>
                            {preguntasDisponibles.map((p) => (
                                <Box key={p.id} sx={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 1, alignItems: 'center', py: 0.7 }}>
                                    <Typography sx={{ fontSize: 13 }}>{p.texto || `Pregunta #${p.id}`}</Typography>
                                    <FormControl size="small" fullWidth>
                                        <Select
                                            value={calificacionesCrear[p.id] ?? 8}
                                            onChange={(e) => setCalificacionesCrear((prev) => ({ ...prev, [p.id]: Number(e.target.value) }))}
                                        >
                                            {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                                                <MenuItem key={`${p.id}-${n}`} value={n}>{n}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCrearOpen(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={crearEvaluacionManual} disabled={guardandoCreacion} sx={{ backgroundColor: colors.azul }}>
                        Crear
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

const Campo = ({ label, valor }) => (
    <Box sx={{ border: '1px solid #E5ECF3', borderRadius: '10px', p: 1.2, backgroundColor: '#FAFCFE' }}>
        <Typography sx={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{label}</Typography>
        <Typography sx={{ fontSize: 14, color: '#0F172A', fontWeight: 700 }}>
            {valor && `${valor}`.trim().length > 0 ? valor : 'Sin asignar'}
        </Typography>
    </Box>
);

export default Evaluaciones;
