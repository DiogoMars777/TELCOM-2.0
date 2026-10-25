import React, { useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle2, History, RefreshCw, Router, Unplug } from 'lucide-react';
import { useEquipoReemplazoRetiroController } from '../../../../controllers/Paquetes/EquiposProveedoresInventario/CU20_ReemplazarRetirarEquipo/useEquipoReemplazoRetiroController.js';
import { hasPermission } from '../../../../config/access.js';
import './EquipoReemplazoRetiroView.css';

function nombreEquipo(equipo) {
  return [equipo?.producto?.nombre, equipo?.producto?.modelo].filter(Boolean).join(' / ') || 'Equipo';
}

function etiquetaEquipo(equipo) {
  return `${equipo.producto?.marca || 'Sin marca'} — ${nombreEquipo(equipo)} — Serie: ${equipo.numero_serie || '—'} — IP: ${equipo.ip || '—'}`;
}

function fecha(valor) {
  if (!valor) return '—';
  // Las fechas del contrato son DATE: no convertirlas de zona horaria.
  return valor.slice(0, 10).split('-').reverse().join('/');
}

function camposHistorial(asignacion) {
  return [
    ['Equipo', nombreEquipo(asignacion.equipo)],
    ['Serie', asignacion.equipo?.numero_serie || '—'],
    ['MAC', asignacion.equipo?.mac || '—'],
    ['Fecha asignación', fecha(asignacion.fecha_asignacion)],
    ['Fecha retiro', fecha(asignacion.fecha_retiro)],
    ['Motivo retiro', asignacion.motivo_retiro || '—'],
  ];
}

function EquipoOperacionModal({ titulo, onClose, children }) {
  const dialog = useRef(null);
  useEffect(() => {
    const previousFocus = document.activeElement;
    dialog.current.showModal();
    return () => previousFocus?.focus();
  }, []);

  return (
    <dialog
      ref={dialog}
      className="modal-card cu20-modal"
      aria-labelledby="cu20-modal-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
    >
      <h3 id="cu20-modal-title">{titulo}</h3>
      {children}
    </dialog>
  );
}

export default function EquipoReemplazoRetiroView({ user }) {
  const {
    servicios, loadingServicios, serviciosError, servicioId, servicio,
    informacionEquipo, equipoActual, historial, loadingEquipo, equipoError,
    equiposDisponibles, loadingDisponibles, disponiblesError, resultado,
    showReemplazo, showRetiro, formReemplazo, setFormReemplazo,
    formRetiro, setFormRetiro, formError, saving, puedeOperar,
    seleccionarServicio, loadEquipoServicio, loadEquiposDisponibles,
    openReemplazo, closeReemplazo, handleReemplazar,
    openRetiro, closeRetiro, handleRetirar,
  } = useEquipoReemplazoRetiroController(user);

  const puedeAsignar = hasPermission(user, 'equipos.assign');
  const equipoNuevoValido = equiposDisponibles.some((equipo) => (
    String(equipo.id) === formReemplazo.equipo_nuevo_id && equipo.id !== equipoActual?.id
  ));
  const camposEquipo = equipoActual ? [
    ['Producto / modelo', nombreEquipo(equipoActual)],
    ['Marca', equipoActual.producto?.marca || '—'],
    ['Número de serie', equipoActual.numero_serie || '—'],
    ['MAC', equipoActual.mac || '—'],
    ['IP', equipoActual.ip || '—'],
    ['Propiedad', equipoActual.propiedad?.replaceAll('_', ' ') || '—'],
    ['Estado', equipoActual.estado?.replaceAll('_', ' ') || '—'],
  ] : [];

  return (
    <div className="view-panel cu20-view">
      <div className="view-header">
        <div>
          <h2>Reemplazar o Retirar Equipo</h2>
          <p className="subtitle">Gestión de equipos en comodato e historial por servicio</p>
        </div>
      </div>

      <div className="form-group cu20-selector">
        <label htmlFor="cu20-servicio">Servicio</label>
        <select
          id="cu20-servicio"
          value={servicioId}
          onChange={(event) => seleccionarServicio(event.target.value)}
          disabled={loadingServicios || Boolean(serviciosError) || saving}
        >
          <option value="">{loadingServicios ? 'Cargando servicios…' : 'Seleccione un servicio'}</option>
          {servicios.map((item) => (
            <option key={item.id} value={item.id}>
              {item.codigo_servicio || `Servicio ${item.id}`}
              {item.cliente_nombre ? ` — ${item.cliente_nombre}` : ''}
            </option>
          ))}
        </select>
      </div>

      {serviciosError && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={18} /> No se pudieron cargar los servicios: {serviciosError}
        </div>
      )}
      {!loadingServicios && !serviciosError && servicios.length === 0 && (
        <p className="cu20-muted">No hay servicios registrados.</p>
      )}
      {!servicioId && servicios.length > 0 && (
        <p className="cu20-muted">Seleccione un servicio para consultar su equipo e historial.</p>
      )}

      {resultado && (
        <div className="alert alert-success" role="status"><CheckCircle2 size={18} /> {resultado}</div>
      )}

      {servicioId && (
        <>
          {equipoError && (
            <div className="alert alert-danger cu20-feedback" role="alert">
              <AlertCircle size={18} />
              <span>No se pudo actualizar el equipo ni el historial: {equipoError}</span>
              <button className="btn btn-secondary btn-sm" onClick={() => loadEquipoServicio()} disabled={saving}>
                Reintentar
              </button>
            </div>
          )}

          <section className="card-item cu20-current" aria-labelledby="cu20-current-title" aria-busy={loadingEquipo}>
            <div className="card-item-header">
              <h3 id="cu20-current-title"><Router size={18} /> Equipo actualmente asignado</h3>
              <span className="badge badge-info">{servicio?.codigo_servicio || servicioId}</span>
            </div>
            {loadingEquipo && (
              <p className="cu20-muted" role="status"><RefreshCw size={16} className="spin" /> Cargando equipo e historial…</p>
            )}
            {!loadingEquipo && informacionEquipo && (
              equipoActual ? (
                <dl className="cu20-fields cu20-equipo-fields">
                  {camposEquipo.map(([label, value]) => (
                    <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
                  ))}
                </dl>
              ) : <p className="cu20-muted">No existe un equipo actualmente asignado a este servicio.</p>
            )}
            {puedeAsignar && (
              <div className="cu20-actions">
                <button className="btn btn-primary" onClick={openReemplazo} disabled={!puedeOperar}>
                  <RefreshCw size={16} /> Reemplazar equipo
                </button>
                <button className="btn btn-danger" onClick={openRetiro} disabled={!puedeOperar}>
                  <Unplug size={16} /> Retirar equipo
                </button>
              </div>
            )}
          </section>

          <section aria-labelledby="cu20-history-title" aria-busy={loadingEquipo}>
            <h3 id="cu20-history-title" className="cu20-history-title"><History size={18} /> Historial de equipos</h3>
            {!loadingEquipo && informacionEquipo && (
              historial.length === 0 ? (
                <p className="cu20-muted">Sin reemplazos o retiros registrados.</p>
              ) : (
                <>
                  <div className="table-responsive cu20-table-wrap">
                    <table className="data-table cu20-table">
                      <thead><tr>{camposHistorial(historial[0]).map(([label]) => <th key={label} scope="col">{label}</th>)}</tr></thead>
                      <tbody>
                        {historial.map((item) => (
                          <tr key={item.id}>
                            {camposHistorial(item).map(([label, value]) => <td key={label}>{value}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="cu20-history-cards">
                    {historial.map((item) => (
                      <article className="card-item" key={item.id}>
                        <dl className="cu20-fields">
                          {camposHistorial(item).map(([label, value]) => (
                            <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
                          ))}
                        </dl>
                      </article>
                    ))}
                  </div>
                </>
              )
            )}
          </section>
        </>
      )}

      {disponiblesError && !showReemplazo && (
        <div className="alert alert-warning cu20-feedback" role="alert">
          <AlertCircle size={18} /> <span>No se pudieron actualizar los equipos disponibles: {disponiblesError}</span>
          <button className="btn btn-secondary btn-sm" onClick={loadEquiposDisponibles} disabled={saving}>Reintentar</button>
        </div>
      )}

      {showReemplazo && (
        <EquipoOperacionModal titulo="Reemplazar equipo" onClose={closeReemplazo}>
          <p className="cu20-muted">Equipo actual: <strong>{nombreEquipo(equipoActual)}</strong> · Serie: {equipoActual?.numero_serie || '—'}</p>
          <p className="alert alert-warning">El equipo anterior pasará al historial con la fecha y el motivo del reemplazo.</p>
          {disponiblesError && (
            <div className="alert alert-danger cu20-feedback" role="alert">
              <span>No se pudieron cargar los equipos disponibles: {disponiblesError}</span>
              <button className="btn btn-secondary btn-sm" onClick={loadEquiposDisponibles} disabled={saving}>Reintentar</button>
            </div>
          )}
          {!loadingDisponibles && !disponiblesError && equiposDisponibles.length === 0 && (
            <p className="alert alert-warning" role="status">No hay equipos disponibles para reemplazar.</p>
          )}
          <form onSubmit={handleReemplazar}>
            <fieldset disabled={saving}>
              <div className="form-group">
                <label htmlFor="cu20-nuevo-equipo">Nuevo equipo</label>
                <select
                  id="cu20-nuevo-equipo"
                  required
                  value={formReemplazo.equipo_nuevo_id}
                  disabled={loadingDisponibles || Boolean(disponiblesError) || equiposDisponibles.length === 0}
                  onChange={(event) => setFormReemplazo((prev) => ({ ...prev, equipo_nuevo_id: event.target.value }))}
                >
                  <option value="">{loadingDisponibles ? 'Cargando equipos…' : 'Seleccione un equipo disponible'}</option>
                  {equiposDisponibles.map((equipo) => <option key={equipo.id} value={equipo.id}>{etiquetaEquipo(equipo)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="cu20-motivo-reemplazo">Motivo</label>
                <textarea
                  id="cu20-motivo-reemplazo" rows={4} required maxLength={1000}
                  value={formReemplazo.motivo}
                  onChange={(event) => setFormReemplazo((prev) => ({ ...prev, motivo: event.target.value }))}
                />
              </div>
            </fieldset>
            {formError && <div className="alert alert-danger" role="alert"><AlertCircle size={18} /> {formError}</div>}
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={closeReemplazo} disabled={saving}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={saving || loadingDisponibles || Boolean(disponiblesError) || !equipoNuevoValido || !formReemplazo.motivo.trim()}>
                {saving ? 'Guardando…' : 'Confirmar reemplazo'}
              </button>
            </div>
          </form>
        </EquipoOperacionModal>
      )}

      {showRetiro && (
        <EquipoOperacionModal titulo="Retirar equipo" onClose={closeRetiro}>
          <p className="cu20-muted">Equipo actual: <strong>{nombreEquipo(equipoActual)}</strong> · Serie: {equipoActual?.numero_serie || '—'}</p>
          <p className="alert alert-warning">El equipo dejará de estar asignado al servicio y la operación se conservará en el historial.</p>
          <form onSubmit={handleRetirar}>
            <fieldset disabled={saving}>
              <div className="form-group">
                <label htmlFor="cu20-motivo-retiro">Motivo</label>
                <textarea
                  id="cu20-motivo-retiro" rows={4} required maxLength={1000}
                  value={formRetiro.motivo}
                  onChange={(event) => setFormRetiro({ motivo: event.target.value })}
                />
              </div>
            </fieldset>
            {formError && <div className="alert alert-danger" role="alert"><AlertCircle size={18} /> {formError}</div>}
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={closeRetiro} disabled={saving}>Cancelar</button>
              <button type="submit" className="btn btn-danger" disabled={saving || !formRetiro.motivo.trim()}>
                {saving ? 'Guardando…' : 'Confirmar retiro'}
              </button>
            </div>
          </form>
        </EquipoOperacionModal>
      )}
    </div>
  );
}
