import { apiClient } from '../../../../services/apiClient.js';
import { isDemoMode } from '../../../../config/appConfig.js';

export const mockHistorialPagos = [
  {
    id: 1, codigo_recibo: 'REC-2026-0001', monto_pagado: 200, metodo_pago: 'QR',
    fecha_pago: '2026-10-13 10:30:00', cajero_nombre: 'Secretaría TELCOM',
    cliente_nombre: 'Carlos Mendoza', cliente_codigo: 'CLI-001', cliente_ci: '7845123',
    servicio_id: 1, servicio_codigo: 'SRV-001', plan_id: 1, plan_nombre: 'Fibra Básico', velocidad_mbps: 30, periodos: ['2026-10'], detalles: [],
  },
  {
    id: 2, codigo_recibo: 'REC-2026-0002', monto_pagado: 150, metodo_pago: 'EFECTIVO',
    fecha_pago: '2026-09-18 15:45:00', cajero_nombre: 'Secretaría TELCOM',
    cliente_nombre: 'María Rojas', cliente_codigo: 'CLI-002', cliente_ci: '6312458',
    servicio_id: 2, servicio_codigo: 'SRV-002', plan_id: 2, plan_nombre: 'Fibra Hogar', velocidad_mbps: 50, periodos: ['2026-09'], detalles: [],
  },
  {
    id: 3, codigo_recibo: 'REC-2026-0003', monto_pagado: 300, metodo_pago: 'TRANSFERENCIA',
    fecha_pago: '2026-08-05 09:10:00', cajero_nombre: 'Administrador TELCOM',
    cliente_nombre: 'Luis Fernández', cliente_codigo: 'CLI-003', cliente_ci: '9256741',
    servicio_id: 3, servicio_codigo: 'SRV-003', plan_id: 3, plan_nombre: 'Fibra Plus', velocidad_mbps: 100, periodos: ['2026-07', '2026-08'], detalles: [],
  },
];

function filtrarDemostracion(filters = {}) {
  const termino = String(filters.buscar || '').trim().toLocaleLowerCase('es');
  return mockHistorialPagos.filter((pago) => {
    const texto = [pago.codigo_recibo, pago.cliente_nombre, pago.cliente_codigo, pago.cliente_ci, pago.servicio_codigo, pago.plan_nombre]
      .filter(Boolean).join(' ').toLocaleLowerCase('es');
    const fecha = String(pago.fecha_pago || '').slice(0, 10);
    return (!termino || texto.includes(termino))
      && (!filters.plan_id || Number(filters.plan_id) === Number(pago.plan_id))
      && (!filters.periodo || pago.periodos.includes(filters.periodo))
      && (!filters.metodo_pago || pago.metodo_pago === filters.metodo_pago)
      && (!filters.fecha_desde || fecha >= filters.fecha_desde)
      && (!filters.fecha_hasta || fecha <= filters.fecha_hasta);
  });
}

function normalizePago(pago) {
  const detalles = pago.detalles || [];
  const mensualidades = detalles.map((detalle) => detalle.mensualidad).filter(Boolean);
  const primera = mensualidades[0] || pago.mensualidad || {};
  const cliente = primera.cliente || {};
  const servicio = primera.servicio || {};
  const asignacion = servicio.asignacion_plan_actual || servicio.asignacionPlanActual || {};
  const plan = asignacion.plan || {};
  const metodoRelacionado = typeof pago.metodo_pago === 'object'
    ? pago.metodo_pago?.nombreMetodo
    : null;
  return {
    ...pago,
    id: pago.id ?? pago.idPago,
    codigo_recibo: pago.codigo_recibo || pago.numeroComprobante || `REC-${pago.idPago}`,
    monto_pagado: Number(pago.monto_pagado ?? pago.montoTotal ?? 0),
    metodo_pago: (typeof pago.metodo_pago === 'string' ? pago.metodo_pago : null)
      || metodoRelacionado || pago.metodoPago?.nombreMetodo || 'No especificado',
    fecha_pago: pago.fecha_pago || pago.fechaHora,
    numero_transaccion: pago.numero_transaccion || null,
    observaciones: pago.observaciones || pago.observacion || null,
    cajero_nombre: pago.cajero_nombre || pago.cajero?.name || pago.cajero?.nombreCompleto || 'Sistema',
    cliente_nombre: cliente.nombre_completo || cliente.nombreCompleto
      || `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim() || 'Sin cliente',
    cliente_codigo: cliente.codigo_cliente || cliente.codigoCliente || null,
    cliente_ci: cliente.documento_identidad || cliente.ci || null,
    servicio_codigo: servicio.codigo_servicio || servicio.codigoServicio || null,
    servicio_id: servicio.id || servicio.idServicio || primera.servicio_id || primera.idServicio,
    plan_id: plan.id || plan.idPlan || asignacion.plan_id || asignacion.idPlan || null,
    plan_nombre: plan.nombre_plan || plan.nombrePlan || null,
    velocidad_mbps: plan.velocidad_mbps || plan.velocidadMbps || null,
    periodos: [...new Set(mensualidades.map((m) => m.periodo).filter(Boolean))],
    mensualidades,
    detalles,
  };
}

export const historialPagosService = {
  async fetchHistorial(filters = {}) {
    if (isDemoMode()) {
      const pagos = filtrarDemostracion(filters);
      return { pagos, meta: { current_page: 1, last_page: 1, total: pagos.length, from: pagos.length ? 1 : 0, to: pagos.length } };
    }
    const response = await apiClient.get('/cu11/historial', filters);
    const page = response?.data || {};
    return {
      pagos: (page.data || []).map(normalizePago),
      meta: {
        current_page: page.current_page || 1,
        last_page: page.last_page || 1,
        total: page.total || 0,
        from: page.from || 0,
        to: page.to || 0,
      },
    };
  },

  async fetchFiltros() {
    if (isDemoMode()) return {
      planes: [...new Map(mockHistorialPagos.map((p) => [p.plan_id, {
        id: p.plan_id, nombre: p.plan_nombre, velocidad_mbps: p.velocidad_mbps,
      }])).values()],
      metodos: [...new Set(mockHistorialPagos.map((p) => p.metodo_pago))],
    };
    const response = await apiClient.get('/cu11/historial/filtros');
    return response?.data || { planes: [], metodos: [] };
  },

  async fetchDetalle(id) {
    if (isDemoMode()) return mockHistorialPagos.find((p) => p.id === Number(id));
    const response = await apiClient.get(`/cu11/historial/${id}`);
    return normalizePago(response?.data || {});
  },
};
