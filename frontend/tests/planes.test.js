/**
 * Pruebas reales de la capa de datos de CU16 (catálogo de planes) y CU17
 * (asignación / cambio de plan de un servicio).
 *
 * Comprueban que los servicios de planes llaman a los endpoints REALES, que
 * respetan los contratos de la API y que, con el modo demostración DESACTIVADO
 * (por defecto), los errores NO se sustituyen por datos de ejemplo.
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

const { planInternetService, mockPlanesCatalogo } =
  await import('../src/models/Paquetes/ServiciosPlanes/CU16_GestionarCatalogoPlanes/planInternetModel.js');
const { asignacionPlanService } =
  await import('../src/models/Paquetes/ServiciosPlanes/CU17_AsignarPlanServicio/asignacionPlanModel.js');

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

// ------------------------------ CU16 -------------------------------------

test('CU16 fetchPlanes extrae data.planes y reenvía los filtros', async () => {
  stubFetch(jsonResponse(200, { success: true, data: { planes: [{ id: 1, nombre_plan: 'Fibra' }] } }));
  const planes = await planInternetService.fetchPlanes({ buscar: 'fibra', activo: 1 });
  assert.equal(planes.length, 1);
  assert.equal(planes[0].nombre_plan, 'Fibra');
  assert.match(lastCall.url, /\/planes\?/);
  assert.match(lastCall.url, /buscar=fibra/);
  assert.match(lastCall.url, /activo=1/);
});

test('CU16 crearPlan hace POST /planes con el cuerpo validado', async () => {
  stubFetch(jsonResponse(201, { success: true, data: { plan: { id: 7, nombre_plan: 'Nuevo' } } }));
  const plan = await planInternetService.crearPlan({ nombre_plan: 'Nuevo', velocidad_mbps: 50, precio_mensual: 160 });
  assert.equal(plan.id, 7);
  assert.equal(lastCall.init.method, 'POST');
  assert.match(lastCall.url, /\/planes$/);
  const body = JSON.parse(lastCall.init.body);
  assert.equal(body.nombre_plan, 'Nuevo');
  assert.equal(body.velocidad_mbps, 50);
});

test('CU16 actualizarPlan hace PUT /planes/{id}', async () => {
  stubFetch(jsonResponse(200, { success: true, data: { plan: { id: 3 } } }));
  await planInternetService.actualizarPlan(3, { nombre_plan: 'Editado' });
  assert.equal(lastCall.init.method, 'PUT');
  assert.match(lastCall.url, /\/planes\/3$/);
});

test('CU16 activar/desactivar usan los endpoints dedicados', async () => {
  stubFetch(jsonResponse(200, { success: true, data: { plan: { id: 5, activo: false } } }));
  await planInternetService.desactivarPlan(5);
  assert.equal(lastCall.init.method, 'PUT');
  assert.match(lastCall.url, /\/planes\/5\/desactivar$/);

  stubFetch(jsonResponse(200, { success: true, data: { plan: { id: 5, activo: true } } }));
  await planInternetService.activarPlan(5);
  assert.match(lastCall.url, /\/planes\/5\/activar$/);
});

test('CU16 no sustituye un error real por el catálogo de ejemplo', async () => {
  stubFetch(jsonResponse(500, { success: false, message: 'boom' }));
  await assert.rejects(planInternetService.fetchPlanes(), (err) => err.status === 500);
  stubFetch(new Error('offline'));
  let resultado = null;
  try {
    resultado = await planInternetService.fetchPlanes();
  } catch {
    resultado = null;
  }
  assert.notEqual(resultado, mockPlanesCatalogo);
});

test('CU16 en modo demostración explícito devuelve el catálogo de ejemplo sin red', async () => {
  globalThis.__TELCOM_DEMO__ = true;
  globalThis.fetch = async () => { throw new Error('No debería llamarse a fetch en modo demostración'); };
  const planes = await planInternetService.fetchPlanes();
  assert.deepEqual(planes, mockPlanesCatalogo);
});

// ------------------------------ CU17 -------------------------------------

test('CU17 buscarServicios aplana data.data y calcula cliente_nombre', async () => {
  stubFetch(jsonResponse(200, {
    success: true,
    data: {
      data: [
        { id: 1, codigo_servicio: 'SRV-1', cliente: { nombres: 'Ana', apellidos: 'Pérez' } },
      ],
    },
  }));
  const servicios = await asignacionPlanService.buscarServicios({ buscar: 'ana' });
  assert.equal(servicios.length, 1);
  assert.equal(servicios[0].cliente_nombre, 'Ana Pérez');
  assert.match(lastCall.url, /\/cu08\/servicios\?/);
  assert.match(lastCall.url, /buscar=ana/);
});

test('CU17 fetchPlanesActivos pide SOLO planes activos', async () => {
  stubFetch(jsonResponse(200, { success: true, data: { planes: [{ id: 2, activo: true }] } }));
  const planes = await asignacionPlanService.fetchPlanesActivos();
  assert.equal(planes[0].id, 2);
  assert.match(lastCall.url, /\/planes\?activo=1/);
});

test('CU17 fetchHistorial devuelve servicio e historial', async () => {
  stubFetch(jsonResponse(200, {
    success: true,
    data: { servicio: { id: 9, codigo_servicio: 'SRV-9' }, asignaciones: [{ id: 1, plan_id: 2 }] },
  }));
  const { servicio, asignaciones } = await asignacionPlanService.fetchHistorial(9);
  assert.equal(servicio.codigo_servicio, 'SRV-9');
  assert.equal(asignaciones.length, 1);
  assert.match(lastCall.url, /\/cu08\/servicios\/9\/planes$/);
});

test('CU17 asignarPlan NUNCA envía user_id ni fecha_inicio (los pone el backend)', async () => {
  stubFetch(jsonResponse(201, { success: true, data: { asignacion: { id: 11 } } }));
  await asignacionPlanService.asignarPlan(9, { plan_id: 2, motivo_cambio: 'Upgrade' });
  assert.equal(lastCall.init.method, 'POST');
  assert.match(lastCall.url, /\/cu08\/servicios\/9\/planes$/);
  const body = JSON.parse(lastCall.init.body);
  assert.equal(body.plan_id, 2);
  assert.equal(body.motivo_cambio, 'Upgrade');
  assert.equal('user_id' in body, false);
  assert.equal('fecha_inicio' in body, false);
});
