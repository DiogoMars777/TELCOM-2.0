import React from 'react';
import {
  FileText, Users, CreditCard, AlertTriangle, HardDrive, Download,
  Printer, Filter, RefreshCw, Search, Calendar, CheckCircle2, AlertCircle, X, MapPin,
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

export default function ReporteTradicionalView({ initialTipo = 'clientes_zona', initialFilters = {} }) {
  const {
    catalogo,
    tipoReporte,
    parametros,
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

  return (
    <div className="cu27-container">
      {/* Encabezado Principal */}
      <header className="cu27-header">
        <div className="cu27-header-top">
          <div>
            <span className="cu27-badge">
              <FileText size={14} /> Reportes Oficiales del Sistema
            </span>
            <h1 className="cu27-title">Generar y Exportar Reportes Tradicionales</h1>
            <p className="cu27-subtitle">
              Consolide y audite la información administrativa, financiera y operativa de TELCOM en formatos PDF y Excel.
            </p>
          </div>
          <div className="cu27-header-meta">
            <span className="badge-status badge-activo">Administrador</span>
          </div>
        </div>
      </header>

      {/* Alertas de Notificación y Excepciones */}
      {error && (
        <div className="alert-error" role="alert">
          <AlertCircle size={20} />
          <div>
            <strong>Atención:</strong> {error}
          </div>
        </div>
      )}

      {mensajeExito && !error && (
        <div className="alert-success" role="status">
          <CheckCircle2 size={20} />
          <div>{mensajeExito}</div>
        </div>
      )}

      {/* Catálogo de Reportes Disponibles (Paso 2 y 3 de CU27) */}
      <section className="cu27-catalog-section">
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          Seleccione el tipo de informe requerido
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

      {/* Formulario de Parámetros y Criterios de Filtrado (Paso 4 y 5 de CU27) */}
      <section className="cu27-filters-box">
        <div className="cu27-filters-header">
          <h4>
            <Filter size={18} /> Parámetros y Criterios de Filtrado
          </h4>
          <span style={{ fontSize: '0.825rem', color: '#64748b' }}>
            Ajuste los criterios deseados y presione "Generar reporte"
          </span>
        </div>

        <div className="cu27-filters-grid">
          {/* Filtro Rango de Fechas */}
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

          {/* Filtro Zona de Cobertura */}
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

          {/* Filtro Estado Cliente */}
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

          {/* Filtro Método de Pago */}
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

          {/* Subreporte Equipos / Instalaciones */}
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

          {/* Búsqueda Textual */}
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

        {/* Acciones de Filtrado (Paso 6 de CU27) */}
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

      {/* Visualización de Resultados Consolidados y KPIs (Paso 7 de CU27) */}
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

          {/* Tabla de Registros Detallados y Barra de Exportación (Paso 8 y 9) */}
          <section className="cu27-results-box">
            <div className="cu27-results-toolbar">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                  {resultado.titulo}
                </h3>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  {resultado.registros?.length || 0} registros encontrados — Fecha de corte: {resultado.fechaCorte}
                </span>
              </div>

              {/* Botones de Exportación (Paso 8 y 9 de CU27) */}
              <div className="cu27-export-buttons">
                <button
                  className="btn-success"
                  onClick={handleExportarExcel}
                  disabled={exporting || resultado.registros?.length === 0}
                  title="Descargar reporte en formato Excel"
                >
                  <Download size={16} /> Exportar a Excel
                </button>
                <button
                  className="btn-primary"
                  onClick={handleExportarPdf}
                  disabled={exporting || resultado.registros?.length === 0}
                  title="Generar vista oficial e imprimir a PDF"
                >
                  <Printer size={16} /> Exportar a PDF
                </button>
              </div>
            </div>

            {/* Renderizado de Tabla según el tipo de reporte */}
            <div className="cu27-table-wrapper">
              {tipoReporte === 'clientes_zona' && (
                <table className="cu27-table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>C.I.</th>
                      <th>Cliente</th>
                      <th>Teléfono</th>
                      <th>Zona / Barrio</th>
                      <th>Estado</th>
                      <th>Servicios</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.registros.map((r, i) => (
                      <tr key={r.idCliente || i}>
                        <td><strong>{r.codigoCliente}</strong></td>
                        <td>{r.ci || '-'}</td>
                        <td>{r.nombreCompleto}</td>
                        <td>{r.telefonoPrincipal || '-'}</td>
                        <td>{r.nombreZona} {r.barrioZona ? `(${r.barrioZona})` : ''}</td>
                        <td>
                          <span className={`badge-status badge-${r.estadoCliente.toLowerCase()}`}>
                            {r.estadoCliente}
                          </span>
                        </td>
                        <td><strong>{r.totalServicios}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {tipoReporte === 'ingresos_pagos' && (
                <table className="cu27-table">
                  <thead>
                    <tr>
                      <th>Comprobante</th>
                      <th>Fecha / Hora</th>
                      <th>Cliente</th>
                      <th>Zona</th>
                      <th>Período</th>
                      <th>Método</th>
                      <th>Monto</th>
                      <th>Cajero</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.registros.map((r, i) => (
                      <tr key={r.idPago || i}>
                        <td><strong>{r.numeroComprobante}</strong></td>
                        <td>{r.fechaHora}</td>
                        <td>{r.clienteNombre} ({r.codigoCliente})</td>
                        <td><span className="badge-status badge-activo">{r.nombreZona || 'Zona Norte'}</span></td>
                        <td>{r.periodo || '-'}</td>
                        <td><span className="badge-status badge-activo">{r.nombreMetodo}</span></td>
                        <td><strong>{formatMoneda(r.montoTotal)}</strong></td>
                        <td>{r.nombreCajero || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {tipoReporte === 'morosidad_cortes' && (
                <table className="cu27-table">
                  <thead>
                    <tr>
                      <th>Factura</th>
                      <th>Cliente</th>
                      <th>Servicio</th>
                      <th>Zona</th>
                      <th>Plan</th>
                      <th>Vencimiento</th>
                      <th>Monto Adeudado</th>
                      <th>Estado Servicio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.registros.map((r, i) => (
                      <tr key={r.idMensualidad || i}>
                        <td><strong>{r.codigoFactura}</strong></td>
                        <td>{r.clienteNombre} (CI: {r.clienteCi})</td>
                        <td>{r.codigoServicio}</td>
                        <td>{r.nombreZona || '-'}</td>
                        <td>{r.nombrePlan || '-'}</td>
                        <td>{r.fechaVencimiento}</td>
                        <td><strong style={{ color: '#dc2626' }}>{formatMoneda(r.monto)}</strong></td>
                        <td>
                          <span className="badge-status badge-cortado">{r.estadoServicio || 'PENDIENTE'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {tipoReporte === 'equipos_instalaciones' && (
                <>
                  {resultado.subtipo === 'instalaciones' ? (
                    <table className="cu27-table">
                      <thead>
                        <tr>
                          <th>N° Orden</th>
                          <th>Abonado</th>
                          <th>Servicio</th>
                          <th>Técnico</th>
                          <th>Fecha Realizada</th>
                          <th>Costo</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultado.registros.map((r, i) => (
                          <tr key={r.idInstalacion || i}>
                            <td><strong>ORD-{String(r.idInstalacion).padStart(4, '0')}</strong></td>
                            <td>{r.clienteNombre}</td>
                            <td>{r.codigoServicio}</td>
                            <td>{r.tecnicoNombre}</td>
                            <td>{r.fechaRealizada || '-'}</td>
                            <td>{formatMoneda(r.costoInstalacion)}</td>
                            <td>
                              <span className="badge-status badge-finalizado">{r.estadoInstalacion}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <table className="cu27-table">
                      <thead>
                        <tr>
                          <th>N° Serie</th>
                          <th>Dirección MAC</th>
                          <th>Marca / Modelo</th>
                          <th>Tipo</th>
                          <th>Cliente Asignado</th>
                          <th>Servicio</th>
                          <th>Fecha Entrega</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultado.registros.map((r, i) => (
                          <tr key={r.idAsignacionEquipo || i}>
                            <td><strong>{r.numeroSerie}</strong></td>
                            <td><code>{r.mac || '-'}</code></td>
                            <td>{r.marca} {r.modelo}</td>
                            <td>{r.tipoEquipo}</td>
                            <td>{r.clienteNombre}</td>
                            <td>{r.codigoServicio}</td>
                            <td>{r.fechaAsignacion}</td>
                            <td>
                              <span className={`badge-status ${r.fechaRetiro ? 'badge-inactivo' : 'badge-activo'}`}>
                                {r.fechaRetiro ? 'DEVUELTO' : 'VIGENTE'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}
            </div>
          </section>
        </>
      )}

      {/* Modal de Impresión y Exportación a PDF Oficial (Paso 9 de CU27) */}
      {vistaImpresion && resultado && (
        <div className="cu27-modal-overlay" role="dialog" aria-modal="true">
          <div className="cu27-modal-paper">
            <div className="cu27-modal-toolbar no-print">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Printer size={18} />
                <strong>Vista Previa de Exportación Oficial PDF</strong>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-secondary" onClick={cerrarVistaImpresion}>
                  <X size={16} /> Cerrar
                </button>
                <button className="btn-primary" onClick={dispararImpresionNativa}>
                  <Printer size={16} /> Imprimir / Guardar como PDF
                </button>
              </div>
            </div>

            <div className="cu27-print-sheet">
              {/* Membrete Oficial */}
              <div className="cu27-letterhead">
                <div>
                  <div className="cu27-brand-title">TELCOM BOLIVIA S.R.L.</div>
                  <div style={{ fontSize: '0.9rem', color: '#475569' }}>
                    Proveedor de Servicios de Telecomunicaciones & Fibra Óptica
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    NIT: 1029384756 | Central: Av. San Martín #450, Santa Cruz de la Sierra
                  </div>
                </div>
                <div className="cu27-doc-meta">
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>
                    REPORTE ADMINISTRATIVO OFICIAL
                  </div>
                  <div>Fecha de emisión: {new Date().toLocaleString('es-BO')}</div>
                  <div>Generado por: Administrador General</div>
                </div>
              </div>

              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                {resultado.titulo}
              </h2>
              <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.9rem', color: '#64748b' }}>
                Criterios aplicados: Fecha de corte al {resultado.fechaCorte}. Total de registros consolidados: {resultado.registros?.length || 0}.
              </p>

              {/* Resumen Ejecutivo */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                {Object.entries(resultado.kpis || {}).map(([k, v]) => {
                  if (typeof v === 'object') return null;
                  return (
                    <div key={k} style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                        {k.replace(/_/g, ' ')}
                      </div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
                        {typeof v === 'number' && k.includes('total_recaudado') ? formatMoneda(v) : v}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tabla Impresa Compacta */}
              <table className="cu27-table" style={{ fontSize: '0.8rem' }}>
                <thead>
                  {tipoReporte === 'clientes_zona' && (
                    <tr>
                      <th>Código</th><th>CI</th><th>Cliente</th><th>Teléfono</th><th>Zona</th><th>Estado</th>
                    </tr>
                  )}
                  {tipoReporte === 'ingresos_pagos' && (
                    <tr>
                      <th>N° Recibo</th><th>Fecha</th><th>Abonado</th><th>Método</th><th>Monto (Bs.)</th><th>Cajero</th>
                    </tr>
                  )}
                  {tipoReporte === 'morosidad_cortes' && (
                    <tr>
                      <th>Factura</th><th>Abonado</th><th>Servicio</th><th>Vencimiento</th><th>Deuda (Bs.)</th><th>Estado</th>
                    </tr>
                  )}
                  {tipoReporte === 'equipos_instalaciones' && (
                    <tr>
                      <th>Serie / Orden</th><th>Equipo / Servicio</th><th>Cliente</th><th>Fecha</th><th>Estado</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {resultado.registros.slice(0, 50).map((r, i) => (
                    <tr key={i}>
                      {tipoReporte === 'clientes_zona' && (
                        <>
                          <td>{r.codigoCliente}</td><td>{r.ci || '-'}</td><td>{r.nombreCompleto}</td>
                          <td>{r.telefonoPrincipal || '-'}</td><td>{r.nombreZona}</td><td>{r.estadoCliente}</td>
                        </>
                      )}
                      {tipoReporte === 'ingresos_pagos' && (
                        <>
                          <td>{r.numeroComprobante}</td><td>{r.fechaHora}</td><td>{r.clienteNombre}</td>
                          <td>{r.nombreMetodo}</td><td>{formatMoneda(r.montoTotal)}</td><td>{r.nombreCajero}</td>
                        </>
                      )}
                      {tipoReporte === 'morosidad_cortes' && (
                        <>
                          <td>{r.codigoFactura}</td><td>{r.clienteNombre}</td><td>{r.codigoServicio}</td>
                          <td>{r.fechaVencimiento}</td><td>{formatMoneda(r.monto)}</td><td>{r.estadoServicio}</td>
                        </>
                      )}
                      {tipoReporte === 'equipos_instalaciones' && (
                        <>
                          <td>{r.numeroSerie || r.idInstalacion}</td><td>{r.modelo || r.codigoServicio}</td>
                          <td>{r.clienteNombre}</td><td>{r.fechaAsignacion || r.fechaRealizada}</td>
                          <td>{r.estadoEquipo || r.estadoInstalacion}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ borderTop: '1px solid #94a3b8', width: '220px', textAlign: 'center', paddingTop: '0.5rem', fontSize: '0.85rem' }}>
                  Firma Responsable Auditoría
                </div>
                <div style={{ borderTop: '1px solid #94a3b8', width: '220px', textAlign: 'center', paddingTop: '0.5rem', fontSize: '0.85rem' }}>
                  Sello Gerencia Administrativa
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
