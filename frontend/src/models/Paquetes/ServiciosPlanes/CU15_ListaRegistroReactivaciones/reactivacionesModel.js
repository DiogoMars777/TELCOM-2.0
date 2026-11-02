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
  { id: 1, codigo_servicio: 'SRV-88201', cliente_nombre: 'Fernando Torres Gutierrez', estado_servicio: 'CORTADO', ip_asignada: '10.20.1.45' },
  { id: 2, codigo_servicio: 'SRV-88204', cliente_nombre: 'Juan Pablo Camacho', estado_servicio: 'CORTADO', ip_asignada: '10.20.1.88' },
  { id: 3, codigo_servicio: 'SRV-88210', cliente_nombre: 'Valeria Rojas Silva', estado_servicio: 'ACTIVO', ip_asignada: '10.20.2.14' },
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

  /**
   * Obtiene la lista de servicios en estado CORTADO para el selector del modal.
   * Consulta explícitamente el endpoint de servicios cortados del CU15.
   */
  async fetchServiciosCortados() {
    if (isDemoMode()) {
      return mockServiciosCu15.filter((s) => s.estado_servicio === 'CORTADO');
    }
    try {
      const res = await apiClient.get('/cu15/servicios-cortados');
      const data = res?.data?.data ?? res?.data ?? [];
      return data.map((s) => ({ ...s, cliente_nombre: nombreClienteServicio(s) }));
    } catch {
      try {
        const res = await apiClient.get('/cu15/reactivaciones?cortados=1');
        const data = res?.data?.data ?? res?.data ?? [];
        return data.map((s) => ({ ...s, cliente_nombre: nombreClienteServicio(s) }));
      } catch {
        const res = await apiClient.get('/cu08/servicios');
        return (res?.data?.data ?? [])
          .filter((s) => s.estado_servicio === 'CORTADO')
          .map((s) => ({ ...s, cliente_nombre: nombreClienteServicio(s) }));
      }
    }
  },

  async fetchServicios() {
    return this.fetchServiciosCortados();
  },

  async registrarReactivacion(data) {
    if (isDemoMode()) {
      const nuevoRegistro = {
        id: Date.now(),
        codigo_reactivacion: `REA-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-DEMO`,
        servicio_codigo: `SRV-${data.servicio_id}`,
        cliente_nombre: 'Cliente Demo',
        costo_reactivacion: Number(data.costo_reactivacion || 0).toFixed(2),
        fecha_reactivacion: new Date().toISOString().replace('T', ' ').slice(0, 19),
        operador_nombre: 'Operador Demo',
        observaciones: data.observaciones || 'Reactivación en modo demostración',
        estado_servicio: 'ACTIVO',
      };
      mockReactivacionesList.unshift(nuevoRegistro);
      return { success: true, message: 'Servicio reactivado exitosamente.', data: { reactivacion: nuevoRegistro } };
    }

    const payload = {
      servicio_id: Number(data.servicio_id),
      pago_id: data.pago_id ? Number(data.pago_id) : null,
      costo_reactivacion: data.costo_reactivacion !== undefined && data.costo_reactivacion !== ''
        ? Number(data.costo_reactivacion)
        : 0.00,
      observaciones: data.observaciones ? String(data.observaciones).trim() : null,
    };

    return await apiClient.post('/cu15/reactivaciones', payload);
  }
};
