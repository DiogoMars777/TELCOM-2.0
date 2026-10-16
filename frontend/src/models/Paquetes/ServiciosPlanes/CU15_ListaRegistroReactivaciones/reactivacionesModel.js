import { apiClient } from '../../../../services/apiClient.js';
import { isDemoMode } from '../../../../config/appConfig.js';

// Datos de ejemplo SOLO para el modo demostración (desactivado por defecto).
export const mockReactivacionesList = [
  {
    id: 1,
    codigo_reactivacion: 'REA-202610-001',
    servicio_codigo: 'SRV-44102',
    cliente_nombre: 'Fernando Torres Gutierrez',
    costo_reactivacion: 50.00,
    fecha_reactivacion: '2026-10-12 14:10:00',
    operador_nombre: 'Beatriz Morales',
    observaciones: 'Reactivado tras cancelación total de deuda con comprobante QR',
    estado_servicio: 'ACTIVO',
  },
];

// La API devuelve las relaciones `servicio.cliente` y `operador`; se aplanan.
function normalizeReactivacion(r) {
  const cliente = r.servicio?.cliente;
  return {
    ...r,
    servicio_codigo: r.servicio_codigo || r.servicio?.codigo_servicio || null,
    cliente_nombre: r.cliente_nombre
      || (cliente ? `${cliente.nombres ?? ''} ${cliente.apellidos ?? ''}`.trim() : null),
    operador_nombre: r.operador_nombre || r.operador?.name || null,
    estado_servicio: r.estado_servicio || r.servicio?.estado_servicio || null,
  };
}

// Datos de ejemplo SOLO para el modo demostración (desactivado por defecto).
export const mockServiciosCu15 = [
  { id: 1, codigo_servicio: 'SRV-88201', cliente_nombre: 'Fernando Torres Gutierrez', estado_servicio: 'CORTADO' },
  { id: 2, codigo_servicio: 'SRV-88204', cliente_nombre: 'Juan Pablo Camacho', estado_servicio: 'CORTADO' },
  { id: 3, codigo_servicio: 'SRV-88210', cliente_nombre: 'Valeria Rojas Silva', estado_servicio: 'ACTIVO' },
];

// La API entrega la relación `cliente`; la vista usa `cliente_nombre`.
function nombreClienteServicio(s) {
  if (s.cliente_nombre) return s.cliente_nombre;
  if (s.cliente) {
    return `${s.cliente.nombres ?? ''} ${s.cliente.apellidos ?? ''}`.trim();
  }
  return null;
}

export const reactivacionesService = {
  async fetchReactivaciones() {
    if (isDemoMode()) return mockReactivacionesList;
    const res = await apiClient.get('/cu15/reactivaciones');
    return (res?.data?.data ?? []).map(normalizeReactivacion);
  },

  async fetchServicios() {
    if (isDemoMode()) return mockServiciosCu15;
    const res = await apiClient.get('/cu08/servicios');
    return (res?.data?.data ?? []).map((s) => ({ ...s, cliente_nombre: nombreClienteServicio(s) }));
  },

  async registrarReactivacion(data) {
    return await apiClient.post('/cu15/reactivaciones', data);
  }
};
