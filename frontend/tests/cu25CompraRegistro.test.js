/**
 * Pruebas unitarias de CU25 - Registrar Compra de Equipo y Actualizar Stock.
 * Verifica la capa de datos, control de acceso RBAC y endpoints.
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
const { compraRegistroModel } = await import('../src/models/Paquetes/P5_EquiposProveedoresInventario/CU25_RegistrarCompraEquipo/compraRegistroModel.js');

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
});

// --------------------------- RBAC Access ---------------------------------

test('CU25 Permisos: Administrador con compras.manage tiene acceso a registrar compras', () => {
  const admin = { permisos: ['compras.manage', 'equipos.view'] };
  const sinPermiso = { permisos: ['equipos.view'] };

  assert.equal(canAccessCu(admin, 'CU25'), true);
  assert.equal(canAccessCu(sinPermiso, 'CU25'), false);
});

// --------------------------- Model & Endpoints ---------------------------

test('CU25: getCompras invoca GET /api/cu25/compras', async () => {
  stubFetch(jsonResponse(200, { success: true, data: { compras: [], total_compras: 0 } }));
  const res = await compraRegistroModel.getCompras();
  assert.equal(res.success, true);
  assert.match(lastCall.url, /\/api\/cu25\/compras/);
});

test('CU25: getProveedores invoca GET /api/cu25/compras/proveedores', async () => {
  stubFetch(jsonResponse(200, { success: true, data: [{ id: 1, razonSocial: 'Huawei' }] }));
  const res = await compraRegistroModel.getProveedores();
  assert.equal(res.success, true);
  assert.match(lastCall.url, /\/api\/cu25\/compras\/proveedores/);
});

test('CU25: getProductos invoca GET /api/cu25/compras/productos', async () => {
  stubFetch(jsonResponse(200, { success: true, data: [{ id: 1, nombre: 'ONT Huawei' }] }));
  const res = await compraRegistroModel.getProductos();
  assert.equal(res.success, true);
  assert.match(lastCall.url, /\/api\/cu25\/compras\/productos/);
});

test('CU25: createCompra envía POST a /api/cu25/compras con payload de abastecimiento', async () => {
  const payload = {
    proveedor_id: 1,
    nro_comprobante: 'FAC-2026-999',
    fecha_compra: '2026-11-22',
    detalles: [
      { producto_id: 2, cantidad: 15, precio_unitario: 280.00 },
    ],
  };

  stubFetch(jsonResponse(201, { success: true, message: 'Compra registrada' }));
  const res = await compraRegistroModel.createCompra(payload);
  assert.equal(res.success, true);
  assert.equal(lastCall.init.method, 'POST');
  assert.match(lastCall.url, /\/api\/cu25\/compras/);
  const sentBody = JSON.parse(lastCall.init.body);
  assert.equal(sentBody.nro_comprobante, 'FAC-2026-999');
  assert.equal(sentBody.detalles.length, 1);
});
