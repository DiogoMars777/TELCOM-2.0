/**
 * Pruebas reales de la capa de datos (frontend/src/models).
 *
 * Verifican que, con el modo demostración DESACTIVADO (por defecto), los
 * servicios NO sustituyan silenciosamente los errores por datos de ejemplo,
 * y que dicho modo sólo se active de forma explícita.
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

const { isDemoMode } = await import('../src/config/appConfig.js');
const { zonaService, mockZonas } = await import('../src/models/Paquetes/GestionClientesZonas/CU04_ZonasCobertura/zonaCoberturaModel.js');
const { clienteConsultaService } = await import('../src/models/Paquetes/GestionClientesZonas/CU06_ConsultarBuscarClientes/clienteConsultaModel.js');
const { mensualidadService } = await import('../src/models/Paquetes/FacturacionCobranza/CU09_GenerarMensualidades/mensualidadModel.js');
const { alertasService } = await import('../src/models/Paquetes/FacturacionCobranza/CU12_VisualizarAlertasVencimiento/alertaVencimientoModel.js');
const { historialPagosService } = await import('../src/models/Paquetes/FacturacionCobranza/CU11_ConsultarHistorialPagos/historialPagoModel.js');
const { pagoMensualidadService } = await import('../src/models/Paquetes/FacturacionCobranza/CU10_GestionarPagoMensualidad/pagoMensualidadModel.js');
const { planInternetService } = await import('../src/models/Paquetes/ServiciosPlanes/CU16_GestionarCatalogoPlanes/planInternetModel.js');
const { asignacionPlanService } = await import('../src/models/Paquetes/ServiciosPlanes/CU17_AsignarCambiarPlanInternet/asignacionPlanModel.js');
const { serviciosCorteService } = await import('../src/models/Paquetes/ServiciosPlanes/CU13_ListadoServiciosCorte/servicioCorteModel.js');

function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

let fetchCalls = 0;
function stubFetch(response) {
  fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    if (response instanceof Error) throw response;
    return response;
  };
}

test.beforeEach(() => {
  globalThis.__TELCOM_DEMO__ = false;
});

test('El modo demostración está desactivado por defecto', () => {
  delete globalThis.__TELCOM_DEMO__;
  assert.equal(isDemoMode(), false);
});

test('GET fallido NO devuelve datos ficticios: el servicio rechaza', async () => {
  stubFetch(jsonResponse(500, { success: false, message: 'boom' }));
  await assert.rejects(zonaService.fetchZonas(), (err) => err.status === 500);
  assert.equal(fetchCalls, 1);
});

test('Fallo de red en un GET se propaga (no se sustituye por mockZonas)', async () => {
  stubFetch(new Error('offline'));
  await assert.rejects(zonaService.fetchZonas());
  assert.notEqual(await zonaServiceFetchOrNull(), mockZonas);
});

// Ayudante para comprobar que no se resuelve con el mock.
async function zonaServiceFetchOrNull() {
  try {
    return await zonaService.fetchZonas();
  } catch {
    return null;
  }
}

test('CU06 tampoco sustituye errores por su lista de ejemplo', async () => {
  stubFetch(jsonResponse(403, { success: false, message: 'Prohibido' }));
  await assert.rejects(clienteConsultaService.fetchClientes({}));
});

test('En modo demostración explícito se devuelven los datos de ejemplo sin llamar a la red', async () => {
  globalThis.__TELCOM_DEMO__ = true;
  // Si el servicio llamara a fetch, este stub lanzaría y la prueba fallaría.
  globalThis.fetch = async () => { throw new Error('No debería llamarse a fetch en modo demostración'); };
  const zonas = await zonaService.fetchZonas();
  assert.deepEqual(zonas, mockZonas);
});

test('CU12 exitoso extrae data.alertas realmente', async () => {
  stubFetch(jsonResponse(200, { success: true, data: { alertas: [{ mensualidad_id: 9 }] } }));
  const alertas = await alertasService.fetchAlertas();
  assert.equal(alertas.length, 1);
  assert.equal(alertas[0].mensualidad_id, 9);
});

test('CU09 aplana las relaciones cliente/servicio de la respuesta real', async () => {
  stubFetch(jsonResponse(200, {
    success: true,
    data: {
      data: [
        {
          id: 1,
          codigo_factura: 'FAC-1',
          monto: 100,
          cliente: { nombres: 'Ana', apellidos: 'Pérez' },
          servicio: { codigo_servicio: 'SRV-1' },
        },
      ],
    },
  }));
  const [factura] = await mensualidadService.fetchMensualidades('2026-10');
  assert.equal(factura.cliente_nombre, 'Ana Pérez');
  assert.equal(factura.servicio_codigo, 'SRV-1');
});

test('CU11 normaliza el pago, cliente, servicio y periodos desde DetallePago', async () => {
  stubFetch(jsonResponse(200, {
    success: true,
    data: {
      current_page: 1, last_page: 1, total: 1,
      data: [{
        idPago: 7,
        numeroComprobante: 'REC-7',
        montoTotal: '200.00',
        fechaHora: '2026-10-13 10:00:00',
        metodo_pago: { nombreMetodo: 'QR' },
        cajero: { nombreCompleto: 'Ana Secretaria' },
        detalles: [{
          montoAplicado: '200.00',
          mensualidad: {
            periodo: '2026-10',
            cliente: { nombreCompleto: 'Luis Pérez', codigoCliente: 'CLI-7', ci: '123' },
            servicio: { codigoServicio: 'SRV-7', idServicio: 9 },
          },
        }],
      }],
    },
  }));

  const resultado = await historialPagosService.fetchHistorial({ metodo_pago: 'QR' });
  assert.equal(resultado.pagos[0].cliente_nombre, 'Luis Pérez');
  assert.equal(resultado.pagos[0].servicio_codigo, 'SRV-7');
  assert.equal(resultado.pagos[0].metodo_pago, 'QR');
  assert.deepEqual(resultado.pagos[0].periodos, ['2026-10']);
});

test('CU11 obtiene tipos de servicio del catálogo de planes, no comprobantes', async () => {
  stubFetch(jsonResponse(200, {
    success: true,
    data: { planes: [{ id: 9, nombre: 'Fibra Plus', velocidad_mbps: 100 }], metodos: ['QR', 'EFECTIVO'] },
  }));
  const opciones = await historialPagosService.fetchFiltros();
  assert.equal(opciones.planes[0].nombre, 'Fibra Plus');
  assert.equal(opciones.planes[0].velocidad_mbps, 100);
  assert.deepEqual(opciones.metodos, ['QR', 'EFECTIVO']);
});

test('CU11 aplica búsqueda y filtros también en el modo demostración', async () => {
  globalThis.__TELCOM_DEMO__ = true;

  const porCliente = await historialPagosService.fetchHistorial({ buscar: 'María' });
  assert.equal(porCliente.pagos.length, 1);
  assert.equal(porCliente.pagos[0].servicio_codigo, 'SRV-002');

  const porMetodoPeriodo = await historialPagosService.fetchHistorial({
    metodo_pago: 'TRANSFERENCIA', periodo: '2026-08',
  });
  assert.equal(porMetodoPeriodo.pagos.length, 1);
  assert.equal(porMetodoPeriodo.pagos[0].codigo_recibo, 'REC-2026-0003');

  const porTipoServicio = await historialPagosService.fetchHistorial({ plan_id: 2 });
  assert.equal(porTipoServicio.pagos.length, 1);
  assert.equal(porTipoServicio.pagos[0].plan_nombre, 'Fibra Hogar');

  const sinResultados = await historialPagosService.fetchHistorial({ fecha_desde: '2026-11-01' });
  assert.equal(sinResultados.pagos.length, 0);
  assert.equal(sinResultados.meta.total, 0);
});

test('CU10 consultarPorCI envía GET a /cu10/portal-cliente/consultar/{ci}', async () => {
  let calledUrl = '';
  globalThis.fetch = async (url) => {
    calledUrl = String(url);
    return jsonResponse(200, {
      success: true,
      data: {
        tiene_deuda: true,
        cliente: { ci: '8492019' },
        factura: { id: 1, monto: 220 },
      },
    });
  };
  const res = await pagoMensualidadService.consultarPorCI('8492019');
  assert.ok(calledUrl.includes('/cu10/portal-cliente/consultar/8492019'));
  assert.equal(res.tiene_deuda, true);
});

test('CU10 pagarEnLinea envía POST a /cu10/portal-cliente/pagar con datos correctos', async () => {
  let calledUrl = '';
  let sentBody = null;
  globalThis.fetch = async (url, opts) => {
    calledUrl = String(url);
    sentBody = JSON.parse(opts.body);
    return jsonResponse(201, {
      success: true,
      data: {
        recibo: { codigo_recibo: 'REC-ONL-123' },
      },
    });
  };
  const res = await pagoMensualidadService.pagarEnLinea({
    mensualidad_id: 1,
    monto_pagado: 220,
    metodo_pago: 'QR',
  });
  assert.ok(calledUrl.includes('/cu10/portal-cliente/pagar'));
  assert.equal(sentBody.metodo_pago, 'QR');
});

test('CU16 fetchPlanes lee el catálogo real de /planes', async () => {
  stubFetch(jsonResponse(200, {
    success: true,
    data: {
      planes: [
        { id: 1, nombre_plan: 'Plan A', velocidad_mbps: 50, precio_mensual: 120, activo: true },
      ],
    },
  }));
  const planes = await planInternetService.fetchPlanes();
  assert.equal(planes.length, 1);
  assert.equal(planes[0].nombre_plan, 'Plan A');
  assert.equal(planes[0].activo, true);
});

test('CU16 crear/editar/desactivar usan los verbos y rutas correctas', async () => {
  let calledUrl = '';
  let calledMethod = '';
  let sentBody = null;
  globalThis.fetch = async (url, opts) => {
    calledUrl = String(url);
    calledMethod = opts.method;
    sentBody = opts.body ? JSON.parse(opts.body) : null;
    return jsonResponse(201, { success: true, data: { plan: { id: 7 } } });
  };

  await planInternetService.createPlan({ nombre_plan: 'Plan Nuevo', velocidad_mbps: 80, precio_mensual: 200 });
  assert.ok(calledUrl.endsWith('/planes'));
  assert.equal(calledMethod, 'POST');
  assert.equal(sentBody.nombre_plan, 'Plan Nuevo');

  await planInternetService.updatePlan(7, { activo: true });
  assert.ok(calledUrl.endsWith('/planes/7'));
  assert.equal(calledMethod, 'PUT');
  assert.deepEqual(sentBody, { activo: true });

  await planInternetService.desactivarPlan(7);
  assert.ok(calledUrl.endsWith('/planes/7') || calledUrl.endsWith('/planes/7/desactivar'));
  assert.ok(calledMethod === 'DELETE' || calledMethod === 'PUT');
});

test('CU16 un error del backend NO se sustituye por datos de ejemplo', async () => {
  stubFetch(jsonResponse(403, { success: false, message: 'Prohibido' }));
  await assert.rejects(planInternetService.fetchPlanes(), (err) => err.status === 403);
});

test('CU17 fetchServicios aplana el cliente de /cu08/servicios', async () => {
  stubFetch(jsonResponse(200, {
    success: true,
    data: {
      data: [
        { id: 1, codigo_servicio: 'SRV-1', cliente: { nombres: 'Ana', apellidos: 'Pérez' } },
      ],
    },
  }));
  const [servicio] = await asignacionPlanService.fetchServicios();
  assert.equal(servicio.cliente_nombre, 'Ana Pérez');
});

test('CU17 fetchHistorial lee data.servicio y data.asignaciones', async () => {
  let calledUrl = '';
  globalThis.fetch = async (url) => {
    calledUrl = String(url);
    return jsonResponse(200, {
      success: true,
      data: { servicio: { codigo_servicio: 'SRV-1' }, asignaciones: [{ id: 5 }] },
    });
  };
  const res = await asignacionPlanService.fetchHistorial(1);
  assert.ok(calledUrl.includes('/cu08/servicios/1/planes'));
  assert.equal(res.asignaciones.length, 1);
  assert.equal(res.servicio.codigo_servicio, 'SRV-1');
});

test('CU17 asignarPlan envía POST con plan_id y motivo', async () => {
  let calledUrl = '';
  let sentBody = null;
  globalThis.fetch = async (url, opts) => {
    calledUrl = String(url);
    sentBody = JSON.parse(opts.body);
    return jsonResponse(201, { success: true, data: { asignacion: { plan_id: 3 } } });
  };
  const res = await asignacionPlanService.asignarPlan(1, { plan_id: 3, motivo_cambio: 'Upgrade' });
  assert.ok(calledUrl.includes('/cu08/servicios/1/planes'));
  assert.equal(sentBody.plan_id, 3);
  assert.equal(res.data.asignacion.plan_id, 3);
});

test('CU13 fetchServiciosCorte envía filtros de mora, zona y búsqueda y normaliza datos', async () => {
  let requestedUrl = '';
  globalThis.fetch = async (url) => {
    requestedUrl = url;
    return jsonResponse(200, {
      success: true,
      data: {
        data: [
          {
            id: 10,
            codigo_servicio: 'SRV-10',
            ip_asignada: '10.0.0.10',
            cliente: { nombres: 'Carlos', apellidos: 'Mamani', ci: '1234567 LP', telefono: '78901234' },
            zona: { nombreZona: 'Zona Central' },
            dias_mora: 14,
            monto_deuda: 350.50,
          },
        ],
      },
    });
  };

  const lista = await serviciosCorteService.fetchServiciosCorte({
    dias_mora: 10,
    zona_id: 2,
    buscar: 'Carlos',
  });

  assert.ok(requestedUrl.includes('/cu13/servicios-corte'));
  assert.ok(requestedUrl.includes('dias_mora=10'));
  assert.ok(requestedUrl.includes('zona_id=2'));
  assert.ok(requestedUrl.includes('buscar=Carlos'));
  assert.equal(lista.length, 1);
  assert.equal(lista[0].cliente_nombre, 'Carlos Mamani');
  assert.equal(lista[0].cliente_ci, '1234567 LP');
  assert.equal(lista[0].zona_nombre, 'Zona Central');
});

test.after(() => {
  delete globalThis.__TELCOM_DEMO__;
});
