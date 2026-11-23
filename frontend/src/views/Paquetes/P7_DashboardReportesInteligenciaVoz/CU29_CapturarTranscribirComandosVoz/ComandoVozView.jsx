import React from 'react';
import {
  Mic, MicOff, Volume2, Sparkles, AlertCircle, CheckCircle2,
  RefreshCw, History, ArrowRight, Keyboard, RotateCcw,
  CreditCard, AlertTriangle, Users, HardDrive, FileText,
} from 'lucide-react';
import { useComandoVozController } from '../../../../controllers/Paquetes/P7_DashboardReportesInteligenciaVoz/CU29_CapturarTranscribirComandosVoz/useComandoVozController.js';
import './ComandoVozView.css';

const ICON_MAP = {
  CreditCard,
  AlertTriangle,
  Users,
  HardDrive,
  FileText,
};

export default function ComandoVozView({ onIrAReporteTradicional = null }) {
  const {
    textoTranscrito,
    isRecording,
    recordingSeconds,
    soportaVoz,
    permisoDenegado,
    modoManual,
    interpretacion,
    historial,
    ejemplos,
    loading,
    error,
    mensajeExito,
    setModoManual,
    iniciarDictado,
    detenerDictado,
    handleTextoChange,
    handleSeleccionarEjemplo,
    handleConfirmarComando,
    limpiar,
  } = useComandoVozController((tipoReporte, params) => {
    if (onIrAReporteTradicional) {
      onIrAReporteTradicional(tipoReporte, params);
    }
  });

  return (
    <div className="cu29-container">
      {/* Encabezado */}
      <header className="cu29-header">
        <span className="cu29-badge">
          <Mic size={14} /> Módulo Oficial CU29
        </span>
        <h1 className="cu29-title">Capturar y Transcribir Comandos de Voz</h1>
        <p className="cu29-subtitle">
          Dicte solicitudes y consultas mediante el micrófono para convertirlas automáticamente en texto estructurado en tiempo real.
        </p>
      </header>

      {/* Alertas y Excepciones del CU29 */}
      {error && (
        <div className="alert-error" role="alert">
          <AlertCircle size={20} />
          <div>
            <strong>Aviso de voz:</strong> {error}
          </div>
        </div>
      )}

      {mensajeExito && !error && (
        <div className="alert-success" role="status">
          <CheckCircle2 size={20} />
          <div>{mensajeExito}</div>
        </div>
      )}

      {/* Panel Interactivo del Micrófono (Pasos 2, 3, 4, 5 y 6) */}
      <section className="cu29-mic-panel">
        <div className="cu29-mic-button-wrap">
          <button
            className={`cu29-mic-button ${isRecording ? 'recording' : ''}`}
            onClick={isRecording ? detenerDictado : iniciarDictado}
            title={isRecording ? 'Detener dictado' : 'Presione para iniciar dictado de voz'}
            aria-label={isRecording ? 'Detener dictado' : 'Iniciar captura de audio'}
          >
            {isRecording ? <MicOff size={38} /> : <Mic size={38} />}
          </button>
        </div>

        <div className="cu29-mic-status">
          <div className="cu29-mic-status-title">
            {isRecording
              ? `🎙️ Escuchando comando de voz... (${recordingSeconds}s)`
              : 'Presione el micrófono para iniciar el dictado'}
          </div>
          <div className="cu29-mic-status-sub">
            {isRecording
              ? 'Hable con claridad dictando su consulta o reporte solicitado...'
              : 'El motor Speech-to-Text transcribirá su solicitud en tiempo real en español.'}
          </div>
        </div>

        {/* Campo de Entrada de Texto Transcrito (Paso 6 y 7 de CU29) */}
        <div className="cu29-transcript-box">
          <div className="cu29-transcript-header">
            <span>
              {isRecording ? 'Transcripción en vivo:' : 'Texto transcrito (Editable para ajustes manuales):'}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                onClick={() => setModoManual(!modoManual)}
              >
                <Keyboard size={14} /> {modoManual ? 'Ocultar teclado' : 'Ingreso por teclado'}
              </button>
              {textoTranscrito && (
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                  onClick={limpiar}
                >
                  <RotateCcw size={14} /> Limpiar
                </button>
              )}
            </div>
          </div>

          <textarea
            className="cu29-textarea"
            placeholder="Ejemplo: 'Mostrar ingresos de la Zona Norte del último mes' o presione el micrófono arriba..."
            value={textoTranscrito}
            onChange={(e) => handleTextoChange(e.target.value)}
          />

          {/* Acciones de Confirmación (Paso 8 y 9) */}
          <div className="cu29-transcript-actions">
            {isRecording && (
              <button className="btn-secondary" onClick={detenerDictado}>
                <MicOff size={16} /> Finalizar Dictado
              </button>
            )}
            <button
              className="btn-primary"
              onClick={handleConfirmarComando}
              disabled={loading || !textoTranscrito.trim()}
            >
              {loading ? <RefreshCw className="spin" size={16} /> : <Sparkles size={16} />}
              Confirmar y Enviar Comando
            </button>
          </div>
        </div>

        {/* Tarjeta de Interpretación Estructurada Resultante */}
        {interpretacion && (
          <div className="cu29-interpretation-card">
            <div className="cu29-interp-header">
              <span className="cu29-interp-tag">
                {interpretacion.intencion}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 600 }}>
                Confianza: {Math.round((interpretacion.confianza || 0.98) * 100)}%
              </span>
            </div>

            <div className="cu29-interp-details">
              <div><strong>Comando interpretado:</strong> "{interpretacion.textoDictado}"</div>
              <div><strong>Resumen:</strong> {interpretacion.resumen}</div>
              {interpretacion.reporteSugerido && (
                <div style={{ marginTop: '0.5rem' }}>
                  <button
                    className="btn-success"
                    onClick={() => {
                      if (onIrAReporteTradicional) {
                        onIrAReporteTradicional(interpretacion.reporteSugerido, interpretacion.parametros || {});
                      }
                    }}
                  >
                    <FileText size={16} /> Ver reporte en "Reportes tradicionales (CU27)"
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Comandos Sugeridos en Lenguaje Natural */}
      <section className="cu29-examples-section">
        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
          💡 Comandos de voz frecuentes en TELCOM (Prueba rápida con 1 clic)
        </h3>
        <div className="cu29-examples-grid">
          {ejemplos.map((ej, idx) => {
            const IconC = ICON_MAP[ej.icono] || Volume2;
            return (
              <div
                key={idx}
                className="cu29-example-chip"
                onClick={() => handleSeleccionarEjemplo(ej)}
                role="button"
                tabIndex={0}
              >
                <div className="cu29-chip-icon">
                  <IconC size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>"{ej.texto}"</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{ej.intencion}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Historial de Comandos de Voz Dictados (Paso 9) */}
      <section className="cu29-history-box">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History size={18} />
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
            Historial de Comandos y Bitácora de Auditoría de Voz
          </h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="cu29-history-table">
            <thead>
              <tr>
                <th>Fecha / Hora</th>
                <th>Usuario</th>
                <th>Comando Dictado</th>
                <th>Intención</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {historial.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: '#64748b', padding: '1.5rem' }}>
                    Aún no se han dictado comandos en esta sesión.
                  </td>
                </tr>
              ) : (
                historial.map((h) => (
                  <tr key={h.id}>
                    <td>{h.fechaHora}</td>
                    <td>{h.usuario}</td>
                    <td><strong>"{h.texto}"</strong></td>
                    <td>
                      <span className="badge-status badge-activo" style={{ fontSize: '0.75rem' }}>
                        {h.intencion || 'CONSULTA'}
                      </span>
                    </td>
                    <td>
                      <span className="badge-status badge-finalizado" style={{ fontSize: '0.75rem' }}>
                        {h.estado}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => handleTextoChange(h.texto)}
                      >
                        Reutilizar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
