import React, { useState } from 'react';
import {
  Wifi,
  Check,
  ShieldCheck,
  Zap,
  Clock,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  CreditCard,
} from 'lucide-react';
import { siteConfig } from '../../config/siteConfig';
import { plans } from '../../config/plans';
import PortalClienteModal from '../Paquetes/FacturacionCobranza/CU10_GestionarPagoMensualidad/PortalClienteModal';
import './public.css';

// Año actual calculado una sola vez (fuera del render).
const CURRENT_YEAR = new Date().getFullYear();

/* ---- Iconos de redes sociales (SVG propios, sin dependencias) ---- */
const socialIcons = {
  whatsapp: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.06c-.24.68-1.4 1.31-1.94 1.36-.5.05-1.12.07-1.8-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.8-4.17-4.95-4.36-.14-.19-1.18-1.57-1.18-3s.75-2.13 1.02-2.42c.27-.29.58-.36.78-.36l.56.01c.18.01.42-.07.66.5.24.58.82 2 .89 2.15.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.3.38-.43.5-.14.14-.29.29-.12.58.17.29.75 1.24 1.61 2.01 1.11.99 2.05 1.3 2.34 1.44.29.14.46.12.63-.07.17-.19.73-.85.93-1.14.19-.29.39-.24.66-.14.27.1 1.68.79 1.97.94.29.14.48.22.55.34.07.12.07.7-.17 1.38z" />
    </svg>
  ),
  instagram: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  ),
  facebook: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5h1.65V3.6c-.29-.04-1.27-.12-2.42-.12-2.39 0-4.03 1.46-4.03 4.14v2.28H7.5V13h2.75v8h3.25z" />
    </svg>
  ),
};

/* ---- Utilidad: desplazamiento suave a una sección ---- */
function scrollToId(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ============================ Encabezado ============================ */
function PublicHeader({ onEnterPortal, portalLabel, onOpenPortalCliente }) {
  return (
    <header className="pub-header">
      <div className="pub-container pub-header-inner">
        <a className="pub-logo" onClick={() => scrollToId('inicio')}>
          <span className="pub-logo-mark">
            <Wifi size={18} />
          </span>
          {siteConfig.brand.name}
        </a>

        <nav className="pub-nav">
          {siteConfig.nav.links.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={(e) => {
                e.preventDefault();
                scrollToId(link.id);
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="pub-header-actions">
          <button
            type="button"
            className="pub-portal-btn pub-pay-btn"
            onClick={onOpenPortalCliente}
          >
            <CreditCard size={15} />
            Pagar Mi Servicio
          </button>
          <button type="button" className="pub-portal-btn" onClick={onEnterPortal}>
            {portalLabel || siteConfig.nav.portalLabel}
          </button>
        </div>
      </div>
    </header>
  );
}


/* ============================ Formulario de correo ============================ */
function EmailCapture({ placeholder, buttonLabel }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    // Etapa de demostración: todavía no se envía a PostgreSQL.
    setSent(true);
    setEmail('');
  };

  return (
    <>
      <form className="pub-inline-form" onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          required
        />
        <button type="submit" className="pub-btn-primary">
          {buttonLabel}
          <ArrowRight size={16} />
        </button>
      </form>
      {sent && (
        <p className="pub-form-msg">
          <ShieldCheck size={16} /> Gracias, te contactaremos muy pronto.
        </p>
      )}
    </>
  );
}

/* ============================ Composición del hero ============================ */
function HeroVisual() {
  const { hero } = siteConfig;

  if (hero.image) {
    return (
      <div className="pub-visual">
        <img className="pub-visual-img" src={hero.image} alt={hero.imageAlt} />
      </div>
    );
  }

  return (
    <div className="pub-visual">
      <div className="pub-rings">
        <span className="pub-ring" />
        <span className="pub-ring" />
        <span className="pub-ring" />
        <span className="pub-ring-dot" />
      </div>

      <div className="pub-badge-float">
        <span className="pub-badge-icon">
          <Zap size={16} />
        </span>
        <div>
          <strong>30 Mbps</strong>
          <span>Simétricos</span>
        </div>
      </div>

      <div className="pub-card">
        <div className="pub-card-top">
          <span className="pub-card-brand">{siteConfig.brand.name}</span>
          <Wifi size={16} className="pub-card-signal" />
        </div>
        <div className="pub-card-chip" />
        <div className="pub-card-number">5021 ·· ·· 2450</div>
        <div className="pub-card-foot">
          <span>Fibra óptica</span>
          <span>24/7</span>
        </div>
      </div>
    </div>
  );
}

/* ============================ Sección principal ============================ */
function Hero({ onOpenPortalCliente }) {
  const { hero } = siteConfig;

  return (
    <section className="pub-hero" id="inicio">
      <div className="pub-container pub-hero-grid">
        <div className="pub-hero-copy">
          <span className="pub-eyebrow">
            <Zap size={14} /> Fibra óptica · Bolivia
          </span>

          <h1>
            {hero.titleLines.map((line, i) => (
              <React.Fragment key={i}>
                {i === hero.titleLines.length - 1 ? (
                  <span className="pub-gradient-text">{line}</span>
                ) : (
                  line
                )}
                {i < hero.titleLines.length - 1 ? <br /> : null}
              </React.Fragment>
            ))}
          </h1>

          <p className="pub-hero-sub">{hero.subtitle}</p>

          <EmailCapture placeholder={hero.emailPlaceholder} buttonLabel={hero.cta} />

          <div className="pub-hero-client-shortcut">
            <button
              type="button"
              className="pub-hero-pay-link"
              onClick={onOpenPortalCliente}
            >
              <CreditCard size={15} />
              ¿Ya eres cliente? Consulta tu estado y paga tu servicio con tu C.I.
            </button>
          </div>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

/* ============================ Planes ============================ */
function Plans() {
  return (
    <section className="pub-section" id="planes">
      <div className="pub-container">
        <div className="pub-section-head">
          <h2 className="pub-section-title accent">{siteConfig.plansSection.title}</h2>
          <p className="pub-section-sub">{siteConfig.plansSection.subtitle}</p>
        </div>

        <div className="pub-plans-grid">
          {plans.map((plan) => (
            <article key={plan.id} className={`pub-plan ${plan.highlighted ? 'is-featured' : ''}`}>
              {plan.highlighted && (
                <span className="pub-plan-badge">{siteConfig.plansSection.badge}</span>
              )}

              <h3 className="pub-plan-name">{plan.name}</h3>

              <div className="pub-plan-price">
                <strong>{plan.price}</strong>
                <span>
                  {plan.currency} {plan.period}
                </span>
              </div>
              <div className="pub-plan-speed">{plan.speedMbps} Mbps simétricos</div>

              <ul className="pub-plan-features">
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <Check size={16} /> {feature}
                  </li>
                ))}
              </ul>

              <button className="pub-plan-cta" onClick={() => scrollToId('contacto')}>
                {siteConfig.plansSection.cta}
              </button>
            </article>
          ))}
        </div>

        <p className="pub-note">{siteConfig.plansSection.note}</p>
      </div>
    </section>
  );
}

/* ============================ Cobertura ============================ */
function Coverage() {
  const { coverage } = siteConfig;
  const [zone, setZone] = useState('');
  const [result, setResult] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!zone.trim()) return;
    // Etapa de demostración: no se consulta PostgreSQL todavía.
    setResult(coverage.demoResult);
  };

  return (
    <section className="pub-coverage" id="cobertura">
      <div className="pub-container">
        <div className="pub-coverage-card">
          <h2 className="pub-section-title accent">{coverage.title}</h2>
          <p className="pub-section-sub">{coverage.subtitle}</p>

          <form className="pub-coverage-form" onSubmit={handleSubmit}>
            <input
              type="text"
              value={zone}
              onChange={(e) => {
                setZone(e.target.value);
                setResult('');
              }}
              placeholder={coverage.placeholder}
              aria-label={coverage.placeholder}
              required
            />
            <button type="submit" className="pub-btn-primary">
              {coverage.button}
            </button>
          </form>

          <p className="pub-note">
            Vista previa de demostración — no se consulta cobertura real.
          </p>

          {result && (
            <div className="pub-coverage-result">
              <ShieldCheck size={16} /> <strong>Demostración:</strong> {result}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ============================ Quiénes somos + estadísticas ============================ */
function About() {
  return (
    <section className="pub-about" id="nosotros">
      <div className="pub-container">
        <div className="pub-section-head">
          <h2 className="pub-section-title">{siteConfig.about.title}</h2>
          <p className="pub-section-sub">{siteConfig.about.body}</p>
        </div>

        <div className="pub-stats">
          {siteConfig.stats.map((stat) => (
            <div className="pub-stat" key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================ Llamada a la acción final ============================ */
function FinalCta() {
  const { cta } = siteConfig;

  return (
    <section className="pub-cta" id="contacto">
      <div className="pub-container">
        <div className="pub-cta-inner">
          <h2>{cta.title}</h2>
          <p>{cta.subtitle}</p>
          <EmailCapture placeholder={cta.emailPlaceholder} buttonLabel={cta.button} />
        </div>
      </div>
    </section>
  );
}

/* ============================ Pie de página ============================ */
function PublicFooter() {
  const { contact, social } = siteConfig;

  return (
    <footer className="pub-footer">
      <div className="pub-container pub-footer-grid">
        <div className="pub-footer-brand">
          <a className="pub-logo" onClick={() => scrollToId('inicio')}>
            <span className="pub-logo-mark">
              <Wifi size={18} />
            </span>
            {siteConfig.brand.name}
          </a>
          <p>{siteConfig.brand.tagline}.</p>
        </div>

        {/* Pie de página en dos columnas: contacto y redes sociales */}
        <div className="pub-footer-cols">
          <div className="pub-footer-col">
            <h4>Contacto</h4>
            <ul>
              <li>
                <Phone size={15} /> {contact.phone}
              </li>
              <li>
                <Mail size={15} /> {contact.email}
              </li>
              <li>
                <MapPin size={15} /> {contact.address}
              </li>
              <li>
                <Clock size={15} /> {contact.schedule}
              </li>
            </ul>
          </div>

          <div className="pub-footer-col">
            <h4>Redes sociales</h4>
            <ul>
              {social.map((item) => (
                <li key={item.id}>
                  <a href={item.url} target="_blank" rel="noreferrer">
                    {socialIcons[item.id]} {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="pub-container pub-footer-bottom">
        <span>
          © {CURRENT_YEAR} {siteConfig.brand.name}. {siteConfig.footer.legal}
        </span>
        <span>
          Datos de demostración editables en <code>src/config</code>.
        </span>
      </div>
    </footer>
  );
}

/* ============================ Vista completa ============================ */
export default function LandingView({ onEnterPortal, portalLabel }) {
  const [portalClienteOpen, setPortalClienteOpen] = useState(false);

  return (
    <div className="pub-root">
      <PublicHeader
        onEnterPortal={onEnterPortal}
        portalLabel={portalLabel}
        onOpenPortalCliente={() => setPortalClienteOpen(true)}
      />
      <Hero onOpenPortalCliente={() => setPortalClienteOpen(true)} />
      <Plans />
      <Coverage />
      <About />
      <FinalCta onOpenPortalCliente={() => setPortalClienteOpen(true)} />
      <PublicFooter />

      {/* Modal de Autoservicio Portal Cliente (CU10 - Gestionar Pago de Mensualidad) */}
      <PortalClienteModal
        isOpen={portalClienteOpen}
        onClose={() => setPortalClienteOpen(false)}
      />
    </div>
  );
}
