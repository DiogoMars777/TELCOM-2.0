/**
 * Configuración de mapas para TELCOM (CU04 - Zonas de Cobertura).
 * -------------------------------------------------------------------
 * El proveedor de teselas (las imágenes de fondo del mapa) es CONFIGURABLE
 * por variables de entorno para poder cambiarlo sin tocar el código:
 *
 *   VITE_MAP_TILE_URL       Plantilla de URL de las teselas.
 *   VITE_MAP_ATTRIBUTION    Texto de atribución (créditos) exigido por el
 *                           proveedor.
 *   VITE_MAP_MAX_ZOOM       Zoom máximo admitido.
 *
 * Valor por defecto: OpenStreetMap (sin clave ni costo).
 *
 * ADVERTENCIA sobre las teselas de OpenStreetMap:
 * Los servidores públicos de teselas de la Fundación OpenStreetMap son un
 * servicio gratuito y comunitario; NO garantizan disponibilidad ni uso
 * ilimitado. Para producción o uso intensivo debe usarse un proveedor propio
 * o uno que cumpla la política de uso:
 *   https://operations.osmfoundation.org/policies/tiles/
 *
 * IMPORTANTE (privacidad): a las teselas solo se envían las coordenadas del
 * mapa que se está viendo; NUNCA se envían datos de clientes ni información
 * del formulario. El polígono del área se dibuja y se guarda en TELCOM.
 */

const TILE_URL_POR_DEFECTO = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

const ATTRIBUTION_POR_DEFECTO =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';

/**
 * Lee una variable de entorno de Vite de forma segura (también en las pruebas
 * con `node --test`, donde `import.meta.env` no existe).
 */
function env(nombre) {
  const valor = import.meta.env?.[nombre];
  return typeof valor === 'string' && valor.trim() !== '' ? valor.trim() : null;
}

export const MAPA = {
  tileUrl: env('VITE_MAP_TILE_URL') || TILE_URL_POR_DEFECTO,
  attribution: env('VITE_MAP_ATTRIBUTION') || ATTRIBUTION_POR_DEFECTO,
  maxZoom: Number(env('VITE_MAP_MAX_ZOOM')) || 19,
  // Vista inicial del mapa cuando una zona NUEVA todavía no tiene área guardada:
  // Santa Cruz de la Sierra, Bolivia. No contiene datos de clientes.
  // En Leaflet el centro se expresa como [latitud, longitud]; el GeoJSON que
  // se guarda usa el orden inverso, [longitud, latitud] (no confundirlos).
  // Al editar una zona que YA tiene polígono, MapaArea ajusta la vista al área
  // guardada (`fitBounds`), así que este centro no la reemplaza ni la mueve.
  centro: [-17.7834, -63.1821],
  zoom: 12,
};
