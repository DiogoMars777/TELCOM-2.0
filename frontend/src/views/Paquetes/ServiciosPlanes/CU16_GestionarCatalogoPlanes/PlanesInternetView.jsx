import React from 'react';
import { usePlanInternetController } from '../../../../controllers/Paquetes/ServiciosPlanes/CU16_GestionarCatalogoPlanes/usePlanInternetController';
import { hasPermission } from '../../../../config/access.js';
import { Router, Plus, Pencil, Power, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import './PlanesInternetView.css';

export default function PlanesInternetView({ user }) {
  const {
    planes,
    loading,
    error,
    formError,
    showModal,
    formPlan,
    setFormPlan,
    handleSubmit,
    editingId,
    openCreate,
    openEdit,
    closeModal,
    cambiarEstado,
    savingId,
  } = usePlanInternetController();

  // Solo interfaz: el backend aplica el permiso real (`planes.assign`).
  const puedeGestionar = hasPermission(user, 'planes.assign');

  const actualizarCampo = (campo, valor) => {
    setFormPlan((prev) => ({ ...prev, [campo]: valor }));
  };

  // Botones de fila/tarjeta: misma lógica para la tabla (escritorio/tablet) y
  // las tarjetas (celular), sin duplicar el comportamiento.
  const renderAcciones = (p) => (
    puedeGestionar ? (
      <div className="cu16-actions">
        <button className="btn btn-sm btn-secondary" onClick={() => openEdit(p)}>
          <Pencil size={14} /> Editar
        </button>
        {p.activo ? (
          <button
            className="btn btn-sm btn-danger"
            disabled={savingId === p.id}
            onClick={() => cambiarEstado(p, false)}
            title="Desactivar el plan (no se borra)"
          >
            <Power size={14} /> Desactivar
          </button>
        ) : (
          <button
            className="btn btn-sm btn-success"
            disabled={savingId === p.id}
            onClick={() => cambiarEstado(p, true)}
            title="Reactivar el plan"
          >
            <CheckCircle2 size={14} /> Activar
          </button>
        )}
      </div>
    ) : (
      <span className="cu16-muted">Solo lectura</span>
    )
  );

  return (
    <div className="view-panel cu16-view">
      <div className="view-header">
        <div>
          <h2>Gestionar Planes de Internet</h2>
          <p className="subtitle">
            Catálogo de planes de fibra: velocidad, tarifa mensual y disponibilidad
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={openCreate}
          disabled={!puedeGestionar}
          title={puedeGestionar ? undefined : 'No tienes permiso planes.assign'}
        >
          <Plus size={16} /> Nuevo Plan
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={18} /> No se pudo cargar el catálogo de planes: {error}
        </div>
      )}

      <div className="table-responsive cu16-table-wrap">
        <table className="data-table cu16-table">
          <thead>
            <tr>
              <th>Plan</th>
              <th>Velocidad</th>
              <th>Precio Mensual</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="cu16-empty">
                  <RefreshCw size={16} className="spin" /> Cargando planes…
                </td>
              </tr>
            )}
            {!loading && planes.length === 0 && (
              <tr>
                <td colSpan={6} className="cu16-empty">Sin registros</td>
              </tr>
            )}
            {!loading && planes.map((p) => (
              <tr key={p.id}>
                <td>
                  <span className="cu16-plan-name">
                    <Router size={15} /> <strong>{p.nombre_plan || '—'}</strong>
                  </span>
                </td>
                <td>
                  {p.velocidad_mbps ? (
                    <span className="badge badge-info">{p.velocidad_mbps} Mbps</span>
                  ) : (
                    <span className="cu16-muted">—</span>
                  )}
                </td>
                <td>
                  {p.precio_mensual !== null && p.precio_mensual !== '' ? (
                    <strong>Bs. {Number(p.precio_mensual).toFixed(2)}</strong>
                  ) : (
                    <span className="cu16-muted">—</span>
                  )}
                </td>
                <td className="cu16-desc">{p.descripcion || <span className="cu16-muted">—</span>}</td>
                <td>
                  <span className={`badge badge-${p.activo ? 'success' : 'danger'}`}>
                    {p.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  {renderAcciones(p)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Celular: los planes se muestran como tarjetas legibles (la tabla se
          oculta por CSS en pantallas pequeñas). */}
      <div className="cu16-cards">
        {loading && (
          <p className="cu16-empty">
            <RefreshCw size={16} className="spin" /> Cargando planes…
          </p>
        )}
        {!loading && planes.length === 0 && (
          <p className="cu16-empty">Sin registros</p>
        )}
        {!loading && planes.map((p) => (
          <article className="cu16-card" key={p.id}>
            <dl className="cu16-card-fields">
              <div className="cu16-card-field">
                <dt>Plan</dt>
                <dd>
                  <span className="cu16-plan-name">
                    <Router size={15} /> <strong>{p.nombre_plan || '—'}</strong>
                  </span>
                </dd>
              </div>
              <div className="cu16-card-field">
                <dt>Velocidad</dt>
                <dd>
                  {p.velocidad_mbps
                    ? <span className="badge badge-info">{p.velocidad_mbps} Mbps</span>
                    : <span className="cu16-muted">—</span>}
                </dd>
              </div>
              <div className="cu16-card-field">
                <dt>Precio mensual</dt>
                <dd>
                  {p.precio_mensual !== null && p.precio_mensual !== ''
                    ? <strong>Bs. {Number(p.precio_mensual).toFixed(2)}</strong>
                    : <span className="cu16-muted">—</span>}
                </dd>
              </div>
              <div className="cu16-card-field">
                <dt>Descripción</dt>
                <dd>{p.descripcion || <span className="cu16-muted">—</span>}</dd>
              </div>
              <div className="cu16-card-field">
                <dt>Estado</dt>
                <dd>
                  <span className={`badge badge-${p.activo ? 'success' : 'danger'}`}>
                    {p.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </dd>
              </div>
            </dl>
            <div className="cu16-card-actions">{renderAcciones(p)}</div>
          </article>
        ))}
      </div>

      {showModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3>{editingId ? 'Editar Plan de Internet' : 'Registrar Plan de Internet'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre del Plan</label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  placeholder="Ej. Plan Hogar Plus 50 Mbps"
                  value={formPlan.nombre_plan}
                  onChange={(e) => actualizarCampo('nombre_plan', e.target.value)}
                />
              </div>

              <div className="cu16-form-row">
                <div className="form-group">
                  <label>Velocidad (Mbps)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formPlan.velocidad_mbps}
                    onChange={(e) => actualizarCampo('velocidad_mbps', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Precio Mensual (Bs.)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step="0.01"
                    value={formPlan.precio_mensual}
                    onChange={(e) => actualizarCampo('precio_mensual', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  rows={3}
                  maxLength={1000}
                  placeholder="Detalle o beneficios del plan (opcional)"
                  value={formPlan.descripcion}
                  onChange={(e) => actualizarCampo('descripcion', e.target.value)}
                />
              </div>

              <div className="form-group cu16-check">
                <label>
                  <input
                    type="checkbox"
                    checked={formPlan.activo}
                    onChange={(e) => actualizarCampo('activo', e.target.checked)}
                  />
                  <span>Plan activo (puede asignarse a servicios)</span>
                </label>
              </div>

              {formError && (
                <div className="alert alert-danger" role="alert">
                  <AlertCircle size={18} /> {formError}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {editingId ? 'Guardar Cambios' : 'Guardar Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
