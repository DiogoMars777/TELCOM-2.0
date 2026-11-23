/**
 * Pruebas unitarias para CU29 - Capturar y transcribir comandos de voz.
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
const { comandoVozModel } = await import('../src/models/Paquetes/P7_DashboardReportesInteligenciaVoz/CU29_CapturarTranscribirComandosVoz/comandoVozModel.js');

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

test('CU29 Permisos: Administrador tiene acceso con permiso reportes.view', () => {
  const admin = { permisos: ['reportes.view'] };
  assert.equal(canAccessCu(admin, 'CU29'), true);
});

test('CU29 Permisos: Usuario sin permiso administrativo no accede a comandos de voz', () => {
  const sinPermiso = { permisos: ['equipos.view'] };
  assert.equal(canAccessCu(sinPermiso, 'CU29'), false);
});

// --------------------------- Transcripción y Procesamiento ---------------

test('CU29 transcribirComando envía texto dictado y recibe intención clasificada', async () => {
  stubFetch(jsonResponse(200, {
    success: true,
    data: {
      idComando: 10,
      textoDictado: 'Mostrar ingresos de la Zona Norte del último mes',
      intencion: 'REPORTE_INGRESOS',
      reporteSugerido: 'ingresos_pagos',
      parametros: { zona_id: 1, rango_etiqueta: 'Último mes' },
      confianza: 0.98,
      estado: 'TRANSCRITO',
    },
  }));

  const res = await comandoVozModel.transcribirComando({
    texto_dictado: 'Mostrar ingresos de la Zona Norte del último mes',
    duracion_segundos: 3.5,
  });

  assert.equal(res.intencion, 'REPORTE_INGRESOS');
  assert.equal(res.reporteSugerido, 'ingresos_pagos');
  assert.match(lastCall.url, /\/cu29\/transcribir/);
  assert.equal(lastCall.init.method, 'POST');
});

test('CU29 fetchHistorial obtiene la lista de comandos dictados', async () => {
  stubFetch(jsonResponse(200, {
    success: true,
    data: [
      { id: 1, texto: 'Reporte de morosidad', intencion: 'REPORTE_MOROSIDAD' },
    ],
  }));

  const hist = await comandoVozModel.fetchHistorial();
  assert.equal(hist.length, 1);
  assert.equal(hist[0].texto, 'Reporte de morosidad');
  assert.match(lastCall.url, /\/cu29\/historial/);
});

test('CU29 fetchEjemplos devuelve sugerencias en lenguaje natural', async () => {
  stubFetch(jsonResponse(200, {
    success: true,
    data: [
      { texto: 'Mostrar ingresos de la Zona Norte', intencion: 'Ingresos' },
    ],
  }));

  const ej = await comandoVozModel.fetchEjemplos();
  assert.equal(ej.length, 1);
  assert.match(lastCall.url, /\/cu29\/ejemplos/);
});

test('CU29 en modo demostración explícito devuelve mock sin red', async () => {
  globalThis.__TELCOM_DEMO__ = true;
  const res = await comandoVozModel.transcribirComando({
    texto_dictado: 'Prueba de voz',
  });
  assert.equal(res.textoDictado, 'Prueba de voz');
  assert.equal(lastCall, null);
});
