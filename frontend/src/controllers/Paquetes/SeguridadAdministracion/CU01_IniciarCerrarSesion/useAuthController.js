import { useState } from 'react';
import { authService, initialAuthCredentials } from '../../../../models/Paquetes/SeguridadAdministracion/CU01_IniciarCerrarSesion/authModel';

/**
 * Controlador del inicio de sesión (CU01).
 * Realiza la autenticación real contra Laravel Sanctum.
 */
export function useAuthController(onLoginSuccess) {
  const [credentials, setCredentials] = useState(initialAuthCredentials);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = await authService.login(credentials);
      if (onLoginSuccess) onLoginSuccess(user);
    } catch (err) {
      if (err.status === 429) {
        setError(err.message || 'Demasiados intentos fallidos. Vuelve a intentarlo en unos minutos.');
      } else if (err.status === 401) {
        setError('Correo o contraseña incorrectos.');
      } else if (err.status === 422) {
        setError('Revisa el correo y la contraseña ingresados.');
      } else {
        setError('No se pudo conectar con el servidor. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    credentials,
    setCredentials,
    loading,
    error,
    handleChange,
    handleSubmit,
  };
}
