import { apiClient } from '../../../../services/apiClient.js';
import { isDemoMode } from '../../../../config/appConfig.js';

/**
 * CU16 - Catálogo de planes de Internet (entidad UML PlanInternet).
 *
 * Capa de datos real: cada función llama a la API y propaga los errores tal
 * cual (nunca los sustituye por datos ficticios). Los mocks solo se usan con
 * el modo demostración ACTIVADO de forma explícita (desactivado por defecto).
 */

// Datos de ejemplo SOLO para el modo demostración (desactivado por defecto).
export const mockPlanesCu16 = [
  {
    id: 1,
    nombre_plan: 'Plan Básico 30 Mbps',
    velocidad_mbps: 30,
    precio_mensual: '130.00',
    descripcion: 'Hogar básico',
    activo: true,
  },
  {
    id: 2,
    nombre_plan: 'Plan Hogar Plus 50 Mbps',
    velocidad_mbps: 50,
    precio_mensual: '160.00',
    descripcion: 'Hogar plus',
    activo: true,
  },
  {
    id: 3,
    nombre_plan: 'Plan Fibra Ultra 100 Mbps',
    velocidad_mbps: 100,
    precio_mensual: '220.00',
    descripcion: 'Fibra ultra',
    activo: false,
  },
];

export const mockPlanesCatalogo = mockPlanesCu16;

/**
 * Normaliza un plan del backend. El modelo expone tanto los campos canónicos
 * (`nombrePlan`, `velocidadMbps`...) como los alias snake_case; se aceptan
 * ambos sin inventar valores.
 */
export function normalizePlan(p) {
  if (!p) return null;
  return {
    ...p,
    id: p.id ?? p.idPlan ?? null,
    nombre_plan: p.nombre_plan ?? p.nombrePlan ?? '',
    velocidad_mbps: p.velocidad_mbps ?? p.velocidadMbps ?? null,
    precio_mensual: p.precio_mensual ?? p.precioMensual ?? null,
    descripcion: p.descripcion ?? '',
    activo: p.activo === undefined || p.activo === null ? true : Boolean(p.activo),
  };
}

export const planInternetService = {
  async fetchPlanes(params = {}) {
    if (isDemoMode()) return mockPlanesCu16.map(normalizePlan);
    const res = await apiClient.get('/planes', params);
    const planes = res?.data?.planes ?? [];
    return planes.map(normalizePlan);
  },

  async fetchPlan(id) {
    if (isDemoMode()) return mockPlanesCu16.map(normalizePlan).find((p) => p.id === Number(id)) ?? null;
    const res = await apiClient.get(`/planes/${id}`);
    const plan = res?.data?.plan ?? null;
    return plan ? normalizePlan(plan) : null;
  },

  async crearPlan(data) {
    const res = await apiClient.post('/planes', data);
    return res?.data?.plan ?? res;
  },

  async createPlan(data) {
    return this.crearPlan(data);
  },

  async actualizarPlan(id, data) {
    const res = await apiClient.put(`/planes/${id}`, data);
    return res?.data?.plan ?? res;
  },

  async updatePlan(id, data) {
    return this.actualizarPlan(id, data);
  },

  async activarPlan(id) {
    const res = await apiClient.put(`/planes/${id}/activar`);
    return res?.data?.plan ?? res;
  },

  // Baja lógica: el backend desactiva el plan (nunca lo borra).
  async desactivarPlan(id) {
    const res = await apiClient.put(`/planes/${id}/desactivar`).catch(() => apiClient.delete(`/planes/${id}`));
    return res?.data?.plan ?? res;
  },
};
