/**
 * Autenticación real con Laravel Sanctum (CU01).
 * -------------------------------------------------------------------
 * Login -> guarda el token Bearer. Logout -> lo revoca y lo borra.
 * `getCurrentUser` ya NO devuelve un usuario simulado: sin sesión, es null.
 */

import { apiClient, authToken } from '../../../../services/apiClient.js';
import { isDemoMode } from '../../../../config/appConfig.js';
import { CU_PERMISSIONS } from '../../../../config/access.js';

export const mockDemoUser = {
  id: 1,
  name: 'Administrador Demo',
  email: 'admin@telcom.bo',
  rol: { slug: 'admin', nombre: 'Administrador' },
  permisos: Object.values(CU_PERMISSIONS).filter(Boolean),
};

export const initialAuthCredentials = {
  email: '',
  password: '',
};

const USER_KEY = 'telcom_user';

export const authService = {
  async login(credentials) {
    if (isDemoMode()) {
      authToken.set('demo-token-active');
      localStorage.setItem(USER_KEY, JSON.stringify(mockDemoUser));
      return mockDemoUser;
    }

    const res = await apiClient.post('/cu01/login', credentials, { throwOnError: true });

    if (res?.data?.token) {
      authToken.set(res.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
    }

    return res?.data?.user ?? null;
  },

  async logout() {
    try {
      await apiClient.post('/cu01/logout', {}, { throwOnError: true });
    } catch {
      // El token pudo haber expirado; de todos modos cerramos la sesión local.
    }
    authToken.clear();
    localStorage.removeItem(USER_KEY);
  },

  async fetchCurrentUser() {
    if (isDemoMode()) {
      return this.getCurrentUser() || mockDemoUser;
    }
    const res = await apiClient.get('/cu01/me', {}, { throwOnError: true });
    return res?.data ?? null;
  },

  // Cambia la contraseña del usuario AUTENTICADO (CU01). El backend opera
  // siempre sobre el usuario de la sesión: no se envía ningún id de usuario.
  async cambiarPassword({ currentPassword, newPassword, newPasswordConfirmation }) {
    return await apiClient.post('/cu01/cambiar-password', {
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: newPasswordConfirmation,
    }, { throwOnError: true });
  },

  // Solicita el código de recuperación por correo electrónico (CU01).
  async solicitarRecuperacionPassword(email) {
    return await apiClient.post('/cu01/recuperar-password/solicitar', { email }, { throwOnError: true });
  },

  // Verifica si el código de 6 dígitos es válido y está vigente (CU01).
  async verificarCodigoRecuperacion({ email, codigo }) {
    return await apiClient.post('/cu01/recuperar-password/verificar-codigo', { email, codigo }, { throwOnError: true });
  },

  // Restablece la contraseña usando el código verificado (CU01).
  async restablecerPassword({ email, codigo, password, passwordConfirmation }) {
    return await apiClient.post('/cu01/recuperar-password/restablecer', {
      email,
      codigo,
      password,
      password_confirmation: passwordConfirmation,
    }, { throwOnError: true });
  },

  // Alias para compatibilidad con flujos de recuperación
  async forgotPassword(email) {
    return await this.solicitarRecuperacionPassword(email);
  },

  async resetPassword({ email, code, newPassword, newPasswordConfirmation }) {
    return await this.restablecerPassword({
      email,
      codigo: code,
      password: newPassword,
      passwordConfirmation: newPasswordConfirmation,
    });
  },

  getToken() {
    return authToken.get();
  },

  getCurrentUser() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  // Actualiza el usuario en caché (p. ej. tras cambiar los permisos del propio
  // rol) sin necesidad de volver a iniciar sesión.
  cacheUser(user) {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clear() {
    authToken.clear();
    localStorage.removeItem(USER_KEY);
  },
};
