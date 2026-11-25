import React, { useState, useEffect } from 'react';
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
  Calendar,
  Clock,
  Play,
  Save,
  Settings,
  Check,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import './CopiasSeguridadView.css';

const DIAS_SEMANA_OPCIONES = [
  { val: '1', label: 'Lun' },
  { val: '2', label: 'Mar' },
  { val: '3', label: 'Mié' },
  { val: '4', label: 'Jue' },
  { val: '5', label: 'Vie' },
  { val: '6', label: 'Sáb' },
  { val: '0', label: 'Dom' },
];

export default function CopiasSeguridadView() {
  const {
    backups,
    loading,
    submitting,
    error,
    success,
    configuracion,
    loadingConfig,
    guardandoConfig,
    ejecutandoProgramado,
    showModalGenerar,
    setShowModalGenerar,
    showModalUpload,
    setShowModalUpload,
    backupParaRestaurar,
    setBackupParaRestaurar,
    backupParaEliminar,
    setBackupParaEliminar,
    cargarBackups,
    handleGuardarConfiguracion,
    handleEjecutarProgramado,
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

  // Estados locales para la tarjeta de automatización
  const [mostrarConfigurador, setMostrarConfigurador] = useState(true);
  const [activoAuto, setActivoAuto] = useState(true);
  const [frecuenciaAuto, setFrecuenciaAuto] = useState('DIARIO');
  const [horaAuto, setHoraAuto] = useState('02:00');
  const [diasSemanaAuto, setDiasSemanaAuto] = useState(['1', '2', '3', '4', '5', '6', '0']);
  const [diaMesAuto, setDiaMesAuto] = useState(1);
  const [retencionAuto, setRetencionAuto] = useState(7);

  // Cargar datos de configuración cuando estén disponibles
  useEffect(() => {
    if (configuracion) {
      setActivoAuto(Boolean(configuracion.activo));
      setFrecuenciaAuto(configuracion.frecuencia || 'DIARIO');
      setHoraAuto(configuracion.hora_ejecucion || '02:00');
      setDiasSemanaAuto(Array.isArray(configuracion.dias_semana_array) ? configuracion.dias_semana_array : ['1']);
      setDiaMesAuto(Number(configuracion.dia_mes) || 1);
      setRetencionAuto(Number(configuracion.retencion_copias) || 7);
    }
  }, [configuracion]);

  const toggleDiaSemana = (val) => {
    setDiasSemanaAuto((prev) => {
      if (prev.includes(val)) {
        if (prev.length === 1) return prev; // Mantener al menos un día seleccionado
        return prev.filter((d) => d !== val);
      }
      return [...prev, val];
    });
  };

  const guardarProgramacion = async (e) => {
    e.preventDefault();
    await handleGuardarConfiguracion({
      activo: activoAuto,
      frecuencia: frecuenciaAuto,
      hora_ejecucion: horaAuto,
      dias_semana: diasSemanaAuto,
      dia_mes: diaMesAuto,
      retencion_copias: retencionAuto,
    });
  };

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

      {/* Sección Senior: Automatización de Copias de Seguridad (Programadas) */}
      <section className="cu28-auto-card" aria-label="Programación de Copias de Seguridad">
        <header className="cu28-auto-header" onClick={() => setMostrarConfigurador((prev) => !prev)}>
          <div className="cu28-auto-title-wrap">
            <div className="cu28-auto-icon-badge">
              <Calendar size={20} />
            </div>
            <div>
              <div className="cu28-auto-title-row">
                <h3 className="cu28-auto-title">Automatización y Programación de Respaldos</h3>
                <span className={`badge ${activoAuto ? 'badge-estado-completado' : 'badge-tipo-manual'}`}>
                  {activoAuto ? 'Automatización Activa' : 'Automatización Pausada'}
                </span>
                <span className="badge badge-tipo-automatica">
                  Frecuencia: {frecuenciaAuto}
                </span>
              </div>
              <p className="cu28-auto-subtitle">
                Configure la ejecución periódica (diaria, semanal o mensual) con política de retención automática.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-ghost cu28-auto-toggle-btn"
            aria-label={mostrarConfigurador ? 'Ocultar panel' : 'Mostrar panel'}
          >
            {mostrarConfigurador ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </header>

        {mostrarConfigurador && (
          <form className="cu28-auto-body" onSubmit={guardarProgramacion}>
            {/* Métricas rápidas de programación */}
            <div className="cu28-auto-metrics">
              <div className="cu28-metric-card">
                <span className="cu28-metric-label"><Clock size={14} /> Próxima Ejecución</span>
                <span className="cu28-metric-value">
                  {configuracion?.proximo_backup_at || (activoAuto ? `Programada a las ${horaAuto}` : 'Pausada')}
                </span>
              </div>
              <div className="cu28-metric-card">
                <span className="cu28-metric-label"><Calendar size={14} /> Último Respaldo Auto</span>
                <span className="cu28-metric-value">
                  {configuracion?.ultimo_backup_at || 'Sin ejecuciones previas'}
                </span>
              </div>
              <div className="cu28-metric-card">
                <span className="cu28-metric-label"><Layers size={14} /> Retención de Copias</span>
                <span className="cu28-metric-value">{retencionAuto} copias máximas</span>
              </div>
              <div className="cu28-metric-card">
                <span className="cu28-metric-label"><ShieldAlert size={14} /> Estado Servicio</span>
                <span className="cu28-metric-value">
                  <span className={`cu28-status-dot ${configuracion?.ultimo_estado === 'FALLIDO' ? 'dot-error' : 'dot-ok'}`} />
                  {configuracion?.ultimo_estado || 'OPERATIVO'}
                </span>
              </div>
            </div>

            {/* Controles de Configuración */}
            <div className="cu28-auto-controls-grid">
              {/* Interruptor Activar / Desactivar */}
              <div className="cu28-control-group">
                <label className="cu28-control-label">Estado de la Automatización</label>
                <div className="cu28-switch-wrap">
                  <button
                    type="button"
                    className={`cu28-switch-btn ${activoAuto ? 'active' : ''}`}
                    onClick={() => setActivoAuto(true)}
                  >
                    <Check size={14} /> Activado
                  </button>
                  <button
                    type="button"
                    className={`cu28-switch-btn ${!activoAuto ? 'inactive' : ''}`}
                    onClick={() => setActivoAuto(false)}
                  >
                    <X size={14} /> Desactivado
                  </button>
                </div>
              </div>

              {/* Selector de Frecuencia */}
              <div className="cu28-control-group">
                <label className="cu28-control-label">Frecuencia de Respaldo</label>
                <div className="cu28-pills-wrap">
                  {['DIARIO', 'SEMANAL', 'MENSUAL'].map((frec) => (
                    <button
                      key={frec}
                      type="button"
                      className={`cu28-pill-btn ${frecuenciaAuto === frec ? 'active' : ''}`}
                      onClick={() => setFrecuenciaAuto(frec)}
                      disabled={!activoAuto}
                    >
                      {frec === 'DIARIO' && 'Diario (Todos los días)'}
                      {frec === 'SEMANAL' && 'Semanal (Días fijos)'}
                      {frec === 'MENSUAL' && 'Mensual (Día del mes)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hora de Ejecución */}
              <div className="cu28-control-group">
                <label className="cu28-control-label" htmlFor="cu28-hora">
                  Hora de Ejecución (24h)
                </label>
                <div className="cu28-input-icon-wrap">
                  <Clock size={16} className="cu28-input-icon" />
                  <input
                    id="cu28-hora"
                    type="time"
                    className="form-control cu28-input-time"
                    value={horaAuto}
                    onChange={(e) => setHoraAuto(e.target.value)}
                    disabled={!activoAuto}
                    required
                  />
                </div>
                <small className="cu28-help-text">Hora local recomendada de baja concurrencia (ej. 02:00).</small>
              </div>

              {/* Política de Retención */}
              <div className="cu28-control-group">
                <label className="cu28-control-label" htmlFor="cu28-retencion">
                  Copias a Retener (Rotación)
                </label>
                <div className="cu28-input-icon-wrap">
                  <input
                    id="cu28-retencion"
                    type="number"
                    min="1"
                    max="50"
                    className="form-control"
                    value={retencionAuto}
                    onChange={(e) => setRetencionAuto(Number(e.target.value))}
                    disabled={!activoAuto}
                    required
                  />
                </div>
                <small className="cu28-help-text">Las copias automáticas más antiguas se purgan automáticamente.</small>
              </div>

              {/* Parámetros Específicos: Días de la semana si es SEMANAL */}
              {frecuenciaAuto === 'SEMANAL' && (
                <div className="cu28-control-group cu28-control-full">
                  <label className="cu28-control-label">Días de la semana a ejecutar</label>
                  <div className="cu28-days-wrap">
                    {DIAS_SEMANA_OPCIONES.map((dia) => {
                      const sel = diasSemanaAuto.includes(dia.val);
                      return (
                        <button
                          key={dia.val}
                          type="button"
                          className={`cu28-day-pill ${sel ? 'selected' : ''}`}
                          onClick={() => toggleDiaSemana(dia.val)}
                          disabled={!activoAuto}
                        >
                          {dia.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Parámetros Específicos: Día del mes si es MENSUAL */}
              {frecuenciaAuto === 'MENSUAL' && (
                <div className="cu28-control-group">
                  <label className="cu28-control-label" htmlFor="cu28-diames">
                    Día del mes a ejecutar (1 al 28)
                  </label>
                  <input
                    id="cu28-diames"
                    type="number"
                    min="1"
                    max="28"
                    className="form-control"
                    value={diaMesAuto}
                    onChange={(e) => setDiaMesAuto(Number(e.target.value))}
                    disabled={!activoAuto}
                    required
                  />
                  <small className="cu28-help-text">Recomendado del 1 al 28 para compatibilidad con todos los meses.</small>
                </div>
              )}
            </div>

            {/* Acciones de Configuración */}
            <div className="cu28-auto-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleEjecutarProgramado}
                disabled={ejecutandoProgramado || guardandoConfig || loading}
                title="Prueba inmediata del comando de respaldo automático"
              >
                <Play size={15} className={ejecutandoProgramado ? 'spin' : ''} />
                {ejecutandoProgramado ? 'Ejecutando respaldo…' : 'Ejecutar Ahora (Prueba)'}
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={guardandoConfig || ejecutandoProgramado || loadingConfig}
              >
                <Save size={15} className={guardandoConfig ? 'spin' : ''} />
                {guardandoConfig ? 'Guardando programación…' : 'Guardar Configuración'}
              </button>
            </div>
          </form>
        )}
      </section>

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
