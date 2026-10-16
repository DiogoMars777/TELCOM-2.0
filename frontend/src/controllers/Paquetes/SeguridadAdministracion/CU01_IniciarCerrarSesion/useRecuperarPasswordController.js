import { useState, useEffect } from 'react';
import { authService } from '../../../../models/Paquetes/SeguridadAdministracion/CU01_IniciarCerrarSesion/authModel';
import { isPasswordValid } from '../../../../config/passwordPolicy';
import { describeApiError } from '../../../../services/apiClient';

/**
 * Controlador de Recuperación de Contraseña (CU01).
 *
 * Gestiona el flujo en 3 pasos:
 *  1. Solicitar código por correo.
 *  2. Ingresar código de 6 dígitos y definir la nueva contraseña cumpliendo la política de seguridad.
 *  3. Confirmación de éxito y regreso al inicio de sesión.
 */
export function useRecuperarPasswordController({ initialEmail = '', initialCodigo = '', onSuccess } = {}) {
  const [step, setStep] = useState(initialCodigo ? 2 : 1);
  const [email, setEmail] = useState(initialEmail);
  const [codigo, setCodigo] = useState(initialCodigo);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [cooldown, setCooldown] = useState(0);

  // Temporizador de reenvío
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordValid = isPasswordValid(password);
  const passwordsMatch = password.length > 0 && password === passwordConfirmation;
  const isCodigoValid = codigo.trim().length >= 4;

  const canRequestCode = isEmailValid && !loading && cooldown === 0;
  const canReset = isCodigoValid && passwordValid && passwordsMatch && !loading;

  // Paso 1: Enviar solicitud de código
  const handleSolicitarCodigo = async (e) => {
    e?.preventDefault();
    if (!isEmailValid || loading) return;

    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const res = await authService.solicitarRecuperacionPassword(email.trim());
      setInfoMessage(
        res?.message ||
        'Se ha enviado un código de verificación a tu correo. Revisa tu bandeja de entrada o spam.'
      );
      setStep(2);
      setCooldown(60); // 60s cooldown para reenvío
    } catch (err) {
      setError(describeApiError(err));
    } finally {
      setLoading(false);
    }
  };

  // Reenviar código
  const handleReenviarCodigo = async () => {
    if (cooldown > 0 || !isEmailValid || loading) return;
    await handleSolicitarCodigo();
  };

  // Paso 2: Restablecer contraseña
  const handleRestablecerPassword = async (e) => {
    e?.preventDefault();
    if (!canReset) return;

    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const res = await authService.restablecerPassword({
        email: email.trim(),
        codigo: codigo.trim(),
        password,
        passwordConfirmation,
      });

      setInfoMessage(
        res?.message || 'Tu contraseña ha sido restablecida exitosamente.'
      );
      setStep(3);
      if (typeof onSuccess === 'function') {
        onSuccess();
      }
    } catch (err) {
      setError(describeApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(1);
    setEmail('');
    setCodigo('');
    setPassword('');
    setPasswordConfirmation('');
    setError(null);
    setInfoMessage(null);
    setCooldown(0);
  };

  return {
    step,
    setStep,
    email,
    setEmail: (v) => { setEmail(v); setError(null); },
    codigo,
    setCodigo: (v) => { setCodigo(v); setError(null); },
    password,
    setPassword: (v) => { setPassword(v); setError(null); },
    passwordConfirmation,
    setPasswordConfirmation: (v) => { setPasswordConfirmation(v); setError(null); },
    loading,
    error,
    infoMessage,
    cooldown,
    isEmailValid,
    passwordValid,
    passwordsMatch,
    canRequestCode,
    canReset,
    handleSolicitarCodigo,
    handleReenviarCodigo,
    handleRestablecerPassword,
    reset,
  };
}
