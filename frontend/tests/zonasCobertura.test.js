/**
 * Pruebas reales de CU04 (Zonas de Cobertura): geometría del área (GeoJSON),
 * catálogo de estados y llamadas del servicio al backend.
 *
 * Se ejecutan con el runner integrado de Node (`node --test`), sin dependencias
 * adicionales. No importan Leaflet (el mapa se prueba en el navegador).
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

const { ESTADOS_COBERTURA, esAreaValida, contarVertices, boundsDeArea, areaToSvgPoints, normalizarPoligono } =
  await import('../src/models/Paquetes/GestionClientesZonas/CU04_ZonasCobertura/geoArea.js');
const { zonaService, mockZonas } =
  await import('../src/models/Paquetes/GestionClientesZonas/CU04_ZonasCobertura/zonaCoberturaModel.js');

const POLIGONO = {
  type: 'Polygon',
  coordinates: [[
    [-68.16, -16.47],
    [-68.12, -16.47],
    [-68.12, -16.50],
    [-68.16, -16.50],
    [-68.16, -16.47],
  ]],
};

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

// ---------------------------------------------------------------------------
// Catálogo de estados
// ---------------------------------------------------------------------------

test('Los estados de cobertura permitidos son los cuatro definidos', () => {
  assert.deepEqual(ESTADOS_COBERTURA, ['Disponible', 'Parcial', 'Saturada', 'En expansión']);
});

// ---------------------------------------------------------------------------
// Validación del polígono GeoJSON (misma regla básica que el backend)
// ---------------------------------------------------------------------------

test('esAreaValida acepta un polígono GeoJSON bien formado', () => {
  assert.equal(esAreaValida(POLIGONO), true);
});

test('esAreaValida rechaza null, tipos no polígono y anillos incompletos', () => {
  assert.equal(esAreaValida(null), false);
  assert.equal(esAreaValida(undefined), false);
  assert.equal(esAreaValida('texto'), false);
  assert.equal(esAreaValida({ type: 'Point', coordinates: [-68.1, -16.5] }), false);
  assert.equal(esAreaValida({ type: 'Polygon', coordinates: [] }), false);
  assert.equal(esAreaValida({ type: 'Polygon', coordinates: [[[-68.1, -16.5], [-68.1, -16.4]]] }), false);
});

test('esAreaValida rechaza coordenadas fuera de rango o no numéricas', () => {
  assert.equal(esAreaValida({
    type: 'Polygon',
    coordinates: [[[-200, -16.5], [-68.1, -16.5], [-68.1, -16.4], [-200, -16.5]]],
  }), false);

  assert.equal(esAreaValida({
    type: 'Polygon',
    coordinates: [[['a', 'b'], [-68.1, -16.5], [-68.1, -16.4], [-68.15, -16.45]]],
  }), false);
});

test('contarVertices cuenta los puntos del anillo principal', () => {
  assert.equal(contarVertices(POLIGONO), 5);
  assert.equal(contarVertices(null), 0);
});

// ---------------------------------------------------------------------------
// Normalización de la salida de Leaflet: SIEMPRE una geometría Polygon o null
// (Leaflet devuelve Feature al dibujar y FeatureCollection al cargar L.geoJSON)
// ---------------------------------------------------------------------------

test('normalizarPoligono extrae el Polygon de un Feature (polígono dibujado)', () => {
  const feature = { type: 'Feature', properties: {}, geometry: POLIGONO };
  assert.deepEqual(normalizarPoligono(feature), POLIGONO);
});

test('normalizarPoligono extrae el Polygon de un FeatureCollection (área cargada)', () => {
  // `capa.toGeoJSON()` de una capa L.geoJSON devuelve un FeatureCollection.
  const featureCollection = {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', properties: {}, geometry: POLIGONO }],
  };
  const resultado = normalizarPoligono(featureCollection);
  assert.equal(resultado.type, 'Polygon');
  assert.deepEqual(resultado, POLIGONO);
});

test('normalizarPoligono devuelve null al quitar el área (FeatureCollection vacío)', () => {
  assert.equal(normalizarPoligono({ type: 'FeatureCollection', features: [] }), null);
  assert.equal(normalizarPoligono(null), null);
  assert.equal(normalizarPoligono(undefined), null);
  assert.equal(normalizarPoligono({ type: 'Point', coordinates: [0, 0] }), null);
  assert.equal(normalizarPoligono({ type: 'Polygon', coordinates: [] }), null);
});

test('crear, editar y guardar: la edición llega como Polygon válido', () => {
  // 1) Polígono recién dibujado: Leaflet emite un Feature.
  const alCrear = normalizarPoligono({ type: 'Feature', properties: {}, geometry: POLIGONO });
  assert.equal(esAreaValida(alCrear), true);

  // 2) El usuario mueve un vértice del área ya guardada.
  const editado = {
    type: 'Polygon',
    coordinates: [[
      [-68.18, -16.48],
      [-68.10, -16.48],
      [-68.10, -16.52],
      [-68.18, -16.52],
      [-68.18, -16.48],
    ]],
  };

  // 3) Al editar, la capa cargada (L.geoJSON) emite un FeatureCollection.
  const alEditar = normalizarPoligono({
    type: 'FeatureCollection',
    features: [{ type: 'Feature', properties: {}, geometry: editado }],
  });

  // El formulario recibe un Polygon válido con las coordenadas YA editadas.
  assert.equal(alEditar.type, 'Polygon');
  assert.equal(esAreaValida(alEditar), true);
  assert.deepEqual(alEditar.coordinates, editado.coordinates);
});

// ---------------------------------------------------------------------------
// Vista previa SVG (sin mapas ni teselas)
// ---------------------------------------------------------------------------

test('boundsDeArea calcula los límites geográficos', () => {
  const b = boundsDeArea(POLIGONO);
  assert.equal(b.minLng, -68.16);
  assert.equal(b.maxLng, -68.12);
  assert.equal(b.minLat, -16.50);
  assert.equal(b.maxLat, -16.47);
  assert.equal(boundsDeArea(null), null);
});

test('areaToSvgPoints devuelve puntos dentro del lienzo solicitado', () => {
  const width = 200;
  const height = 110;
  const puntos = areaToSvgPoints(POLIGONO, width, height, 8).split(' ');

  assert.equal(puntos.length, 5);
  for (const punto of puntos) {
    const [x, y] = punto.split(',').map(Number);
    assert.ok(Number.isFinite(x) && Number.isFinite(y));
    assert.ok(x >= 0 && x <= width, `x fuera de rango: ${x}`);
    assert.ok(y >= 0 && y <= height, `y fuera de rango: ${y}`);
  }
});

test('areaToSvgPoints devuelve cadena vacía si el área no es válida', () => {
  assert.equal(areaToSvgPoints(null), '');
  assert.equal(areaToSvgPoints({ type: 'Point', coordinates: [0, 0] }), '');
});

// ---------------------------------------------------------------------------
// Servicio (llamadas reales al backend)
// ---------------------------------------------------------------------------

test('createZona hace POST a /cu04/zonas', async () => {
  stubFetch(jsonResponse(201, { success: true, data: { id: 7 } }));
  const res = await zonaService.createZona({ codigo: 'Z-1' });
  assert.equal(res.success, true);
  assert.equal(lastCall.init.method, 'POST');
  assert.match(lastCall.url, /\/cu04\/zonas$/);
});

test('updateZona hace PUT a /cu04/zonas/{id}', async () => {
  stubFetch(jsonResponse(200, { success: true, data: { id: 5, estado_cobertura: 'Parcial' } }));
  const res = await zonaService.updateZona(5, { estado_cobertura: 'Parcial' });
  assert.equal(res.success, true);
  assert.equal(lastCall.init.method, 'PUT');
  assert.match(lastCall.url, /\/cu04\/zonas\/5$/);
  assert.equal(JSON.parse(lastCall.init.body).estado_cobertura, 'Parcial');
});

test('updateZona propaga los errores de validación (422)', async () => {
  stubFetch(jsonResponse(422, {
    success: false,
    message: 'Los datos no son válidos.',
    errors: { area_mapa: ['El área del mapa debe ser un polígono.'] },
  }));

  await assert.rejects(zonaService.updateZona(5, {}), (err) => {
    assert.equal(err.status, 422);
    return true;
  });
});

test('En modo demostración las zonas de ejemplo incluyen los campos nuevos', async () => {
  globalThis.__TELCOM_DEMO__ = true;
  globalThis.fetch = async () => { throw new Error('No debería llamarse a fetch en modo demostración'); };

  const zonas = await zonaService.fetchZonas();
  assert.deepEqual(zonas, mockZonas);
  assert.ok('estado_cobertura' in zonas[0]);
  assert.ok('barrio' in zonas[0]);
  assert.equal(esAreaValida(zonas[0].area_mapa), true);
  // El registro "antiguo" del ejemplo no tiene estado ni área.
  assert.equal(zonas[2].estado_cobertura, null);
  assert.equal(zonas[2].area_mapa, null);
});
