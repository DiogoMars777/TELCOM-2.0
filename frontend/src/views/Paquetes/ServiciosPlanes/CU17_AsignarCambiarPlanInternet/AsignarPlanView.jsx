import React from 'react';
import { useAsignacionPlanController } from '../../../../controllers/Paquetes/ServiciosPlanes/CU17_AsignarCambiarPlanInternet/useAsignacionPlanController';
import { hasPermission } from '../../../../config/access.js';
import { ArrowRightLeft, Wifi, AlertCircle, RefreshCw, History, CheckCircle2 } from 'lucide-react';
import ServicioBuscador from './ServicioBuscador.jsx';
import './AsignarPlanView.css';

function nombrePlanDe(asignacion) {
  const p = asignacion?.plan;
  if (!p) return '—';
  return p.nombre_plan ?? p.nombrePlan ?? '—';
}

function precioDe(asignacion) {
  const valor = asignacion?.precio_aplicado
    ?? asignacion?.precioAplicado
    ?? asignacion?.plan?.precio_mensual
    ?? asignacion?.plan?.precioMensual;
  if (valor === null || valor === undefined || valor === '') return null;
  return Number(valor).toFixed(2);
}

// Campos de una asignación ya formateados, compartidos por la tabla (escritorio
// y tablet) y las tarjetas (celular) para no duplicar la presentación.
function camposAsignacion(a) {
  const vigente = !a.fecha_fin && !a.fechaFin;
  const precio = precioDe(a);
  const fin = a.fecha_fin ?? a.fechaFin;

  return {
    vigente,
    plan: (
      <>
        <strong>{nombrePlanDe(a)}</strong>{' '}
        {vigente && (
          <span className="badge badge-success">
            <CheckCircle2 size={12} /> Vigente
          </span>
        )}
      </>
    ),
    precio: precio ? `Bs. ${precio}` : '—',
    inicio: a.fecha_inicio ?? a.fechaInicio ?? '—',
    fin: fin ? fin : <span className="cu17-muted">Vigente</span>,
    usuario: a.usuario?.name || '—',
    motivo: a.motivo_cambio ?? a.motivoCambio ?? '—',
  };
}

export default function AsignarPlanView({ user }) {
  const {
    servicios,
    loadingServicios,
    serviciosError,
    planes,
    loadingPlanes,
    planesError,
    servicioId,
    servicio,
    asignaciones,
    planVigente,
    loadingHistorial,
    historialError,
    showModal,
    form,
    setForm,
    formError,
    saving,
    seleccionarServicio,
    openAsignar,
    closeModal,
    handleAsignar,
  } = useAsignacionPlanController();

  // Solo interfaz: el backend aplica el permiso real (`planes.assign`).
  const puedeAsignar = hasPermission(user, 'planes.assign');

  const actualizarCampo = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }));

  return (
    <div className="view-panel cu17-view">
      <div className="view-header">
        <div>
          <h2>Asignar o Cambiar el Plan de un Servicio</h2>
          <p className="subtitle">
            Historial de planes por servicio: cada cambio cierra la asignación vigente sin borrarla
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={openAsignar}
          disabled={!puedeAsignar || !servicioId}
          title={
            !puedeAsignar
              ? 'No tienes permiso planes.assign'
              : !servicioId
                ? 'Seleccione primero un servicio'
                : undefined
          }
        >
          <ArrowRightLeft size={16} /> Asignar / Cambiar Plan
        </button>
      </div>

      <div className="cu17-selector form-group">
        <ServicioBuscador
          inputId="cu17-servicio-input"
          label="Servicio"
          servicios={servicios}
          loading={loadingServicios}
          value={servicioId}
          onChange={seleccionarServicio}
        />
      </div>

      {serviciosError && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={18} /> No se pudieron cargar los servicios: {serviciosError}
        </div>
      )}

      {!servicioId && (
        <p className="cu17-hint">Seleccione un servicio para ver y gestionar su plan.</p>
      )}

      {servicioId && (
        <>
          {historialError && (
            <div className="alert alert-danger" role="alert">
              <AlertCircle size={18} /> No se pudo cargar el historial de planes: {historialError}
            </div>
          )}

          <div className="card-item cu17-current">
            <div className="card-item-header">
              <span className="badge badge-info">
                <Wifi size={12} /> {servicio?.codigo_servicio || '—'}
              </span>
              {servicio?.estado_servicio && (
                <span className={`badge badge-${servicio.estado_servicio === 'ACTIVO' ? 'success' : 'warning'}`}>
                  {servicio.estado_servicio}
                </span>
              )}
            </div>
            <h3>Plan vigente</h3>
            {loadingHistorial ? (
              <p className="cu17-muted"><RefreshCw size={14} className="spin" /> Cargando…</p>
            ) : planVigente ? (
              <div className="cu17-current-detail">
                <strong>{nombrePlanDe(planVigente)}</strong>
                {precioDe(planVigente) && <span className="cu17-price">Bs. {precioDe(planVigente)}</span>}
                <small>Desde {planVigente.fecha_inicio ?? planVigente.fechaInicio ?? '—'}</small>
              </div>
            ) : (
              <p className="cu17-muted">Este servicio no tiene un plan vigente registrado.</p>
            )}
          </div>

          <div className="cu17-history-title">
            <History size={16} /> Historial de asignaciones
          </div>

          <div className="table-responsive cu17-table-wrap">
            <table className="data-table cu17-table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Precio Aplicado</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Registrado por</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {loadingHistorial && (
                  <tr>
                    <td colSpan={6} className="cu17-empty">
                      <RefreshCw size={16} className="spin" /> Cargando historial…
                    </td>
                  </tr>
                )}
                {!loadingHistorial && asignaciones.length === 0 && (
                  <tr>
                    <td colSpan={6} className="cu17-empty">Sin asignaciones registradas</td>
                  </tr>
                )}
                {!loadingHistorial && asignaciones.map((a) => {
                  const c = camposAsignacion(a);
                  return (
                    <tr key={a.id}>
                      <td>{c.plan}</td>
                      <td>{c.precio}</td>
                      <td>{c.inicio}</td>
                      <td>{c.fin}</td>
                      <td>{c.usuario}</td>
                      <td className="cu17-motivo">{c.motivo}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Celular: cada asignación se muestra como tarjeta legible. */}
          <div className="cu17-cards">
            {loadingHistorial && (
              <p className="cu17-empty">
                <RefreshCw size={16} className="spin" /> Cargando historial…
              </p>
            )}
            {!loadingHistorial && asignaciones.length === 0 && (
              <p className="cu17-empty">Sin asignaciones registradas</p>
            )}
            {!loadingHistorial && asignaciones.map((a) => {
              const c = camposAsignacion(a);
              return (
                <article className="cu17-card" key={a.id}>
                  <dl className="cu17-card-fields">
                    <div className="cu17-card-field">
                      <dt>Plan</dt>
                      <dd>{c.plan}</dd>
                    </div>
                    <div className="cu17-card-field">
                      <dt>Precio aplicado</dt>
                      <dd>{c.precio}</dd>
                    </div>
                    <div className="cu17-card-field">
                      <dt>Inicio</dt>
                      <dd>{c.inicio}</dd>
                    </div>
                    <div className="cu17-card-field">
                      <dt>Fin</dt>
                      <dd>{c.fin}</dd>
                    </div>
                    <div className="cu17-card-field">
                      <dt>Registrado por</dt>
                      <dd>{c.usuario}</dd>
                    </div>
                    <div className="cu17-card-field">
                      <dt>Motivo</dt>
                      <dd>{c.motivo}</dd>
                    </div>
                  </dl>
                </article>
              );
            })}
          </div>
        </>
      )}

      {showModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3>Asignar / Cambiar Plan</h3>
            <p className="cu17-modal-sub">
              Servicio: <strong>{servicio?.codigo_servicio || servicioId}</strong>
            </p>

            {planesError && (
              <div className="alert alert-danger" role="alert">
                <AlertCircle size={18} /> No se pudieron cargar los planes: {planesError}
              </div>
            )}
            {!loadingPlanes && !planesError && planes.length === 0 && (
              <div className="alert alert-warning" role="alert">
                <AlertCircle size={18} /> No hay planes activos disponibles para asignar.
              </div>
            )}

            <form onSubmit={handleAsignar}>
              <div className="form-group">
                <label>Nuevo Plan</label>
                <select
                  required
                  value={form.plan_id}
                  disabled={loadingPlanes || planes.length === 0}
                  onChange={(e) => actualizarCampo('plan_id', e.target.value)}
                >
                  <option value="">
                    {loadingPlanes ? 'Cargando planes…' : 'Seleccione un plan'}
                  </option>
                  {planes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre_plan}
                      {p.velocidad_mbps ? ` — ${p.velocidad_mbps} Mbps` : ''}
                      {p.precio_mensual !== null && p.precio_mensual !== ''
                        ? ` — Bs. ${Number(p.precio_mensual).toFixed(2)}`
                        : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Motivo del cambio <span className="cu17-optional">(opcional)</span></label>
                <textarea
                  rows={3}
                  maxLength={255}
                  placeholder="Ej. Solicitud del cliente / upgrade de velocidad"
                  value={form.motivo_cambio}
                  onChange={(e) => actualizarCampo('motivo_cambio', e.target.value)}
                />
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
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving || !form.plan_id}
                >
                  Confirmar Asignación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
