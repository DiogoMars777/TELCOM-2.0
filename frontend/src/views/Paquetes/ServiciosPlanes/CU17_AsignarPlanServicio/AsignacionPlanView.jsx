import React from 'react';
import { useAsignacionPlanController } from '../../../../controllers/Paquetes/ServiciosPlanes/CU17_AsignarPlanServicio/useAsignacionPlanController';
import { hasPermission } from '../../../../config/access.js';
import {
  Search, AlertCircle, RefreshCw, CheckCircle2, Wifi, History, X, ArrowRight,
} from 'lucide-react';
import './AsignacionPlanView.css';

const BADGE_ESTADO = {
  ACTIVO: 'badge-success',
  PENDIENTE_INSTALACION: 'badge-warning',
  SUSPENDIDO: 'badge-warning',
  CORTADO: 'badge-danger',
};

function soloFecha(valor) {
  if (!valor) return '—';
  return String(valor).slice(0, 10);
}

export default function AsignacionPlanView({ user }) {
  const {
    servicios,
    loadingServicios,
    errorServicios,
    busqueda,
    setBusqueda,
    selectedServicio,
    planesActivos,
    historial,
    loadingDetalle,
    errorDetalle,
    form,
    setForm,
    submitting,
    formError,
    aviso,
    setAviso,
    seleccionarServicio,
    cerrarDetalle,
    handleAsignar,
  } = useAsignacionPlanController();

  // El backend exige `planes.assign`; aquí solo se oculta el formulario.
  const puedeAsignar = hasPermission(user, 'planes.assign');

  return (
    <div className="view-panel cu17-view">
      <div className="view-header">
        <div>
          <h2>Asignar Plan a un Servicio</h2>
          <p className="subtitle">Consulta el plan vigente, asígnalo o cámbialo y revisa todo el historial</p>
        </div>
      </div>

      {errorServicios && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={18} /> No se pudieron buscar servicios: {errorServicios}
        </div>
      )}

      {aviso && (
        <div className="alert alert-success" role="status">
          <CheckCircle2 size={18} /> {aviso}
          <button type="button" className="cu17-alert-close" onClick={() => setAviso(null)} aria-label="Cerrar aviso">×</button>
        </div>
      )}

      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por código de servicio, cliente o plan..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar servicios"
          />
        </div>
      </div>

      <div className="cu17-layout">
        {/* Lista de servicios */}
        <section className="cu17-list" aria-label="Servicios">
          {loadingServicios && (
            <p className="cu17-status"><RefreshCw size={16} className="spin" /> Cargando servicios…</p>
          )}
          {!loadingServicios && servicios.length === 0 && (
            <p className="cu17-status">Sin servicios que coincidan</p>
          )}
          {servicios.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`cu17-servicio ${selectedServicio?.id === s.id ? 'is-selected' : ''}`}
              onClick={() => seleccionarServicio(s)}
              aria-pressed={selectedServicio?.id === s.id}
            >
              <span className="cu17-servicio-top">
                <strong>{s.codigo_servicio}</strong>
                <span className={`badge ${BADGE_ESTADO[s.estado_servicio] || 'badge-info'}`}>
                  {s.estado_servicio}
                </span>
              </span>
              <span className="cu17-servicio-cliente">{s.cliente_nombre || '—'}</span>
              <span className="cu17-servicio-plan">
                <Wifi size={13} /> {s.plan_nombre} · {s.velocidad_mbps} Mbps · Bs. {s.precio_mensual}
              </span>
            </button>
          ))}
        </section>

        {/* Detalle del servicio seleccionado */}
        <section className="cu17-detail" aria-label="Detalle del servicio">
          {!selectedServicio ? (
            <div className="cu17-empty">
              <Wifi size={22} />
              <p>Selecciona un servicio para ver y gestionar su plan de Internet.</p>
            </div>
          ) : (
            <>
              <div className="cu17-detail-header">
                <div>
                  <h3>{selectedServicio.codigo_servicio}</h3>
                  <p className="subtitle">
                    {selectedServicio.cliente?.nombres
                      ? `${selectedServicio.cliente.nombres} ${selectedServicio.cliente.apellidos ?? ''}`.trim()
                      : selectedServicio.cliente_nombre || '—'}
                  </p>
                </div>
                <button type="button" className="btn btn-sm btn-secondary" onClick={cerrarDetalle}>
                  <X size={14} /> Cerrar
                </button>
              </div>

              <div className="cu17-resumen">
                <div>
                  <span className="cu17-label">Plan actual</span>
                  <strong>{selectedServicio.plan_nombre}</strong>
                </div>
                <div>
                  <span className="cu17-label">Velocidad</span>
                  <strong>{selectedServicio.velocidad_mbps} Mbps</strong>
                </div>
                <div>
                  <span className="cu17-label">Precio aplicado</span>
                  <strong>Bs. {selectedServicio.precio_mensual}</strong>
                </div>
                <div>
                  <span className="cu17-label">Estado</span>
                  <strong>{selectedServicio.estado_servicio}</strong>
                </div>
              </div>

              {errorDetalle && (
                <div className="alert alert-danger" role="alert">
                  <AlertCircle size={18} /> {errorDetalle}
                </div>
              )}

              {puedeAsignar ? (
                <form className="cu17-form" onSubmit={handleAsignar}>
                  <h4>Asignar / cambiar plan</h4>
                  <div className="form-group">
                    <label htmlFor="cu17-plan">Nuevo plan (solo activos)</label>
                    <select
                      id="cu17-plan"
                      required
                      value={form.plan_id}
                      onChange={(e) => setForm({ ...form, plan_id: e.target.value })}
                    >
                      <option value="">Seleccione un plan activo</option>
                      {planesActivos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre_plan} — {p.velocidad_mbps} Mbps — Bs. {p.precio_mensual}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="cu17-motivo">Motivo del cambio (opcional)</label>
                    <input
                      id="cu17-motivo"
                      type="text"
                      maxLength={255}
                      placeholder="Ej.: solicitud del cliente, upgrade, corrección de plan..."
                      value={form.motivo_cambio}
                      onChange={(e) => setForm({ ...form, motivo_cambio: e.target.value })}
                    />
                  </div>
                  {formError && (
                    <div className="alert alert-danger" role="alert">
                      <AlertCircle size={18} /> {formError}
                    </div>
                  )}
                  <div className="cu17-form-actions">
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting ? 'Asignando…' : (<><ArrowRight size={16} /> Confirmar asignación</>)}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="alert alert-warning" role="status">
                  <AlertCircle size={18} /> No tienes permiso para asignar planes (planes.assign). Puedes consultar el historial.
                </div>
              )}

              <div className="cu17-historial">
                <h4><History size={16} /> Historial de planes</h4>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Plan</th>
                        <th>Velocidad</th>
                        <th>Precio aplicado</th>
                        <th>Inicio</th>
                        <th>Fin</th>
                        <th>Motivo</th>
                        <th>Registrado por</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingDetalle && (
                        <tr>
                          <td colSpan={7} className="cu17-status">
                            <RefreshCw size={16} className="spin" /> Cargando historial…
                          </td>
                        </tr>
                      )}
                      {!loadingDetalle && historial.length === 0 && (
                        <tr>
                          <td colSpan={7} className="cu17-status">Sin historial registrado</td>
                        </tr>
                      )}
                      {!loadingDetalle && historial.map((a) => (
                        <tr key={a.id} className={a.fecha_fin === null ? 'cu17-vigente' : ''}>
                          <td data-label="Plan"><strong>{a.plan?.nombre_plan || `Plan #${a.plan_id}`}</strong></td>
                          <td data-label="Velocidad">{a.plan?.velocidad_mbps ?? '—'} Mbps</td>
                          <td data-label="Precio aplicado">Bs. {a.precio_aplicado}</td>
                          <td data-label="Inicio">{soloFecha(a.fecha_inicio)}</td>
                          <td data-label="Fin">{a.fecha_fin ? soloFecha(a.fecha_fin) : <span className="badge badge-success">VIGENTE</span>}</td>
                          <td data-label="Motivo" className="cu17-motivo">{a.motivo_cambio || '—'}</td>
                          <td data-label="Registrado por">{a.usuario?.name || 'Sistema / migración'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
