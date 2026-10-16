import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, Circle, AlertCircle, ShieldCheck } from 'lucide-react';
import { useCambiarPasswordController } from '../../../../controllers/Paquetes/SeguridadAdministracion/CU01_IniciarCerrarSesion/useCambiarPasswordController';
import { evaluatePassword } from '../../../../config/passwordPolicy';
import './CambiarPasswordView.css';

/**
 * CU01 - Cambiar contraseña del usuario autenticado.
 *
 * Solo afecta a la propia cuenta. Muestra los requisitos de la política en vivo
 * y deshabilita el envío mientras falte alguno o la confirmación no coincida.
 * La validación definitiva la aplica también el backend.
 */

function PasswordInput({ id, label, name, value, onChange, autoComplete, describedBy }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <div className="input-with-toggle">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          aria-describedby={describedBy}
          required
        />
        <button
          type="button"
          className="input-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

export default function CambiarPasswordView() {
  const {
    form,
    loading,
    error,
    success,
    handleChange,
    handleSubmit,
    reset,
    passwordsMatch,
    canSubmit,
  } = useCambiarPasswordController();

  const requirements = evaluatePassword(form.newPassword);
  const showMismatch = form.newPasswordConfirmation.length > 0 && !passwordsMatch;

  return (
    <div className="view-panel cu01-change-password">
      <div className="view-header">
        <div>
          <h2>Cambiar contraseña</h2>
          <p className="subtitle">Actualiza la contraseña de tu propia cuenta</p>
        </div>
      </div>

      <div className="form-card password-card">
        {success && (
          <div className="alert alert-success" role="status">
            <CheckCircle2 size={18} /> {success}
          </div>
        )}

        {error && (
          <div className="alert alert-danger" role="alert">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <PasswordInput
            id="current-password"
            label="Contraseña actual"
            name="currentPassword"
            value={form.currentPassword}
            onChange={handleChange}
            autoComplete="current-password"
          />

          <PasswordInput
            id="new-password"
            label="Nueva contraseña"
            name="newPassword"
            value={form.newPassword}
            onChange={handleChange}
            autoComplete="new-password"
            describedBy="new-password-requirements"
          />

          <ul id="new-password-requirements" className="password-requirements" aria-live="polite">
            {requirements.map((req) => (
              <li key={req.id} className={req.met ? 'is-met' : 'is-pending'}>
                {req.met ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                <span>{req.label}</span>
              </li>
            ))}
          </ul>

          <PasswordInput
            id="confirm-password"
            label="Confirmar nueva contraseña"
            name="newPasswordConfirmation"
            value={form.newPasswordConfirmation}
            onChange={handleChange}
            autoComplete="new-password"
            describedBy="confirm-password-error"
          />

          {showMismatch && (
            <p id="confirm-password-error" className="field-error" role="alert">
              Las contraseñas no coinciden.
            </p>
          )}

          <p className="password-hint">
            <ShieldCheck size={14} /> Por seguridad, tu contraseña actual nunca se
            muestra ni se registra en la bitácora.
          </p>

          <div className="form-actions-split">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={reset}
              disabled={loading}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
              <Lock size={16} /> {loading ? 'Cambiando…' : 'Cambiar contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
