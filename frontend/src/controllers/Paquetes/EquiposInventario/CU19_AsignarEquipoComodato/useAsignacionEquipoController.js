import { useState, useEffect, useCallback } from 'react';
import { asignacionEquipoModel } from '../../../../models/Paquetes/EquiposInventario/CU19_AsignarEquipoComodato/asignacionEquipoModel';
import { describeApiError } from '../../../../services/apiClient';

export function useAsignacionEquipoController() {
  // Lista de servicios
  const [servicios, setServicios] = useState([]);
  const [loadingServicios, setLoadingServicios] = useState(false);
  const [serviciosError, setServiciosError] = useState(null);
  const [busquedaServicio, setBusquedaServicio] = useState('');

  // Servicio seleccionado
  const [servicioId, setServicioId] = useState('');
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [comodatoVigente, setComodatoVigente] = useState(null);
  const [historialComodatos, setHistorialComodatos] = useState([]);
  const [loadingDetalleServicio, setLoadingDetalleServicio] = useState(false);
  const [detalleError, setDetalleError] = useState(null);

  // Inventario de equipos disponibles
  const [equiposDisponibles, setEquiposDisponibles] = useState([]);
  const [tiposDisponibles, setTiposDisponibles] = useState(['ONU', 'Router', 'Modem']);
  const [tipoSeleccionado, setTipoSeleccionado] = useState('');
  const [busquedaEquipo, setBusquedaEquipo] = useState('');
  const [loadingEquipos, setLoadingEquipos] = useState(false);
  const [equiposError, setEquiposError] = useState(null);

  // Modal de Asignación en Comodato
  const [showModalAsignar, setShowModalAsignar] = useState(false);
  const [equipoParaAsignar, setEquipoParaAsignar] = useState(null);
  const [formAsignar, setFormAsignar] = useState(() => ({
    fecha_asignacion: new Date().toISOString().slice(0, 10),
    reemplazar_vigente: true,
    motivo_reemplazo: 'Reemplazo formal de equipo en comodato para optimización de servicio.',
    observaciones: '',
  }));
  const [savingAsignacion, setSavingAsignacion] = useState(false);
  const [asignarError, setAsignarError] = useState(null);
  const [asignarSuccess, setAsignarSuccess] = useState(null);

  // Modal de Retiro de Equipo
  const [showModalRetiro, setShowModalRetiro] = useState(false);
  const [asignacionParaRetirar, setAsignacionParaRetirar] = useState(null);
  const [formRetiro, setFormRetiro] = useState(() => ({
    fecha_retiro: new Date().toISOString().slice(0, 10),
    motivo_retiro: '',
    estado_equipo: 'DISPONIBLE',
  }));
  const [savingRetiro, setSavingRetiro] = useState(false);
  const [retiroError, setRetiroError] = useState(null);
  const [retiroSuccess, setRetiroSuccess] = useState(null);

  // Cargar servicios
  const loadServicios = useCallback(async (busq = '') => {
    setLoadingServicios(true);
    setServiciosError(null);
    try {
      const data = await asignacionEquipoModel.fetchServicios(busq ? { buscar: busq } : {});
      setServicios(data);
    } catch (err) {
      setServicios([]);
      setServiciosError(describeApiError(err));
    } finally {
      setLoadingServicios(false);
    }
  }, []);

  // Cargar equipos disponibles
  const loadEquiposDisponibles = useCallback(async (tipo = '', busq = '') => {
    setLoadingEquipos(true);
    setEquiposError(null);
    try {
      const params = {};
      if (tipo) params.tipo_equipo = tipo;
      if (busq) params.buscar = busq;
      const res = await asignacionEquipoModel.fetchEquiposDisponibles(params);
      setEquiposDisponibles(res.equipos || []);
      if (Array.isArray(res.tipos_disponibles) && res.tipos_disponibles.length > 0) {
        setTiposDisponibles(res.tipos_disponibles);
      }
    } catch (err) {
      setEquiposDisponibles([]);
      setEquiposError(describeApiError(err));
    } finally {
      setLoadingEquipos(false);
    }
  }, []);

  // Cargar detalles de comodato del servicio
  const loadDetalleServicio = useCallback(async (id) => {
    if (!id) {
      setServicioSeleccionado(null);
      setComodatoVigente(null);
      setHistorialComodatos([]);
      return;
    }
    setLoadingDetalleServicio(true);
    setDetalleError(null);
    try {
      const res = await asignacionEquipoModel.fetchServicioEquipos(id);
      setServicioSeleccionado(res.servicio);
      setComodatoVigente(res.comodato_vigente);
      setHistorialComodatos(res.historial || []);
    } catch (err) {
      setServicioSeleccionado(null);
      setComodatoVigente(null);
      setHistorialComodatos([]);
      setDetalleError(describeApiError(err));
    } finally {
      setLoadingDetalleServicio(false);
    }
  }, []);

  // Inicialización segura contra renders concurrentes
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const [serviciosData, equiposData] = await Promise.all([
          asignacionEquipoModel.fetchServicios(),
          asignacionEquipoModel.fetchEquiposDisponibles(),
        ]);
        if (!ignore) {
          setServicios(serviciosData);
          setEquiposDisponibles(equiposData.equipos || []);
          if (Array.isArray(equiposData.tipos_disponibles) && equiposData.tipos_disponibles.length > 0) {
            setTiposDisponibles(equiposData.tipos_disponibles);
          }
        }
      } catch (err) {
        if (!ignore) {
          setServiciosError(describeApiError(err));
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  // Selección de servicio
  const seleccionarServicio = (id) => {
    setServicioId(id);
    setAsignarSuccess(null);
    setAsignarError(null);
    setRetiroSuccess(null);
    setRetiroError(null);
    loadDetalleServicio(id);
  };

  // Cambio de filtro de tipo de equipo
  const cambiarTipoEquipo = (tipo) => {
    setTipoSeleccionado(tipo);
    loadEquiposDisponibles(tipo, busquedaEquipo);
  };

  // Búsqueda de equipos
  const ejecutarBusquedaEquipo = (e) => {
    e?.preventDefault();
    loadEquiposDisponibles(tipoSeleccionado, busquedaEquipo);
  };

  // Abrir modal de asignación con un equipo específico
  const openModalAsignar = (equipo) => {
    setEquipoParaAsignar(equipo);
    setFormAsignar({
      fecha_asignacion: new Date().toISOString().slice(0, 10),
      reemplazar_vigente: Boolean(comodatoVigente),
      motivo_reemplazo: comodatoVigente ? 'Reemplazo formal por actualización tecnológica en comodato.' : '',
      observaciones: '',
    });
    setAsignarError(null);
    setShowModalAsignar(true);
  };

  const closeModalAsignar = () => {
    setShowModalAsignar(false);
    setEquipoParaAsignar(null);
    setAsignarError(null);
  };

  // Confirmar asignación formal
  const handleConfirmarAsignacion = async (e) => {
    e?.preventDefault();
    if (!servicioId) {
      setAsignarError('Debe seleccionar primero un servicio de Internet.');
      return;
    }
    if (!equipoParaAsignar) {
      setAsignarError('Debe seleccionar un equipo disponible para entregar en comodato.');
      return;
    }

    setSavingAsignacion(true);
    setAsignarError(null);
    try {
      const payload = {
        equipo_id: equipoParaAsignar.id,
        numero_serie: equipoParaAsignar.numero_serie,
        mac: equipoParaAsignar.mac,
        fecha_asignacion: formAsignar.fecha_asignacion,
        reemplazar_vigente: formAsignar.reemplazar_vigente,
        motivo_reemplazo: formAsignar.motivo_reemplazo,
        observaciones: formAsignar.observaciones,
      };

      const res = await asignacionEquipoModel.asignarEquipo(servicioId, payload);
      setAsignarSuccess(res.message || 'Equipo asignado formalmente en comodato.');
      closeModalAsignar();

      // Refrescar datos
      await Promise.all([
        loadDetalleServicio(servicioId),
        loadEquiposDisponibles(tipoSeleccionado, busquedaEquipo),
        loadServicios(busquedaServicio),
      ]);
    } catch (err) {
      setAsignarError(describeApiError(err));
    } finally {
      setSavingAsignacion(false);
    }
  };

  // Abrir modal de retiro
  const openModalRetiro = (asignacion) => {
    setAsignacionParaRetirar(asignacion);
    setFormRetiro({
      fecha_retiro: new Date().toISOString().slice(0, 10),
      motivo_retiro: '',
      estado_equipo: 'DISPONIBLE',
    });
    setRetiroError(null);
    setShowModalRetiro(true);
  };

  const closeModalRetiro = () => {
    setShowModalRetiro(false);
    setAsignacionParaRetirar(null);
    setRetiroError(null);
  };

  // Confirmar retiro de equipo
  const handleConfirmarRetiro = async (e) => {
    e?.preventDefault();
    if (!asignacionParaRetirar) return;
    if (!formRetiro.motivo_retiro.trim()) {
      setRetiroError('Debe especificar un motivo para el retiro del equipo.');
      return;
    }

    setSavingRetiro(true);
    setRetiroError(null);
    try {
      const res = await asignacionEquipoModel.desvincularEquipo(asignacionParaRetirar.id, formRetiro);
      setRetiroSuccess(res.message || 'Equipo retirado exitosamente del comodato.');
      closeModalRetiro();

      // Refrescar
      await Promise.all([
        loadDetalleServicio(servicioId),
        loadEquiposDisponibles(tipoSeleccionado, busquedaEquipo),
      ]);
    } catch (err) {
      setRetiroError(describeApiError(err));
    } finally {
      setSavingRetiro(false);
    }
  };

  return {
    // Servicios
    servicios,
    loadingServicios,
    serviciosError,
    busquedaServicio,
    setBusquedaServicio,
    loadServicios,
    servicioId,
    seleccionarServicio,
    servicioSeleccionado,
    comodatoVigente,
    historialComodatos,
    loadingDetalleServicio,
    detalleError,

    // Equipos
    equiposDisponibles,
    tiposDisponibles,
    tipoSeleccionado,
    cambiarTipoEquipo,
    busquedaEquipo,
    setBusquedaEquipo,
    ejecutarBusquedaEquipo,
    loadingEquipos,
    equiposError,
    loadEquiposDisponibles,

    // Modal Asignar
    showModalAsignar,
    equipoParaAsignar,
    formAsignar,
    setFormAsignar,
    savingAsignacion,
    asignarError,
    asignarSuccess,
    openModalAsignar,
    closeModalAsignar,
    handleConfirmarAsignacion,

    // Modal Retirar
    showModalRetiro,
    asignacionParaRetirar,
    formRetiro,
    setFormRetiro,
    savingRetiro,
    retiroError,
    retiroSuccess,
    openModalRetiro,
    closeModalRetiro,
    handleConfirmarRetiro,
  };
}
