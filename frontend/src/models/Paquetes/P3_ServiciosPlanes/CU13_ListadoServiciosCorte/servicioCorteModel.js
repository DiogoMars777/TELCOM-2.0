import { apiClient } from '../../../../services/apiClient.js';
import { isDemoMode } from '../../../../config/appConfig.js';

// Datos de ejemplo SOLO para el modo demostración (desactivado por defecto).
export const mockServiciosParaCorte = [
  {
    id: 1,
    codigo_servicio: 'SRV-88201',
    cliente_nombre: 'Carlos Andrés Mendoza Paredes',
    cliente_ci: '8492019 LP',
    cliente_telefono: '+591 76543210',
    cliente_direccion: 'Av. Siempre Viva #742',
    zona_id: 1,
    zona_nombre: 'Zona Norte - Fibra Óptica Troncal',
    plan_nombre: 'Fibra 200 Mbps',
    velocidad_mbps: 200,
    ip_asignada: '10.10.0.15',
    dias_mora: 22,
    monto_deuda: 500.00,
    mensualidades_pendientes: 2,
    estado_servicio: 'ACTIVO',
  },
  {
    id: 2,
    codigo_servicio: 'SRV-88204',
    cliente_nombre: 'Juan Pablo Camacho Ortiz',
    cliente_ci: '5928103 SC',
    cliente_telefono: '+591 71234567',
    cliente_direccion: 'Av. Cristo Redentor #450, Edif. Torre Duo',
    zona_id: 2,
    zona_nombre: 'Zona Sur - Anillo Metropolitano',
    plan_nombre: 'Plan Fibra Ultra 100 Mbps',
    velocidad_mbps: 100,
    ip_asignada: '192.168.10.92',
    dias_mora: 15,
    monto_deuda: 200.00,
    mensualidades_pendientes: 1,
    estado_servicio: 'ACTIVO',
  },
  {
    id: 3,
    codigo_servicio: 'SRV-88208',
    cliente_nombre: 'María Elena Ríos Guzmán',
    cliente_ci: '3829104 LP',
    cliente_telefono: '+591 78901234',
    cliente_direccion: 'Calle Murillo #128, Zona Central',
    zona_id: 1,
    zona_nombre: 'Zona Norte - Fibra Óptica Troncal',
    plan_nombre: 'Plan Hogar Plus 50 Mbps',
    velocidad_mbps: 50,
    ip_asignada: '10.10.0.45',
    dias_mora: 38,
    monto_deuda: 480.00,
    mensualidades_pendientes: 3,
    estado_servicio: 'ACTIVO',
  },
  {
    id: 4,
    codigo_servicio: 'SRV-88210',
    cliente_nombre: 'Roberto Carlos Vaca Suárez',
    cliente_ci: '6712390 SC',
    cliente_telefono: '+591 70098765',
    cliente_direccion: 'Barrio Equipetrol #312',
    zona_id: 2,
    zona_nombre: 'Zona Sur - Anillo Metropolitano',
    plan_nombre: 'Plan Básico 30 Mbps',
    velocidad_mbps: 30,
    ip_asignada: '10.20.0.18',
    dias_mora: 8,
    monto_deuda: 130.00,
    mensualidades_pendientes: 1,
    estado_servicio: 'ACTIVO',
  },
];

// La API devuelve relaciones y atributos calculados; se asegura normalización para la vista.
function normalizeServicio(s) {
  const cliente = s.cliente;
  const zona = s.zona;
  const plan = s.asignacionPlanActual?.plan || s.asignacion_plan_actual?.plan;
  return {
    ...s,
    id: s.id ?? s.idServicio,
    codigo_servicio: s.codigo_servicio || s.codigoServicio || `SRV-${s.id ?? s.idServicio}`,
    cliente_nombre: s.cliente_nombre
      || (cliente ? `${cliente.nombres ?? ''} ${cliente.apellidos ?? ''}`.trim() : null)
      || cliente?.nombreCompleto
      || 'Abonado no especificado',
    cliente_ci: s.cliente_ci || cliente?.ci || cliente?.documento_identidad || '—',
    cliente_telefono: s.cliente_telefono || cliente?.telefonoPrincipal || cliente?.telefono || '—',
    cliente_direccion: s.cliente_direccion || s.direccion || cliente?.direccion || '—',
    zona_nombre: s.zona_nombre || zona?.nombreZona || zona?.nombre || 'Sin zona asignada',
    plan_nombre: s.plan_nombre || plan?.nombrePlan || plan?.nombre_plan || 'Plan no especificado',
    velocidad_mbps: s.velocidad_mbps || plan?.velocidadMbps || plan?.velocidad_mbps || null,
    ip_asignada: s.ip_asignada || s.ipAsignada || '—',
    dias_mora: Number(s.dias_mora ?? 0),
    monto_deuda: s.monto_deuda != null ? Number(s.monto_deuda) : 0,
    mensualidades_pendientes: Number(s.mensualidades_pendientes ?? 1),
    estado_servicio: s.estado_servicio || s.estadoServicio || 'ACTIVO',
  };
}

export const serviciosCorteService = {
  async fetchServiciosCorte(filters = {}) {
    if (isDemoMode()) {
      let result = [...mockServiciosParaCorte];
      if (filters.dias_mora !== undefined && filters.dias_mora !== '') {
        result = result.filter(s => s.dias_mora >= Number(filters.dias_mora));
      }
      if (filters.zona_id) {
        result = result.filter(s => String(s.zona_id) === String(filters.zona_id));
      }
      if (filters.buscar) {
        const q = filters.buscar.toLowerCase();
        result = result.filter(s =>
          s.codigo_servicio?.toLowerCase().includes(q) ||
          s.cliente_nombre?.toLowerCase().includes(q) ||
          s.cliente_ci?.toLowerCase().includes(q) ||
          s.ip_asignada?.toLowerCase().includes(q)
        );
      }
      const normalized = result.map(normalizeServicio);
      normalized.meta = {
        current_page: 1,
        last_page: 1,
        per_page: normalized.length || 15,
        total: normalized.length,
      };
      return normalized;
    }

    const params = new URLSearchParams();
    if (filters.dias_mora !== undefined && filters.dias_mora !== '') {
      params.append('dias_mora', filters.dias_mora);
    }
    if (filters.zona_id) {
      params.append('zona_id', filters.zona_id);
    }
    if (filters.buscar) {
      params.append('buscar', filters.buscar);
    }
    if (filters.page) {
      params.append('page', filters.page);
    }
    if (filters.per_page) {
      params.append('per_page', filters.per_page);
    }
    if (filters.todos) {
      params.append('todos', '1');
    }

    const qs = params.toString();
    const endpoint = `/cu13/servicios-corte${qs ? `?${qs}` : ''}`;
    const res = await apiClient.get(endpoint);

    const rawList = Array.isArray(res?.data)
      ? res.data
      : (res?.data?.data ?? []);

    const normalized = rawList.map(normalizeServicio);

    // Adjuntar metadatos de paginación al array (preserva compatibilidad con código que espera array)
    if (res?.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
      normalized.meta = {
        current_page: res.data.current_page || 1,
        last_page: res.data.last_page || 1,
        per_page: res.data.per_page || 15,
        total: res.data.total ?? normalized.length,
      };
    } else {
      normalized.meta = {
        current_page: 1,
        last_page: 1,
        per_page: normalized.length || 15,
        total: normalized.length,
      };
    }

    return normalized;
  }
};
