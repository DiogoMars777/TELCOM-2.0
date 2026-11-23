import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { reporteInteligenteService as service, EJEMPLOS_REPORTES } from '../src/models/Paquetes/P7_DashboardReportesInteligenciaVoz/CU31_GenerarReporteInteligenteVoz/reporteInteligenteModel.js';
import { crearControladorReporte } from '../src/controllers/Paquetes/P7_DashboardReportesInteligenciaVoz/CU31_GenerarReporteInteligenteVoz/useReporteInteligenteController.js';
import { canAccessCu, firstAllowedCu, CU_ORDER } from '../src/config/access.js';

const originalFetch = globalThis.fetch;
const originalStorage = globalThis.localStorage;
let calls;
let vite;
let View;
let Contenido;
const datos = {
  interpretacion: { tipo: 'clientes_por_zona', origen: 'gemini', filtros: { estado: 'ACTIVO' } },
  reporte: {
    tipo: 'clientes_por_zona', titulo: 'Clientes por zona', resumen: 'Se encontraron 3 clientes.',
    filtros: { estado: 'ACTIVO' }, generado_en: '2026-11-20T10:00:00-04:00',
    columnas: [{ clave: 'zona', etiqueta: 'Zona', formato: 'texto' }, { clave: 'cantidad', etiqueta: 'Clientes', formato: 'entero' }],
    filas: [{ zona: 'Norte', cantidad: 3 }],
    totales: [{ clave: 'clientes', etiqueta: 'Clientes', valor: 3, formato: 'entero' }],
    truncado: false, limite_filas: 200,
  },
};

function responder(body, status = 200) {
  globalThis.fetch = async (url, init) => {
    calls.push({ url: new URL(url), init });
    return { ok: status >= 200 && status < 300, status, json: async () => body };
  };
}

test.before(async () => {
  // Transforma el JSX real con las herramientas ya instaladas; no agrega dependencias.
  vite = await createServer({ configFile: false, server: { middlewareMode: true, watch: null }, appType: 'custom' });
  const modulo = await vite.ssrLoadModule('/src/views/Paquetes/P7_DashboardReportesInteligenciaVoz/CU31_GenerarReporteInteligenteVoz/ReporteInteligenteView.jsx');
  View = modulo.default;
  Contenido = modulo.ReporteInteligenteContenido;
});
test.beforeEach(() => {
  calls = [];
  globalThis.localStorage = { getItem: () => 'token-cu31-test' };
});
test.after(async () => {
  await vite?.close();
  globalThis.fetch = originalFetch;
  globalThis.localStorage = originalStorage;
});

test('CU31 service envía texto transcrito mediante apiClient y token Sanctum', async () => {
  responder({ success: true, data: datos });
  assert.deepEqual(await service.generarReporte({ comando: '  Clientes activos  ' }), datos);
  assert.equal(calls[0].url.pathname, '/api/cu31/reportes/generar');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer token-cu31-test');
  assert.deepEqual(JSON.parse(calls[0].init.body), { comando: 'Clientes activos' });
});

test('CU31 service admite intención CU30 y omite un comando redundante', async () => {
  responder({ success: true, data: datos });
  const intencion = { tipo: 'clientes_por_zona', filtros: { estado: 'ACTIVO' } };
  await service.generarReporte({ comando: 'No reinterpretar', intencion });
  assert.deepEqual(JSON.parse(calls[0].init.body), { intencion });
});

test('CU31 service propaga fallos HTTP y de red sin fabricar resultados', async () => {
  for (const status of [403, 422, 502, 503, 504]) {
    responder({ success: false, message: 'Error controlado', errors: { codigo: 'GEMINI_HTTP' } }, status);
    await assert.rejects(service.generarReporte({ comando: 'Clientes' }), (error) => error.status === status);
  }
  globalThis.fetch = async () => { throw new Error('offline'); };
  await assert.rejects(service.generarReporte({ comando: 'Clientes' }), (error) => error.status === 0);
});

test('CU31 service rechaza respuestas exitosas con un reporte mal formado', async () => {
  responder({ success: true, data: { reporte: {} } });
  await assert.rejects(service.generarReporte({ comando: 'Clientes' }), /reporte inválido/);
});

test('CU31 permisos se basan en reportes.view, incluyendo el menú y el acceso directo', async () => {
  assert.equal(canAccessCu({ permisos: ['reportes.view'] }, 'CU31'), true);
  assert.ok(CU_ORDER.includes('CU31'));
  assert.equal(canAccessCu({ permisos: ['reportes.view'] }, firstAllowedCu({ permisos: ['reportes.view'] })), true);
  for (const user of [null, { rol: { slug: 'admin' }, permisos: [] }, { permisos: ['clientes.view'] }]) {
    assert.equal(canAccessCu(user, 'CU31'), false);
    const html = renderToStaticMarkup(React.createElement(View, { user }));
    assert.match(html, /No tienes autorización/);
    assert.doesNotMatch(html, /textarea|<table/);
  }
  let invocaciones = 0;
  const c = crearControladorReporte({ puedeGenerar: false, service: { generarReporte() { invocaciones++; } } });
  c.setComando('Clientes activos');
  await c.generar();
  assert.equal(invocaciones, 0);
  assert.match(c.getSnapshot().error, /autorización/);
});

test('CU31 valida el comando y acepta la futura transcripción sin generar automáticamente', async () => {
  let invocaciones = 0;
  const c = crearControladorReporte({ puedeGenerar: true, service: { generarReporte() { invocaciones++; return datos; } } });
  await c.generar();
  assert.match(c.getSnapshot().error, /3 y 1000/);
  c.setComando('Transcripción recibida');
  assert.equal(invocaciones, 0);
  assert.equal(c.getSnapshot().comando, 'Transcripción recibida');
  c.setComando('a'.repeat(1001));
  await c.generar();
  assert.equal(invocaciones, 0);
});

function renderEstado(c) {
  return renderToStaticMarkup(React.createElement(Contenido, { ...c.getSnapshot(), setComando: c.setComando, generar: c.generar }));
}

test('CU31 controlador y vista muestran carga, bloquean duplicados y luego presentan el resultado', async () => {
  let resolver;
  let invocaciones = 0;
  const c = crearControladorReporte({ puedeGenerar: true, service: { generarReporte() {
    invocaciones++;
    return new Promise((resolve) => { resolver = resolve; });
  } } });
  c.setComando('Clientes activos');
  const pendiente = c.generar();
  assert.equal(c.getSnapshot().loading, true);
  assert.equal(c.getSnapshot().datos, null);
  const cargando = renderEstado(c);
  assert.match(cargando, /Generando reporte/);
  assert.match(cargando, /aria-busy="true"/);
  assert.match(cargando, /role="status"/);
  assert.match(cargando, /disabled/);
  await c.generar();
  assert.equal(invocaciones, 1);
  resolver(datos);
  await pendiente;
  assert.equal(c.getSnapshot().loading, false);
  assert.deepEqual(c.getSnapshot().datos, datos);
  const html = renderEstado(c);
  assert.match(html, /Solicitud interpretada/);
  assert.match(html, /Clientes por zona/);
  assert.match(html, /Se encontraron 3 clientes/);
  assert.match(html, /<table/);
  assert.match(html, /Norte/);
  assert.match(html, /ACTIVO/);
});

test('CU31 controlador y vista muestran un error claro y borran el resultado anterior', async () => {
  let falla = false;
  const c = crearControladorReporte({ puedeGenerar: true, service: { async generarReporte() {
    if (falla) throw Object.assign(new Error('Detalle remoto que no debe mostrarse'), { status: 503, errors: { codigo: 'GEMINI_NO_CONFIGURADO' } });
    return datos;
  } } });
  c.setComando('Clientes activos');
  await c.generar();
  falla = true;
  await c.generar();
  assert.equal(c.getSnapshot().loading, false);
  assert.equal(c.getSnapshot().datos, null);
  assert.match(c.getSnapshot().error, /GEMINI_API_KEY/);
  const html = renderEstado(c);
  assert.match(html, /role="alert"/);
  assert.doesNotMatch(html, /Detalle remoto|<table/);
});

test('CU31 errores de validación, timeout, Gemini inválido y error HTTP se muestran de forma controlada', async () => {
  for (const [error, esperado] of [
    [Object.assign(new Error('Validación'), { status: 422, errors: { 'intencion.tipo': ['La intención no corresponde a un reporte permitido.'] } }), /reporte permitido/],
    [Object.assign(new Error('Interno'), { status: 504, errors: { codigo: 'GEMINI_TIMEOUT' } }), /tiempo de espera/],
    [Object.assign(new Error('Interno'), { status: 502, errors: { codigo: 'GEMINI_RESPUESTA_INVALIDA' } }), /no es válida/],
    [Object.assign(new Error('SQL privado'), { status: 500 }), /problema en el servidor/],
  ]) {
    const c = crearControladorReporte({ puedeGenerar: true, service: { async generarReporte() { throw error; } } });
    c.setComando('Clientes activos');
    await c.generar();
    assert.match(c.getSnapshot().error, esperado);
    assert.doesNotMatch(renderEstado(c), /SQL privado/);
  }
});

test('CU31 una intención estructurada funciona sin texto y una respuesta tardía se descarta al desmontar', async () => {
  let resolver;
  let recibido;
  const c = crearControladorReporte({ puedeGenerar: true, service: { generarReporte(payload) {
    recibido = payload;
    return new Promise((resolve) => { resolver = resolve; });
  } } });
  const intencion = { tipo: 'inventario_disponible', filtros: {} };
  const pendiente = c.generar(intencion);
  assert.deepEqual(recibido, { intencion });
  c.invalidar();
  resolver(datos);
  await pendiente;
  assert.equal(c.getSnapshot().datos, null);
  assert.equal(c.getSnapshot().loading, false);
});

test('CU31 vista ofrece siete ejemplos y presenta tablas vacías, totales monetarios y truncamiento', () => {
  assert.equal(EJEMPLOS_REPORTES.length, 7);
  const htmlInicial = renderToStaticMarkup(React.createElement(View, { user: { permisos: ['reportes.view'] } }));
  assert.match(htmlInicial, /Solicitud o comando transcrito/);
  assert.match(htmlInicial, /Ejemplos de solicitudes/);
  const html = renderToStaticMarkup(React.createElement(Contenido, {
    comando: 'Ingresos', setComando() {}, generar() {}, loading: false, error: null,
    datos: { ...datos, reporte: { ...datos.reporte, filas: [], truncado: true, totales: [{ clave: 'importe', etiqueta: 'Ingresos', valor: '250.35', formato: 'moneda' }] } },
  }));
  assert.match(html, /No hay resultados/);
  assert.match(html, /200 filas/);
  assert.match(html, /totales incluyen todos/);
  assert.match(html, /250[,.]35/);
});
