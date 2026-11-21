import React, { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

export default function CancelarSolicitudModal({
  isOpen,
  onClose,
  solicitud,
  onConfirm,
  loading,
}) {
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState(null);

  if (!isOpen || !solicitud) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!motivo.trim()) {
      setError('Debe especificar el motivo de la cancelación.');
      return;
    }
    onConfirm(motivo);
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-container modal-sm">
        <div className="modal-header">
          <div className="modal-header-title">
            <div className="modal-header-icon" style={{ background: '#FEE2E2', color: '#DC2626' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="modal-title">Cancelar Solicitud</h3>
              <p className="modal-subtitle">
                Orden: {solicitud.numero_orden || solicitud.numeroOrden}
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '1rem' }}>
              ¿Está seguro de que desea cancelar esta solicitud de instalación? Esta acción
              quedará registrada en la bitácora de auditoría.
            </p>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                Motivo de la Cancelación *
              </label>
              <textarea
                className={`form-control ${error ? 'is-invalid' : ''}`}
                rows={3}
                placeholder="Ej: Cliente desiste del servicio, zona fuera de alcance, error en datos..."
                value={motivo}
                onChange={(e) => {
                  setMotivo(e.target.value);
                  setError(null);
                }}
              />
              {error && (
                <p className="form-error" style={{ color: '#EF4444', fontSize: '0.82rem', marginTop: '0.25rem' }}>
                  {error}
                </p>
              )}
            </div>
          </div>

          <div className="modal-footer" style={{ borderTop: '1px solid #E2E8F0', padding: '0.85rem 1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Volver
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              disabled={loading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Confirmar Cancelación
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

