import React, { useState } from 'react';
import { useUsuarioController } from '../../../../controllers/Paquetes/SeguridadAdministracion/CU03_UsuariosRolesPermisos/useUsuarioController';
import { hasPermission } from '../../../../config/access.js';
import { evaluatePassword, isPasswordValid } from '../../../../config/passwordPolicy.js';
import RolesPermisosPanel from './RolesPermisosPanel';
import { UserPlus, Shield, CheckCircle2, AlertCircle, RefreshCw, UserCheck, UserX, Circle } from 'lucide-react';
import './UsuariosView.css';

export default function UsuariosView({ user, onPermissionsUpdated }) {
  const [activeTab, setActiveTab] = useState('usuarios');

  const {
    usuarios,
    roles,
    loading,
    error,
    formError,
    actionError,
    actingId,
    showModal,
    setShowModal,
    newUser,
    setNewUser,
    handleCreate,
    toggleActivo,
    cambiarRol,
  } = useUsuarioController();

  // Solo la interfaz; el backend aplica el permiso real (`usuarios.manage`).
  const puedeGestionar = hasPermission(user, 'usuarios.manage');

  // Requisitos de contraseña evaluados en vivo para el formulario.
  const passwordChecks = evaluatePassword(newUser.password);
  const passwordOk = isPasswordValid(newUser.password);

  // Controles reutilizados por la tabla (computadoras/tablets) y las
  // tarjetas (celulares): misma lógica, distinto contenedor visual.
  const renderRol = (u) => (
    puedeGestionar && roles.length > 0 ? (
      <select
        value={u.rol_id ?? u.rol?.id ?? ''}
        disabled={actingId === u.id}
        onChange={(e) => cambiarRol(u, e.target.value)}
      >
        <option value="">Sin rol</option>
        {roles.map((r) => (
          <option key={r.id} value={r.id}>{r.nombre}</option>
        ))}
      </select>
    ) : (
      <span className="badge badge-primary">
        <Shield size={12} /> {u.rol?.nombre || u.role || 'Sin rol'}
      </span>
    )
  );

  const renderEstado = (u) => (
    <span className={`badge badge-${u.activo ? 'success' : 'danger'}`}>
      {u.activo ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />} {u.activo ? 'Activo' : 'Inactivo'}
    </span>
  );

  const renderAccion = (u) => (
    puedeGestionar && (
      <button
        className={`btn btn-sm ${u.activo ? 'btn-danger' : 'btn-success'}`}
        disabled={actingId === u.id}
        onClick={() => toggleActivo(u)}
      >
        {u.activo ? <UserX size={14} /> : <UserCheck size={14} />}
        {u.activo ? ' Desactivar' : ' Activar'}
      </button>
    )
  );

  return (
    <div className="view-panel cu03-view">
      <div className="view-header">
        <div>
          <h2>Usuarios, Roles y Permisos</h2>
          <p className="subtitle">Administración de credenciales de operadores, técnicos y cajeros</p>
        </div>
        {activeTab === 'usuarios' && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)} disabled={!puedeGestionar}>
            <UserPlus size={16} /> Nuevo Usuario
          </button>
        )}
      </div>

      <div className="tabs" role="tablist" aria-label="Secciones de administración">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'usuarios'}
          className={`tab-btn ${activeTab === 'usuarios' ? 'active' : ''}`}
          onClick={() => setActiveTab('usuarios')}
        >
          Usuarios
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'roles'}
          className={`tab-btn ${activeTab === 'roles' ? 'active' : ''}`}
          onClick={() => setActiveTab('roles')}
        >
          Roles y Permisos
        </button>
      </div>

      {activeTab === 'usuarios' ? (
        <>
          {error && (
            <div className="alert alert-danger" role="alert">
              <AlertCircle size={18} /> No se pudo cargar la lista de usuarios: {error}
            </div>
          )}

          {actionError && (
            <div className="alert alert-danger" role="alert">
              <AlertCircle size={18} /> {actionError}
            </div>
          )}

          <div className="table-responsive users-table-wrap">
            <table className="data-table users-table">
              <thead>
                <tr>
                  <th className="col-id">ID</th>
                  <th className="col-name">Nombre Completo</th>
                  <th className="col-email">Correo Electrónico</th>
                  <th className="col-role">Rol Asignado</th>
                  <th className="col-status">Estado</th>
                  <th className="col-actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8' }}>
                      <RefreshCw size={16} className="spin" /> Cargando usuarios…
                    </td>
                  </tr>
                )}
                {!loading && usuarios.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8' }}>Sin registros</td>
                  </tr>
                )}
                {usuarios.map((u) => (
                  <tr key={u.id}>
                    <td className="col-id">#{u.id}</td>
                    <td className="col-name"><strong>{u.name}</strong></td>
                    <td className="col-email">{u.email}</td>
                    <td className="col-role">{renderRol(u)}</td>
                    <td className="col-status">{renderEstado(u)}</td>
                    <td className="col-actions">{renderAccion(u)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Celulares: cada usuario como tarjeta con etiquetas claras */}
          {(loading || usuarios.length === 0) && (
            <div className="users-mobile-status" role="status">
              {loading
                ? <><RefreshCw size={16} className="spin" /> Cargando usuarios…</>
                : 'Sin registros'}
            </div>
          )}

          <div className="users-cards">
            {usuarios.map((u) => (
              <article className="user-card" key={u.id}>
                <div className="user-card-head">
                  <span className="user-card-id">ID #{u.id}</span>
                </div>
                <div className="user-card-fields">
                  <div className="user-card-field">
                    <span className="user-card-label">Nombre completo</span>
                    <span className="user-card-value">{u.name}</span>
                  </div>
                  <div className="user-card-field">
                    <span className="user-card-label">Correo electrónico</span>
                    <span className="user-card-value">{u.email}</span>
                  </div>
                  <div className="user-card-field">
                    <span className="user-card-label">Rol asignado</span>
                    <span className="user-card-value">{renderRol(u)}</span>
                  </div>
                  <div className="user-card-field">
                    <span className="user-card-label">Estado</span>
                    <span className="user-card-value">{renderEstado(u)}</span>
                  </div>
                </div>
                {puedeGestionar && (
                  <div className="user-card-actions">
                    {renderAccion(u)}
                  </div>
                )}
              </article>
            ))}
          </div>
        </>
      ) : (
        <RolesPermisosPanel onPermisosActualizados={onPermissionsUpdated} />
      )}

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Registrar Usuario Interno</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Ej. Roberto Gómez"
                />
              </div>
              <div className="form-group">
                <label>Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="usuario@telcom.com"
                />
              </div>
              <div className="form-group">
                <label>Contraseña</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  aria-describedby="password-requirements"
                />
                <ul id="password-requirements" className="password-requirements">
                  {passwordChecks.map((req) => (
                    <li key={req.id} className={req.met ? 'is-met' : 'is-pending'}>
                      {req.met ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                      <span>{req.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="form-group">
                <label>Rol</label>
                <select
                  required
                  value={newUser.rol_id}
                  onChange={(e) => setNewUser({ ...newUser, rol_id: e.target.value })}
                >
                  <option value="" disabled>Selecciona un rol</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.nombre}</option>
                  ))}
                </select>
              </div>
              {formError && (
                <div className="alert alert-danger" role="alert">
                  <AlertCircle size={18} /> {formError}
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading || !passwordOk}>Guardar Usuario</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
