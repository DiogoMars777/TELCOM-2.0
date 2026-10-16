import React from 'react';
import { useCorteRegistroController } from '../../../../controllers/Paquetes/ServiciosPlanes/CU14_RegistrarCorteRealizado/useCorteRegistroController';
import { Scissors, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CorteRegistroView({ initialServicio }) {
  const {
    servicios,
    servicesError,
    selectedServicio,
    setSelectedServicio,
    tipoCorte,
    setTipoCorte,
    motivo,
    setMotivo,
    observaciones,
    setObservaciones,
    loading,
    error,
    corteSuccess,
    setCorteSuccess,
    handleSubmit,
  } = useCorteRegistroController(initialServicio);

  return (
    <div className="view-panel">
      <div className="view-header">
        <div>
          <h2>Registrar Corte Realizado</h2>
          <p className="subtitle">Ejecución y registro de orden técnica de corte (Lógico / Físico)</p>
        </div>
      </div>

      {servicesError && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={18} /> No se pudo cargar el listado de servicios: {servicesError}
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {corteSuccess ? (
        <div className="receipt-card border-danger">
          <div className="receipt-header">
            <CheckCircle2 size={36} className="text-danger" />
            <h3>¡Corte Registrado y Efectuado!</h3>
            <p>El servicio ha sido suspendido y el corte quedó registrado en el sistema</p>
          </div>
          <div className="receipt-body">
            <div className="receipt-row">
              <span>Orden de Corte:</span>
              <strong>{corteSuccess.codigo_orden}</strong>
            </div>
            <div className="receipt-row">
              <span>Servicio Cortado:</span>
              <span>{corteSuccess.servicio}</span>
            </div>
            <div className="receipt-row">
              <span>Tipo de Corte:</span>
              <span className="badge badge-danger">{corteSuccess.tipo}</span>
            </div>
            <div className="receipt-row">
              <span>Fecha Registro:</span>
              <span>{corteSuccess.fecha}</span>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setCorteSuccess(null)}>
            Registrar Otro Corte
          </button>
        </div>
      ) : (
        <div className="form-card">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Servicio a Cortar</label>
                <select
                  value={selectedServicio?.id ?? ''}
                  onChange={(e) => {
                    const found = servicios.find(s => s.id === parseInt(e.target.value));
                    if (found) setSelectedServicio(found);
                  }}
                >
                  {selectedServicio == null && servicios.length === 0 && (
                    <option value="">— No hay servicios disponibles —</option>
                  )}
                  {selectedServicio && !servicios.some(s => s.id === selectedServicio.id) && (
                    <option value={selectedServicio.id}>
                      {selectedServicio.codigo_servicio} - {selectedServicio.cliente_nombre || '—'}
                      {selectedServicio.dias_mora != null ? ` - Mora: ${selectedServicio.dias_mora} días` : ''}
                      {selectedServicio.monto_deuda != null ? ` (Bs. ${selectedServicio.monto_deuda})` : ''}
                    </option>
                  )}
                  {servicios.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.codigo_servicio} - {s.cliente_nombre || '—'}
                      {s.dias_mora != null ? ` - Mora: ${s.dias_mora} días` : ''}
                      {s.monto_deuda != null ? ` (Bs. ${s.monto_deuda})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Tipo de Corte</label>
                <select value={tipoCorte} onChange={(e) => setTipoCorte(e.target.value)}>
                  <option value="LOGICO">Lógico (Bloqueo IP / OLT / RADIUS)</option>
                  <option value="FISICO">Físico (Desconexión de Fibra / NAP)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Motivo del Corte</label>
                <input
                  type="text"
                  required
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                />
              </div>

              <div className="form-group full-width">
                <label>Observaciones Técnicas</label>
                <textarea
                  rows={3}
                  placeholder="Detalles técnicos de la cuadrilla o bloqueo de router..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                />
              </div>
            </div>

            <div className="form-footer">
              <button type="submit" className="btn btn-danger" disabled={loading || !selectedServicio}>
                <Scissors size={18} /> {loading ? 'Ejecutando Corte...' : 'Confirmar y Ejecutar Corte'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
