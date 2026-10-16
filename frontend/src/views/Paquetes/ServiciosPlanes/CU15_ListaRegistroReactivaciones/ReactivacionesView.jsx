import React from 'react';
import { useReactivacionesController } from '../../../../controllers/Paquetes/ServiciosPlanes/CU15_ListaRegistroReactivaciones/useReactivacionesController';
import { RefreshCw, Play, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ReactivacionesView() {
  const {
    reactivaciones,
    loading,
    error,
    formError,
    showModal,
    setShowModal,
    serviciosCortados,
    loadingServicios,
    serviciosError,
    formReactivacion,
    setFormReactivacion,
    handleCrear,
  } = useReactivacionesController();

  return (
    <div className="view-panel">
      <div className="view-header">
        <div>
          <h2>Gestionar Lista y Registro de Reactivaciones</h2>
          <p className="subtitle">Reposición de enlace para clientes normalizados y control de cobro de reconexión</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Play size={16} /> Registrar Reactivación
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={18} /> No se pudo cargar la lista de reactivaciones: {error}
        </div>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Servicio</th>
              <th>Cliente</th>
              <th>Costo Reconexión</th>
              <th>Fecha / Hora</th>
              <th>Operador</th>
              <th>Observaciones</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8' }}>
                  <RefreshCw size={16} className="spin" /> Cargando reactivaciones…
                </td>
              </tr>
            )}
            {!loading && reactivaciones.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8' }}>Sin registros</td>
              </tr>
            )}
            {reactivaciones.map((r) => (
              <tr key={r.id}>
                <td><strong>{r.codigo_reactivacion}</strong></td>
                <td><span className="badge badge-info">{r.servicio_codigo}</span></td>
                <td>{r.cliente_nombre}</td>
                <td><strong>Bs. {r.costo_reactivacion}</strong></td>
                <td>{r.fecha_reactivacion}</td>
                <td>{r.operador_nombre}</td>
                <td>{r.observaciones}</td>
                <td>
                  <span className={`badge badge-${r.estado_servicio === 'ACTIVO' ? 'success' : 'warning'}`}>
                    {r.estado_servicio === 'ACTIVO' && <CheckCircle2 size={12} />} {r.estado_servicio || '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Registrar Reactivación de Servicio</h3>

            {serviciosError && (
              <div className="alert alert-danger" role="alert">
                <AlertCircle size={18} /> No se pudieron cargar los servicios: {serviciosError}
              </div>
            )}

            {!loadingServicios && !serviciosError && serviciosCortados.length === 0 && (
              <div className="alert alert-warning" role="alert">
                <AlertCircle size={18} /> No hay servicios en estado CORTADO para reactivar.
              </div>
            )}

            <form onSubmit={handleCrear}>
              <div className="form-group">
                <label>Servicio a Reactivar</label>
                <select
                  required
                  value={formReactivacion.servicio_id}
                  disabled={loadingServicios || serviciosCortados.length === 0}
                  onChange={(e) => setFormReactivacion({ ...formReactivacion, servicio_id: e.target.value })}
                >
                  <option value="">
                    {loadingServicios ? 'Cargando servicios…' : 'Seleccione un servicio cortado'}
                  </option>
                  {serviciosCortados.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.codigo_servicio} — {s.cliente_nombre || 'Sin cliente'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Costo de Reconexión (Bs.)</label>
                <input
                  type="number"
                  required
                  value={formReactivacion.costo_reactivacion}
                  onChange={(e) => setFormReactivacion({ ...formReactivacion, costo_reactivacion: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Observaciones</label>
                <textarea
                  rows={3}
                  value={formReactivacion.observaciones}
                  onChange={(e) => setFormReactivacion({ ...formReactivacion, observaciones: e.target.value })}
                />
              </div>

              {formError && (
                <div className="alert alert-danger" role="alert">
                  <AlertCircle size={18} /> {formError}
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !formReactivacion.servicio_id}
                >
                  Confirmar Reactivación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
