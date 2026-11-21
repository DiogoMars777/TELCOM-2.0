import React from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  MapPin,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Eye,
  Trash2,
  Calendar,
  Layers,
} from 'lucide-react';
import { useSolicitudInstalacionController } from '../../../../controllers/Paquetes/P6_InstalacionesTecnicas/CU21_RegistrarSolicitudInstalacion/useSolicitudInstalacionController';
import RegistrarSolicitudModal from './RegistrarSolicitudModal';
import DetalleSolicitudModal from './DetalleSolicitudModal';
import CancelarSolicitudModal from './CancelarSolicitudModal';

export default function SolicitudInstalacionView({ user }) {
  const {
    solicitudes,
    loading,
    error,
    successMessage,
    filtros,
    paginacion,
    isCreateOpen,
    isDetalleOpen,
    isCancelarOpen,
    selectedSolicitud,
    formData,
    formErrors,
    selectedCliente,
    clientesEncontrados,
    zonas,
    buscandoClientes,
    gpsLoading,
    gpsStatus,
    setIsCreateOpen,
    setIsDetalleOpen,
    setIsCancelarOpen,
    setSelectedSolicitud,
    setFormData,
    setSuccessMessage,
    setError,
    handleFiltroChange,
    limpiarFiltros,
    buscarClientes,
    seleccionarCliente,
    capturarUbicacionGPS,
    registrarSolicitud,
    cancelarSolicitud,
    cargarSolicitudes,
  } = useSolicitudInstalacionController();

  // Métricas
  const totalSolicitudes = solicitudes.length;
  const pendientesCount = solicitudes.filter(
    (s) => (s.estado_solicitud || s.estadoSolicitud) === 'PENDIENTE'
  ).length;
  const programadasCount = solicitudes.filter(
    (s) => (s.estado_solicitud || s.estadoSolicitud) === 'PROGRAMADA'
  ).length;
  const instaladasCount = solicitudes.filter(
    (s) =>
      (s.estado_solicitud || s.estadoSolicitud) === 'INSTALADO' ||
      (s.estado_solicitud || s.estadoSolicitud) === 'COMPLETADA'
  ).length;

  const renderEstadoBadge = (estado) => {
    switch (estado) {
      case 'PENDIENTE':
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={12} /> Pendiente
          </span>
        );
      case 'PROGRAMADA':
        return (
          <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Calendar size={12} /> Programada
          </span>
        );
      case 'INSTALADO':
      case 'COMPLETADA':
        return (
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <CheckCircle size={12} /> Instalado
          </span>
        );
      case 'CANCELADA':
        return (
          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <XCircle size={12} /> Cancelada
          </span>
        );
      default:
        return <span className="badge badge-secondary">{estado || 'PENDIENTE'}</span>;
    }
  };

  return (
    <div className="module-container">
      {/* Encabezado del Módulo */}
      <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h1 className="module-title" style={{ margin: 0 }}>
              Solicitudes de Instalación
            </h1>
            <span className="badge badge-primary" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
              CU21 · Ciclo 3
            </span>
          </div>
          <p className="module-subtitle" style={{ color: '#64748B', margin: 0, fontSize: '0.9rem' }}>
            Registro formal de solicitudes de servicio, levantamiento GPS del domicilio y validación de cobertura técnica.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsCreateOpen(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 2px 4px rgba(37,99,235,0.2)' }}
        >
          <Plus size={18} />
          Nueva Solicitud de Instalación
        </button>
      </div>

      {/* Alertas */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button type="button" className="btn-close" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success" style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={18} />
            <span>{successMessage}</span>
          </div>
          <button type="button" className="btn-close" onClick={() => setSuccessMessage(null)}>✕</button>
        </div>
      )}

      {/* Tarjetas de Indicadores */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card-kpi" style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Registradas
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0F172A', marginTop: '0.25rem' }}>
            {paginacion.total || totalSolicitudes}
          </div>
        </div>

        <div className="card-kpi" style={{ background: '#FFFBEB', padding: '1rem', borderRadius: '8px', border: '1px solid #FDE68A' }}>
          <div style={{ fontSize: '0.8rem', color: '#B45309', fontWeight: 600, textTransform: 'uppercase' }}>
            Pendientes de Programar
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#D97706', marginTop: '0.25rem' }}>
            {pendientesCount}
          </div>
        </div>

        <div className="card-kpi" style={{ background: '#EFF6FF', padding: '1rem', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
          <div style={{ fontSize: '0.8rem', color: '#1E40AF', fontWeight: 600, textTransform: 'uppercase' }}>
            Programadas (CU22)
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#2563EB', marginTop: '0.25rem' }}>
            {programadasCount}
          </div>
        </div>

        <div className="card-kpi" style={{ background: '#ECFDF5', padding: '1rem', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
          <div style={{ fontSize: '0.8rem', color: '#065F46', fontWeight: 600, textTransform: 'uppercase' }}>
            Instaladas / Cerradas
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#059669', marginTop: '0.25rem' }}>
            {instaladasCount}
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por orden, cliente, CI, dirección..."
              value={filtros.search}
              onChange={(e) => handleFiltroChange('search', e.target.value)}
              style={{ paddingLeft: '2.25rem' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          </div>

          <div>
            <select
              className="form-control"
              value={filtros.estado}
              onChange={(e) => handleFiltroChange('estado', e.target.value)}
            >
              <option value="">-- Todos los Estados --</option>
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="PROGRAMADA">PROGRAMADA</option>
              <option value="INSTALADO">INSTALADO / COMPLETADA</option>
              <option value="CANCELADA">CANCELADA</option>
            </select>
          </div>

          <div>
            <input
              type="date"
              className="form-control"
              value={filtros.fecha_desde}
              onChange={(e) => handleFiltroChange('fecha_desde', e.target.value)}
              title="Fecha Desde"
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="date"
              className="form-control"
              value={filtros.fecha_hasta}
              onChange={(e) => handleFiltroChange('fecha_hasta', e.target.value)}
              title="Fecha Hasta"
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={limpiarFiltros}
              title="Limpiar filtros"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Resultados */}
      <div className="card" style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
            <RefreshCw size={32} className="animate-spin text-primary" style={{ margin: '0 auto 0.75rem auto' }} />
            <p>Cargando solicitudes de instalación...</p>
          </div>
        ) : solicitudes.length === 0 ? (
          <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748B' }}>
            <FileText size={40} style={{ color: '#CBD5E1', margin: '0 auto 0.75rem auto' }} />
            <h4 style={{ color: '#334155', fontWeight: 600 }}>No se encontraron solicitudes</h4>
            <p style={{ fontSize: '0.9rem' }}>
              No existen solicitudes de instalación registradas con los filtros seleccionados.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>N° Orden</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Abonado / Cliente</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Dirección & Ubicación</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Fecha</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Estado</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.map((sol) => {
                  const cliente = sol.cliente || {};
                  const lat = sol.latitud;
                  const lng = sol.longitud;
                  const hasGps = lat && lng;
                  const estado = sol.estado_solicitud || sol.estadoSolicitud || 'PENDIENTE';

                  return (
                    <tr key={sol.id || sol.idSolicitud} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontWeight: 600, color: '#1E293B' }}>
                        {sol.numero_orden || sol.numeroOrden}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>
                          {cliente.nombreCompleto || 'Abonado S/N'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                          CI: {cliente.ci || 'S/N'} · Tel: {cliente.telefonoPrincipal || 'S/N'}
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ color: '#334155' }}>{sol.direccion}</div>
                        {sol.referencia && (
                          <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                            Ref: {sol.referencia}
                          </div>
                        )}
                        {hasGps && (
                          <a
                            href={`https://www.google.com/maps?q=${lat},${lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.78rem', color: '#2563EB', marginTop: '0.2rem' }}
                          >
                            <MapPin size={12} /> [{lat.toFixed(4)}, {lng.toFixed(4)}]
                          </a>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap', color: '#64748B' }}>
                        {sol.fecha_solicitud || sol.fechaSolicitud}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {renderEstadoBadge(estado)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => {
                              setSelectedSolicitud(sol);
                              setIsDetalleOpen(true);
                            }}
                            title="Ver Comprobante de Orden"
                          >
                            <Eye size={15} />
                          </button>
                          {estado === 'PENDIENTE' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => {
                                setSelectedSolicitud(sol);
                                setIsCancelarOpen(true);
                              }}
                              title="Cancelar Solicitud"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modales */}
      <RegistrarSolicitudModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        formData={formData}
        setFormData={setFormData}
        formErrors={formErrors}
        selectedCliente={selectedCliente}
        clientesEncontrados={clientesEncontrados}
        buscandoClientes={buscandoClientes}
        zonas={zonas}
        gpsLoading={gpsLoading}
        gpsStatus={gpsStatus}
        onBuscarClientes={buscarClientes}
        onSeleccionarCliente={seleccionarCliente}
        onCapturarGPS={capturarUbicacionGPS}
        onSubmit={registrarSolicitud}
        loading={loading}
      />

      <DetalleSolicitudModal
        isOpen={isDetalleOpen}
        onClose={() => setIsDetalleOpen(false)}
        solicitud={selectedSolicitud}
      />

      <CancelarSolicitudModal
        isOpen={isCancelarOpen}
        onClose={() => setIsCancelarOpen(false)}
        solicitud={selectedSolicitud}
        onConfirm={cancelarSolicitud}
        loading={loading}
      />
    </div>
  );
}
