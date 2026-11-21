import React from 'react';
import { useCorteRegistroController } from '../../../../controllers/Paquetes/P3_ServiciosPlanes/CU14_RegistrarCorteRealizado/useCorteRegistroController';
import {
  Scissors,
  Radio,
  Calendar,
  Search,
  RotateCcw,
  Plus,
  FileText,
  Printer,
  X,
  AlertCircle,
  Cpu,
} from 'lucide-react';
import './CorteRegistroView.css';

export default function CorteRegistroView({ initialServicio = null }) {
  const {
    // Listado
    cortes,
    metricas,
    loading,
    error,
    page,
    totalPages,
    totalRecords,
    loadCortes,

    // Filtros
    buscar,
    setBuscar,
    tipoCorteFilter,
    setTipoCorteFilter,
    fechaDesde,
    setFechaDesde,
    fechaHasta,
    setFechaHasta,
    handleLimpiarFiltros,

    // Servicios disponibles
    serviciosActivos,
    loadingServicios,
    serviciosError,

    // Modal Registro
    showCreateModal,
    setShowCreateModal,
    selectedServicio,
    setSelectedServicio,
    tipoCorte,
    setTipoCorte,
    motivo,
    setMotivo,
    observaciones,
    setObservaciones,
    submitting,
    formError,
    handleAbrirModalCrear,
    handleSubmitCorte,

    // Modal Comprobante
    showReceiptModal,
    setShowReceiptModal,
    selectedReceipt,
    handleVerComprobante,
    handleImprimir,
  } = useCorteRegistroController(initialServicio);

  const presetsMotivo = [
    'Mora prolongada mayor a 15 días',
    'Solicitud voluntaria del abonado',
    'Uso indebido / alteración de señal',
    'Suspensión administrativa preventiva',
  ];

  return (
    <div className="view-panel corte-container">
      {/* Encabezado */}
      <div className="corte-header">
        <div className="corte-title-group">
          <h2>
            <Scissors size={24} className="text-danger" />
            Registrar Corte Realizado
            <span className="corte-badge-cycle">Ciclo 3</span>
          </h2>
          <p className="subtitle">
            Gestión técnica y registro de órdenes de corte (Lógico / Físico) · Paquete Servicios y Planes de Internet
          </p>
        </div>
        <div>
          <button className="btn btn-danger" onClick={() => handleAbrirModalCrear()}>
            <Plus size={16} /> Registrar Nuevo Corte
          </button>
        </div>
      </div>

      {/* Alerta de error global */}
      {error && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={18} /> No se pudo cargar el historial de cortes: {error}
        </div>
      )}

      {/* Tarjetas de Métricas / KPIs */}
      <div className="corte-kpi-grid">
        <div className="corte-kpi-card">
          <div className="corte-kpi-icon total">
            <Scissors size={22} />
          </div>
          <div className="corte-kpi-info">
            <span className="corte-kpi-value">{metricas?.total_cortes ?? 0}</span>
            <span className="corte-kpi-label">Total Cortes Registrados</span>
          </div>
        </div>

        <div className="corte-kpi-card">
          <div className="corte-kpi-icon logico">
            <Cpu size={22} />
          </div>
          <div className="corte-kpi-info">
            <span className="corte-kpi-value">{metricas?.cortes_logicos ?? 0}</span>
            <span className="corte-kpi-label">Cortes Lógicos (OLT/RADIUS)</span>
          </div>
        </div>

        <div className="corte-kpi-card">
          <div className="corte-kpi-icon fisico">
            <Radio size={22} />
          </div>
          <div className="corte-kpi-info">
            <span className="corte-kpi-value">{metricas?.cortes_fisicos ?? 0}</span>
            <span className="corte-kpi-label">Cortes Físicos (Fibra/NAP)</span>
          </div>
        </div>

        <div className="corte-kpi-card">
          <div className="corte-kpi-icon mes">
            <Calendar size={22} />
          </div>
          <div className="corte-kpi-info">
            <span className="corte-kpi-value">{metricas?.cortes_mes ?? 0}</span>
            <span className="corte-kpi-label">Ejecutados este Mes</span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="corte-filter-bar">
        <div className="corte-search-box">
          <Search size={16} className="corte-search-icon" />
          <input
            type="text"
            className="corte-search-input"
            placeholder="Buscar por orden (COR-...), abonado, CI o código de servicio..."
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
          />
        </div>

        <select
          className="corte-filter-select"
          value={tipoCorteFilter}
          onChange={(e) => setTipoCorteFilter(e.target.value)}
        >
          <option value="TODOS">Todos los tipos</option>
          <option value="LOGICO">Corte Lógico</option>
          <option value="FISICO">Corte Físico</option>
        </select>

        <input
          type="date"
          className="corte-filter-date"
          title="Fecha desde"
          value={fechaDesde}
          onChange={(e) => setFechaDesde(e.target.value)}
        />

        <input
          type="date"
          className="corte-filter-date"
          title="Fecha hasta"
          value={fechaHasta}
          onChange={(e) => setFechaHasta(e.target.value)}
        />

        <button className="btn btn-secondary" title="Limpiar filtros" onClick={handleLimpiarFiltros}>
          <RotateCcw size={16} /> Limpiar
        </button>
      </div>

      {/* Tabla de Resultados */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Orden</th>
              <th>Servicio</th>
              <th>Abonado</th>
              <th>Tipo</th>
              <th>Motivo & Detalle</th>
              <th>Fecha Ejecución</th>
              <th>Operador / Técnico</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                  <RotateCcw size={18} className="spin" /> Cargando registro de cortes…
                </td>
              </tr>
            )}

            {!loading && cortes.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: '2.5rem' }}>
                  No se encontraron órdenes de corte registradas con los filtros seleccionados.
                </td>
              </tr>
            )}

            {!loading &&
              cortes.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong style={{ color: '#f87171' }}>{c.codigo_orden}</strong>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong>{c.codigo_servicio}</strong>
                      <small style={{ color: '#94a3b8' }}>IP: {c.ip_asignada}</small>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600 }}>{c.cliente_nombre}</span>
                      <small style={{ color: '#94a3b8' }}>CI: {c.cliente_ci}</small>
                    </div>
                  </td>
                  <td>
                    {c.tipo_corte === 'FISICO' ? (
                      <span className="badge-corte-fisico">
                        <Radio size={12} /> Físico
                      </span>
                    ) : (
                      <span className="badge-corte-logico">
                        <Cpu size={12} /> Lógico
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '280px' }}>
                      <span style={{ fontWeight: 500 }}>{c.motivo}</span>
                      {c.observaciones && c.observaciones !== '—' && (
                        <small style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                          {c.observaciones}
                        </small>
                      )}
                    </div>
                  </td>
                  <td>
                    <small>{c.fecha_corte}</small>
                  </td>
                  <td>
                    <small>{c.tecnico_nombre}</small>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      title="Ver comprobante de orden de corte"
                      onClick={() => handleVerComprobante(c)}
                    >
                      <FileText size={14} /> Comprobante
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          <small style={{ color: '#94a3b8' }}>
            Mostrando página {page} de {totalPages} ({totalRecords} órdenes totales)
          </small>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page <= 1 || loading}
              onClick={() => loadCortes(page - 1)}
            >
              Anterior
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page >= totalPages || loading}
              onClick={() => loadCortes(page + 1)}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Modal: Registrar Corte Realizado */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171' }}>
                <Scissors size={20} /> Registrar Orden de Corte Realizado
              </h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowCreateModal(false)}
                disabled={submitting}
              >
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div className="alert alert-danger" role="alert">
                <AlertCircle size={18} /> {formError}
              </div>
            )}

            {serviciosError && (
              <div className="alert alert-danger" role="alert">
                <AlertCircle size={18} /> Error al cargar servicios: {serviciosError}
              </div>
            )}

            <form onSubmit={handleSubmitCorte}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Selector de servicio */}
                <div className="form-group">
                  <label>Servicio Activo a Cortar</label>
                  {loadingServicios ? (
                    <small style={{ color: '#94a3b8' }}>Cargando catálogo de servicios activos…</small>
                  ) : (
                    <select
                      value={selectedServicio?.id ?? ''}
                      onChange={(e) => {
                        const found = serviciosActivos.find((s) => s.id === parseInt(e.target.value, 10));
                        if (found) setSelectedServicio(found);
                      }}
                    >
                      {serviciosActivos.length === 0 && (
                        <option value="">— No hay servicios activos disponibles —</option>
                      )}
                      {selectedServicio && !serviciosActivos.some((s) => s.id === selectedServicio.id) && (
                        <option value={selectedServicio.id}>
                          {selectedServicio.codigo_servicio} - {selectedServicio.cliente_nombre || 'Abonado'}
                          {selectedServicio.plan_nombre ? ` (${selectedServicio.plan_nombre})` : ''}
                        </option>
                      )}
                      {serviciosActivos.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.codigo_servicio} — {s.cliente_nombre} (CI: {s.cliente_ci}) — {s.plan_nombre || 'Plan'}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Previsualización del abonado seleccionado */}
                {selectedServicio && (
                  <div className="service-preview-card">
                    <div className="service-preview-row">
                      <span className="service-preview-label">Abonado / Titular:</span>
                      <span className="service-preview-val">{selectedServicio.cliente_nombre}</span>
                    </div>
                    <div className="service-preview-row">
                      <span className="service-preview-label">Documento C.I.:</span>
                      <span className="service-preview-val">{selectedServicio.cliente_ci || '—'}</span>
                    </div>
                    <div className="service-preview-row">
                      <span className="service-preview-label">Dirección / Zona:</span>
                      <span className="service-preview-val">
                        {selectedServicio.cliente_direccion} ({selectedServicio.zona_nombre || 'Zona'})
                      </span>
                    </div>
                    <div className="service-preview-row">
                      <span className="service-preview-label">Plan / IP:</span>
                      <span className="service-preview-val">
                        {selectedServicio.plan_nombre} · {selectedServicio.ip_asignada || 'DHCP'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Selector interactivo de Tipo de Corte */}
                <div className="form-group">
                  <label>Tipo de Corte Técnico</label>
                  <div className="tipo-corte-selector">
                    <div
                      className={`tipo-corte-card ${tipoCorte === 'LOGICO' ? 'active' : ''}`}
                      onClick={() => setTipoCorte('LOGICO')}
                    >
                      <div className="tipo-corte-card-title">
                        <Cpu size={16} /> Corte Lógico
                      </div>
                      <div className="tipo-corte-card-desc">
                        Suspensión por software. Bloqueo de IP, redirección a portal cautivo y cierre de sesión RADIUS/OLT.
                      </div>
                    </div>

                    <div
                      className={`tipo-corte-card ${tipoCorte === 'FISICO' ? 'active' : ''}`}
                      onClick={() => setTipoCorte('FISICO')}
                    >
                      <div className="tipo-corte-card-title">
                        <Radio size={16} /> Corte Físico
                      </div>
                      <div className="tipo-corte-card-desc">
                        Cuadrilla técnica en terreno. Desconexión de fibra óptica en caja NAP y retiro de patchcord/ONU.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Motivo del corte con presets */}
                <div className="form-group">
                  <label>Motivo de la Suspensión</label>
                  <input
                    type="text"
                    required
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Especifique el motivo de corte..."
                  />
                  <div className="motivos-presets">
                    {presetsMotivo.map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        className={`motivo-chip ${motivo === preset ? 'selected' : ''}`}
                        onClick={() => setMotivo(preset)}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Observaciones técnicas */}
                <div className="form-group">
                  <label>Observaciones Técnicas de Cuadrilla</label>
                  <textarea
                    rows={3}
                    placeholder="Detalles técnicos adicionales, puerto NAP, estado de acometida o router del cliente..."
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={submitting || !selectedServicio}
                >
                  <Scissors size={16} /> {submitting ? 'Ejecutando Corte...' : 'Confirmar y Ejecutar Corte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Comprobante / Voucher Oficial de Corte */}
      {showReceiptModal && selectedReceipt && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '640px', background: 'transparent', padding: 0, border: 'none' }}>
            <div className="comprobante-ticket">
              <div className="comprobante-header">
                <h1 className="comprobante-logo-title">TELCOM 2.0</h1>
                <p className="comprobante-subtitle">SERVICIOS DE TELECOMUNICACIONES & FIBRA ÓPTICA</p>
                <p className="comprobante-subtitle">NIT: 1029482019 · SANTA CRUZ - BOLIVIA</p>
                <div className="comprobante-orden-tag">
                  ORDEN DE CORTE Nº {selectedReceipt.codigo_orden}
                </div>
              </div>

              <div className="comprobante-section-title">Datos del Abonado</div>
              <div className="comprobante-grid">
                <div className="comprobante-field">
                  <span>Nombre / Razón Social:</span>
                  <span>{selectedReceipt.cliente_nombre}</span>
                </div>
                <div className="comprobante-field">
                  <span>Documento C.I.:</span>
                  <span>{selectedReceipt.cliente_ci}</span>
                </div>
                <div className="comprobante-field">
                  <span>Teléfono Contacto:</span>
                  <span>{selectedReceipt.cliente_telefono}</span>
                </div>
                <div className="comprobante-field">
                  <span>Zona Cobertura:</span>
                  <span>{selectedReceipt.zona_nombre}</span>
                </div>
                <div className="comprobante-field comprobante-full">
                  <span>Dirección del Enlace:</span>
                  <span>{selectedReceipt.cliente_direccion}</span>
                </div>
              </div>

              <div className="comprobante-section-title">Datos Técnicos del Enlace</div>
              <div className="comprobante-grid">
                <div className="comprobante-field">
                  <span>Código de Servicio:</span>
                  <span>{selectedReceipt.codigo_servicio}</span>
                </div>
                <div className="comprobante-field">
                  <span>Plan de Internet:</span>
                  <span>{selectedReceipt.plan_nombre}</span>
                </div>
                <div className="comprobante-field">
                  <span>Dirección IP:</span>
                  <span>{selectedReceipt.ip_asignada}</span>
                </div>
                <div className="comprobante-field">
                  <span>Tipo de Corte:</span>
                  <span style={{ color: selectedReceipt.tipo_corte === 'FISICO' ? '#dc2626' : '#0284c7' }}>
                    CORTE {selectedReceipt.tipo_corte}
                  </span>
                </div>
              </div>

              <div className="comprobante-section-title">Motivo y Ejecución</div>
              <div className="comprobante-grid">
                <div className="comprobante-field comprobante-full">
                  <span>Motivo Registrado:</span>
                  <span>{selectedReceipt.motivo}</span>
                </div>
                <div className="comprobante-field comprobante-full">
                  <span>Observaciones Técnicas:</span>
                  <span style={{ fontStyle: 'italic', fontWeight: 500 }}>
                    {selectedReceipt.observaciones}
                  </span>
                </div>
                <div className="comprobante-field">
                  <span>Fecha y Hora de Ejecución:</span>
                  <span>{selectedReceipt.fecha_corte}</span>
                </div>
                <div className="comprobante-field">
                  <span>Técnico / Operador Responsable:</span>
                  <span>{selectedReceipt.tecnico_nombre}</span>
                </div>
              </div>

              <div className="comprobante-signatures">
                <div className="comprobante-sign-box">
                  Firma Operador / Técnico
                  <br />
                  TELCOM 2.0
                </div>
                <div className="comprobante-sign-box">
                  Firma Abonado / Notificación
                  <br />
                  C.I. {selectedReceipt.cliente_ci}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', padding: '0 0.5rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowReceiptModal(false)}
              >
                <X size={16} /> Cerrar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleImprimir}
              >
                <Printer size={16} /> Imprimir Comprobante
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
