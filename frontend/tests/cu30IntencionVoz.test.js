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

function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

let fetchCalls = 0;
function stubFetch(response) {
  fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    if (response instanceof Error) throw response;
    return response;
  };
}

const { canAccessCu } = await import('../src/config/access.js');
const {
  intencionVozService,
  mockIntencionResult,
} = await import('../src/models/Paquetes/P7_DashboardReportesInteligenciaVoz/CU30_ProcesarIntencionVozIA/intencionVozModel.js');

test('CU30: permiso voz.nlp configurado en access.js', () => {
  const admin = { permisos: ['voz.nlp'] };
  const invitado = { permisos: ['auth.login'] };

  assert.equal(canAccessCu(admin, 'CU30'), true, 'El administrador con voz.nlp debe tener acceso a CU30');
  assert.equal(canAccessCu(invitado, 'CU30'), false, 'Un usuario sin permiso voz.nlp no debe tener acceso a CU30');
});

test('CU30: modelo mock devuelve estructura completa en modo demo o fallback', () => {
  assert.ok(mockIntencionResult.intencion_canonica, 'Debe contener intención canónica');
  assert.ok(mockIntencionResult.categoria, 'Debe contener categoría de negocio');
  assert.ok(mockIntencionResult.accion_sugerida.destino, 'Debe sugerir destino de navegación');
  assert.equal(mockIntencionResult.accion_sugerida.destino, 'CU06');
  assert.ok(mockIntencionResult.respuesta_asistente, 'Debe tener mensaje del asistente');
  assert.ok(mockIntencionResult.datos_en_vivo, 'Debe tener previsualización de datos');
});

test('CU30: catálogo responde en modo demo sin llamar a fetch', async () => {
  globalThis.__TELCOM_DEMO__ = true;
  globalThis.fetch = async () => { throw new Error('No debe llamar a fetch en modo demo'); };

  const catalogo = await intencionVozService.fetchCatalogo();
  assert.ok(catalogo, 'Debe responder catálogo');
  assert.ok(Array.isArray(catalogo.intenciones), 'Debe contener arreglo de intenciones');
  assert.ok(catalogo.intenciones.length >= 2, 'Debe tener intenciones listadas');
});

test('CU30: procesamiento de intención exitoso con API real/stub', async () => {
  globalThis.__TELCOM_DEMO__ = false;
  stubFetch(jsonResponse(200, {
    success: true,
    data: {
      intencion_canonica: 'SERVICIOS_CORTE',
      confianza: 0.98,
      accion_sugerida: { tipo: 'navigate_to', destino: 'CU13' },
    },
  }));

  const res = await intencionVozService.procesarIntencion({ texto: 'mostrar cortes' });
  assert.equal(res.intencion_canonica, 'SERVICIOS_CORTE');
  assert.equal(res.accion_sugerida.destino, 'CU13');
  assert.equal(fetchCalls, 1);
});
