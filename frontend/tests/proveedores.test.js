import test from 'node:test';
import assert from 'node:assert/strict';
import { proveedorService as service } from '../src/models/Paquetes/P5_EquiposProveedoresInventario/CU24_GestionarProveedores/proveedorModel.js';
import {
  normalizarPayload, proveedorAFormulario, validarFormulario,
} from '../src/controllers/Paquetes/P5_EquiposProveedoresInventario/CU24_GestionarProveedores/useProveedorController.js';
import { describeApiError } from '../src/services/apiClient.js';

const originalFetch = globalThis.fetch;
const originalStorage = globalThis.localStorage;
const originalWindow = globalThis.window;
const proveedor = {
  idProveedor: 24, razonSocial: 'Redes SRL', nit: '0012345', telefono: null,
  correo: 'redes@proveedor.test', direccion: 'Av. Norte 10', estado: true,
};
let calls;

function stubFetch(body, status = 200) {
  globalThis.fetch = async (url, init) => {
    calls.push({ url: new URL(url), init });
    return { ok: status >= 200 && status < 300, status, json: async () => body };
  };
}

test.beforeEach(() => {
  calls = [];
  globalThis.localStorage = { getItem: () => 'token-cu24-test' };
  globalThis.window = { dispatchEvent: () => {} };
});

test.after(() => {
  globalThis.fetch = originalFetch;
  globalThis.localStorage = originalStorage;
  globalThis.window = originalWindow;
});

test('CU24 listado reenvía búsqueda y filtro inactivo y conserva campos canónicos', async () => {
  stubFetch({ success: true, data: { proveedores: [{ ...proveedor, estado: false }] } });
  const result = await service.fetchProveedores({ buscar: 'redes', estado: '0' });
  assert.deepEqual(result, [{ ...proveedor, estado: false }]);
  assert.equal(calls[0].url.pathname, '/api/cu24/proveedores');
  assert.equal(calls[0].url.searchParams.get('buscar'), 'redes');
  assert.equal(calls[0].url.searchParams.get('estado'), '0');
  assert.equal(calls[0].init.method, 'GET');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer token-cu24-test');
});

test('CU24 listado vacío sigue siendo una lista vacía', async () => {
  stubFetch({ success: true, data: { proveedores: [] } });
  assert.deepEqual(await service.fetchProveedores(), []);
});

test('CU24 consulta obtiene los datos actuales de un proveedor', async () => {
  stubFetch({ success: true, data: { proveedor } });
  assert.deepEqual(await service.fetchProveedor(24), proveedor);
  assert.equal(calls[0].url.pathname, '/api/cu24/proveedores/24');
  assert.equal(calls[0].init.method, 'GET');
});

test('CU24 creación envía datos normalizados conservando ceros iniciales del NIT', async () => {
  stubFetch({ success: true, data: { proveedor } }, 201);
  const form = { razonSocial: '  Redes SRL ', nit: ' 0012345 ', telefono: '  ', correo: ' redes@proveedor.test ', direccion: ' Av. Norte 10 ' };
  const payload = normalizarPayload(form);
  assert.deepEqual(await service.crearProveedor(payload), proveedor);
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].url.pathname, '/api/cu24/proveedores');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    razonSocial: 'Redes SRL', nit: '0012345', telefono: null,
    correo: 'redes@proveedor.test', direccion: 'Av. Norte 10',
  });
});

test('CU24 edición envía PUT sin id, estado ni campos ajenos al formulario', async () => {
  stubFetch({ success: true, data: { proveedor: { ...proveedor, razonSocial: 'Redes editado' } } });
  const form = proveedorAFormulario({ ...proveedor, razonSocial: 'Redes editado' });
  const result = await service.actualizarProveedor(24, normalizarPayload(form));
  assert.equal(result.razonSocial, 'Redes editado');
  assert.equal(calls[0].url.pathname, '/api/cu24/proveedores/24');
  assert.equal(calls[0].init.method, 'PUT');
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.nit, '0012345');
  assert.equal(body.telefono, null);
  assert.equal('estado' in body, false);
  assert.equal('idProveedor' in body, false);
});

test('CU24 activar y desactivar usan solo PUT a los endpoints dedicados', async () => {
  stubFetch({ success: true, data: { proveedor: { ...proveedor, estado: false } } });
  assert.equal((await service.desactivarProveedor(24)).estado, false);
  assert.equal(calls[0].url.pathname, '/api/cu24/proveedores/24/desactivar');
  stubFetch({ success: true, data: { proveedor } });
  assert.equal((await service.activarProveedor(24)).estado, true);
  assert.equal(calls[1].url.pathname, '/api/cu24/proveedores/24/activar');
  assert.ok(calls.every((c) => c.init.method === 'PUT'));
});

test('CU24 nunca intenta DELETE si falla la baja lógica', async () => {
  stubFetch({ success: false, message: 'No autorizado' }, 403);
  await assert.rejects(service.desactivarProveedor(24), (err) => err.status === 403);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init.method, 'PUT');
});

test('CU24 comunica NIT duplicado y correo inválido desde la validación del backend', async () => {
  stubFetch({ success: false, errors: { nit: ['Ya existe un proveedor con este NIT.'] } }, 422);
  await assert.rejects(service.crearProveedor({}), (err) => describeApiError(err) === 'Ya existe un proveedor con este NIT.');
  stubFetch({ success: false, errors: { correo: ['Ingresa un correo electrónico válido.'] } }, 422);
  await assert.rejects(service.actualizarProveedor(24, {}), (err) => describeApiError(err) === 'Ingresa un correo electrónico válido.');
});

test('CU24 propaga errores de permisos, servidor y red sin inventar proveedores', async () => {
  for (const status of [401, 403, 404, 500]) {
    stubFetch({ success: false }, status);
    await assert.rejects(service.fetchProveedores(), (err) => err.status === status);
    await assert.rejects(service.fetchProveedor(24), (err) => err.status === status);
  }
  globalThis.fetch = async () => { throw new Error('offline'); };
  await assert.rejects(service.fetchProveedores(), (err) => err.status === 0);
});

test('CU24 formulario representa opcionales nulos como vacíos y no cambia el proveedor', () => {
  const form = proveedorAFormulario({ ...proveedor, correo: null, direccion: null });
  assert.deepEqual(form, { razonSocial: 'Redes SRL', nit: '0012345', telefono: '', correo: '', direccion: '' });
  form.razonSocial = 'Otro';
  assert.equal(proveedor.razonSocial, 'Redes SRL');
  assert.deepEqual(proveedorAFormulario(), { razonSocial: '', nit: '', telefono: '', correo: '', direccion: '' });
});

test('CU24 controlador exige razón social y NIT antes de guardar', () => {
  assert.equal(validarFormulario({ razonSocial: '  ', nit: '123' }), 'La razón social es obligatoria.');
  assert.equal(validarFormulario({ razonSocial: 'Proveedor', nit: '  ' }), 'El NIT es obligatorio.');
  assert.equal(validarFormulario(proveedorAFormulario(proveedor)), null);
  const payload = normalizarPayload(proveedorAFormulario());
  assert.equal(payload.correo, null);
  assert.equal(payload.direccion, null);
});
