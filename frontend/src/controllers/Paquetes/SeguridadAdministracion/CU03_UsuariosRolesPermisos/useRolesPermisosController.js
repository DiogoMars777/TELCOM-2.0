import { useState, useEffect, useMemo, useCallback } from 'react';
import { usuarioService } from '../../../../models/Paquetes/SeguridadAdministracion/CU03_UsuariosRolesPermisos/usuarioModel';
import { describeApiError } from '../../../../services/apiClient';

// Compara dos conjuntos de slugs sin depender del orden.
const firmaSlugs = (slugs) => [...slugs].sort().join('|');

/**
 * Controlador de la matriz editable de permisos por rol (CU03).
 * La autorización real la sigue aplicando el backend; aquí solo se prepara y
 * se envía la matriz, reflejando exactamente lo que el backend devuelve.
 */
export function useRolesPermisosController({ onPermisosActualizados } = {}) {
  const [roles, setRoles] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [selectedRolId, setSelectedRolId] = useState('');
  const [draft, setDraft] = useState([]); // slugs seleccionados sin guardar
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const selectedRol = useMemo(
    () => roles.find((r) => String(r.id) === String(selectedRolId)) || null,
    [roles, selectedRolId]
  );

  const savedSlugs = useMemo(
    () => (selectedRol ? (selectedRol.permisos ?? []).map((p) => p.slug).sort() : []),
    [selectedRol]
  );

  // ¿Hay cambios sin guardar frente a lo que devolvió el backend?
  const dirty = useMemo(
    () => Boolean(selectedRol) && firmaSlugs(draft) !== firmaSlugs(savedSlugs),
    [draft, savedSlugs, selectedRol]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { roles: rolesData, permisos: permisosData } = await usuarioService.fetchRolesPermisos();
      setRoles(rolesData);
      setPermisos(permisosData);
      setSelectedRolId((prev) => (
        permisoRolExiste(rolesData, prev) ? prev : (rolesData[0]?.id ?? '')
      ));
    } catch (e) {
      setRoles([]);
      setPermisos([]);
      setError(describeApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // El borrador siempre arranca desde lo que el backend tiene guardado.
  useEffect(() => {
    if (selectedRol) {
      setDraft((selectedRol.permisos ?? []).map((p) => p.slug));
    } else {
      setDraft([]);
    }
  }, [selectedRol]);

  const toggle = (slug) => {
    setDraft((prev) => (
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    ));
    setSuccess(null);
  };

  const toggleModulo = (slugs, marcar) => {
    setDraft((prev) => {
      const set = new Set(prev);
      slugs.forEach((slug) => (marcar ? set.add(slug) : set.delete(slug)));
      return [...set];
    });
    setSuccess(null);
  };

  const cancelar = () => {
    if (selectedRol) setDraft((selectedRol.permisos ?? []).map((p) => p.slug));
    setError(null);
    setSuccess(null);
  };

  const guardar = async () => {
    if (!selectedRol || saving) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await usuarioService.actualizarPermisosRol(selectedRol.id, [...draft].sort());
      const rolActualizado = res?.data ?? null;

      if (rolActualizado) {
        setRoles((prev) => prev.map((r) => (
          String(r.id) === String(rolActualizado.id) ? rolActualizado : r
        )));
      } else {
        await load();
      }

      setSuccess('Permisos guardados correctamente.');
      // Refresca los permisos de la sesión actual (menú/acciones visibles).
      onPermisosActualizados?.();
    } catch (e) {
      setError(describeApiError(e));
    } finally {
      setSaving(false);
    }
  };

  return {
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
    guardar,
    cancelar,
    toggle,
    toggleModulo,
  };
}

// Ayudante interno: ¿el rol sigue existiendo en la lista recargada?
function permisoRolExiste(roles, id) {
  return roles.some((r) => String(r.id) === String(id));
}
