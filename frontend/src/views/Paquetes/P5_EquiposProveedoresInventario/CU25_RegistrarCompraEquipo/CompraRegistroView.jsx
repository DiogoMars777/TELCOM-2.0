import React from 'react';
import { useCompraRegistroController } from '../../../../controllers/Paquetes/P5_EquiposProveedoresInventario/CU25_RegistrarCompraEquipo/useCompraRegistroController';
import { hasPermission } from '../../../../config/access';
import {
  ShoppingCart,
  Plus,
  Search,
  FileText,
  CheckCircle2,
  AlertCircle,
  Truck,
  PackageCheck,
  Trash2,
  Eye,
  DollarSign,
  Calendar,
  X,
  Layers,
} from 'lucide-react';
import './CompraRegistroView.css';

export default function CompraRegistroView({ user }) {
  const {
    compras,
    stats,
    proveedores,
    productos,
    loading,
    error,
    formError,
    successMessage,
    filters,
    handleFilterChange,
    showModal,
    openCreate,
    closeModal,
    form,
    handleAddItem,
    handleRemoveItem,
    handleItemChange,
    handleSubmit,
    isSubmitting,
    selectedCompra,
    showDetailModal,
    openDetail,
    closeDetail,
  } = useCompraRegistroController();

  const puedeGestionar = hasPermission(user, 'compras.manage');

  // Calcular total general de la compra en edición
  const totalCalculado = form.detalles.reduce((acc, it) => {
    const cant = Number(it.cantidad) || 0;
    const prec = Number(it.precio_unitario) || 0;
    return acc + cant * prec;
  }, 0);

  return (
    <div className="view-panel cu25-container">
      {/* 1. Header del Caso de Uso */}
      <div className="view-header">
        <div>
          <h2>CU25: Registrar Compra de Equipos e Ingreso a Stock</h2>
          <p className="subtitle">
            Gestión de abastecimiento con importadores y actualización atómica del inventario físico
          </p>
        </div>
        {puedeGestionar && (
          <button className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Registrar Nueva Compra
          </button>
        )}
      </div>

      {/* Alerta de éxito */}
      {successMessage && (
        <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <CheckCircle2 size={18} /> {successMessage}
        </div>
      )}

      {/* Alerta de error global */}
      {error && (
        <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* 2. Tarjetas de Estadísticas / KPI */}
      <div className="cu25-stats-grid">
        <div className="cu25-stat-card">
          <div className="cu25-stat-icon">
            <ShoppingCart size={24} />
          </div>
          <div className="cu25-stat-info">
            <h4>Órdenes de Compra</h4>
            <p className="stat-value">{stats.total_compras}</p>
          </div>
        </div>

        <div className="cu25-stat-card">
          <div className="cu25-stat-icon green">
            <DollarSign size={24} />
          </div>
          <div className="cu25-stat-info">
            <h4>Inversión Total en Equipos</h4>
            <p className="stat-value">Bs. {Number(stats.total_inversion).toLocaleString('es-BO', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="cu25-stat-card">
          <div className="cu25-stat-icon purple">
            <Truck size={24} />
          </div>
          <div className="cu25-stat-info">
            <h4>Proveedores Registrados</h4>
            <p className="stat-value">{proveedores.length}</p>
          </div>
        </div>
      </div>

      {/* 3. Barra de Filtros y Búsqueda */}
      <div className="cu25-filter-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, minWidth: '220px' }}>
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="cu25-filter-input"
            placeholder="Buscar por Nro. Comprobante, proveedor o NIT..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>

        <select
          className="cu25-filter-select"
          value={filters.proveedor_id}
          onChange={(e) => handleFilterChange('proveedor_id', e.target.value)}
        >
          <option value="">— Todos los Proveedores —</option>
          {proveedores.map((p) => (
            <option key={p.id} value={p.id}>
              {p.razon_social || p.razonSocial}
            </option>
          ))}
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Desde:</span>
          <input
            type="date"
            className="cu25-filter-select"
            value={filters.fecha_desde}
            onChange={(e) => handleFilterChange('fecha_desde', e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hasta:</span>
          <input
            type="date"
            className="cu25-filter-select"
            value={filters.fecha_hasta}
            onChange={(e) => handleFilterChange('fecha_hasta', e.target.value)}
          />
        </div>
      </div>

      {/* 4. Tabla de Órdenes de Compra */}
      <div className="cu25-table-wrapper">
        <table className="cu25-table">
          <thead>
            <tr>
              <th>Nro. Comprobante</th>
              <th>Fecha Compra</th>
              <th>Proveedor</th>
              <th>Ítems / Modelos</th>
              <th>Monto Total (Bs.)</th>
              <th>Estado</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Cargando órdenes de compra de equipos...
                </td>
              </tr>
            ) : compras.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No se encontraron compras registradas con los criterios seleccionados.
                </td>
              </tr>
            ) : (
              compras.map((compra) => {
                const totalItems = compra.detalles?.reduce((acc, d) => acc + (d.cantidad || 0), 0) || 0;
                return (
                  <tr key={compra.id}>
                    <td>
                      <strong style={{ color: '#38bdf8' }}>{compra.nro_comprobante || compra.nroComprobante}</strong>
                    </td>
                    <td>{compra.fecha_compra || compra.fechaCompra}</td>
                    <td>
                      <div>
                        <strong>{compra.proveedor?.razon_social || compra.proveedor?.razonSocial || 'Proveedor General'}</strong>
                        {compra.proveedor?.nit && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NIT: {compra.proveedor.nit}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="cu25-detail-badge cu25-badge-info">
                        {compra.detalles?.length || 0} línea(s) — {totalItems} unids.
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#4ade80' }}>
                        Bs. {Number(compra.monto_total || compra.montoTotal || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                      </strong>
                    </td>
                    <td>
                      <span className="cu25-detail-badge cu25-badge-success">
                        {compra.estado_compra?.nombre_estado || compra.estadoCompra?.nombreEstado || 'COMPLETADO'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openDetail(compra)}
                        title="Ver desglose e ítems"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.65rem' }}
                      >
                        <Eye size={14} /> Detalle
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 5. Modal: Registrar Nueva Compra e Ingresar a Stock */}
      {showModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card" style={{ maxWidth: '850px', width: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <PackageCheck size={20} style={{ color: '#38bdf8' }} /> Registrar Compra de Equipos e Ingreso a Stock
              </h3>
              <button onClick={closeModal} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={16} /> {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-grid" style={{ marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label>Proveedor <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <select
                    required
                    value={form.proveedor_id}
                    onChange={(e) => setForm((p) => ({ ...p, proveedor_id: e.target.value }))}
                  >
                    <option value="">— Seleccionar Proveedor —</option>
                    {proveedores.map((pr) => (
                      <option key={pr.id} value={pr.id}>
                        {pr.razon_social || pr.razonSocial} (NIT: {pr.nit || 'S/N'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Nro. Factura / Comprobante <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. FAC-2026-0045"
                    value={form.nro_comprobante}
                    onChange={(e) => setForm((p) => ({ ...p, nro_comprobante: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label>Fecha de Compra <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    type="date"
                    required
                    value={form.fecha_compra}
                    onChange={(e) => setForm((p) => ({ ...p, fecha_compra: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label>Observación de Abastecimiento</label>
                  <input
                    type="text"
                    placeholder="Ej. Lote inicial de routers ONT Wi-Fi 6 para zona norte"
                    value={form.observacion}
                    onChange={(e) => setForm((p) => ({ ...p, observacion: e.target.value }))}
                  />
                </div>
              </div>

              {/* Sección de Líneas de Detalle / Equipos */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Layers size={16} /> Ítems de la Compra y Existencias Físicas
                  </h4>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleAddItem}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <Plus size={14} /> Añadir Ítem
                  </button>
                </div>

                <div className="cu25-items-list">
                  {form.detalles.map((item, idx) => {
                    const prodSeleccionado = productos.find((p) => String(p.id) === String(item.producto_id));
                    const stockPrevio = prodSeleccionado?.inventario?.stock_actual ?? prodSeleccionado?.inventario?.stockActual ?? 0;
                    const subtotalItem = (Number(item.cantidad) || 0) * (Number(item.precio_unitario) || 0);

                    return (
                      <div key={idx} className="cu25-item-row">
                        <div>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Producto / Modelo</label>
                          <select
                            value={item.producto_id}
                            onChange={(e) => handleItemChange(idx, 'producto_id', e.target.value)}
                            required
                            style={{ width: '100%' }}
                          >
                            <option value="">— Seleccionar Producto —</option>
                            {productos.map((prod) => (
                              <option key={prod.id} value={prod.id}>
                                {prod.nombre} ({prod.marca} - {prod.tipo_equipo || prod.tipoEquipo})
                              </option>
                            ))}
                          </select>
                          {prodSeleccionado && (
                            <span className="cu25-stock-pill">
                              Stock actual: {stockPrevio} unids. → Nuevo: {stockPrevio + (Number(item.cantidad) || 0)}
                            </span>
                          )}
                        </div>

                        <div>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cantidad</label>
                          <input
                            type="number"
                            min="1"
                            required
                            placeholder="Cant."
                            value={item.cantidad}
                            onChange={(e) => handleItemChange(idx, 'cantidad', e.target.value)}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Precio Unit. (Bs.)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            placeholder="0.00"
                            value={item.precio_unitario}
                            onChange={(e) => handleItemChange(idx, 'precio_unitario', e.target.value)}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Subtotal</label>
                          <div style={{ fontWeight: 'bold', color: '#4ade80', paddingTop: '0.4rem' }}>
                            Bs. {subtotalItem.toFixed(2)}
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'transparent' }}>X</label>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            disabled={form.detalles.length <= 1}
                            onClick={() => handleRemoveItem(idx)}
                            title="Quitar ítem"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Resumen Total y Acciones */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15,23,42,0.6)', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total de la Orden de Compra:</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4ade80' }}>
                    Bs. {totalCalculado.toFixed(2)}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={isSubmitting}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Registrando compra...' : 'Confirmar Compra e Ingresar Stock'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal: Detalle de Orden de Compra */}
      {showDetailModal && selectedCompra && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card" style={{ maxWidth: '700px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} style={{ color: '#38bdf8' }} /> Detalle de Compra: {selectedCompra.nro_comprobante || selectedCompra.nroComprobante}
              </h3>
              <button onClick={closeDetail} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Proveedor:</span>{' '}
                <strong>{selectedCompra.proveedor?.razon_social || selectedCompra.proveedor?.razonSocial}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>NIT:</span>{' '}
                <strong>{selectedCompra.proveedor?.nit || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Fecha:</span>{' '}
                <strong>{selectedCompra.fecha_compra || selectedCompra.fechaCompra}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Estado:</span>{' '}
                <span className="cu25-detail-badge cu25-badge-success">
                  {selectedCompra.estado_compra?.nombre_estado || selectedCompra.estadoCompra?.nombreEstado || 'COMPLETADO'}
                </span>
              </div>
              {selectedCompra.observacion && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Observación:</span>{' '}
                  <em>{selectedCompra.observacion}</em>
                </div>
              )}
            </div>

            <h4 style={{ fontSize: '0.9rem', color: '#38bdf8', marginBottom: '0.5rem' }}>Productos Adquiridos</h4>
            <div className="cu25-table-wrapper" style={{ marginBottom: '1rem' }}>
              <table className="cu25-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio Unit.</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedCompra.detalles || []).map((det, dIdx) => (
                    <tr key={dIdx}>
                      <td>
                        <strong>{det.inventario?.producto?.nombre || 'Producto de Catálogo'}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {det.inventario?.producto?.marca} — {det.inventario?.producto?.tipo_equipo || det.inventario?.producto?.tipoEquipo}
                        </div>
                      </td>
                      <td>{det.cantidad} unids.</td>
                      <td>Bs. {Number(det.precio_unitario || det.precioUnitario || 0).toFixed(2)}</td>
                      <td>
                        <strong style={{ color: '#4ade80' }}>
                          Bs. {Number(det.subtotal || 0).toFixed(2)}
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Total Liquidado:</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4ade80', marginLeft: '0.5rem' }}>
                  Bs. {Number(selectedCompra.monto_total || selectedCompra.montoTotal || 0).toFixed(2)}
                </span>
              </div>
              <button className="btn btn-secondary" onClick={closeDetail}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
