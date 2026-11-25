import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileBarChart, RefreshCw, Mic, MicOff, Volume2, Square, Download, Printer,
  SlidersHorizontal, BarChart2, Sparkles, Check, Brain, Send, History,
  Clock, Database, Tag, ArrowRight, ThumbsUp, ThumbsDown, LayoutGrid, FileText,
  AlertCircle, CheckCircle2, HelpCircle, RotateCcw,
} from 'lucide-react';
import { canAccessCu } from '../../../../config/access.js';
import { useReporteInteligenteController } from '../../../../controllers/Paquetes/P7_DashboardReportesInteligenciaVoz/CU31_GenerarReporteInteligenteVoz/useReporteInteligenteController.js';
import { EJEMPLOS_REPORTES } from '../../../../models/Paquetes/P7_DashboardReportesInteligenciaVoz/CU31_GenerarReporteInteligenteVoz/reporteInteligenteModel.js';
import { useIntencionVozController } from '../../../../controllers/Paquetes/P7_DashboardReportesInteligenciaVoz/CU30_ProcesarIntencionVozIA/useIntencionVozController.js';
import { comandoVozModel } from '../../../../models/Paquetes/P7_DashboardReportesInteligenciaVoz/CU29_CapturarTranscribirComandosVoz/comandoVozModel.js';
import './ReporteInteligenteView.css';

function formatear(valor, formato) {
  if (valor === null || valor === undefined) return 'Sin dato';
  if (formato === 'moneda') return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(Number(valor));
  if (formato === 'entero') return new Intl.NumberFormat('es-BO').format(Number(valor));
  return String(valor);
}

function normalizarTexto(txt) {
  return String(txt || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export default function ReporteInteligenteView({
  user,
  transcripcion = '',
  onNavigate = null,
  initialTab = 'reportes',
}) {
  const permitido = canAccessCu(user, 'CU31');
  const puedeAsistente = canAccessCu(user, 'CU30');
  const controlador = useReporteInteligenteController(permitido, transcripcion);
  const [tabActiva, setTabActiva] = useState(initialTab);

  // Historial unificado de comandos de voz (CU29)
  const [historialVoz, setHistorialVoz] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  // Controlador del Asistente Operativo NLP (CU30)
  const asistenteCtrl = useIntencionVozController({ onNavigate });

  const cargarHistorialVoz = useCallback(async () => {
    setCargandoHistorial(true);
    try {
      const data = await comandoVozModel.fetchHistorial();
      setHistorialVoz(Array.isArray(data) ? data : []);
    } catch {
      // Fallback silencioso para no bloquear la vista principal
    } finally {
      setCargandoHistorial(false);
    }
  }, []);

  useEffect(() => {
    if (!permitido) return;
    let mounted = true;
    comandoVozModel.fetchHistorial()
      .then((data) => {
        if (mounted) setHistorialVoz(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [permitido]);

  // Registrar transcripción de voz en bitácora CU29 cuando el usuario dicta desde micrófono
  const registrarDictadoVoz = useCallback(async (textoDictado, duracionSeg = 0) => {
    if (!textoDictado?.trim()) return;
    try {
      await comandoVozModel.transcribirComando({
        texto_dictado: textoDictado.trim(),
        duracion_segundos: duracionSeg,
        confianza: 0.98,
      });
      await cargarHistorialVoz();
    } catch {
      // Registro de auditoría no bloqueante
    }
  }, [cargarHistorialVoz]);

  if (!permitido) {
    return <div className="alert alert-danger" role="alert">No tienes autorización para generar reportes.</div>;
  }

  // En SSR (pruebas unitarias con Node sin window), evitamos renderizar widgets dependientes de red secundaria
  const enNavegador = typeof window !== 'undefined';

  return (
    <div className="view-panel cu31-view">
      {/* Encabezado Unificado Senior */}
      <header className="cu31-unified-header">
        <div className="cu31-header-main">
          <span className="cu31-senior-badge">
            <Sparkles size={14} /> Centro de Inteligencia Artificial y Voz
          </span>
          <h2>
            <FileBarChart size={26} aria-hidden="true" /> Reporte Inteligente
          </h2>
          <p className="subtitle">
            Genera reportes dinámicos con IA, filtra y exporta columnas por voz o escritura, consulta al asistente operativo (NLP) y audita tu historial dictado.
          </p>
        </div>

        {/* Pestañas de Fusión: CU31 + CU30 + CU29 */}
        <nav className="cu31-tabs" aria-label="Modos de Inteligencia y Voz">
          <button
            type="button"
            className={`cu31-tab-btn ${tabActiva === 'reportes' ? 'active' : ''}`}
            onClick={() => setTabActiva('reportes')}
          >
            <BarChart2 size={16} /> Reportes Dinámicos IA
          </button>

          {puedeAsistente && (
            <button
              type="button"
              className={`cu31-tab-btn ${tabActiva === 'asistente' ? 'active' : ''}`}
              onClick={() => setTabActiva('asistente')}
            >
              <Brain size={16} /> Asistente Operativo (NLP)
            </button>
          )}

          <button
            type="button"
            className={`cu31-tab-btn ${tabActiva === 'historial' ? 'active' : ''}`}
            onClick={() => {
              setTabActiva('historial');
              if (enNavegador) cargarHistorialVoz();
            }}
          >
            <History size={16} /> Historial de Voz
          </button>
        </nav>
      </header>

      {/* TAB 1: Reporte Dinámico Inteligente (CU31 + Control Dinámico de Voz y Columnas) */}
      {tabActiva === 'reportes' && (
        <ReporteInteligenteContenido
          {...controlador}
          onVozDictado={registrarDictadoVoz}
        />
      )}

      {/* TAB 2: Asistente Operativo NLP y Navegación Inteligente (CU30) */}
      {tabActiva === 'asistente' && puedeAsistente && (
        <AsistenteOperativoPanel
          ctrl={asistenteCtrl}
          onUsarEnReporte={(texto) => {
            controlador.setComando(texto);
            setTabActiva('reportes');
          }}
        />
      )}

      {/* TAB 3: Historial Unificado y Auditoría de Comandos de Voz (CU29 + CU30) */}
      {tabActiva === 'historial' && (
        <HistorialVozPanel
          historialVoz={historialVoz}
          historialNlp={asistenteCtrl.historial}
          cargando={cargandoHistorial}
          onRefrescar={cargarHistorialVoz}
          onEnviarAReporte={(texto) => {
            controlador.setComando(texto);
            setTabActiva('reportes');
          }}
          onEnviarAAsistente={(texto) => {
            asistenteCtrl.setTexto(texto);
            setTabActiva('asistente');
          }}
          puedeAsistente={puedeAsistente}
        />
      )}
    </div>
  );
}

/**
 * Contenido principal de generación dinámica de reportes (exportado para pruebas unitarias SSR).
 */
export function ReporteInteligenteContenido({
  comando,
  setComando,
  generar,
  loading,
  error,
  datos,
  onVozDictado = null,
}) {
  const reporte = datos?.reporte;
  const filtros = Object.entries(datos?.interpretacion?.filtros || {});

  // Estados de micrófono, TTS, copilot de columnas, vista y exportación PDF
  const [escuchandoVoz, setEscuchandoVoz] = useState(false);
  const [segundosGrabando, setSegundosGrabando] = useState(0);
  const [avisoVoz, setAvisoVoz] = useState(null);
  const [reproduciendoAudio, setReproduciendoAudio] = useState(false);

  const [seleccionCols, setSeleccionCols] = useState({ reporteRef: null, claves: [] });
  const [mostrarSelectorCols, setMostrarSelectorCols] = useState(true);
  const [vistaResultado, setVistaResultado] = useState('combinada'); // 'combinada' | 'graficos' | 'tabla'
  const [vistaImpresion, setVistaImpresion] = useState(null);

  // Copiloto de columnas/exportación dentro del resultado generado
  const [comandoColumna, setComandoColumna] = useState('');
  const [escuchandoColumna, setEscuchandoColumna] = useState(false);
  const [feedbackCopiloto, setFeedbackCopiloto] = useState(null);

  const recognitionRef = useRef(null);
  const colRecognitionRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(0);

  // Columnas visibles derivadas del reporte actual sin requerir setState en useEffect
  const columnasVisibles = (
    reporte && seleccionCols.reporteRef === reporte
      ? seleccionCols.claves
      : (reporte?.columnas?.map((c) => c.clave) || [])
  );

  const setColumnasVisibles = (updater) => {
    setSeleccionCols((prev) => {
      const base = prev.reporteRef === reporte
        ? prev.claves
        : (reporte?.columnas?.map((c) => c.clave) || []);
      const next = typeof updater === 'function' ? updater(base) : updater;
      return { reporteRef: reporte, claves: next };
    });
  };

  const abrirVistaImpresion = () => {
    const ahora = new Date();
    setVistaImpresion({
      fecha: ahora.toLocaleDateString('es-BO'),
      hora: ahora.toLocaleTimeString('es-BO'),
    });
  };

  // Limpiar temporizador al desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
      if (colRecognitionRef.current) {
        try { colRecognitionRef.current.abort(); } catch {}
      }
    };
  }, []);

  // Reconocimiento de voz principal (Solicitud de reporte)
  const toggleMicPrincipal = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setAvisoVoz('Tu navegador no soporta reconocimiento de voz por micrófono. Puedes escribir la solicitud directamente.');
      return;
    }

    if (escuchandoVoz && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      if (timerRef.current) clearInterval(timerRef.current);
      setEscuchandoVoz(false);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.lang = 'es-BO';
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setAvisoVoz(null);
        setEscuchandoVoz(true);
        setSegundosGrabando(0);
        startTimeRef.current = Date.now();
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => setSegundosGrabando((s) => s + 1), 1000);
      };

      rec.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setComando(transcript);

        const esFinal = event.results[event.results.length - 1]?.isFinal;
        if (esFinal && onVozDictado && transcript.trim()) {
          const duracion = startTimeRef.current > 0
            ? Number(((Date.now() - startTimeRef.current) / 1000).toFixed(1))
            : 0;
          onVozDictado(transcript, duracion);
        }
      };

      rec.onerror = (event) => {
        if (timerRef.current) clearInterval(timerRef.current);
        setEscuchandoVoz(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setAvisoVoz('Permiso de micrófono denegado. Puedes escribir tu solicitud manualmente.');
        } else if (event.error === 'no-speech') {
          setAvisoVoz('No se detectó audio. Acércate al micrófono e intenta nuevamente.');
        } else {
          setAvisoVoz(`Dictado interrumpido (${event.error || 'error'}). Puedes continuar por teclado.`);
        }
      };

      rec.onend = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setEscuchandoVoz(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch {
      setEscuchandoVoz(false);
      setAvisoVoz('No se pudo activar el micrófono. Escribe tu solicitud en el campo de texto.');
    }
  };

  // Síntesis de voz (TTS)
  const reproducirResumenVoz = (texto) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
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
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setReproduciendoAudio(false);
  };

  // Toggle manual de columna
  const toggleColumna = (clave) => {
    setColumnasVisibles((prev) => {
      if (prev.includes(clave)) {
        if (prev.length === 1) return prev;
        return prev.filter((k) => k !== clave);
      }
      return [...prev, clave];
    });
  };

  const aplicarPresetColumnas = (preset) => {
    if (!reporte?.columnas) return;
    if (preset === 'todas') {
      setColumnasVisibles(reporte.columnas.map((c) => c.clave));
      return;
    }
    if (preset === 'numericas') {
      const nums = reporte.columnas.filter((c) => c.formato === 'entero' || c.formato === 'moneda').map((c) => c.clave);
      const primera = reporte.columnas[0]?.clave;
      const combinadas = primera && !nums.includes(primera) ? [primera, ...nums] : nums;
      if (combinadas.length > 0) setColumnasVisibles(combinadas);
      return;
    }
    if (preset === 'texto') {
      const txts = reporte.columnas.filter((c) => c.formato !== 'entero' && c.formato !== 'moneda').map((c) => c.clave);
      if (txts.length > 0) setColumnasVisibles(txts);
    }
  };

  // Exportar Excel (.csv BOM UTF-8) únicamente con las columnas seleccionadas
  const descargarCsv = (colsPersonalizadas = null) => {
    if (typeof window === 'undefined' || !reporte || !reporte.filas || reporte.filas.length === 0) return;
    const visibles = colsPersonalizadas || columnasVisibles;
    const colsExportar = reporte.columnas.filter((c) => visibles.includes(c.clave));
    if (colsExportar.length === 0) return;

    const lineas = [];
    lineas.push('\uFEFF');
    lineas.push(`"TELCOM 2.0 - REPORTE INTELIGENTE: ${reporte.titulo}"\n`);
    lineas.push(`"Fecha de emisión: ${new Date().toLocaleString('es-BO')}"\n\n`);
    lineas.push(colsExportar.map((c) => `"${c.etiqueta}"`).join(';') + '\n');

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

  // Procesador inteligente de comandos de voz/texto para seleccionar columnas y exportar dinámicamente
  const procesarComandoDinamicoExport = (rawCmd) => {
    if (!reporte?.columnas) return;
    const cmd = normalizarTexto(rawCmd);
    if (!cmd) return;

    const todasLasCols = reporte.columnas;
    let nuevasVisibles = [...columnasVisibles];
    let mensaje = '';

    // 1. Detección de "todas las columnas"
    if (cmd.includes('todas las columnas') || cmd === 'todas' || cmd.includes('mostrar todo')) {
      nuevasVisibles = todasLasCols.map((c) => c.clave);
      setColumnasVisibles(nuevasVisibles);
      mensaje = 'Mostrando todas las columnas del reporte.';
    } else {
      // Buscar columnas coincidentes por etiqueta o clave (matching flexible por palabras)
      const coincidentes = todasLasCols.filter((col) => {
        const claveNorm = normalizarTexto(col.clave.replace(/_/g, ' '));
        const etiqNorm = normalizarTexto(col.etiqueta);
        const tokens = [...claveNorm.split(/\s+/), ...etiqNorm.split(/\s+/)].filter((t) => t.length >= 3);
        return cmd.includes(claveNorm) || cmd.includes(etiqNorm) || tokens.some((t) => cmd.includes(t));
      }).map((c) => c.clave);

      if (cmd.includes('ocultar') || cmd.includes('quitar') || cmd.includes('sin ') || cmd.includes('excluir')) {
        if (coincidentes.length > 0) {
          const filtradas = columnasVisibles.filter((k) => !coincidentes.includes(k));
          if (filtradas.length > 0) {
            nuevasVisibles = filtradas;
            setColumnasVisibles(nuevasVisibles);
            mensaje = `Columnas actualizadas: ocultando ${coincidentes.length} campo(s).`;
          } else {
            mensaje = 'Debe quedar al menos una columna visible en el reporte.';
          }
        }
      } else if (cmd.includes('solo') || cmd.includes('mostrar') || cmd.includes('incluir') || cmd.includes('elegir')) {
        if (coincidentes.length > 0) {
          nuevasVisibles = coincidentes;
          setColumnasVisibles(nuevasVisibles);
          mensaje = `Mostrando ${coincidentes.length} columna(s) seleccionadas.`;
        }
      } else if (coincidentes.length > 0) {
        nuevasVisibles = coincidentes;
        setColumnasVisibles(nuevasVisibles);
        mensaje = `Mostrando ${coincidentes.length} columna(s) detectadas.`;
      }
    }

    // 2. Detección de acción de exportación directa
    if (cmd.includes('excel') || cmd.includes('csv')) {
      descargarCsv(nuevasVisibles);
      mensaje = `${mensaje ? `${mensaje} ` : ''}Archivo Excel exportado con ${nuevasVisibles.length} columna(s).`;
    } else if (cmd.includes('pdf') || cmd.includes('imprimir')) {
      abrirVistaImpresion();
      mensaje = `${mensaje ? `${mensaje} ` : ''}Vista previa PDF preparada con ${nuevasVisibles.length} columna(s).`;
    }

    if (!mensaje) {
      mensaje = 'No se detectaron nombres de columnas o formato (Excel/PDF) coincidentes. Prueba por ejemplo: "solo zona y clientes" o "exportar pdf".';
    }
    setFeedbackCopiloto(mensaje);
  };

  // Micrófono secundario para el copiloto de columnas/exportación
  const toggleMicCopiloto = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setFeedbackCopiloto('Tu navegador no soporta micrófono; escribe el comando en el campo de texto.');
      return;
    }

    if (escuchandoColumna && colRecognitionRef.current) {
      try { colRecognitionRef.current.stop(); } catch {}
      setEscuchandoColumna(false);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.lang = 'es-BO';
      rec.continuous = false;
      rec.interimResults = false;

      rec.onstart = () => setEscuchandoColumna(true);
      rec.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setComandoColumna(text);
        procesarComandoDinamicoExport(text);
        if (onVozDictado) onVozDictado(text, 0);
        setEscuchandoColumna(false);
      };
      rec.onerror = () => setEscuchandoColumna(false);
      rec.onend = () => setEscuchandoColumna(false);

      colRecognitionRef.current = rec;
      rec.start();
    } catch {
      setEscuchandoColumna(false);
    }
  };

  // Gráfica de barras comparativa dinámica
  const renderGraficaSvg = () => {
    if (!reporte?.filas || reporte.filas.length === 0) return null;

    const colNum = reporte.columnas.find((c) => c.formato === 'entero' || c.formato === 'moneda');
    const colEtiqueta = reporte.columnas.find((c) => c.formato !== 'entero' && c.formato !== 'moneda') || reporte.columnas[0];

    if (!colNum || !colEtiqueta) return null;

    const datosGraf = reporte.filas.slice(0, 10);
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
                  <span>{String(fila[colEtiqueta.clave] || `Registro ${idx + 1}`)}</span>
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

  const columnasFiltradas = reporte?.columnas?.filter((c) => (
    columnasVisibles.length > 0 ? columnasVisibles.includes(c.clave) : true
  )) || [];

  return (
    <>
      <form className="cu31-solicitud" aria-busy={loading} onSubmit={(event) => { event.preventDefault(); void generar(); }}>
        <div className="cu31-label-row">
          <label htmlFor="cu31-comando">Solicitud o comando transcrito</label>
          <button
            type="button"
            className={`btn-mic-cu31 ${escuchandoVoz ? 'listening' : ''}`}
            onClick={toggleMicPrincipal}
            title={escuchandoVoz ? 'Detener micrófono' : 'Dictar consulta por voz'}
          >
            {escuchandoVoz ? <MicOff size={17} /> : <Mic size={17} />}
            <span>{escuchandoVoz ? `Escuchando… (${segundosGrabando}s)` : 'Dictar por Voz'}</span>
          </button>
        </div>

        <textarea
          id="cu31-comando"
          rows={3}
          minLength={3}
          maxLength={1000}
          required
          value={comando}
          onChange={(event) => setComando(event.target.value)}
          disabled={loading}
          aria-describedby="cu31-ayuda"
          placeholder={escuchandoVoz ? 'Escuchando tu dictado de voz en tiempo real…' : 'Por ejemplo: Muéstrame los ingresos de este mes, o Clientes activos por zona.'}
        />

        {avisoVoz && (
          <div className="cu31-voice-notice" role="status">
            <AlertCircle size={15} />
            <span>{avisoVoz}</span>
          </div>
        )}

        <div className="cu31-acciones">
          <p id="cu31-ayuda">Dicta por micrófono o escribe con tus propias palabras. La IA interpretará tu reporte dinámico.</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {comando && !loading && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setComando('')}
              >
                <RotateCcw size={15} /> Limpiar
              </button>
            )}
            <button className="btn btn-primary" type="submit" disabled={loading || !comando.trim()}>
              {loading ? <RefreshCw size={17} className="spin" aria-hidden="true" /> : <Sparkles size={17} aria-hidden="true" />}
              {loading ? 'Generando reporte…' : 'Generar reporte con IA'}
            </button>
          </div>
        </div>
      </form>

      <details className="cu31-ejemplos" open>
        <summary>Ejemplos de solicitudes en lenguaje natural</summary>
        <div>
          {EJEMPLOS_REPORTES.map((ejemplo) => (
            <button
              type="button"
              className="cu31-ejemplo"
              key={ejemplo}
              disabled={loading}
              onClick={() => setComando(ejemplo)}
            >
              🎙️ {ejemplo}
            </button>
          ))}
        </div>
      </details>

      {loading && <p className="cu31-estado" role="status">Procesando solicitud con IA y consultando la base de datos de TELCOM…</p>}
      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      {reporte && (
        <section className="cu31-resultado" aria-labelledby="cu31-titulo" aria-live="polite">
          <div className="cu31-interpretacion">
            <strong>Solicitud interpretada:</strong> {reporte.titulo}
            <span>Tipo: <code>{datos.interpretacion.tipo}</code></span>
            <span>{datos.interpretacion.origen === 'estructurada' ? 'Intención recibida' : 'Interpretada con Gemini'}</span>
            <dl>
              {filtros.length ? filtros.map(([clave, valor]) => (
                <div key={clave}><dt>{clave.replaceAll('_', ' ')}</dt><dd>{String(valor)}</dd></div>
              )) : <div><dt>Filtros</dt><dd>Sin filtros adicionales</dd></div>}
            </dl>
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
                <SlidersHorizontal size={14} /> Columnas ({columnasFiltradas.length}/{reporte.columnas.length})
              </button>

              <button
                type="button"
                className="btn btn-sm btn-success"
                onClick={() => descargarCsv()}
                disabled={!reporte.filas || reporte.filas.length === 0}
                title="Exportar a Excel las columnas seleccionadas"
              >
                <Download size={14} /> Exportar Excel ({columnasFiltradas.length})
              </button>

              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={abrirVistaImpresion}
                disabled={!reporte.filas || reporte.filas.length === 0}
                title="Previsualizar y exportar a PDF las columnas seleccionadas"
              >
                <Printer size={14} /> Exportar PDF ({columnasFiltradas.length})
              </button>
            </div>
          </div>

          <p className="cu31-resumen">{reporte.resumen}</p>

          {/* Copiloto Dinámico + Selector de Columnas por Voz, Texto y Clics */}
          {mostrarSelectorCols && (
            <div className="cu31-cols-selector">
              <div className="cu31-copilot-bar">
                <div className="cu31-copilot-input-group">
                  <button
                    type="button"
                    className={`btn-mic-cu31-sm ${escuchandoColumna ? 'listening' : ''}`}
                    onClick={toggleMicCopiloto}
                    title="Dictar qué columnas mostrar o exportar"
                  >
                    {escuchandoColumna ? <MicOff size={15} /> : <Mic size={15} />}
                  </button>
                  <input
                    type="text"
                    value={comandoColumna}
                    onChange={(e) => setComandoColumna(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        procesarComandoDinamicoExport(comandoColumna);
                      }
                    }}
                    placeholder="Comando de exportación o columnas: ej. 'solo zona y monto', 'ocultar fecha', 'exportar excel', 'exportar pdf'..."
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => procesarComandoDinamicoExport(comandoColumna)}
                  >
                    Aplicar
                  </button>
                </div>

                <div className="cu31-presets">
                  <button type="button" className="cu31-preset-btn" onClick={() => aplicarPresetColumnas('todas')}>Todas</button>
                  <button type="button" className="cu31-preset-btn" onClick={() => aplicarPresetColumnas('numericas')}>Solo Numéricas</button>
                  <button type="button" className="cu31-preset-btn" onClick={() => aplicarPresetColumnas('texto')}>Solo Texto</button>
                </div>
              </div>

              {feedbackCopiloto && (
                <div className="cu31-copilot-feedback">
                  <CheckCircle2 size={14} />
                  <span>{feedbackCopiloto}</span>
                </div>
              )}

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

          {/* Totales KPI */}
          <div className="cu31-totales">
            {reporte.totales.map((total) => (
              <div key={total.clave}>
                <span>{total.etiqueta}</span>
                <strong>{formatear(total.valor, total.formato)}</strong>
              </div>
            ))}
          </div>

          {/* Toggle de Vista */}
          <div className="cu31-view-bar">
            <span>Visualización:</span>
            <div className="cu31-view-pills">
              <button
                type="button"
                className={vistaResultado === 'combinada' ? 'active' : ''}
                onClick={() => setVistaResultado('combinada')}
              >
                <LayoutGrid size={14} /> Combinada
              </button>
              <button
                type="button"
                className={vistaResultado === 'graficos' ? 'active' : ''}
                onClick={() => setVistaResultado('graficos')}
              >
                <BarChart2 size={14} /> Solo Gráficos
              </button>
              <button
                type="button"
                className={vistaResultado === 'tabla' ? 'active' : ''}
                onClick={() => setVistaResultado('tabla')}
              >
                <FileText size={14} /> Solo Tabla
              </button>
            </div>
          </div>

          {(vistaResultado === 'combinada' || vistaResultado === 'graficos') && renderGraficaSvg()}

          {reporte.truncado && (
            <p className="alert alert-warning" role="status">
              Se muestran las primeras {reporte.limite_filas} filas. Los totales incluyen todos los resultados.
            </p>
          )}

          {(vistaResultado === 'combinada' || vistaResultado === 'tabla') && (
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
                      <td colSpan={Math.max(1, columnasFiltradas.length)}>No hay resultados para los filtros aplicados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <p className="cu31-pie">
            Datos del sistema al generar la consulta
            {reporte.generado_en ? ` · ${new Date(reporte.generado_en).toLocaleString('es-BO', { timeZone: 'America/La_Paz' })}` : ''}
          </p>
        </section>
      )}

      {/* Modal de Impresión / PDF Dinámico */}
      {vistaImpresion && reporte && (
        <div className="cu31-modal-overlay" role="dialog" aria-modal="true">
          <div className="cu31-modal-paper">
            <div className="cu31-modal-toolbar no-print">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Printer size={18} />
                <strong>Exportación Dinámica PDF ({columnasFiltradas.length} columnas activas)</strong>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setVistaImpresion(null)}>
                  Cerrar
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => { if (typeof window !== 'undefined') window.print(); }}
                >
                  <Printer size={15} /> Imprimir / Guardar PDF
                </button>
              </div>
            </div>

            <div className="cu31-print-sheet">
              <div className="cu31-print-header">
                <div>
                  <h2>TELCOM TELECOMUNICACIONES</h2>
                  <p>NIT: 1029384756 — Santa Cruz de la Sierra, Bolivia</p>
                  <p>REPORTE INTELIGENTE PERSONALIZADO</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p><strong>Emisión:</strong> {vistaImpresion.fecha}</p>
                  <p><strong>Hora:</strong> {vistaImpresion.hora}</p>
                </div>
              </div>

              <div className="cu31-print-title">
                <h3>{reporte.titulo}</h3>
                <p>{reporte.resumen}</p>
              </div>

              <table className="cu31-print-table">
                <thead>
                  <tr>
                    {columnasFiltradas.map((c) => (
                      <th key={c.clave}>{c.etiqueta}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reporte.filas.map((fila, idx) => (
                    <tr key={idx}>
                      {columnasFiltradas.map((c) => (
                        <td key={c.clave}>{formatear(fila[c.clave], c.formato)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="cu31-print-footer">
                <span>Generado por TELCOM 2.0 — Reporte Inteligente IA</span>
                <span className="cu31-print-sign">Firma Responsable</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Panel integrado de Asistente Operativo NLP y Navegación Inteligente (CU30).
 */
function AsistenteOperativoPanel({ ctrl, onUsarEnReporte }) {
  const {
    texto,
    setTexto,
    escuchando,
    procesando,
    error,
    resultado,
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
  } = ctrl;

  const categorias = ['TODAS', ...Array.from(new Set(catalogo.map((c) => c.categoria).filter(Boolean)))];
  const catalogoFiltrado = filtroCategoria === 'TODAS'
    ? catalogo
    : catalogo.filter((c) => c.categoria === filtroCategoria);

  return (
    <div className="cu31-asistente-wrap">
      {error && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={18} /> <span>{error}</span>
        </div>
      )}

      <div className="cu31-asistente-hero">
        <button
          type="button"
          className={`cu31-asistente-mic ${escuchando ? 'listening' : ''}`}
          onClick={escuchando ? stopListening : startListening}
          title={escuchando ? 'Detener dictado' : 'Hablar con el Asistente'}
        >
          {escuchando ? <MicOff size={30} /> : <Mic size={30} />}
        </button>

        {escuchando ? (
          <div className="cu31-wave-wrap">
            <div className="cu31-sound-wave">
              <div className="cu31-sound-bar" />
              <div className="cu31-sound-bar" />
              <div className="cu31-sound-bar" />
              <div className="cu31-sound-bar" />
              <div className="cu31-sound-bar" />
            </div>
            <span className="cu31-listening-text">Escuchando orden operativa en vivo…</span>
          </div>
        ) : (
          <p className="cu31-asistente-hint">
            {vozSoportada
              ? 'Dicta o escribe una orden operativa (ej: "Ver servicios para corte", "Buscar cliente Juan", "Ir a pagos").'
              : 'Escribe tu orden operativa para navegar o consultar datos en vivo.'}
          </p>
        )}

        <form
          className="cu31-asistente-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleProcesar();
          }}
        >
          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            disabled={procesando}
            placeholder="Ej: Mostrar servicios para corte, Consultar routers en stock, Ver deuda del cliente..."
          />
          <button type="submit" className="btn btn-primary" disabled={procesando || !texto.trim()}>
            <Send size={15} />
            <span>{procesando ? 'Interpretando…' : 'Interpretar Orden'}</span>
          </button>
        </form>

        <div className="cu31-ejemplos-inline">
          <button type="button" className="cu31-chip-nlp" onClick={() => handleSeleccionarEjemplo('Mostrar servicios para corte')}>
            ✂️ Servicios para corte
          </button>
          <button type="button" className="cu31-chip-nlp" onClick={() => handleSeleccionarEjemplo('Buscar clientes activos de Zona Norte')}>
            👥 Clientes Zona Norte
          </button>
          <button type="button" className="cu31-chip-nlp" onClick={() => handleSeleccionarEjemplo('Historial de pagos recaudados hoy')}>
            💵 Ingresos de hoy
          </button>
          <button type="button" className="cu31-chip-nlp" onClick={() => handleSeleccionarEjemplo('Consultar routers en stock en inventario')}>
            📦 Stock de Routers
          </button>
          <button type="button" className="cu31-chip-nlp" onClick={() => handleSeleccionarEjemplo('Solicitudes de instalación pendientes')}>
            🛠️ Solicitudes Técnicas
          </button>
        </div>
      </div>

      {resultado && (
        <div className="cu31-nlp-result">
          <div className="cu31-nlp-meta">
            <div className="cu31-nlp-badges">
              <span className="cu31-badge-intent">{resultado.intencion_canonica}</span>
              <span className="badge badge-info">{resultado.categoria}</span>
              <span className="cu31-badge-engine">
                {resultado.motor === 'GEMINI_AI' ? '⚡ Gemini AI' : '⚙️ NLP Local'}
              </span>
              <span className="cu31-badge-conf">
                Confianza: {Math.round((resultado.confianza || 0) * 100)}%
              </span>
            </div>
            <span className="cu31-nlp-time">
              <Clock size={13} /> {resultado.tiempo_procesamiento} ms
            </span>
          </div>

          <div className="cu31-nlp-bubble">
            <strong><Sparkles size={15} /> Respuesta del Asistente:</strong>
            <p>{resultado.respuesta_asistente}</p>
          </div>

          {resultado.entidades && Object.keys(resultado.entidades).length > 0 && (
            <div className="cu31-nlp-entities">
              <span><Tag size={13} /> Entidades detectadas:</span>
              <div>
                {Object.entries(resultado.entidades).map(([k, v]) => (
                  <span key={k} className="cu31-entity-tag"><strong>{k}:</strong> {String(v)}</span>
                ))}
              </div>
            </div>
          )}

          {resultado.datos_en_vivo && (
            <div className="cu31-nlp-live">
              <strong><Database size={14} /> Datos en Vivo (TELCOM DB):</strong>
              <p>{resultado.datos_en_vivo.mensaje}</p>
            </div>
          )}

          <div className="cu31-nlp-actions">
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {resultado.accion_sugerida?.destino && (
                <button type="button" className="btn btn-primary" onClick={handleEjecutarAccion}>
                  <span>Ir a {resultado.accion_sugerida.modulo} ({resultado.accion_sugerida.destino})</span>
                  <ArrowRight size={15} />
                </button>
              )}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => onUsarEnReporte(resultado.texto_original || texto || resultado.respuesta_asistente)}
              >
                <BarChart2 size={15} /> Abrir en Reportes Dinámicos
              </button>
            </div>

            <div className="cu31-nlp-feedback">
              <span>¿Útil?</span>
              <button
                type="button"
                className={`btn btn-sm btn-secondary ${feedbackEnviado === 'positivo' ? 'is-good' : ''}`}
                disabled={feedbackEnviado !== null}
                onClick={() => handleFeedback(true)}
              >
                <ThumbsUp size={13} />
              </button>
              <button
                type="button"
                className={`btn btn-sm btn-secondary ${feedbackEnviado === 'negativo' ? 'is-bad' : ''}`}
                disabled={feedbackEnviado !== null}
                onClick={() => handleFeedback(false)}
              >
                <ThumbsDown size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Catálogo de capacidades NLP */}
      {catalogo.length > 0 && (
        <div className="cu31-catalog-panel">
          <div className="cu31-catalog-head">
            <h3><HelpCircle size={17} /> Capacidades del Asistente Operativo</h3>
            <div className="cu31-catalog-filters">
              {categorias.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={filtroCategoria === cat ? 'active' : ''}
                  onClick={() => setFiltroCategoria(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="cu31-catalog-grid">
            {catalogoFiltrado.map((item) => (
              <div key={item.intencion} className="cu31-catalog-card">
                <div className="cu31-catalog-card-top">
                  <strong>{item.label}</strong>
                  <span>{item.destino}</span>
                </div>
                <p>{item.descripcion}</p>
                {item.ejemplos?.[0] && (
                  <button
                    type="button"
                    className="cu31-try-btn"
                    onClick={() => handleSeleccionarEjemplo(item.ejemplos[0])}
                  >
                    Probar: “{item.ejemplos[0]}”
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Panel unificado de Historial y Auditoría de Comandos de Voz (CU29 + CU30).
 */
function HistorialVozPanel({
  historialVoz,
  historialNlp,
  cargando,
  onRefrescar,
  onEnviarAReporte,
  onEnviarAAsistente,
  puedeAsistente,
}) {
  return (
    <div className="cu31-history-panel">
      <div className="cu31-history-head">
        <div>
          <h3><History size={18} /> Bitácora Unificada de Voz e IA</h3>
          <p>Registro auditado de comandos dictados por micrófono e intenciones procesadas.</p>
        </div>
        <button type="button" className="btn btn-sm btn-secondary" onClick={onRefrescar} disabled={cargando}>
          <RefreshCw size={14} className={cargando ? 'spin' : ''} /> Actualizar
        </button>
      </div>

      <div className="cu31-tabla">
        <table>
          <thead>
            <tr>
              <th>Fecha / Hora</th>
              <th>Origen</th>
              <th>Comando / Texto</th>
              <th>Intención</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {historialVoz.length === 0 && (!historialNlp || historialNlp.length === 0) ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1.5rem' }}>
                  No hay comandos registrados todavía. Prueba dictar un reporte o una consulta operativa.
                </td>
              </tr>
            ) : (
              <>
                {historialVoz.map((h) => (
                  <tr key={`voz-${h.id}`}>
                    <td>{h.fechaHora || '-'}</td>
                    <td><span className="cu31-badge-engine">Voz (CU29)</span></td>
                    <td><strong>“{h.texto}”</strong></td>
                    <td><span className="cu31-badge-intent">{h.intencion || 'CONSULTA'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <button type="button" className="btn btn-sm btn-primary" onClick={() => onEnviarAReporte(h.texto)}>
                          Usar en Reporte
                        </button>
                        {puedeAsistente && (
                          <button type="button" className="btn btn-sm btn-secondary" onClick={() => onEnviarAAsistente(h.texto)}>
                            Asistente
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {(historialNlp || []).map((n, idx) => (
                  <tr key={`nlp-${n.id || idx}`}>
                    <td>{n.created_at || n.fecha || '-'}</td>
                    <td><span className="cu31-badge-conf">NLP (CU30)</span></td>
                    <td><strong>“{n.textoEntrada || n.texto || '-'}”</strong></td>
                    <td><span className="cu31-badge-intent">{n.intencionCanonica || n.intencion || 'NLP'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => onEnviarAReporte(n.textoEntrada || n.texto || '')}
                        >
                          Usar en Reporte
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
