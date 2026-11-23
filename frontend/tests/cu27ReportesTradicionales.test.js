/**
 * Pruebas unitarias para CU27 - Generar y exportar reportes tradicionales.
 */
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

const { canAccessCu } = await import('../src/config/access.js');
const { reporteTradicionalModel } = await import('../src/models/Paquetes/P7_DashboardReportesInteligenciaVoz/CU27_GenerarExportarReportesTradicionales/reporteTradicionalModel.js');

function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

let lastCall = null;
function stubFetch(response) {
  lastCall = null;
  globalThis.fetch = async (url, init) => {
    lastCall = { url, init };
    if (response instanceof Error) throw response;
    return response;
  };
}

test.beforeEach(() => {
  lastCall = null;
  globalThis.__TELCOM_DEMO__ = false;
});

test.after(() => {
  delete globalThis.__TELCOM_DEMO__;
});

// --------------------------- RBAC Access ---------------------------------

test('CU27 Permisos: Administrador tiene acceso con permiso reportes.view', () => {
  const admin = { permisos: ['reportes.view'] };
  assert.equal(canAccessCu(admin, 'CU27'), true);
});

test('CU27 Permisos: Usuario sin reportes.view no accede', () => {
  const sinPermiso = { permisos: ['clientes.view'] };
  assert.equal(canAccessCu(sinPermiso, 'CU27'), false);
});

// --------------------------- Catálogo y Parámetros -----------------------

test('CU27 fetchCatalogo consulta /api/cu27/catalogo y obtiene los 4 reportes', async () => {
  stubFetch(jsonResponse(200, {
    success: true,
    data: [
      { id: 'clientes_zona', nombre: 'Clientes por Zona' },
      { id: 'ingresos_pagos', nombre: 'Ingresos y Pagos' },
      { id: 'morosidad_cortes', nombre: 'Morosidad y Cortes' },
      { id: 'equipos_instalaciones', nombre: 'Equipos e Instalaciones' },
    ],
  }));

  const catalogo = await reporteTradicionalModel.fetchCatalogo();
  assert.equal(catalogo.length, 4);
  assert.match(lastCall.url, /\/cu27\/catalogo/);
});

test('CU27 fetchParametros obtiene zonas y métodos de pago para los filtros', async () => {
  stubFetch(jsonResponse(200, {
    success: true,
    data: {
      zonas: [{ id: 1, nombre: 'Zona Norte' }],
      metodos: [{ id: 1, nombre: 'EFECTIVO' }],
      estadosCliente: ['ACTIVO', 'INACTIVO'],
    },
  }));

  const params = await reporteTradicionalModel.fetchParametros();
  assert.equal(params.zonas.length, 1);
  assert.equal(params.metodos[0].nombre, 'EFECTIVO');
  assert.match(lastCall.url, /\/cu27\/parametros/);
});

// --------------------------- Generación de Reportes ----------------------

test('CU27 generarReporte envía filtros y recibe KPIs y registros consolidados', async () => {
  stubFetch(jsonResponse(200, {
    success: true,
    data: {
      tipo: 'ingresos_pagos',
      titulo: 'Reporte Financiero de Ingresos',
      kpis: { total_recaudado: 35000, total_transacciones: 180 },
      registros: [{ idPago: 1, numeroComprobante: 'REC-001', montoTotal: 200 }],
      fechaCorte: '2026-11-20 18:00:00',
    },
  }));

  const resultado = await reporteTradicionalModel.generarReporte({
    tipo_reporte: 'ingresos_pagos',
    fecha_desde: '2026-10-01',
    fecha_hasta: '2026-10-31',
  });

  assert.equal(resultado.tipo, 'ingresos_pagos');
  assert.equal(resultado.kpis.total_recaudado, 35000);
  assert.equal(resultado.registros.length, 1);
  assert.match(lastCall.url, /tipo_reporte=ingresos_pagos/);
});

test('CU27 en modo demostración explícito devuelve estructura sin llamar a fetch', async () => {
  globalThis.__TELCOM_DEMO__ = true;
  const catalogo = await reporteTradicionalModel.fetchCatalogo();
  assert.equal(catalogo.length, 4);
  assert.equal(lastCall, null);
});
