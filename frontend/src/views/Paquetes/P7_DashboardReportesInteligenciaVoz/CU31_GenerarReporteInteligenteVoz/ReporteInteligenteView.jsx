import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileBarChart, RefreshCw, Mic, MicOff, Volume2, Square, Download, Printer,
  SlidersHorizontal, BarChart2, Sparkles, Check, Brain, Send, History,
  Clock, Database, Tag, ArrowRight, ThumbsUp, ThumbsDown, LayoutGrid, FileText,
  AlertCircle, CheckCircle2, HelpCircle, RotateCcw, Trash2, ArrowUp, ArrowDown,
  Layers, PlusCircle,
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

function crearBloque(datos, secuencia) {
  return {
    uid: `${datos.reporte.tipo}-${secuencia}-${datos.reporte.generado_en || 'local'}`,
    datos,
    columnasVisibles: datos.reporte.columnas.map((c) => c.clave),
    mostrarSelectorCols: false,
    vistaResultado: 'combinada',
    comandoColumna: '',
    feedbackCopiloto: null,
  };
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

  const enNavegador = typeof window !== 'undefined';

  return (
    <div className="view-panel cu31-view">
      {/* Encabezado Unificado Senior */}
      <header className="cu31-unified-header">
        <div className="cu31-header-main">
          <span className="cu31-senior-badge">
            <Sparkles size={14} /> Centro de Inteligencia Artificial Gemini y Voz
          </span>
          <h2>
            <FileBarChart size={26} aria-hidden="true" /> Reporte Inteligente
          </h2>
          <p className="subtitle">
            Consulta en lenguaje natural con IA, arma tu reporte por bloques acumulables, quita o elige columnas y exporta todo en Excel o PDF.
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

      {tabActiva === 'reportes' && (
        <ReporteInteligenteContenido
          {...controlador}
          onVozDictado={registrarDictadoVoz}
        />
      )}

      {tabActiva === 'asistente' && puedeAsistente && (
        <AsistenteOperativoPanel
          ctrl={asistenteCtrl}
          onUsarEnReporte={(texto) => {
            controlador.setComando(texto);
            setTabActiva('reportes');
          }}
        />
      )}

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
 * Contenido principal con Constructor de Bloques Acumulables para Exportación (exportado para tests SSR).
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
  // Constructor de bloques acumulables: ajusta estado cuando llega una nueva consulta exitosa
  const [bloques, setBloques] = useState(() => (datos?.reporte ? [crearBloque(datos, 1)] : []));
  const [prevDatos, setPrevDatos] = useState(datos);
  const [secuenciaBloque, setSecuenciaBloque] = useState(() => (datos?.reporte ? 2 : 1));
  const [modoAcumulativo, setModoAcumulativo] = useState(true);

  if (datos !== prevDatos) {
    setPrevDatos(datos);
    if (datos?.reporte) {
      const nuevo = crearBloque(datos, secuenciaBloque);
      setSecuenciaBloque((s) => s + 1);
      setBloques((prev) => (modoAcumulativo ? [...prev, nuevo] : [nuevo]));
    } else if (!modoAcumulativo) {
      setBloques([]);
    }
  }

  // Estados de micrófono principal, TTS y modal PDF unificado
  const [escuchandoVoz, setEscuchandoVoz] = useState(false);
  const [segundosGrabando, setSegundosGrabando] = useState(0);
  const [avisoVoz, setAvisoVoz] = useState(null);
  const [audioBloqueUid, setAudioBloqueUid] = useState(null);
  const [copilotoMicUid, setCopilotoMicUid] = useState(null);
  const [pdfConfig, setPdfConfig] = useState(null); // { bloques: [...], fecha, hora }

  const recognitionRef = useRef(null);
  const colRecognitionRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(0);

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

  const actualizarBloque = (uid, updater) => {
    setBloques((prev) => prev.map((b) => (b.uid === uid ? (typeof updater === 'function' ? updater(b) : { ...b, ...updater }) : b)));
  };

  const eliminarBloque = (uid) => {
    setBloques((prev) => prev.filter((b) => b.uid !== uid));
    if (audioBloqueUid === uid) detenerAudio();
  };

  const moverBloque = (index, direccion) => {
    setBloques((prev) => {
      const destino = index + direccion;
      if (destino < 0 || destino >= prev.length) return prev;
      const copia = [...prev];
      const [item] = copia.splice(index, 1);
      copia.splice(destino, 0, item);
      return copia;
    });
  };

  // Reconocimiento de voz principal
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

  // Síntesis de voz (TTS) por bloque
  const reproducirResumenVoz = (uid, texto) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'es-BO';
    utterance.rate = 1.0;
    utterance.onstart = () => setAudioBloqueUid(uid);
    utterance.onend = () => setAudioBloqueUid(null);
    utterance.onerror = () => setAudioBloqueUid(null);
    window.speechSynthesis.speak(utterance);
  };

  const detenerAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setAudioBloqueUid(null);
  };

  // Exportación a Excel (.csv BOM UTF-8) de uno o varios bloques
  const exportarBloquesExcel = (listaBloques, nombreArchivo = null) => {
    if (typeof window === 'undefined' || !listaBloques?.length) return;
    const lineas = ['\uFEFF'];
    lineas.push(`"TELCOM 2.0 - REPORTE INTELIGENTE COMPUESTO (${listaBloques.length} BLOQUE(S))"\n`);
    lineas.push(`"Fecha de emisión: ${new Date().toLocaleString('es-BO')}"\n\n`);

    listaBloques.forEach((bloque, idx) => {
      const rep = bloque.datos.reporte;
      const cols = rep.columnas.filter((c) => bloque.columnasVisibles.includes(c.clave));
      if (!cols.length) return;

      lineas.push(`"=== BLOQUE #${idx + 1}: ${rep.titulo} ==="\n`);
      lineas.push(`"Resumen: ${String(rep.resumen || '').replace(/"/g, '""')}"\n`);
      if (rep.totales?.length) {
        const totTxt = rep.totales.map((t) => `${t.etiqueta}: ${formatear(t.valor, t.formato)}`).join(' | ');
        lineas.push(`"Totales: ${totTxt.replace(/"/g, '""')}"\n`);
      }

      lineas.push(cols.map((c) => `"${c.etiqueta}"`).join(';') + '\n');
      rep.filas.forEach((fila) => {
        const vals = cols.map((c) => {
          const v = fila[c.clave];
          return `"${v !== null && v !== undefined ? String(v).replace(/"/g, '""') : '-'}"`;
        });
        lineas.push(vals.join(';') + '\n');
      });
      lineas.push('\n');
    });

    const blob = new Blob(lineas, { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo || `TELCOM_Reporte_Inteligente_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  };

  const abrirPdfBloques = (listaBloques) => {
    const ahora = new Date();
    setPdfConfig({
      bloques: listaBloques,
      fecha: ahora.toLocaleDateString('es-BO'),
      hora: ahora.toLocaleTimeString('es-BO'),
    });
  };

  // Toggle manual y presets de columnas dentro de un bloque
  const toggleColumnaBloque = (bloque, clave) => {
    const prev = bloque.columnasVisibles;
    let next;
    if (prev.includes(clave)) {
      if (prev.length === 1) return;
      next = prev.filter((k) => k !== clave);
    } else {
      next = [...prev, clave];
    }
    actualizarBloque(bloque.uid, { columnasVisibles: next });
  };

  const aplicarPresetBloque = (bloque, preset) => {
    const cols = bloque.datos.reporte.columnas;
    if (preset === 'todas') {
      actualizarBloque(bloque.uid, { columnasVisibles: cols.map((c) => c.clave) });
      return;
    }
    if (preset === 'numericas') {
      const nums = cols.filter((c) => c.formato === 'entero' || c.formato === 'moneda').map((c) => c.clave);
      const primera = cols[0]?.clave;
      const comb = primera && !nums.includes(primera) ? [primera, ...nums] : nums;
      if (comb.length > 0) actualizarBloque(bloque.uid, { columnasVisibles: comb });
      return;
    }
    if (preset === 'texto') {
      const txts = cols.filter((c) => c.formato !== 'entero' && c.formato !== 'moneda').map((c) => c.clave);
      if (txts.length > 0) actualizarBloque(bloque.uid, { columnasVisibles: txts });
    }
  };

  // Copiloto por voz o texto para columnas y exportación de un bloque específico
  const procesarComandoBloque = (bloque, rawCmd) => {
    const cmd = normalizarTexto(rawCmd);
    if (!cmd) return;

    const todasLasCols = bloque.datos.reporte.columnas;
    let nuevasVisibles = [...bloque.columnasVisibles];
    let mensaje = '';

    if (cmd.includes('todas las columnas') || cmd === 'todas' || cmd.includes('mostrar todo')) {
      nuevasVisibles = todasLasCols.map((c) => c.clave);
      mensaje = 'Mostrando todas las columnas de este bloque.';
    } else {
      const coincidentes = todasLasCols.filter((col) => {
        const claveNorm = normalizarTexto(col.clave.replace(/_/g, ' '));
        const etiqNorm = normalizarTexto(col.etiqueta);
        const tokens = [...claveNorm.split(/\s+/), ...etiqNorm.split(/\s+/)].filter((t) => t.length >= 3);
        return cmd.includes(claveNorm) || cmd.includes(etiqNorm) || tokens.some((t) => cmd.includes(t));
      }).map((c) => c.clave);

      if (cmd.includes('ocultar') || cmd.includes('quitar') || cmd.includes('sin ') || cmd.includes('excluir')) {
        if (coincidentes.length > 0) {
          const filtradas = bloque.columnasVisibles.filter((k) => !coincidentes.includes(k));
          if (filtradas.length > 0) {
            nuevasVisibles = filtradas;
            mensaje = `Columnas ocultadas (${coincidentes.length}).`;
          } else {
            mensaje = 'Debe quedar al menos una columna visible.';
          }
        }
      } else if (coincidentes.length > 0) {
        nuevasVisibles = coincidentes;
        mensaje = `Mostrando ${coincidentes.length} columna(s) especificadas.`;
      }
    }

    const bloqueActualizado = { ...bloque, columnasVisibles: nuevasVisibles };

    if (cmd.includes('excel') || cmd.includes('csv')) {
      exportarBloquesExcel([bloqueActualizado]);
      mensaje = `${mensaje ? `${mensaje} ` : ''}Excel exportado para este bloque.`;
    } else if (cmd.includes('pdf') || cmd.includes('imprimir')) {
      abrirPdfBloques([bloqueActualizado]);
      mensaje = `${mensaje ? `${mensaje} ` : ''}Vista previa PDF abierta.`;
    }

    if (!mensaje) {
      mensaje = 'Indica columnas del bloque (ej. "solo cliente y plan", "ocultar ci") o "exportar pdf/excel".';
    }

    actualizarBloque(bloque.uid, {
      columnasVisibles: nuevasVisibles,
      feedbackCopiloto: mensaje,
    });
  };

  const toggleMicCopiloto = (bloque) => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      actualizarBloque(bloque.uid, { feedbackCopiloto: 'Tu navegador no soporta micrófono; escribe el comando en el campo.' });
      return;
    }

    if (copilotoMicUid === bloque.uid && colRecognitionRef.current) {
      try { colRecognitionRef.current.stop(); } catch {}
      setCopilotoMicUid(null);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.lang = 'es-BO';
      rec.continuous = false;
      rec.interimResults = false;

      rec.onstart = () => setCopilotoMicUid(bloque.uid);
      rec.onresult = (event) => {
        const text = event.results[0][0].transcript;
        actualizarBloque(bloque.uid, { comandoColumna: text });
        procesarComandoBloque(bloque, text);
        if (onVozDictado) onVozDictado(text, 0);
        setCopilotoMicUid(null);
      };
      rec.onerror = () => setCopilotoMicUid(null);
      rec.onend = () => setCopilotoMicUid(null);

      colRecognitionRef.current = rec;
      rec.start();
    } catch {
      setCopilotoMicUid(null);
    }
  };

  const renderGraficaBloque = (reporte) => {
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

  return (
    <>
      <form className="cu31-solicitud" aria-busy={loading} onSubmit={(event) => { event.preventDefault(); void generar(); }}>
        <div className="cu31-label-row">
          <label htmlFor="cu31-comando">Solicitud o comando transcrito</label>
          <div className="cu31-top-controls">
            <label className="cu31-accumulate-toggle" title="Si está activo, cada nueva consulta se agrega como un bloque nuevo para armar tu exportación compuesta">
              <input
                type="checkbox"
                checked={modoAcumulativo}
                onChange={(e) => setModoAcumulativo(e.target.checked)}
              />
              <span>Acumular en bloques ({bloques.length})</span>
            </label>

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
          placeholder={escuchandoVoz ? 'Escuchando tu dictado de voz en tiempo real…' : 'Ej: Clientes de la Villa Primero de Mayo y sus planes, Ingresos de este mes, Clientes en mora...'}
        />

        {avisoVoz && (
          <div className="cu31-voice-notice" role="status">
            <AlertCircle size={15} />
            <span>{avisoVoz}</span>
          </div>
        )}

        <div className="cu31-acciones">
          <p id="cu31-ayuda">
            {modoAcumulativo
              ? 'Cada consulta con Gemini AI se agregará como un bloque independiente para que quites o combines lo que quieras exportar.'
              : 'Cada consulta reemplazará el bloque actual.'}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {comando && !loading && (
              <button type="button" className="btn btn-secondary" onClick={() => setComando('')}>
                <RotateCcw size={15} /> Limpiar
              </button>
            )}
            <button className="btn btn-primary" type="submit" disabled={loading || !comando.trim()}>
              {loading ? <RefreshCw size={17} className="spin" aria-hidden="true" /> : <PlusCircle size={17} aria-hidden="true" />}
              {loading
                ? 'Generando reporte…'
                : (modoAcumulativo && bloques.length > 0 ? 'Agregar Bloque con IA' : 'Generar reporte con IA')}
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

      {loading && <p className="cu31-estado" role="status">Interpretando solicitud con Gemini AI y consultando TELCOM…</p>}
      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      {/* Barra Global del Lienzo de Bloques Exportables */}
      {bloques.length > 0 && (
        <div className="cu31-composer-bar">
          <div className="cu31-composer-info">
            <Layers size={20} className="cu31-composer-icon" />
            <div>
              <strong>Lienzo de Exportación Compuesto ({bloques.length} {bloques.length === 1 ? 'bloque' : 'bloques'})</strong>
              <span>Sigue consultando para aumentar más bloques, o quita columnas/bloques antes de exportar.</span>
            </div>
          </div>

          <div className="cu31-composer-actions">
            <button
              type="button"
              className="btn btn-sm btn-success"
              onClick={() => exportarBloquesExcel(bloques)}
            >
              <Download size={15} /> Exportar Todo Excel ({bloques.length})
            </button>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => abrirPdfBloques(bloques)}
            >
              <Printer size={15} /> Exportar Todo PDF ({bloques.length})
            </button>
            <button
              type="button"
              className="btn btn-sm btn-danger"
              onClick={() => setBloques([])}
              title="Vaciar todos los bloques del lienzo"
            >
              <Trash2 size={15} /> Vaciar Lienzo
            </button>
          </div>
        </div>
      )}

      {/* Renderizado de Cada Bloque del Reporte */}
      {bloques.map((bloque, idx) => {
        const rep = bloque.datos.reporte;
        const interp = bloque.datos.interpretacion;
        const filtros = Object.entries(interp?.filtros || {});
        const colsActivas = rep.columnas.filter((c) => (
          bloque.columnasVisibles.length > 0 ? bloque.columnasVisibles.includes(c.clave) : true
        ));
        const reproduciendoEste = audioBloqueUid === bloque.uid;
        const escuchandoEsteMic = copilotoMicUid === bloque.uid;

        return (
          <section
            key={bloque.uid}
            className="cu31-resultado cu31-block-card"
            aria-labelledby={`cu31-titulo-${idx}`}
            aria-live="polite"
          >
            {/* Cabecera del Bloque con Orden y Eliminación */}
            <div className="cu31-block-topbar">
              <div className="cu31-block-badge-group">
                <span className="cu31-block-num">Bloque #{idx + 1}</span>
                <span className="cu31-block-origin">
                  {interp.origen === 'estructurada' ? 'Intención recibida' : 'Interpretada con Gemini'}
                </span>
              </div>

              <div className="cu31-block-controls">
                <button
                  type="button"
                  className="btn-icon-cu31"
                  onClick={() => moverBloque(idx, -1)}
                  disabled={idx === 0}
                  title="Subir bloque"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  className="btn-icon-cu31"
                  onClick={() => moverBloque(idx, 1)}
                  disabled={idx === bloques.length - 1}
                  title="Bajar bloque"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  className="btn-icon-cu31 danger"
                  onClick={() => eliminarBloque(bloque.uid)}
                  title="Quitar este bloque del reporte"
                >
                  <Trash2 size={14} /> Quitar bloque
                </button>
              </div>
            </div>

            <div className="cu31-interpretacion">
              <strong>Solicitud interpretada:</strong> {rep.titulo}
              <span>Tipo: <code>{interp.tipo}</code></span>
              <span>{interp.origen === 'estructurada' ? 'Intención recibida' : 'Interpretada con Gemini'}</span>
              <dl>
                {filtros.length ? filtros.map(([clave, valor]) => (
                  <div key={clave}><dt>{clave.replaceAll('_', ' ')}</dt><dd>{String(valor)}</dd></div>
                )) : <div><dt>Filtros</dt><dd>Sin filtros adicionales</dd></div>}
              </dl>
            </div>

            <div className="cu31-title-row">
              <h3 id={`cu31-titulo-${idx}`}>{rep.titulo}</h3>
              <div className="cu31-header-actions">
                {reproduciendoEste ? (
                  <button type="button" className="btn btn-sm btn-danger" onClick={detenerAudio}>
                    <Square size={14} /> Detener Audio
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-sm btn-success"
                    onClick={() => reproducirResumenVoz(bloque.uid, rep.resumen)}
                  >
                    <Volume2 size={14} /> Escuchar Síntesis
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => actualizarBloque(bloque.uid, { mostrarSelectorCols: !bloque.mostrarSelectorCols })}
                >
                  <SlidersHorizontal size={14} /> Columnas ({colsActivas.length}/{rep.columnas.length})
                </button>

                <button
                  type="button"
                  className="btn btn-sm btn-success"
                  onClick={() => exportarBloquesExcel([bloque])}
                  disabled={!rep.filas || rep.filas.length === 0}
                  title="Exportar solo este bloque a Excel"
                >
                  <Download size={14} /> Excel
                </button>

                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => abrirPdfBloques([bloque])}
                  disabled={!rep.filas || rep.filas.length === 0}
                  title="Exportar solo este bloque a PDF"
                >
                  <Printer size={14} /> PDF
                </button>
              </div>
            </div>

            <p className="cu31-resumen">{rep.resumen}</p>

            {/* Selector de Columnas por Voz, Texto y Clics */}
            {bloque.mostrarSelectorCols && (
              <div className="cu31-cols-selector">
                <div className="cu31-copilot-bar">
                  <div className="cu31-copilot-input-group">
                    <button
                      type="button"
                      className={`btn-mic-cu31-sm ${escuchandoEsteMic ? 'listening' : ''}`}
                      onClick={() => toggleMicCopiloto(bloque)}
                      title="Dictar qué columnas mostrar o quitar"
                    >
                      {escuchandoEsteMic ? <MicOff size={15} /> : <Mic size={15} />}
                    </button>
                    <input
                      type="text"
                      value={bloque.comandoColumna}
                      onChange={(e) => actualizarBloque(bloque.uid, { comandoColumna: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          procesarComandoBloque(bloque, bloque.comandoColumna);
                        }
                      }}
                      placeholder="Ej: 'solo cliente y plan', 'ocultar ci', 'todas', 'exportar pdf'..."
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => procesarComandoBloque(bloque, bloque.comandoColumna)}
                    >
                      Aplicar
                    </button>
                  </div>

                  <div className="cu31-presets">
                    <button type="button" className="cu31-preset-btn" onClick={() => aplicarPresetBloque(bloque, 'todas')}>Todas</button>
                    <button type="button" className="cu31-preset-btn" onClick={() => aplicarPresetBloque(bloque, 'numericas')}>Solo Numéricas</button>
                    <button type="button" className="cu31-preset-btn" onClick={() => aplicarPresetBloque(bloque, 'texto')}>Solo Texto</button>
                  </div>
                </div>

                {bloque.feedbackCopiloto && (
                  <div className="cu31-copilot-feedback">
                    <CheckCircle2 size={14} />
                    <span>{bloque.feedbackCopiloto}</span>
                  </div>
                )}

                <div className="cu31-cols-pills">
                  {rep.columnas.map((col) => {
                    const activa = bloque.columnasVisibles.includes(col.clave);
                    return (
                      <button
                        key={col.clave}
                        type="button"
                        className={`cu31-col-pill ${activa ? 'active' : ''}`}
                        onClick={() => toggleColumnaBloque(bloque, col.clave)}
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
              {rep.totales.map((total) => (
                <div key={total.clave}>
                  <span>{total.etiqueta}</span>
                  <strong>{formatear(total.valor, total.formato)}</strong>
                </div>
              ))}
            </div>

            {/* Toggle de Visualización por Bloque */}
            <div className="cu31-view-bar">
              <span>Visualización del bloque:</span>
              <div className="cu31-view-pills">
                <button
                  type="button"
                  className={bloque.vistaResultado === 'combinada' ? 'active' : ''}
                  onClick={() => actualizarBloque(bloque.uid, { vistaResultado: 'combinada' })}
                >
                  <LayoutGrid size={14} /> Combinada
                </button>
                <button
                  type="button"
                  className={bloque.vistaResultado === 'graficos' ? 'active' : ''}
                  onClick={() => actualizarBloque(bloque.uid, { vistaResultado: 'graficos' })}
                >
                  <BarChart2 size={14} /> Solo Gráficos
                </button>
                <button
                  type="button"
                  className={bloque.vistaResultado === 'tabla' ? 'active' : ''}
                  onClick={() => actualizarBloque(bloque.uid, { vistaResultado: 'tabla' })}
                >
                  <FileText size={14} /> Solo Tabla
                </button>
              </div>
            </div>

            {(bloque.vistaResultado === 'combinada' || bloque.vistaResultado === 'graficos') && renderGraficaBloque(rep)}

            {rep.truncado && (
              <p className="alert alert-warning" role="status">
                Se muestran las primeras {rep.limite_filas} filas. Los totales incluyen todos los resultados.
              </p>
            )}

            {(bloque.vistaResultado === 'combinada' || bloque.vistaResultado === 'tabla') && (
              <div className="cu31-tabla">
                <table>
                  <caption>{rep.titulo}</caption>
                  <thead>
                    <tr>
                      {colsActivas.map((columna) => (
                        <th scope="col" key={columna.clave}>{columna.etiqueta}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rep.filas.length ? rep.filas.map((fila, indice) => (
                      <tr key={indice}>
                        {colsActivas.map((columna) => (
                          <td key={columna.clave}>
                            {formatear(fila[columna.clave], columna.formato)}
                          </td>
                        ))}
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={Math.max(1, colsActivas.length)}>No hay resultados para los filtros aplicados.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <p className="cu31-pie">
              Datos del sistema al generar la consulta
              {rep.generado_en ? ` · ${new Date(rep.generado_en).toLocaleString('es-BO', { timeZone: 'America/La_Paz' })}` : ''}
            </p>
          </section>
        );
      })}

      {/* Modal PDF Compuesto (1 o N Bloques) */}
      {pdfConfig && pdfConfig.bloques?.length > 0 && (
        <div className="cu31-modal-overlay" role="dialog" aria-modal="true">
          <div className="cu31-modal-paper">
            <div className="cu31-modal-toolbar no-print">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Printer size={18} />
                <strong>Exportación Oficial PDF ({pdfConfig.bloques.length} {pdfConfig.bloques.length === 1 ? 'bloque' : 'bloques'})</strong>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setPdfConfig(null)}>
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
                  <p>INFORME INTELIGENTE PERSONALIZADO</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p><strong>Emisión:</strong> {pdfConfig.fecha}</p>
                  <p><strong>Hora:</strong> {pdfConfig.hora}</p>
                  <p><strong>Bloques:</strong> {pdfConfig.bloques.length}</p>
                </div>
              </div>

              {pdfConfig.bloques.map((bloque, idx) => {
                const rep = bloque.datos.reporte;
                const cols = rep.columnas.filter((c) => bloque.columnasVisibles.includes(c.clave));
                return (
                  <div key={bloque.uid} className="cu31-print-block">
                    <div className="cu31-print-title">
                      <h3>{idx + 1}. {rep.titulo}</h3>
                      <p>{rep.resumen}</p>
                      {rep.totales?.length > 0 && (
                        <p className="cu31-print-kpis">
                          {rep.totales.map((t) => `${t.etiqueta}: ${formatear(t.valor, t.formato)}`).join(' · ')}
                        </p>
                      )}
                    </div>

                    <table className="cu31-print-table">
                      <thead>
                        <tr>
                          {cols.map((c) => (
                            <th key={c.clave}>{c.etiqueta}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rep.filas.length ? rep.filas.map((fila, fIdx) => (
                          <tr key={fIdx}>
                            {cols.map((c) => (
                              <td key={c.clave}>{formatear(fila[c.clave], c.formato)}</td>
                            ))}
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={Math.max(1, cols.length)}>Sin resultados.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                );
              })}

              <div className="cu31-print-footer">
                <span>Generado por TELCOM 2.0 — Reporte Inteligente IA Gemini</span>
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
