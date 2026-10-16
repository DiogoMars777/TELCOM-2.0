/**
 * Pruebas del buscador de servicios de CU17.
 *
 * Demuestran que `fetchServicios` recorre TODAS las páginas de
 * `GET /cu08/servicios` (ese endpoint pagina de a 15 y NO admite búsqueda por
 * query), de modo que el combobox encuentra un servicio ubicado en la segunda
 * página, y que el filtro puro lo localiza por código, nombre y documento.
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

const { asignacionPlanService } = await import(
  '../src/models/Paquetes/ServiciosPlanes/CU17_AsignarCambiarPlanInternet/asignacionPlanModel.js'
);
const { filtrarServicios, etiquetaServicio, documentoDe } = await import(
  '../src/views/Paquetes/ServiciosPlanes/CU17_AsignarCambiarPlanInternet/servicioBuscadorUtils.js'
);

function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

test.beforeEach(() => {
  globalThis.__TELCOM_DEMO__ = false;
});

test('CU17 fetchServicios recorre todas las páginas y encuentra un servicio de la segunda página', async () => {
  const urls = [];

  globalThis.fetch = async (url) => {
    const u = String(url);
    urls.push(u);

    // Segunda página: contiene el servicio que NO aparece en la primera.
    if (u.includes('page=2')) {
      return jsonResponse(200, {
        success: true,
        message: 'ok',
        data: {
          current_page: 2,
          last_page: 2,
          per_page: 15,
          total: 16,
          data: [
            {
              id: 16,
              codigo_servicio: 'SRV-P2',
              cliente: { nombres: 'Zoe', apellidos: 'Zamora', ci: '999888' },
            },
          ],
        },
      });
    }

    // Primera página (sin query o con page=1).
    return jsonResponse(200, {
      success: true,
      message: 'ok',
      data: {
        current_page: 1,
        last_page: 2,
        per_page: 15,
        total: 16,
        data: [
          {
            id: 1,
            codigo_servicio: 'SRV-P1',
            cliente: { nombres: 'Ana', apellidos: 'Pérez', ci: '111222' },
          },
        ],
      },
    });
  };

  const servicios = await asignacionPlanService.fetchServicios();

  // Se pidieron exactamente la página 1 y la 2.
  assert.equal(urls.length, 2);
  assert.ok(urls.some((u) => u.includes('page=2')), 'debe solicitar la página 2');

  // El servicio de la segunda página está disponible, con su id real.
  assert.equal(servicios.length, 2);
  const dePagina2 = servicios.find((s) => s.id === 16);
  assert.ok(dePagina2, 'debe incluir el servicio de la segunda página');
  assert.equal(dePagina2.codigo_servicio, 'SRV-P2');
  assert.equal(dePagina2.cliente_nombre, 'Zoe Zamora');

  // El combobox lo encuentra por código, por nombre y por documento.
  assert.deepEqual(filtrarServicios(servicios, 'SRV-P2').map((s) => s.id), [16]);
  assert.deepEqual(filtrarServicios(servicios, 'zoe zamora').map((s) => s.id), [16]);
  assert.deepEqual(filtrarServicios(servicios, '999888').map((s) => s.id), [16]);
});

test('CU17 fetchServicios con una sola página hace una única petición', async () => {
  let llamadas = 0;
  globalThis.fetch = async () => {
    llamadas += 1;
    return jsonResponse(200, {
      success: true,
      data: {
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 1,
        data: [{ id: 1, codigo_servicio: 'SRV-1', cliente: { nombres: 'Ana', apellidos: 'Pérez' } }],
      },
    });
  };

  const servicios = await asignacionPlanService.fetchServicios();
  assert.equal(llamadas, 1);
  assert.equal(servicios.length, 1);
  assert.equal(servicios[0].cliente_nombre, 'Ana Pérez');
});

test('CU17 fetchServicios no oculta el fallo de una página', async () => {
  globalThis.fetch = async (url) => {
    if (String(url).includes('page=2')) {
      return jsonResponse(500, { success: false, message: 'boom' });
    }
    return jsonResponse(200, {
      success: true,
      data: {
        current_page: 1,
        last_page: 2,
        data: [{ id: 1, codigo_servicio: 'SRV-1' }],
      },
    });
  };

  await assert.rejects(asignacionPlanService.fetchServicios(), (err) => err.status === 500);
});

test('CU17 etiquetaServicio y documentoDe producen textos legibles', () => {
  const servicio = {
    codigo_servicio: 'SRV-9',
    cliente_nombre: 'Luis Vargas',
    cliente: { documento_identidad: 'DOC-9' },
  };
  assert.equal(etiquetaServicio(servicio), 'SRV-9 — Luis Vargas');
  assert.equal(documentoDe(servicio), 'DOC-9');
  assert.equal(etiquetaServicio(null), '');
});
