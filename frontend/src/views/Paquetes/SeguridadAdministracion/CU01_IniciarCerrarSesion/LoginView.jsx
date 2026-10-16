import React, { useState } from 'react';
import { Wifi, Lock, Mail, ShieldCheck, Users, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuthController } from '../../../../controllers/Paquetes/SeguridadAdministracion/CU01_IniciarCerrarSesion/useAuthController';
import { siteConfig } from '../../../../config/siteConfig';
import RecuperarPasswordView from './RecuperarPasswordView';
import './login.css';

// Año actual calculado una sola vez (fuera del render).
const CURRENT_YEAR = new Date().getFullYear();

/* ---- Iconos para mostrar/ocultar contraseña (SVG propios) ---- */
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

/* ---- Composición visual: fibra óptica / infraestructura de red ---- */
function LeftVisual() {
  if (siteConfig.portal.image) {
    return <img className="emp-left-visual" src={siteConfig.portal.image} alt="" aria-hidden="true" />;
  }

  return (
    <svg
      className="emp-left-visual"
      viewBox="0 0 420 620"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="empLine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7fd3ff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#2f80ed" stopOpacity="0" />
        </linearGradient>
      </defs>

      <g fill="none" stroke="url(#empLine)" strokeWidth="1.5">
        <path d="M-20 90 C 120 140, 190 70, 440 150" />
        <path d="M-20 250 C 120 300, 200 190, 440 280" />
        <path d="M-20 430 C 130 470, 210 380, 440 470" />
        <path d="M120 -20 C 170 160, 90 300, 190 640" />
        <path d="M310 -20 C 250 180, 340 320, 260 640" />
      </g>

      <g fill="#7fd3ff">
        <circle cx="120" cy="138" r="3.5" opacity="0.9" />
        <circle cx="300" cy="120" r="2.8" opacity="0.7" />
        <circle cx="200" cy="300" r="3.2" opacity="0.8" />
        <circle cx="320" cy="430" r="3" opacity="0.7" />
        <circle cx="90" cy="440" r="2.6" opacity="0.6" />
      </g>
    </svg>
  );
}

/* ---- Iconos de los tres bloques informativos ---- */
const FEATURE_ICONS = {
  seguridad: ShieldCheck,
  roles: Users,
  correo: Mail,
};

export default function LoginView({ onLoginSuccess, onBack }) {
  const { credentials, setCredentials, loading, error, handleChange, handleSubmit } =
    useAuthController(onLoginSuccess);
  const [showPassword, setShowPassword] = useState(false);

  // Parámetros de URL para acceso directo desde el enlace del correo
  const queryParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const urlView = queryParams?.get('view');
  const urlEmail = queryParams?.get('email') || '';
  const urlCodigo = queryParams?.get('codigo') || queryParams?.get('token') || '';

  const [mode, setMode] = useState(
    urlView === 'recuperar' || Boolean(urlCodigo) ? 'recuperar' : 'login'
  );
  const [successBanner, setSuccessBanner] = useState(null);
  const { portal, brand } = siteConfig;

  return (
    <div className="emp-root">
      <div className="emp-card">
        {/* ------------------ Panel izquierdo ------------------ */}
        <section className="emp-left">
          <LeftVisual />

          <div className="emp-brand">
            <span className="emp-brand-mark">
              <Wifi size={18} />
            </span>
            {brand.name}
            <span className="emp-dot">.</span>
          </div>

          <div className="emp-left-copy">
            <h1>{portal.title}</h1>
            <p>{portal.description}</p>
          </div>

          <div className="emp-features">
            {portal.features.map((feature) => {
              const Icon = FEATURE_ICONS[feature.id] || ShieldCheck;
              return (
                <div className="emp-feature" key={feature.id}>
                  <span className="emp-feature-icon">
                    <Icon size={18} />
                  </span>
                  <div>
                    <strong>{feature.title}</strong>
                    <span>{feature.text}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="emp-left-foot">
            © {CURRENT_YEAR} {brand.name}. Todos los derechos reservados.
          </div>
        </section>

        {/* ------------------ Panel derecho ------------------ */}
        <section className="emp-right">
          {mode === 'recuperar' ? (
            <RecuperarPasswordView
              initialEmail={urlEmail}
              initialCodigo={urlCodigo}
              onVolverALogin={(data) => {
                setMode('login');
                if (data?.email) {
                  setCredentials((prev) => ({ ...prev, email: data.email }));
                }
                setSuccessBanner(data?.successMsg || 'Contraseña actualizada. Inicia sesión con tu nueva contraseña.');
              }}
            />
          ) : (
            <div className="emp-form-wrap">
              <div className="emp-form-head">
                <div className="emp-form-icon">
                  <Wifi size={26} />
                </div>
                <div className="emp-form-logo">
                  {brand.name}
                  <span className="emp-dot">.</span>
                </div>
                <p>{portal.subtitle}</p>
              </div>

              {successBanner && (
                <div className="emp-alert-success" role="status">
                  <CheckCircle2 size={16} /> {successBanner}
                </div>
              )}

              {error && (
                <div className="emp-alert" role="alert">
                  <ShieldCheck size={16} /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="emp-field">
                  <label htmlFor="login-user">Nombre de Usuario o Correo</label>
                  <div className="emp-input">
                    <Mail size={17} className="emp-input-icon" />
                    <input
                      id="login-user"
                      type="email"
                      name="email"
                      value={credentials.email}
                      onChange={(e) => {
                        setSuccessBanner(null);
                        handleChange(e);
                      }}
                      placeholder="usuario@telcom.com"
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>

                <div className="emp-field">
                  <label htmlFor="login-password">Contraseña</label>
                  <div className="emp-input has-toggle">
                    <Lock size={17} className="emp-input-icon" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={credentials.password}
                      onChange={(e) => {
                        setSuccessBanner(null);
                        handleChange(e);
                      }}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      className="emp-toggle"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                <div className="emp-row-link">
                  <button
                    type="button"
                    className="emp-link"
                    onClick={() => {
                      setSuccessBanner(null);
                      setMode('recuperar');
                    }}
                  >
                    {portal.forgotLabel}
                  </button>
                </div>

                <button type="submit" className="emp-submit" disabled={loading}>
                  {loading ? (
                    <>
                      <RefreshCw size={17} className="emp-spin" /> Verificando…
                    </>
                  ) : (
                    <>
                      <Lock size={17} /> Iniciar Sesión
                    </>
                  )}
                </button>
              </form>

              {onBack && (
                <div className="emp-back">
                  <a
                    href="#volver"
                    onClick={(e) => {
                      e.preventDefault();
                      onBack();
                    }}
                  >
                    ← Volver al inicio
                  </a>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
