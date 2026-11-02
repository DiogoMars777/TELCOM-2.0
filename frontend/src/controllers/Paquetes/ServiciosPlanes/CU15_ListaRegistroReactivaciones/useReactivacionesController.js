import { useState, useEffect, useCallback } from 'react';
import { reactivacionesService } from '../../../../models/Paquetes/ServiciosPlanes/CU15_ListaRegistroReactivaciones/reactivacionesModel';
import { describeApiError } from '../../../../services/apiClient';

/**
 * Hook Controlador para el Caso de Uso 15 (Gestionar Reactivaciones).
 * Controla el ciclo de vida, estado de carga, listado de reactivaciones,
 * catálogo de servicios cortados y la invocación del servicio de reactivación.
 */
export function useReactivacionesController() {
  const [reactivaciones, setReactivaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado del modal y formulario
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);

  // Servicios en estado CORTADO disponibles para reactivación
  const [serviciosCortados, setServiciosCortados] = useState([]);
  const [loadingServicios, setLoadingServicios] = useState(true);
  const [serviciosError, setServiciosError] = useState(null);

  const loadReactivaciones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reactivacionesService.fetchReactivaciones();
      setReactivaciones(data);
    } catch (e) {
      setReactivaciones([]);
      setError(describeApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadServicios = useCallback(async () => {
    setLoadingServicios(true);
    setServiciosError(null);
    try {
      const data = await reactivacionesService.fetchServiciosCortados();
      setServiciosCortados(data ?? []);
    } catch (e) {
      setServiciosCortados([]);
      setServiciosError(describeApiError(e));
    } finally {
      setLoadingServicios(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const [reactivacionesData, serviciosData] = await Promise.all([
          reactivacionesService.fetchReactivaciones(),
          reactivacionesService.fetchServiciosCortados(),
        ]);
        if (!ignore) {
          setReactivaciones(reactivacionesData);
          setServiciosCortados(serviciosData ?? []);
        }
      } catch (e) {
        if (!ignore) {
          setReactivaciones([]);
          setError(describeApiError(e));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
          setLoadingServicios(false);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const openModal = (servicio = null) => {
    setServicioSeleccionado(servicio);
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setShowModal(false);
    setServicioSeleccionado(null);
    setFormError(null);
  };

  /**
   * Ejecuta la reactivación enviando el payload al backend vía apiClient (POST /api/cu15/reactivaciones).
   * @param {{ servicio_id: number, pago_id?: number|null, costo_reactivacion?: number, observaciones?: string|null }} payload
   */
  const handleReactivar = async (payload) => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      const response = await reactivacionesService.registrarReactivacion(payload);
      setShowModal(false);
      setServicioSeleccionado(null);
      setSuccessMessage('Servicio reactivado exitosamente.');

      // Recargar listados desde la base de datos real
      await Promise.all([loadReactivaciones(), loadServicios()]);

      // Limpiar mensaje de éxito después de 5 segundos
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);

      return response;
    } catch (err) {
      const msg = describeApiError(err);
      setFormError(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    reactivaciones,
    loading,
    error,
    showModal,
    openModal,
    closeModal,
    isSubmitting,
    formError,
    successMessage,
    setSuccessMessage,
    servicioSeleccionado,
    serviciosCortados,
    loadingServicios,
    serviciosError,
    handleReactivar,
    reload: loadReactivaciones,
    reloadServicios: loadServicios,
  };
}
