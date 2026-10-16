import React from 'react';
import { useAuditoriaController } from '../../../../controllers/Paquetes/SeguridadAdministracion/CU02_BitacoraAuditoria/useAuditoriaController';
import { History, Filter, RefreshCw, AlertCircle } from 'lucide-react';
import './AuditoriaView.css';

export default function AuditoriaView() {
  const {
    logs,
    loading,
    error,
    usuarios,
    usuarioFiltro,
    setUsuarioFiltro,
    accionFiltro,
    setAccionFiltro,
    reload,
  } = useAuditoriaController();

  const nombreUsuario = (log) => log.user?.name || 'Usuario eliminado';
  const correoUsuario = (log) => log.user?.email || 'sin correo';
  const fechaFormateada = (log) => log.created_at || log.fechaHora || log.fecha_hora || '-';

  return (
    <div className="view-panel cu02-view">
      <div className="view-header">
        <div>
          <h2>Consultar Bitácora de Auditoría</h2>
          <p className="subtitle">Trazabilidad en tiempo real de operaciones críticas</p>
        </div>
        <button onClick={reload} className="btn btn-secondary" disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refrescar
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={18} /> No se pudo cargar la bitácora: {error}
        </div>
      )}

      <div className="filters-bar audit-filters">
        <div className="filter-item">
          <Filter size={16} />
          <select
            aria-label="Filtrar por usuario"
            value={usuarioFiltro}
            onChange={(e) => setUsuarioFiltro(e.target.value)}
          >
            <option value="">Todos los usuarios</option>
            {usuarios.map((usuario) => (
              <option key={usuario.id} value={usuario.id}>
                {usuario.email ? `${usuario.name} (${usuario.email})` : usuario.name}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-item">
          <select
            aria-label="Filtrar por acción"
            value={accionFiltro}
            onChange={(e) => setAccionFiltro(e.target.value)}
          >
            <option value="">Todas las Acciones</option>
            <option value="ACTIVACION">ACTIVACION</option>
            <option value="REGISTRO_PAGO">REGISTRO_PAGO</option>
            <option value="CORTE_LOGICO">CORTE_LOGICO</option>
          </select>
        </div>
      </div>

      {logs.length === 0 && !loading ? (
        <div className="audit-empty">
          <History size={18} />
          <span>No hay registros para los filtros seleccionados.</span>
        </div>
      ) : (
        <>
          {/* Computadoras y tablets: tabla con desplazamiento horizontal propio */}
          <div className="table-responsive audit-table-wrap">
            <table className="data-table audit-table">
              <thead>
                <tr>
                  <th className="audit-col-id">ID</th>
                  <th className="audit-col-user">Usuario</th>

                  <th className="audit-col-action">Acción</th>
                  <th className="audit-col-details">Detalles Operación</th>
                  <th className="audit-col-ip">IP Origen</th>
                  <th className="audit-col-date">Fecha y Hora</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="audit-col-id">#{log.id}</td>
                    <td className="audit-col-user">
                      <div className="user-cell">
                        <strong>{nombreUsuario(log)}</strong>
                        <small>{correoUsuario(log)}</small>
                      </div>
                    </td>

                    <td className="audit-col-action">
                      <span className="badge badge-warning">{log.accion}</span>
                    </td>
                    <td className="audit-col-details">{log.detalles}</td>
                    <td className="audit-col-ip"><code>{log.ip_origen}</code></td>
                    <td className="audit-col-date">{fechaFormateada(log)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Celulares: cada registro como tarjeta */}
          <div className="audit-cards">
            {logs.map((log) => (
              <article className="audit-card" key={log.id}>
                <div className="audit-card-top">
                  <span className="audit-card-id">#{log.id}</span>
                  <span className="audit-card-date">{fechaFormateada(log)}</span>
                </div>
                <div className="audit-card-user">
                  <strong>{nombreUsuario(log)}</strong>
                  <small>{correoUsuario(log)}</small>
                </div>
                <div className="audit-card-badges">
                  <span className="badge badge-warning">{log.accion}</span>
                </div>
                <p className="audit-card-details">{log.detalles}</p>
                <div className="audit-card-ip">
                  <span>IP Origen</span>
                  <code>{log.ip_origen}</code>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
