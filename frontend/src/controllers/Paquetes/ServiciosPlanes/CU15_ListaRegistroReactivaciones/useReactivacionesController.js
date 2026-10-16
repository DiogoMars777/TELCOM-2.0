import { useState, useEffect } from 'react';
import { reactivacionesService } from '../../../../models/Paquetes/ServiciosPlanes/CU15_ListaRegistroReactivaciones/reactivacionesModel';
import { describeApiError } from '../../../../services/apiClient';

export function useReactivacionesController() {
  const [reactivaciones, setReactivaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);       // Error de carga del listado
  const [formError, setFormError] = useState(null); // Error al registrar
  const [showModal, setShowModal] = useState(false);

  // Servicios reales para el selector (solo los CORTADOS pueden reactivarse).
  const [serviciosCortados, setServiciosCortados] = useState([]);
  const [loadingServicios, setLoadingServicios] = useState(false);
  const [serviciosError, setServiciosError] = useState(null);

  const [formReactivacion, setFormReactivacion] = useState({
    servicio_id: '',
    costo_reactivacion: 50.00,
    observaciones: '',
  });

  const loadReactivaciones = async () => {
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
  };

  const loadServicios = async () => {
    setLoadingServicios(true);
    setServiciosError(null);
    try {
      const data = await reactivacionesService.fetchServicios();
      setServiciosCortados((data ?? []).filter((s) => s.estado_servicio === 'CORTADO'));
    } catch (e) {
      setServiciosCortados([]);
      setServiciosError(describeApiError(e));
    } finally {
      setLoadingServicios(false);
    }
  };

  useEffect(() => {
    loadReactivaciones();
    loadServicios();
  }, []);

  const handleCrear = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);
    try {
      await reactivacionesService.registrarReactivacion({
        servicio_id: formReactivacion.servicio_id,
        costo_reactivacion: Number(formReactivacion.costo_reactivacion),
        observaciones: formReactivacion.observaciones,
      });
      // Solo se cierra el modal cuando el backend confirmó. Se recarga el
      // listado real en lugar de inventar el registro localmente.
      setShowModal(false);
      setFormReactivacion({ servicio_id: '', costo_reactivacion: 50.00, observaciones: '' });
      await Promise.all([loadReactivaciones(), loadServicios()]);
    } catch (err) {
      setFormError(describeApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return {
    reactivaciones,
    loading,
    error,
    formError,
    showModal,
    setShowModal,
    serviciosCortados,
    loadingServicios,
    serviciosError,
    formReactivacion,
    setFormReactivacion,
    handleCrear,
    reload: loadReactivaciones,
  };
}