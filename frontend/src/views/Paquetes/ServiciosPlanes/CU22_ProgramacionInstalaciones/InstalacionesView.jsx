import React from 'react';
import { useInstalacionesController } from '../../../../controllers/Paquetes/ServiciosPlanes/CU22_ProgramacionInstalaciones/useInstalacionesController';
import ProgramarInstalacionModal from './ProgramarInstalacionModal';
import {
  Calendar,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  RotateCcw,
  MapPin,
  ClipboardList,
  ShieldCheck,
} from 'lucide-react';

export default function InstalacionesView() {
  const {
    solicitudes,
    totalSolicitudes,
    pendientesCount,
    programadasCount,
    tecnicos,
    loading,
    error,
    showModal,
    selectedSolicitud,
    isSubmitting,
    formError,
    successMessage,
    filtroEstado,
    setFiltroEstado,
    openProgramarModal,
    closeModal,
    checkConflictoHorario,
    getHorariosOcupados,
    handleProgramar,
    reload,
  } = useInstalacionesController();

  return (
    <div className="view-panel">
      {/* Cabecera Responsiva */}
      <div className="view-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Programación de Instalaciones</h2>
          <p className="subtitle">
            Asignación de cuadrillas técnicas, agenda de visitas y control de órdenes de conexión
          </p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={reload}
            disabled={loading}
            title="Recargar solicitudes y agenda"
          >
            <RotateCcw size={15} className={loading ? 'spin' : ''} />
            <span>Refrescar</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas Rápidas Responsivas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
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
          <div style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.65rem', borderRadius: '8px' }}>
            <ClipboardList size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Solicitudes
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{totalSolicitudes}</div>
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
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '0.65rem', borderRadius: '8px' }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Pendientes de Asignar
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f59e0b' }}>{pendientesCount}</div>
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
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '0.65rem', borderRadius: '8px' }}>
            <Calendar size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Programadas en Agenda
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981' }}>{programadasCount}</div>
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
          <AlertCircle size={18} /> No se pudieron cargar las instalaciones: {error}
        </div>
      )}

      {/* Barra de Filtros Responsiva */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        <button
          type="button"
          className={`btn btn-sm ${filtroEstado === 'TODOS' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFiltroEstado('TODOS')}
        >
          Todas ({totalSolicitudes})
        </button>
        <button
          type="button"
          className={`btn btn-sm ${filtroEstado === 'PENDIENTE' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFiltroEstado('PENDIENTE')}
        >
          Pendientes ({pendientesCount})
        </button>
        <button
          type="button"
          className={`btn btn-sm ${filtroEstado === 'PROGRAMADA' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFiltroEstado('PROGRAMADA')}
        >
          Programadas ({programadasCount})
        </button>
      </div>

      {/* ── ESCRITORIO Y TABLETS: Tabla Completa (.users-table-wrap) ── */}
      <div className="table-responsive users-table-wrap">
        <table className="data-table users-table" style={{ minWidth: '840px' }}>
          <thead>
            <tr>
              <th>Orden</th>
              <th>Fecha Solicitud</th>
              <th>Abonado / Cliente</th>
              <th>Ubicación / Dirección</th>
              <th>Estado</th>
              <th>Cuadrilla Asignada</th>
              <th>Fecha Programada</th>
              <th style={{ textAlign: 'center' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: '2.5rem' }}>
                  <RefreshCw size={18} className="spin" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                  Cargando solicitudes de instalación…
                </td>
              </tr>
            )}

            {!loading && solicitudes.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: '2.5rem' }}>
                  No se encontraron solicitudes de instalación {filtroEstado !== 'TODOS' ? `en estado ${filtroEstado}` : ''}.
                </td>
              </tr>
            )}

            {!loading && solicitudes.map((sol) => {
              const inst = sol.instalacion;
              const esPendiente = sol.estado_solicitud === 'PENDIENTE';

              return (
                <tr key={sol.id}>
                  <td>
                    <strong>{sol.numero_orden}</strong>
                  </td>
                  <td>{sol.fecha_solicitud || '—'}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{sol.cliente_nombre}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      CI: {sol.cliente_ci} · Tel: {sol.cliente_telefono}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.25rem', maxWidth: '280px' }}>
                      <MapPin size={13} style={{ flexShrink: 0, marginTop: '2px', color: '#38bdf8' }} />
                      <span style={{ fontSize: '0.78rem' }}>
                        {sol.direccion || 'Sin dirección'}
                        {sol.referencia && <span style={{ color: 'var(--text-secondary)' }}> ({sol.referencia})</span>}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${esPendiente ? 'badge-warning' : 'badge-success'}`}>
                      {esPendiente ? <Clock size={12} /> : <ShieldCheck size={12} />}
                      {sol.estado_solicitud}
                    </span>
                  </td>
                  <td>
                    {inst?.tecnico?.nombreCompleto || inst?.tecnico?.nombre_completo ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <UserCheck size={14} style={{ color: '#10b981' }} />
                        <span style={{ fontWeight: 600 }}>{inst.tecnico.nombreCompleto || inst.tecnico.nombre_completo}</span>
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Sin asignar</span>
                    )}
                  </td>
                  <td>
                    {inst?.fecha_programada || inst?.fechaProgramada ? (
                      <div>
                        <strong>{inst.fecha_programada || inst.fechaProgramada}</strong>
                        {(inst.hora_programada || inst.horaProgramada) && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            <Clock size={11} style={{ verticalAlign: 'middle', marginRight: '2px' }} />
                            {(inst.hora_programada || inst.horaProgramada).slice(0, 5)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>—</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className={`btn btn-sm ${esPendiente ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => openProgramarModal(sol)}
                      title={esPendiente ? 'Asignar técnico y fecha' : 'Reagendar instalación'}
                    >
                      <Calendar size={13} />
                      <span>{esPendiente ? 'Programar' : 'Reagendar'}</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── MÓVIL: Estado (Cargando / Sin Registros) (.users-mobile-status) ── */}
      {(loading || solicitudes.length === 0) && (
        <div className="users-mobile-status" role="status">
          {loading ? (
            <>
              <RefreshCw size={16} className="spin" /> Cargando solicitudes de instalación…
            </>
          ) : (
            `No se encontraron solicitudes ${filtroEstado !== 'TODOS' ? `en estado ${filtroEstado}` : ''}`
          )}
        </div>
      )}

      {/* ── MÓVIL: Lista de Tarjetas (Cards) (.users-cards) ── */}
      <div className="users-cards">
        {solicitudes.map((sol) => {
          const inst = sol.instalacion;
          const esPendiente = sol.estado_solicitud === 'PENDIENTE';

          return (
            <article className="user-card" key={sol.id}>
              <div className="user-card-head">
                <span className="user-card-id">{sol.numero_orden}</span>
                <span className={`badge ${esPendiente ? 'badge-warning' : 'badge-success'}`}>
                  {esPendiente ? <Clock size={12} /> : <ShieldCheck size={12} />}
                  {sol.estado_solicitud}
                </span>
              </div>

              <div className="user-card-fields">
                <div className="user-card-field">
                  <span className="user-card-label">ABONADO / CLIENTE</span>
                  <span className="user-card-value">
                    <strong>{sol.cliente_nombre}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                      CI: {sol.cliente_ci}
                    </div>
                  </span>
                </div>

                <div className="user-card-field">
                  <span className="user-card-label">TELÉFONO</span>
                  <span className="user-card-value">{sol.cliente_telefono}</span>
                </div>

                <div className="user-card-field">
                  <span className="user-card-label">DIRECCIÓN / UBICACIÓN</span>
                  <span className="user-card-value">
                    {sol.direccion || 'Sin dirección'}
                    {sol.referencia && <span style={{ color: 'var(--text-secondary)' }}> ({sol.referencia})</span>}
                  </span>
                </div>

                <div className="user-card-field">
                  <span className="user-card-label">FECHA SOLICITUD</span>
                  <span className="user-card-value">{sol.fecha_solicitud || '—'}</span>
                </div>

                <div className="user-card-field">
                  <span className="user-card-label">CUADRILLA ASIGNADA</span>
                  <span className="user-card-value">
                    {inst?.tecnico?.nombreCompleto || inst?.tecnico?.nombre_completo ? (
                      <span style={{ fontWeight: 600, color: '#10b981' }}>
                        {inst.tecnico.nombreCompleto || inst.tecnico.nombre_completo}
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Sin asignar</span>
                    )}
                  </span>
                </div>

                <div className="user-card-field">
                  <span className="user-card-label">FECHA PROGRAMADA</span>
                  <span className="user-card-value">
                    {inst?.fecha_programada || inst?.fechaProgramada ? (
                      <span>
                        <strong>{inst.fecha_programada || inst.fechaProgramada}</strong>
                        {(inst.hora_programada || inst.horaProgramada) && (
                          <span style={{ color: 'var(--text-secondary)', marginLeft: '0.4rem' }}>
                            ({(inst.hora_programada || inst.horaProgramada).slice(0, 5)})
                          </span>
                        )}
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Pendiente de agendamiento</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="user-card-actions">
                <button
                  type="button"
                  className={`btn ${esPendiente ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => openProgramarModal(sol)}
                >
                  <Calendar size={14} />
                  <span>{esPendiente ? 'Programar Instalación' : 'Reagendar Visita'}</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Modal de Asignación y Programación */}
      <ProgramarInstalacionModal
        isOpen={showModal}
        onClose={closeModal}
        solicitud={selectedSolicitud}
        tecnicos={tecnicos}
        onSubmit={handleProgramar}
        isSubmitting={isSubmitting}
        error={formError}
        checkConflictoHorario={checkConflictoHorario}
        getHorariosOcupados={getHorariosOcupados}
      />
    </div>
  );
}
