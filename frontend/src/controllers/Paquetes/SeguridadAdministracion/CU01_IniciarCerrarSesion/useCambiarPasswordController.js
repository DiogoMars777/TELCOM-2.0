import { useState } from 'react';
import { authService } from '../../../../models/Paquetes/SeguridadAdministracion/CU01_IniciarCerrarSesion/authModel';
import { isPasswordValid } from '../../../../config/passwordPolicy';
import { describeApiError } from '../../../../services/apiClient';

/**
 * Controlador de "Cambiar contraseña" (CU01).
 *
 * Solo gestiona la contraseña del usuario AUTENTICADO: nunca envía un id, por
 * lo que no es posible afectar a otra cuenta. La validación de la política se
 * comparte con el backend a través de `config/passwordPolicy`.
 */
const initialForm = {
  currentPassword: '',
  newPassword: '',
  newPasswordConfirmation: '',
};

export function useCambiarPasswordController() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Al teclear de nuevo se limpian los mensajes anteriores.
    setError(null);
    setSuccess(null);
  };

  const reset = () => {
    setForm(initialForm);
    setError(null);
    setSuccess(null);
  };

  const passwordValid = isPasswordValid(form.newPassword);
  const passwordsMatch =
    form.newPassword.length > 0 && form.newPassword === form.newPasswordConfirmation;
  const canSubmit =
    Boolean(form.currentPassword) && passwordValid && passwordsMatch && !loading;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await authService.cambiarPassword(form);
      setSuccess('Tu contraseña se actualizó correctamente.');
      setForm(initialForm);
    } catch (err) {
      setError(describeApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    loading,
    error,
    success,
    handleChange,
    handleSubmit,
    reset,
    passwordValid,
    passwordsMatch,
    canSubmit,
  };
}
