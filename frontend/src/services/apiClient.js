/**
 * Cliente HTTP base para TELCOM.
 * -------------------------------------------------------------------
 * - Toma la URL de la API de `VITE_API_URL` (con respaldo local).
 * - Envía el token Bearer de Sanctum cuando existe.
 * - NUNCA simula respuestas: ante un error HTTP (4xx/5xx) o de red SIEMPRE
 *   lanza una excepción con `status` (y `errors` cuando son de validación),
 *   para que la vista comunique el fallo real al usuario.
 * - Si se necesita operar sin backend existe el "modo demostración",
 *   configurado explícitamente en `config/appConfig` y desactivado por
 *   defecto; en ese modo son los servicios quienes devuelven datos locales.
 */

const BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8000/api';

// Clave del token en localStorage (debe coincidir con authModel).
const TOKEN_KEY = 'telcom_token';

export const authToken = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

function buildError(status, message, errors) {
  const error = new Error(message || `HTTP ${status}`);
  error.status = status;
  if (errors) error.errors = errors;
  return error;
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function notifyUnauthorized() {
  // Solo avisa si había una sesión iniciada (evita reaccionar al login fallido).
  if (authToken.get()) {
    window.dispatchEvent(new Event('telcom:unauthorized'));
  }
}

function defaultMessageFor(status) {
  if (status >= 500) {
    return 'Ocurrió un problema en el servidor. Inténtalo más tarde.';
  }
  switch (status) {
    case 400: return 'La solicitud no es válida.';
    case 401: return 'Tu sesión no es válida o expiró. Vuelve a iniciar sesión.';
    case 403: return 'No tienes autorización para realizar esta operación.';
    case 404: return 'El recurso solicitado no existe.';
    case 419: return 'Tu sesión expiró. Vuelve a iniciar sesión.';
    case 422: return 'Los datos enviados no son válidos.';
    case 429: return 'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.';
    default: return `No se pudo completar la solicitud (HTTP ${status}).`;
  }
}

async function request(method, endpoint, { params, data } = {}) {
  let url = `${BASE_URL}${endpoint}`;

  if (params) {
    const query = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      const value = params[key];
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });
    const qs = query.toString();
    if (qs) url += `?${qs}`;
  }

  const headers = { Accept: 'application/json' };
  const token = authToken.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  const init = { method, headers };
  if (data !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(data);
  }

  let response;
  try {
    response = await fetch(url, init);
  } catch {
    // Fallo de red / servidor inaccesible: se normaliza como status 0.
    throw buildError(0, 'No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.');
  }

  const body = response.status === 204 ? null : await safeJson(response);

  if (!response.ok || body?.success === false) {
    const status = response.ok ? 400 : response.status;
    if (status === 401) notifyUnauthorized();
    throw buildError(status, body?.message || defaultMessageFor(status), body?.errors);
  }

  return body;
}

export const apiClient = {
  get: (endpoint, params = {}) => request('GET', endpoint, { params }),
  post: (endpoint, data = {}) => request('POST', endpoint, { data }),
  put: (endpoint, data = {}) => request('PUT', endpoint, { data }),
  delete: (endpoint, data) => request('DELETE', endpoint, data === undefined ? {} : { data }),
};

function firstValidationMessage(errors) {
  if (!errors || typeof errors !== 'object') return null;
  for (const value of Object.values(errors)) {
    if (Array.isArray(value) && value.length) return String(value[0]);
    if (typeof value === 'string' && value) return value;
  }
  return null;
}

/**
 * Traduce un error de la API a un mensaje claro y seguro para el usuario.
 * No expone detalles internos del servidor (trazas, SQL, etc.).
 */
export function describeApiError(error) {
  if (!error) return 'Ocurrió un error inesperado.';

  // Error de red / servidor inaccesible.
  if (error.status === 0 || error.status === undefined) {
    return error.message || 'No se pudo conectar con el servidor.';
  }

  // Validación: se muestra el primer mensaje concreto del backend.
  if (error.status === 422) {
    return firstValidationMessage(error.errors)
      || error.message
      || 'Los datos enviados no son válidos.';
  }

  // Errores del servidor: mensaje genérico, sin datos sensibles.
  if (error.status >= 500) {
    return 'Ocurrió un problema en el servidor. Inténtalo más tarde.';
  }

  if (error.status === 401) return error.message || 'Tu sesión expiró. Vuelve a iniciar sesión.';
  if (error.status === 403) return error.message || 'No tienes autorización para realizar esta operación.';

  return error.message || 'No se pudo completar la operación.';
}
