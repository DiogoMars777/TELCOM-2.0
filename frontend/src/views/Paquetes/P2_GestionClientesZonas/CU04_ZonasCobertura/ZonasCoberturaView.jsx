import React from 'react';
import { useZonaCoberturaController } from '../../../../controllers/Paquetes/P2_GestionClientesZonas/CU04_ZonasCobertura/useZonaCoberturaController';
import { hasPermission } from '../../../../config/access.js';
import { ESTADOS_COBERTURA, areaToSvgPointList, centroideDeArea, contarVertices } from '../../../../models/Paquetes/P2_GestionClientesZonas/CU04_ZonasCobertura/geoArea.js';
import { MapPin, Plus, Radio, Cpu, AlertCircle, RefreshCw, Pencil, Shapes } from 'lucide-react';
import './ZonasCoberturaView.css';

// El mapa (Leaflet + Geoman) se carga solo cuando se abre el modal, para no
// aumentar el peso inicial de la aplicación.
const MapaArea = React.lazy(() => import('./MapaArea.jsx'));
const MapaCoberturaGeneral = React.lazy(() => import('./MapaCoberturaGeneral.jsx'));

// Clase de badge según el estado de cobertura (colores TELCOM).
const BADGE_ESTADO = {
  'Disponible': 'badge-success',
  'Parcial': 'badge-warning',
  'Saturada': 'badge-danger',
  'En expansión': 'badge-primary',
};

const COLOR_ESTADO = {
  'Disponible': '#22c55e',
  'Parcial': '#f59e0b',
  'Saturada': '#ef4444',
  'En expansión': '#38bdf8',
};

/** Vista previa cartográfica del área dibujada (SVG sin teselas externas). */
function AreaPreview({ id, area, estado, onClick }) {
  const pointList = areaToSvgPointList(area, 240, 120, 20);
  if (!pointList.length) return null;

  const puntos = pointList.map((p) => `${p.x},${p.y}`).join(' ');
  const verticesUnicos = pointList.slice(0, -1);
  const centroSvg = verticesUnicos.length
    ? {
        x: verticesUnicos.reduce((acc, p) => acc + p.x, 0) / verticesUnicos.length,
        y: verticesUnicos.reduce((acc, p) => acc + p.y, 0) / verticesUnicos.length,
      }
    : { x: 120, y: 60 };

  const color = COLOR_ESTADO[estado] || '#38bdf8';
  const centroide = centroideDeArea(area);
  const patternId = `cu04-grid-${id}`;
  const gradId = `cu04-grad-${id}`;

  const contenido = (
    <>
      <svg
        className="cu04-area-preview"
        viewBox="0 0 240 120"
        role="img"
        aria-label="Vista previa del área de cobertura"
      >
        <defs>
          <pattern id={patternId} width="16" height="16" patternUnits="userSpaceOnUse">
            <path
              d="M 16 0 L 0 0 0 16"
              fill="none"
              stroke="rgba(148, 163, 184, 0.12)"
              strokeWidth="0.7"
            />
          </pattern>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.34" />
            <stop offset="100%" stopColor={color} stopOpacity="0.12" />
          </linearGradient>
        </defs>

        <rect width="240" height="120" fill={`url(#${patternId})`} />
        <line x1="0" y1="60" x2="240" y2="60" stroke="rgba(148, 163, 184, 0.14)" strokeWidth="0.8" strokeDasharray="3 3" />
        <line x1="120" y1="0" x2="120" y2="120" stroke="rgba(148, 163, 184, 0.14)" strokeWidth="0.8" strokeDasharray="3 3" />

        <polygon
          points={puntos}
          fill={`url(#${gradId})`}
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {verticesUnicos.map((p, idx) => (
          <circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r="2.8"
            fill="#0f172a"
            stroke={color}
            strokeWidth="1.6"
          />
        ))}

        <circle cx={centroSvg.x} cy={centroSvg.y} r="7" fill={color} fillOpacity="0.18" />
        <circle cx={centroSvg.x} cy={centroSvg.y} r="3" fill={color} />
      </svg>

      <span className="cu04-area-badge-top">
        {verticesUnicos.length} vértices
      </span>

      {centroide && (
        <span className="cu04-area-coords">
          {centroide.lat.toFixed(4)}, {centroide.lng.toFixed(4)}
        </span>
      )}

      {onClick && (
        <span className="cu04-area-edit-hint">
          <Pencil size={11} /> Ver en mapa
        </span>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className="cu04-area-preview-wrap is-interactive"
        onClick={onClick}
        title="Abrir mapa para ver o editar el polígono"
      >
        {contenido}
      </button>
    );
  }

  return <div className="cu04-area-preview-wrap">{contenido}</div>;
}

export default function ZonasCoberturaView({ user }) {
  const {
    zonas,
    loading,
    error,
    formError,
    showModal,
    newZona,
    setNewZona,
    handleCreate,
    editingId,
    openCreate,
    openEdit,
    closeModal,
  } = useZonaCoberturaController();

  const puedeGestionar = hasPermission(user, 'zonas.manage');

  const actualizarCampo = (campo, valor) => {
    setNewZona((prev) => ({ ...prev, [campo]: valor }));
  };

  return (
    <div className="view-panel cu04-view">
      <div className="view-header">
        <div>
          <h2>Gestionar Zonas de Cobertura</h2>
          <p className="subtitle">Mapeo de infraestructura de fibra y nodos para telecomunicaciones</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={openCreate}
          disabled={!puedeGestionar}
          title={puedeGestionar ? undefined : 'No tienes permiso zonas.manage'}
        >
          <Plus size={16} /> Nueva Zona
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={18} /> No se pudieron cargar las zonas de cobertura: {error}
        </div>
      )}

      {loading && (
        <p className="text-muted" style={{ padding: '0.5rem 0' }}>
          <RefreshCw size={16} className="spin" /> Cargando zonas…
        </p>
      )}

      {!loading && zonas.length === 0 && (
        <p className="text-muted" style={{ padding: '0.5rem 0' }}>Sin registros</p>
      )}

      {!loading && zonas.length > 0 && (
        <React.Suspense fallback={<p className="text-muted">Cargando mapa general de cobertura…</p>}>
          <MapaCoberturaGeneral zonas={zonas} onSelectZona={puedeGestionar ? openEdit : undefined} />
        </React.Suspense>
      )}

      <div className="grid-cards">
        {zonas.map((z) => (
          <div key={z.id} className="card-item">
            <div className="card-item-header">
              <span className="badge badge-info">{z.codigo}</span>
              <span className={`badge badge-${z.activo ? 'success' : 'danger'}`}>
                {z.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            <h3>{z.nombre}</h3>

            <div className="cu04-card-badges">
              {z.estado_cobertura ? (
                <span className={`badge ${BADGE_ESTADO[z.estado_cobertura] || 'badge-info'}`}>
                  {z.estado_cobertura}
                </span>
              ) : (
                <span className="badge badge-warning" title="Registro antiguo sin estado de cobertura">
                  Estado sin definir
                </span>
              )}
            </div>

            <p className="location-text"><MapPin size={14} /> {z.ciudad}</p>
            {z.barrio && <p className="cu04-barrio">Barrio: <strong>{z.barrio}</strong></p>}
            {z.sector && <p className="cu04-barrio">Sector: <strong>{z.sector}</strong></p>}

            {z.area_mapa && (
              <AreaPreview
                id={z.id}
                area={z.area_mapa}
                estado={z.estado_cobertura}
                onClick={puedeGestionar ? () => openEdit(z) : undefined}
              />
            )}

            <div className="tech-info">
              <div><Radio size={14} /> Tecnología: <strong>{z.tecnologia}</strong></div>
              <div><Cpu size={14} /> Capacidad de nodos: <strong>{z.capacidad_nodos}</strong></div>
              {z.area_mapa && (
                <div><Shapes size={14} /> Área de cobertura: <strong>dibujada ({contarVertices(z.area_mapa)} puntos)</strong></div>
              )}
            </div>

            {puedeGestionar && (
              <div className="cu04-card-actions">
                <button className="btn btn-secondary" onClick={() => openEdit(z)}>
                  <Pencil size={14} /> Editar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card cu04-modal">
            <h3>{editingId ? 'Editar Zona de Cobertura' : 'Registrar Zona de Cobertura'}</h3>
            <form onSubmit={handleCreate}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Código de Zona</label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    placeholder="Ej. ZON-ESTE"
                    value={newZona.codigo}
                    onChange={(e) => actualizarCampo('codigo', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Nombre de Zona</label>
                  <input
                    type="text"
                    required
                    maxLength={150}
                    placeholder="Ej. Anillo Este - Radial 10"
                    value={newZona.nombre}
                    onChange={(e) => actualizarCampo('nombre', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Ciudad</label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={newZona.ciudad}
                    onChange={(e) => actualizarCampo('ciudad', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Barrio <span className="cu04-optional">(opcional)</span></label>
                  <input
                    type="text"
                    maxLength={150}
                    placeholder="Ej. Equipetrol"
                    value={newZona.barrio}
                    onChange={(e) => actualizarCampo('barrio', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Sector <span className="cu04-optional">(opcional)</span></label>
                  <input
                    type="text"
                    maxLength={150}
                    placeholder="Ej. Sector Empresarial Norte"
                    value={newZona.sector}
                    onChange={(e) => actualizarCampo('sector', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Tecnología</label>
                  <select
                    value={newZona.tecnologia}
                    onChange={(e) => actualizarCampo('tecnologia', e.target.value)}
                  >
                    <option value="FTTH GPON">FTTH GPON (Fibra Óptica)</option>
                    <option value="HFC">HFC (Coaxial)</option>
                    <option value="Radioenlace 5GHz">Radioenlace 5GHz / Microondas</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Estado de cobertura</label>
                  <select
                    required
                    value={newZona.estado_cobertura}
                    onChange={(e) => actualizarCampo('estado_cobertura', e.target.value)}
                  >
                    <option value="" disabled>Seleccionar estado…</option>
                    {ESTADOS_COBERTURA.map((estado) => (
                      <option key={estado} value={estado}>{estado}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Capacidad de Nodos</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newZona.capacidad_nodos}
                    onChange={(e) => actualizarCampo('capacidad_nodos', parseInt(e.target.value, 10) || 0)}
                  />
                </div>

                <div className="form-group full-width cu04-map-group">
                  <label>Área de cobertura</label>
                  <React.Suspense fallback={<div className="cu04-map-fallback">Cargando mapa…</div>}>
                    <MapaArea
                      value={newZona.area_mapa}
                      onChange={(area) => actualizarCampo('area_mapa', area)}
                    />
                  </React.Suspense>
                  <small className="text-muted cu04-map-note">
                    Dibuja el polígono con el mouse o con el dedo. El área se guarda como GeoJSON y
                    se vuelve a mostrar al editar la zona.
                  </small>
                </div>
              </div>

              {formError && (
                <div className="alert alert-danger" role="alert">
                  <AlertCircle size={18} /> {formError}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {editingId ? 'Guardar Cambios' : 'Guardar Zona'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
