import React from 'react';
import { useZonaCoberturaController } from '../../../../controllers/Paquetes/GestionClientesZonas/CU04_ZonasCobertura/useZonaCoberturaController';
import { hasPermission } from '../../../../config/access.js';
import { ESTADOS_COBERTURA, areaToSvgPoints, contarVertices } from '../../../../models/Paquetes/GestionClientesZonas/CU04_ZonasCobertura/geoArea.js';
import { MapPin, Plus, Radio, Cpu, AlertCircle, RefreshCw, Pencil, Shapes } from 'lucide-react';
import './ZonasCoberturaView.css';

// El mapa (Leaflet + Geoman) se carga solo cuando se abre el modal, para no
// aumentar el peso inicial de la aplicación.
const MapaArea = React.lazy(() => import('./MapaArea.jsx'));

// Clase de badge según el estado de cobertura (colores TELCOM).
const BADGE_ESTADO = {
  'Disponible': 'badge-success',
  'Parcial': 'badge-warning',
  'Saturada': 'badge-danger',
  'En expansión': 'badge-primary',
};

/** Vista previa del área dibujada (SVG, sin cargar mapas ni teselas). */
function AreaPreview({ area }) {
  const puntos = areaToSvgPoints(area, 200, 110, 8);
  if (!puntos) return null;

  return (
    <svg
      className="cu04-area-preview"
      viewBox="0 0 200 110"
      role="img"
      aria-label="Vista previa del área de cobertura"
    >
      <polygon points={puntos} />
    </svg>
  );
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
            {z.barrio && <p className="cu04-barrio">Barrio / sector: <strong>{z.barrio}</strong></p>}

            {z.area_mapa && <AreaPreview area={z.area_mapa} />}

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
                  <label>Barrio o sector <span className="cu04-optional">(opcional)</span></label>
                  <input
                    type="text"
                    maxLength={150}
                    placeholder="Ej. Villa Fátima"
                    value={newZona.barrio}
                    onChange={(e) => actualizarCampo('barrio', e.target.value)}
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
