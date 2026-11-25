import React, { useState, useEffect, useRef } from 'react';
import {
  FileBarChart, RefreshCw, Mic, MicOff, Volume2, Square, Download,
  SlidersHorizontal, BarChart2, PieChart, Sparkles, Check,
} from 'lucide-react';
import { canAccessCu } from '../../../../config/access.js';
import { useReporteInteligenteController } from '../../../../controllers/Paquetes/P7_DashboardReportesInteligenciaVoz/CU31_GenerarReporteInteligenteVoz/useReporteInteligenteController.js';
import { EJEMPLOS_REPORTES } from '../../../../models/Paquetes/P7_DashboardReportesInteligenciaVoz/CU31_GenerarReporteInteligenteVoz/reporteInteligenteModel.js';
import './ReporteInteligenteView.css';

function formatear(valor, formato) {
  if (valor === null || valor === undefined) return 'Sin dato';
  if (formato === 'moneda') return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(Number(valor));
  if (formato === 'entero') return new Intl.NumberFormat('es-BO').format(Number(valor));
  return String(valor);
}

export default function ReporteInteligenteView({ user, transcripcion = '' }) {
  const permitido = canAccessCu(user, 'CU31');
  const controlador = useReporteInteligenteController(permitido, transcripcion);
  if (!permitido) {
    return <div className="alert alert-danger" role="alert">No tienes autorización para generar reportes.</div>;
  }

  return <ReporteInteligenteContenido {...controlador} />;
}

export function ReporteInteligenteContenido({ comando, setComando, generar, loading, error, datos }) {
  const reporte = datos?.reporte;
  const filtros = Object.entries(datos?.interpretacion?.filtros || {});

  // Estados locales para Voz, Audio, Selección de Columnas y Gráficos
  const [escuchandoVoz, setEscuchandoVoz] = useState(false);
  const [reproduciendoAudio, setReproduciendoAudio] = useState(false);
  const [columnasVisibles, setColumnasVisibles] = useState([]);
  const [mostrarSelectorCols, setMostrarSelectorCols] = useState(false);

  const recognitionRef = useRef(null);

  // Inicializar columnas visibles cuando llega un reporte
  useEffect(() => {
    if (reporte?.columnas) {
      setColumnasVisibles(reporte.columnas.map((c) => c.clave));
    }
  }, [reporte]);

  // Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = 'es-BO';
      rec.continuous = false;
      rec.interimResults = false;

      rec.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setComando(text);
        setEscuchandoVoz(false);
      };

      rec.onerror = () => setEscuchandoVoz(false);
      rec.onend = () => setEscuchandoVoz(false);

      recognitionRef.current = rec;
    }
  }, [setComando]);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert('Tu navegador no soporta reconocimiento de voz nativo.');
      return;
    }
    if (escuchandoVoz) {
      recognitionRef.current.stop();
      setEscuchandoVoz(false);
    } else {
      try {
        recognitionRef.current.start();
        setEscuchandoVoz(true);
      } catch {
        setEscuchandoVoz(false);
      }
    }
  };

  // Síntesis de voz (TTS)
  const reproducirResumenVoz = (texto) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'es-BO';
    utterance.rate = 1.0;
    utterance.onstart = () => setReproduciendoAudio(true);
    utterance.onend = () => setReproduciendoAudio(false);
    utterance.onerror = () => setReproduciendoAudio(false);
    window.speechSynthesis.speak(utterance);
  };

  const detenerAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setReproduciendoAudio(false);
  };

  // Toggle de columna
  const toggleColumna = (clave) => {
    setColumnasVisibles((prev) => {
      if (prev.includes(clave)) {
        if (prev.length === 1) return prev;
        return prev.filter((k) => k !== clave);
      }
      return [...prev, clave];
    });
  };

  // Exportar reporte inteligente a CSV/Excel con las columnas seleccionadas
  const descargarCsv = () => {
    if (!reporte || !reporte.filas || reporte.filas.length === 0) return;

    const colsExportar = reporte.columnas.filter((c) => columnasVisibles.includes(c.clave));
    const lineas = [];

    // BOM UTF-8
    lineas.push('\uFEFF');
    lineas.push(`"TELCOM 2.0 - REPORTE INTELIGENTE: ${reporte.titulo}"\n`);
    lineas.push(`"Fecha de emisión: ${new Date().toLocaleString('es-BO')}"\n\n`);

    // Encabezados
    lineas.push(colsExportar.map((c) => `"${c.etiqueta}"`).join(';') + '\n');

    // Filas
    reporte.filas.forEach((fila) => {
      const valores = colsExportar.map((c) => {
        const val = fila[c.clave];
        return `"${val !== null && val !== undefined ? String(val).replace(/"/g, '""') : '-'}"`;
      });
      lineas.push(valores.join(';') + '\n');
    });

    const blob = new Blob(lineas, { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TELCOM_Inteligente_${reporte.tipo}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  };

  // Gráfica de barras sencilla en SVG
  const renderGraficaSvg = () => {
    if (!reporte?.filas || reporte.filas.length === 0) return null;

    // Buscar la primera columna numérica (o de formato entero/moneda)
    const colNum = reporte.columnas.find((c) => c.formato === 'entero' || c.formato === 'moneda');
    const colEtiqueta = reporte.columnas.find((c) => c.formato !== 'entero' && c.formato !== 'moneda') || reporte.columnas[0];

    if (!colNum || !colEtiqueta) return null;

    const datosGraf = reporte.filas.slice(0, 8);
    const maxVal = Math.max(...datosGraf.map((f) => Number(f[colNum.clave]) || 0), 1);

    return (
      <div className="cu31-chart-box">
        <h4><BarChart2 size={17} /> Comparativa Visual ({colNum.etiqueta} por {colEtiqueta.etiqueta})</h4>
        <div className="cu31-bars">
          {datosGraf.map((fila, idx) => {
            const val = Number(fila[colNum.clave]) || 0;
            const pct = Math.round((val / maxVal) * 100);
            return (
              <div className="cu31-bar-row" key={idx}>
                <div className="cu31-bar-info">
                  <span>{String(fila[colEtiqueta.clave] || 'Item ' + (idx + 1))}</span>
                  <strong>{formatear(val, colNum.formato)}</strong>
                </div>
                <div className="cu31-bar-bg">
                  <div className="cu31-bar-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const columnasFiltradas = reporte?.columnas?.filter((c) => columnasVisibles.includes(c.clave)) || [];

  return (
    <div className="view-panel cu31-view">
      <div className="view-header">
        <div>
          <h2><FileBarChart size={25} aria-hidden="true" /> Reporte Inteligente con IA y Voz</h2>
          <p className="subtitle">Dicta o escribe con tus propias palabras consultas avanzadas en lenguaje natural.</p>
        </div>
      </div>

      <form className="cu31-solicitud" aria-busy={loading} onSubmit={(event) => { event.preventDefault(); void generar(); }}>
        <div className="cu31-label-row">
          <label htmlFor="cu31-comando">Solicitud o comando por voz / texto</label>
          <button
            type="button"
            className={`btn-mic-cu31 ${escuchandoVoz ? 'listening' : ''}`}
            onClick={toggleMic}
            title={escuchandoVoz ? 'Detener micrófono' : 'Hablar por micrófono'}
          >
            {escuchandoVoz ? <MicOff size={18} /> : <Mic size={18} />}
            <span>{escuchandoVoz ? 'Escuchando dictado…' : 'Dictar por Voz'}</span>
          </button>
        </div>

        <textarea id="cu31-comando" rows={3} minLength={3} maxLength={1000} required
          value={comando} onChange={(event) => setComando(event.target.value)} disabled={loading}
          aria-describedby="cu31-ayuda"
          placeholder={escuchandoVoz ? 'Dictando en tiempo real...' : "Por ejemplo: Muéstrame los ingresos de este mes, o Cuántos clientes activos hay en Zona Norte."}
        />

        <div className="cu31-acciones">
          <p id="cu31-ayuda">Escribe o dicta tu consulta. La Inteligencia Artificial interpretará la intención canónica.</p>
          <button className="btn btn-primary" type="submit" disabled={loading || !comando.trim()}>
            {loading ? <RefreshCw size={17} className="spin" aria-hidden="true" /> : <Sparkles size={17} aria-hidden="true" />}
            {loading ? 'Generando reporte…' : 'Generar reporte con IA'}
          </button>
        </div>
      </form>

      <details className="cu31-ejemplos" open>
        <summary>Ejemplos de solicitudes en lenguaje natural</summary>
        <div>{EJEMPLOS_REPORTES.map((ejemplo) => (
          <button type="button" className="cu31-ejemplo" key={ejemplo} disabled={loading} onClick={() => setComando(ejemplo)}>
            🎙️ {ejemplo}
          </button>
        ))}</div>
      </details>

      {loading && <p className="cu31-estado" role="status">Procesando solicitud con IA y consultando la base de datos de TELCOM…</p>}
      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      {reporte && (
        <section className="cu31-resultado" aria-labelledby="cu31-titulo" aria-live="polite">
          <div className="cu31-interpretacion">
            <strong>Solicitud interpretada:</strong> {reporte.titulo}
            <span>Tipo: <code>{datos.interpretacion.tipo}</code></span>
            <span>{datos.interpretacion.origen === 'estructurada' ? 'Intención recibida' : 'Interpretada con Gemini'}</span>
            <dl>{filtros.length ? filtros.map(([clave, valor]) => (
              <div key={clave}><dt>{clave.replaceAll('_', ' ')}</dt><dd>{String(valor)}</dd></div>
            )) : <div><dt>Filtros</dt><dd>Sin filtros adicionales</dd></div>}</dl>
          </div>

          <div className="cu31-title-row">
            <h3 id="cu31-titulo">{reporte.titulo}</h3>
            <div className="cu31-header-actions">
              {reproduciendoAudio ? (
                <button type="button" className="btn btn-sm btn-danger" onClick={detenerAudio}>
                  <Square size={14} /> Detener Audio
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm btn-success"
                  onClick={() => reproducirResumenVoz(reporte.resumen)}
                >
                  <Volume2 size={14} /> Escuchar Síntesis
                </button>
              )}

              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => setMostrarSelectorCols((p) => !p)}
              >
                <SlidersHorizontal size={14} /> Columnas ({columnasVisibles.length})
              </button>

              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={descargarCsv}
                disabled={!reporte.filas || reporte.filas.length === 0}
              >
                <Download size={14} /> Exportar Excel (.csv)
              </button>
            </div>
          </div>

          <p className="cu31-resumen">{reporte.resumen}</p>

          {/* Selector de columnas inteligente */}
          {mostrarSelectorCols && (
            <div className="cu31-cols-selector">
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Selecciona columnas a mostrar y exportar:</span>
              <div className="cu31-cols-pills">
                {reporte.columnas.map((col) => {
                  const activa = columnasVisibles.includes(col.clave);
                  return (
                    <button
                      key={col.clave}
                      type="button"
                      className={`cu31-col-pill ${activa ? 'active' : ''}`}
                      onClick={() => toggleColumna(col.clave)}
                    >
                      {activa && <Check size={12} />}
                      {col.etiqueta}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Totales */}
          <div className="cu31-totales">
            {reporte.totales.map((total) => (
              <div key={total.clave}>
                <span>{total.etiqueta}</span>
                <strong>{formatear(total.valor, total.formato)}</strong>
              </div>
            ))}
          </div>

          {/* Gráfico SVG Dinámico */}
          {renderGraficaSvg()}

          {reporte.truncado && (
            <p className="alert alert-warning" role="status">
              Se muestran las primeras {reporte.limite_filas} filas. Los totales incluyen todos los resultados.
            </p>
          )}

          {/* Tabla Dinámica con solo las columnas activas */}
          <div className="cu31-tabla">
            <table>
              <caption>{reporte.titulo}</caption>
              <thead>
                <tr>
                  {columnasFiltradas.map((columna) => (
                    <th scope="col" key={columna.clave}>{columna.etiqueta}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reporte.filas.length ? reporte.filas.map((fila, indice) => (
                  <tr key={indice}>
                    {columnasFiltradas.map((columna) => (
                      <td key={columna.clave}>
                        {formatear(fila[columna.clave], columna.formato)}
                      </td>
                    ))}
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={columnasFiltradas.length}>No hay resultados para los filtros aplicados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="cu31-pie">
            Datos del sistema al generar la consulta
            {reporte.generado_en ? ` · ${new Date(reporte.generado_en).toLocaleString('es-BO', { timeZone: 'America/La_Paz' })}` : ''}
          </p>
        </section>
      )}
    </div>
  );
}
