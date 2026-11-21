import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  FileText,
  X,
  RefreshCw,
  AlertTriangle,
  MapPin,
} from 'lucide-react';

const FRANJAS_HORARIAS = [
  '08:30',
  '10:30',
  '14:00',
  '16:00',
  '17:30',
];

export default function ProgramarInstalacionModal({
  isOpen,
  onClose,
  solicitud,
  tecnicos = [],
  onSubmit,
  isSubmitting = false,
  error = null,
  checkConflictoHorario,
  getHorariosOcupados,
}) {
  if (!isOpen || !solicitud) return null;

  return (
    <ProgramarInstalacionModalContent
      onClose={onClose}
      solicitud={solicitud}
      tecnicos={tecnicos}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      error={error}
      checkConflictoHorario={checkConflictoHorario}
      getHorariosOcupados={getHorariosOcupados}
    />
  );
}

function ProgramarInstalacionModalContent({
  onClose,
  solicitud,
  tecnicos,
  onSubmit,
  isSubmitting,
  error,
  checkConflictoHorario,
  getHorariosOcupados,
}) {
  const [hoyStr] = useState(() => new Date().toISOString().slice(0, 10));

  const [tecnicoId, setTecnicoId] = useState(() => (tecnicos.length > 0 ? String(tecnicos[0].id) : ''));
  const [fechaProgramada, setFechaProgramada] = useState(() => new Date().toISOString().slice(0, 10));
  const [horaProgramada, setHoraProgramada] = useState('09:00');
  const [costoInstalacion, setCostoInstalacion] = useState('150.00');
  const [observaciones, setObservaciones] = useState('');
  const [localError, setLocalError] = useState(null);

  // Comprobar conflicto de horario en vivo
  const conflictoDetectado = checkConflictoHorario ? checkConflictoHorario(tecnicoId, fechaProgramada, horaProgramada) : false;
  const horariosOcupados = getHorariosOcupados ? getHorariosOcupados(tecnicoId, fechaProgramada) : [];

  const tecnicoSeleccionado = tecnicos.find((t) => String(t.id) === String(tecnicoId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (!tecnicoId) {
      setLocalError('Debe seleccionar un técnico responsable.');
      return;
    }

    if (!fechaProgramada) {
      setLocalError('Debe indicar la fecha programada de la instalación.');
      return;
    }

    if (conflictoDetectado) {
      setLocalError('El técnico seleccionado ya tiene otra instalación programada en ese mismo día y horario.');
      return;
    }

    try {
      await onSubmit({
        solicitud_id: Number(solicitud.id),
        tecnico_id: Number(tecnicoId),
        fecha_programada: fechaProgramada,
        hora_programada: horaProgramada,
        costo_instalacion: Number(costoInstalacion || 150),
        observaciones: observaciones ? observaciones.trim() : null,
      });
    } catch {
      // El error se maneja en el hook useInstalacionesController
    }
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-programar-title"
      onClick={handleBackdrop}
    >
      <div className="modal-card modal-card-scrollable" style={{ maxWidth: '660px', width: '95%' }}>
        {/* Cabecera FIJA del Modal (Sin subtítulo) */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.5rem', borderRadius: '8px' }}>
              <Calendar size={20} />
            </div>
            <h3 id="modal-programar-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
              Programar Instalación y Asignar Cuadrilla
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

        {/* Formulario con cuerpo scrollable y pie fijo */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
            margin: 0,
          }}
        >
          {/* Cuerpo Desplazable del Modal */}
          <div className="modal-body">
            {/* 1. Contexto de la Solicitud y Abonado (Tarjeta Limpia y Responsiva) */}
            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(51, 65, 85, 0.7)',
                borderRadius: 'var(--radius-md)',
                padding: '1.1rem 1.25rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '0.85rem 1.25rem',
                fontSize: '0.82rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Nro. Orden:</span>
                <span
                  className="badge badge-primary"
                  style={{
                    borderRadius: '9999px',
                    padding: '0.2rem 0.65rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    letterSpacing: '0.3px',
                  }}
                >
                  {solicitud.numero_orden}
                </span>
              </div>

              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Fecha Solicitud:</span>{' '}
                <strong style={{ color: '#fff' }}>{solicitud.fecha_solicitud}</strong>
              </div>

              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Abonado:</span>{' '}
                <strong style={{ color: '#fff' }}>{solicitud.cliente_nombre}</strong>{' '}
                <span style={{ color: 'var(--text-muted)' }}>({solicitud.cliente_ci})</span>
              </div>

              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Teléfono:</span>{' '}
                <strong style={{ color: '#fff' }}>{solicitud.cliente_telefono}</strong>
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'flex-start', gap: '0.4rem', color: 'var(--text-secondary)', borderTop: '1px solid rgba(51, 65, 85, 0.4)', paddingTop: '0.65rem' }}>
                <MapPin size={15} style={{ flexShrink: 0, marginTop: '2px', color: '#38bdf8' }} />
                <span>
                  <strong style={{ color: '#fff' }}>Dirección:</strong> {solicitud.direccion || 'Sin dirección registrada'}
                  {solicitud.referencia && <span style={{ color: 'var(--text-muted)' }}> ({solicitud.referencia})</span>}
                </span>
              </div>
            </div>

            {/* Alertas de error */}
            {(error || localError) && (
              <div className="alert alert-danger" role="alert" style={{ margin: 0, fontSize: '0.82rem' }}>
                <AlertCircle size={18} /> {error || localError}
              </div>
            )}

            {/* 2. Asignación de Técnico / Cuadrilla */}
            <div className="form-group">
              <label
                htmlFor="inst-tecnico-id"
                style={{ fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <UserCheck size={15} style={{ color: '#38bdf8' }} /> Técnico / Cuadrilla Asignada <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <select
                id="inst-tecnico-id"
                required
                value={tecnicoId}
                disabled={isSubmitting || tecnicos.length === 0}
                onChange={(e) => setTecnicoId(e.target.value)}
                style={{ padding: '0.7rem 0.9rem', fontSize: '0.85rem', width: '100%' }}
              >
                <option value="">— Seleccione cuadrilla técnica —</option>
                {tecnicos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre_completo} — {t.especialidad}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Fechas y Horas: Grid de 2 Columnas Responsivo */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group">
                <label
                  htmlFor="inst-fecha"
                  style={{ fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Calendar size={15} style={{ color: '#38bdf8' }} /> Fecha Programada <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  id="inst-fecha"
                  type="date"
                  required
                  min={hoyStr}
                  disabled={isSubmitting}
                  value={fechaProgramada}
                  onChange={(e) => setFechaProgramada(e.target.value)}
                  style={{ padding: '0.65rem 0.85rem', width: '100%' }}
                />
              </div>

              <div className="form-group">
                <label
                  htmlFor="inst-hora"
                  style={{ fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Clock size={15} style={{ color: '#38bdf8' }} /> Hora Estimada <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  id="inst-hora"
                  type="time"
                  required
                  disabled={isSubmitting}
                  value={horaProgramada}
                  onChange={(e) => setHoraProgramada(e.target.value)}
                  style={{ padding: '0.65rem 0.85rem', width: '100%' }}
                />
              </div>
            </div>

            {/* 4. Franjas Recomendadas con Margen Superior Amplio y Botones Píldora */}
            <div style={{ marginTop: '0.35rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.6rem' }}>
                Franjas recomendadas para la fecha seleccionada:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                {FRANJAS_HORARIAS.map((franja) => {
                  const ocupado = horariosOcupados.includes(franja);
                  const seleccionado = horaProgramada === franja;

                  return (
                    <button
                      key={franja}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setHoraProgramada(franja)}
                      style={{
                        padding: '0.45rem 0.9rem',
                        fontSize: '0.78rem',
                        borderRadius: '9999px',
                        cursor: 'pointer',
                        border: seleccionado
                          ? '1px solid #38bdf8'
                          : ocupado
                          ? '1px solid rgba(239, 68, 68, 0.4)'
                          : '1px solid var(--border-color)',
                        backgroundColor: ocupado
                          ? 'rgba(239, 68, 68, 0.15)'
                          : seleccionado
                          ? 'rgba(56, 189, 248, 0.2)'
                          : 'rgba(30, 41, 59, 0.65)',
                        color: ocupado ? '#f87171' : seleccionado ? '#38bdf8' : 'var(--text-primary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        boxShadow: seleccionado ? '0 0 12px rgba(56, 189, 248, 0.3)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Clock size={13} />
                      <span>{franja}</span>
                      {ocupado && <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>(Ocupado)</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Advertencia visual en caso de cruce */}
            {conflictoDetectado && (
              <div className="alert alert-warning" role="alert" style={{ fontSize: '0.82rem', margin: 0 }}>
                <AlertTriangle size={18} />
                <span>
                  <strong>¡Cruce de horario!</strong> El técnico{' '}
                  <strong>{tecnicoSeleccionado?.nombre_completo}</strong> ya tiene asignada una instalación para el{' '}
                  <strong>{fechaProgramada}</strong> a las <strong>{horaProgramada}</strong>.
                </span>
              </div>
            )}

            {/* 5. Costo de Instalación */}
            <div className="form-group">
              <label
                htmlFor="inst-costo"
                style={{ fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <DollarSign size={15} style={{ color: '#38bdf8' }} /> Costo de Instalación (Bs.)
              </label>
              <input
                id="inst-costo"
                type="number"
                min="0"
                step="0.01"
                placeholder="150.00"
                disabled={isSubmitting}
                value={costoInstalacion}
                onChange={(e) => setCostoInstalacion(e.target.value)}
                style={{ padding: '0.65rem 0.85rem', width: '100%' }}
              />
            </div>

            {/* 6. Observaciones Técnicas */}
            <div className="form-group">
              <label
                htmlFor="inst-observaciones"
                style={{ fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <FileText size={15} style={{ color: '#38bdf8' }} /> Observaciones Técnicas
              </label>
              <textarea
                id="inst-observaciones"
                rows={3}
                maxLength={500}
                disabled={isSubmitting}
                placeholder="Instrucciones para cuadrilla, acceso a poste NAP, tipo de acometida..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                style={{ padding: '0.65rem 0.85rem', width: '100%', resize: 'vertical' }}
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
              disabled={isSubmitting || conflictoDetectado || !tecnicoId || !fechaProgramada}
              style={{ minWidth: '190px' }}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="spin" /> Agendando…
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} /> Programar Instalación
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
