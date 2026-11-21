/**
 * Arranque de sesión (CU01) al iniciar/recargar la aplicación.
 * -------------------------------------------------------------------
 * Valida el token guardado antes de mostrar el panel. Se extrae del
 * `useEffect` de `App.jsx` para poder probar el caso crítico de la
 * recarga en desarrollo: React `StrictMode` monta, limpia y vuelve a
 * montar el efecto, por lo que la respuesta del primer intento llega
 * cuando ese efecto YA fue limpiado.
 *
 * Regla: la respuesta de un efecto desmontado es obsoleta y NO debe
 * tocar el token ni la sesión (ni autenticar, ni hacer `clear()`, ni
 * cerrar sesión). Solo el intento vigente resuelve.
 *
 * @param {object}   opts
 * @param {() => boolean} opts.isMounted  Devuelve `true` si el efecto sigue vigente.
 * @param {object}   opts.authService     Servicio de autenticación (inyectable en pruebas).
 * @param {(user: object) => void} opts.onAuthenticated  Usuario validado.
 * @param {() => void} opts.onBooted      Finalizó la validación (dejar de "bootear").
 */
export async function runAuthBootstrap({ isMounted, authService, onAuthenticated, onBooted }) {
  if (authService.getToken()) {
    try {
      const user = await authService.fetchCurrentUser();
      // Efecto ya limpiado: respuesta obsoleta, no tocar nada.
      if (!isMounted()) return;
      if (user) {
        onAuthenticated(user);
      } else {
        authService.clear();
      }
    } catch (err) {
      // Efecto ya limpiado: aunque sea 401, no debe borrar el token vigente.
      if (!isMounted()) return;
      if (err?.status === 401) {
        // Token inválido/expirado.
        authService.clear();
      } else {
        // Sin conexión: conservar la sesión en caché para no expulsar al usuario.
        const cached = authService.getCurrentUser();
        if (cached) onAuthenticated(cached);
      }
    }
  }
  if (isMounted()) onBooted();
}
