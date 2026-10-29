/**
 * Pruebas unitarias de CU19 - Asignar equipo en comodato a un servicio.
 * Verifica la capa de datos, contratos API, control de acceso RBAC y modo demo.
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
const { asignacionEquipoModel } = await import('../src/models/Paquetes/EquiposInventario/CU19_AsignarEquipoComodato/asignacionEquipoModel.js');

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

// --------------------------- RBAC Access ---------------------------------

test('CU19 Permisos: Administrador, Secretaría y Técnico tienen acceso', () => {
  const admin = { permisos: ['equipos.assign', 'equipos.view'] };
  const secretaria = { permisos: ['equipos.assign', 'equipos.view'] };
  const tecnico = { permisos: ['equipos.assign', 'equipos.view'] };
  const sinPermiso = { permisos: ['auth.login'] };

  assert.equal(canAccessCu(admin, 'CU19'), true);
  assert.equal(canAccessCu(secretaria, 'CU19'), true);
  assert.equal(canAccessCu(tecnico, 'CU19'), true);
  assert.equal(canAccessCu(sinPermiso, 'CU19'), false);
});

// --------------------------- Model & Endpoints ---------------------------

test('CU19 fetchServicios llama a /cu19/servicios-activos y normaliza datos', async () => {
  stubFetch(jsonResponse(200, {
    success: true,
    data: [
      {
        idServicio: 10,
        codigoServicio: 'SRV-88201',
        cliente: { nombreCompleto: 'Carlos Mendoza', ci: '5829102' },
        estado_servicio: 'ACTIVO',
      },
    ],
  }));

  const servicios = await asignacionEquipoModel.fetchServicios({ buscar: 'Carlos' });
  assert.equal(servicios.length, 1);
  assert.equal(servicios[0].id, 10);
  assert.equal(servicios[0].codigo_servicio, 'SRV-88201');
  assert.equal(servicios[0].cliente_nombre, 'Carlos Mendoza');
  assert.match(lastCall.url, /\/cu19\/servicios-activos\?buscar=Carlos/);
});

test('CU19 fetchEquiposDisponibles consulta /cu19/equipos-disponibles con filtros', async () => {
  stubFetch(jsonResponse(200, {
    success: true,
    data: {
      equipos: [
        {
          idEquipo: 25,
          numeroSerie: 'SN-HW-2026-0025',
          mac: 'BC:5F:F4:10:01:19',
          producto: {
            nombre: 'ONT Huawei HG8145V5',
            tipoEquipo: 'ONU',
            marca: 'Huawei',
            modelo: 'HG8145V5',
          },
        },
      ],
      total_disponibles: 1,
      tipos_disponibles: ['ONU', 'Router'],
    },
  }));

  const res = await asignacionEquipoModel.fetchEquiposDisponibles({ tipo_equipo: 'ONU', buscar: 'SN-HW' });
  assert.equal(res.equipos.length, 1);
  assert.equal(res.equipos[0].numero_serie, 'SN-HW-2026-0025');
  assert.equal(res.equipos[0].producto.tipo_equipo, 'ONU');
  assert.match(lastCall.url, /\/cu19\/equipos-disponibles\?/);
  assert.match(lastCall.url, /tipo_equipo=ONU/);
});

test('CU19 fetchServicioEquipos consulta comodatos vigentes e historial', async () => {
  stubFetch(jsonResponse(200, {
    success: true,
    data: {
      servicio: { idServicio: 5, codigoServicio: 'SRV-88005' },
      comodato_vigente: { idAsignacionEquipo: 2, es_vigente: true },
      historial: [{ idAsignacionEquipo: 2, es_vigente: true }],
    },
  }));

  const res = await asignacionEquipoModel.fetchServicioEquipos(5);
  assert.ok(res.servicio);
  assert.ok(res.comodato_vigente);
  assert.equal(res.historial.length, 1);
  assert.match(lastCall.url, /\/cu19\/servicios\/5\/equipos/);
});

test('CU19 asignarEquipo envía POST con los datos validados del comodato', async () => {
  stubFetch(jsonResponse(201, {
    success: true,
    message: 'Equipo asignado formalmente en comodato.',
    data: { idAsignacionEquipo: 100 },
  }));

  const payload = {
    equipo_id: 25,
    numero_serie: 'SN-HW-2026-0025',
    mac: 'BC:5F:F4:10:01:19',
    fecha_asignacion: '2026-01-10',
    reemplazar_vigente: true,
    motivo_reemplazo: 'Cambio de equipo.',
  };

  await asignacionEquipoModel.asignarEquipo(5, payload);
  assert.match(lastCall.url, /\/cu19\/servicios\/5\/asignar-equipo/);
  assert.equal(lastCall.init.method, 'POST');
  const body = JSON.parse(lastCall.init.body);
  assert.equal(body.equipo_id, 25);
  assert.equal(body.numero_serie, 'SN-HW-2026-0025');
  assert.equal(body.reemplazar_vigente, true);
});

test('CU19 desvincularEquipo envía POST para retirar equipo en comodato', async () => {
  stubFetch(jsonResponse(200, {
    success: true,
    message: 'Equipo retirado exitosamente.',
  }));

  await asignacionEquipoModel.desvincularEquipo(100, {
    motivo_retiro: 'Baja del cliente',
    fecha_retiro: '2026-01-20',
    estado_equipo: 'DISPONIBLE',
  });

  assert.match(lastCall.url, /\/cu19\/asignaciones\/100\/retirar/);
  assert.equal(lastCall.init.method, 'POST');
});

test('CU19 un error de red o backend se propaga y no se oculta con mocks', async () => {
  stubFetch(jsonResponse(422, {
    success: false,
    message: 'Servicio inexistente o suspendido.',
  }));

  await assert.rejects(
    async () => {
      await asignacionEquipoModel.asignarEquipo(999, { equipo_id: 1 });
    },
    (err) => {
      assert.match(err.message, /Servicio inexistente o suspendido/i);
      return true;
    }
  );
});

test('CU19 en modo demostración explícito devuelve datos mock sin fallar', async () => {
  globalThis.__TELCOM_DEMO__ = true;

  const servicios = await asignacionEquipoModel.fetchServicios();
  assert.ok(servicios.length > 0);

  const equipos = await asignacionEquipoModel.fetchEquiposDisponibles();
  assert.ok(equipos.equipos.length > 0);
});
