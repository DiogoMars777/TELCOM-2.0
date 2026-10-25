import test from 'node:test';
import assert from 'node:assert/strict';
import { equipoReemplazoRetiroService as service } from '../src/models/Paquetes/EquiposProveedoresInventario/CU20_ReemplazarRetirarEquipo/equipoReemplazoRetiroModel.js';
import { describeApiError } from '../src/services/apiClient.js';

const originalFetch = globalThis.fetch;
globalThis.localStorage = { getItem: () => 'token-cu20-test' };
let calls;

function respond(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function stubFetch(body, status = 200) {
  globalThis.fetch = async (url, init) => {
    calls.push({ url: new URL(url), init });
    return respond(status, body);
  };
}

const equipo = {
  idEquipo: 21, numeroSerie: 'ONT-21', mac: 'AA:BB:CC:DD:EE:21', ip: '10.0.0.21',
  propiedad: 'TELCOM_COMODATO', estadoEquipo: 'OPERATIVO', asignada: true,
  producto: { idProducto: 3, nombre: 'ONT', marca: 'Huawei', modelo: 'HG8145V5' },
};

test.beforeEach(() => { calls = []; });
test.after(() => { globalThis.fetch = originalFetch; delete globalThis.localStorage; });

test('CU20 fetchServicios recorre CU08 paginado y normaliza identificador, código y cliente', async () => {
  globalThis.fetch = async (url, init) => {
    const parsed = new URL(url);
    calls.push({ url: parsed, init });
    const page = Number(parsed.searchParams.get('page') || 1);
    return respond(200, {
      success: true,
      data: { last_page: 3, data: [{
        idServicio: page, codigoServicio: `SRV-${page}`,
        cliente: { nombres: 'Ana', apellidos: 'Pérez' },
      }] },
    });
  };
  const servicios = await service.fetchServicios();
  assert.deepEqual(servicios.map((s) => s.id), [1, 2, 3]);
  assert.equal(servicios[2].codigo_servicio, 'SRV-3');
  assert.equal(servicios[2].cliente_nombre, 'Ana Pérez');
  assert.equal(calls[0].url.pathname, '/api/cu08/servicios');
  assert.equal(calls[0].url.search, '');
  assert.equal(calls[1].url.searchParams.get('page'), '2');
  assert.equal(calls[2].url.searchParams.get('page'), '3');
  assert.ok(calls.every((call) => call.init.method === 'GET'));
});

test('CU20 conserva aliases CU08 y nombres de cliente ya calculados', async () => {
  stubFetch({ success: true, data: { data: [{ id: 8, codigo_servicio: 'SRV-8', cliente_nombre: 'Empresa' }] } });
  const [servicio] = await service.fetchServicios();
  assert.equal(servicio.id, 8);
  assert.equal(servicio.cliente_nombre, 'Empresa');
  assert.equal(calls.length, 1);
});

test('CU20 acepta lista sin paginar y servicios sin cliente', async () => {
  stubFetch({ success: true, data: [{ idServicio: 5, codigoServicio: 'SRV-5' }] });
  const [servicio] = await service.fetchServicios();
  assert.equal(servicio.id, 5);
  assert.equal(servicio.cliente_nombre, '');
});

test('CU20 no devuelve un selector incompleto si falla una página posterior', async () => {
  globalThis.fetch = async (url) => new URL(url).searchParams.has('page')
    ? respond(503, { success: false })
    : respond(200, { data: { last_page: 2, data: [{ id: 1 }] } });
  await assert.rejects(service.fetchServicios(), (error) => error.status === 503);
});

test('CU20 limita páginas erróneas siguiendo la protección de CU17', async () => {
  stubFetch({ success: true, data: { last_page: 999999, data: [] } });
  assert.deepEqual(await service.fetchServicios(), []);
  assert.equal(calls.length, 100);
});

test('CU20 fetchEquipoServicio adapta el contrato canónico completo sin perder el historial', async () => {
  stubFetch({ success: true, data: {
    servicio: { idServicio: 7, codigoServicio: 'SRV-7' },
    asignacion_activa: { idAsignacionEquipo: 42, fechaAsignacion: '2026-10-25', equipo },
    equipo_actual: equipo,
    historial: [{
      idAsignacionEquipo: 41, fechaAsignacion: '2026-01-05', fechaRetiro: '2026-10-25',
      motivoRetiro: 'Falla de conexión', equipo: { ...equipo, idEquipo: 20 },
    }],
  } });
  const data = await service.fetchEquipoServicio(7);
  assert.equal(calls[0].url.pathname, '/api/cu20/servicios/7/equipo');
  assert.equal(data.servicio.id, 7);
  assert.equal(data.asignacion_activa.id, 42);
  assert.equal(data.asignacion_activa.fecha_asignacion, '2026-10-25');
  assert.equal(data.asignacion_activa.fecha_retiro, null);
  assert.equal(data.equipo_actual.id, 21);
  assert.equal(data.equipo_actual.numero_serie, 'ONT-21');
  assert.equal(data.equipo_actual.estado, 'OPERATIVO');
  assert.deepEqual(data.equipo_actual.producto, equipo.producto);
  assert.equal(data.equipo_actual.mac, equipo.mac);
  assert.equal(data.equipo_actual.ip, equipo.ip);
  assert.equal(data.equipo_actual.propiedad, 'TELCOM_COMODATO');
  assert.equal(data.historial[0].equipo.id, 20);
  assert.equal(data.historial[0].fecha_retiro, '2026-10-25');
  assert.equal(data.historial[0].motivo_retiro, 'Falla de conexión');
});

test('CU20 sin equipo activo sigue devolviendo las asignaciones retiradas', async () => {
  stubFetch({ success: true, data: {
    servicio: { idServicio: 7 }, asignacion_activa: null, equipo_actual: null,
    historial: [{ idAsignacionEquipo: 41, fechaRetiro: '2026-10-24', equipo }],
  } });
  const data = await service.fetchEquipoServicio(7);
  assert.equal(data.asignacion_activa, null);
  assert.equal(data.equipo_actual, null);
  assert.equal(data.historial.length, 1);
});

test('CU20 representa historial vacío sin inventar asignaciones', async () => {
  stubFetch({ success: true, data: { servicio: { idServicio: 7 }, historial: [] } });
  const data = await service.fetchEquipoServicio(7);
  assert.deepEqual(data.historial, []);
  assert.equal(data.equipo_actual, null);
});

test('CU20 fetchEquiposDisponibles usa únicamente data.equipos del endpoint real', async () => {
  stubFetch({ success: true, data: { equipos: [{ ...equipo, asignada: false }] } });
  const disponibles = await service.fetchEquiposDisponibles();
  assert.equal(calls[0].url.pathname, '/api/cu20/equipos/disponibles');
  assert.equal(disponibles.length, 1);
  assert.equal(disponibles[0].id, 21);
  assert.equal(disponibles[0].numero_serie, 'ONT-21');
  assert.equal(disponibles[0].asignada, false);
  stubFetch({ success: true, data: { equipos: [] } });
  assert.deepEqual(await service.fetchEquiposDisponibles(), []);
});

test('CU20 reemplazo envía solo equipo_nuevo_id entero y motivo por apiClient', async () => {
  stubFetch({ success: true, message: 'Equipo reemplazado exitosamente.' });
  const result = await service.reemplazarEquipo('7', '22', '  Falla del equipo  ');
  assert.equal(calls[0].url.pathname, '/api/cu20/servicios/7/equipo/reemplazar');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer token-cu20-test');
  assert.deepEqual(JSON.parse(calls[0].init.body), { equipo_nuevo_id: 22, motivo: 'Falla del equipo' });
  assert.equal(result.message, 'Equipo reemplazado exitosamente.');
});

test('CU20 retiro envía solo el motivo sin alterar historial desde el frontend', async () => {
  stubFetch({ success: true, message: 'Equipo retirado exitosamente.' });
  await service.retirarEquipo(7, '  Fin de comodato  ');
  assert.equal(calls[0].url.pathname, '/api/cu20/servicios/7/equipo/retirar');
  assert.equal(calls[0].init.method, 'POST');
  assert.deepEqual(JSON.parse(calls[0].init.body), { motivo: 'Fin de comodato' });
});

test('CU20 propaga errores de consulta y red sin sustituirlos por mocks', async () => {
  stubFetch({ success: false, message: 'Prohibido' }, 403);
  for (const consulta of [() => service.fetchServicios(), () => service.fetchEquipoServicio(7), () => service.fetchEquiposDisponibles()]) {
    await assert.rejects(consulta(), (error) => error.status === 403);
  }
  globalThis.fetch = async () => { throw new Error('offline'); };
  await assert.rejects(service.fetchEquipoServicio(7), (error) => error.status === 0);
});

test('CU20 propaga validación 422, equipo ocupado y autorización de ambas acciones', async () => {
  stubFetch({ success: false, errors: { motivo: ['El motivo es obligatorio.'] } }, 422);
  await assert.rejects(service.retirarEquipo(7, ''), (error) => describeApiError(error) === 'El motivo es obligatorio.');
  stubFetch({ success: false, message: 'El equipo de reemplazo no está disponible.' }, 422);
  await assert.rejects(service.reemplazarEquipo(7, 22, 'Falla'), (error) => /no está disponible/.test(describeApiError(error)));
  stubFetch({ success: false, message: 'No autorizado' }, 403);
  await assert.rejects(service.reemplazarEquipo(7, 22, 'Falla'), (error) => error.status === 403);
  await assert.rejects(service.retirarEquipo(7, 'Falla'), (error) => error.status === 403);
});
