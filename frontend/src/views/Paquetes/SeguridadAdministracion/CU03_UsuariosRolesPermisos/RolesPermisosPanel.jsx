import React, { useMemo } from 'react';
import { Save, X, AlertCircle, CheckCircle2, RefreshCw, ShieldCheck, Lock } from 'lucide-react';
import { useRolesPermisosController } from '../../../../controllers/Paquetes/SeguridadAdministracion/CU03_UsuariosRolesPermisos/useRolesPermisosController';

/**
 * Nombres legibles de los módulos REALES del catálogo de permisos.
 * El backend agrupa por `permiso.modulo`; aquí solo se traduce la clave a un
 * rótulo funcional (los códigos internos no se muestran en la interfaz).
 */
const MODULO_LABELS = {
  CU01: 'Seguridad · Sesión',
  CU02: 'Seguridad · Bitácora de Auditoría',
  CU03: 'Seguridad · Usuarios y Permisos',
  CU04: 'Infraestructura · Zonas de Cobertura',
  CU05: 'Abonados · Registro de Clientes',
  CU06: 'Abonados · Consulta de Clientes',
  CU07: 'Abonados · Actualización y Baja',
  CU08: 'Servicios · Registro y Activación',
  CU09: 'Facturación · Generación de Mensualidades',
  CU10: 'Facturación · Registro de Pagos',
  CU11: 'Facturación · Historial de Pagos',
  CU12: 'Facturación · Alertas de Vencimiento',
  CU13: 'Operaciones · Servicios para Corte',
  CU14: 'Operaciones · Registro de Cortes',
  CU15: 'Operaciones · Reactivaciones',
  PLANES: 'Planes de Internet',
  EQUIPOS: 'Equipos y Comodato',
  INSTALACIONES: 'Instalaciones',
  PROVEEDORES: 'Proveedores',
  COMPRAS: 'Compras',
  REPORTES: 'Reportes Gerenciales',
};

function moduloLabel(modulo) {
  return MODULO_LABELS[modulo] || modulo || 'General';
}

export default function RolesPermisosPanel({ onPermisosActualizados }) {
  const {
    roles,
    permisos,
    selectedRolId,
    setSelectedRolId,
    selectedRol,
    draft,
    dirty,
    loading,
    saving,
    error,
    success,
    cancelar,
    guardar,
    toggle,
    toggleModulo,
  } = useRolesPermisosController({ onPermisosActualizados });

  const grupos = useMemo(() => {
    const map = new Map();
    permisos.forEach((p) => {
      const key = p.modulo || 'General';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    });
    return [...map.entries()].map(([modulo, items]) => ({ modulo, items }));
  }, [permisos]);

  const draftSet = useMemo(() => new Set(draft), [draft]);

  return (
    <div className="permissions-panel">
      <div className="permissions-toolbar">
        <div className="permissions-rol">
          <label htmlFor="rol-permisos">Rol</label>
          <select
            id="rol-permisos"
            value={selectedRolId}
            onChange={(e) => setSelectedRolId(e.target.value)}
            disabled={loading || saving || roles.length === 0}
          >
            {roles.length === 0 && <option value="">Sin roles</option>}
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.nombre}</option>
            ))}
          </select>
        </div>

        {selectedRol && (
          <div className="permissions-rol-meta">
            <ShieldCheck size={16} />
            <span>{selectedRol.permisos?.length ?? 0} permisos asignados</span>
            {!selectedRol.activo && (
              <span className="badge badge-warning"><Lock size={12} /> Rol inactivo</span>
            )}
          </div>
        )}

        {dirty && (
          <span className="badge badge-warning" role="status">
            <AlertCircle size={12} /> Cambios sin guardar
          </span>
        )}
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={18} /> {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success" role="status">
          <CheckCircle2 size={18} /> {success}
        </div>
      )}

      {loading && roles.length === 0 ? (
        <div className="permissions-empty">
          <RefreshCw size={18} className="spin" /> Cargando roles y permisos…
        </div>
      ) : grupos.length === 0 ? (
        <div className="permissions-empty">No hay permisos disponibles.</div>
      ) : (
        <div className="permissions-matrix">
          {grupos.map(({ modulo, items }) => {
            const slugs = items.map((p) => p.slug);
            const seleccionados = slugs.filter((s) => draftSet.has(s)).length;
            const todos = seleccionados === slugs.length && slugs.length > 0;

            return (
              <section key={modulo} className="permission-module">
                <header className="permission-module-header">
                  <h3>{moduloLabel(modulo)}</h3>
                  <label className="permission-select-all">
                    <input
                      type="checkbox"
                      checked={todos}
                      ref={(el) => {
                        if (el) el.indeterminate = seleccionados > 0 && !todos;
                      }}
                      disabled={saving || !selectedRol}
                      onChange={(e) => toggleModulo(slugs, e.target.checked)}
                    />
                    <span>{seleccionados}/{slugs.length}</span>
                  </label>
                </header>

                <div className="permission-list">
                  {items.map((p) => (
                    <label key={p.slug} className="permission-item">
                      <input
                        type="checkbox"
                        checked={draftSet.has(p.slug)}
                        disabled={saving || !selectedRol}
                        onChange={() => toggle(p.slug)}
                      />
                      <span className="permission-item-text">
                        <span className="permission-item-name">{p.nombre}</span>
                        <code className="permission-item-slug">{p.slug}</code>
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <div className="permissions-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={cancelar}
          disabled={!dirty || saving}
        >
          <X size={16} /> Cancelar
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={guardar}
          disabled={!dirty || saving || !selectedRol}
        >
          {saving ? <RefreshCw size={16} className="spin" /> : <Save size={16} />}
          {saving ? ' Guardando…' : ' Guardar cambios'}
        </button>
      </div>
    </div>
  );
}
