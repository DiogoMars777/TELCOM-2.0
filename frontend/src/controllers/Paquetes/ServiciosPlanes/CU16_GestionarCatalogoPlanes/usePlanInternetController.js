import { useState, useEffect } from 'react';
import { planInternetService } from '../../../../models/Paquetes/ServiciosPlanes/CU16_GestionarCatalogoPlanes/planInternetModel';
import { describeApiError } from '../../../../services/apiClient';

// Valores iniciales de un plan NUEVO.
const emptyPlan = {
  nombre_plan: '',
  velocidad_mbps: '',
  precio_mensual: '',
  descripcion: '',
  activo: true,
};

/** Convierte un plan del backend al formulario del modal. */
function planAFormulario(p) {
  return {
    nombre_plan: p.nombre_plan ?? '',
    velocidad_mbps: p.velocidad_mbps ?? '',
    precio_mensual: p.precio_mensual ?? '',
    descripcion: p.descripcion ?? '',
    activo: p.activo !== undefined ? Boolean(p.activo) : true,
  };
}

/** Normaliza el formulario antes de enviarlo al backend. */
function normalizarPayload(form) {
  const texto = (valor) => (typeof valor === 'string' ? valor.trim() : valor);
  const descripcion = texto(form.descripcion);

  return {
    nombre_plan: texto(form.nombre_plan),
    velocidad_mbps: Number(form.velocidad_mbps),
    precio_mensual: Number(form.precio_mensual),
    descripcion: descripcion ? descripcion : null,
    activo: Boolean(form.activo),
  };
}

export function usePlanInternetController() {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);         // Error de carga del listado
  const [formError, setFormError] = useState(null); // Error al guardar
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = crear
  const [formPlan, setFormPlan] = useState(emptyPlan);
  const [savingId, setSavingId] = useState(null);   // fila en proceso (activar/desactivar)

  const loadPlanes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await planInternetService.fetchPlanes();
      setPlanes(data);
    } catch (e) {
      setPlanes([]);
      setError(describeApiError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlanes();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setFormPlan({ ...emptyPlan });
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (plan) => {
    setEditingId(plan.id);
    setFormPlan(planAFormulario(plan));
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);
    try {
      const payload = normalizarPayload(formPlan);
      if (editingId) {
        await planInternetService.updatePlan(editingId, payload);
      } else {
        await planInternetService.createPlan(payload);
      }
      // Solo se cierra el modal cuando el backend confirmó; se recarga el
      // listado real en lugar de inventar el registro localmente.
      closeModal();
      setFormPlan({ ...emptyPlan });
      await loadPlanes();
    } catch (err) {
      setFormError(describeApiError(err));
    } finally {
      setLoading(false);
    }
  };

  // Baja lógica (desactivar) y reactivación de un plan existente.
  const cambiarEstado = async (plan, activo) => {
    setSavingId(plan.id);
    setFormError(null);
    try {
      if (activo) {
        await planInternetService.updatePlan(plan.id, { activo: true });
      } else {
        await planInternetService.desactivarPlan(plan.id);
      }
      await loadPlanes();
      return true;
    } catch (err) {
      setError(describeApiError(err));
      return false;
    } finally {
      setSavingId(null);
    }
  };

  return {
    planes,
    loading,
    error,
    formError,
    showModal,
    formPlan,
    setFormPlan,
    handleSubmit,
    editingId,
    openCreate,
    openEdit,
    closeModal,
    cambiarEstado,
    savingId,
    reload: loadPlanes,
  };
}
