import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MAPA } from '../../../../config/mapConfig.js';
import { esAreaValida } from '../../../../models/Paquetes/P2_GestionClientesZonas/CU04_ZonasCobertura/geoArea.js';

const COLORES_ESTADO = {
  Disponible: '#22c55e',
  Parcial: '#f59e0b',
  Saturada: '#ef4444',
  'En expansión': '#38bdf8',
};

/**
 * Mapa general interactivo que muestra todas las zonas de cobertura
 * sobre las calles reales de OpenStreetMap (CU04).
 */
export default function MapaCoberturaGeneral({ zonas = [], onSelectZona }) {
  const contenedorRef = useRef(null);
  const mapaRef = useRef(null);
  const grupoRef = useRef(null);
  const onSelectRef = useRef(onSelectZona);

  useEffect(() => {
    onSelectRef.current = onSelectZona;
  }, [onSelectZona]);

  useEffect(() => {
    if (!contenedorRef.current) return undefined;

    const mapa = L.map(contenedorRef.current, {
      center: MAPA.centro,
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer(MAPA.tileUrl, {
      attribution: MAPA.attribution,
      maxZoom: MAPA.maxZoom,
    }).addTo(mapa);

    const grupo = L.featureGroup().addTo(mapa);
    mapaRef.current = mapa;
    grupoRef.current = grupo;

    return () => {
      try {
        mapa.remove();
      } catch {
        /* ignorar */
      }
      mapaRef.current = null;
      grupoRef.current = null;
    };
  }, []);

  useEffect(() => {
    const mapa = mapaRef.current;
    const grupo = grupoRef.current;
    if (!mapa || !grupo) return;

    grupo.clearLayers();

    let capasAgregadas = 0;
    zonas.forEach((z) => {
      if (!esAreaValida(z.area_mapa)) return;
      const color = COLORES_ESTADO[z.estado_cobertura] || '#38bdf8';

      const layer = L.geoJSON(z.area_mapa, {
        style: {
          color,
          weight: 2.5,
          fillColor: color,
          fillOpacity: 0.28,
        },
      });

      const detalle = [
        `<strong>${z.nombre || z.codigo}</strong>`,
        z.barrio ? `Barrio: ${z.barrio}` : null,
        z.sector ? `Sector: ${z.sector}` : null,
        `Tecnología: ${z.tecnologia || 'FTTH'} | Nodos: ${z.capacidad_nodos || 0}`,
        z.estado_cobertura ? `Estado: <strong>${z.estado_cobertura}</strong>` : null,
      ]
        .filter(Boolean)
        .join('<br/>');

      layer.bindPopup(detalle);
      layer.on('dblclick', () => {
        if (onSelectRef.current) onSelectRef.current(z);
      });
      layer.addTo(grupo);
      capasAgregadas += 1;
    });

    if (capasAgregadas > 0) {
      try {
        mapa.fitBounds(grupo.getBounds(), { padding: [30, 30], maxZoom: 14 });
      } catch {
        /* mantener centro */
      }
    }
  }, [zonas]);

  return (
    <div className="cu04-overview-map-card">
      <div className="cu04-overview-map-header">
        <div>
          <strong>Mapa Geográfico de Zonas de Cobertura</strong>
          <span className="text-muted" style={{ marginLeft: '0.6rem', fontSize: '0.8rem' }}>
            Haz clic en cualquier polígono para ver su detalle
          </span>
        </div>
        <div className="cu04-legend">
          <span><i style={{ background: '#22c55e' }} /> Disponible</span>
          <span><i style={{ background: '#f59e0b' }} /> Parcial</span>
          <span><i style={{ background: '#ef4444' }} /> Saturada</span>
          <span><i style={{ background: '#38bdf8' }} /> En expansión</span>
        </div>
      </div>
      <div ref={contenedorRef} className="cu04-overview-map" />
    </div>
  );
}
