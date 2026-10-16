/**
 * Pruebas reales del modelo de autenticación (frontend).
 *
 * Verifican que la sesión guarda el usuario CON sus permisos (para el menú),
 * y que logout/clear eliminan el token y el usuario en caché, de modo que no
 * se conserve el menú de la sesión anterior.
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

const { authService } = await import('../src/models/Paquetes/SeguridadAdministracion/CU01_IniciarCerrarSesion/authModel.js');
const { authToken } = await import('../src/services/apiClient.js');

function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

test.beforeEach(() => {
  authToken.clear();
  localStorage.removeItem('telcom_user');
});

test('login guarda el usuario CON sus permisos y el token', async () => {
  globalThis.fetch = async () => jsonResponse(200, {
    success: true,
    data: {
      token: 'tok-abc',
      user: {
        id: 1,
        name: 'Admin',
        email: 'a@telcom.local',
        rol: { slug: 'admin' },
        permisos: ['usuarios.manage', 'clientes.view'],
      },
    },
  });

  const user = await authService.login({ email: 'a@telcom.local', password: 'secreto' });

  assert.deepEqual(user.permisos, ['usuarios.manage', 'clientes.view']);
  assert.equal(authToken.get(), 'tok-abc');
  assert.equal(authService.getCurrentUser().rol.slug, 'admin');
});

test('logout elimina token y usuario en caché (no queda menú previo)', async () => {
  globalThis.fetch = async (url) => {
    if (String(url).endsWith('/cu01/login')) {
      return jsonResponse(200, {
        success: true,
        data: {
          token: 'tok-1',
          user: { id: 2, rol: { slug: 'tecnico' }, permisos: ['servicios.view'] },
        },
      });
    }
    return jsonResponse(200, { success: true, message: 'ok' });
  };

  await authService.login({ email: 't@telcom.local', password: 'secreto' });
  assert.ok(authService.getCurrentUser(), 'debe haber sesión tras el login');

  await authService.logout();

  assert.equal(authToken.get(), null);
  assert.equal(authService.getCurrentUser(), null);
});

test('clear() elimina la sesión local por completo', () => {
  authToken.set('tok-2');
  localStorage.setItem('telcom_user', JSON.stringify({ id: 3, permisos: ['pagos.register'] }));

  authService.clear();

  assert.equal(authToken.get(), null);
  assert.equal(authService.getCurrentUser(), null);
});
