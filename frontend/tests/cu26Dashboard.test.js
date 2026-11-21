import test from 'node:test';
import assert from 'node:assert/strict';

class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { this.map.set(key, String(value)); }
  removeItem(key) { this.map.delete(key); }
}

globalThis.localStorage = new MemoryStorage();
globalThis.Event = class Event { constructor(type) { this.type = type; } };
globalThis.window = { dispatchEvent: () => {} };

const { canAccessCu, CU_PERMISSIONS, CU_ORDER } = await import('../src/config/access.js');
const {
  dashboardAdminFinancieroService,
  mockDashboardData,
} = await import('../src/models/Paquetes/P7_DashboardReportesInteligenciaVoz/CU26_VisualizarDashboardAdminFinanciero/dashboardAdminFinancieroModel.js');

test('CU26: permiso reportes.view configurado en access.js', () => {
  assert.equal(CU_PERMISSIONS.CU26, 'reportes.view', 'CU26 debe estar mapeado al permiso reportes.view');
  assert.ok(CU_ORDER.includes('CU26'), 'CU26 debe estar registrado en el orden preferido CU_ORDER');

  const admin = { permisos: ['reportes.view'] };
  const tecnico = { permisos: ['equipos.view'] };
  const invitado = { permisos: ['auth.login'] };

  assert.equal(canAccessCu(admin, 'CU26'), true, 'El administrador con reportes.view debe tener acceso a CU26');
  assert.equal(canAccessCu(tecnico, 'CU26'), false, 'Técnico sin reportes.view no debe ver CU26');
  assert.equal(canAccessCu(invitado, 'CU26'), false, 'Invitado sin permisos no debe ver CU26');
});

test('CU26: mockDashboardData contiene todas las métricas administrativas y financieras requeridas', () => {
  // Métricas financieras
  assert.ok(mockDashboardData.financiero, 'Debe incluir bloque financiero');
  assert.ok(typeof mockDashboardData.financiero.total_recaudado === 'number');
  assert.ok(typeof mockDashboardData.financiero.recaudacion_hoy === 'number');
  assert.ok(typeof mockDashboardData.financiero.cartera_vencida_mora === 'number');
  assert.ok(typeof mockDashboardData.financiero.tasa_cobranza_porcentaje === 'number');

  // Métricas operativas
  assert.ok(mockDashboardData.operativo, 'Debe incluir bloque operativo');
  assert.ok(typeof mockDashboardData.operativo.clientes_activos === 'number');
  assert.ok(typeof mockDashboardData.operativo.servicios_activos === 'number');
  assert.ok(typeof mockDashboardData.operativo.equipos_comodato_activos === 'number');

  // Series temporales y desgloses
  assert.ok(Array.isArray(mockDashboardData.evolucion_mensual), 'Debe incluir evolución mensual de 6 meses');
  assert.equal(mockDashboardData.evolucion_mensual.length, 6);
  assert.ok(Array.isArray(mockDashboardData.metodos_pago), 'Debe incluir desglose de métodos de pago');
  assert.ok(Array.isArray(mockDashboardData.planes_distribucion), 'Debe incluir distribución por planes');
  assert.ok(Array.isArray(mockDashboardData.zonas_cobertura), 'Debe incluir saturación de zonas');
  assert.ok(Array.isArray(mockDashboardData.alertas_morosidad), 'Debe incluir alertas de morosidad');
});

test('CU26: servicio responde en modo demo sin invocar red', async () => {
  globalThis.__TELCOM_DEMO__ = true;
  globalThis.fetch = async () => { throw new Error('No debe llamar a fetch en modo demo'); };

  const resumen = await dashboardAdminFinancieroService.fetchResumen('mes_actual');
  assert.ok(resumen, 'Debe devolver resumen consolidado');
  assert.equal(resumen.periodo_seleccionado, 'mes_actual');
  assert.ok(resumen.financiero.total_recaudado > 0);

  const financiero = await dashboardAdminFinancieroService.fetchFinanciero('mes_actual');
  assert.ok(financiero.kpis_financieros, 'Debe devolver kpis financieros');

  const alertas = await dashboardAdminFinancieroService.fetchAlertas();
  assert.ok(Array.isArray(alertas), 'Debe devolver arreglo de alertas');
  assert.ok(alertas.length > 0);
  assert.ok(alertas[0].urgencia, 'Cada alerta debe tener nivel de urgencia');
});
