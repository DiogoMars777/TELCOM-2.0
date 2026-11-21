import { apiClient } from '../../../../services/apiClient.js';
import { isDemoMode } from '../../../../config/appConfig.js';

// Datos de ejemplo para modo demostración / fallback seguro
export const mockPendientesCu10 = [
  {
    id: 1,
    codigo_factura: 'FAC-2026-10-A91',
    periodo: '2026-10',
    monto: 220.00,
    fecha_emision: '2026-10-01',
    fecha_vencimiento: '2026-10-10',
    estado_pago: 'PENDIENTE',
    cliente: {
      id: 1,
      codigo_cliente: 'CLI-10001',
      nombres: 'Carlos Andrés',
      apellidos: 'Mendoza Paredes',
      documento_identidad: '8492019',
      telefono: '+591 76543210',
      email: 'carlos.mendoza@email.com',
    },
    servicio: {
      id: 1,
      codigo_servicio: 'SRV-88201',
      plan_nombre: 'Plan Fibra Hogar 50 Mbps',
      velocidad_mbps: 50,
      precio_mensual: 220.00,
      direccion_instalacion: 'Av. Siempre Viva #742',
    },
  },
  {
    id: 3,
    codigo_factura: 'FAC-2026-10-C33',
    periodo: '2026-10',
    monto: 180.00,
    fecha_emision: '2026-10-01',
    fecha_vencimiento: '2026-10-10',
    estado_pago: 'PENDIENTE',
    cliente: {
      id: 2,
      codigo_cliente: 'CLI-10002',
      nombres: 'Valeria',
      apellidos: 'Rojas Silva',
      documento_identidad: '5318921',
      telefono: '+591 71239841',
      email: 'valeria.rojas@email.com',
    },
    servicio: {
      id: 2,
      codigo_servicio: 'SRV-88202',
      plan_nombre: 'Plan Esencial 30 Mbps',
      velocidad_mbps: 30,
      precio_mensual: 180.00,
      direccion_instalacion: 'Calle Los Pinos #12',
    },
  },
];

export const pagoMensualidadService = {
  /**
   * Obtiene facturas pendientes de cobro desde la BD PostgreSQL
   * @param {Object} params - Filtros opcionales { buscar, periodo }
   */
  async fetchPendientes(params = {}) {
    if (isDemoMode()) return mockPendientesCu10;
    const res = await apiClient.get('/cu10/pendientes', params);
    const data = res?.data;
    if (Array.isArray(data)) return data;
    return data?.data ?? [];
  },

  /**
   * Registra el pago en la BD y actualiza el estado de la mensualidad a PAGADO
   * @param {Object} data - Datos del cobro { mensualidad_id, monto_pagado, metodo_pago, numero_transaccion, observaciones }
   */
  async registrarPago(data) {
    return await apiClient.post('/cu10/pagos', data);
  },

  /**
   * Consulta el estado de servicio y facturas pendientes por CI en el Portal Cliente (CU10)
   * @param {string} ci - Cédula de identidad del cliente
   */
  async consultarPorCI(ci) {
    if (isDemoMode()) {
      const match = mockPendientesCu10.find((p) => p.cliente.documento_identidad === String(ci).trim());
      if (!match) {
        throw new Error('No se encontró ningún cliente registrado con el C.I. ingresado.');
      }
      return {
        cliente: match.cliente,
        tiene_deuda: true,
        mensaje: 'Tienes una mensualidad pendiente de pago.',
        factura: {
          id: match.id,
          codigo_factura: match.codigo_factura,
          periodo: match.periodo,
          monto: match.monto,
          fecha_emision: match.fecha_emision,
          fecha_vencimiento: match.fecha_vencimiento,
        },
        servicio: match.servicio,
        fecha_corte: '2026-10-15',
        dias_habiles_restantes: 3,
        en_riesgo_corte: false,
        total_facturas_pendientes: 1,
        monto_total_deuda: match.monto,
      };
    }
    const res = await apiClient.get(`/cu10/portal-cliente/consultar/${encodeURIComponent(ci)}`);
    return res?.data ?? res;
  },

  /**
   * Procesa el pago en línea autoservicio mediante QR, Transferencia o PayPal (CU10)
   * @param {Object} data - { mensualidad_id, monto_pagado, metodo_pago, numero_transaccion, detalles }
   */
  async pagarEnLinea(data) {
    if (isDemoMode()) {
      return {
        recibo: {
          codigo_recibo: 'REC-ONL-20261014-DEMO',
          fecha_hora: new Date().toISOString(),
          monto_total: data.monto_pagado,
          metodo_pago: data.metodo_pago,
          numero_transaccion: data.numero_transaccion || 'TXN-DEMO12345',
          cliente_nombre: 'Cliente Demostración',
          codigo_factura: 'FAC-DEMO',
          periodo: '2026-10',
        },
      };
    }
    const res = await apiClient.post('/cu10/portal-cliente/pagar', data);
    return res?.data ?? res;
  },
};
