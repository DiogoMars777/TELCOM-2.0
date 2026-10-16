/**
 * Pruebas del cambio de contraseña (CU01) en el frontend.
 *
 * Comprueban que el servicio llama al endpoint autenticado correcto, que envía
 * exactamente los campos esperados (sin ningún id de usuario, para no poder
 * afectar a otra cuenta) y que propaga los errores reales del backend.
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

const { authService } = await import(
  '../src/models/Paquetes/SeguridadAdministracion/CU01_IniciarCerrarSesion/authModel.js'
);
const { authToken } = await import('../src/services/apiClient.js');
const { evaluatePassword, isPasswordValid } = await import('../src/config/passwordPolicy.js');

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
  authToken.clear();
  authToken.set('tok-sesion');
});

test('cambiarPassword llama al endpoint autenticado con los tres campos', async () => {
  stubFetch(jsonResponse(200, { success: true, message: 'Contraseña actualizada correctamente.' }));

  const res = await authService.cambiarPassword({
    currentPassword: 'Actual123!',
    newPassword: 'NuevaClave123!',
    newPasswordConfirmation: 'NuevaClave123!',
  });

  assert.ok(lastCall.url.endsWith('/api/cu01/cambiar-password'));
  assert.equal(lastCall.init.method, 'POST');
  assert.equal(lastCall.init.headers.Authorization, 'Bearer tok-sesion');

  const body = JSON.parse(lastCall.init.body);
  assert.deepEqual(body, {
    current_password: 'Actual123!',
    new_password: 'NuevaClave123!',
    new_password_confirmation: 'NuevaClave123!',
  });
  // Nunca se envía un id de usuario: solo puede cambiar la propia cuenta.
  assert.equal('id' in body, false);
  assert.equal('user_id' in body, false);
  assert.equal('email' in body, false);

  assert.equal(res.success, true);
});

test('cambiarPassword propaga el error 422 del backend sin ocultar el mensaje', async () => {
  stubFetch(jsonResponse(422, {
    success: false,
    message: 'La contraseña actual es incorrecta.',
    errors: { current_password: ['La contraseña actual es incorrecta.'] },
  }));

  await assert.rejects(
    authService.cambiarPassword({
      currentPassword: 'MalaActual1!',
      newPassword: 'NuevaClave123!',
      newPasswordConfirmation: 'NuevaClave123!',
    }),
    (err) => err.status === 422 && err.errors.current_password[0] === 'La contraseña actual es incorrecta.'
  );
});

test('la política compartida exige los cinco requisitos', () => {
  assert.equal(isPasswordValid('ClaveSegura123!'), true);
  const checks = evaluatePassword('ClaveSegura123!');
  assert.equal(checks.length, 5);
  assert.ok(checks.every((c) => c.met));
});
