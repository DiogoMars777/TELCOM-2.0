import { apiClient } from '../../../../services/apiClient.js';
import { isDemoMode } from '../../../../config/appConfig.js';

/**
 * CU17 - Asignación / cambio de plan de un servicio de Internet.
 *
 * Capa de datos real (sin datos falsos): busca servicios, trae los planes
 * ACTIVOS, consulta el historial del servicio y registra la asignación.
 */

// Datos de ejemplo SOLO para el modo demostración (desactivado por defecto).
export const mockServiciosPlan = [
  {
    id: 1,
    codigo_servicio: 'SRV-88201',
    plan_nombre: 'Fibra 200 Mbps',
    velocidad_mbps: 200,
    precio_mensual: '250.00',
    estado_servicio: 'ACTIVO',
    cliente: { nombres: 'Carlos Andrés', apellidos: 'Mendoza Paredes' },
  },
];

export const mockPlanesActivos = [
  { id: 1, nombre_plan: 'Plan Básico 30 Mbps', velocidad_mbps: 30, precio_mensual: '130.00', activo: true },
  { id: 2, nombre_plan: 'Plan Hogar Plus 50 Mbps', velocidad_mbps: 50, precio_mensual: '160.00', activo: true },
];

export const mockHistorialPlan = [
  {
    id: 1,
    plan_id: 1,
    fecha_inicio: '2026-01-01',
    fecha_fin: null,
    precio_aplicado: '130.00',
    motivo_cambio: 'Carga inicial',
    plan: { id: 1, nombre_plan: 'Plan Básico 30 Mbps', velocidad_mbps: 30 },
    usuario: null,
  },
];

function nombreCliente(servicio) {
  if (servicio.cliente_nombre) return servicio.cliente_nombre;
  if (servicio.cliente) {
    return `${servicio.cliente.nombres ?? ''} ${servicio.cliente.apellidos ?? ''}`.trim();
  }
  return null;
}

export const asignacionPlanService = {
  async buscarServicios(params = {}) {
    if (isDemoMode()) return mockServiciosPlan;
    const res = await apiClient.get('/cu08/servicios', params);
    const payload = res?.data;
    const lista = Array.isArray(payload) ? payload : (payload?.data ?? []);
    return lista.map((s) => ({ ...s, cliente_nombre: nombreCliente(s) }));
  },

  async fetchPlanesActivos() {
    if (isDemoMode()) return mockPlanesActivos;
    const res = await apiClient.get('/planes', { activo: 1 });
    return res?.data?.planes ?? [];
  },

  async fetchHistorial(servicioId) {
    if (isDemoMode()) {
      return { servicio: mockServiciosPlan[0], asignaciones: mockHistorialPlan };
    }
    const res = await apiClient.get(`/cu08/servicios/${servicioId}/planes`);
    return {
      servicio: res?.data?.servicio ?? null,
      asignaciones: res?.data?.asignaciones ?? [],
    };
  },

  async asignarPlan(servicioId, data) {
    const res = await apiClient.post(`/cu08/servicios/${servicioId}/planes`, data);
    return res?.data?.asignacion;
  },
};
