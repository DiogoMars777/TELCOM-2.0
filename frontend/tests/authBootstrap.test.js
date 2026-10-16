/**
 * Pruebas de regresión del arranque de sesión (CU01).
 *
 * Cubren el fallo detectado en desarrollo: al recargar la app, React
 * `StrictMode` monta, limpia y vuelve a montar el efecto de bootstrap; la
 * respuesta del primer intento (ya desmontado) llegaba con usuario válido y
 * caía en la rama que hacía `authService.clear()`, borrando el token y
 * cerrando la sesión.
 *
 * Regla verificada: la respuesta de un efecto desmontado NO debe tocar el
 * token ni la sesión; solo el intento vigente resuelve.
 *
 * Ejecutar:  npm test
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { runAuthBootstrap } from '../src/models/Paquetes/SeguridadAdministracion/CU01_IniciarCerrarSesion/authBootstrap.js';

/** Crea un authService simulado cuyas promesas se resuelven a mano. */
function makeAuthService(initialToken = 'tok-1') {
  const pending = [];
  const calls = { clear: 0, fetch: 0, getToken: 0 };
  const service = {
    pending,
    calls,
    token: initialToken,
    cached: null,
    getToken() { calls.getToken += 1; return this.token; },
    getCurrentUser() { return this.cached; },
    clear() { calls.clear += 1; this.token = null; this.cached = null; },
    fetchCurrentUser() {
      calls.fetch += 1;
      return new Promise((resolve) => pending.push(resolve));
    },
  };
  return service;
}

/** Ejecuta un arranque guardado y devuelve su estado de montaje + efectos. */
function startBootstrap(authService) {
  const state = { mounted: true, user: undefined, booted: false };
  const done = runAuthBootstrap({
    isMounted: () => state.mounted,
    authService,
    onAuthenticated: (u) => { state.user = u; },
    onBooted: () => { state.booted = true; },
  });
  return { state, done };
}

test('recarga (StrictMode): la respuesta de un efecto desmontado no borra el token ni cierra la sesión', async () => {
  const authService = makeAuthService('tok-vivo');

  // Intento A (el que se limpia en StrictMode) y su petición pendiente.
  const a = startBootstrap(authService);
  // StrictMode desmonta A y monta B antes de que A resuelva.
  a.state.mounted = false;
  const b = startBootstrap(authService);

  // Primero resuelve la respuesta de A (efecto ya desmontado) con usuario VÁLIDO.
  authService.pending[0]({ id: 1, permisos: ['clientes.view'] });
  await a.done;

  assert.equal(authService.calls.clear, 0, 'la respuesta obsoleta NO debe borrar el token');
  assert.equal(authService.token, 'tok-vivo', 'el token sigue vivo tras la respuesta obsoleta');
  assert.equal(a.state.user, undefined, 'no debe autenticar desde el efecto desmontado');
  assert.equal(a.state.booted, false, 'un efecto desmontado no finaliza el booteo');

  // Luego resuelve la del intento vigente B.
  authService.pending[1]({ id: 1, permisos: ['clientes.view'] });
  await b.done;

  assert.deepEqual(b.state.user, { id: 1, permisos: ['clientes.view'] });
  assert.equal(b.state.booted, true);
  assert.equal(authService.calls.clear, 0);
});

test('recarga (StrictMode): un 401 de un efecto desmontado tampoco borra el token', async () => {
  const authService = makeAuthService('tok-vivo');

  const a = startBootstrap(authService);
  a.state.mounted = false;
  const b = startBootstrap(authService);

  const err = Object.assign(new Error('Unauthorized'), { status: 401 });
  authService.pending[0](Promise.reject(err));
  await a.done;

  assert.equal(authService.calls.clear, 0, 'un 401 obsoleto NO debe cerrar la sesión vigente');
  assert.equal(authService.token, 'tok-vivo');

  authService.pending[1]({ id: 2, permisos: ['servicios.view'] });
  await b.done;
  assert.equal(authService.token, 'tok-vivo');
  assert.deepEqual(b.state.user, { id: 2, permisos: ['servicios.view'] });
});

test('efecto vigente: token válido autentica y finaliza el booteo', async () => {
  const authService = makeAuthService('tok-ok');
  const { state, done } = startBootstrap(authService);

  authService.pending[0]({ id: 9, permisos: ['zonas.manage'] });
  await done;

  assert.deepEqual(state.user, { id: 9, permisos: ['zonas.manage'] });
  assert.equal(state.booted, true);
  assert.equal(authService.calls.clear, 0);
});

test('efecto vigente: 401 sí limpia la sesión (token inválido real)', async () => {
  const authService = makeAuthService('tok-invalido');
  const { done } = startBootstrap(authService);

  const err = Object.assign(new Error('Unauthorized'), { status: 401 });
  authService.pending[0](Promise.reject(err));
  await done;

  assert.equal(authService.calls.clear, 1, 'un 401 vigente sí debe limpiar');
  assert.equal(authService.token, null);
});

test('efecto vigente sin conexión: conserva la sesión en caché', async () => {
  const authService = makeAuthService('tok-cache');
  authService.cached = { id: 7, permisos: ['clientes.view'] };
  const { state, done } = startBootstrap(authService);

  authService.pending[0](Promise.reject(new Error('Network Error')));
  await done;

  assert.deepEqual(state.user, { id: 7, permisos: ['clientes.view'] });
  assert.equal(authService.calls.clear, 0);
  assert.equal(state.booted, true);
});

test('sin token no consulta /me y finaliza el booteo', async () => {
  const authService = makeAuthService(null);
  const { state, done } = startBootstrap(authService);

  await done;

  assert.equal(authService.calls.fetch, 0);
  assert.equal(authService.calls.clear, 0);
  assert.equal(state.user, undefined);
  assert.equal(state.booted, true);
});
