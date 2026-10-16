import { useState, useEffect } from 'react';
import { zonaService } from '../../../../models/Paquetes/GestionClientesZonas/CU04_ZonasCobertura/zonaCoberturaModel';
import { describeApiError } from '../../../../services/apiClient';

// Valores iniciales para crear una zona NUEVA.
// `estado_cobertura` queda vacío a propósito para que el usuario lo elija
// explícitamente (no se asigna «Disponible» de forma automática).
const emptyZona = {
  codigo: '',
  nombre: '',
  ciudad: 'La Paz',
  barrio: '',
  tecnologia: 'FTTH GPON',
  estado_cobertura: '',
  capacidad_nodos: 100,
  area_mapa: null,
};

/** Convierte una zona del backend al formulario del modal. */
function zonaAFormulario(z) {
  return {
    codigo: z.codigo ?? '',
    nombre: z.nombre ?? '',
    ciudad: z.ciudad ?? 'La Paz',
    barrio: z.barrio ?? '',
    tecnologia: z.tecnologia ?? 'FTTH GPON',
    // Los registros antiguos pueden no tener estado: se deja vacío para que
    // el usuario lo complete; no se inventa un valor.
    estado_cobertura: z.estado_cobertura ?? '',
    capacidad_nodos: z.capacidad_nodos ?? 100,
    area_mapa: z.area_mapa ?? null,
  };
}

/** Normaliza los datos del formulario antes de enviarlos al backend. */
function normalizarPayload(form) {
  const texto = (valor) => (typeof valor === 'string' ? valor.trim() : valor);
  const barrio = texto(form.barrio);

  return {
    codigo: texto(form.codigo),
    nombre: texto(form.nombre),
    ciudad: texto(form.ciudad),
    barrio: barrio ? barrio : null,
    tecnologia: form.tecnologia,
    estado_cobertura: form.estado_cobertura ? form.estado_cobertura : null,
    capacidad_nodos: Number(form.capacidad_nodos) || 0,
    area_mapa: form.area_mapa ?? null,
  };
}

export function useZonaCoberturaController() {
  const [zonas, setZonas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);         // Error de carga del listado
  const [formError, setFormError] = useState(null); // Error al guardar una zona
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = crear
  const [newZona, setNewZona] = useState(emptyZona);

  const loadZonas = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await zonaService.fetchZonas();
      setZonas(data);
    } catch (e) {
      setZonas([]);
      setError(describeApiError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadZonas();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setNewZona({ ...emptyZona });
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (zona) => {
    setEditingId(zona.id);
    setNewZona(zonaAFormulario(zona));
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormError(null);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);
    try {
      const payload = normalizarPayload(newZona);
      if (editingId) {
        await zonaService.updateZona(editingId, payload);
      } else {
        await zonaService.createZona(payload);
      }
      // Solo se cierra el modal y se recarga cuando el backend confirmó.
      closeModal();
      setNewZona({ ...emptyZona });
      await loadZonas();
    } catch (err) {
      setFormError(describeApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return {
    zonas,
    loading,
    error,
    formError,
    showModal,
    setShowModal,
    newZona,
    setNewZona,
    handleCreate,
    editingId,
    openCreate,
    openEdit,
    closeModal,
    reload: loadZonas,
  };
}
