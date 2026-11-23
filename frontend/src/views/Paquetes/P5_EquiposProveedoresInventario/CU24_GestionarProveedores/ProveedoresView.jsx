import React from 'react';
import { AlertCircle, CheckCircle2, Eye, Filter, Pencil, Plus, Power, PowerOff, RefreshCw, Search } from 'lucide-react';
import { useProveedorController } from '../../../../controllers/Paquetes/P5_EquiposProveedoresInventario/CU24_GestionarProveedores/useProveedorController.js';
import { hasPermission } from '../../../../config/access.js';
import './ProveedoresView.css';

const CAMPOS = [
  { nombre: 'razonSocial', etiqueta: 'Razón social', maxLength: 100, required: true },
  { nombre: 'nit', etiqueta: 'NIT', maxLength: 30, required: true },
  { nombre: 'telefono', etiqueta: 'Teléfono', maxLength: 20, type: 'tel' },
  { nombre: 'correo', etiqueta: 'Correo', maxLength: 100, type: 'email' },
  { nombre: 'direccion', etiqueta: 'Dirección' },
];

function EstadoProveedor({ estado }) {
  return <span className={`badge ${estado ? 'badge-success' : 'badge-danger'}`}>{estado ? 'Activo' : 'Inactivo'}</span>;
}

export default function ProveedoresView({ user }) {
  const puedeGestionar = hasPermission(user, 'proveedores.manage');
  const {
    proveedores, loading, error, busqueda, setBusqueda, estadoFiltro, setEstadoFiltro,
    modo, seleccionado, form, setForm, formError, saving, pendingId, aviso, setAviso,
    openCreate, openEdit, openDetalle, closeModal, handleSubmit, cambiarEstado, reload,
  } = useProveedorController(puedeGestionar);
  const ocupado = saving || pendingId !== null;

  if (!puedeGestionar) {
    return <div className="alert alert-danger" role="alert">No tienes autorización para gestionar proveedores.</div>;
  }

  return (
    <div className="view-panel cu24-view">
      <div className="view-header">
        <div>
          <h2>Proveedores</h2>
          <p className="subtitle">Consulta y administra los datos y la disponibilidad de tus proveedores</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate} disabled={ocupado}>
          <Plus size={16} /> Nuevo proveedor
        </button>
      </div>

      {error && <div className="alert alert-danger" role="alert"><AlertCircle size={18} /> {error}</div>}
      {aviso && (
        <div className="alert alert-success" role="status">
          <CheckCircle2 size={18} /> {aviso}
          <button type="button" className="cu24-alert-close" onClick={() => setAviso(null)} aria-label="Cerrar aviso">×</button>
        </div>
      )}

      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input type="search" maxLength={100} placeholder="Buscar por razón social, NIT o contacto…"
            value={busqueda} onChange={(e) => setBusqueda(e.target.value)} disabled={ocupado} aria-label="Buscar proveedores" />
        </div>
        <div className="filter-item">
          <Filter size={16} />
          <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)} disabled={ocupado} aria-label="Filtrar por estado">
            <option value="">Todos los estados</option>
            <option value="1">Activos</option>
            <option value="0">Inactivos</option>
          </select>
        </div>
        <button type="button" className="btn btn-secondary" onClick={reload} disabled={loading || ocupado}>
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>

      <div className="table-responsive" aria-busy={loading}>
        <table className="data-table">
          <thead><tr>
            {CAMPOS.map((c) => <th key={c.nombre} scope="col">{c.etiqueta}</th>)}
            <th scope="col">Estado</th><th scope="col">Acciones</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="cu24-status"><RefreshCw size={16} className="spin" /> Cargando proveedores…</td></tr>
            ) : error && proveedores.length === 0 ? (
              <tr><td colSpan={7} className="cu24-status">No se pudo cargar el listado. Usa Actualizar para reintentar.</td></tr>
            ) : proveedores.length === 0 ? (
              <tr><td colSpan={7} className="cu24-status">{busqueda || estadoFiltro ? 'Sin proveedores para estos filtros' : 'Sin proveedores registrados'}</td></tr>
            ) : proveedores.map((p) => (
              <tr key={p.idProveedor}>
                {CAMPOS.map((c) => <td key={c.nombre} data-label={c.etiqueta} className="cu24-text">{p[c.nombre] || '—'}</td>)}
                <td data-label="Estado"><EstadoProveedor estado={p.estado} /></td>
                <td data-label="Acciones">
                  <div className="cu24-actions">
                    <button type="button" className="btn btn-sm btn-secondary" disabled={ocupado} onClick={() => openDetalle(p)}>
                      <Eye size={14} /> Consultar
                    </button>
                    <button type="button" className="btn btn-sm btn-secondary" disabled={ocupado} onClick={() => openEdit(p)}>
                      <Pencil size={14} /> Editar
                    </button>
                    <button type="button" className={`btn btn-sm ${p.estado ? 'btn-danger' : 'btn-success'}`}
                      disabled={ocupado} onClick={() => cambiarEstado(p)}>
                      {p.estado ? <PowerOff size={14} /> : <Power size={14} />}
                      {pendingId === p.idProveedor ? 'Procesando…' : p.estado ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modo && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="proveedor-modal-titulo">
          <div className="modal-card">
            <h3 id="proveedor-modal-titulo">{modo === 'consultar' ? 'Datos del proveedor' : modo === 'editar' ? 'Editar proveedor' : 'Nuevo proveedor'}</h3>
            {modo === 'consultar' ? (
              <>
                <dl className="cu24-detalle">
                  {CAMPOS.map((c) => <div key={c.nombre}><dt>{c.etiqueta}</dt><dd>{seleccionado[c.nombre] || '—'}</dd></div>)}
                  <div><dt>Estado</dt><dd><EstadoProveedor estado={seleccionado.estado} /></dd></div>
                </dl>
                <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={closeModal} autoFocus>Cerrar</button></div>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <fieldset disabled={saving} className="cu24-form-fields">
                  {CAMPOS.map((c, index) => (
                    <div className="form-group" key={c.nombre}>
                      <label htmlFor={`proveedor-${c.nombre}`}>{c.etiqueta}{c.required ? ' *' : ' (opcional)'}</label>
                      {c.nombre === 'direccion' ? (
                        <textarea id={`proveedor-${c.nombre}`} rows={3} value={form[c.nombre]}
                          onChange={(e) => setForm((prev) => ({ ...prev, [c.nombre]: e.target.value }))} />
                      ) : (
                        <input id={`proveedor-${c.nombre}`} type={c.type || 'text'} required={c.required} maxLength={c.maxLength}
                          autoFocus={index === 0} value={form[c.nombre]}
                          onChange={(e) => setForm((prev) => ({ ...prev, [c.nombre]: e.target.value }))} />
                      )}
                    </div>
                  ))}
                </fieldset>
                {formError && <div className="alert alert-danger" role="alert"><AlertCircle size={18} /> {formError}</div>}
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={saving}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Guardando…' : modo === 'editar' ? 'Guardar cambios' : 'Crear proveedor'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
