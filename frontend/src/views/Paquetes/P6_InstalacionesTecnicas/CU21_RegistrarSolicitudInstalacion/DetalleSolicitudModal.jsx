import React from 'react';
import {
  X,
  Printer,
  MapPin,
  Calendar,
  User,
  Phone,
  Mail,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
} from 'lucide-react';

export default function DetalleSolicitudModal({ isOpen, onClose, solicitud }) {
  if (!isOpen || !solicitud) return null;

  const lat = solicitud.latitud;
  const lng = solicitud.longitud;
  const hasGps = lat && lng;
  const mapsUrl = hasGps ? `https://www.google.com/maps?q=${lat},${lng}` : null;

  const cliente = solicitud.cliente || {};
  const estado = solicitud.estado_solicitud || solicitud.estadoSolicitud || 'PENDIENTE';

  const estadoBadgeClass = {
    PENDIENTE: 'badge-warning',
    PROGRAMADA: 'badge-info',
    INSTALADO: 'badge-success',
    COMPLETADA: 'badge-success',
    CANCELADA: 'badge-danger',
  }[estado] || 'badge-secondary';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-container modal-md" style={{ maxWidth: '600px' }}>
        {/* Cabecera */}
        <div className="modal-header">
          <div className="modal-header-title">
            <div className="modal-header-icon" style={{ background: '#ECFDF5', color: '#059669' }}>
              <FileText size={20} />
            </div>
            <div>
              <h3 className="modal-title">Comprobante de Solicitud de Instalación</h3>
              <p className="modal-subtitle">Orden Oficial TELCOM Telecomunicaciones</p>
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

        {/* Cuerpo / Boleta */}
        <div className="modal-body" style={{ padding: '1.25rem' }}>
          {/* Banner con N° de Orden y Estado */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#F1F5F9',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.25rem',
            }}
          >
            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Número de Orden
              </span>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
                {solicitud.numero_orden || solicitud.numeroOrden}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className={`badge ${estadoBadgeClass}`} style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
                {estado}
              </span>
              <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.25rem' }}>
                Fecha: {solicitud.fecha_solicitud || solicitud.fechaSolicitud}
              </div>
            </div>
          </div>

          {/* Información del Cliente */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1E293B', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <User size={16} className="text-primary" /> Datos del Abonado
            </h4>
            <div style={{ background: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.9rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <span style={{ color: '#64748B', fontSize: '0.8rem' }}>Nombre Completo:</span>
                  <div style={{ fontWeight: 600 }}>{cliente.nombreCompleto || 'N/A'}</div>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: '0.8rem' }}>Carnet de Identidad:</span>
                  <div style={{ fontWeight: 600 }}>{cliente.ci || 'N/A'}</div>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: '0.8rem' }}>Teléfono / Celular:</span>
                  <div>{cliente.telefonoPrincipal || 'S/N'}</div>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: '0.8rem' }}>Código Cliente:</span>
                  <div>{cliente.codigoCliente || 'S/N'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Domicilio y Coordenadas */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1E293B', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MapPin size={16} className="text-primary" /> Ubicación de la Instalación
            </h4>
            <div style={{ background: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.9rem' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: '#64748B', fontSize: '0.8rem' }}>Dirección:</span>
                <div style={{ fontWeight: 500 }}>{solicitud.direccion}</div>
              </div>
              {solicitud.referencia && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <span style={{ color: '#64748B', fontSize: '0.8rem' }}>Referencia:</span>
                  <div>{solicitud.referencia}</div>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #CBD5E1' }}>
                <div>
                  <span style={{ color: '#64748B', fontSize: '0.8rem' }}>Coordenadas GPS:</span>
                  <div>{hasGps ? `${lat}, ${lng}` : 'No registradas'}</div>
                </div>
                {hasGps && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}
                  >
                    <ExternalLink size={14} /> Abrir en Maps
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Observaciones */}
          {solicitud.observacion && (
            <div>
              <span style={{ color: '#64748B', fontSize: '0.8rem' }}>Observaciones Técnicas:</span>
              <div style={{ background: '#FFFBEB', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #FDE68A', fontSize: '0.88rem', color: '#92400E' }}>
                {solicitud.observacion}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ borderTop: '1px solid #E2E8F0', padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'space-between' }}>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={handlePrint}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Printer size={16} /> Imprimir Comprobante
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}

