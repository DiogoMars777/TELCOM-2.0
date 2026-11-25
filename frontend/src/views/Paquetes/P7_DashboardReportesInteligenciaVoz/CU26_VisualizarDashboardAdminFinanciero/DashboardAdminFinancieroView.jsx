import React from 'react';
import {
  LayoutDashboard,
  DollarSign,
  TrendingUp,
  Users,
  Wifi,
  AlertTriangle,
  Printer,
  RefreshCw,
  CreditCard,
  Package,
  MapPin,
  Activity,
  CheckCircle,
  Scissors,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { useDashboardAdminFinancieroController } from '../../../../controllers/Paquetes/P7_DashboardReportesInteligenciaVoz/CU26_VisualizarDashboardAdminFinanciero/useDashboardAdminFinancieroController.js';
import './DashboardAdminFinancieroView.css';

export default function DashboardAdminFinancieroView({ user, onNavigate }) {
  const {
    data,
    loading,
    error,
    periodo,
    activeTab,
    setActiveTab,
    lastUpdated,
    handlePeriodoChange,
    handleReload,
  } = useDashboardAdminFinancieroController();

  const financiero = data?.financiero || {};
  const operativo = data?.operativo || {};
  const evolucionMensual = data?.evolucion_mensual || [];
  const metodosPago = data?.metodos_pago || [];
  const planes = data?.planes_distribucion || [];
  const zonas = data?.zonas_cobertura || [];
  const alertas = data?.alertas_morosidad || [];

  // Calcular valor máximo para escalar barras del gráfico mensual
  const maxMonto = Math.max(
    ...evolucionMensual.map((m) => Math.max(Number(m.recaudado || 0), Number(m.facturado || 0))),
    1
  );

  const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="cu26-dashboard">
      {/* Encabezado Principal */}
      <header className="cu26-header">
        <div className="cu26-title-group">
          <div className="cu26-title-icon">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h1 className="cu26-title">
              Dashboard Administrativo y Financiero
              <span className="cu26-badge cu26-badge-media" style={{ fontSize: '0.7rem' }}>
                CU26
              </span>
            </h1>
            <p className="cu26-subtitle">
              Métricas operativas en tiempo real, consolidado de cobranza, saturación de red y cartera vencida
            </p>
          </div>
        </div>

        <div className="cu26-actions">
          <label htmlFor="cu26-periodo-select" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Período:
          </label>
          <select
            id="cu26-periodo-select"
            className="cu26-select"
            value={periodo}
            onChange={(e) => handlePeriodoChange(e.target.value)}
          >
            <option value="mes_actual">Mes Actual (Noviembre 2026)</option>
            <option value="hoy">Hoy</option>
            <option value="trimestre">Último Trimestre</option>
            <option value="anio">Gestión Anual 2026</option>
          </select>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleReload}
            disabled={loading}
            title="Recargar métricas"
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span className="btn-text">Actualizar</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handlePrint}
            title="Imprimir reporte ejecutivo"
          >
            <Printer size={15} />
            <span className="btn-text">Exportar / Imprimir</span>
          </button>
        </div>
      </header>

      {/* Alerta de error si ocurrió fallo */}
      {error && (
        <div className="alert alert-danger" role="alert" style={{ margin: 0 }}>
          <AlertTriangle size={18} />
          <span>Error al sincronizar datos del servidor: {error} (mostrando datos en caché)</span>
        </div>
      )}

      {/* Pestañas de Navegación del Dashboard */}
      <nav className="cu26-tabs" aria-label="Secciones del Dashboard">
        <button
          type="button"
          className={`cu26-tab-btn ${activeTab === 'todos' ? 'active' : ''}`}
          onClick={() => setActiveTab('todos')}
        >
          <Activity size={15} />
          Vista Consolidada
        </button>
        <button
          type="button"
          className={`cu26-tab-btn ${activeTab === 'financiero' ? 'active' : ''}`}
          onClick={() => setActiveTab('financiero')}
        >
          <DollarSign size={15} />
          Financiero y Cobranzas
        </button>
        <button
          type="button"
          className={`cu26-tab-btn ${activeTab === 'operativo' ? 'active' : ''}`}
          onClick={() => setActiveTab('operativo')}
        >
          <Wifi size={15} />
          Operativo y Red
        </button>
        <button
          type="button"
          className={`cu26-tab-btn ${activeTab === 'alertas' ? 'active' : ''}`}
          onClick={() => setActiveTab('alertas')}
        >
          <ShieldAlert size={15} />
          Alertas de Morosidad ({alertas.length})
        </button>
      </nav>

      {/* Tarjetas KPI Superiores (Resumen Ejecutivo) */}
      <section className="cu26-kpi-grid">
        {/* KPI 1: Recaudación Mes Actual */}
        <div className="cu26-kpi-card" style={{ '--kpi-accent': '#10b981' }}>
          <div className="cu26-kpi-header">
            <span className="cu26-kpi-label">Recaudación del Mes</span>
            <div className="cu26-kpi-icon-wrap" style={{ color: '#10b981' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className="cu26-kpi-value">
            {formatCurrency(financiero.total_recaudado)}
            <span className="cu26-kpi-currency">Bs</span>
          </div>
          <div className="cu26-kpi-footer">
            <span>Tasa de Cobro: <strong className="cu26-tag-success">{financiero.tasa_cobranza_porcentaje || 94.8}%</strong></span>
            <span>{financiero.cantidad_transacciones || 0} recibos</span>
          </div>
        </div>

        {/* KPI 2: Cobranza Hoy */}
        <div className="cu26-kpi-card" style={{ '--kpi-accent': '#3b82f6' }}>
          <div className="cu26-kpi-header">
            <span className="cu26-kpi-label">Cobranza de Hoy</span>
            <div className="cu26-kpi-icon-wrap" style={{ color: '#3b82f6' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="cu26-kpi-value">
            {formatCurrency(financiero.recaudacion_hoy)}
            <span className="cu26-kpi-currency">Bs</span>
          </div>
          <div className="cu26-kpi-footer">
            <span>Pagos registrados hoy</span>
            <span className="cu26-tag-info font-bold">{financiero.pagos_hoy_cantidad || 0} pagos</span>
          </div>
        </div>

        {/* KPI 3: Cartera Vencida (Mora) */}
        <div className="cu26-kpi-card" style={{ '--kpi-accent': '#ef4444' }}>
          <div className="cu26-kpi-header">
            <span className="cu26-kpi-label">Cartera en Mora</span>
            <div className="cu26-kpi-icon-wrap" style={{ color: '#ef4444' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="cu26-kpi-value" style={{ color: '#f87171' }}>
            {formatCurrency(financiero.cartera_vencida_mora)}
            <span className="cu26-kpi-currency">Bs</span>
          </div>
          <div className="cu26-kpi-footer">
            <span className="cu26-tag-danger">{financiero.facturas_en_mora_cantidad || 0} facturas impagas</span>
            {onNavigate && (
              <button
                type="button"
                className="cu26-btn-action"
                onClick={() => onNavigate('CU12')}
              >
                Ver alertas
              </button>
            )}
          </div>
        </div>

        {/* KPI 4: Clientes Activos */}
        <div className="cu26-kpi-card" style={{ '--kpi-accent': '#8b5cf6' }}>
          <div className="cu26-kpi-header">
            <span className="cu26-kpi-label">Clientes Activos</span>
            <div className="cu26-kpi-icon-wrap" style={{ color: '#8b5cf6' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="cu26-kpi-value">
            {operativo.clientes_activos ?? 0}
            <span className="cu26-kpi-currency">/ {operativo.total_clientes ?? 0}</span>
          </div>
          <div className="cu26-kpi-footer">
            <span>Total registrados</span>
            <span className="cu26-tag-success">+{operativo.clientes_nuevos_mes || 0} este mes</span>
          </div>
        </div>

        {/* KPI 5: Servicios de Internet */}
        <div className="cu26-kpi-card" style={{ '--kpi-accent': '#06b6d4' }}>
          <div className="cu26-kpi-header">
            <span className="cu26-kpi-label">Servicios Activos</span>
            <div className="cu26-kpi-icon-wrap" style={{ color: '#06b6d4' }}>
              <Wifi size={18} />
            </div>
          </div>
          <div className="cu26-kpi-value">
            {operativo.servicios_activos ?? 0}
            <span className="cu26-kpi-currency">en línea</span>
          </div>
          <div className="cu26-kpi-footer">
            <span className="cu26-tag-warning">
              {operativo.servicios_para_corte || 0} en corte
            </span>
            {operativo.servicios_cortados > 0 && (
              <span className="cu26-tag-danger">
                {operativo.servicios_cortados} suspendidos
              </span>
            )}
          </div>
        </div>

        {/* KPI 6: Equipos en Comodato */}
        <div className="cu26-kpi-card" style={{ '--kpi-accent': '#f59e0b' }}>
          <div className="cu26-kpi-header">
            <span className="cu26-kpi-label">Equipos en Clientes</span>
            <div className="cu26-kpi-icon-wrap" style={{ color: '#f59e0b' }}>
              <Package size={18} />
            </div>
          </div>
          <div className="cu26-kpi-value">
            {operativo.equipos_comodato_activos ?? 0}
            <span className="cu26-kpi-currency">instalados</span>
          </div>
          <div className="cu26-kpi-footer">
            <span>Stock disponible</span>
            <span className="cu26-tag-info font-bold">{operativo.equipos_stock_disponible || 0} en bodega</span>
          </div>
        </div>
      </section>

      {/* SECCIÓN FINANCIERA: Gráfico de Evolución y Métodos de Cobranza */}
      {(activeTab === 'todos' || activeTab === 'financiero') && (
        <section className="cu26-panels-grid">
          {/* Gráfico de Evolución Semestral */}
          <div className="cu26-panel">
            <h2 className="cu26-panel-title">
              <span>Evolución Mensual: Recaudación vs Facturación (Últimos 6 Meses)</span>
              <span className="cu26-badge cu26-badge-media">Histórico</span>
            </h2>
            <div className="cu26-bar-chart">
              {evolucionMensual.map((item) => {
                const heightRecaudado = Math.max(
                  Math.round(((item.recaudado || 0) / maxMonto) * 100),
                  8
                );
                return (
                  <div key={item.periodo} className="cu26-bar-col">
                    <span className="cu26-bar-val">
                      {Math.round(item.recaudado / 1000)}k
                    </span>
                    <div className="cu26-bar-fill-wrap" title={`${item.mes_nombre}: Recaudado Bs ${formatCurrency(item.recaudado)} de Bs ${formatCurrency(item.facturado)}`}>
                      <div
                        className="cu26-bar-fill"
                        style={{ height: `${heightRecaudado}%` }}
                      />
                    </div>
                    <span className="cu26-bar-label">
                      {item.mes_nombre ? item.mes_nombre.split(' ')[0].substring(0, 3) : item.periodo}
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span>Ticket promedio mensual: <strong style={{ color: 'var(--text-primary)' }}>Bs {formatCurrency(financiero.ticket_promedio)}</strong></span>
              <span>Total facturado histórico: <strong style={{ color: 'var(--text-primary)' }}>Bs {formatCurrency(financiero.total_facturado_acumulado)}</strong></span>
            </div>
          </div>

          {/* Desglose por Método de Pago */}
          <div className="cu26-panel">
            <h2 className="cu26-panel-title">
              <span>Canales de Cobranza</span>
              <CreditCard size={17} style={{ color: '#8b5cf6' }} />
            </h2>
            <div className="cu26-methods-list">
              {metodosPago.map((metodo) => (
                <div key={metodo.metodo} className="cu26-method-item">
                  <div className="cu26-method-info">
                    <span style={{ color: 'var(--text-primary)' }}>{metodo.metodo}</span>
                    <span style={{ color: metodo.color || '#3b82f6' }}>
                      Bs {formatCurrency(metodo.total_monto)} ({metodo.porcentaje}%)
                    </span>
                  </div>
                  <div className="cu26-progress-track">
                    <div
                      className="cu26-progress-fill"
                      style={{
                        width: `${metodo.porcentaje}%`,
                        backgroundColor: metodo.color || '#3b82f6',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    {metodo.transacciones} transacciones registradas
                  </span>
                </div>
              ))}
            </div>
            {onNavigate && (
              <button
                type="button"
                className="cu26-btn-action"
                style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}
                onClick={() => onNavigate('CU10')}
              >
                <DollarSign size={14} /> Registrar nuevo pago
              </button>
            )}
          </div>
        </section>
      )}

      {/* SECCIÓN OPERATIVA: Distribución por Planes y Cobertura */}
      {(activeTab === 'todos' || activeTab === 'operativo') && (
        <section className="cu26-panels-grid">
          {/* Distribución de Planes */}
          <div className="cu26-panel">
            <h2 className="cu26-panel-title">
              <span>Abonados por Plan de Internet</span>
              <span className="cu26-badge cu26-badge-media">Comercial</span>
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table className="cu26-plans-table">
                <thead>
                  <tr>
                    <th>Plan</th>
                    <th>Velocidad</th>
                    <th>Precio</th>
                    <th>Abonados</th>
                    <th>Ingreso Estimado</th>
                    <th>Cuota</th>
                  </tr>
                </thead>
                <tbody>
                  {planes.map((p) => (
                    <tr key={p.id_plan}>
                      <td style={{ fontWeight: 600 }}>{p.nombre_plan}</td>
                      <td>{p.velocidad_mbps} Mbps</td>
                      <td>Bs {formatCurrency(p.precio_mensual)}</td>
                      <td>
                        <strong style={{ color: '#38bdf8' }}>{p.abonados_activos}</strong>
                      </td>
                      <td>Bs {formatCurrency(p.ingreso_estimado)}</td>
                      <td>
                        <span className="cu26-tag-info font-bold">{p.porcentaje}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {onNavigate && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="cu26-btn-action"
                  onClick={() => onNavigate('CU16')}
                >
                  Gestionar catálogo planes
                </button>
                <button
                  type="button"
                  className="cu26-btn-action"
                  onClick={() => onNavigate('CU08')}
                >
                  Ver servicios activos
                </button>
              </div>
            )}
          </div>

          {/* Saturación de Nodos y Zonas de Cobertura */}
          <div className="cu26-panel">
            <h2 className="cu26-panel-title">
              <span>Saturación por Zona de Cobertura</span>
              <MapPin size={17} style={{ color: '#10b981' }} />
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table className="cu26-zones-table">
                <thead>
                  <tr>
                    <th>Zona / Troncal</th>
                    <th>Servicios</th>
                    <th>Capacidad</th>
                    <th>Saturación</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {zonas.map((z) => (
                    <tr key={z.id_zona}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{z.nombre_zona}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{z.ciudad}</div>
                      </td>
                      <td>{z.servicios_count}</td>
                      <td>{z.capacidad_nodos}</td>
                      <td style={{ minWidth: '90px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <div className="cu26-progress-track" style={{ height: '6px' }}>
                            <div
                              className="cu26-progress-fill"
                              style={{
                                width: `${Math.min(z.porcentaje_saturacion * 5, 100)}%`,
                                backgroundColor: z.porcentaje_saturacion > 80 ? '#ef4444' : '#10b981',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '0.72rem' }}>{z.porcentaje_saturacion}%</span>
                        </div>
                      </td>
                      <td>
                        <span className="cu26-badge cu26-badge-media" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                          {z.estado_cobertura}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {onNavigate && (
              <button
                type="button"
                className="cu26-btn-action"
                style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}
                onClick={() => onNavigate('CU04')}
              >
                Ver mapa y nodos
              </button>
            )}
          </div>
        </section>
      )}

      {/* SECCIÓN ALERTAS DE MOROSIDAD CRÍTICA */}
      {(activeTab === 'todos' || activeTab === 'alertas') && (
        <section className="cu26-panel">
          <div className="cu26-panel-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={18} style={{ color: '#ef4444' }} />
              <span>Cuentas con Cartera Vencida y Alerta de Corte</span>
            </div>
            <span className="cu26-badge cu26-badge-critica">
              {alertas.length} Cuentas Críticas
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="cu26-alert-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Contacto</th>
                  <th>Servicio</th>
                  <th>Meses Mora</th>
                  <th>Total Deuda</th>
                  <th>Días Vencido</th>
                  <th>Severidad</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {alertas.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1.5rem' }}>
                      No existen alertas de morosidad crítica pendientes de cobro en este momento.
                    </td>
                  </tr>
                ) : (
                  alertas.map((alerta) => (
                    <tr key={`${alerta.id_cliente}-${alerta.id_servicio}`}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{alerta.nombre_cliente}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          {alerta.codigo_cliente}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace' }}>{alerta.telefono || 'Sin tel'}</span>
                      </td>
                      <td>
                        <span className="cu26-badge cu26-badge-media">
                          {alerta.codigo_servicio}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: alerta.meses_adeudados >= 2 ? '#f87171' : '#fbbf24' }}>
                          {alerta.meses_adeudados} {alerta.meses_adeudados === 1 ? 'mes' : 'meses'}
                        </strong>
                      </td>
                      <td>
                        <strong style={{ color: '#f87171' }}>
                          Bs {formatCurrency(alerta.total_deuda)}
                        </strong>
                      </td>
                      <td>
                        <span>{alerta.dias_mora} días</span>
                      </td>
                      <td>
                        <span
                          className={`cu26-badge ${
                            alerta.urgencia === 'CRITICA'
                              ? 'cu26-badge-critica'
                              : alerta.urgencia === 'ALTA'
                              ? 'cu26-badge-alta'
                              : 'cu26-badge-media'
                          }`}
                        >
                          {alerta.urgencia}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          {onNavigate && (
                            <>
                              <button
                                type="button"
                                className="cu26-btn-action"
                                title="Registrar Cobro"
                                onClick={() => onNavigate('CU10')}
                              >
                                <DollarSign size={13} /> Cobrar
                              </button>
                              <button
                                type="button"
                                className="cu26-btn-action"
                                style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.15)' }}
                                title="Ir a Hoja de Cortes"
                                onClick={() => onNavigate('CU13')}
                              >
                                <Scissors size={13} /> Corte
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Pie de página con marca de tiempo */}
      <footer style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-secondary)', padding: '0.5rem 0' }}>
        <span>TELCOM ISP Cloud 2.0 &bull; Panel Ejecutivo y Financiero</span>
        <span>Última sincronización: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'N/A'}</span>
      </footer>
    </div>
  );
}
