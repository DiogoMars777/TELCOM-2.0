import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { MAPA } from '../../../../config/mapConfig.js';
import { normalizarPoligono } from '../../../../models/Paquetes/P2_GestionClientesZonas/CU04_ZonasCobertura/geoArea.js';
import { AlertCircle, AlertTriangle, Search, Wand2, Layers } from 'lucide-react';

// Estilo del polígono dibujado (azul TELCOM).
const ESTILO_AREA = {
  color: '#38bdf8',
  weight: 2.5,
  fillColor: '#38bdf8',
  fillOpacity: 0.25,
};

const CAPAS_MAPA = {
  calles: {
    label: 'Calles (OSM)',
    url: MAPA.tileUrl,
    attribution: MAPA.attribution,
  },
  satelite: {
    label: 'Satélite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
  },
};

/**
 * Mapa interactivo para dibujar/generar el área de cobertura (CU04).
 *
 * - Permite buscar direcciones/barrios mediante la API gratuita Nominatim (OpenStreetMap).
 * - Permite auto-generar un polígono de cobertura editable o dibujarlo manualmente con Geoman.
 * - Captura todos los eventos de creación, edición y arrastre de vértices para garantizar
 *   que `area_mapa` se guarde siempre correctamente en formato GeoJSON Polygon.
 */
export default function MapaArea({ value, onChange }) {
  const contenedorRef = useRef(null);
  const mapaRef = useRef(null);
  const capaRef = useRef(null);
  const tileLayerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const emitirRef = useRef(null);

  const [tileError, setTileError] = useState(false);
  const [initError, setInitError] = useState(null);
  const [capaActiva, setCapaActiva] = useState('calles');

  // Estado del buscador Nominatim
  const [busqueda, setBusqueda] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [searchError, setSearchError] = useState(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Inicializa el mapa una sola vez.
  useEffect(() => {
    if (!contenedorRef.current) return undefined;

    let mapa;
    try {
      mapa = L.map(contenedorRef.current, {
        center: MAPA.centro,
        zoom: MAPA.zoom,
        zoomControl: true,
      });

      const cfg = CAPAS_MAPA.calles;
      const teselas = L.tileLayer(cfg.url, {
        attribution: cfg.attribution,
        maxZoom: MAPA.maxZoom,
      });
      teselas.on('tileerror', () => setTileError(true));
      teselas.on('load', () => setTileError(false));
      teselas.addTo(mapa);
      tileLayerRef.current = teselas;

      if (mapa.pm) {
        mapa.pm.setLang('es');
        mapa.pm.setPathOptions(ESTILO_AREA);
        mapa.pm.addControls({
          position: 'topleft',
          drawMarker: false,
          drawCircleMarker: false,
          drawPolyline: false,
          drawRectangle: true,
          drawCircle: false,
          drawText: false,
          drawPolygon: true,
          editMode: true,
          dragMode: true,
          cutPolygon: false,
          removalMode: true,
          rotateMode: false,
        });
      }
    } catch {
      setInitError('No se pudo iniciar el mapa en este dispositivo.');
      return undefined;
    }

    mapaRef.current = mapa;

    const emitir = () => {
      const capa = capaRef.current;
      if (!capa) {
        onChangeRef.current(null);
        return;
      }
      onChangeRef.current(normalizarPoligono(capa.toGeoJSON()));
    };
    emitirRef.current = emitir;

    const vincularEventosCapa = (layer) => {
      layer.on('pm:update pm:edit pm:dragend pm:markerdragend pm:vertexadded pm:vertexremoved', emitir);
    };

    mapa.on('pm:create', (e) => {
      if (capaRef.current && capaRef.current !== e.layer) {
        mapa.removeLayer(capaRef.current);
      }
      capaRef.current = e.layer;
      vincularEventosCapa(e.layer);
      emitir();
    });

    mapa.on('pm:remove', (e) => {
      const capa = capaRef.current;
      if (
        capa &&
        (capa === e.layer ||
          (typeof capa.hasLayer === 'function' && capa.hasLayer(e.layer)))
      ) {
        capaRef.current = null;
      }
      emitir();
    });

    const observador = new ResizeObserver(() => {
      try {
        mapa.invalidateSize();
      } catch {
        /* el mapa pudo desmontarse */
      }
    });
    observador.observe(contenedorRef.current);
    const temporizador = setTimeout(() => {
      try {
        mapa.invalidateSize();
      } catch {
        /* el mapa pudo desmontarse */
      }
    }, 100);

    return () => {
      clearTimeout(temporizador);
      observador.disconnect();
      try {
        mapa.remove();
      } catch {
        /* ya estaba eliminado */
      }
      mapaRef.current = null;
      capaRef.current = null;
      tileLayerRef.current = null;
      emitirRef.current = null;
    };
  }, []);

  // Cambio de capa (Calles / Satélite)
  const cambiarCapa = (tipo) => {
    const mapa = mapaRef.current;
    if (!mapa || !CAPAS_MAPA[tipo]) return;
    if (tileLayerRef.current) {
      mapa.removeLayer(tileLayerRef.current);
    }
    const cfg = CAPAS_MAPA[tipo];
    const nueva = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: MAPA.maxZoom,
    });
    nueva.on('tileerror', () => setTileError(true));
    nueva.on('load', () => setTileError(false));
    nueva.addTo(mapa);
    tileLayerRef.current = nueva;
    setCapaActiva(tipo);
  };

  // Sincroniza el polígono cuando cambia el valor (editar una zona o auto-generar).
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;

    const capa = capaRef.current;
    const actual = capa ? normalizarPoligono(capa.toGeoJSON()) : null;
    const nuevo = value ?? null;

    if (JSON.stringify(actual) === JSON.stringify(nuevo)) return;

    if (capa) {
      mapa.removeLayer(capa);
      capaRef.current = null;
    }

    if (nuevo) {
      try {
        const nuevaCapa = L.geoJSON(nuevo, { style: ESTILO_AREA });
        nuevaCapa.addTo(mapa);
        capaRef.current = nuevaCapa;
        nuevaCapa.on(
          'pm:update pm:edit pm:dragend pm:markerdragend pm:vertexadded pm:vertexremoved',
          () => emitirRef.current?.()
        );
        mapa.fitBounds(nuevaCapa.getBounds(), { padding: [25, 25], maxZoom: 16 });
      } catch {
        setInitError('El área guardada no se pudo mostrar en el mapa.');
      }
    }
  }, [value]);

  // Buscar lugar usando la API de Geocodificación Nominatim (OpenStreetMap)
  const buscarLugar = async () => {
    const q = busqueda.trim();
    if (!q) return;
    setBuscando(true);
    setSearchError(null);
    setResultados([]);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&polygon_geojson=1&limit=5&addressdetails=1`;
      const resp = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      if (!resp.ok) throw new Error('Error consultando API de mapas');
      const data = await resp.json();
      if (!Array.isArray(data) || data.length === 0) {
        setSearchError('No se encontraron ubicaciones. Intenta agregar ", Santa Cruz, Bolivia".');
      } else {
        setResultados(data);
      }
    } catch {
      setSearchError('No se pudo conectar con la API de geocodificación.');
    } finally {
      setBuscando(false);
    }
  };

  // Al elegir un resultado de Nominatim: centrar mapa y generar polígono si es posible
  const seleccionarLugar = (lugar) => {
    const mapa = mapaRef.current;
    setResultados([]);
    setBusqueda(lugar.display_name);

    const lat = parseFloat(lugar.lat);
    const lon = parseFloat(lugar.lon);

    let poligono = null;
    if (lugar.geojson && lugar.geojson.type === 'Polygon') {
      poligono = normalizarPoligono(lugar.geojson);
    } else if (lugar.geojson && lugar.geojson.type === 'MultiPolygon' && Array.isArray(lugar.geojson.coordinates?.[0])) {
      poligono = normalizarPoligono({
        type: 'Polygon',
        coordinates: lugar.geojson.coordinates[0],
      });
    } else if (Array.isArray(lugar.boundingbox) && lugar.boundingbox.length === 4) {
      const [sLat, nLat, wLon, eLon] = lugar.boundingbox.map(Number);
      // Si el boundingbox es demasiado grande (> 0.1 grados), acotar un área alrededor del centro
      const spanLat = Math.min(Math.abs(nLat - sLat) / 2, 0.012);
      const spanLon = Math.min(Math.abs(eLon - wLon) / 2, 0.012);
      const dLat = Math.max(spanLat, 0.004);
      const dLon = Math.max(spanLon, 0.004);
      poligono = {
        type: 'Polygon',
        coordinates: [[
          [Number((lon - dLon).toFixed(6)), Number((lat - dLat).toFixed(6))],
          [Number((lon + dLon).toFixed(6)), Number((lat - dLat).toFixed(6))],
          [Number((lon + dLon).toFixed(6)), Number((lat + dLat).toFixed(6))],
          [Number((lon - dLon).toFixed(6)), Number((lat + dLat).toFixed(6))],
          [Number((lon - dLon).toFixed(6)), Number((lat - dLat).toFixed(6))],
        ]],
      };
    }

    if (poligono) {
      onChangeRef.current(poligono);
    } else if (mapa && Number.isFinite(lat) && Number.isFinite(lon)) {
      mapa.setView([lat, lon], 15);
    }
  };

  // Genera un polígono editable automáticamente en el centro de la vista actual
  const generarPoligonoEnVista = () => {
    const mapa = mapaRef.current;
    if (!mapa) return;
    const c = mapa.getCenter();
    const b = mapa.getBounds();
    const dLat = Math.min(Math.abs(b.getNorth() - b.getSouth()) * 0.22, 0.015);
    const dLng = Math.min(Math.abs(b.getEast() - b.getWest()) * 0.22, 0.015);

    const poligono = {
      type: 'Polygon',
      coordinates: [[
        [Number((c.lng - dLng).toFixed(6)), Number((c.lat - dLat).toFixed(6))],
        [Number((c.lng + dLng).toFixed(6)), Number((c.lat - dLat).toFixed(6))],
        [Number((c.lng + dLng).toFixed(6)), Number((c.lat + dLat).toFixed(6))],
        [Number((c.lng - dLng).toFixed(6)), Number((c.lat + dLat).toFixed(6))],
        [Number((c.lng - dLng).toFixed(6)), Number((c.lat - dLat).toFixed(6))],
      ]],
    };
    onChangeRef.current(poligono);
  };

  return (
    <div className="cu04-map-wrap">
      {/* Barra de herramientas API de Mapas (Nominatim + Generador + Capas) */}
      <div className="cu04-map-toolbar">
        <div className="cu04-map-search">
          <input
            type="text"
            placeholder="Buscar barrio, avenida o zona (ej: Equipetrol, Santa Cruz)"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                buscarLugar();
              }
            }}
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={buscarLugar}
            disabled={buscando}
            title="Buscar ubicación con API OpenStreetMap"
          >
            <Search size={14} /> {buscando ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        <div className="cu04-map-tools-right">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={generarPoligonoEnVista}
            title="Crear un polígono editable en el centro del mapa"
          >
            <Wand2 size={14} /> Auto-generar aquí
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => cambiarCapa(capaActiva === 'calles' ? 'satelite' : 'calles')}
            title="Cambiar vista de mapa"
          >
            <Layers size={14} /> {capaActiva === 'calles' ? 'Satélite' : 'Calles'}
          </button>
        </div>
      </div>

      {/* Dropdown de resultados de la API Nominatim */}
      {resultados.length > 0 && (
        <ul className="cu04-search-results">
          {resultados.map((res) => (
            <li key={res.place_id}>
              <button type="button" onClick={() => seleccionarLugar(res)}>
                {res.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}

      {searchError && (
        <p className="cu04-map-warning" role="status">
          <AlertTriangle size={14} /> {searchError}
        </p>
      )}

      {initError ? (
        <div className="cu04-map-fallback" role="alert">
          <AlertCircle size={18} />
          <span>{initError}</span>
        </div>
      ) : (
        <div
          ref={contenedorRef}
          className="cu04-map"
          aria-label="Mapa para dibujar o seleccionar el área de cobertura"
        />
      )}

      {tileError && !initError && (
        <p className="cu04-map-warning" role="status">
          <AlertTriangle size={14} />
          No se pudieron cargar algunas imágenes de fondo del mapa; puedes seguir
          dibujando y guardando el área normalmente.
        </p>
      )}
    </div>
  );
}
