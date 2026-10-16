import { apiClient } from '../../../../services/apiClient.js';
import { isDemoMode } from '../../../../config/appConfig.js';

// Datos de ejemplo SOLO para el modo demostración (desactivado por defecto).
export const mockMensualidades = [
  {
    id: 1,
    codigo_factura: 'FAC-2026-10-A91',
    cliente_nombre: 'Carlos Andrés Mendoza',
    servicio_codigo: 'SRV-88201',
    periodo: '2026-10',
    monto: 220.00,
    fecha_emision: '2026-10-01',
    fecha_vencimiento: '2026-10-10',
    estado_pago: 'PENDIENTE',
  },
  {
    id: 2,
    codigo_factura: 'FAC-2026-09-B12',
    cliente_nombre: 'Carlos Andrés Mendoza',
    servicio_codigo: 'SRV-88201',
    periodo: '2026-09',
    monto: 220.00,
    fecha_emision: '2026-09-01',
    fecha_vencimiento: '2026-09-10',
    estado_pago: 'PAGADO',
  },
];

// La API devuelve las relaciones `cliente` y `servicio`; se aplanan para la vista.
function normalizeMensualidad(m) {
  const cliente = m.cliente;
  const nombreCliente = cliente?.nombreCompleto || cliente?.nombre_completo
    || (`${cliente?.nombres ?? ''} ${cliente?.apellidos ?? ''}`.trim() || null);
  return {
    ...m,
    cliente_nombre: m.cliente_nombre || nombreCliente || 'Cliente General',
    servicio_codigo: m.servicio_codigo || m.servicio?.codigo_servicio || m.servicio?.codigoServicio || 'SRV',
  };
}

export const mensualidadService = {
  async fetchMensualidades(periodo) {
    if (isDemoMode()) return mockMensualidades;
    const res = await apiClient.get('/cu09/mensualidades', { periodo });
    return (res?.data?.data ?? []).map(normalizeMensualidad);
  },

  async generarMensualidades(periodo) {
    return await apiClient.post('/cu09/mensualidades/generar', { periodo });
  }
};
