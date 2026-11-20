import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, IconButton, Button, Divider, CircularProgress, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import EventIcon from '@mui/icons-material/Event';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Constants for styling
const HOUR_HEIGHT = 50; // px
const START_HOUR = 8;
const END_HOUR = 20;
const HOURS_COUNT = END_HOUR - START_HOUR + 1;

const hoursList = Array.from({ length: HOURS_COUNT }, (_, i) => {
  const hour = START_HOUR + i;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 12 ? 12 : hour;
  return `${displayHour < 10 ? '0' + displayHour : displayHour}:00 ${ampm}`;
});

// Horarios predefinidos
const HORARIOS_LABORALES = {
  1: { inicio: 10, fin: 18, nombre: 'Horario Normal (10:00 - 18:00)' },
  2: { inicio: 8, fin: 16, nombre: 'Horario Matutino (08:00 - 16:00)' },
  3: { inicio: 14, fin: 22, nombre: 'Horario Vespertino (14:00 - 22:00)' }
};

const MainWrapper = styled(Box)(({ theme }) => ({
  backgroundColor: '#f5f5f5',
  minHeight: '100vh',
  padding: theme.spacing(3),
  fontFamily: '"Segoe UI", "Helvetica", "Arial", sans-serif'
}));

const CalendarContainer = styled(Paper)(({ theme }) => ({
  backgroundColor: '#fff',
  border: '1px solid #e0e0e0',
  borderRadius: 0,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  height: '80vh',
}));

const Toolbox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1, 2),
  borderBottom: '1px solid #e0e0e0',
  gap: theme.spacing(1),
}));

const GridHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  borderBottom: '1px solid #e0e0e0',
  backgroundColor: '#fafafa',
}));

const TimeColumnHeader = styled(Box)({
  width: '60px',
  flexShrink: 0,
  borderRight: '1px solid #e0e0e0',
});

const DayHeader = styled(Box, { shouldForwardProp: (prop) => !['isOff', 'isToday'].includes(prop) })(({ theme, isOff, isToday }) => ({
  flex: 1,
  textAlign: 'center',
  padding: theme.spacing(1, 0),
  borderRight: '1px solid #e0e0e0',
  backgroundColor: isToday ? '#fff3cd' : (isOff ? '#eceff1' : 'transparent'),
  color: isOff ? '#1976d2' : '#d32f2f',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
}));

const GridBodyWrapper = styled(Box)({
  display: 'flex',
  flex: 1,
  overflowY: 'auto',
  position: 'relative'
});

const TimeColumn = styled(Box)({
  width: '60px',
  flexShrink: 0,
  borderRight: '1px solid #e0e0e0',
  backgroundColor: '#fafafa',
});

const TimeLabel = styled(Typography)({
  height: `${HOUR_HEIGHT}px`,
  fontSize: '0.75rem',
  color: '#757575',
  textAlign: 'right',
  paddingRight: '8px',
  transform: 'translateY(-10px)',
});

const DayColumn = styled(Box, { shouldForwardProp: (prop) => !['isOff'].includes(prop) })(({ isOff }) => ({
  flex: 1,
  borderRight: '1px solid #e0e0e0',
  position: 'relative',
  backgroundColor: isOff ? '#f5f5f5' : '#ffffff',
}));

const HourLine = styled(Box)({
  height: `${HOUR_HEIGHT}px`,
  borderBottom: '1px dotted #e0e0e0',
  width: '100%',
});

const EventBlock = styled(Box, { shouldForwardProp: (prop) => !['top', 'height', 'bgColor', 'borderColor'].includes(prop) })(
  ({ top, height, bgColor, borderColor }) => ({
    position: 'absolute',
    top: `${top}px`,
    width: '95%',
    left: '2.5%',
    height: `${height}px`,
    backgroundColor: bgColor,
    borderLeft: `4px solid ${borderColor}`,
    padding: '4px 6px',
    boxSizing: 'border-box',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    fontSize: '11px',
    color: '#000',
    lineHeight: 1.2
  })
);

const AllDayEvent = styled(Box)(({ theme, bgColor }) => ({
  backgroundColor: bgColor,
  color: '#fff',
  fontSize: '0.75rem',
  padding: '2px 4px',
  margin: '2px',
  borderRadius: '2px',
  textAlign: 'left',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  overflow: 'hidden'
}));

const Calendario = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [semanaActual, setSemanaActual] = useState(new Date());
  const [ausencias, setAusencias] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [tiposAusencia, setTiposAusencia] = useState([]);
  const [feriados, setFeriados] = useState([]);
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!user) return;
    cargarAusencias();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- se conserva cuándo se ejecuta el efecto (comportamiento original)
  }, [user]);

  const cargarAusencias = async () => {
    try {
      if (!user) return;

      const usuarioId = user?.usuario_ID || user?.usuarioId || user?.Usuario_ID;
      const empleadoIdSesion = user?.empleado_ID || user?.empleadoId || user?.Empleado_ID;

      setCargando(true);
      let id = empleadoIdSesion;

      if (!id && usuarioId) {
        const empRes = await axios.get(`/api/Empleados/ObtenerPorUsuarioId/${usuarioId}`);
        id = empRes.data?.empleado_ID || empRes.data?.empleadoId || empRes.data?.Empleado_ID;
      }

      if (id) {
        const [ausRes, tiposRes, feriadosRes] = await Promise.all([
          axios.get(`/api/Empleados/AusenciasEmpleado/${id}`),
          axios.get('/api/Empleados/TiposAusencia'),
          axios.get('/api/Empleados/Feriados')
        ]);
        console.log('Ausencias cargadas:', ausRes.data);
        console.log('Tipos de ausencia:', tiposRes.data);
        console.log('Feriados cargados:', feriadosRes.data);
        setAusencias(ausRes.data || []);
        setTiposAusencia(tiposRes.data || []);
        setFeriados(feriadosRes.data || []);
      }
    } catch (err) {
      console.warn("Error cargando ausencias", err);
      setAusencias([]);
    } finally {
      setCargando(false);
    }
  };

  // Obtener lunes de la semana
  const getLunesDelaSemana = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const semanaLunes = getLunesDelaSemana(semanaActual);
  const diasSemana = [];

  for (let i = 0; i < 7; i++) {
    const fecha = new Date(semanaLunes);
    fecha.setDate(fecha.getDate() + i);
    diasSemana.push(fecha);
  }

  const getSemanaAnterior = () => {
    const newDate = new Date(semanaActual);
    newDate.setDate(newDate.getDate() - 7);
    setSemanaActual(newDate);
  };

  const getSemananSiguiente = () => {
    const newDate = new Date(semanaActual);
    newDate.setDate(newDate.getDate() + 7);
    setSemanaActual(newDate);
  };

  const getHoy = () => {
    setSemanaActual(new Date());
  };

  const getAusenciasDelDia = (fecha) => {
    return ausencias.filter(a => {
      const fechaInicio = new Date(a.fecha_Inicio);
      const fechaFin = new Date(a.fecha_Fin);
      const diaActual = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
      return diaActual >= fechaInicio && diaActual <= fechaFin;
    });
  };

  const getFeriadoDelDia = (fecha) => {
    return feriados.find(f => {
      const fechaFeriado = new Date(f.fecha);
      const diaActual = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
      return fechaFeriado.getFullYear() === diaActual.getFullYear() &&
             fechaFeriado.getMonth() === diaActual.getMonth() &&
             fechaFeriado.getDate() === diaActual.getDate();
    });
  };

  const getColorAusencia = (tipo, estado) => {
    // Vacaciones - Naranja
    if (tipo?.toLowerCase().includes('vacacion')) return { bg: '#ffe8cc', border: '#ff9800', banner: '#ff9800' };
    // Feriado - Azul oscuro
    if (tipo?.toLowerCase().includes('feriado') || tipo?.toLowerCase().includes('festivo')) return { bg: '#e3f2fd', border: '#003366', banner: '#003366' };
    // Incapacidad - Amarillo
    if (tipo?.toLowerCase().includes('incapacidad')) return { bg: '#fff9c4', border: '#fbc02d', banner: '#fbc02d' };
    // Otras ausencias - Amarillo claro
    return { bg: '#fff3cd', border: '#ffc107', banner: '#ffc107' };
  };

  const getNombreTipoAusencia = (tipoId) => {
    const tipo = tiposAusencia.find(t => t.tipo_Ausencia_ID === tipoId);
    return tipo?.nombre_Ausencia || 'Ausencia';
  };

  const formatearRango = () => {
    const lunesStr = semanaLunes.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' });
    const domingoDate = new Date(semanaLunes);
    domingoDate.setDate(domingoDate.getDate() + 6);
    const domingoStr = domingoDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' });
    return `${lunesStr} - ${domingoStr}`;
  };

  const esHoy = (fecha) => {
    const hoy = new Date();
    return fecha.getDate() === hoy.getDate() &&
           fecha.getMonth() === hoy.getMonth() &&
           fecha.getFullYear() === hoy.getFullYear();
  };

  const esFinDeSemana = (fecha) => {
    const day = fecha.getDay();
    return day === 0 || day === 6;
  };

  const handleDatePickerOpen = () => {
    const currentDate = semanaActual.toISOString().split('T')[0];
    setSelectedDate(currentDate);
    setOpenDatePicker(true);
  };

  const handleDatePickerClose = () => {
    setOpenDatePicker(false);
  };

  const handleDatePickerConfirm = () => {
    if (selectedDate) {
      setSemanaActual(new Date(selectedDate));
      setOpenDatePicker(false);
    }
  };

  return (
    <MainWrapper>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate('/tiempo-ausencias')} sx={{ color: '#000' }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" color="textPrimary" fontWeight="medium" sx={{ color: '#000' }}>
          Tiempo
        </Typography>
      </Box>

      <CalendarContainer elevation={1}>
        <Toolbox>
          <Tooltip title="Filtrar por tipo de evento">
            <IconButton size="small" disabled sx={{ cursor: 'not-allowed' }}><EventIcon fontSize="small"/></IconButton>
          </Tooltip>
          <Tooltip title="Seleccionar fecha">
            <IconButton size="small" onClick={handleDatePickerOpen}><CalendarTodayIcon fontSize="small"/></IconButton>
          </Tooltip>
          <Tooltip title="Cambiar vista" disabled>
            <IconButton size="small" disabled sx={{ cursor: 'not-allowed' }}><ViewModuleIcon fontSize="small"/></IconButton>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          <IconButton size="small" onClick={getSemanaAnterior}><ChevronLeftIcon /></IconButton>
          <IconButton size="small" onClick={getSemananSiguiente}><ChevronRightIcon /></IconButton>
          <Button variant="outlined" size="small" onClick={getHoy} sx={{ ml: 1, textTransform: 'none', borderColor: '#bdbdbd', color: '#424242' }}>
            Hoy
          </Button>
          <Typography variant="body2" sx={{ ml: 2, fontWeight: 'bold' }}>
            {formatearRango()}
          </Typography>
        </Toolbox>

        {cargando ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Header con días */}
            <GridHeader>
              <TimeColumnHeader />
              {diasSemana.map((dia, idx) => {
                const ausenciasHoy = getAusenciasDelDia(dia);
                const feriadoHoy = getFeriadoDelDia(dia);
                const tieneAusencia = ausenciasHoy.length > 0;
                const diaStr = dia.toLocaleDateString('es-ES', { weekday: 'short', month: 'short', day: 'numeric' });
                const esFeriado = feriadoHoy || (tieneAusencia && ausenciasHoy.some(a => getNombreTipoAusencia(a.tipo_Ausencia_ID)?.toLowerCase().includes('feriado')));

                return (
                  <DayHeader key={idx} isOff={esFinDeSemana(dia)} isToday={esHoy(dia)}>
                    <Typography variant="caption" sx={{ fontSize: '0.8rem', fontWeight: 'bold', color: esFeriado ? '#003366' : 'inherit' }}>
                      {diaStr}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#757575' }}>
                      {(tieneAusencia || feriadoHoy) ? `${ausenciasHoy.length + (feriadoHoy ? 1 : 0)} (A)` : '0 (0)'}
                    </Typography>
                    <Box sx={{ width: '100%', mt: 1, minHeight: '24px' }}>
                      {feriadoHoy && (
                        <Tooltip key="feriado" title={`${feriadoHoy.nombre_Feriado} - Feriado`}>
                          <AllDayEvent bgColor="#003366">
                            {feriadoHoy.nombre_Feriado.substring(0, 20)}
                          </AllDayEvent>
                        </Tooltip>
                      )}
                      {tieneAusencia && ausenciasHoy.map((aus, i) => {
                        const color = getColorAusencia(getNombreTipoAusencia(aus.tipo_Ausencia_ID), aus.estado_Solicitud);
                        return (
                          <Tooltip key={i} title={`${getNombreTipoAusencia(aus.tipo_Ausencia_ID)} - ${aus.estado_Solicitud}`}>
                            <AllDayEvent bgColor={color.banner}>
                              {getNombreTipoAusencia(aus.tipo_Ausencia_ID).substring(0, 20)}
                            </AllDayEvent>
                          </Tooltip>
                        );
                      })}
                    </Box>
                  </DayHeader>
                );
              })}
            </GridHeader>

            {/* Cuerpo del calendario */}
            <GridBodyWrapper>
              <TimeColumn>
                {hoursList.map((time, idx) => (
                  <Box key={idx} sx={{ position: 'relative', height: HOUR_HEIGHT }}>
                    {idx > 0 && <TimeLabel>{time}</TimeLabel>}
                  </Box>
                ))}
              </TimeColumn>

              {diasSemana.map((dia, dayIdx) => {
                const ausenciasDelDia = getAusenciasDelDia(dia);
                const esFinSemana = esFinDeSemana(dia);
                const horarioLaboral = HORARIOS_LABORALES[1]; // Horario por defecto 10:00-18:00

                return (
                  <DayColumn key={dayIdx} isOff={esFinSemana}>
                    {/* Líneas de las horas */}
                    {Array.from({ length: HOURS_COUNT }).map((_, idx) => (
                      <HourLine key={idx} />
                    ))}

                    {/* Mostrar feriado si existe */}
                    {getFeriadoDelDia(dia) && (
                      <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: '2.5%',
                        width: '95%',
                        height: '100%',
                        backgroundColor: '#e3f2fd',
                        borderLeft: '4px solid #003366',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px',
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}>
                        <Tooltip title={`${getFeriadoDelDia(dia)?.nombre_Feriado} - Feriado`}>
                          <Typography sx={{
                            fontWeight: 'bold',
                            fontSize: '11px',
                            color: '#003366',
                            textAlign: 'center',
                            whiteSpace: 'wrap',
                            wordBreak: 'break-word'
                          }}>
                            {getFeriadoDelDia(dia)?.nombre_Feriado}
                          </Typography>
                        </Tooltip>
                      </Box>
                    )}

                    {/* Si es fin de semana y no hay feriado, mostrar gris */}
                    {esFinSemana && !ausenciasDelDia.length && !getFeriadoDelDia(dia) && (
                      <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: '2.5%',
                        width: '95%',
                        height: '100%',
                        backgroundColor: '#f5f5f5',
                        opacity: 0.7,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Typography sx={{ color: '#999', fontSize: '12px', fontWeight: 'bold' }}>
                          DESCANSO
                        </Typography>
                      </Box>
                    )}

                    {/* Mostrar ausencias */}
                    {ausenciasDelDia.map((ausencia, ausIdx) => {
                      const tipoAusencia = getNombreTipoAusencia(ausencia.tipo_Ausencia_ID);
                      const color = getColorAusencia(tipoAusencia, ausencia.estado_Solicitud);

                      // Si es feriado o vacaciones, mostrar todo el día
                      const esFeriado = tipoAusencia?.toLowerCase().includes('feriado') || tipoAusencia?.toLowerCase().includes('festivo');
                      const esVacaciones = tipoAusencia?.toLowerCase().includes('vacacion');

                      if (esFeriado || esVacaciones) {
                        return (
                          <Box key={ausIdx} sx={{
                            position: 'absolute',
                            top: 0,
                            left: '2.5%',
                            width: '95%',
                            height: '100%',
                            backgroundColor: color.bg,
                            borderLeft: `4px solid ${color.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px',
                            boxSizing: 'border-box',
                            overflow: 'hidden',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}>
                            <Tooltip title={`${tipoAusencia} - ${ausencia.estado_Solicitud}`}>
                              <Typography sx={{
                                fontWeight: 'bold',
                                fontSize: '11px',
                                color: color.border,
                                textAlign: 'center',
                                whiteSpace: 'wrap',
                                wordBreak: 'break-word'
                              }}>
                                {tipoAusencia.substring(0, 25)}
                              </Typography>
                            </Tooltip>
                          </Box>
                        );
                      }

                      // Para otras ausencias, mostrar en el horario laboral
                      const top = (horarioLaboral.inicio - START_HOUR) * HOUR_HEIGHT;
                      const height = (horarioLaboral.fin - horarioLaboral.inicio) * HOUR_HEIGHT;

                      return (
                        <Tooltip key={ausIdx} title={`${tipoAusencia} - ${ausencia.estado_Solicitud}`}>
                          <EventBlock
                            top={top}
                            height={height}
                            bgColor={color.bg}
                            borderColor={color.border}
                          >
                            <strong>{tipoAusencia.substring(0, 20)}</strong>
                            <div style={{ fontSize: '10px' }}>{ausencia.estado_Solicitud}</div>
                          </EventBlock>
                        </Tooltip>
                      );
                    })}

                    {/* Si no hay ausencias y es día de trabajo, mostrar horario laboral en celeste */}
                    {!ausenciasDelDia.length && !esFinSemana && (
                      <EventBlock
                        top={(horarioLaboral.inicio - START_HOUR) * HOUR_HEIGHT}
                        height={(horarioLaboral.fin - horarioLaboral.inicio) * HOUR_HEIGHT}
                        bgColor="#e1f5fe"
                        borderColor="#0288d1"
                      >
                        <strong>{horarioLaboral.inicio}:00 AM</strong>
                        <div>{horarioLaboral.nombre}</div>
                      </EventBlock>
                    )}
                  </DayColumn>
                );
              })}
            </GridBodyWrapper>
          </>
        )}
      </CalendarContainer>

      {/* Date Picker Dialog */}
      <Dialog open={openDatePicker} onClose={handleDatePickerClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#000' }}>
          Seleccionar Fecha
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            fullWidth
            slotProps={{
              input: {
                inputProps: {
                  min: new Date(new Date().getFullYear() - 1, 0, 1).toISOString().split('T')[0],
                  max: new Date(new Date().getFullYear() + 1, 11, 31).toISOString().split('T')[0]
                }
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleDatePickerClose} sx={{ color: '#666' }}>
            Cancelar
          </Button>
          <Button onClick={handleDatePickerConfirm} variant="contained" sx={{ backgroundColor: '#0288d1' }}>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </MainWrapper>
  );
};

export default Calendario;
