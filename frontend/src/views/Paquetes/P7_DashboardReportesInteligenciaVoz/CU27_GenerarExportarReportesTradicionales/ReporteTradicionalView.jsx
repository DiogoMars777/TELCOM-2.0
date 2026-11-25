import React, { useState, useEffect, useRef } from 'react';
import {
  FileText, Users, CreditCard, AlertTriangle, HardDrive, Download,
  Printer, Filter, RefreshCw, Search, Calendar, CheckCircle2, AlertCircle, X, MapPin,
  Mic, MicOff, Volume2, Square, Sparkles, SlidersHorizontal, BarChart2,
  PieChart, LayoutGrid, CheckSquare, Eye, ArrowRight, Bot,
} from 'lucide-react';
import { useReporteTradicionalController } from '../../../../controllers/Paquetes/P7_DashboardReportesInteligenciaVoz/CU27_GenerarExportarReportesTradicionales/useReporteTradicionalController.js';
import ReporteInteligenteView from '../CU31_GenerarReporteInteligenteVoz/ReporteInteligenteView.jsx';
import './ReporteTradicionalView.css';

const ICON_MAP = {
  Users,
  CreditCard,
  AlertTriangle,
  HardDrive,
};

const formatMoneda = (val) => new Intl.NumberFormat('es-BO', {
  style: 'currency', currency: 'BOB', minimumFractionDigits: 2,
}).format(Number(val || 0));

export default function ReporteTradicionalView({ user, initialTipo = 'clientes_zona', initialFilters = {} }) {
  const {
    catalogo,
    tipoReporte,
    parametros,
    diccionarioColumnas,
    columnasSeleccionadas,
    analisisIa,
    cargandoIa,
    reproduciendoAudio,
    filtros,
    resultado,
    loading,
    exporting,
    error,
    mensajeExito,
    vistaImpresion,
    vistaActiva,
    setVistaActiva,
    seleccionarTipoReporte,
    cambiarFiltro,
    limpiarFiltros,
    toggleColumna,
    seleccionarTodasColumnas,
    seleccionarPresetColumnas,
    ejecutarAnalisisIa,
    reproducirAudioNarrativa,
    detenerAudioNarrativa,
    procesarComandoVozEscritura,
    handleGenerarReporte,
    handleExportarExcel,
    handleExportarPdf,
    cerrarVistaImpresion,
    dispararImpresionNativa,
  } = useReporteTradicionalController(initialTipo, initialFilters);

  // Modo unificado: Tradicional Dinámico vs Inteligente con Voz (CU31)
  const [modoReporte, setModoReporte] = useState('tradicional'); // 'tradicional' | 'inteligente'

  // Estado del Copiloto por Voz / Texto
  const [textoComando, setTextoComando] = useState('');
  const [escuchandoVoz, setEscuchandoVoz] = useState(false);
  const [mostrarSelectorColumnas, setMostrarSelectorColumnas] = useState(true);

  const recognitionRef = useRef(null);

  // Inicializar Web Speech Recognition si está soportado
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'es-BO';
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setTextoComando(transcript);
        procesarComandoVozEscritura(transcript);
        setEscuchandoVoz(false);
      };

      recognition.onerror = () => {
        setEscuchandoVoz(false);
      };

      recognition.onend = () => {
        setEscuchandoVoz(false);
      };

      recognitionRef.current = recognition;
    }
  }, [tipoReporte, resultado]);

  const toggleEscuchaVoz = () => {
    if (!recognitionRef.current) {
      alert('El reconocimiento de voz por micrófono no está soportado en este navegador. Puedes escribir el comando directamente en el campo de texto.');
      return;
    }

    if (escuchandoVoz) {
      recognitionRef.current.stop();
      setEscuchandoVoz(false);
    } else {
      setTextoComando('');
      try {
        recognitionRef.current.start();
        setEscuchandoVoz(true);
      } catch {
        setEscuchandoVoz(false);
      }
    }
  };

  const submitComandoTexto = (e) => {
    e.preventDefault();
    if (!textoComando.trim()) return;
    procesarComandoVozEscritura(textoComando);
  };

  const columnasActuales = diccionarioColumnas[tipoReporte] || {};

  // Componente de Gráficos Estadísticos Dinámicos
  const renderGraficosDinamicos = () => {
    if (!resultado || !resultado.registros || resultado.registros.length === 0) return null;

    if (tipoReporte === 'clientes_zona') {
      // Agrupación por Zona
      const zonasMap = {};
      resultado.registros.forEach((r) => {
        const z = r.nombreZona || 'Sin Zona';
        zonasMap[z] = (zonasMap[z] || 0) + 1;
      });
      const maxZ = Math.max(...Object.values(zonasMap), 1);

      return (
        <div className="cu27-charts-grid">
          <div className="cu27-chart-card">
            <h4><BarChart2 size={18} /> Clientes por Zona de Cobertura</h4>
            <div className="cu27-bars-container">
              {Object.entries(zonasMap).map(([zona, cant]) => {
                const pct = Math.round((cant / maxZ) * 100);
                return (
                  <div className="cu27-bar-item" key={zona}>
                    <div className="cu27-bar-label-row">
                      <span>{zona}</span>
                      <strong>{cant} clientes</strong>
                    </div>
                    <div className="cu27-bar-track">
                      <div className="cu27-bar-fill" style={{ width: `${pct}%`, background: 'var(--primary, #0ea5e9)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="cu27-chart-card">
            <h4><PieChart size={18} /> Proporción de Estados de Abonados</h4>
            <div className="cu27-donut-wrap">
              <div className="cu27-donut-stats">
                <div className="stat-pill active">
                  <span className="dot" style={{ background: '#22c55e' }} />
                  <span>Activos: {resultado.kpis.clientes_activos}</span>
                </div>
                <div className="stat-pill inactive">
                  <span className="dot" style={{ background: '#ef4444' }} />
                  <span>Inactivos: {resultado.kpis.clientes_inactivos}</span>
                </div>
                <div className="stat-pill total">
                  <span className="dot" style={{ background: '#38bdf8' }} />
                  <span>Total Servicios: {resultado.kpis.servicios_activos}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (tipoReporte === 'ingresos_pagos') {
      // Agrupación por Método de Pago
      const metodosMap = {};
      resultado.registros.forEach((r) => {
        const m = r.nombreMetodo || 'Otro';
        metodosMap[m] = (metodosMap[m] || 0) + Number(r.montoTotal || 0);
      });
      const totalRec = resultado.kpis.total_recaudado || 1;

      return (
        <div className="cu27-charts-grid">
          <div className="cu27-chart-card">
            <h4><BarChart2 size={18} /> Recaudación por Canal de Cobro (Bs.)</h4>
            <div className="cu27-bars-container">
              {Object.entries(metodosMap).map(([metodo, monto]) => {
                const pct = Math.round((monto / totalRec) * 100);
                return (
                  <div className="cu27-bar-item" key={metodo}>
                    <div className="cu27-bar-label-row">
                      <span>{metodo} ({pct}%)</span>
                      <strong>{formatMoneda(monto)}</strong>
                    </div>
                    <div className="cu27-bar-track">
                      <div className="cu27-bar-fill" style={{ width: `${pct}%`, background: '#22c55e' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    if (tipoReporte === 'morosidad_cortes') {
      return (
        <div className="cu27-charts-grid">
          <div className="cu27-chart-card">
            <h4><AlertTriangle size={18} /> Cartera en Riesgo vs Facturas en Mora</h4>
            <div className="cu27-donut-stats">
              <div className="stat-pill danger">
                <span className="dot" style={{ background: '#ef4444' }} />
                <span>Deuda Total: {formatMoneda(resultado.kpis.total_deuda)}</span>
              </div>
              <div className="stat-pill warning">
                <span className="dot" style={{ background: '#f59e0b' }} />
                <span>Facturas en Mora: {resultado.kpis.facturas_en_mora}</span>
              </div>
              <div className="stat-pill total">
                <span className="dot" style={{ background: '#6366f1' }} />
                <span>Abonados en Riesgo: {resultado.kpis.clientes_con_deuda}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // Si el usuario cambia al modo inteligente puro de CU31
  if (modoReporte === 'inteligente') {
    return (
      <div className="cu27-container">
        <div className="cu27-mode-switcher">
          <button
            type="button"
            className="mode-btn"
            onClick={() => setModoReporte('tradicional')}
          >
            <FileText size={16} /> Modo Reportes Tradicionales Dinámicos
          </button>
          <button
            type="button"
            className="mode-btn active"
            onClick={() => setModoReporte('inteligente')}
          >
            <Bot size={16} /> Modo Asistente Inteligente IA (CU31)
          </button>
        </div>
        <ReporteInteligenteView user={user} />
      </div>
    );
  }

  return (
    <div className="cu27-container">
      {/* Switcher de Modo de Reportes */}
      <div className="cu27-mode-switcher">
        <button
          type="button"
          className="mode-btn active"
          onClick={() => setModoReporte('tradicional')}
        >
          <FileText size={16} /> Reportes Dinámicos & Analítica (CU27)
        </button>
        <button
          type="button"
          className="mode-btn"
          onClick={() => setModoReporte('inteligente')}
        >
          <Bot size={16} /> Asistente Inteligente IA / Voz (CU31)
        </button>
      </div>

      {/* Encabezado Principal */}
      <header className="cu27-header">
        <div className="cu27-header-top">
          <div>
            <span className="cu27-badge">
              <Sparkles size={14} /> Reportes Dinámicos con Control por Voz e IA
            </span>
            <h1 className="cu27-title">Generador de Reportes Dinámicos</h1>
            <p className="cu27-subtitle">
              Consolide métricas, configure columnas para exportación mediante voz o texto y genere análisis ejecutivos con IA.
            </p>
          </div>
          <div className="cu27-header-meta">
            <span className="badge-status badge-activo">Administrador Senior</span>
          </div>
        </div>
      </header>

      {/* Barra Copiloto: Comandos de Voz y Escritura para selección dinámica */}
      <section className="cu27-copilot-card" aria-label="Copiloto de Comandos por Voz y Texto">
        <form className="cu27-copilot-input-row" onSubmit={submitComandoTexto}>
          <button
            type="button"
            className={`btn-mic ${escuchandoVoz ? 'listening' : ''}`}
            onClick={toggleEscuchaVoz}
            title={escuchandoVoz ? 'Detener micrófono' : 'Hablar por micrófono (Comando de voz)'}
          >
            {escuchandoVoz ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <input
            type="text"
            className="cu27-copilot-input"
            placeholder={
              escuchandoVoz
                ? 'Escuchando dictado de voz en tiempo real...'
                : "Escribe o dicta: 'Exportar a Excel solo cliente, deuda y zona', 'Descargar PDF sin teléfonos'..."
            }
            value={textoComando}
            onChange={(e) => setTextoComando(e.target.value)}
          />

          <button type="submit" className="btn-primary cu27-copilot-btn">
            <Sparkles size={16} /> Aplicar Comando
          </button>
        </form>

        {/* Chips de sugerencias rápidas */}
        <div className="cu27-copilot-chips">
          <span className="chip-label">Sugerencias rápidas:</span>
          <button
            type="button"
            className="chip-btn"
            onClick={() => {
              setTextoComando('Exportar a Excel solo cliente y monto');
              procesarComandoVozEscritura('Exportar a Excel solo cliente y monto');
            }}
          >
            🎙️ Excel solo Cliente y Monto
          </button>
          <button
            type="button"
            className="chip-btn"
            onClick={() => {
              setTextoComando('Descargar PDF sin teléfonos ni correo');
              procesarComandoVozEscritura('Descargar PDF sin teléfonos ni correo');
            }}
          >
            🎙️ PDF sin Contactos
          </button>
          <button
            type="button"
            className="chip-btn"
            onClick={() => {
              setTextoComando('Analizar reporte con IA');
              procesarComandoVozEscritura('Analizar reporte con IA');
            }}
          >
            🧠 Analizar con Gemini IA
          </button>
          <button
            type="button"
            className="chip-btn"
            onClick={() => {
              setTextoComando('Todas las columnas');
              procesarComandoVozEscritura('Todas las columnas');
            }}
          >
            📋 Todas las columnas
          </button>
        </div>
      </section>

      {/* Alertas */}
      {error && (
        <div className="alert-error" role="alert">
          <AlertCircle size={20} />
          <div><strong>Atención:</strong> {error}</div>
        </div>
      )}

      {mensajeExito && !error && (
        <div className="alert-success" role="status">
          <CheckCircle2 size={20} />
          <div>{mensajeExito}</div>
        </div>
      )}

      {/* Catálogo de Reportes */}
      <section className="cu27-catalog-section">
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          Seleccione el tipo de informe
        </h2>
        <div className="cu27-catalog-grid">
          {catalogo.map((cat) => {
            const IconComp = ICON_MAP[cat.icono] || FileText;
            const isSelected = tipoReporte === cat.id;
            return (
              <div
                key={cat.id}
                className={`cu27-catalog-card ${isSelected ? 'active' : ''}`}
                onClick={() => seleccionarTipoReporte(cat.id)}
                role="button"
                tabIndex={0}
              >
                <div className="cu27-card-icon">
                  <IconComp size={22} />
                </div>
                <div className="cu27-card-content">
                  <h3>{cat.nombre}</h3>
                  <p>{cat.descripcion}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Panel de Filtros */}
      <section className="cu27-filters-box">
        <div className="cu27-filters-header">
          <h4><Filter size={18} /> Parámetros y Criterios de Filtrado</h4>
        </div>

        <div className="cu27-filters-grid">
          <div className="cu27-form-group">
            <label>Fecha Desde</label>
            <input
              type="date"
              className="cu27-input"
              value={filtros.fecha_desde}
              onChange={(e) => cambiarFiltro('fecha_desde', e.target.value)}
            />
          </div>

          <div className="cu27-form-group">
            <label>Fecha Hasta</label>
            <input
              type="date"
              className="cu27-input"
              value={filtros.fecha_hasta}
              onChange={(e) => cambiarFiltro('fecha_hasta', e.target.value)}
            />
          </div>

          {(tipoReporte === 'clientes_zona' || tipoReporte === 'morosidad_cortes' || tipoReporte === 'ingresos_pagos') && (
            <div className="cu27-form-group">
              <label>Zona de Cobertura</label>
              <select
                className="cu27-select"
                value={filtros.zona_id}
                onChange={(e) => cambiarFiltro('zona_id', e.target.value)}
              >
                <option value="">Todas las zonas</option>
                {parametros.zonas.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.nombre} ({z.codigo})
                  </option>
                ))}
              </select>
            </div>
          )}

          {tipoReporte === 'clientes_zona' && (
            <div className="cu27-form-group">
              <label>Estado del Cliente</label>
              <select
                className="cu27-select"
                value={filtros.estado_cliente}
                onChange={(e) => cambiarFiltro('estado_cliente', e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="ACTIVO">ACTIVO</option>
                <option value="INACTIVO">INACTIVO</option>
                <option value="SUSPENDIDO">SUSPENDIDO</option>
              </select>
            </div>
          )}

          {tipoReporte === 'ingresos_pagos' && (
            <div className="cu27-form-group">
              <label>Método de Pago</label>
              <select
                className="cu27-select"
                value={filtros.metodo_pago}
                onChange={(e) => cambiarFiltro('metodo_pago', e.target.value)}
              >
                <option value="">Todos los métodos</option>
                {parametros.metodos.map((m) => (
                  <option key={m.id} value={m.nombre}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {tipoReporte === 'equipos_instalaciones' && (
            <div className="cu27-form-group">
              <label>Enfoque de Auditoría</label>
              <select
                className="cu27-select"
                value={filtros.tipo_subreporte}
                onChange={(e) => cambiarFiltro('tipo_subreporte', e.target.value)}
              >
                <option value="comodatos">Equipos en Comodato (ONUs/Routers)</option>
                <option value="instalaciones">Instalaciones Técnicas en Terreno</option>
              </select>
            </div>
          )}

          <div className="cu27-form-group">
            <label>Buscar Término</label>
            <input
              type="text"
              className="cu27-input"
              placeholder="Nombre, código, serie o CI..."
              value={filtros.buscar}
              onChange={(e) => cambiarFiltro('buscar', e.target.value)}
            />
          </div>
        </div>

        <div className="cu27-filters-actions">
          <button className="btn-secondary" onClick={limpiarFiltros} disabled={loading}>
            Limpiar Filtros
          </button>
          <button className="btn-primary" onClick={handleGenerarReporte} disabled={loading}>
            {loading ? <RefreshCw className="spin" size={16} /> : <FileText size={16} />}
            Generar reporte
          </button>
        </div>
      </section>

      {/* SELECTOR DINÁMICO DE COLUMNAS (Para exportar lo que el usuario decida) */}
      <section className="cu27-columns-selector-box">
        <div className="cu27-columns-header" onClick={() => setMostrarSelectorColumnas((p) => !p)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <SlidersHorizontal size={18} />
            <h4 style={{ margin: 0, fontSize: '0.95rem' }}>
              Selector Dinámico de Columnas ({columnasSeleccionadas.length} de {Object.keys(columnasActuales).length} activas)
            </h4>
          </div>
          <span className="badge badge-tipo-automatica">
            Modificable por Voz y Clics
          </span>
        </div>

        {mostrarSelectorColumnas && (
          <div className="cu27-columns-body">
            <div className="cu27-presets-row">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Presets rápidos:</span>
              <button type="button" className="btn-preset" onClick={() => seleccionarPresetColumnas('todas')}>
                Todas
              </button>
              <button type="button" className="btn-preset" onClick={() => seleccionarPresetColumnas('financieras')}>
                Solo Financieras
              </button>
              <button type="button" className="btn-preset" onClick={() => seleccionarPresetColumnas('contacto')}>
                Solo Contacto
              </button>
              <button type="button" className="btn-preset" onClick={() => seleccionarPresetColumnas('operativas')}>
                Solo Operativas
              </button>
            </div>

            <div className="cu27-columns-checkboxes">
              {Object.entries(columnasActuales).map(([key, label]) => {
                const checked = columnasSeleccionadas.includes(key);
                return (
                  <label key={key} className={`cu27-col-checkbox ${checked ? 'active' : ''}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleColumna(key)}
                    />
                    <span>{label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* RESULTADOS CONSOLIDADOS */}
      {resultado && (
        <>
          {/* Tarjetas KPI */}
          <section className="cu27-kpis-grid">
            {tipoReporte === 'clientes_zona' && (
              <>
                <div className="cu27-kpi-card">
                  <span className="cu27-kpi-label">Total Clientes</span>
                  <span className="cu27-kpi-value">{resultado.kpis.total_registros}</span>
                </div>
                <div className="cu27-kpi-card">
                  <span className="cu27-kpi-label">Abonados Activos</span>
                  <span className="cu27-kpi-value highlight">{resultado.kpis.clientes_activos}</span>
                </div>
                <div className="cu27-kpi-card">
                  <span className="cu27-kpi-label">Inactivos / Bajas</span>
                  <span className="cu27-kpi-value danger">{resultado.kpis.clientes_inactivos}</span>
                </div>
                <div className="cu27-kpi-card">
                  <span className="cu27-kpi-label">Servicios Activos</span>
                  <span className="cu27-kpi-value">{resultado.kpis.servicios_activos}</span>
                </div>
              </>
            )}

            {tipoReporte === 'ingresos_pagos' && (
              <>
                <div className="cu27-kpi-card">
                  <span className="cu27-kpi-label">Total Recaudado</span>
                  <span className="cu27-kpi-value highlight">{formatMoneda(resultado.kpis.total_recaudado)}</span>
                </div>
                <div className="cu27-kpi-card">
                  <span className="cu27-kpi-label">Comprobantes Emitidos</span>
                  <span className="cu27-kpi-value">{resultado.kpis.total_transacciones}</span>
                </div>
                <div className="cu27-kpi-card">
                  <span className="cu27-kpi-label">Ticket Promedio</span>
                  <span className="cu27-kpi-value">{formatMoneda(resultado.kpis.ticket_promedio)}</span>
                </div>
              </>
            )}

            {tipoReporte === 'morosidad_cortes' && (
              <>
                <div className="cu27-kpi-card">
                  <span className="cu27-kpi-label">Deuda Total en Mora</span>
                  <span className="cu27-kpi-value danger">{formatMoneda(resultado.kpis.total_deuda)}</span>
                </div>
                <div className="cu27-kpi-card">
                  <span className="cu27-kpi-label">Facturas Pendientes</span>
                  <span className="cu27-kpi-value">{resultado.kpis.facturas_en_mora}</span>
                </div>
                <div className="cu27-kpi-card">
                  <span className="cu27-kpi-label">Abonados Morosos</span>
                  <span className="cu27-kpi-value danger">{resultado.kpis.clientes_con_deuda}</span>
                </div>
                <div className="cu27-kpi-card">
                  <span className="cu27-kpi-label">Servicios en Riesgo Corte</span>
                  <span className="cu27-kpi-value">{resultado.kpis.servicios_en_riesgo}</span>
                </div>
              </>
            )}

            {tipoReporte === 'equipos_instalaciones' && (
              <>
                {resultado.subtipo === 'instalaciones' ? (
                  <>
                    <div className="cu27-kpi-card">
                      <span className="cu27-kpi-label">Total Órdenes</span>
                      <span className="cu27-kpi-value">{resultado.kpis.total_instalaciones}</span>
                    </div>
                    <div className="cu27-kpi-card">
                      <span className="cu27-kpi-label">Finalizadas</span>
                      <span className="cu27-kpi-value highlight">{resultado.kpis.finalizadas}</span>
                    </div>
                    <div className="cu27-kpi-card">
                      <span className="cu27-kpi-label">Inversión Total</span>
                      <span className="cu27-kpi-value">{formatMoneda(resultado.kpis.costo_total_invertido)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="cu27-kpi-card">
                      <span className="cu27-kpi-label">Comodatos Totales</span>
                      <span className="cu27-kpi-value">{resultado.kpis.total_asignaciones}</span>
                    </div>
                    <div className="cu27-kpi-card">
                      <span className="cu27-kpi-label">Comodatos Vigentes</span>
                      <span className="cu27-kpi-value highlight">{resultado.kpis.comodatos_vigentes}</span>
                    </div>
                    <div className="cu27-kpi-card">
                      <span className="cu27-kpi-label">Equipos en Stock</span>
                      <span className="cu27-kpi-value">{resultado.kpis.equipos_stock_almacen}</span>
                    </div>
                  </>
                )}
              </>
            )}
          </section>

          {/* TARJETA DE ANÁLISIS EJECUTIVO CON IA (GEMINI) Y SÍNTESIS DE AUDIO TTS */}
          <section className="cu27-ai-insights-card">
            <div className="cu27-ai-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Bot size={20} className="cu27-ai-icon" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                    Análisis Ejecutivo de Negocio (IA Gemini)
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Diagnóstico gerencial, hallazgos clave, alertas y síntesis de audio
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {!analisisIa ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={ejecutarAnalisisIa}
                    disabled={cargandoIa}
                  >
                    <Sparkles size={14} className={cargandoIa ? 'spin' : ''} />
                    {cargandoIa ? 'Analizando con Gemini…' : 'Generar Análisis IA'}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={ejecutarAnalisisIa}
                      disabled={cargandoIa}
                    >
                      <RefreshCw size={14} className={cargandoIa ? 'spin' : ''} /> Re-analizar
                    </button>

                    {reproduciendoAudio ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={detenerAudioNarrativa}
                      >
                        <Square size={14} /> Detener Audio
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-sm btn-success"
                        onClick={() => reproducirAudioNarrativa(analisisIa.narrativa_tts)}
                      >
                        <Volume2 size={14} /> Escuchar Resumen (Voz)
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {analisisIa && (
              <div className="cu27-ai-body">
                <p className="cu27-ai-summary"><strong>Diagnóstico:</strong> {analisisIa.resumen_ejecutivo}</p>

                <div className="cu27-ai-grid">
                  <div className="cu27-ai-findings">
                    <h5>Hallazgos Clave</h5>
                    <ul>
                      {analisisIa.puntos_clave?.map((pto, idx) => (
                        <li key={idx}>{pto}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="cu27-ai-actions-box">
                    <div className="cu27-ai-alert">
                      <strong>⚠️ Alerta de Riesgo:</strong>
                      <p>{analisisIa.alerta_riesgo}</p>
                    </div>

                    <div className="cu27-ai-recom">
                      <strong>💡 Recomendación Gerencial:</strong>
                      <p>{analisisIa.recomendacion}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Selector de Vistas: Combinada, Gráficos o Tabla */}
          <div className="cu27-view-toggle-bar">
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Visualización:</span>
            <div className="cu27-toggle-buttons">
              <button
                type="button"
                className={`toggle-btn ${vistaActiva === 'combinada' ? 'active' : ''}`}
                onClick={() => setVistaActiva('combinada')}
              >
                <LayoutGrid size={15} /> Vista Combinada
              </button>
              <button
                type="button"
                className={`toggle-btn ${vistaActiva === 'graficos' ? 'active' : ''}`}
                onClick={() => setVistaActiva('graficos')}
              >
                <BarChart2 size={15} /> Solo Gráficos
              </button>
              <button
                type="button"
                className={`toggle-btn ${vistaActiva === 'tabla' ? 'active' : ''}`}
                onClick={() => setVistaActiva('tabla')}
              >
                <FileText size={15} /> Solo Tabla
              </button>
            </div>
          </div>

          {/* Gráficos Estadísticos Dinámicos */}
          {(vistaActiva === 'combinada' || vistaActiva === 'graficos') && renderGraficosDinamicos()}

          {/* Tabla de Registros y Acciones de Exportación */}
          {(vistaActiva === 'combinada' || vistaActiva === 'tabla') && (
            <section className="cu27-results-box">
              <div className="cu27-results-toolbar">
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                    {resultado.titulo}
                  </h3>
                  <span style={{ fontSize: '0.825rem', color: '#64748b' }}>
                    {resultado.registros?.length || 0} registros encontrados — {columnasSeleccionadas.length} columnas seleccionadas
                  </span>
                </div>

                <div className="cu27-export-buttons">
                  <button
                    className="btn-success"
                    onClick={handleExportarExcel}
                    disabled={exporting || resultado.registros?.length === 0}
                    title="Descargar reporte en formato Excel con las columnas seleccionadas"
                  >
                    <Download size={16} /> Exportar Excel ({columnasSeleccionadas.length} col)
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleExportarPdf}
                    disabled={exporting || resultado.registros?.length === 0}
                    title="Generar vista oficial e imprimir a PDF con las columnas seleccionadas"
                  >
                    <Printer size={16} /> Exportar PDF ({columnasSeleccionadas.length} col)
                  </button>
                </div>
              </div>

              {/* Renderizado de Tabla Dinámica */}
              <div className="cu27-table-wrapper">
                <table className="cu27-table">
                  <thead>
                    <tr>
                      {columnasSeleccionadas.map((colKey) => (
                        <th key={colKey}>{columnasActuales[colKey] || colKey}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.registros.map((r, i) => (
                      <tr key={i}>
                        {columnasSeleccionadas.map((colKey) => {
                          let val = r[colKey];
                          if (tipoReporte === 'equipos_instalaciones') {
                            val = colKey === 'codigo' ? (r.numeroSerie || r.idInstalacion)
                              : colKey === 'cliente' ? r.clienteNombre
                              : colKey === 'servicio' ? r.codigoServicio
                              : colKey === 'detalle' ? ((r.marca || '') + ' ' + (r.modelo || '') || r.observacion)
                              : colKey === 'tipo' ? (r.tipoEquipo || 'Instalación')
                              : colKey === 'fecha' ? (r.fechaAsignacion || r.fechaRealizada)
                              : colKey === 'responsable' ? (r.tecnicoNombre || 'Almacén')
                              : colKey === 'estado' ? (r.estadoEquipo || r.estadoInstalacion)
                              : colKey === 'costo' ? formatMoneda(r.costoInstalacion || 0)
                              : r[colKey];
                          }
                          if (colKey === 'montoTotal' || colKey === 'monto') {
                            val = <strong>{formatMoneda(val)}</strong>;
                          }
                          if (colKey === 'estadoCliente' || colKey === 'estadoServicio' || colKey === 'estadoEquipo' || colKey === 'estadoInstalacion') {
                            val = <span className="badge-status badge-activo">{val || 'ACTIVO'}</span>;
                          }
                          return <td key={colKey}>{val ?? '-'}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      {/* Modal de Impresión y Exportación a PDF Oficial */}
      {vistaImpresion && resultado && (
        <div className="cu27-modal-overlay" role="dialog" aria-modal="true">
          <div className="cu27-modal-paper">
            <div className="cu27-modal-toolbar no-print">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Printer size={18} />
                <strong>Vista Previa de Exportación Oficial PDF ({columnasSeleccionadas.length} columnas seleccionadas)</strong>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-secondary" onClick={cerrarVistaImpresion}>
                  Cerrar
                </button>
                <button className="btn-primary" onClick={dispararImpresionNativa}>
                  <Printer size={16} /> Imprimir / Guardar como PDF
                </button>
              </div>
            </div>

            <div className="cu27-print-sheet">
              <div className="cu27-print-header">
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>TELCOM TELECOMUNICACIONES</h2>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>
                    NIT: 1029384756 — Santa Cruz de la Sierra, Bolivia
                  </p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>
                    REPORTE OFICIAL DEL SISTEMA
                  </p>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                  <p style={{ margin: 0 }}><strong>Fecha Emisión:</strong> {new Date().toLocaleDateString('es-BO')}</p>
                  <p style={{ margin: 0 }}><strong>Hora:</strong> {new Date().toLocaleTimeString('es-BO')}</p>
                </div>
              </div>

              <div className="cu27-print-title">
                <h3 style={{ margin: 0, fontSize: '1.2rem', textTransform: 'uppercase' }}>
                  {resultado.titulo}
                </h3>
              </div>

              {/* Tabla de Impresión con solo las columnas seleccionadas */}
              <table className="cu27-print-table">
                <thead>
                  <tr>
                    {columnasSeleccionadas.map((colKey) => (
                      <th key={colKey}>{columnasActuales[colKey] || colKey}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resultado.registros.map((r, i) => (
                    <tr key={i}>
                      {columnasSeleccionadas.map((colKey) => {
                        let val = r[colKey];
                        if (colKey === 'montoTotal' || colKey === 'monto') {
                          val = formatMoneda(val);
                        }
                        return <td key={colKey}>{String(val ?? '-')}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="cu27-print-footer">
                <div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>
                    Documento emitido electrónicamente por el Sistema TELCOM 2.0.
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ borderTop: '1px solid #333', width: '180px', marginTop: '2rem', paddingTop: '0.25rem', fontSize: '0.8rem' }}>
                    Firma Responsable
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
