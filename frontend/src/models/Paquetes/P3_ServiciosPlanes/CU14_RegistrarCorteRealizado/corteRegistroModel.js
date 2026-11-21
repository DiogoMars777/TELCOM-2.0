import { apiClient } from '../../../../services/apiClient.js';
import { isDemoMode } from '../../../../config/appConfig.js';

// Datos de demostración en caso de trabajar en modo offline / demo
export const mockCortesList = [
  {
    id: 1,
    codigo_orden: 'COR-00001',
    codigo_orden_corte: 'COR-00001',
    servicio_id: 1,
    codigo_servicio: 'SRV-88201',
    cliente_id: 1,
    cliente_nombre: 'Fernando Torres Gutierrez',
    cliente_ci: '4829102 SC',
    cliente_telefono: '+591 71029384',
    cliente_direccion: 'Barrio Sirari, C/ Los Claveles #140',
    zona_nombre: 'Zona Norte - Equipetrol',
    plan_nombre: 'Fibra Óptica Hogar 100 Mbps',
    velocidad_mbps: 100,
    ip_asignada: '192.168.10.45',
    tipo_corte: 'LOGICO',
    motivo: 'Mora prolongada superior a 30 días',
    observaciones: 'Bloqueo lógico aplicado en servidor RADIUS y perfil de OLT.',
    fecha_corte: '2026-10-15 10:30:00',
    tecnico_id: 1,
    tecnico_nombre: 'Carlos Mendoza (Técnico N2)',
    estado: 'COMPLETADO',
    estado_servicio: 'CORTADO',
  },
  {
    id: 2,
    codigo_orden: 'COR-00002',
    codigo_orden_corte: 'COR-00002',
    servicio_id: 2,
    codigo_servicio: 'SRV-88204',
    cliente_id: 2,
    cliente_nombre: 'Juan Pablo Camacho',
    cliente_ci: '5920194 SC',
    cliente_telefono: '+591 76091823',
    cliente_direccion: 'Av. Mutualista, 3er Anillo Interno #34',
    zona_nombre: 'Zona Este - Villa 1ro de Mayo',
    plan_nombre: 'Fibra Óptica Pyme 200 Mbps',
    velocidad_mbps: 200,
    ip_asignada: '192.168.10.88',
    tipo_corte: 'FISICO',
    motivo: 'Solicitud voluntaria del cliente por traslado',
    observaciones: 'Cuadrilla desconectó patchcord en caja NAP 04 puerto 2.',
    fecha_corte: '2026-10-18 15:45:00',
    tecnico_id: 2,
    tecnico_nombre: 'Rodrigo Vaca (Cuadrilla 1)',
    estado: 'COMPLETADO',
    estado_servicio: 'CORTADO',
  },
];

export const mockServiciosActivos = [
  {
    id: 1,
    codigo_servicio: 'SRV-88201',
    cliente_id: 1,
    cliente_nombre: 'Fernando Torres Gutierrez',
    cliente_ci: '4829102 SC',
    cliente_telefono: '+591 71029384',
    cliente_direccion: 'Barrio Sirari, C/ Los Claveles #140',
    zona_nombre: 'Zona Norte - Equipetrol',
    plan_nombre: 'Fibra Óptica Hogar 100 Mbps',
    ip_asignada: '192.168.10.45',
    estado_servicio: 'ACTIVO',
  },
  {
    id: 3,
    codigo_servicio: 'SRV-88210',
    cliente_id: 3,
    cliente_nombre: 'Valeria Rojas Silva',
    cliente_ci: '6102948 SC',
    cliente_telefono: '+591 78901234',
    cliente_direccion: 'Calle Independencia #412',
    zona_nombre: 'Zona Sur - Casco Viejo',
    plan_nombre: 'Fibra Óptica Familiar 50 Mbps',
    ip_asignada: '192.168.10.60',
    estado_servicio: 'ACTIVO',
  },
];

export function normalizeCorte(c) {
  if (!c) return null;
  const servicio = c.servicio || {};
  const cliente = servicio.cliente || {};
  const plan = servicio.asignacionPlanActual?.plan || {};
  const tecnico = c.tecnico || {};

  return {
    id: c.id || c.idAccion,
    codigo_orden: c.codigo_orden || c.codigo_orden_corte || `COR-${String(c.id || c.idAccion || 0).padStart(5, '0')}`,
    codigo_orden_corte: c.codigo_orden_corte || c.codigo_orden || `COR-${String(c.id || c.idAccion || 0).padStart(5, '0')}`,
    servicio_id: c.servicio_id || c.idServicio || servicio.idServicio || servicio.id,
    codigo_servicio: c.codigo_servicio || servicio.codigoServicio || (c.idServicio ? `SRV-${c.idServicio}` : '—'),
    cliente_id: c.cliente_id || cliente.idCliente,
    cliente_nombre: c.cliente_nombre || cliente.nombreCompleto || 'Cliente Desconocido',
    cliente_ci: c.cliente_ci || cliente.ci || '—',
    cliente_telefono: c.cliente_telefono || cliente.telefonoPrincipal || '—',
    cliente_direccion: c.cliente_direccion || servicio.direccion || cliente.direccion || '—',
    zona_nombre: c.zona_nombre || servicio.zona?.nombreZona || '—',
    plan_nombre: c.plan_nombre || plan.nombrePlan || 'Plan estándar',
    velocidad_mbps: c.velocidad_mbps || plan.velocidadMbps || null,
    ip_asignada: c.ip_asignada || servicio.ipAsignada || '—',
    tipo_corte: c.tipo_corte || (c.tipoAccion && c.tipoAccion.includes('FISICO') ? 'FISICO' : 'LOGICO'),
    motivo: c.motivo || 'Mora prolongada',
    observaciones: c.observaciones || c.observacion || '—',
    fecha_corte: c.fecha_corte || c.fechaEjecucion || new Date().toLocaleString(),
    tecnico_id: c.tecnico_id || c.idUsuario,
    tecnico_nombre: c.tecnico_nombre || tecnico.nombreCompleto || tecnico.nombreUsuario || 'Técnico Autorizado',
    estado: c.estado || 'COMPLETADO',
    estado_servicio: c.estado_servicio || servicio.estado_servicio || 'CORTADO',
  };
}

export const corteRegistroService = {
  /**
   * Obtener lista paginada de cortes realizados con filtros y métricas
   */
  async fetchCortes(params = {}) {
    if (isDemoMode()) {
      return {
        data: mockCortesList,
        total: mockCortesList.length,
        current_page: 1,
        last_page: 1,
        metricas: {
          total_cortes: mockCortesList.length,
          cortes_logicos: mockCortesList.filter(c => c.tipo_corte === 'LOGICO').length,
          cortes_fisicos: mockCortesList.filter(c => c.tipo_corte === 'FISICO').length,
          cortes_mes: mockCortesList.length,
        },
      };
    }

    const query = new URLSearchParams();
    if (params.buscar) query.set('buscar', params.buscar);
    if (params.tipo_corte && params.tipo_corte !== 'TODOS') query.set('tipo_corte', params.tipo_corte);
    if (params.fecha_desde) query.set('fecha_desde', params.fecha_desde);
    if (params.fecha_hasta) query.set('fecha_hasta', params.fecha_hasta);
    if (params.page) query.set('page', String(params.page));
    if (params.per_page) query.set('per_page', String(params.per_page));

    const qs = query.toString();
    const endpoint = `/cu14/cortes${qs ? `?${qs}` : ''}`;
    const res = await apiClient.get(endpoint);

    const payload = res?.data || {};
    const cortesWrapper = payload.data?.cortes || payload.cortes || payload.data || {};
    const rawList = Array.isArray(cortesWrapper) ? cortesWrapper : (cortesWrapper.data || []);
    const normalizedList = rawList.map(normalizeCorte);

    return {
      data: normalizedList,
      total: cortesWrapper.total ?? normalizedList.length,
      current_page: cortesWrapper.current_page ?? 1,
      last_page: cortesWrapper.last_page ?? 1,
      metricas: payload.data?.metricas || payload.metricas || {
        total_cortes: normalizedList.length,
        cortes_logicos: normalizedList.filter(c => c.tipo_corte === 'LOGICO').length,
        cortes_fisicos: normalizedList.filter(c => c.tipo_corte === 'FISICO').length,
        cortes_mes: normalizedList.length,
      },
    };
  },

  /**
   * Obtener catálogo de servicios activos elegibles para corte
   */
  async fetchServiciosActivos(params = {}) {
    if (isDemoMode()) return mockServiciosActivos;

    try {
      const query = new URLSearchParams();
      if (params.buscar) query.set('buscar', params.buscar);
      const qs = query.toString();
      const endpoint = `/cu14/cortes/servicios-activos${qs ? `?${qs}` : ''}`;
      const res = await apiClient.get(endpoint);
      return res?.data?.data || res?.data || [];
    } catch {
      // Fallback a /cu08/servicios filtrado por estado ACTIVO si fuera necesario
      const fallback = await apiClient.get('/cu08/servicios');
      const allServices = fallback?.data?.data || fallback?.data || [];
      return allServices
        .filter(s => s.estado_servicio === 'ACTIVO')
        .map(s => ({
          id: s.id || s.idServicio,
          codigo_servicio: s.codigo_servicio || s.codigoServicio,
          cliente_id: s.cliente?.idCliente || s.idCliente,
          cliente_nombre: s.cliente_nombre || (s.cliente ? `${s.cliente.nombres ?? ''} ${s.cliente.apellidos ?? ''}`.trim() : 'Cliente'),
          cliente_ci: s.cliente?.ci || s.cliente?.documento_identidad || '—',
          cliente_telefono: s.cliente?.telefono || s.cliente?.telefonoPrincipal || '—',
          cliente_direccion: s.direccion || s.cliente?.direccion || '—',
          zona_nombre: s.zona?.nombreZona || s.zona_nombre || '—',
          plan_nombre: s.plan_nombre || s.asignacionPlanActual?.plan?.nombrePlan || 'Plan Estándar',
          ip_asignada: s.ipAsignada || s.ip_asignada || '—',
          estado_servicio: s.estado_servicio || 'ACTIVO',
        }));
    }
  },

  /**
   * Obtener comprobante detallado de un corte
   */
  async fetchCorteDetalle(id) {
    if (isDemoMode()) {
      const found = mockCortesList.find(c => c.id === Number(id));
      return found || mockCortesList[0];
    }
    const res = await apiClient.get(`/cu14/cortes/${id}`);
    return normalizeCorte(res?.data?.data || res?.data);
  },

  /**
   * Ejecutar y registrar un nuevo corte
   */
  async registrarCorte(data) {
    return await apiClient.post('/cu14/cortes', data);
  },
};
