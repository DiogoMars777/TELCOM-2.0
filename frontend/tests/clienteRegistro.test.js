/**
 * Pruebas de CU05 (Registrar Nuevo Cliente).
 *
 * Regresión del selector «Zona de Cobertura»: la API responde
 * `{ success, message, data: [...] }` (el arreglo viene en `data`), NO
 * `{ data: { data: [...] } }`. La versión anterior leía `data.data` y
 * devolvía `[]`, por lo que el selector no mostraba ninguna opción.
 *
 * Se ejecutan con el runner integrado de Node (`node --test`), sin
 * dependencias adicionales ni acceso a base de datos.
 *
 * Ejecutar:  npm test
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

const { clienteRegistroService, mockZonasCu05 } =
  await import('../src/models/Paquetes/GestionClientesZonas/CU05_RegistrarCliente/clienteRegistroModel.js');

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

// Respuesta REAL del endpoint `GET /api/cu05/zonas`
// ({ success, message, data: [...] }), replicada con tres zonas reales.
const RESPUESTA_API = {
  success: true,
  message: 'Zonas de cobertura obtenidas exitosamente.',
  data: [
    { id: 10, codigo: 'Zona norte', nombre: 'centro', ciudad: 'La Paz' },
    { id: 1, codigo: 'ZON-NORTE', nombre: 'Zona Norte - Fibra Óptica Troncal', ciudad: 'La Paz / El Alto' },
    { id: 2, codigo: 'ZON-SUR', nombre: 'Zona Sur - Anillo Metropolitano', ciudad: 'Santa Cruz de la Sierra' },
  ],
};

test('fetchZonas pide /cu05/zonas y devuelve el arreglo de `data` (forma real de la API)', async () => {
  stubFetch(jsonResponse(200, RESPUESTA_API));

  const zonas = await clienteRegistroService.fetchZonas();

  assert.equal(lastCall.init.method, 'GET');
  assert.match(lastCall.url, /\/cu05\/zonas$/);
  // Regresión: antes devolvía [] porque leía `res.data.data`.
  assert.equal(Array.isArray(zonas), true);
  assert.equal(zonas.length, 3);
  assert.equal(zonas[0].id, 10);
  assert.equal(zonas[0].nombre, 'centro');
  assert.equal(zonas[0].ciudad, 'La Paz');
  assert.equal(zonas[2].ciudad, 'Santa Cruz de la Sierra');
});

test('fetchZonas también acepta la forma anidada `data.data` (listado paginado a futuro)', async () => {
  stubFetch(jsonResponse(200, { success: true, data: { data: [{ id: 5, nombre: 'Z', ciudad: 'C' }] } }));

  const zonas = await clienteRegistroService.fetchZonas();

  assert.deepEqual(zonas, [{ id: 5, nombre: 'Z', ciudad: 'C' }]);
});

test('fetchZonas devuelve [] ante una lista realmente vacía', async () => {
  stubFetch(jsonResponse(200, { success: true, message: 'ok', data: [] }));

  const zonas = await clienteRegistroService.fetchZonas();

  assert.deepEqual(zonas, []);
  assert.equal(Array.isArray(zonas), true);
});

test('fetchZonas propaga el error (403) para que la pantalla muestre el estado de error', async () => {
  stubFetch(jsonResponse(403, { success: false, message: 'No tienes autorización.' }));

  await assert.rejects(clienteRegistroService.fetchZonas(), (err) => {
    assert.equal(err.status, 403);
    return true;
  });
});

test('registerCliente hace POST a /cu05/clientes con el `zona_id` elegido', async () => {
  stubFetch(jsonResponse(201, { success: true, data: { codigo_cliente: 'CLI-ABC123' } }));

  const res = await clienteRegistroService.registerCliente({ zona_id: 10, nombres: 'Ana' });

  assert.equal(lastCall.init.method, 'POST');
  assert.match(lastCall.url, /\/cu05\/clientes$/);
  assert.equal(JSON.parse(lastCall.init.body).zona_id, 10);
  assert.equal(res.data.codigo_cliente, 'CLI-ABC123');
});

test('En modo demostración el catálogo es local y no llama a fetch', async () => {
  globalThis.__TELCOM_DEMO__ = true;
  globalThis.fetch = async () => { throw new Error('No debería llamarse a fetch en modo demostración'); };

  const zonas = await clienteRegistroService.fetchZonas();

  assert.deepEqual(zonas, mockZonasCu05);
});
