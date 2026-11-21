/**
 * Utilidades de geometría para el área de cobertura (CU04).
 * -------------------------------------------------------------------
 * Módulo PURO (sin React, sin Leaflet) para poder probarlo con `node --test`.
 *
 * El área se representa como un polígono GeoJSON:
 *   { type: 'Polygon', coordinates: [ [ [lng, lat], ... ] ] }
 *
 * Estas funciones replican la validación básica del backend y permiten
 * mostrar una vista previa del área sin cargar mapas ni teselas (por eso la
 * lista de zonas no solicita imágenes a ningún proveedor externo).
 */

/** Estados de cobertura permitidos (deben coincidir con el backend). */
export const ESTADOS_COBERTURA = ['Disponible', 'Parcial', 'Saturada', 'En expansión'];

/**
 * Valida la estructura básica de un polígono GeoJSON.
 * Devuelve `true` si es válido o `false` si no lo es. `null` NO es válido
 * aquí (se usa `!area` para representar "sin área").
 */
export function esAreaValida(area) {
  if (!area || typeof area !== 'object') return false;
  if (area.type !== 'Polygon') return false;

  const coords = area.coordinates;
  if (!Array.isArray(coords) || !Array.isArray(coords[0])) return false;

  const anillo = coords[0];
  if (anillo.length < 4) return false;

  return anillo.every((punto) => {
    if (!Array.isArray(punto) || punto.length < 2) return false;
    const [lng, lat] = punto;
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return false;
    return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
  });
}

/**
 * Normaliza la salida de `capa.toGeoJSON()` de Leaflet a una geometría
 * Polygon válida, o `null` si no representa un polígono.
 *
 * Leaflet devuelve formas distintas según cómo se creó la capa:
 * - un polígono dibujado (`L.Polygon`)  -> `Feature` con `geometry` Polygon;
 * - un área ya guardada (`L.geoJSON`)   -> `FeatureCollection` (sin `geometry`).
 * El formulario y el backend esperan SIEMPRE una geometría Polygon, o `null`
 * cuando no hay área (p. ej. al quitarla). Aquí se extrae la geometría real,
 * de modo que nunca se envía un `FeatureCollection`.
 */
export function normalizarPoligono(geojson) {
  if (!geojson || typeof geojson !== 'object') return null;

  if (geojson.type === 'FeatureCollection') {
    const features = Array.isArray(geojson.features) ? geojson.features : [];
    for (const feature of features) {
      const poligono = normalizarPoligono(feature);
      if (poligono) return poligono;
    }
    return null;
  }

  if (geojson.type === 'Feature') {
    return normalizarPoligono(geojson.geometry);
  }

  if (geojson.type === 'GeometryCollection') {
    const geometrias = Array.isArray(geojson.geometries) ? geojson.geometries : [];
    for (const geometria of geometrias) {
      const poligono = normalizarPoligono(geometria);
      if (poligono) return poligono;
    }
    return null;
  }

  if (geojson.type === 'Polygon' && esAreaValida(geojson)) {
    return geojson;
  }

  return null;
}

/** Cantidad de vértices del anillo principal (incluye el punto de cierre). */
export function contarVertices(area) {
  if (!esAreaValida(area)) return 0;
  return area.coordinates[0].length;
}

/** Límites geográficos del área: { minLng, maxLng, minLat, maxLat } o null. */
export function boundsDeArea(area) {
  if (!esAreaValida(area)) return null;

  const lngs = area.coordinates[0].map((p) => p[0]);
  const lats = area.coordinates[0].map((p) => p[1]);

  return {
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
  };
}

/**
 * Convierte el polígono en una cadena de puntos SVG ("x,y x,y ...") encajada
 * dentro del rectángulo `width` x `height`, conservando la proporción.
 * Devuelve '' si el área no es válida.
 */
export function areaToSvgPoints(area, width = 100, height = 60, padding = 6) {
  const b = boundsDeArea(area);
  if (!b) return '';

  const ancho = b.maxLng - b.minLng;
  const alto = b.maxLat - b.minLat;
  const utilW = Math.max(width - padding * 2, 1);
  const utilH = Math.max(height - padding * 2, 1);

  const escalas = [];
  if (ancho > 0) escalas.push(utilW / ancho);
  if (alto > 0) escalas.push(utilH / alto);
  const escala = escalas.length ? Math.min(...escalas) : 1;

  const dibW = ancho * escala;
  const dibH = alto * escala;
  const offsetX = (width - dibW) / 2;
  const offsetY = (height - dibH) / 2;

  return area.coordinates[0]
    .map(([lng, lat]) => {
      const x = offsetX + (lng - b.minLng) * escala;
      // La latitud crece hacia el norte; en SVG la Y crece hacia abajo.
      const y = offsetY + (b.maxLat - lat) * escala;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}
