import { useState, useEffect, useCallback } from 'react';
import {
  solicitudInstalacionService,
  initialSolicitudInterna,
} from '../../../../models/Paquetes/P6_InstalacionesTecnicas/CU21_RegistrarSolicitudInstalacion/solicitudInstalacionModel';

export function useSolicitudInstalacionController() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [filtros, setFiltros] = useState({
    estado: '',
    search: '',
    fecha_desde: '',
    fecha_hasta: '',
    page: 1,
  });

  const [paginacion, setPaginacion] = useState({
    total: 0,
    current_page: 1,
    last_page: 1,
  });

  // Modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetalleOpen, setIsDetalleOpen] = useState(false);
  const [isCancelarOpen, setIsCancelarOpen] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);

  // Formulario de registro interno
  const [formData, setFormData] = useState(initialSolicitudInterna);
  const [formErrors, setFormErrors] = useState({});
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [clientesEncontrados, setClientesEncontrados] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [buscandoClientes, setBuscandoClientes] = useState(false);

  // Geolocalización
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState(null);

  // Cargar solicitudes
  const cargarSolicitudes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await solicitudInstalacionService.fetchSolicitudes(filtros);
      const items = Array.isArray(resp) ? resp : (resp?.data ?? []);
      setSolicitudes(items);
      setPaginacion({
        total: resp?.total ?? items.length,
        current_page: resp?.current_page ?? 1,
        last_page: resp?.last_page ?? 1,
      });
    } catch (err) {
      setError(err?.message || 'Error al cargar las solicitudes de instalación.');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  // Cargar zonas disponibles
  const cargarZonas = useCallback(async () => {
    try {
      const data = await solicitudInstalacionService.fetchZonasDisponibles();
      setZonas(data);
    } catch (err) {
      console.warn('Error cargando zonas de cobertura:', err);
    }
  }, []);

  useEffect(() => {
    cargarSolicitudes();
  }, [cargarSolicitudes]);

  useEffect(() => {
    cargarZonas();
  }, [cargarZonas]);

  // Búsqueda de clientes
  const buscarClientes = async (q) => {
    if (!q || q.length < 2) {
      setClientesEncontrados([]);
      return;
    }
    setBuscandoClientes(true);
    try {
      const data = await solicitudInstalacionService.buscarClientes(q);
      setClientesEncontrados(data);
    } catch (err) {
      console.warn('Error buscando clientes:', err);
    } finally {
      setBuscandoClientes(false);
    }
  };

  // Seleccionar cliente y autocompletar domicilio
  const seleccionarCliente = (cliente) => {
    setSelectedCliente(cliente);
    setClientesEncontrados([]);
    setFormData((prev) => ({
      ...prev,
      cliente_id: cliente.idCliente || cliente.id,
      direccion: cliente.direccion || prev.direccion,
      referencia: cliente.referenciaUbicacion || prev.referencia,
      zona_id: cliente.idZona || prev.zona_id,
    }));
    setFormErrors((prev) => ({ ...prev, cliente_id: null }));
  };

  // Capturar coordenadas GPS del dispositivo
  const capturarUbicacionGPS = () => {
    if (!navigator.geolocation) {
      setGpsStatus('La geolocalización no está soportada por su navegador.');
      return;
    }

    setGpsLoading(true);
    setGpsStatus('Obteniendo coordenadas satelitales GPS...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(7));
        const lng = parseFloat(pos.coords.longitude.toFixed(7));
        setFormData((prev) => ({
          ...prev,
          latitud: lat,
          longitud: lng,
        }));
        setGpsLoading(false);
        setGpsStatus(`GPS capturado: [${lat}, ${lng}]`);
      },
      (err) => {
        setGpsLoading(false);
        setGpsStatus(`Error al capturar GPS: ${err.message}. Puede ingresarlo manualmente.`);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // Registrar solicitud
  const registrarSolicitud = async (e) => {
    if (e) e.preventDefault();
    setFormErrors({});
    setError(null);

    // Validaciones del cliente
    const errors = {};
    if (!formData.cliente_id) errors.cliente_id = 'Debe seleccionar un cliente registrado.';
    if (!formData.direccion?.trim()) errors.direccion = 'La dirección del domicilio es requerida.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const res = await solicitudInstalacionService.crearSolicitud(formData);
      setSuccessMessage(res?.message || 'Solicitud de instalación registrada exitosamente.');
      setIsCreateOpen(false);
      setFormData(initialSolicitudInterna);
      setSelectedCliente(null);
      setGpsStatus(null);
      cargarSolicitudes();
      if (res?.data) {
        setSelectedSolicitud(res.data);
        setIsDetalleOpen(true);
      }
    } catch (err) {
      if (err?.errors) {
        setFormErrors(err.errors);
      } else {
        setError(err?.message || 'Error al guardar la solicitud de instalación.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Cancelar solicitud
  const cancelarSolicitud = async (motivo) => {
    if (!selectedSolicitud || !motivo?.trim()) return;
    setLoading(true);
    try {
      const res = await solicitudInstalacionService.cancelarSolicitud(selectedSolicitud.id || selectedSolicitud.idSolicitud, motivo);
      setSuccessMessage(res?.message || 'Solicitud cancelada correctamente.');
      setIsCancelarOpen(false);
      setSelectedSolicitud(null);
      cargarSolicitudes();
    } catch (err) {
      setError(err?.message || 'Error al cancelar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor, page: 1 }));
  };

  const limpiarFiltros = () => {
    setFiltros({ estado: '', search: '', fecha_desde: '', fecha_hasta: '', page: 1 });
  };

  return {
    solicitudes,
    loading,
    error,
    successMessage,
    filtros,
    paginacion,
    isCreateOpen,
    isDetalleOpen,
    isCancelarOpen,
    selectedSolicitud,
    formData,
    formErrors,
    selectedCliente,
    clientesEncontrados,
    zonas,
    buscandoClientes,
    gpsLoading,
    gpsStatus,
    setIsCreateOpen,
    setIsDetalleOpen,
    setIsCancelarOpen,
    setSelectedSolicitud,
    setFormData,
    setSuccessMessage,
    setError,
    handleFiltroChange,
    limpiarFiltros,
    buscarClientes,
    seleccionarCliente,
    capturarUbicacionGPS,
    registrarSolicitud,
    cancelarSolicitud,
    cargarSolicitudes,
  };
}
