import { useCallback, useEffect, useRef, useState } from 'react';
import { equipoReemplazoRetiroService } from '../../../../models/Paquetes/EquiposProveedoresInventario/CU20_ReemplazarRetirarEquipo/equipoReemplazoRetiroModel.js';
import { describeApiError } from '../../../../services/apiClient.js';
import { hasPermission } from '../../../../config/access.js';

const emptyReemplazo = { equipo_nuevo_id: '', motivo: '' };
const emptyRetiro = { motivo: '' };

export function useEquipoReemplazoRetiroController(user) {
  const [servicios, setServicios] = useState([]);
  const [loadingServicios, setLoadingServicios] = useState(true);
  const [serviciosError, setServiciosError] = useState(null);
  const [servicioId, setServicioId] = useState('');
  const [informacionEquipo, setInformacionEquipo] = useState(null);
  const [loadingEquipo, setLoadingEquipo] = useState(false);
  const [equipoError, setEquipoError] = useState(null);
  const [equiposDisponibles, setEquiposDisponibles] = useState([]);
  const [loadingDisponibles, setLoadingDisponibles] = useState(false);
  const [disponiblesError, setDisponiblesError] = useState(null);
  const [showReemplazo, setShowReemplazo] = useState(false);
  const [showRetiro, setShowRetiro] = useState(false);
  const [formReemplazo, setFormReemplazo] = useState(emptyReemplazo);
  const [formRetiro, setFormRetiro] = useState(emptyRetiro);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [resultado, setResultado] = useState(null);

  const servicioSeleccionado = useRef('');
  const equipoRequest = useRef(0);
  const disponiblesRequest = useRef(0);
  const guardando = useRef(false);
  const mounted = useRef(false);
  const puedeAsignar = hasPermission(user, 'equipos.assign');

  const loadEquipoServicio = useCallback(async (id = servicioSeleccionado.current) => {
    const request = ++equipoRequest.current;
    setInformacionEquipo(null);
    setEquipoError(null);
    setLoadingEquipo(Boolean(id));
    if (!id) return;
    try {
      const data = await equipoReemplazoRetiroService.fetchEquipoServicio(id);
      if (mounted.current && request === equipoRequest.current) setInformacionEquipo(data);
    } catch (error) {
      if (mounted.current && request === equipoRequest.current) setEquipoError(describeApiError(error));
    } finally {
      if (mounted.current && request === equipoRequest.current) setLoadingEquipo(false);
    }
  }, []);

  const loadEquiposDisponibles = useCallback(async () => {
    const request = ++disponiblesRequest.current;
    setLoadingDisponibles(true);
    setDisponiblesError(null);
    setEquiposDisponibles([]);
    try {
      const data = await equipoReemplazoRetiroService.fetchEquiposDisponibles();
      if (mounted.current && request === disponiblesRequest.current) setEquiposDisponibles(data);
    } catch (error) {
      if (mounted.current && request === disponiblesRequest.current) setDisponiblesError(describeApiError(error));
    } finally {
      if (mounted.current && request === disponiblesRequest.current) setLoadingDisponibles(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    let ignore = false;
    equipoReemplazoRetiroService.fetchServicios()
      .then((data) => { if (!ignore) setServicios(data); })
      .catch((error) => { if (!ignore) setServiciosError(describeApiError(error)); })
      .finally(() => { if (!ignore) setLoadingServicios(false); });
    return () => {
      ignore = true;
      mounted.current = false;
      equipoRequest.current += 1;
      disponiblesRequest.current += 1;
    };
  }, []);

  const seleccionarServicio = (value) => {
    if (guardando.current) return;
    servicioSeleccionado.current = String(value);
    setServicioId(String(value));
    setResultado(null);
    setFormError(null);
    setShowReemplazo(false);
    setShowRetiro(false);
    setFormReemplazo(emptyReemplazo);
    setFormRetiro(emptyRetiro);
    setDisponiblesError(null);
    loadEquipoServicio(value);
  };

  const asignacionActiva = informacionEquipo?.asignacion_activa ?? null;
  const equipoActual = informacionEquipo?.equipo_actual ?? null;
  const puedeOperar = puedeAsignar && Boolean(servicioId && asignacionActiva && equipoActual)
    && !loadingEquipo && !equipoError && !saving;

  const openReemplazo = () => {
    if (!puedeOperar || guardando.current) return;
    setResultado(null);
    setFormError(null);
    setFormReemplazo(emptyReemplazo);
    setShowRetiro(false);
    setShowReemplazo(true);
    loadEquiposDisponibles();
  };

  const closeReemplazo = () => {
    if (guardando.current) return;
    setShowReemplazo(false);
    setFormError(null);
    setFormReemplazo(emptyReemplazo);
  };

  const openRetiro = () => {
    if (!puedeOperar || guardando.current) return;
    setResultado(null);
    setFormError(null);
    setFormRetiro(emptyRetiro);
    setShowReemplazo(false);
    setShowRetiro(true);
  };

  const closeRetiro = () => {
    if (guardando.current) return;
    setShowRetiro(false);
    setFormError(null);
    setFormRetiro(emptyRetiro);
  };

  // Se comparte únicamente el ciclo de guardado; cada acción conserva su contrato.
  const guardarOperacion = async (tipo) => {
    if (guardando.current) return;
    setFormError(null);
    if (!puedeOperar) {
      setFormError('Necesitas el permiso equipos.assign y un equipo actualmente asignado.');
      return;
    }
    const motivo = (tipo === 'reemplazo' ? formReemplazo.motivo : formRetiro.motivo).trim();
    if (!motivo || motivo.length > 1000) {
      setFormError('Ingresa un motivo de entre 1 y 1000 caracteres.');
      return;
    }
    const equipoNuevoId = Number(formReemplazo.equipo_nuevo_id);
    if (tipo === 'reemplazo' && (
      loadingDisponibles || disponiblesError || !Number.isInteger(equipoNuevoId)
      || !equiposDisponibles.some((equipo) => Number(equipo.id) === equipoNuevoId)
      || equipoNuevoId === Number(equipoActual.id)
    )) {
      setFormError('Selecciona un nuevo equipo de la lista de equipos disponibles.');
      return;
    }

    guardando.current = true;
    setSaving(true);
    setResultado(null);
    const id = servicioId;
    try {
      const res = tipo === 'reemplazo'
        ? await equipoReemplazoRetiroService.reemplazarEquipo(id, equipoNuevoId, motivo)
        : await equipoReemplazoRetiroService.retirarEquipo(id, motivo);
      if (!mounted.current) return;
      setShowReemplazo(false);
      setShowRetiro(false);
      setFormReemplazo(emptyReemplazo);
      setFormRetiro(emptyRetiro);
      // El GET de CU20 vuelve a traer equipo actual, asignación e historial juntos.
      // Los errores de recarga se muestran por separado del POST ya confirmado.
      await Promise.all([loadEquipoServicio(id), loadEquiposDisponibles()]);
      if (mounted.current) {
        setResultado(res?.message || (tipo === 'reemplazo'
          ? 'Equipo reemplazado exitosamente.' : 'Equipo retirado exitosamente.'));
      }
    } catch (error) {
      if (mounted.current) setFormError(describeApiError(error));
    } finally {
      guardando.current = false;
      if (mounted.current) setSaving(false);
    }
  };

  const handleReemplazar = (event) => {
    event.preventDefault();
    if (showReemplazo) return guardarOperacion('reemplazo');
  };

  const handleRetirar = (event) => {
    event.preventDefault();
    if (showRetiro) return guardarOperacion('retiro');
  };

  return {
    servicios, loadingServicios, serviciosError,
    servicioId,
    servicio: informacionEquipo?.servicio ?? servicios.find((s) => String(s.id) === servicioId) ?? null,
    informacionEquipo, asignacionActiva, equipoActual,
    historial: informacionEquipo?.historial ?? [],
    loadingEquipo, equipoError,
    equiposDisponibles, loadingDisponibles, disponiblesError,
    resultado, showReemplazo, showRetiro,
    formReemplazo, setFormReemplazo, formRetiro, setFormRetiro, formError,
    saving, puedeOperar,
    seleccionarServicio, loadEquipoServicio, loadEquiposDisponibles,
    openReemplazo, closeReemplazo, handleReemplazar,
    openRetiro, closeRetiro, handleRetirar,
  };
}
