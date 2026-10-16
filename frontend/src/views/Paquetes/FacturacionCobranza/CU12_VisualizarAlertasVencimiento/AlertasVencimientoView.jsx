import React from 'react';
import { useAlertasVencimientoController } from '../../../../controllers/Paquetes/FacturacionCobranza/CU12_VisualizarAlertasVencimiento/useAlertasVencimientoController';
import { AlertTriangle, Bell, ShieldAlert, Clock, UserX, AlertCircle, RefreshCw } from 'lucide-react';

export default function AlertasVencimientoView() {
  const {
    alertas,
    loading,
    error,
    severidadFiltro,
    setSeveridadFiltro,
  } = useAlertasVencimientoController();

  return (
    <div className="view-panel">
      <div className="view-header">
        <div>
          <h2>Visualizar Alertas de Vencimiento</h2>
          <p className="subtitle">Monitoreo predictivo de mora y facturas impagas para prevención de corte</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={18} /> No se pudieron cargar las alertas: {error}
        </div>
      )}

      <div className="filters-bar">
        <div className="filter-item">
          <select value={severidadFiltro} onChange={(e) => setSeveridadFiltro(e.target.value)}>
            <option value="">Todas las Severidades</option>
            <option value="CRITICA">Crítica (&gt; 15 días)</option>
            <option value="ALTA">Alta (&gt; 5 días)</option>
            <option value="MEDIA">Media (&lt;= 5 días)</option>
          </select>
        </div>
      </div>

      {loading && (
        <p className="text-muted" style={{ padding: '0.5rem 0' }}>
          <RefreshCw size={16} className="spin" /> Cargando alertas…
        </p>
      )}

      {!loading && alertas.length === 0 && (
        <p className="text-muted" style={{ padding: '0.5rem 0' }}>Sin registros</p>
      )}

      <div className="grid-cards">
        {alertas.map((a, idx) => (
          <div key={idx} className={`card-item border-${a.severidad === 'CRITICA' ? 'danger' : 'warning'}`}>
            <div className="card-item-header">
              <span className={`badge badge-${a.severidad === 'CRITICA' ? 'danger' : 'warning'}`}>
                {a.severidad === 'CRITICA' ? <ShieldAlert size={14} /> : <Clock size={14} />}
                MORA {a.severidad}
              </span>
              <span className="badge badge-info">{a.codigo_factura}</span>
            </div>
            <h3>{a.cliente}</h3>
            <p className="text-muted">{a.servicio}</p>
            <div className="tech-info">
              <div>Vencimiento: <strong>{a.fecha_vencimiento}</strong></div>
              <div>Días de Retraso: <strong className="text-danger">{a.dias_retraso} días</strong></div>
              <div>Monto Adeudado: <strong className="text-danger">Bs. {a.monto}</strong></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
