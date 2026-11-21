import { useState, useEffect, useCallback, useRef } from 'react';
import { corteRegistroService } from '../../../../models/Paquetes/P3_ServiciosPlanes/CU14_RegistrarCorteRealizado/corteRegistroModel';
import { describeApiError } from '../../../../services/apiClient';

export function useCorteRegistroController(initialServicio = null) {
  // Lista de cortes ejecutados
  const [cortes, setCortes] = useState([]);
  const [metricas, setMetricas] = useState({
    total_cortes: 0,
    cortes_logicos: 0,
    cortes_fisicos: 0,
    cortes_mes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Paginación y Filtros
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [buscar, setBuscar] = useState('');
  const [tipoCorteFilter, setTipoCorteFilter] = useState('TODOS');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Servicios activos para el modal de corte
  const [serviciosActivos, setServiciosActivos] = useState([]);
  const [loadingServicios, setLoadingServicios] = useState(false);
  const [serviciosError, setServiciosError] = useState(null);

  // Modal para registrar corte
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedServicio, setSelectedServicio] = useState(initialServicio);
  const [tipoCorte, setTipoCorte] = useState('LOGICO');
  const [motivo, setMotivo] = useState('Mora prolongada mayor a 15 días');
  const [observaciones, setObservaciones] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Modal de Comprobante / Recibo de Corte
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Atender initialServicio si viene desde CU13 (listado de servicios para corte)
  const lastInitialRef = useRef(null);
  useEffect(() => {
    if (initialServicio && initialServicio !== lastInitialRef.current) {
      lastInitialRef.current = initialServicio;
      setSelectedServicio(initialServicio);
      setShowCreateModal(true);
    }
  }, [initialServicio]);

  // Cargar lista de cortes
  const loadCortes = useCallback(async (targetPage = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await corteRegistroService.fetchCortes({
        buscar,
        tipo_corte: tipoCorteFilter,
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        page: targetPage,
        per_page: 15,
      });

      setCortes(res.data || []);
      setPage(res.current_page || targetPage);
      setTotalPages(res.last_page || 1);
      setTotalRecords(res.total || 0);
      if (res.metricas) {
        setMetricas(res.metricas);
      }
    } catch (err) {
      setError(describeApiError(err));
      setCortes([]);
    } finally {
      setLoading(false);
    }
  }, [buscar, tipoCorteFilter, fechaDesde, fechaHasta]);

  // Cargar catálogo de servicios activos
  const loadServiciosActivos = useCallback(async () => {
    setLoadingServicios(true);
    setServiciosError(null);
    try {
      const list = await corteRegistroService.fetchServiciosActivos();
      setServiciosActivos(list);
    } catch (err) {
      setServiciosError(describeApiError(err));
    } finally {
      setLoadingServicios(false);
    }
  }, []);

  // Efecto de carga reactivo ante filtros
  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [cortesRes, serviciosRes] = await Promise.all([
          corteRegistroService.fetchCortes({
            buscar,
            tipo_corte: tipoCorteFilter,
            fecha_desde: fechaDesde,
            fecha_hasta: fechaHasta,
            page: 1,
            per_page: 15,
          }),
          corteRegistroService.fetchServiciosActivos(),
        ]);
        if (!ignore) {
          setCortes(cortesRes.data || []);
          setPage(cortesRes.current_page || 1);
          setTotalPages(cortesRes.last_page || 1);
          setTotalRecords(cortesRes.total || 0);
          if (cortesRes.metricas) setMetricas(cortesRes.metricas);
          setServiciosActivos(serviciosRes || []);
        }
      } catch (err) {
        if (!ignore) {
          setError(describeApiError(err));
          setCortes([]);
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
  }, [buscar, tipoCorteFilter, fechaDesde, fechaHasta]);

  // Limpiar filtros
  const handleLimpiarFiltros = () => {
    setBuscar('');
    setTipoCorteFilter('TODOS');
    setFechaDesde('');
    setFechaHasta('');
    setPage(1);
  };

  // Abrir modal de creación
  const handleAbrirModalCrear = (servicioPreseleccionado = null) => {
    setFormError(null);
    if (servicioPreseleccionado) {
      setSelectedServicio(servicioPreseleccionado);
    } else if (!selectedServicio && serviciosActivos.length > 0) {
      setSelectedServicio(serviciosActivos[0]);
    }
    setTipoCorte('LOGICO');
    setMotivo('Mora prolongada mayor a 15 días');
    setObservaciones('');
    setShowCreateModal(true);
  };

  // Enviar formulario de ejecución de corte
  const handleSubmitCorte = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedServicio) {
      setFormError('Debe seleccionar un servicio activo para ejecutar el corte.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        servicio_id: selectedServicio.id || selectedServicio.idServicio,
        tipo_corte: tipoCorte,
        motivo,
        observaciones,
      };

      const res = await corteRegistroService.registrarCorte(payload);
      const corteGuardado = res?.data?.corte || res?.corte;

      setShowCreateModal(false);

      // Preparar y desplegar el comprobante oficial inmediatamente
      const comprobanteData = {
        id: corteGuardado?.id || Date.now(),
        codigo_orden: corteGuardado?.codigo_orden || corteGuardado?.codigo_orden_corte || `COR-${Date.now()}`,
        codigo_servicio: selectedServicio.codigo_servicio || `SRV-${selectedServicio.id}`,
        cliente_nombre: selectedServicio.cliente_nombre || 'Cliente',
        cliente_ci: selectedServicio.cliente_ci || '—',
        cliente_telefono: selectedServicio.cliente_telefono || '—',
        cliente_direccion: selectedServicio.cliente_direccion || '—',
        zona_nombre: selectedServicio.zona_nombre || '—',
        plan_nombre: selectedServicio.plan_nombre || 'Plan estándar',
        ip_asignada: selectedServicio.ip_asignada || '—',
        tipo_corte: tipoCorte,
        motivo,
        observaciones: observaciones || 'Sin observaciones adicionales.',
        fecha_corte: new Date().toLocaleString(),
        tecnico_nombre: corteGuardado?.tecnico_nombre || 'Operador en turno',
        estado: 'COMPLETADO',
        estado_servicio: 'CORTADO',
      };

      setSelectedReceipt(comprobanteData);
      setShowReceiptModal(true);

      // Recargar listas reales
      await Promise.all([loadCortes(1), loadServiciosActivos()]);
    } catch (err) {
      setFormError(describeApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Ver comprobante existente
  const handleVerComprobante = (corte) => {
    setSelectedReceipt(corte);
    setShowReceiptModal(true);
  };

  // Imprimir comprobante
  const handleImprimir = () => {
    window.print();
  };

  return {
    // Listado
    cortes,
    metricas,
    loading,
    error,
    page,
    setPage,
    totalPages,
    totalRecords,
    loadCortes,

    // Filtros
    buscar,
    setBuscar,
    tipoCorteFilter,
    setTipoCorteFilter,
    fechaDesde,
    setFechaDesde,
    fechaHasta,
    setFechaHasta,
    handleLimpiarFiltros,

    // Servicios disponibles
    serviciosActivos,
    loadingServicios,
    serviciosError,
    loadServiciosActivos,

    // Modal Registro
    showCreateModal,
    setShowCreateModal,
    selectedServicio,
    setSelectedServicio,
    tipoCorte,
    setTipoCorte,
    motivo,
    setMotivo,
    observaciones,
    setObservaciones,
    submitting,
    formError,
    handleAbrirModalCrear,
    handleSubmitCorte,

    // Modal Comprobante
    showReceiptModal,
    setShowReceiptModal,
    selectedReceipt,
    setSelectedReceipt,
    handleVerComprobante,
    handleImprimir,
  };
}
