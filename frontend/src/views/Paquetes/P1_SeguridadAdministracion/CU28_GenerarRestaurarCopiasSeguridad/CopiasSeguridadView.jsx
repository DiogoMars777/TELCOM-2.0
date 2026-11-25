import React, { useState } from 'react';
import { useCopiasSeguridadController } from '../../../../controllers/Paquetes/P1_SeguridadAdministracion/CU28_GenerarRestaurarCopiasSeguridad/useCopiasSeguridadController';
import {
  Database,
  Download,
  RotateCcw,
  Trash2,
  Upload,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldAlert,
} from 'lucide-react';
import './CopiasSeguridadView.css';

export default function CopiasSeguridadView() {
  const {
    backups,
    loading,
    submitting,
    error,
    success,
    showModalGenerar,
    setShowModalGenerar,
    showModalUpload,
    setShowModalUpload,
    backupParaRestaurar,
    setBackupParaRestaurar,
    backupParaEliminar,
    setBackupParaEliminar,
    cargarBackups,
    handleGenerar,
    handleDescargar,
    handleRestaurar,
    handleRestaurarArchivo,
    handleEliminar,
    limpiarMensajes,
  } = useCopiasSeguridadController();

  // Estados locales de formularios de modales
  const [descGenerar, setDescGenerar] = useState('');
  const [fileUpload, setFileUpload] = useState(null);
  const [descUpload, setDescUpload] = useState('');

  const submitGenerar = async (e) => {
    e.preventDefault();
    const ok = await handleGenerar(descGenerar);
    if (ok) {
      setDescGenerar('');
    }
  };

  const submitUpload = async (e) => {
    e.preventDefault();
    if (!fileUpload) return;
    const ok = await handleRestaurarArchivo(fileUpload, descUpload);
    if (ok) {
      setFileUpload(null);
      setDescUpload('');
    }
  };

  const getBadgeTipoClass = (tipo) => {
    switch (tipo) {
      case 'SUBIDA':
        return 'badge-tipo-subida';
      case 'AUTOMATICA':
        return 'badge-tipo-automatica';
      default:
        return 'badge-tipo-manual';
    }
  };

  const getBadgeEstadoClass = (estado) => {
    switch (estado) {
      case 'RESTAURADO':
        return 'badge-estado-restaurado';
      case 'FALLIDO':
        return 'badge-estado-fallido';
      default:
        return 'badge-estado-completado';
    }
  };

  return (
    <div className="view-panel cu28-view">
      {/* Cabecera del Módulo */}
      <div className="view-header">
        <div>
          <h2>Copias de Seguridad (Backup / Restore)</h2>
          <p className="subtitle">Gestión, respaldo y restauración de datos del sistema</p>
        </div>
        <div className="cu28-actions-header">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={cargarBackups}
            disabled={loading || submitting}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refrescar
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              limpiarMensajes();
              setShowModalUpload(true);
            }}
            disabled={loading || submitting}
          >
            <Upload size={16} /> Restaurar desde Archivo (.sql)
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              limpiarMensajes();
              setShowModalGenerar(true);
            }}
            disabled={loading || submitting}
          >
            <Plus size={16} /> Generar Backup
          </button>
        </div>
      </div>

      {/* Alertas de error y éxito */}
      {error && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button
            type="button"
            onClick={limpiarMensajes}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="alert alert-success" role="alert">
          <CheckCircle2 size={18} />
          <span>{success}</span>
          <button
            type="button"
            onClick={limpiarMensajes}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Vista Escritorio (> 640px): Tabla responsiva con users-table-wrap */}
      <div className="table-responsive users-table-wrap">
        <table className="data-table users-table">
          <thead>
            <tr>
              <th>Archivo / Identificador</th>
              <th>Fecha y Hora</th>
              <th>Tamaño</th>
              <th>Tipo</th>
              <th style={{ whiteSpace: 'nowrap' }}>Estado</th>
              <th>Generado Por</th>
              <th>Observación</th>
              <th style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem' }}>
                  <RefreshCw size={24} className="spin" style={{ marginBottom: '0.5rem', opacity: 0.7 }} />
                  <div>Cargando copias de seguridad...</div>
                </td>
              </tr>
            ) : backups.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  <Database size={36} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
                  <div>No existen copias de seguridad registradas en el sistema.</div>
                </td>
              </tr>
            ) : (
              backups.map((b) => (
                <tr key={b.id}>
                  <td>
                    <div className="backup-file-cell">
                      <span className="backup-file-name">{b.nombre_archivo}</span>
                      {!b.existe_archivo && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--danger)' }}>
                          (Archivo físico no encontrado)
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{b.fecha_hora || '-'}</td>
                  <td>
                    <strong>{b.tamano_legible || '0 B'}</strong>
                  </td>
                  <td>
                    <span className={`badge ${getBadgeTipoClass(b.tipo)}`}>
                      {b.tipo || 'MANUAL'}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span className={`badge ${getBadgeEstadoClass(b.estado)}`}>
                      {b.estado || 'COMPLETADO'}
                    </span>
                  </td>
                  <td>
                    <div className="backup-user-cell">
                      <strong>{b.usuario?.name || 'Sistema'}</strong>
                      <small>{b.usuario?.email || 'N/A'}</small>
                    </div>
                  </td>
                  <td>
                    <div className="backup-desc" title={b.descripcion}>
                      {b.descripcion || '-'}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div className="backup-actions">
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleDescargar(b)}
                        disabled={submitting || !b.existe_archivo}
                        title="Descargar archivo .sql"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          limpiarMensajes();
                          setBackupParaRestaurar(b);
                        }}
                        disabled={submitting || !b.existe_archivo}
                        title="Restaurar base de datos a este punto"
                      >
                        <RotateCcw size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => {
                          limpiarMensajes();
                          setBackupParaEliminar(b);
                        }}
                        disabled={submitting}
                        title="Eliminar copia de seguridad"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Vista Móvil (<= 640px): Estado de carga / lista vacía */}
      {(loading || backups.length === 0) && (
        <div className="users-mobile-status" role="status">
          {loading ? (
            <>
              <RefreshCw size={16} className="spin" /> Cargando copias de seguridad…
            </>
          ) : (
            'No existen copias de seguridad registradas en el sistema.'
          )}
        </div>
      )}

      {/* Vista Móvil (<= 640px): Tarjetas responsivas con users-cards */}
      <div className="users-cards">
        {backups.map((b) => (
          <article className="user-card" key={b.id}>
            <div className="user-card-head">
              <span className="user-card-id">{b.nombre_archivo}</span>
              <span className={`badge ${getBadgeEstadoClass(b.estado)}`}>
                {b.estado || 'COMPLETADO'}
              </span>
            </div>

            <div className="user-card-fields">
              <div className="user-card-field">
                <span className="user-card-label">Fecha y Hora</span>
                <span className="user-card-value">{b.fecha_hora || '-'}</span>
              </div>

              <div className="user-card-field">
                <span className="user-card-label">Tamaño</span>
                <span className="user-card-value">
                  <strong>{b.tamano_legible || '0 B'}</strong>
                  {!b.existe_archivo && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--danger)', display: 'block' }}>
                      (Archivo físico no encontrado)
                    </span>
                  )}
                </span>
              </div>

              <div className="user-card-field">
                <span className="user-card-label">Generado Por</span>
                <span className="user-card-value">
                  <strong>{b.usuario?.name || 'Sistema'}</strong>
                  {b.usuario?.email && (
                    <small style={{ color: 'var(--text-secondary)', display: 'block' }}>
                      {b.usuario.email}
                    </small>
                  )}
                </span>
              </div>

              <div className="user-card-field">
                <span className="user-card-label">Tipo</span>
                <span className="user-card-value">
                  <span className={`badge ${getBadgeTipoClass(b.tipo)}`}>
                    {b.tipo || 'MANUAL'}
                  </span>
                </span>
              </div>

              {b.descripcion && (
                <div className="user-card-field">
                  <span className="user-card-label">Descripción / Observación</span>
                  <span className="user-card-value">{b.descripcion}</span>
                </div>
              )}
            </div>

            <div className="user-card-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleDescargar(b)}
                disabled={submitting || !b.existe_archivo}
                title="Descargar archivo .sql"
              >
                <Download size={15} /> Descargar
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  limpiarMensajes();
                  setBackupParaRestaurar(b);
                }}
                disabled={submitting || !b.existe_archivo}
                title="Restaurar base de datos a este punto"
              >
                <RotateCcw size={15} /> Restaurar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  limpiarMensajes();
                  setBackupParaEliminar(b);
                }}
                disabled={submitting}
                title="Eliminar copia de seguridad"
              >
                <Trash2 size={15} /> Eliminar
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Modal: Generar Backup */}
      {showModalGenerar && (
        <div className="modal-backdrop">
          <div className="modal-card modal-card-scrollable">
            <div className="modal-header">
              <h3>Generar Nueva Copia de Seguridad</h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowModalGenerar(false)}
                disabled={submitting}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submitGenerar}>
              <div className="modal-body">
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Se creará un volcado completo de la base de datos PostgreSQL y se almacenará en el servidor.
                </p>
                <div className="form-group">
                  <label htmlFor="desc-backup">Observación o Motivo (Opcional)</label>
                  <textarea
                    id="desc-backup"
                    rows="3"
                    className="form-control"
                    placeholder="Ej. Respaldo previo al cierre mensual de facturación..."
                    value={descGenerar}
                    onChange={(e) => setDescGenerar(e.target.value)}
                    disabled={submitting}
                    maxLength={500}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModalGenerar(false)}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? (
                    <>
                      <RefreshCw size={16} className="spin" /> Generando...
                    </>
                  ) : (
                    'Generar Backup'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Restaurar desde Archivo (.sql) */}
      {showModalUpload && (
        <div className="modal-backdrop">
          <div className="modal-card modal-card-scrollable">
            <div className="modal-header">
              <h3>Restaurar Base de Datos desde Archivo</h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowModalUpload(false)}
                disabled={submitting}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submitUpload}>
              <div className="modal-body">
                <div className="alert alert-danger" style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>ADVERTENCIA DE SOBREESCRITURA</strong>
                    <div style={{ fontSize: '0.825rem', marginTop: '4px' }}>
                      Al restaurar el archivo, todos los registros actuales de la base de datos serán reemplazados por el contenido del archivo .sql.
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="file-sql">Archivo SQL (.sql) *</label>
                  <input
                    id="file-sql"
                    type="file"
                    accept=".sql"
                    required
                    className="form-control"
                    onChange={(e) => setFileUpload(e.target.files[0] || null)}
                    disabled={submitting}
                  />
                  {fileUpload && (
                    <small style={{ color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                      Archivo: <strong>{fileUpload.name}</strong> ({(fileUpload.size / (1024 * 1024)).toFixed(2)} MB)
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="desc-upload">Observación (Opcional)</label>
                  <textarea
                    id="desc-upload"
                    rows="2"
                    className="form-control"
                    placeholder="Ej. Restauración de respaldo externo..."
                    value={descUpload}
                    onChange={(e) => setDescUpload(e.target.value)}
                    disabled={submitting}
                    maxLength={500}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModalUpload(false)}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={submitting || !fileUpload}
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={16} className="spin" /> Restaurando...
                    </>
                  ) : (
                    'Restaurar Base de Datos'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmación Crítica para Restaurar Copia Existente */}
      {backupParaRestaurar && (
        <div className="modal-backdrop">
          <div className="modal-card modal-card-scrollable">
            <div className="modal-header">
              <h3>Confirmar Restauración de Base de Datos</h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setBackupParaRestaurar(null)}
                disabled={submitting}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="alert alert-danger" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <ShieldAlert size={26} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>¡ACCIÓN CRÍTICA E IRREVERSIBLE!</strong>
                  <p style={{ margin: '6px 0 0', fontSize: '0.85rem', lineHeight: '1.4' }}>
                    Esta operación sobrescribirá los datos actuales de PostgreSQL con el estado que tenían al momento de generar este respaldo. Cualquier dato ingresado con posterioridad se perderá.
                  </p>
                </div>
              </div>

              <div className="backup-confirm-info">
                <div>
                  <strong>Copia de seguridad:</strong> {backupParaRestaurar.nombre_archivo}
                </div>
                <div>
                  <strong>Fecha de creación:</strong> {backupParaRestaurar.fecha_hora || '-'}
                </div>
                <div>
                  <strong>Tamaño:</strong> {backupParaRestaurar.tamano_legible || '0 B'}
                </div>
                {backupParaRestaurar.descripcion && (
                  <div>
                    <strong>Descripción:</strong> {backupParaRestaurar.descripcion}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setBackupParaRestaurar(null)}
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleRestaurar(backupParaRestaurar.id)}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <RefreshCw size={16} className="spin" /> Restaurando Base de Datos...
                  </>
                ) : (
                  'Confirmar y Restaurar Base de Datos'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Eliminación */}
      {backupParaEliminar && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Eliminar Copia de Seguridad</h3>
            <p style={{ margin: '0.5rem 0 1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              ¿Está seguro de eliminar permanentemente el archivo <strong>{backupParaEliminar.nombre_archivo}</strong> del servidor?
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setBackupParaEliminar(null)}
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleEliminar(backupParaEliminar.id)}
                disabled={submitting}
              >
                {submitting ? 'Eliminando...' : 'Eliminar Copia'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
