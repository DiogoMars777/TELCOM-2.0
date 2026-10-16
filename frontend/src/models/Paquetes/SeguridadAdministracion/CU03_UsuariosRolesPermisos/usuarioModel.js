import { apiClient } from '../../../../services/apiClient.js';
import { isDemoMode } from '../../../../config/appConfig.js';

// Datos de ejemplo SOLO para el modo demostración (desactivado por defecto).
export const mockUsuarios = [
  { id: 1, name: 'Administrador Senior TELCOM', email: 'admin@telcom.com', role: 'Administrador', activo: true },
  { id: 2, name: 'Beatriz Morales', email: 'caja1@telcom.com', role: 'Secretaría', activo: true },
  { id: 3, name: 'Marcos Quiroga', email: 'tecnico1@telcom.com', role: 'Soporte Técnico', activo: true },
];

export const mockPermisos = [
  { id: 1, slug: 'auth.login', nombre: 'Iniciar Sesión', modulo: 'CU01' },
  { id: 2, slug: 'auditoria.view', nombre: 'Consultar Bitácora', modulo: 'CU02' },
  { id: 3, slug: 'usuarios.manage', nombre: 'Gestionar Usuarios, Roles y Permisos', modulo: 'CU03' },
  { id: 4, slug: 'clientes.view', nombre: 'Consultar Clientes', modulo: 'CU06' },
  { id: 5, slug: 'pagos.register', nombre: 'Registrar Pago Presencial', modulo: 'CU10' },
  { id: 6, slug: 'equipos.view', nombre: 'Consultar Equipos', modulo: 'EQUIPOS' },
];

export const mockRoles = [
  { id: 1, nombre: 'Administrador', slug: 'admin', permisos: mockPermisos },
  { id: 2, nombre: 'Secretaría', slug: 'secretaria', permisos: mockPermisos.filter((p) => [3, 4, 5].includes(p.id)) },
  { id: 3, nombre: 'Soporte Técnico', slug: 'tecnico', permisos: mockPermisos.filter((p) => [1, 4, 6].includes(p.id)) },
];

export const usuarioService = {
  async fetchUsuarios() {
    if (isDemoMode()) return mockUsuarios;
    const res = await apiClient.get('/cu03/usuarios');
    return res?.data?.usuarios?.data ?? [];
  },

  // El endpoint entrega usuarios (paginados) y roles en la misma respuesta.
  async fetchUsuariosYRoles() {
    if (isDemoMode()) return { usuarios: mockUsuarios, roles: mockRoles };
    const res = await apiClient.get('/cu03/usuarios');
    return {
      usuarios: res?.data?.usuarios?.data ?? [],
      roles: res?.data?.roles ?? [],
    };
  },

  async createUsuario(data) {
    return await apiClient.post('/cu03/usuarios', data);
  },

  // Activar/desactivar (y otros campos) con el body parcial.
  async actualizarUsuario(id, data) {
    return await apiClient.put(`/cu03/usuarios/${id}`, data);
  },

  async cambiarRol(id, rolId) {
    return await apiClient.put(`/cu03/usuarios/${id}/rol`, { rol_id: rolId });
  },

  // Catálogo real de roles y permisos para la matriz editable (CU03).
  async fetchRolesPermisos() {
    if (isDemoMode()) {
      return {
        roles: mockRoles.map((r) => ({ ...r, permisos: [...r.permisos] })),
        permisos: [...mockPermisos],
      };
    }
    const res = await apiClient.get('/cu03/roles');
    return {
      roles: res?.data?.roles ?? [],
      permisos: res?.data?.permisos ?? [],
    };
  },

  // Reemplaza la matriz de permisos de un rol con los slugs reales indicados.
  async actualizarPermisosRol(id, slugs) {
    if (isDemoMode()) return { id, permisos: slugs };
    return await apiClient.put(`/cu03/roles/${id}/permisos`, { permisos: slugs });
  }
};
