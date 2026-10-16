import { useState, useEffect } from 'react';
import { servicioInternetService } from '../../../../models/Paquetes/ServiciosPlanes/CU08_RegistrarActivarServicio/servicioInternetModel';
import { describeApiError } from '../../../../services/apiClient';

// ─── Formulario vacío de registro ────────────────────────────────────────────
const FORM_VACIO = {
  idCliente:       '',
  idZona:          '',
  idPlan:          '',
  fechaActivacion: new Date().toISOString().slice(0, 10),
  fechaCorteBase:  new Date().toISOString().slice(0, 10),
  direccion:       '',
  referencia:      '',
  latitud:         '',
  longitud:        '',
  usuarioWinbox:   '',
  observacion:     '',
  diaCorte:        10,
  ipAsignada:      '',
  macRouter:       '',
};

export function useServicioInternetController() {
  // ── Estado de datos ──────────────────────────────────────────────────────
  const [servicios,    setServicios]    = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [formError,    setFormError]    = useState(null);

  // ── Modales ──────────────────────────────────────────────────────────────
  const [showModal,       setShowModal]       = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedServicio, setSelectedServicio] = useState(null);

  // ── Catálogos ────────────────────────────────────────────────────────────
  const [clientes,      setClientes]      = useState([]);
  const [zonas,         setZonas]         = useState([]);
  const [planes,        setPlanes]        = useState([]);
  const [catalogError,  setCatalogError]  = useState(null);

  // ── Formulario de registro ────────────────────────────────────────────────
  const [formServicio, setFormServicio] = useState({ ...FORM_VACIO });

  // ── Cargar listado de servicios ──────────────────────────────────────────
  const loadServicios = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await servicioInternetService.fetchServicios();
      setServicios(data);
    } catch (e) {
      setServicios([]);
      setError(describeApiError(e));
    } finally {
      setLoading(false);
    }
  };

  // ── Cargar catálogos (clientes, zonas, planes) ───────────────────────────
  const loadCatalogos = async () => {
    setCatalogError(null);
    try {
      const [clientesData, zonasData, planesData] = await Promise.all([
        servicioInternetService.fetchClientes(),
        servicioInternetService.fetchZonas(),
        servicioInternetService.fetchPlanes(),
      ]);
      setClientes(clientesData);
      setZonas(zonasData);
      setPlanes(planesData);
    } catch (e) {
      setCatalogError(describeApiError(e));
    }
  };

  useEffect(() => {
    loadServicios();
    loadCatalogos();
  }, []);

  // ── Al elegir un cliente: pre-rellenar dirección ──────────────────────────
  const handleClienteChange = (value) => {
    const id      = value === '' ? '' : Number(value);
    const cliente = clientes.find((c) => (c.id ?? c.idCliente) === id);
    setFormServicio((prev) => ({
      ...prev,
      idCliente: id,
      // Pre-rellena dirección e idZona si el cliente ya tiene zona
      direccion: cliente?.direccion ?? prev.direccion,
      idZona:    cliente?.idZona ?? cliente?.zona_id ?? prev.idZona,
    }));
  };

  // ── Al elegir un plan: actualizar diaCorte sugerido ───────────────────────
  const handlePlanChange = (value) => {
    const id = value === '' ? '' : Number(value);
    setFormServicio((prev) => ({ ...prev, idPlan: id }));
  };

  // ── Registrar nuevo servicio (flujo CU08) ─────────────────────────────────
  const handleCrear = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);

    // Validación mínima en cliente antes de enviar
    if (!formServicio.idCliente) {
      setFormError('Debe seleccionar un cliente.');
      setLoading(false);
      return;
    }

    try {
      await servicioInternetService.registrarServicio({
        idCliente:       Number(formServicio.idCliente),
        idZona:          formServicio.idZona ? Number(formServicio.idZona) : undefined,
        idPlan:          formServicio.idPlan ? Number(formServicio.idPlan) : undefined,
        fechaActivacion: formServicio.fechaActivacion || new Date().toISOString().slice(0, 10),
        fechaCorteBase:  formServicio.fechaCorteBase || new Date().toISOString().slice(0, 10),
        direccion:       formServicio.direccion || 'Domicilio del cliente',
        referencia:      formServicio.referencia || undefined,
        latitud:         formServicio.latitud !== '' && !isNaN(Number(formServicio.latitud)) ? Number(formServicio.latitud) : 0,
        longitud:        formServicio.longitud !== '' && !isNaN(Number(formServicio.longitud)) ? Number(formServicio.longitud) : 0,
        usuarioWinbox:   formServicio.usuarioWinbox || undefined,
        observacion:     formServicio.observacion || undefined,
        diaCorte:        Number(formServicio.diaCorte) || 10,
        ipAsignada:      formServicio.ipAsignada?.trim() || undefined,
        macRouter:       formServicio.macRouter?.trim() || undefined,
      });

      setShowModal(false);
      setFormServicio({ ...FORM_VACIO });
      await loadServicios();
    } catch (err) {
      setFormError(describeApiError(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Abrir modal de detalle ────────────────────────────────────────────────
  const handleVerDetalle = (servicio) => {
    setSelectedServicio(servicio);
    setShowDetailModal(true);
  };

  // ── Paso 5 del CU08: Datos y servicios actuales del cliente seleccionado ───
  const clienteSeleccionado = clientes.find(
    (c) => (c.id ?? c.idCliente) === Number(formServicio.idCliente)
  );

  const serviciosClienteSeleccionado = formServicio.idCliente
    ? servicios.filter(
        (s) => (s.idCliente ?? s.cliente_id) === Number(formServicio.idCliente)
      )
    : [];

  // Excepción 6: Detectar duplicidad temprana en el frontend
  const posibleDuplicado = Boolean(
    formServicio.idCliente &&
    formServicio.idZona &&
    formServicio.idPlan &&
    serviciosClienteSeleccionado.some((s) => {
      const mismaZona = (s.idZona ?? s.zona_id) === Number(formServicio.idZona);
      const mismoPlan = (s.asignacionPlanActual?.idPlan ?? s.idPlan) === Number(formServicio.idPlan);
      return mismaZona && mismoPlan;
    })
  );

  return {
    // datos
    servicios,
    loading,
    error,
    formError,
    // modales
    showModal,
    setShowModal,
    showDetailModal,
    setShowDetailModal,
    selectedServicio,
    setSelectedServicio,
    // catálogos
    clientes,
    zonas,
    planes,
    catalogError,
    // selección y servicios actuales (Paso 5)
    clienteSeleccionado,
    serviciosClienteSeleccionado,
    posibleDuplicado,
    // formulario
    formServicio,
    setFormServicio,
    // handlers
    handleClienteChange,
    handlePlanChange,
    handleCrear,
    handleVerDetalle,
    reload: loadServicios,
  };
}
