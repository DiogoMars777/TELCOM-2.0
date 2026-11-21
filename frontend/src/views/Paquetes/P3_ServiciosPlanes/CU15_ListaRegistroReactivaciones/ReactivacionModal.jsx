import React, { useState, useEffect } from 'react';
import { Play, AlertCircle, X, RefreshCw, CheckCircle2, DollarSign, FileText, Hash, Info } from 'lucide-react';

/**
 * Modal de Registro de Reactivación de Servicio (CU15 - Servicios y Planes).
 * Permite reactivar un servicio de internet que se encuentre en estado 'CORTADO',
 * asociar opcionalmente un comprobante de pago/pago_id, definir el costo de reconexión
 * y registrar observaciones técnicas o administrativas.
 */
export default function ReactivacionModal({
  isOpen,
  onClose,
  onSubmit,
  serviciosCortados = [],
  loadingServicios = false,
  serviciosError = null,
  servicioPreseleccionado = null,
  error = null,
  isSubmitting = false,
}) {
  if (!isOpen) return null;

  return (
    <ReactivacionModalContent
      onClose={onClose}
      onSubmit={onSubmit}
      serviciosCortados={serviciosCortados}
      loadingServicios={loadingServicios}
      serviciosError={serviciosError}
      servicioPreseleccionado={servicioPreseleccionado}
      error={error}
      isSubmitting={isSubmitting}
    />
  );
}

function ReactivacionModalContent({
  onClose,
  onSubmit,
  serviciosCortados,
  loadingServicios,
  serviciosError,
  servicioPreseleccionado,
  error,
  isSubmitting,
}) {
  const [servicioId, setServicioId] = useState(() => {
    if (servicioPreseleccionado?.id) return String(servicioPreseleccionado.id);
    if (serviciosCortados.length > 0) return String(serviciosCortados[0].id);
    return '';
  });
  const [pagoId, setPagoId] = useState('');
  const [costoReactivacion, setCostoReactivacion] = useState('50.00');
  const [observaciones, setObservaciones] = useState('');
  const [localError, setLocalError] = useState(null);

  // Sincronizar selección inicial cuando cargan los servicios cortados o cambia la preselección
  useEffect(() => {
    if (servicioPreseleccionado?.id) {
      setServicioId(String(servicioPreseleccionado.id));
    } else if (!servicioId && serviciosCortados.length > 0) {
      setServicioId(String(serviciosCortados[0].id));
    }
  }, [servicioPreseleccionado, serviciosCortados, servicioId]);

  const servicioActual = serviciosCortados.find((s) => String(s.id) === String(servicioId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (!servicioId) {
      setLocalError('Debe seleccionar un servicio en estado CORTADO.');
      return;
    }

    const costoNum = Number(costoReactivacion);
    if (isNaN(costoNum) || costoNum < 0) {
      setLocalError('El costo de reconexión debe ser un valor numérico mayor o igual a 0.');
      return;
    }

    if (observaciones && observaciones.length > 500) {
      setLocalError('Las observaciones no pueden exceder los 500 caracteres.');
      return;
    }

    try {
      await onSubmit({
        servicio_id: Number(servicioId),
        pago_id: pagoId ? Number(pagoId) : null,
        costo_reactivacion: costoNum,
        observaciones: observaciones ? observaciones.trim() : null,
      });
    } catch {
      // El error ya es capturado y manejado en el hook useReactivacionesController
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-reactivacion-title"
      onClick={handleBackdropClick}
    >
      <div className="modal-card modal-card-scrollable" style={{ maxWidth: '600px', width: '95%' }}>
        {/* Cabecera del Modal (Sin subtítulo) */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.45rem', borderRadius: '6px' }}>
              <Play size={20} />
            </div>
            <h3 id="modal-reactivacion-title" style={{ margin: 0, fontSize: '1.15rem' }}>
              Registrar Reactivación de Servicio
            </h3>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            disabled={isSubmitting}
            title="Cerrar modal"
            style={{ padding: '0.35rem 0.5rem', lineHeight: 1 }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden', margin: 0 }}>
          {/* Cuerpo Desplazable del Modal */}
          <div className="modal-body">
            {/* Alertas de carga o errores */}
            {serviciosError && (
              <div className="alert alert-danger" role="alert">
                <AlertCircle size={18} /> No se pudieron cargar los servicios: {serviciosError}
              </div>
            )}

            {!loadingServicios && !serviciosError && serviciosCortados.length === 0 && (
              <div className="alert alert-info" role="alert" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Info size={18} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Sin servicios pendientes:</strong> Actualmente no existen servicios en estado <code>CORTADO</code> para reactivar en el sistema. Todos los enlaces se encuentran activos o normalizados.
                </span>
              </div>
            )}

            {(error || localError) && (
              <div className="alert alert-danger" role="alert">
                <AlertCircle size={18} /> {error || localError}
              </div>
            )}

            {/* Campo: Servicio Cortado */}
            <div className="form-group">
              <label htmlFor="reactivacion-servicio-id" style={{ fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Hash size={14} /> Servicio a Reactivar (Estado: CORTADO) <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <select
                id="reactivacion-servicio-id"
                required
                value={servicioId}
                disabled={loadingServicios || serviciosCortados.length === 0 || isSubmitting}
                onChange={(e) => setServicioId(e.target.value)}
                style={{ padding: '0.65rem 0.85rem' }}
              >
                <option value="">
                  {loadingServicios
                    ? 'Cargando servicios cortados…'
                    : serviciosCortados.length === 0
                    ? '— No hay servicios cortados pendientes —'
                    : '— Seleccione un servicio cortado —'}
                </option>
                {serviciosCortados.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.codigo_servicio} — {s.cliente_nombre || 'Cliente sin nombre'} ({s.ip_asignada || 'Sin IP'})
                  </option>
                ))}
              </select>
            </div>

            {/* Ficha Resumen del Servicio Seleccionado */}
            {servicioActual && (
              <div
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem 1rem',
                  fontSize: '0.8rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.65rem',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Cliente:</span>{' '}
                  <strong>{servicioActual.cliente_nombre || '—'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Código:</span>{' '}
                  <span className="badge badge-info">{servicioActual.codigo_servicio}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>IP Asignada:</span>{' '}
                  <code>{servicioActual.ip_asignada || 'DHCP'}</code>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Estado actual:</span>{' '}
                  <span className="badge badge-danger">{servicioActual.estado_servicio}</span>
                </div>
              </div>
            )}

            {/* Fila: Costo de Reconexión e ID de Pago Opcional */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="reactivacion-costo" style={{ fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <DollarSign size={14} /> Costo Reconexión (Bs.)
                </label>
                <input
                  id="reactivacion-costo"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="50.00"
                  disabled={isSubmitting || serviciosCortados.length === 0}
                  value={costoReactivacion}
                  onChange={(e) => setCostoReactivacion(e.target.value)}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  Arancel cobrado por reconexión física/lógica.
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="reactivacion-pago-id" style={{ fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <FileText size={14} /> ID Pago / Recibo <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>(Opcional)</span>
                </label>
                <input
                  id="reactivacion-pago-id"
                  type="number"
                  min="1"
                  placeholder="Ej. 104"
                  disabled={isSubmitting || serviciosCortados.length === 0}
                  value={pagoId}
                  onChange={(e) => setPagoId(e.target.value)}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  ID del pago registrado en caja (tabla Pago).
                </span>
              </div>
            </div>

            {/* Campo: Observaciones */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="reactivacion-observaciones" style={{ fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <FileText size={14} /> Observaciones
                </label>
                <span style={{ fontSize: '0.7rem', color: observaciones.length > 500 ? 'var(--danger)' : 'var(--text-secondary)' }}>
                  {observaciones.length} / 500
                </span>
              </div>
              <textarea
                id="reactivacion-observaciones"
                rows={3}
                maxLength={500}
                disabled={isSubmitting || serviciosCortados.length === 0}
                placeholder="Detalle de regularización, comprobante de pago o constancia del cliente..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Modal Footer Estandarizado Fijo */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || loadingServicios || serviciosCortados.length === 0 || !servicioId}
              style={{ minWidth: '180px' }}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="spin" /> Reactivando…
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} /> Confirmar Reactivación
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
