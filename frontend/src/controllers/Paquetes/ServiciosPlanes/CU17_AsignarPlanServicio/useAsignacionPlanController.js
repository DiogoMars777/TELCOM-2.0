import { useState, useEffect } from 'react';
import { asignacionPlanService } from '../../../../models/Paquetes/ServiciosPlanes/CU17_AsignarPlanServicio/asignacionPlanModel';
import { describeApiError } from '../../../../services/apiClient';

const MOTIVO_MAX = 255;

/**
 * CU17 - Controlador de asignación / cambio de plan de un servicio.
 *
 * El backend registra el usuario autenticado y la fecha; el frontend NUNCA
 * envía `user_id` ni `fecha_inicio`.
 */
export function useAsignacionPlanController() {
  const [servicios, setServicios] = useState([]);
  const [loadingServicios, setLoadingServicios] = useState(false);
  const [errorServicios, setErrorServicios] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  const [selectedServicio, setSelectedServicio] = useState(null);
  const [planesActivos, setPlanesActivos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState(null);

  const [form, setForm] = useState({ plan_id: '', motivo_cambio: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [aviso, setAviso] = useState(null);

  const buscarServicios = async () => {
    setLoadingServicios(true);
    setErrorServicios(null);
    try {
      const data = await asignacionPlanService.buscarServicios({ buscar: busqueda });
      setServicios(data);
    } catch (e) {
      setServicios([]);
      setErrorServicios(describeApiError(e));
    } finally {
      setLoadingServicios(false);
    }
  };

  useEffect(() => {
    buscarServicios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda]);

  const cargarPlanesActivos = async () => {
    try {
      const planes = await asignacionPlanService.fetchPlanesActivos();
      setPlanesActivos(planes);
    } catch (e) {
      setPlanesActivos([]);
      setErrorDetalle(describeApiError(e));
    }
  };

  const loadHistorial = async (servicioId) => {
    setLoadingDetalle(true);
    setErrorDetalle(null);
    try {
      const { servicio, asignaciones } = await asignacionPlanService.fetchHistorial(servicioId);
      setHistorial(asignaciones);
      if (servicio) {
        // Actualiza el "snapshot" mostrado con los datos confirmados por el backend.
        setSelectedServicio((prev) => ({ ...(prev ?? {}), ...servicio }));
      }
    } catch (e) {
      setHistorial([]);
      setErrorDetalle(describeApiError(e));
    } finally {
      setLoadingDetalle(false);
    }
  };

  const seleccionarServicio = async (servicio) => {
    setSelectedServicio(servicio);
    setForm({ plan_id: '', motivo_cambio: '' });
    setFormError(null);
    setAviso(null);
    await Promise.all([cargarPlanesActivos(), loadHistorial(servicio.id)]);
  };

  const cerrarDetalle = () => {
    setSelectedServicio(null);
    setHistorial([]);
    setForm({ plan_id: '', motivo_cambio: '' });
    setFormError(null);
    setAviso(null);
    setErrorDetalle(null);
  };

  const handleAsignar = async (e) => {
    e.preventDefault();
    if (!selectedServicio) return;
    setFormError(null);

    if (!form.plan_id) {
      setFormError('Selecciona un plan activo.');
      return;
    }
    if (form.motivo_cambio && form.motivo_cambio.length > MOTIVO_MAX) {
      setFormError(`El motivo no debe superar ${MOTIVO_MAX} caracteres.`);
      return;
    }

    setSubmitting(true);
    try {
      // Solo plan_id + motivo: el usuario y la fecha los pone el backend.
      await asignacionPlanService.asignarPlan(selectedServicio.id, {
        plan_id: Number(form.plan_id),
        motivo_cambio: form.motivo_cambio?.trim() || null,
      });
      setAviso('Plan asignado correctamente.');
      setForm({ plan_id: '', motivo_cambio: '' });
      await loadHistorial(selectedServicio.id);
    } catch (err) {
      setFormError(describeApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return {
    servicios,
    loadingServicios,
    errorServicios,
    busqueda,
    setBusqueda,
    selectedServicio,
    planesActivos,
    historial,
    loadingDetalle,
    errorDetalle,
    form,
    setForm,
    submitting,
    formError,
    aviso,
    setAviso,
    seleccionarServicio,
    cerrarDetalle,
    handleAsignar,
    reloadServicios: buscarServicios,
  };
}
