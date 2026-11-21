import React, { useState, useEffect } from 'react';
import {
  X,
  Wifi,
  MapPin,
  Crosshair,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Compass,
} from 'lucide-react';
import {
  solicitudInstalacionService,
  initialSolicitudPublica,
} from '../../models/Paquetes/P6_InstalacionesTecnicas/CU21_RegistrarSolicitudInstalacion/solicitudInstalacionModel';

export default function PortalSolicitudModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState(initialSolicitudPublica);
  const [zonas, setZonas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState(null);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [comprobante, setComprobante] = useState(null);

  useEffect(() => {
    if (isOpen) {
      solicitudInstalacionService
        .fetchZonasDisponibles()
        .then((data) => setZonas(data))
        .catch((err) => console.warn('Error zonas:', err));
      setComprobante(null);
      setError(null);
      setFormErrors({});
      setFormData(initialSolicitudPublica);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const capturarGPS = () => {
    if (!navigator.geolocation) {
      setGpsStatus('Geolocalización no soportada por el navegador.');
      return;
    }
    setGpsLoading(true);
    setGpsStatus('Localizando coordenadas GPS...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(7));
        const lng = parseFloat(pos.coords.longitude.toFixed(7));
        setFormData((prev) => ({ ...prev, latitud: lat, longitud: lng }));
        setGpsLoading(false);
        setGpsStatus(`GPS capturado: [${lat}, ${lng}]`);
      },
      (err) => {
        setGpsLoading(false);
        setGpsStatus(`Aviso: ${err.message}. Puede continuar sin GPS.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFormErrors({});

    const errors = {};
    if (!formData.nombres.trim()) errors.nombres = 'Ingrese su nombre completo.';
    if (!formData.ci.trim()) errors.ci = 'El carnet de identidad es obligatorio.';
    if (!formData.telefono.trim()) errors.telefono = 'Ingrese un número telefónico de contacto.';
    if (!formData.direccion.trim()) errors.direccion = 'La dirección de su domicilio es requerida.';
    if (!formData.zona_id) errors.zona_id = 'Seleccione su zona o barrio.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const res = await solicitudInstalacionService.crearSolicitudPublica(formData);
      setComprobante(res?.data || res);
    } catch (err) {
      if (err?.errors) {
        setFormErrors(err.errors);
      } else {
        setError(err?.message || 'Ocurrió un error al registrar la solicitud.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" style={{ zIndex: 1100 }}>
      <div className="modal-container modal-lg">
        {/* Cabecera */}
        <div className="modal-header">
          <div className="modal-header-title">
            <div className="modal-header-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
              <Wifi size={20} />
            </div>
            <div>
              <h3 className="modal-title">Solicitar Instalación de Internet</h3>
              <p className="modal-subtitle">Cobertura de Fibra Óptica TELCOM</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Cerrar modal">
            <X size={20} />
          </button>
        </div>

        {/* Éxito: Mostrar Comprobante */}
        {comprobante ? (
          <div className="modal-body" style={{ padding: '2rem', textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#ECFDF5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h3 style={{ color: '#0F172A', fontWeight: 700, marginBottom: '0.5rem' }}>
              ¡Solicitud Registrada con Éxito!
            </h3>
            <p style={{ color: '#64748B', maxWidth: '450px', margin: '0 auto 1.5rem auto', fontSize: '0.95rem' }}>
              Su solicitud de instalación ha sido ingresada en nuestro sistema central. Un asesor técnico se comunicará
              con usted al número proporcionado.
            </p>

            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '1.25rem',
                maxWidth: '400px',
                margin: '0 auto 1.5rem auto',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#64748B', fontSize: '0.85rem' }}>N° Orden de Solicitud:</span>
                <strong style={{ color: '#1E40AF', fontFamily: 'monospace', fontSize: '1rem' }}>
                  {comprobante.solicitud?.numeroOrden || comprobante.solicitud?.numero_orden || 'ORD-2026-NUEVA'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#64748B', fontSize: '0.85rem' }}>Abonado:</span>
                <span style={{ fontWeight: 600 }}>{formData.nombres}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#64748B', fontSize: '0.85rem' }}>Estado:</span>
                <span className="badge badge-warning">PENDIENTE</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B', fontSize: '0.85rem' }}>Dirección:</span>
                <span style={{ fontSize: '0.85rem', color: '#334155', maxWidth: '200px', textAlign: 'right' }}>
                  {formData.direccion}
                </span>
              </div>
            </div>

            <button type="button" className="btn btn-primary" onClick={onClose}>
              Entendido, Finalizar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {error && (
                <div className="alert alert-danger" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              {/* Datos personales */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    className={`form-control ${formErrors.nombres ? 'is-invalid' : ''}`}
                    placeholder="Ej: Carlos Suárez Mercado"
                    value={formData.nombres}
                    onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                  />
                  {formErrors.nombres && (
                    <p style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '0.2rem' }}>{formErrors.nombres}</p>
                  )}
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Carnet de Identidad (CI) *
                  </label>
                  <input
                    type="text"
                    className={`form-control ${formErrors.ci ? 'is-invalid' : ''}`}
                    placeholder="Ej: 7854123 SC"
                    value={formData.ci}
                    onChange={(e) => setFormData({ ...formData, ci: e.target.value })}
                  />
                  {formErrors.ci && (
                    <p style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '0.2rem' }}>{formErrors.ci}</p>
                  )}
                </div>
              </div>

              {/* Contacto */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    className={`form-control ${formErrors.telefono ? 'is-invalid' : ''}`}
                    placeholder="Ej: 77011223"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                  {formErrors.telefono && (
                    <p style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '0.2rem' }}>{formErrors.telefono}</p>
                  )}
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Correo Electrónico (Opcional)
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="correo@ejemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Ubicación y Zona */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Zona o Barrio de Cobertura *
                  </label>
                  <select
                    className={`form-control ${formErrors.zona_id ? 'is-invalid' : ''}`}
                    value={formData.zona_id}
                    onChange={(e) => setFormData({ ...formData, zona_id: e.target.value })}
                  >
                    <option value="">-- Seleccionar Zona --</option>
                    {zonas.map((z) => (
                      <option key={z.idZona} value={z.idZona}>
                        {z.nombreZona} ({z.estadoCobertura || 'Disponible'})
                      </option>
                    ))}
                  </select>
                  {formErrors.zona_id && (
                    <p style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '0.2rem' }}>{formErrors.zona_id}</p>
                  )}
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Plan de Interés
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej: 50 Mbps / 100 Mbps"
                    value={formData.plan_sugerido}
                    onChange={(e) => setFormData({ ...formData, plan_sugerido: e.target.value })}
                  />
                </div>
              </div>

              {/* Dirección */}
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Dirección Exacta del Domicilio *
                </label>
                <input
                  type="text"
                  className={`form-control ${formErrors.direccion ? 'is-invalid' : ''}`}
                  placeholder="Ej: Av. Principal, Calle Los Sauces #45"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                />
                {formErrors.direccion && (
                  <p style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '0.2rem' }}>{formErrors.direccion}</p>
                )}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Referencias para llegar al Domicilio
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: Frente a la cancha polifuncional, rejas negras"
                  value={formData.referencia}
                  onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
                />
              </div>

              {/* GPS */}
              <div style={{ padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Compass size={15} className="text-primary" /> Ubicación GPS (Recomendado)
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={capturarGPS}
                    disabled={gpsLoading}
                    style={{ fontSize: '0.8rem' }}
                  >
                    {gpsLoading ? <Loader2 size={13} className="animate-spin" /> : <Crosshair size={13} />} Compartir mi ubicación GPS
                  </button>
                </div>
                {gpsStatus && (
                  <p style={{ fontSize: '0.8rem', color: '#2563EB', margin: '0.35rem 0 0 0' }}>{gpsStatus}</p>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid #E2E8F0', padding: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Enviar Solicitud
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

