/**
 * Pruebas de recuperación de contraseña (CU01) en el frontend.
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
const { isPasswordValid } = await import('../src/config/passwordPolicy.js');

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

test('solicitarRecuperacionPassword envía POST a /cu01/recuperar-password/solicitar con el email', async () => {
  stubFetch(jsonResponse(200, { success: true, message: 'Si el correo ingresado se encuentra registrado...' }));

  const res = await authService.solicitarRecuperacionPassword('usuario@telcom.com');

  assert.ok(lastCall.url.endsWith('/api/cu01/recuperar-password/solicitar'));
  assert.equal(lastCall.init.method, 'POST');
  assert.deepEqual(JSON.parse(lastCall.init.body), { email: 'usuario@telcom.com' });
  assert.equal(res.success, true);
});

test('verificarCodigoRecuperacion envía POST con email y codigo', async () => {
  stubFetch(jsonResponse(200, { success: true, message: 'Código de verificación válido.' }));

  const res = await authService.verificarCodigoRecuperacion({
    email: 'usuario@telcom.com',
    codigo: '123456',
  });

  assert.ok(lastCall.url.endsWith('/api/cu01/recuperar-password/verificar-codigo'));
  assert.equal(lastCall.init.method, 'POST');
  assert.deepEqual(JSON.parse(lastCall.init.body), {
    email: 'usuario@telcom.com',
    codigo: '123456',
  });
  assert.equal(res.success, true);
});

test('restablecerPassword envía los campos correctos y propaga errores 422', async () => {
  stubFetch(jsonResponse(200, {
    success: true,
    message: 'Tu contraseña ha sido restablecida exitosamente.',
  }));

  const res = await authService.restablecerPassword({
    email: 'usuario@telcom.com',
    codigo: '123456',
    password: 'NuevaClave123!',
    passwordConfirmation: 'NuevaClave123!',
  });

  assert.ok(lastCall.url.endsWith('/api/cu01/recuperar-password/restablecer'));
  assert.equal(lastCall.init.method, 'POST');
  assert.deepEqual(JSON.parse(lastCall.init.body), {
    email: 'usuario@telcom.com',
    codigo: '123456',
    password: 'NuevaClave123!',
    password_confirmation: 'NuevaClave123!',
  });
  assert.equal(res.success, true);

  // Error al rechazar código incorrecto
  stubFetch(jsonResponse(422, {
    success: false,
    message: 'El código de verificación ingresado es incorrecto.',
  }));

  await assert.rejects(
    authService.restablecerPassword({
      email: 'usuario@telcom.com',
      codigo: '000000',
      password: 'NuevaClave123!',
      passwordConfirmation: 'NuevaClave123!',
    }),
    (err) => err.status === 422
  );
});

test('la política exige mayúscula, minúscula, número y símbolo para restablecer', () => {
  assert.equal(isPasswordValid('SinSimbolo123'), false);
  assert.equal(isPasswordValid('sinnumeros!A'), false);
  assert.equal(isPasswordValid('SINMINUSCULAS1!'), false);
  assert.equal(isPasswordValid('ValidaClave456!'), true);
});
