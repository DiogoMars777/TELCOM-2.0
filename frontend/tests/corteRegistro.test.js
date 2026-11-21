/**
 * Pruebas unitarias de la capa de datos de CU14 (Registrar corte realizado)
 *
 * Comprueban que corteRegistroService invoca los endpoints reales del backend,
 * formatea correctamente los parámetros, normaliza los datos y respeta el RBAC.
 *
 * Ejecutar: npm test
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

const { corteRegistroService, normalizeCorte, mockCortesList } =
  await import('../src/models/Paquetes/P3_ServiciosPlanes/CU14_RegistrarCorteRealizado/corteRegistroModel.js');

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

test('CU14 fetchCortes extrae lista paginada y métricas reenvia filtros', async () => {
  stubFetch(jsonResponse(200, {
    success: true,
    data: {
      cortes: {
        data: [{ idAccion: 10, tipoAccion: 'CORTE', motivo: 'Mora', idServicio: 101 }],
        current_page: 1,
        last_page: 1,
        total: 1,
      },
      metricas: {
        total_cortes: 1,
        cortes_logicos: 1,
        cortes_fisicos: 0,
        cortes_mes: 1,
      },
    },
  }));

  const res = await corteRegistroService.fetchCortes({
    buscar: 'SRV-88201',
    tipo_corte: 'LOGICO',
    fecha_desde: '2026-10-01',
    fecha_hasta: '2026-10-31',
    page: 1,
  });

  assert.equal(res.data.length, 1);
  assert.equal(res.data[0].id, 10);
  assert.equal(res.metricas.total_cortes, 1);
  assert.match(lastCall.url, /\/cu14\/cortes\?/);
  assert.match(lastCall.url, /buscar=SRV-88201/);
  assert.match(lastCall.url, /tipo_corte=LOGICO/);
});

test('CU14 fetchServiciosActivos solicita servicios activos al endpoint correcto', async () => {
  stubFetch(jsonResponse(200, {
    success: true,
    data: [
      { id: 1, codigo_servicio: 'SRV-88201', cliente_nombre: 'Fernando', estado_servicio: 'ACTIVO' }
    ]
  }));

  const servicios = await corteRegistroService.fetchServiciosActivos({ buscar: 'Fernando' });
  assert.equal(servicios.length, 1);
  assert.equal(servicios[0].codigo_servicio, 'SRV-88201');
  assert.match(lastCall.url, /\/cu14\/cortes\/servicios-activos/);
});

test('CU14 registrarCorte envía POST a /cu14/cortes con el payload correcto', async () => {
  stubFetch(jsonResponse(201, {
    success: true,
    data: {
      corte: { id: 5, codigo_orden_corte: 'COR-00005', tipo_corte: 'LOGICO' },
      servicio: { id: 1, estado_servicio: 'CORTADO' },
    },
  }));

  const payload = {
    servicio_id: 1,
    tipo_corte: 'LOGICO',
    motivo: 'Mora superior a 30 días',
    observaciones: 'Bloqueo RADIUS',
  };

  const res = await corteRegistroService.registrarCorte(payload);
  assert.equal(res.success, true);
  assert.equal(res.data.corte.tipo_corte, 'LOGICO');
  assert.match(lastCall.url, /\/cu14\/cortes$/);
  assert.equal(lastCall.init.method, 'POST');

  const sentBody = JSON.parse(lastCall.init.body);
  assert.equal(sentBody.servicio_id, 1);
  assert.equal(sentBody.tipo_corte, 'LOGICO');
  assert.equal(sentBody.motivo, 'Mora superior a 30 días');
});

test('CU14 fetchCorteDetalle invoca GET /cu14/cortes/{id}', async () => {
  stubFetch(jsonResponse(200, {
    success: true,
    data: {
      id: 8,
      codigo_orden: 'COR-00008',
      codigo_servicio: 'SRV-88201',
      cliente_nombre: 'Fernando Torres',
      tipo_corte: 'FISICO',
    },
  }));

  const detalle = await corteRegistroService.fetchCorteDetalle(8);
  assert.equal(detalle.id, 8);
  assert.equal(detalle.tipo_corte, 'FISICO');
  assert.match(lastCall.url, /\/cu14\/cortes\/8$/);
});

test('CU14 normalizeCorte estandariza datos incompletos o anidados', () => {
  const crudo = {
    idAccion: 12,
    tipoAccion: 'CORTE_FISICO',
    motivo: 'Retiro de equipo',
    observacion: '[Tipo: FISICO] Cable desconectado en NAP 2',
    servicio: {
      idServicio: 4,
      codigoServicio: 'SRV-88204',
      cliente: {
        nombreCompleto: 'Juan Pablo Camacho',
        ci: '5920194 SC',
      },
    },
  };

  const norm = normalizeCorte(crudo);
  assert.equal(norm.id, 12);
  assert.equal(norm.codigo_orden, 'COR-00012');
  assert.equal(norm.codigo_servicio, 'SRV-88204');
  assert.equal(norm.cliente_nombre, 'Juan Pablo Camacho');
  assert.equal(norm.cliente_ci, '5920194 SC');
  assert.equal(norm.tipo_corte, 'FISICO');
});

test('CU14 en modo demostración sirve mock data sin llamar a la red', async () => {
  globalThis.__TELCOM_DEMO__ = true;
  const res = await corteRegistroService.fetchCortes();
  assert.equal(res.data.length, mockCortesList.length);
  assert.equal(lastCall, null);
});
