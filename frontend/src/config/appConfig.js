/**
 * Configuración global del frontend.
 * -------------------------------------------------------------------
 * Modo demostración (`DEMO_MODE`):
 * - Permite operar la interfaz SIN backend usando datos de ejemplo locales.
 * - Está DESACTIVADO por defecto: en condiciones normales SIEMPRE se consulta
 *   la API real y, si falla, el error se muestra al usuario (nunca se
 *   sustituye por registros ficticios).
 * - Se activa únicamente de forma explícita con la variable de entorno
 *   `VITE_DEMO_MODE=true` (por ejemplo, en un `.env.local` de desarrollo).
 *   NUNCA debe activarse en un entorno con datos reales.
 */
export function isDemoMode() {
  // Permite forzar el valor en pruebas automatizadas sin depender de Vite.
  if (typeof globalThis !== 'undefined' && typeof globalThis.__TELCOM_DEMO__ === 'boolean') {
    return globalThis.__TELCOM_DEMO__;
  }

  const raw = import.meta.env?.VITE_DEMO_MODE;
  return String(raw ?? '').toLowerCase() === 'true';
}
