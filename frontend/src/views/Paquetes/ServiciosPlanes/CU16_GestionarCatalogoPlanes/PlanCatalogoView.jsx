import React from 'react';
import { usePlanCatalogoController } from '../../../../controllers/Paquetes/ServiciosPlanes/CU16_GestionarCatalogoPlanes/usePlanCatalogoController';
import { hasPermission } from '../../../../config/access.js';
import { Plus, Search, Filter, AlertCircle, RefreshCw, Pencil, Power, PowerOff, CheckCircle2 } from 'lucide-react';
import './PlanCatalogoView.css';

export default function PlanCatalogoView({ user }) {
  const {
    planes,
    loading,
    error,
    busqueda,
    setBusqueda,
    estadoFiltro,
    setEstadoFiltro,
    showModal,
    editingPlan,
    form,
    setForm,
    formError,
    saving,
    aviso,
    setAviso,
    openCreate,
    openEdit,
    closeModal,
    handleSubmit,
    cambiarEstado,
  } = usePlanCatalogoController();

  // Solo interfaz: el backend exige `planes.manage` (administrador).
  const puedeGestionar = hasPermission(user, 'planes.manage');

  return (
    <div className="view-panel cu16-view">
      <div className="view-header">
        <div>
          <h2>Catálogo de Planes de Internet</h2>
          <p className="subtitle">Consulta, crea, edita y activa/desactiva planes sin borrar el historial</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={openCreate}
          disabled={!puedeGestionar}
          title={puedeGestionar ? undefined : 'No tienes permiso planes.manage'}
        >
          <Plus size={16} /> Nuevo Plan
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={18} /> No se pudo consultar el catálogo: {error}
        </div>
      )}

      {aviso && (
        <div className="alert alert-success" role="status">
          <CheckCircle2 size={18} /> {aviso}
          <button type="button" className="cu16-alert-close" onClick={() => setAviso(null)} aria-label="Cerrar aviso">×</button>
        </div>
      )}

      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre o descripción..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar planes"
          />
        </div>
        <div className="filter-item">
          <Filter size={16} />
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            aria-label="Filtrar por estado"
          >
            <option value="">Todos los estados</option>
            <option value="1">Activos</option>
            <option value="0">Inactivos</option>
          </select>
        </div>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Plan</th>
              <th>Velocidad</th>
              <th>Precio mensual</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="cu16-status">
                  <RefreshCw size={16} className="spin" /> Cargando planes…
                </td>
              </tr>
            )}
            {!loading && planes.length === 0 && (
              <tr>
                <td colSpan={6} className="cu16-status">Sin planes registrados</td>
              </tr>
            )}
            {planes.map((p) => (
              <tr key={p.id}>
                <td data-label="Plan"><strong>{p.nombre_plan}</strong></td>
                <td data-label="Velocidad"><span className="badge badge-info">{p.velocidad_mbps} Mbps</span></td>
                <td data-label="Precio mensual">Bs. {p.precio_mensual}</td>
                <td data-label="Descripción" className="cu16-desc">{p.descripcion || '—'}</td>
                <td data-label="Estado">
                  <span className={`badge ${p.activo ? 'badge-success' : 'badge-danger'}`}>
                    {p.activo ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </td>
                <td data-label="Acciones">
                  <div className="cu16-actions">
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => openEdit(p)}
                      disabled={!puedeGestionar}
                      title={puedeGestionar ? 'Editar plan' : 'No tienes permiso planes.manage'}
                    >
                      <Pencil size={14} /> Editar
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${p.activo ? 'btn-danger' : 'btn-success'}`}
                      onClick={() => cambiarEstado(p)}
                      disabled={!puedeGestionar}
                      title={puedeGestionar ? undefined : 'No tienes permiso planes.manage'}
                    >
                      {p.activo ? <><PowerOff size={14} /> Desactivar</> : <><Power size={14} /> Activar</>}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3>{editingPlan ? 'Editar Plan' : 'Nuevo Plan de Internet'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="plan-nombre">Nombre del plan</label>
                <input
                  id="plan-nombre"
                  type="text"
                  required
                  maxLength={100}
                  value={form.nombre_plan}
                  onChange={(e) => setForm({ ...form, nombre_plan: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="plan-velocidad">Velocidad (Mbps)</label>
                <input
                  id="plan-velocidad"
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={form.velocidad_mbps}
                  onChange={(e) => setForm({ ...form, velocidad_mbps: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="plan-precio">Precio mensual (Bs.)</label>
                <input
                  id="plan-precio"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={form.precio_mensual}
                  onChange={(e) => setForm({ ...form, precio_mensual: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="plan-descripcion">Descripción</label>
                <textarea
                  id="plan-descripcion"
                  rows={3}
                  maxLength={1000}
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                />
              </div>
              <div className="form-group cu16-check">
                <label htmlFor="plan-activo">
                  <input
                    id="plan-activo"
                    type="checkbox"
                    checked={Boolean(form.activo)}
                    onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                  />
                  Plan activo (disponible para asignar)
                </label>
              </div>
              {formError && (
                <div className="alert alert-danger" role="alert">
                  <AlertCircle size={18} /> {formError}
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={saving}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando…' : (editingPlan ? 'Guardar cambios' : 'Crear plan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
