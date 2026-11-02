import React from 'react';
import { useReactivacionesController } from '../../../../controllers/Paquetes/ServiciosPlanes/CU15_ListaRegistroReactivaciones/useReactivacionesController';
import ReactivacionModal from './ReactivacionModal';
import {
  RefreshCw,
  Play,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ShieldAlert,
  ClipboardCheck,
  Zap,
} from 'lucide-react';

export default function ReactivacionesView() {
  const {
    reactivaciones,
    loading,
    error,
    showModal,
    openModal,
    closeModal,
    isSubmitting,
    formError,
    successMessage,
    servicioSeleccionado,
    serviciosCortados,
    loadingServicios,
    serviciosError,
    handleReactivar,
    reload,
  } = useReactivacionesController();

  return (
    <div className="view-panel">
      {/* Cabecera Responsiva */}
      <div className="view-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Gestionar Reactivaciones de Servicio</h2>
          <p className="subtitle">
            Restablecimiento de conexión para clientes regularizados y control de cobro por reconexión
          </p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={reload}
            disabled={loading}
            title="Recargar registros"
          >
            <RotateCcw size={15} className={loading ? 'spin' : ''} />
            <span>Refrescar</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => openModal()}
          >
            <Play size={16} />
            <span>Registrar Reactivación</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas Rápidas Responsivas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
        }}
      >
        <div
          className="stat-card"
          style={{
            backgroundColor: 'var(--bg-card)',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '0.65rem', borderRadius: '8px' }}>
            <ClipboardCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Reactivaciones Registradas
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981' }}>
              {loading ? '…' : reactivaciones.length}
            </div>
          </div>
        </div>

        <div
          className="stat-card"
          style={{
            backgroundColor: 'var(--bg-card)',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '0.65rem', borderRadius: '8px' }}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Servicios Cortados Pendientes
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ef4444' }}>
              {loadingServicios ? '…' : serviciosCortados.length}
            </div>
          </div>
        </div>

        <div
          className="stat-card"
          style={{
            backgroundColor: 'var(--bg-card)',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.65rem', borderRadius: '8px' }}>
            <Zap size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Estado del Módulo
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#38bdf8', marginTop: '0.2rem' }}>
              Conexión Operativa
            </div>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {successMessage && (
        <div className="alert alert-success" role="alert">
          <CheckCircle2 size={18} /> {successMessage}
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={18} /> No se pudo cargar la lista de reactivaciones: {error}
        </div>
      )}

      {/* ── ESCRITORIO Y TABLETS: Tabla Completa (.users-table-wrap) ── */}
      <div className="table-responsive users-table-wrap">
        <table className="data-table users-table" style={{ minWidth: '760px' }}>
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
                <td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: '2.5rem' }}>
                  <RefreshCw size={18} className="spin" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                  Cargando reactivaciones…
                </td>
              </tr>
            )}
            {!loading && reactivaciones.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: '2.5rem' }}>
                  Sin registros de reactivaciones en el sistema.
                </td>
              </tr>
            )}
            {!loading && reactivaciones.map((r) => (
              <tr key={r.id}>
                <td><strong>{r.codigo_reactivacion}</strong></td>
                <td><span className="badge badge-info">{r.servicio_codigo}</span></td>
                <td>{r.cliente_nombre || '—'}</td>
                <td><strong>Bs. {Number(r.costo_reactivacion || 0).toFixed(2)}</strong></td>
                <td>{r.fecha_reactivacion || '—'}</td>
                <td>{r.operador_nombre || '—'}</td>
                <td>
                  <span style={{ fontSize: '0.78rem', color: r.observaciones ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {r.observaciones || '—'}
                  </span>
                </td>
                <td>
                  <span className={`badge badge-${r.estado_servicio === 'ACTIVO' ? 'success' : 'warning'}`}>
                    {r.estado_servicio === 'ACTIVO' && <CheckCircle2 size={12} />} {r.estado_servicio || 'ACTIVO'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── MÓVIL: Estado (Cargando / Sin Registros) (.users-mobile-status) ── */}
      {(loading || reactivaciones.length === 0) && (
        <div className="users-mobile-status" role="status">
          {loading ? (
            <>
              <RefreshCw size={16} className="spin" /> Cargando reactivaciones…
            </>
          ) : (
            'Sin registros de reactivaciones'
          )}
        </div>
      )}

      {/* ── MÓVIL: Lista de Tarjetas (Cards) (.users-cards) ── */}
      <div className="users-cards">
        {reactivaciones.map((r) => (
          <article className="user-card" key={r.id}>
            <div className="user-card-head">
              <span className="user-card-id">{r.codigo_reactivacion}</span>
              <span className={`badge badge-${r.estado_servicio === 'ACTIVO' ? 'success' : 'warning'}`}>
                {r.estado_servicio === 'ACTIVO' && <CheckCircle2 size={12} />} {r.estado_servicio || 'ACTIVO'}
              </span>
            </div>

            <div className="user-card-fields">
              <div className="user-card-field">
                <span className="user-card-label">SERVICIO</span>
                <span className="user-card-value">
                  <span className="badge badge-info">{r.servicio_codigo}</span>
                </span>
              </div>

              <div className="user-card-field">
                <span className="user-card-label">CLIENTE / ABONADO</span>
                <span className="user-card-value">
                  <strong>{r.cliente_nombre || '—'}</strong>
                </span>
              </div>

              <div className="user-card-field">
                <span className="user-card-label">COSTO RECONEXIÓN</span>
                <span className="user-card-value">
                  <strong>Bs. {Number(r.costo_reactivacion || 0).toFixed(2)}</strong>
                </span>
              </div>

              <div className="user-card-field">
                <span className="user-card-label">FECHA Y HORA</span>
                <span className="user-card-value">{r.fecha_reactivacion || '—'}</span>
              </div>

              <div className="user-card-field">
                <span className="user-card-label">OPERADOR RESPONSABLE</span>
                <span className="user-card-value">{r.operador_nombre || '—'}</span>
              </div>

              {r.observaciones && (
                <div className="user-card-field">
                  <span className="user-card-label">OBSERVACIONES</span>
                  <span className="user-card-value">{r.observaciones}</span>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      {/* Modal Desacoplado de Reactivación */}
      <ReactivacionModal
        isOpen={showModal}
        onClose={closeModal}
        onSubmit={handleReactivar}
        serviciosCortados={serviciosCortados}
        loadingServicios={loadingServicios}
        serviciosError={serviciosError}
        servicioPreseleccionado={servicioSeleccionado}
        error={formError}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
