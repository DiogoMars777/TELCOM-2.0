import { useCallback, useEffect, useRef, useState } from 'react';
import { proveedorService } from '../../../../models/Paquetes/P5_EquiposProveedoresInventario/CU24_GestionarProveedores/proveedorModel.js';
import { describeApiError } from '../../../../services/apiClient.js';

const FORM_VACIO = { razonSocial: '', nit: '', telefono: '', correo: '', direccion: '' };

export function proveedorAFormulario(proveedor = {}) {
  return Object.fromEntries(Object.keys(FORM_VACIO).map((campo) => [campo, proveedor[campo] ?? '']));
}

export function normalizarPayload(form) {
  return {
    razonSocial: form.razonSocial.trim(),
    nit: form.nit.trim(),
    telefono: form.telefono.trim() || null,
    correo: form.correo.trim() || null,
    direccion: form.direccion.trim() || null,
  };
}

export function validarFormulario(form) {
  if (!form.razonSocial.trim()) return 'La razón social es obligatoria.';
  if (!form.nit.trim()) return 'El NIT es obligatorio.';
  return null;
}

/** CU24: estado y acciones de la pantalla. El backend aplica la autorización real. */
export function useProveedorController(puedeGestionar) {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [modo, setModo] = useState(null);
  const [seleccionado, setSeleccionado] = useState(null);
  const [form, setForm] = useState({ ...FORM_VACIO });
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pendingId, setPendingId] = useState(null);
  const [aviso, setAviso] = useState(null);
  const requestId = useRef(0);
  const invalidarPeticiones = useCallback(() => { ++requestId.current; }, []);

  const loadProveedores = useCallback(async () => {
    if (!puedeGestionar) return;
    const current = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const data = await proveedorService.fetchProveedores({ buscar: busqueda.trim(), estado: estadoFiltro });
      if (current === requestId.current) setProveedores(data);
    } catch (err) {
      if (current === requestId.current) {
        setProveedores([]);
        setError(describeApiError(err));
      }
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  }, [busqueda, estadoFiltro, puedeGestionar]);

  useEffect(() => {
    const timer = setTimeout(loadProveedores, 250);
    return () => {
      clearTimeout(timer);
      invalidarPeticiones();
    };
  }, [loadProveedores, invalidarPeticiones]);

  const openCreate = () => {
    if (!puedeGestionar || saving || pendingId !== null) return;
    setSeleccionado(null);
    setForm({ ...FORM_VACIO });
    setFormError(null);
    setModo('crear');
  };

  const openProveedor = async (proveedor, nuevoModo) => {
    if (!puedeGestionar || saving || pendingId !== null) return;
    setPendingId(proveedor.idProveedor);
    setError(null);
    try {
      const data = await proveedorService.fetchProveedor(proveedor.idProveedor);
      setSeleccionado(data);
      setForm(proveedorAFormulario(data));
      setFormError(null);
      setModo(nuevoModo);
    } catch (err) {
      setError(describeApiError(err));
    } finally {
      setPendingId(null);
    }
  };

  const closeModal = () => {
    if (saving) return;
    setModo(null);
    setSeleccionado(null);
    setFormError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!puedeGestionar || saving || !['crear', 'editar'].includes(modo)) return;
    const mensaje = validarFormulario(form);
    setFormError(mensaje);
    if (mensaje) return;
    setSaving(true);
    try {
      const payload = normalizarPayload(form);
      if (modo === 'editar') {
        await proveedorService.actualizarProveedor(seleccionado.idProveedor, payload);
      } else {
        await proveedorService.crearProveedor(payload);
      }
      setAviso(modo === 'editar' ? 'Proveedor actualizado correctamente.' : 'Proveedor creado correctamente.');
      setModo(null);
      setSeleccionado(null);
      await loadProveedores();
    } catch (err) {
      setFormError(describeApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const cambiarEstado = async (proveedor) => {
    if (!puedeGestionar || saving || pendingId !== null) return;
    setPendingId(proveedor.idProveedor);
    setError(null);
    setAviso(null);
    try {
      if (proveedor.estado) await proveedorService.desactivarProveedor(proveedor.idProveedor);
      else await proveedorService.activarProveedor(proveedor.idProveedor);
      setAviso(`Proveedor «${proveedor.razonSocial}» ${proveedor.estado ? 'desactivado' : 'activado'}.`);
      await loadProveedores();
    } catch (err) {
      setError(describeApiError(err));
    } finally {
      setPendingId(null);
    }
  };

  return {
    proveedores, loading, error, busqueda, setBusqueda, estadoFiltro, setEstadoFiltro,
    modo, seleccionado, form, setForm, formError, saving, pendingId, aviso, setAviso,
    openCreate, openEdit: (p) => openProveedor(p, 'editar'),
    openDetalle: (p) => openProveedor(p, 'consultar'), closeModal, handleSubmit,
    cambiarEstado, reload: loadProveedores,
  };
}
