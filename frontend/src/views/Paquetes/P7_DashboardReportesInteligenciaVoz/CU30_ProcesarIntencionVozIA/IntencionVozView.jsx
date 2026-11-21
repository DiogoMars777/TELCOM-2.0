import React from 'react';
import { useIntencionVozController } from '../../../../controllers/Paquetes/P7_DashboardReportesInteligenciaVoz/CU30_ProcesarIntencionVozIA/useIntencionVozController.js';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  Brain,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Database,
  Tag,
  RotateCcw,
  HelpCircle,
  Activity,
  Layers,
} from 'lucide-react';
import './IntencionVozView.css';

export default function IntencionVozView({ onNavigate }) {
  const {
    texto,
    setTexto,
    escuchando,
    procesando,
    error,
    resultado,
    historial,
    catalogo,
    filtroCategoria,
    setFiltroCategoria,
    feedbackEnviado,
    vozSoportada,
    startListening,
    stopListening,
    handleProcesar,
    handleEjecutarAccion,
    handleFeedback,
    handleSeleccionarEjemplo,
  } = useIntencionVozController({ onNavigate });

  // Categorías únicas del catálogo
  const categorias = ['TODAS', ...Array.from(new Set(catalogo.map((c) => c.categoria).filter(Boolean)))];

  const catalogoFiltrado = filtroCategoria === 'TODAS'
    ? catalogo
    : catalogo.filter((c) => c.categoria === filtroCategoria);

  return (
    <div className="view-panel cu30-container">
      {/* Encabezado */}
      <div className="view-header">
        <div>
          <h2>Asistente de Voz con IA y Procesamiento de Intenciones (NLP)</h2>
          <p className="subtitle">
            Comprensión de lenguaje natural para operaciones de telecomunicaciones (CU30)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Brain size={14} />
            <span>Motor NLP Inteligente</span>
          </span>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Tarjeta Principal de Captura de Voz y Texto */}
      <div className="cu30-hero-card">
        <div className="cu30-voice-controls">
          <button
            type="button"
            className={`cu30-mic-btn ${escuchando ? 'listening' : ''}`}
            onClick={escuchando ? stopListening : startListening}
            title={escuchando ? 'Detener dictado' : 'Iniciar dictado por voz'}
            aria-label="Micrófono"
          >
            {escuchando ? <MicOff size={32} /> : <Mic size={32} />}
          </button>

          {escuchando ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
              <div className="cu30-sound-wave">
                <div className="cu30-sound-bar" />
                <div className="cu30-sound-bar" />
                <div className="cu30-sound-bar" />
                <div className="cu30-sound-bar" />
                <div className="cu30-sound-bar" />
              </div>
              <span style={{ fontSize: '0.85rem', color: '#f87171', fontWeight: 600 }}>
                Escuchando tu comando de voz en vivo…
              </span>
            </div>
          ) : (
            <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
              {vozSoportada
                ? 'Presiona el micrófono para dictar o escribe abajo'
                : 'Dictado por voz no disponible en este navegador; usa el campo de texto'}
            </span>
          )}

          {/* Formulario de Entrada */}
          <form
            className="cu30-input-bar"
            onSubmit={(e) => {
              e.preventDefault();
              handleProcesar();
            }}
          >
            <input
              type="text"
              placeholder="Ej: Buscar clientes de Zona Norte, ver servicios para corte, registrar pago..."
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              disabled={procesando}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={procesando || !texto.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Send size={16} />
              <span>{procesando ? 'Procesando IA…' : 'Interpretar'}</span>
            </button>
          </form>

          {/* Chips de Sugerencias Rápidas */}
          <div className="cu30-quick-chips">
            <button
              type="button"
              className="cu30-chip"
              onClick={() => handleSeleccionarEjemplo('Mostrar servicios para corte')}
            >
              ✂️ Servicios para corte
            </button>
            <button
              type="button"
              className="cu30-chip"
              onClick={() => handleSeleccionarEjemplo('Buscar clientes activos de Zona Norte')}
            >
              👥 Clientes Zona Norte
            </button>
            <button
              type="button"
              className="cu30-chip"
              onClick={() => handleSeleccionarEjemplo('Historial de pagos recaudados hoy')}
            >
              💵 Ingresos de hoy
            </button>
            <button
              type="button"
              className="cu30-chip"
              onClick={() => handleSeleccionarEjemplo('Consultar routers en stock en inventario')}
            >
              📦 Stock de Routers
            </button>
            <button
              type="button"
              className="cu30-chip"
              onClick={() => handleSeleccionarEjemplo('Solicitudes de instalación pendientes')}
            >
              🛠️ Solicitudes Técnicas
            </button>
          </div>
        </div>
      </div>

      {/* Tarjeta de Resultado de la Intención Interpretada */}
      {resultado && (
        <div className="cu30-result-card">
          <div className="cu30-result-header">
            <div className="cu30-meta-badges">
              <span className="cu30-badge-intent">
                {resultado.intencion_canonica}
              </span>
              <span className="badge badge-info">{resultado.categoria}</span>
              <span className="cu30-badge-engine">
                {resultado.motor === 'GEMINI_AI' ? '⚡ Google Gemini AI' : '⚙️ NLP Local'}
              </span>
              <span
                className="badge"
                style={{
                  background:
                    resultado.confianza >= 0.85
                      ? 'rgba(16, 185, 129, 0.2)'
                      : 'rgba(234, 179, 8, 0.2)',
                  color: resultado.confianza >= 0.85 ? '#34d399' : '#facc15',
                }}
              >
                Confianza: {Math.round(resultado.confianza * 100)}%
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#94a3b8' }}>
              <Clock size={13} />
              <span>{resultado.tiempo_procesamiento} ms</span>
            </div>
          </div>

          {/* Burbuja de Respuesta del Asistente */}
          <div className="cu30-assistant-bubble">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem', color: '#a5b4fc', fontWeight: 600, fontSize: '0.85rem' }}>
              <Sparkles size={16} />
              <span>Respuesta Asistente:</span>
            </div>
            <div>{resultado.respuesta_asistente}</div>
          </div>

          {/* Entidades Detectadas */}
          {resultado.entidades && Object.keys(resultado.entidades).length > 0 && (
            <div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Tag size={13} />
                <span>Entidades Extraídas por NLP:</span>
              </div>
              <div className="cu30-entities-grid">
                {Object.entries(resultado.entidades).map(([k, v]) => (
                  <span key={k} className="cu30-entity-tag">
                    <strong>{k}:</strong> {String(v)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Previsualización de Datos en Vivo */}
          {resultado.datos_en_vivo && (
            <div className="cu30-live-data">
              <div className="cu30-live-data-title">
                <Database size={14} />
                <span>Datos Operativos en Vivo (TELCOM DB)</span>
              </div>
              <div style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>
                {resultado.datos_en_vivo.mensaje}
              </div>
            </div>
          )}

          {/* Acciones y Navegación Dinámica */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
            {resultado.accion_sugerida && resultado.accion_sugerida.destino && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleEjecutarAccion}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <span>Ir al Módulo: {resultado.accion_sugerida.modulo} ({resultado.accion_sugerida.destino})</span>
                <ArrowRight size={16} />
              </button>
            )}

            {/* Retroalimentación de la IA */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>¿Interpretación correcta?</span>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                disabled={feedbackEnviado !== null}
                onClick={() => handleFeedback(true)}
                style={{
                  background: feedbackEnviado === 'positivo' ? 'rgba(16, 185, 129, 0.3)' : undefined,
                  color: feedbackEnviado === 'positivo' ? '#34d399' : undefined,
                }}
              >
                <ThumbsUp size={13} />
              </button>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                disabled={feedbackEnviado !== null}
                onClick={() => handleFeedback(false)}
                style={{
                  background: feedbackEnviado === 'negativo' ? 'rgba(239, 68, 68, 0.3)' : undefined,
                  color: feedbackEnviado === 'negativo' ? '#f87171' : undefined,
                }}
              >
                <ThumbsDown size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Catálogo de Intenciones Reconocidas */}
      <div style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Catálogo de Capacidades del Asistente</h3>
            <p className="subtitle" style={{ margin: 0 }}>
              Comandos soportados en lenguaje natural por el motor de IA
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {categorias.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`btn btn-sm ${filtroCategoria === cat ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFiltroCategoria(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="cu30-catalog-grid">
          {catalogoFiltrado.map((item) => (
            <div
              key={item.codigo}
              className="cu30-catalog-card"
              onClick={() => {
                if (item.ejemplos && item.ejemplos[0]) {
                  handleSeleccionarEjemplo(item.ejemplos[0]);
                }
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9' }}>
                  {item.label}
                </span>
                <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                  {item.destino}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 0.5rem 0' }}>
                {item.descripcion}
              </p>
              {item.ejemplos && item.ejemplos.length > 0 && (
                <div style={{ fontSize: '0.75rem', color: '#a5b4fc', fontStyle: 'italic' }}>
                  "{item.ejemplos[0]}"
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Historial Reciente */}
      {historial.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Historial de Consultas Recientes</h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Comando Dictado</th>
                  <th>Intención</th>
                  <th>Categoría</th>
                  <th>Confianza</th>
                  <th>Motor</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((h) => (
                  <tr key={h.id || h.idIntencion}>
                    <td><strong>{h.texto_entrada || h.textoEntrada}</strong></td>
                    <td>
                      <span className="badge badge-info">
                        {h.intencion_canonica || h.intencionCanonica}
                      </span>
                    </td>
                    <td>{h.categoria}</td>
                    <td>{Math.round((h.confianza || 0) * 100)}%</td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: h.motor === 'GEMINI_AI' ? '#34d399' : '#94a3b8' }}>
                        {h.motor}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {h.created_at ? new Date(h.created_at).toLocaleString() : 'Reciente'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
