import { useState, useEffect } from 'react';
import { asignacionPlanService } from '../../../../models/Paquetes/ServiciosPlanes/CU17_AsignarCambiarPlanInternet/asignacionPlanModel';
import { describeApiError } from '../../../../services/apiClient';

const emptyForm = { plan_id: '', motivo_cambio: '' };

export function useAsignacionPlanController() {
  const [servicios, setServicios] = useState([]);
  const [loadingServicios, setLoadingServicios] = useState(false);
  const [serviciosError, setServiciosError] = useState(null);

  const [planes, setPlanes] = useState([]);
  const [loadingPlanes, setLoadingPlanes] = useState(false);
  const [planesError, setPlanesError] = useState(null);

  const [servicioId, setServicioId] = useState('');

  const [servicio, setServicio] = useState(null);
  const [asignaciones, setAsignaciones] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [historialError, setHistorialError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadServicios = async () => {
    setLoadingServicios(true);
    setServiciosError(null);
    try {
      setServicios(await asignacionPlanService.fetchServicios());
    } catch (e) {
      setServicios([]);
      setServiciosError(describeApiError(e));
    } finally {
      setLoadingServicios(false);
    }
  };

  const loadPlanes = async () => {
    setLoadingPlanes(true);
    setPlanesError(null);
    try {
      const data = await asignacionPlanService.fetchPlanes();
      // Solo pueden asignarse planes activos (regla del backend, CU17).
      setPlanes((data ?? []).filter((p) => p.activo));
    } catch (e) {
      setPlanes([]);
      setPlanesError(describeApiError(e));
    } finally {
      setLoadingPlanes(false);
    }
  };

  const loadHistorial = async (id) => {
    if (!id) {
      setServicio(null);
      setAsignaciones([]);
      return;
    }
    setLoadingHistorial(true);
    setHistorialError(null);
    try {
      const data = await asignacionPlanService.fetchHistorial(id);
      setServicio(data?.servicio ?? null);
      setAsignaciones(data?.asignaciones ?? []);
    } catch (e) {
      setServicio(null);
      setAsignaciones([]);
      setHistorialError(describeApiError(e));
    } finally {
      setLoadingHistorial(false);
    }
  };

  useEffect(() => {
    loadServicios();
    loadPlanes();
  }, []);

  const seleccionarServicio = (value) => {
    setServicioId(value);
    setFormError(null);
    loadHistorial(value);
  };

  const openAsignar = () => {
    setForm(emptyForm);
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormError(null);
  };

  const handleAsignar = async (e) => {
    e.preventDefault();
    if (!servicioId) return;
    setSaving(true);
    setFormError(null);
    try {
      await asignacionPlanService.asignarPlan(servicioId, {
        plan_id: Number(form.plan_id),
        motivo_cambio: form.motivo_cambio?.trim() || undefined,
      });
      // Solo se cierra el modal cuando el backend confirmó; se recargan el
      // historial y la lista de servicios (su "snapshot" de plan cambió).
      closeModal();
      setForm(emptyForm);
      await Promise.all([loadHistorial(servicioId), loadServicios()]);
    } catch (err) {
      setFormError(describeApiError(err));
    } finally {
      setSaving(false);
    }
  };

  // Plan vigente (fecha_fin nula) para mostrarlo destacado.
  const planVigente = asignaciones.find((a) => !a.fecha_fin) ?? null;

  return {
    servicios,
    loadingServicios,
    serviciosError,
    planes,
    loadingPlanes,
    planesError,
    servicioId,
    servicio,
    asignaciones,
    planVigente,
    loadingHistorial,
    historialError,
    showModal,
    form,
    setForm,
    formError,
    saving,
    seleccionarServicio,
    openAsignar,
    closeModal,
    handleAsignar,
    reload: () => loadHistorial(servicioId),
  };
}
