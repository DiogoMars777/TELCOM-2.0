/**
 * Pruebas reales del cliente HTTP (frontend/services/apiClient.js).
 *
 * Se ejecutan con el runner integrado de Node (`node --test`) y NO añaden
 * dependencias. Se reemplaza `fetch` por un doble de prueba para verificar el
 * comportamiento ante distintos códigos HTTP y fallos de red.
 *
 * Ejecutar:  npm test
 */
import test from 'node:test';
import assert from 'node:assert/strict';

// --- Entorno mínimo del navegador que usa apiClient ---
class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { this.map.set(key, String(value)); }
  removeItem(key) { this.map.delete(key); }
}

let unauthorizedEvents = 0;

globalThis.localStorage = new MemoryStorage();
globalThis.Event = class Event { constructor(type) { this.type = type; } };
globalThis.window = {
  dispatchEvent: () => { unauthorizedEvents += 1; },
};

const { apiClient, authToken, describeApiError } = await import('../src/services/apiClient.js');

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
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
  unauthorizedEvents = 0;
  lastCall = null;
  authToken.clear();
});

test('POST exitoso devuelve la respuesta del backend (confirma la operación)', async () => {
  stubFetch(jsonResponse(201, { success: true, message: 'Creado', data: { id: 7 } }));
  const res = await apiClient.post('/cu04/zonas', { codigo: 'Z-1' });
  assert.equal(res.success, true);
  assert.equal(res.data.id, 7);
});

test('POST 422 rechaza y expone los errores de validación', async () => {
  stubFetch(jsonResponse(422, {
    success: false,
    message: 'Los datos no son válidos.',
    errors: { email: ['El correo ya está registrado.'] },
  }));

  await assert.rejects(
    () => apiClient.post('/cu05/clientes', {}),
    (err) => {
      assert.equal(err.status, 422);
      assert.deepEqual(err.errors, { email: ['El correo ya está registrado.'] });
      return true;
    }
  );
});

test('POST 403 con mensaje del backend informa falta de autorización', async () => {
  stubFetch(jsonResponse(403, { success: false, message: 'No tienes autorización para esta acción.' }));
  await assert.rejects(apiClient.post('/cu03/usuarios', {}), (err) => {
    assert.equal(err.status, 403);
    assert.match(describeApiError(err), /autoriz/i);
    return true;
  });
});

test('POST 403 sin mensaje del backend usa un texto propio de autorización', async () => {
  stubFetch(jsonResponse(403, { success: false }));
  await assert.rejects(apiClient.post('/cu03/usuarios', {}), (err) => {
    assert.equal(describeApiError(err), 'No tienes autorización para realizar esta operación.');
    return true;
  });
});

test('POST 500 no filtra información sensible del servidor', async () => {
  stubFetch(jsonResponse(500, {
    success: false,
    message: 'SQLSTATE[HY000]: password=secreto123 stack trace...',
  }));

  let captured;
  await assert.rejects(apiClient.post('/cu05/clientes', {}), (err) => {
    captured = err;
    return true;
  });

  assert.equal(captured.status, 500);
  assert.match(describeApiError(captured), /servidor/i);
  assert.doesNotMatch(describeApiError(captured), /SQLSTATE|password|trace/i);
  assert.equal(describeApiError(captured), 'Ocurrió un problema en el servidor. Inténtalo más tarde.');
});

test('GET con error NO se convierte en null ni en datos ficticios: rechaza', async () => {
  stubFetch(jsonResponse(500, { success: false, message: 'boom' }));
  await assert.rejects(apiClient.get('/cu06/clientes'), (err) => err.status === 500);
});

test('GET 403 informa falta de autorización', async () => {
  stubFetch(jsonResponse(403, { success: false, message: 'Prohibido' }));
  await assert.rejects(apiClient.get('/cu02/auditoria'), (err) => err.status === 403);
});

test('PUT exitoso devuelve la confirmación del backend', async () => {
  stubFetch(jsonResponse(200, { success: true, message: 'Actualizado', data: { id: 1 } }));
  const res = await apiClient.put('/cu08/servicios/1/activar', { ip_asignada: '10.0.0.1' });
  assert.equal(res.success, true);
  assert.equal(lastCall.init.method, 'PUT');
});

test('DELETE envía el cuerpo JSON (motivo de baja) al backend', async () => {
  stubFetch(jsonResponse(200, { success: true, message: 'Baja realizada' }));
  await apiClient.delete('/cu07/clientes/3/baja', { motivo_baja: 'Mudanza' });
  assert.equal(lastCall.init.method, 'DELETE');
  assert.equal(JSON.parse(lastCall.init.body).motivo_baja, 'Mudanza');
});

test('Un HTTP 200 con success:false se trata como error', async () => {
  stubFetch(jsonResponse(200, { success: false, message: 'No se pudo procesar' }));
  await assert.rejects(apiClient.post('/cu10/pagos', {}), (err) => /No se pudo procesar/.test(err.message));
});

test('Error de red se normaliza con status 0 y mensaje claro', async () => {
  stubFetch(new Error('network down'));
  await assert.rejects(apiClient.get('/cu06/clientes'), (err) => {
    assert.equal(err.status, 0);
    assert.match(err.message, /No se pudo conectar/i);
    return true;
  });
});

test('401 con sesión activa dispara el evento de sesión expirada', async () => {
  authToken.set('token-valido');
  stubFetch(jsonResponse(401, { success: false, message: 'Unauthenticated.' }));
  await assert.rejects(apiClient.get('/cu01/me'), (err) => err.status === 401);
  assert.equal(unauthorizedEvents, 1);
});

test('401 sin sesión previa NO dispara el evento (login fallido)', async () => {
  stubFetch(jsonResponse(401, { success: false, message: 'Credenciales incorrectas.' }));
  await assert.rejects(apiClient.post('/cu01/login', { email: 'x', password: 'y' }));
  assert.equal(unauthorizedEvents, 0);
});
