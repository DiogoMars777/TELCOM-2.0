/**
 * Control de acceso del frontend (TELCOM).
 * -------------------------------------------------------------------
 * Traduce los PERMISOS REALES que devuelve el backend (`/api/cu01/me` y
 * `/api/cu01/login` -> `user.permisos`) al menú de módulos.
 *
 * IMPORTANTE: esto es solo para la interfaz. La autorización real la aplica
 * SIEMPRE el backend (middleware `auth:sanctum` + `permission:<slug>`).
 * Ocultar un menú no sustituye ni debilita esa verificación.
 *
 * Módulo puro (sin React ni iconos) para poder probarlo con `node --test`.
 */

/**
 * Permiso requerido para ver/usar cada Caso de Uso.
 * `null` = disponible para cualquier usuario autenticado (ej. Mi Sesión).
 */
export const CU_PERMISSIONS = {
  CU01: null,
  // Cambiar la contraseña propia: cualquier rol interno con `auth.login`
  // (Administrador, Secretaría y Soporte Técnico) puede usarlo.
  CU01_PASSWORD: 'auth.login',
  CU02: 'auditoria.view',
  CU03: 'usuarios.manage',
  CU04: 'zonas.manage',
  CU05: 'clientes.create',
  CU06: 'clientes.view',
  CU07: 'clientes.update',
  CU08: 'servicios.view',
  CU09: 'mensualidades.view',
  CU10: 'pagos.register',
  CU11: 'pagos.history',
  CU12: 'alertas.view',
  CU13: 'cortes.list',
  CU14: 'cortes.register',
  CU15: 'reactivaciones.manage',
  CU16: 'planes.manage',
  CU17: 'planes.view',
};

/**
 * Orden preferido al elegir el módulo inicial tras iniciar sesión.
 * El primero permitido para el usuario será el que se muestre.
 */
export const CU_ORDER = [
  'CU06', 'CU05', 'CU07', 'CU08', 'CU16', 'CU17', 'CU09', 'CU10', 'CU11',
  'CU12', 'CU13', 'CU14', 'CU15', 'CU02', 'CU03', 'CU04', 'CU01',
];

/**
 * ¿El usuario posee el permiso indicado?
 * Sin slug requerido (null/undefined) se considera permitido.
 * @param {{permisos?: string[]}|null|undefined} user
 * @param {string|null|undefined} slug
 */
export function hasPermission(user, slug) {
  if (!slug) return true;
  const permisos = user?.permisos;
  return Array.isArray(permisos) && permisos.includes(slug);
}

/**
 * ¿Puede el usuario acceder al Caso de Uso indicado?
 * @param {{permisos?: string[]}|null|undefined} user
 * @param {string} cuId
 */
export function canAccessCu(user, cuId) {
  if (!Object.prototype.hasOwnProperty.call(CU_PERMISSIONS, cuId)) return false;
  return hasPermission(user, CU_PERMISSIONS[cuId]);
}

/** Filtra una lista de ids de CU dejando solo los permitidos. */
export function filterCuIds(user, cuIds) {
  return cuIds.filter((id) => canAccessCu(user, id));
}

/**
 * Primer módulo permitido según CU_ORDER; recurre a CU01 ("Mi Sesión")
 * si el usuario no tiene ningún permiso administrativo.
 */
export function firstAllowedCu(user) {
  return CU_ORDER.find((id) => canAccessCu(user, id)) || 'CU01';
}
