import React, { useState } from 'react';
import {
  Mail, KeyRound, Lock, ArrowLeft, RefreshCw,
  CheckCircle2, AlertCircle, Info, ShieldCheck, Check,
} from 'lucide-react';
import { useRecuperarPasswordController } from '../../../../controllers/Paquetes/SeguridadAdministracion/CU01_IniciarCerrarSesion/useRecuperarPasswordController';
import { evaluatePassword } from '../../../../config/passwordPolicy';

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a3 3 0 0 0 4.2 4.2" />
      <path d="M9.9 5.2A9.7 9.7 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.1 3.9" />
      <path d="M6.6 6.6A17 17 0 0 0 2 12s4 7 10 7a9.7 9.7 0 0 0 4.1-.9" />
    </svg>
  );
}

export default function RecuperarPasswordView({
  onVolverALogin,
  initialEmail = '',
  initialCodigo = '',
}) {
  const {
    step,
    setStep,
    email,
    setEmail,
    codigo,
    setCodigo,
    password,
    setPassword,
    passwordConfirmation,
    setPasswordConfirmation,
    loading,
    error,
    infoMessage,
    cooldown,
    isEmailValid,
    canRequestCode,
    canReset,
    passwordsMatch,
    handleSolicitarCodigo,
    handleReenviarCodigo,
    handleRestablecerPassword,
  } = useRecuperarPasswordController({
    initialEmail,
    initialCodigo,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Requisitos evaluados en vivo para la contraseña
  const passwordRequirements = evaluatePassword(password);

  return (
    <div className="emp-form-wrap">
      {/* Encabezado */}
      <div className="emp-form-head">
        <div className="emp-form-icon">
          <KeyRound size={26} />
        </div>
        <div className="emp-form-logo">
          Recuperar Contraseña
        </div>
        <p>Restablece tu acceso al sistema mediante verificación por correo</p>
      </div>

      {/* Indicador de pasos */}
      <div className="emp-steps-indicator" aria-label="Progreso de recuperación">
        <div className={`emp-step-dot ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}>
          <span className="emp-step-circle">
            {step > 1 ? <Check size={12} /> : '1'}
          </span>
          <span>Correo</span>
        </div>
        <div className="emp-step-line" />
        <div className={`emp-step-dot ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}>
          <span className="emp-step-circle">
            {step > 2 ? <Check size={12} /> : '2'}
          </span>
          <span>Código y Clave</span>
        </div>
        <div className="emp-step-line" />
        <div className={`emp-step-dot ${step === 3 ? 'completed active' : ''}`}>
          <span className="emp-step-circle">
            <Check size={12} />
          </span>
          <span>Listo</span>
        </div>
      </div>

      {/* Mensajes de error e información */}
      {error && (
        <div className="emp-alert" role="alert">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {infoMessage && step !== 3 && (
        <div className="emp-alert-info">
          <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{infoMessage}</span>
        </div>
      )}

      {/* ===================== PASO 1: Solicitar Código ===================== */}
      {step === 1 && (
        <form onSubmit={handleSolicitarCodigo} noValidate>
          <div className="emp-field">
            <label htmlFor="recuperar-email">Correo Electrónico Registrado</label>
            <div className="emp-input">
              <Mail size={17} className="emp-input-icon" />
              <input
                id="recuperar-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@telcom.com"
                autoComplete="email"
                required
                autoFocus
              />
            </div>
          </div>

          <p className="emp-info" style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
            Ingresa el correo institucional asociado a tu cuenta. Te enviaremos un código numérico de 6 dígitos válido por 60 minutos.
          </p>

          <button
            type="submit"
            className="emp-submit"
            disabled={!canRequestCode}
          >
            {loading ? (
              <>
                <RefreshCw size={17} className="emp-spin" /> Enviando código…
              </>
            ) : (
              <>
                <Mail size={17} /> Enviar Código de Verificación
              </>
            )}
          </button>
        </form>
      )}

      {/* ===================== PASO 2: Verificar Código y Nueva Clave ===================== */}
      {step === 2 && (
        <form onSubmit={handleRestablecerPassword} noValidate>
          <div className="emp-field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="recuperar-codigo">Código de Verificación (6 dígitos)</label>
              <button
                type="button"
                className="emp-link"
                style={{ fontSize: '0.75rem' }}
                onClick={() => setStep(1)}
              >
                Cambiar correo
              </button>
            </div>
            <div className="emp-input emp-code-input">
              <input
                id="recuperar-codigo"
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                autoComplete="one-time-code"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="emp-field">
            <label htmlFor="recuperar-new-password">Nueva Contraseña</label>
            <div className="emp-input has-toggle">
              <Lock size={17} className="emp-input-icon" />
              <input
                id="recuperar-new-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="emp-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* Requisitos de seguridad interactivos */}
          <div className="emp-password-rules" aria-live="polite">
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
              Requisitos de la contraseña:
            </div>
            {passwordRequirements.map((req) => (
              <div key={req.id} className={`emp-rule-item ${req.met ? 'met' : ''}`}>
                {req.met ? <Check size={13} /> : <span style={{ width: 13, height: 13, display: 'inline-block', borderRadius: '50%', background: '#cbd5e1' }} />}
                <span>{req.label}</span>
              </div>
            ))}
          </div>

          <div className="emp-field">
            <label htmlFor="recuperar-confirm-password">Confirmar Nueva Contraseña</label>
            <div className="emp-input has-toggle">
              <Lock size={17} className="emp-input-icon" />
              <input
                id="recuperar-confirm-password"
                type={showConfirm ? 'text' : 'password'}
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="emp-toggle"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Ocultar' : 'Mostrar'}
              >
                {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {passwordConfirmation && !passwordsMatch && (
              <span style={{ fontSize: '0.75rem', color: '#e11d48', marginTop: '0.25rem', display: 'block' }}>
                Las contraseñas no coinciden.
              </span>
            )}
          </div>

          <button
            type="submit"
            className="emp-submit"
            disabled={!canReset}
          >
            {loading ? (
              <>
                <RefreshCw size={17} className="emp-spin" /> Restableciendo…
              </>
            ) : (
              <>
                <ShieldCheck size={17} /> Restablecer Contraseña
              </>
            )}
          </button>

          <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
            <button
              type="button"
              className="emp-btn-link-subtle"
              onClick={handleReenviarCodigo}
              disabled={cooldown > 0 || loading}
            >
              <RefreshCw size={14} className={loading ? 'emp-spin' : ''} />
              {cooldown > 0
                ? `Reenviar código en ${cooldown}s`
                : '¿No recibiste el código? Reenviar'}
            </button>
          </div>
        </form>
      )}

      {/* ===================== PASO 3: Éxito ===================== */}
      {step === 3 && (
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#ecfdf5',
            color: '#10b981',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 1.25rem'
          }}>
            <CheckCircle2 size={36} />
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem' }}>
            ¡Contraseña Restablecida!
          </h3>

          <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1.75rem' }}>
            Tu contraseña ha sido actualizada con éxito. Ya puedes iniciar sesión con tus nuevas credenciales.
          </p>

          <button
            type="button"
            className="emp-submit"
            onClick={() => onVolverALogin({ email })}
          >
            <Lock size={17} /> Iniciar Sesión Ahora
          </button>
        </div>
      )}

      {/* Enlace para volver */}
      {step !== 3 && (
        <div className="emp-back">
          <button
            type="button"
            className="emp-btn-link-subtle"
            style={{ margin: '0 auto' }}
            onClick={() => onVolverALogin()}
          >
            <ArrowLeft size={15} /> Volver a Iniciar Sesión
          </button>
        </div>
      )}
    </div>
  );
}
