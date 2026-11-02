import { useState, useEffect, useCallback } from 'react';
import { instalacionesService } from '../../../../models/Paquetes/ServiciosPlanes/CU22_ProgramacionInstalaciones/instalacionesModel';
import { describeApiError } from '../../../../services/apiClient';

/**
 * Hook Controlador para el Caso de Uso 22 (Programar Instalación y Asignar Técnico).
 * Gestiona el listado de solicitudes, disponibilidad de técnicos, prevención de cruce
 * de horarios y el envío del formulario de agendamiento.
 */
export function useInstalacionesController() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados del modal y agendamiento
  const [showModal, setShowModal] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Filtro de tabla: 'TODOS' | 'PENDIENTE' | 'PROGRAMADA'
  const [filtroEstado, setFiltroEstado] = useState('TODOS');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await instalacionesService.fetchInstalaciones();
      setSolicitudes(data.solicitudes || []);
      setTecnicos(data.tecnicos || []);
      setAgenda(data.agenda || []);
    } catch (err) {
      setSolicitudes([]);
      setTecnicos([]);
      setAgenda([]);
      setError(describeApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await instalacionesService.fetchInstalaciones();
        if (!ignore) {
          setSolicitudes(data.solicitudes || []);
          setTecnicos(data.tecnicos || []);
          setAgenda(data.agenda || []);
        }
      } catch (err) {
        if (!ignore) {
          setError(describeApiError(err));
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const openProgramarModal = (solicitud) => {
    setSelectedSolicitud(solicitud);
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setShowModal(false);
    setSelectedSolicitud(null);
    setFormError(null);
  };

  /**
   * Verifica si existe un cruce de horario para un técnico en una fecha y hora determinadas.
   * @param {number|string} tecnicoId
   * @param {string} fecha YYYY-MM-DD
   * @param {string} hora HH:mm
   * @returns {boolean} true si ya está ocupado
   */
  const checkConflictoHorario = useCallback((tecnicoId, fecha, hora) => {
    if (!tecnicoId || !fecha || !hora) return false;
    const horaNormalizada = hora.slice(0, 5);
    return agenda.some((item) =>
      String(item.tecnico_id) === String(tecnicoId)
      && item.fecha_programada === fecha
      && item.hora_programada === horaNormalizada
      && item.estado_instalacion === 'PROGRAMADA'
    );
  }, [agenda]);

  /**
   * Obtiene la lista de horarios ocupados de un técnico en una fecha específica.
   */
  const getHorariosOcupados = useCallback((tecnicoId, fecha) => {
    if (!tecnicoId || !fecha) return [];
    return agenda
      .filter((item) =>
        String(item.tecnico_id) === String(tecnicoId)
        && item.fecha_programada === fecha
        && item.estado_instalacion === 'PROGRAMADA'
      )
      .map((item) => item.hora_programada);
  }, [agenda]);

  const handleProgramar = async (payload) => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await instalacionesService.programarInstalacion(payload);
      setShowModal(false);
      setSelectedSolicitud(null);
      setSuccessMessage('Orden de instalación programada y técnico asignado exitosamente.');

      await loadData();

      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);

      return res;
    } catch (err) {
      const msg = describeApiError(err);
      setFormError(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const solicitudesFiltradas = solicitudes.filter((s) => {
    if (filtroEstado === 'TODOS') return true;
    return s.estado_solicitud === filtroEstado;
  });

  return {
    solicitudes: solicitudesFiltradas,
    totalSolicitudes: solicitudes.length,
    pendientesCount: solicitudes.filter((s) => s.estado_solicitud === 'PENDIENTE').length,
    programadasCount: solicitudes.filter((s) => s.estado_solicitud === 'PROGRAMADA').length,
    tecnicos,
    agenda,
    loading,
    error,
    showModal,
    selectedSolicitud,
    isSubmitting,
    formError,
    successMessage,
    filtroEstado,
    setFiltroEstado,
    openProgramarModal,
    closeModal,
    checkConflictoHorario,
    getHorariosOcupados,
    handleProgramar,
    reload: loadData,
  };
}
