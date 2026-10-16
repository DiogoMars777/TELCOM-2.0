import { useState, useEffect } from 'react';
import { planInternetService } from '../../../../models/Paquetes/ServiciosPlanes/CU16_GestionarCatalogoPlanes/planInternetModel';
import { describeApiError } from '../../../../services/apiClient';

const FORM_VACIO = {
  nombre_plan: '',
  velocidad_mbps: '',
  precio_mensual: '',
  descripcion: '',
  activo: true,
};

/**
 * CU16 - Controlador del catálogo de planes de Internet.
 *
 * Conectado a la API real. Las mutaciones (crear/editar/activar/desactivar)
 * las autoriza el backend con `planes.manage`; aquí solo se oculta la interfaz.
 */
export function usePlanCatalogoController() {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [aviso, setAviso] = useState(null);

  const loadPlanes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await planInternetService.fetchPlanes({
        buscar: busqueda,
        activo: estadoFiltro,
      });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda, estadoFiltro]);

  const openCreate = () => {
    setEditingPlan(null);
    setForm(FORM_VACIO);
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (plan) => {
    setEditingPlan(plan);
    setForm({
      nombre_plan: plan.nombre_plan ?? '',
      velocidad_mbps: plan.velocidad_mbps ?? '',
      precio_mensual: plan.precio_mensual ?? '',
      descripcion: plan.descripcion ?? '',
      activo: Boolean(plan.activo),
    });
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Validación de interfaz (el backend vuelve a validar siempre).
    const velocidad = Number(form.velocidad_mbps);
    const precio = Number(form.precio_mensual);
    if (!form.nombre_plan.trim()) {
      setFormError('El nombre del plan es obligatorio.');
      return;
    }
    if (!Number.isInteger(velocidad) || velocidad <= 0) {
      setFormError('La velocidad debe ser un número entero mayor que 0 Mbps.');
      return;
    }
    if (!Number.isFinite(precio) || precio < 0) {
      setFormError('El precio mensual no puede ser negativo.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nombre_plan: form.nombre_plan.trim(),
        velocidad_mbps: velocidad,
        precio_mensual: precio,
        descripcion: form.descripcion?.trim() || null,
        activo: Boolean(form.activo),
      };

      if (editingPlan) {
        await planInternetService.actualizarPlan(editingPlan.id, payload);
        setAviso('Plan actualizado correctamente.');
      } else {
        await planInternetService.crearPlan(payload);
        setAviso('Plan creado correctamente.');
      }

      setShowModal(false);
      setForm(FORM_VACIO);
      setEditingPlan(null);
      await loadPlanes();
    } catch (err) {
      setFormError(describeApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const cambiarEstado = async (plan) => {
    setError(null);
    setAviso(null);
    try {
      if (plan.activo) {
        await planInternetService.desactivarPlan(plan.id);
        setAviso(`Plan «${plan.nombre_plan}» desactivado. No podrá asignarse a servicios nuevos.`);
      } else {
        await planInternetService.activarPlan(plan.id);
        setAviso(`Plan «${plan.nombre_plan}» activado.`);
      }
      await loadPlanes();
    } catch (err) {
      setError(describeApiError(err));
    }
  };

  return {
    planes,
    loading,
    error,
    busqueda,
    setBusqueda,
    estadoFiltro,
    setEstadoFiltro,
    showModal,
    editingPlan,
    form,
    setForm,
    formError,
    saving,
    aviso,
    setAviso,
    openCreate,
    openEdit,
    closeModal,
    handleSubmit,
    cambiarEstado,
    reload: loadPlanes,
  };
}
