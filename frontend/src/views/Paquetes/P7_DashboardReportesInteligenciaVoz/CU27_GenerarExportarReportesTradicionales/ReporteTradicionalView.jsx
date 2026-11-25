import React from 'react';
import {
  FileText, Users, CreditCard, AlertTriangle, HardDrive, Download,
  Printer, Filter, RefreshCw, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { useReporteTradicionalController } from '../../../../controllers/Paquetes/P7_DashboardReportesInteligenciaVoz/CU27_GenerarExportarReportesTradicionales/useReporteTradicionalController.js';
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

function obtenerValorCelda(registro, colKey, tipoReporte, formatearMoneda = false) {
  let val = registro[colKey];
  if (tipoReporte === 'equipos_instalaciones') {
    val = colKey === 'codigo' ? (registro.numeroSerie || registro.idInstalacion)
      : colKey === 'cliente' ? registro.clienteNombre
      : colKey === 'servicio' ? registro.codigoServicio
      : colKey === 'detalle' ? (((registro.marca || '') + ' ' + (registro.modelo || '')).trim() || registro.observacion)
      : colKey === 'tipo' ? (registro.tipoEquipo || 'Instalación')
      : colKey === 'fecha' ? (registro.fechaAsignacion || registro.fechaRealizada)
      : colKey === 'responsable' ? (registro.tecnicoNombre || 'Almacén')
      : colKey === 'estado' ? (registro.estadoEquipo || registro.estadoInstalacion)
      : colKey === 'costo' ? formatMoneda(registro.costoInstalacion || 0)
      : registro[colKey];
  }
  if (formatearMoneda && (colKey === 'montoTotal' || colKey === 'monto')) {
    return formatMoneda(val);
  }
  return val;
}

export default function ReporteTradicionalView({ initialTipo = 'clientes_zona', initialFilters = {} }) {
  const {
    catalogo,
    tipoReporte,
    parametros,
    diccionarioColumnas,
    filtros,
    resultado,
    loading,
    exporting,
    error,
    mensajeExito,
    vistaImpresion,
    seleccionarTipoReporte,
    cambiarFiltro,
    limpiarFiltros,
    handleGenerarReporte,
    handleExportarExcel,
    handleExportarPdf,
    cerrarVistaImpresion,
    dispararImpresionNativa,
  } = useReporteTradicionalController(initialTipo, initialFilters);

  const columnasActuales = diccionarioColumnas[tipoReporte] || {};
  const columnasEstaticas = Object.keys(columnasActuales);

  return (
    <div className="cu27-container">
      {/* Encabezado Principal */}
      <header className="cu27-header">
        <div className="cu27-header-top">
          <div>
            <span className="cu27-badge">
              <FileText size={14} /> Reportes Oficiales Estáticos (PDF / Excel)
            </span>
            <h1 className="cu27-title">Reportes Tradicionales del Sistema</h1>
            <p className="cu27-subtitle">
              Seleccione uno de los informes predefinidos, aplique filtros estándar y exporte el documento oficial completo en PDF o Excel.
            </p>
          </div>
          <div className="cu27-header-meta">
            <span className="badge-status badge-activo">Formato Oficial</span>
          </div>
        </div>
      </header>

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

      {/* Catálogo de Reportes Predefinidos */}
      <section className="cu27-catalog-section">
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          Informes Predefinidos Disponibles
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    seleccionarTipoReporte(cat.id);
                  }
                }}
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

      {/* Panel de Filtros Estándar */}
      <section className="cu27-filters-box">
        <div className="cu27-filters-header">
          <h4><Filter size={18} /> Parámetros de Filtrado</h4>
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
          <button type="button" className="btn-secondary" onClick={limpiarFiltros} disabled={loading}>
            Limpiar Filtros
          </button>
          <button type="button" className="btn-primary" onClick={handleGenerarReporte} disabled={loading}>
            {loading ? <RefreshCw className="spin" size={16} /> : <FileText size={16} />}
            Generar Reporte Oficial
          </button>
        </div>
      </section>

      {/* RESULTADOS ESTÁTICOS LISTOS PARA EXPORTAR */}
      {resultado && (
        <>
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

          <section className="cu27-results-box">
            <div className="cu27-results-toolbar">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                  {resultado.titulo}
                </h3>
                <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  {resultado.registros?.length || 0} registros encontrados — Estructura oficial estática ({columnasEstaticas.length} columnas)
                </span>
              </div>

              <div className="cu27-export-buttons">
                <button
                  type="button"
                  className="btn-success"
                  onClick={handleExportarExcel}
                  disabled={exporting || resultado.registros?.length === 0}
                >
                  <Download size={16} /> Exportar Excel (.csv)
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleExportarPdf}
                  disabled={exporting || resultado.registros?.length === 0}
                >
                  <Printer size={16} /> Exportar PDF Oficial
                </button>
              </div>
            </div>

            <div className="cu27-table-wrapper">
              <table className="cu27-table">
                <thead>
                  <tr>
                    {columnasEstaticas.map((colKey) => (
                      <th key={colKey}>{columnasActuales[colKey]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resultado.registros.map((r, i) => (
                    <tr key={i}>
                      {columnasEstaticas.map((colKey) => {
                        let val = obtenerValorCelda(r, colKey, tipoReporte, false);
                        if (colKey === 'montoTotal' || colKey === 'monto') {
                          val = <strong>{formatMoneda(val)}</strong>;
                        } else if (
                          colKey === 'estadoCliente' ||
                          colKey === 'estadoServicio' ||
                          colKey === 'estadoEquipo' ||
                          colKey === 'estadoInstalacion'
                        ) {
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
        </>
      )}

      {/* Modal de Impresión y Exportación a PDF Oficial */}
      {vistaImpresion && resultado && (
        <div className="cu27-modal-overlay" role="dialog" aria-modal="true">
          <div className="cu27-modal-paper">
            <div className="cu27-modal-toolbar no-print">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Printer size={18} />
                <strong>Vista Previa Oficial para PDF — {resultado.titulo}</strong>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={cerrarVistaImpresion}>
                  Cerrar
                </button>
                <button type="button" className="btn-primary" onClick={dispararImpresionNativa}>
                  <Printer size={16} /> Imprimir / Guardar PDF
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
                  <p style={{ margin: 0 }}><strong>Fecha de Corte:</strong> {resultado.fechaCorte || 'Al día'}</p>
                </div>
              </div>

              <div className="cu27-print-title">
                <h3 style={{ margin: 0, fontSize: '1.2rem', textTransform: 'uppercase' }}>
                  {resultado.titulo}
                </h3>
              </div>

              <table className="cu27-print-table">
                <thead>
                  <tr>
                    {columnasEstaticas.map((colKey) => (
                      <th key={colKey}>{columnasActuales[colKey]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resultado.registros.map((r, i) => (
                    <tr key={i}>
                      {columnasEstaticas.map((colKey) => {
                        const val = obtenerValorCelda(r, colKey, tipoReporte, true);
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
