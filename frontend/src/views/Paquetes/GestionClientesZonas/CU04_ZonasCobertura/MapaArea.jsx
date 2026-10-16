import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { MAPA } from '../../../../config/mapConfig.js';
import { normalizarPoligono } from '../../../../models/Paquetes/GestionClientesZonas/CU04_ZonasCobertura/geoArea.js';
import { AlertCircle, AlertTriangle } from 'lucide-react';

// Estilo del polígono dibujado (azul TELCOM).
const ESTILO_AREA = {
  color: '#38bdf8',
  weight: 2,
  fillColor: '#38bdf8',
  fillOpacity: 0.25,
};

/**
 * Mapa interactivo para dibujar el área de cobertura (CU04).
 *
 * - Permite dibujar/editar el polígono con mouse o pantalla táctil.
 * - Emite el área como geometría GeoJSON ({ type, coordinates }) vía `onChange`.
 * - Si las teselas no cargan, muestra un aviso pero el resto del formulario
 *   (y lo ya dibujado) se conserva: no se pierde ningún dato.
 *
 * IMPORTANTE: al proveedor de teselas solo se piden imágenes de fondo; NUNCA
 * se envían datos del formulario ni información de clientes.
 */
export default function MapaArea({ value, onChange }) {
  const contenedorRef = useRef(null);
  const mapaRef = useRef(null);
  const capaRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const emitirRef = useRef(null);
  const [tileError, setTileError] = useState(false);
  const [initError, setInitError] = useState(null);

  // Mantiene la referencia más reciente del callback sin reiniciar el mapa.
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

      const teselas = L.tileLayer(MAPA.tileUrl, {
        attribution: MAPA.attribution,
        maxZoom: MAPA.maxZoom,
      });
      teselas.on('tileerror', () => setTileError(true));
      teselas.on('load', () => setTileError(false));
      teselas.addTo(mapa);

      if (mapa.pm) {
        mapa.pm.setLang('es');
        mapa.pm.setPathOptions(ESTILO_AREA);
        mapa.pm.addControls({
          position: 'topleft',
          drawMarker: false,
          drawCircleMarker: false,
          drawPolyline: false,
          drawRectangle: false,
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
      // Sincronización con un sistema externo (Leaflet): es correcto
      // reflejar aquí el fallo de inicialización en el estado de React.
      // eslint-disable-next-line react/set-state-in-effect
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
      // Leaflet devuelve `Feature` o `FeatureCollection` según cómo se creó la
      // capa; el formulario guarda SIEMPRE una geometría Polygon (o null).
      onChangeRef.current(normalizarPoligono(capa.toGeoJSON()));
    };
    emitirRef.current = emitir;

    mapa.on('pm:create', (e) => {
      if (capaRef.current && capaRef.current !== e.layer) {
        mapa.removeLayer(capaRef.current);
      }
      capaRef.current = e.layer;
      e.layer.on('pm:update pm:edit', emitir);
      emitir();
    });

    mapa.on('pm:remove', (e) => {
      // Si se quita el polígono (o uno de los polígonos del grupo cargado),
      // se deja de rastrear y se envía null: no un FeatureCollection vacío.
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

    // El modal puede abrirse con tamaño 0 y luego ajustarse: hay que avisar a
    // Leaflet para que recalcule el tamaño y las teselas.
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
    }, 0);

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
      emitirRef.current = null;
    };
  }, []);

  // Sincroniza el polígono cuando cambia el valor (editar una zona existente).
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;

    const capa = capaRef.current;
    const actual = capa ? normalizarPoligono(capa.toGeoJSON()) : null;
    const nuevo = value ?? null;

    // Evita reemplazar el polígono mientras el propio mapa lo está emitiendo.
    const iguales = JSON.stringify(actual) === JSON.stringify(nuevo);
    if (iguales) return;

    if (capa) {
      mapa.removeLayer(capa);
      capaRef.current = null;
    }

    if (nuevo) {
      try {
        const nuevaCapa = L.geoJSON(nuevo, { style: ESTILO_AREA });
        nuevaCapa.addTo(mapa);
        capaRef.current = nuevaCapa;
        // Un área ya guardada se carga como `L.GeoJSON`: hay que escuchar sus
        // cambios (burbujean del polígono hijo al grupo) para que la edición
        // llegue al formulario y se guarde.
        nuevaCapa.on('pm:update pm:edit', () => emitirRef.current?.());
        mapa.fitBounds(nuevaCapa.getBounds(), { padding: [20, 20], maxZoom: 16 });
      } catch {
        // Sincronización con Leaflet: si el área guardada no se puede pintar,
        // se avisa sin perder el resto del formulario.
        // eslint-disable-next-line react/set-state-in-effect
        setInitError('El área guardada no se pudo mostrar en el mapa.');
      }
    }
  }, [value]);

  return (
    <div className="cu04-map-wrap">
      {initError ? (
        <div className="cu04-map-fallback" role="alert">
          <AlertCircle size={18} />
          <span>{initError} Puedes guardar la zona sin dibujar el área.</span>
        </div>
      ) : (
        <>
          <div ref={contenedorRef} className="cu04-map" />
          {tileError && (
            <p className="cu04-map-warning" role="status">
              <AlertTriangle size={14} /> No se pudieron cargar las imágenes de fondo del mapa.
              Puedes seguir dibujando el área; los demás datos del formulario se conservan.
            </p>
          )}
        </>
      )}
    </div>
  );
}
