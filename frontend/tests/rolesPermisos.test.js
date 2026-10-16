/**
 * Pruebas reales del servicio de roles y permisos (CU03).
 *
 * Verifican que la matriz se lea y se envíe a los endpoints reales, que no se
 * sustituyan los errores por datos ficticios y que el modo demostración no
 * toque la red.
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

const { usuarioService } = await import(
  '../src/models/Paquetes/SeguridadAdministracion/CU03_UsuariosRolesPermisos/usuarioModel.js'
);

function jsonResponse(status, body) {
  return { status, ok: status >= 200 && status < 300, json: async () => body };
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
  globalThis.__TELCOM_DEMO__ = false;
});

test.after(() => {
  delete globalThis.__TELCOM_DEMO__;
});

test('fetchRolesPermisos lee el catálogo real de roles y permisos', async () => {
  stubFetch(jsonResponse(200, {
    success: true,
    data: {
      roles: [{ id: 1, slug: 'admin', permisos: [] }],
      permisos: [{ id: 1, slug: 'auth.login', modulo: 'CU01' }],
    },
  }));

  const { roles, permisos } = await usuarioService.fetchRolesPermisos();

  assert.ok(lastCall.url.endsWith('/api/cu03/roles'));
  assert.equal(lastCall.init.method, 'GET');
  assert.equal(roles[0].slug, 'admin');
  assert.equal(permisos[0].slug, 'auth.login');
});

test('actualizarPermisosRol envía la matriz por PUT al endpoint correcto', async () => {
  stubFetch(jsonResponse(200, {
    success: true,
    data: { id: 2, slug: 'secretaria', permisos: [{ slug: 'clientes.view' }] },
  }));

  const res = await usuarioService.actualizarPermisosRol(2, ['auth.login', 'clientes.view']);

  assert.ok(lastCall.url.endsWith('/api/cu03/roles/2/permisos'));
  assert.equal(lastCall.init.method, 'PUT');
  assert.deepEqual(JSON.parse(lastCall.init.body), {
    permisos: ['auth.login', 'clientes.view'],
  });
  assert.equal(res.data.slug, 'secretaria');
});

test('actualizarPermisosRol NO sustituye el error del backend por datos ficticios', async () => {
  stubFetch(jsonResponse(403, { success: false, message: 'No autorizado' }));

  await assert.rejects(
    usuarioService.actualizarPermisosRol(2, ['auth.login']),
    (err) => err.status === 403
  );
});

test('En modo demostración el catálogo se sirve sin llamar a la red', async () => {
  globalThis.__TELCOM_DEMO__ = true;
  globalThis.fetch = async () => { throw new Error('No debe llamarse a fetch'); };

  const { roles, permisos } = await usuarioService.fetchRolesPermisos();

  assert.ok(roles.length >= 3);
  assert.ok(permisos.length >= 1);
});
