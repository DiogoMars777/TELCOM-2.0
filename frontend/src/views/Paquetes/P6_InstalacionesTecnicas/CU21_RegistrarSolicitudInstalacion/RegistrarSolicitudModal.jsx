import React, { useState } from 'react';
import {
  X,
  MapPin,
  Crosshair,
  Search,
  CheckCircle2,
  AlertCircle,
  User,
  Compass,
  FileText,
  Loader2,
} from 'lucide-react';

export default function RegistrarSolicitudModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  formErrors,
  selectedCliente,
  clientesEncontrados,
  buscandoClientes,
  zonas,
  gpsLoading,
  gpsStatus,
  onBuscarClientes,
  onSeleccionarCliente,
  onCapturarGPS,
  onSubmit,
  loading,
}) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-container modal-lg">
        {/* Encabezado */}
        <div className="modal-header">
          <div className="modal-header-title">
            <div className="modal-header-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
              <FileText size={20} />
            </div>
            <div>
              <h3 className="modal-title">Registrar Solicitud de Instalación (CU21)</h3>
              <p className="modal-subtitle">
                Alta formal de orden de servicio de fibra óptica y asignación geográfica
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={onSubmit}>
          <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            {/* Sección 1: Selección de Cliente Registrado */}
            <div style={{ marginBottom: '1.25rem', padding: '1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={16} className="text-primary" />
                1. Seleccionar Cliente Abonado *
              </label>

              {!selectedCliente ? (
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Buscar por Nombre, CI o Código de Cliente..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          onBuscarClientes(e.target.value);
                        }}
                      />
                      {buscandoClientes && (
                        <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                          <Loader2 size={16} className="animate-spin text-muted" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lista de coincidencias */}
                  {clientesEncontrados.length > 0 && (
                    <ul
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 20,
                        background: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        maxHeight: '180px',
                        overflowY: 'auto',
                        padding: '0.25rem 0',
                        margin: '0.25rem 0 0 0',
                        listStyle: 'none',
                      }}
                    >
                      {clientesEncontrados.map((cli) => (
                        <li
                          key={cli.idCliente || cli.id}
                          onClick={() => {
                            onSeleccionarCliente(cli);
                            setSearchTerm('');
                          }}
                          style={{
                            padding: '0.5rem 0.75rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid #F1F5F9',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#F0F9FF')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                        >
                          <div>
                            <strong>{cli.nombreCompleto}</strong>{' '}
                            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                              (CI: {cli.ci})
                            </span>
                          </div>
                          <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>
                            {cli.codigoCliente}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {formErrors.cliente_id && (
                    <p className="form-error" style={{ color: '#EF4444', fontSize: '0.82rem', marginTop: '0.35rem' }}>
                      {formErrors.cliente_id}
                    </p>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#EFF6FF',
                    padding: '0.75rem 1rem',
                    borderRadius: '6px',
                    border: '1px solid #BFDBFE',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: '#1E40AF' }}>
                      {selectedCliente.nombreCompleto}
                    </span>{' '}
                    <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                      · CI: {selectedCliente.ci} · Tel: {selectedCliente.telefonoPrincipal || 'S/N'}
                    </span>
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                      Código: {selectedCliente.codigoCliente}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => onSeleccionarCliente(null)}
                  >
                    Cambiar Cliente
                  </button>
                </div>
              )}
            </div>

            {/* Sección 2: Dirección y Zona de Cobertura */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Dirección de Instalación *
                </label>
                <input
                  type="text"
                  className={`form-control ${formErrors.direccion ? 'is-invalid' : ''}`}
                  placeholder="Ej: Av. Banzer Km 8, Calle 4 #150"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                />
                {formErrors.direccion && (
                  <p className="form-error" style={{ color: '#EF4444', fontSize: '0.82rem', marginTop: '0.25rem' }}>
                    {formErrors.direccion}
                  </p>
                )}
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Zona de Cobertura
                </label>
                <select
                  className="form-control"
                  value={formData.zona_id || ''}
                  onChange={(e) => setFormData({ ...formData, zona_id: e.target.value })}
                >
                  <option value="">-- Seleccionar Zona --</option>
                  {zonas.map((z) => (
                    <option key={z.idZona} value={z.idZona}>
                      {z.nombreZona} ({z.estadoCobertura || 'Disponible'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Referencia */}
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ fontWeight: 600 }}>
                Referencia Detallada del Domicilio
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej: Portón de madera, frente al colegio, poste de luz con transformador"
                value={formData.referencia}
                onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
              />
            </div>

            {/* Sección 3: Coordenadas Satelitales (GPS) */}
            <div style={{ marginBottom: '1.25rem', padding: '1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                  <Compass size={16} className="text-primary" />
                  Coordenadas Satelitales GPS
                </label>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={onCapturarGPS}
                  disabled={gpsLoading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  {gpsLoading ? <Loader2 size={14} className="animate-spin" /> : <Crosshair size={14} />}
                  Capturar Ubicación Actual (GPS)
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.82rem', color: '#64748B' }}>Latitud Decimal</span>
                  <input
                    type="number"
                    step="0.0000001"
                    className="form-control"
                    placeholder="-17.7833000"
                    value={formData.latitud || ''}
                    onChange={(e) => setFormData({ ...formData, latitud: e.target.value ? parseFloat(e.target.value) : '' })}
                  />
                </div>
                <div>
                  <span style={{ fontSize: '0.82rem', color: '#64748B' }}>Longitud Decimal</span>
                  <input
                    type="number"
                    step="0.0000001"
                    className="form-control"
                    placeholder="-63.1821000"
                    value={formData.longitud || ''}
                    onChange={(e) => setFormData({ ...formData, longitud: e.target.value ? parseFloat(e.target.value) : '' })}
                  />
                </div>
              </div>

              {gpsStatus && (
                <p style={{ fontSize: '0.8rem', color: '#2563EB', marginTop: '0.5rem', marginBottom: 0 }}>
                  {gpsStatus}
                </p>
              )}
            </div>

            {/* Plan sugerido y Observaciones */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Plan / Velocidad Requerida
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: Plan Fibra 50 Mbps / Plan 100 Mbps"
                  value={formData.plan_sugerido}
                  onChange={(e) => setFormData({ ...formData, plan_sugerido: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Observaciones / Notas Técnicas
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: Dispone de cañería interna, poste a 50m..."
                  value={formData.observacion}
                  onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Pie de modal */}
          <div className="modal-footer" style={{ borderTop: '1px solid #E2E8F0', padding: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Confirmar Solicitud de Instalación
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

