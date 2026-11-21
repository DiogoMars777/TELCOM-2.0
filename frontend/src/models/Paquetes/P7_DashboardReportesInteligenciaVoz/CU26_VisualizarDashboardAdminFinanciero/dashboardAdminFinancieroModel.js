import { apiClient } from '../../../../services/apiClient.js';
import { isDemoMode } from '../../../../config/appConfig.js';

/**
 * Datos mock de respaldo SOLO para modo demostración sin conexión backend.
 */
export const mockDashboardData = {
  periodo_seleccionado: 'Mes Actual (Noviembre 2026)',
  fecha_generacion: new Date().toISOString(),
  financiero: {
    total_recaudado: 35070.0,
    cantidad_transacciones: 190,
    recaudacion_hoy: 1250.0,
    pagos_hoy_cantidad: 7,
    recaudado_mes_actual: 35070.0,
    cartera_vencida_mora: 1930.0,
    facturas_en_mora_cantidad: 10,
    total_facturado_acumulado: 37000.0,
    tasa_cobranza_porcentaje: 94.8,
    ticket_promedio: 184.58,
    moneda: 'Bs',
  },
  operativo: {
    total_clientes: 20,
    clientes_activos: 20,
    clientes_nuevos_mes: 3,
    total_servicios: 20,
    servicios_activos: 20,
    servicios_para_corte: 3,
    servicios_cortados: 1,
    servicios_proximos_vencer: 4,
    instalaciones_pendientes: 4,
    instalaciones_programadas: 2,
    instalaciones_mes_completadas: 5,
    equipos_comodato_activos: 20,
    equipos_stock_disponible: 18,
  },
  evolucion_mensual: [
    { periodo: '2026-06', mes_nombre: 'Junio 2026', recaudado: 28500, facturado: 30000, mora: 1500, porcentaje_cobro: 95.0 },
    { periodo: '2026-07', mes_nombre: 'Julio 2026', recaudado: 31200, facturado: 32000, mora: 800, porcentaje_cobro: 97.5 },
    { periodo: '2026-08', mes_nombre: 'Agosto 2026', recaudado: 33400, facturado: 34500, mora: 1100, porcentaje_cobro: 96.8 },
    { periodo: '2026-09', mes_nombre: 'Septiembre 2026', recaudado: 34100, facturado: 35000, mora: 900, porcentaje_cobro: 97.4 },
    { periodo: '2026-10', mes_nombre: 'Octubre 2026', recaudado: 34800, facturado: 36000, mora: 1200, porcentaje_cobro: 96.7 },
    { periodo: '2026-11', mes_nombre: 'Noviembre 2026', recaudado: 35070, facturado: 37000, mora: 1930, porcentaje_cobro: 94.8 },
  ],
  metodos_pago: [
    { metodo: 'QR BANCO', total_monto: 19800.0, transacciones: 108, porcentaje: 56.5, color: '#8b5cf6' },
    { metodo: 'EFECTIVO', total_monto: 12500.0, transacciones: 67, porcentaje: 35.6, color: '#10b981' },
    { metodo: 'TRANSFERENCIA', total_monto: 2770.0, transacciones: 15, porcentaje: 7.9, color: '#3b82f6' },
  ],
  planes_distribucion: [
    { id_plan: 1, nombre_plan: 'Plan Básico (30 Mbps)', velocidad_mbps: 30, precio_mensual: 130.0, abonados_activos: 8, ingreso_estimado: 1040.0, porcentaje: 40.0 },
    { id_plan: 2, nombre_plan: 'Plan Estándar (50 Mbps)', velocidad_mbps: 50, precio_mensual: 180.0, abonados_activos: 6, ingreso_estimado: 1080.0, porcentaje: 30.0 },
    { id_plan: 3, nombre_plan: 'Plan Avanzado (100 Mbps)', velocidad_mbps: 100, precio_mensual: 240.0, abonados_activos: 4, ingreso_estimado: 960.0, porcentaje: 20.0 },
    { id_plan: 4, nombre_plan: 'Plan Corporativo (200 Mbps)', velocidad_mbps: 200, precio_mensual: 350.0, abonados_activos: 2, ingreso_estimado: 700.0, porcentaje: 10.0 },
  ],
  zonas_cobertura: [
    { id_zona: 1, nombre_zona: 'Zona Norte - Fibra Troncal', ciudad: 'Santa Cruz', clientes_count: 8, servicios_count: 8, capacidad_nodos: 120, porcentaje_saturacion: 6.7, estado_cobertura: 'DISPONIBLE' },
    { id_zona: 2, nombre_zona: 'Zona Este - Villa 1ro de Mayo', ciudad: 'Santa Cruz', clientes_count: 7, servicios_count: 7, capacidad_nodos: 100, porcentaje_saturacion: 7.0, estado_cobertura: 'DISPONIBLE' },
    { id_zona: 3, nombre_zona: 'Zona Sur - Santos Dumont', ciudad: 'Santa Cruz', clientes_count: 5, servicios_count: 5, capacidad_nodos: 80, porcentaje_saturacion: 6.3, estado_cobertura: 'DISPONIBLE' },
  ],
  alertas_morosidad: [
    { id_cliente: 4, codigo_cliente: 'CLI-SCZ-00004', nombre_cliente: 'Sofia Lorena Vaca Pinto', telefono: '71004455', id_servicio: 4, codigo_servicio: 'SRV-00004', meses_adeudados: 2, total_deuda: 360.0, dias_mora: 35, urgencia: 'CRITICA' },
    { id_cliente: 8, codigo_cliente: 'CLI-SCZ-00008', nombre_cliente: 'Mariana Rios Céspedes', telefono: '78008899', id_servicio: 8, codigo_servicio: 'SRV-00008', meses_adeudados: 1, total_deuda: 180.0, dias_mora: 18, urgencia: 'ALTA' },
    { id_cliente: 12, codigo_cliente: 'CLI-SCZ-00012', nombre_cliente: 'Ricardo Paz Justiniano', telefono: '76001234', id_servicio: 12, codigo_servicio: 'SRV-00012', meses_adeudados: 1, total_deuda: 130.0, dias_mora: 12, urgencia: 'MEDIA' },
  ],
};

export const dashboardAdminFinancieroService = {
  /**
   * Consulta el consolidado general de métricas administrativas y financieras.
   */
  async fetchResumen(periodo = 'mes_actual') {
    if (isDemoMode()) {
      return { ...mockDashboardData, periodo_seleccionado: periodo };
    }

    const res = await apiClient.get('/cu26/dashboard', { periodo });
    return res?.data ?? mockDashboardData;
  },

  /**
   * Consulta métricas financieras específicas.
   */
  async fetchFinanciero(periodo = 'mes_actual') {
    if (isDemoMode()) {
      return {
        kpis_financieros: mockDashboardData.financiero,
        evolucion_mensual: mockDashboardData.evolucion_mensual,
        metodos_pago: mockDashboardData.metodos_pago,
        ingresos_por_plan: mockDashboardData.planes_distribucion,
      };
    }

    const res = await apiClient.get('/cu26/dashboard/financiero', { periodo });
    return res?.data;
  },

  /**
   * Consulta alertas de morosidad crítica.
   */
  async fetchAlertas() {
    if (isDemoMode()) {
      return mockDashboardData.alertas_morosidad;
    }

    const res = await apiClient.get('/cu26/dashboard/alertas');
    return Array.isArray(res?.data) ? res.data : (res?.data?.data ?? []);
  },
};
