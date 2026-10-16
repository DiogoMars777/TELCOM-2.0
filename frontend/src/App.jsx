import React, { useEffect, useState } from 'react';

// Vistas públicas
import LandingView from './views/Public/LandingView';
import LoginView from './views/Paquetes/SeguridadAdministracion/CU01_IniciarCerrarSesion/LoginView';
import SesionView from './views/Paquetes/SeguridadAdministracion/CU01_IniciarCerrarSesion/SesionView';
import CambiarPasswordView from './views/Paquetes/SeguridadAdministracion/CU01_IniciarCerrarSesion/CambiarPasswordView';

// Vistas de los Casos de Uso (módulos administrativos, CU02-CU17)
import AuditoriaView from './views/Paquetes/SeguridadAdministracion/CU02_BitacoraAuditoria/AuditoriaView';
import UsuariosView from './views/Paquetes/SeguridadAdministracion/CU03_UsuariosRolesPermisos/UsuariosView';
import ZonasCoberturaView from './views/Paquetes/GestionClientesZonas/CU04_ZonasCobertura/ZonasCoberturaView';
import ClientesView from './views/Paquetes/GestionClientesZonas/ClientesView';
import ServicioInternetView from './views/Paquetes/ServiciosPlanes/CU08_RegistrarActivarServicio/ServicioInternetView';
import MensualidadGeneracionView from './views/Paquetes/FacturacionCobranza/CU09_GenerarMensualidades/MensualidadGeneracionView';
import PagoMensualidadView from './views/Paquetes/FacturacionCobranza/CU10_GestionarPagoMensualidad/PagoMensualidadView';
import HistorialPagosView from './views/Paquetes/FacturacionCobranza/CU11_ConsultarHistorialPagos/HistorialPagosView';
import AlertasVencimientoView from './views/Paquetes/FacturacionCobranza/CU12_VisualizarAlertasVencimiento/AlertasVencimientoView';
import ServiciosCorteView from './views/Paquetes/ServiciosPlanes/CU13_ListadoServiciosCorte/ServiciosCorteView';
import CorteRegistroView from './views/Paquetes/ServiciosPlanes/CU14_RegistrarCorteRealizado/CorteRegistroView';
import ReactivacionesView from './views/Paquetes/ServiciosPlanes/CU15_ListaRegistroReactivaciones/ReactivacionesView';
import PlanesInternetView from './views/Paquetes/ServiciosPlanes/CU16_GestionarCatalogoPlanes/PlanesInternetView';
import AsignarPlanView from './views/Paquetes/ServiciosPlanes/CU17_AsignarCambiarPlanInternet/AsignarPlanView';

// Iconos de cada módulo del panel
import {
  Radio, LogOut, History, Users, MapPin,
  UserPlus, Search, Edit3, Wifi, Calendar,
  CreditCard, Clock, AlertTriangle, Scissors, RefreshCw, Lock,
  Router, ArrowRightLeft,
} from 'lucide-react';

import { authService } from './models/Paquetes/SeguridadAdministracion/CU01_IniciarCerrarSesion/authModel';
import { runAuthBootstrap } from './models/Paquetes/SeguridadAdministracion/CU01_IniciarCerrarSesion/authBootstrap';
import { canAccessCu, firstAllowedCu } from './config/access';

/**
 * Menú lateral RECURSIVO.
 * Renderiza una categoría con sus ítems y, si los tiene, sus subcategorías
 * (`children`) anidadas a cualquier profundidad. Se apoya en las mismas clases
 * (.nav-group-title / .nav-item) para conservar el comportamiento responsive
 * del panel (barra compacta en tablet y deslizante en móvil).
 */
function MenuGroup({ group, activeId, onSelect }) {
  const items = group.items ?? [];
  const children = group.children ?? [];

  return (
    <div className="nav-group">
      {group.title && <div className="nav-group-title">{group.title}</div>}

      {items.map((item) => {
        const IconComponent = item.icon;
        const isActive = activeId === item.id;
        return (
          <button
            key={item.id}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => onSelect(item.id)}
          >
            <IconComponent size={16} />
            <span className="nav-item-label">{item.label}</span>
          </button>
        );
      })}

      {children.map((child, idx) => (
        <MenuGroup
          key={child.title || idx}
          group={child}
          activeId={activeId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

/**
 * Filtra recursivamente las categorías del menú según los permisos REALES del
 * usuario. Un grupo se conserva solo si le queda algún ítem o subcategoría.
 */
function filtrarGrupoMenu(group, user) {
  const items = (group.items ?? []).filter((item) => canAccessCu(user, item.id));
  const children = (group.children ?? [])
    .map((child) => filtrarGrupoMenu(child, user))
    .filter((child) => (child.items?.length ?? 0) > 0 || (child.children?.length ?? 0) > 0);

  return { ...group, items, children };
}

/** Aplana recursivamente los ítems del menú (para resolver el título activo). */
function aplanarItems(groups) {
  const out = [];
  for (const group of groups) {
    out.push(...(group.items ?? []));
    out.push(...aplanarItems(group.children ?? []));
  }
  return out;
}

export default function App() {
  // 'landing' | 'login' | 'admin'
  const [view, setView] = useState(() => {
    if (typeof window !== 'undefined') {
      const q = new URLSearchParams(window.location.search);
      if (q.get('view') === 'recuperar' || q.get('codigo') || q.get('token')) {
        return 'login';
      }
    }
    return 'landing';
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [activeCU, setActiveCU] = useState('CU06');
  const [corteServicioSelected, setCorteServicioSelected] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAuthenticated = Boolean(currentUser);

  // Al iniciar: validar un token guardado (protección de rutas)
  useEffect(() => {
    let mounted = true;
    runAuthBootstrap({
      isMounted: () => mounted,
      authService,
      onAuthenticated: (user) => {
        setCurrentUser(user);
        // Solo ir directamente al panel si la URL lo solicita explícitamente (?view=admin).
        // Al levantar el frontend, se muestra por defecto la Landing Page pública.
        if (typeof window !== 'undefined') {
          const q = new URLSearchParams(window.location.search);
          if (q.get('view') === 'admin') {
            setView('admin');
          }
        }
      },
      onBooted: () => setBooting(false),
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Si el token expira durante el uso, volver a la pantalla de acceso
  useEffect(() => {
    const onUnauthorized = () => {
      authService.clear();
      setCurrentUser(null);
      setActiveCU('CU01');
      setCorteServicioSelected(null);
      setView('login');
    };
    window.addEventListener('telcom:unauthorized', onUnauthorized);
    return () => window.removeEventListener('telcom:unauthorized', onUnauthorized);
  }, []);

  // Módulo efectivo: si `activeCU` deja de estar permitido para la sesión
  // actual (p. ej. por manipular el estado en el navegador), se deriva a uno
  // permitido durante el render. Nunca se renderiza un módulo sin permiso.
  // El backend sigue siendo quien autoriza de verdad.
  const effectiveCu = currentUser && canAccessCu(currentUser, activeCU)
    ? activeCU
    : firstAllowedCu(currentUser);

  const handleLoginSuccess = (user) => {
    const authed = user || authService.getCurrentUser();
    setCurrentUser(authed);
    setActiveCU(firstAllowedCu(authed));
    setSidebarOpen(false);
    setView('admin');
  };

  // Relee /me para refrescar rol y permisos de la sesión actual (por ejemplo,
  // después de modificar los permisos del propio rol). El menú y las acciones
  // visibles se recalculan a partir de `currentUser`.
  const refreshCurrentUser = async () => {
    try {
      const user = await authService.fetchCurrentUser();
      if (user) {
        authService.cacheUser(user);
        setCurrentUser(user);
      }
    } catch {
      // Si la sesión expiró, el interceptor 401 ya gestiona el cierre.
    }
  };

  const handleLogout = async () => {    await authService.logout();
    setCurrentUser(null);
    setActiveCU('CU01');
    setCorteServicioSelected(null);
    setSidebarOpen(false);
    setView('landing');
  };

  const menuSections = [
    {
      title: 'Seguridad & Auditoría',
      items: [
        { id: 'CU02', label: 'Bitácora de Auditoría', icon: History },
        { id: 'CU03', label: 'Usuarios, Roles y Permisos', icon: Users },
      ],
    },
    {
      title: 'Infraestructura',
      items: [{ id: 'CU04', label: 'Zonas de Cobertura', icon: MapPin }],
    },
    {
      title: 'Abonados & Clientes',
      items: [
        { id: 'CU06', label: 'Clientes', icon: Users },
      ],
    },
    {
      title: 'Servicios y Planes',
      items: [
        { id: 'CU08', label: 'Registrar / Activar Servicio', icon: Wifi },
        { id: 'CU16', label: 'Gestionar Planes de Internet', icon: Router },
        { id: 'CU17', label: 'Asignar / Cambiar Plan de Servicio', icon: ArrowRightLeft },
      ],
    },
    {
      title: 'Mensualidades & Pagos',
      items: [
        { id: 'CU09', label: 'Generar Mensualidades', icon: Calendar },
        { id: 'CU10', label: 'Gestionar Pago de Mensualidad', icon: CreditCard },
        { id: 'CU11', label: 'Historial de Pagos', icon: Clock },
      ],
    },
    {
      title: 'Operaciones Técnicas',
      items: [
        { id: 'CU12', label: 'Alertas de Vencimiento', icon: AlertTriangle },
        { id: 'CU13', label: 'Servicios para Corte', icon: Scissors },
        { id: 'CU14', label: 'Registrar Corte Realizado', icon: Scissors },
        { id: 'CU15', label: 'Reactivaciones de Servicio', icon: RefreshCw },
      ],
    },
    {
      title: 'Mi Cuenta',
      items: [
        { id: 'CU01_PASSWORD', label: 'Cambiar contraseña', icon: Lock },
      ],
    },
  ];

  // Solo se muestran los módulos para los que el usuario posee permiso real.
  // (Ocultar aquí no sustituye la autorización del backend.)
  // El filtrado es recursivo para admitir subcategorías anidadas.
  const visibleMenuSections = menuSections
    .map((section) => filtrarGrupoMenu(section, currentUser))
    .filter((section) => section.items.length > 0 || section.children.length > 0);

  // Nombre funcional del módulo activo para la barra superior (sin exponer el
  // código interno del caso de uso). CU01 no está en el menú, por lo que se
  // usa un rótulo genérico cuando la vista activa es el panel de sesión.
  const activeSectionLabel =
    aplanarItems(menuSections).find((item) => item.id === effectiveCu)?.label ||
    (effectiveCu === 'CU05' || effectiveCu === 'CU07' ? 'Clientes' : 'Panel de Gestión');

  const handleIrACorte = (servicio) => {
    setCorteServicioSelected(servicio);
    setActiveCU('CU14');
  };

  const renderActiveView = () => {
    // Se renderiza el módulo EFECTIVO (siempre permitido). Si alguien fuerza
    // `activeCU` a un módulo sin permiso desde el navegador, no se muestra:
    // se deriva a otro permitido. El backend autoriza de verdad.
    switch (effectiveCu) {
      case 'CU01':
        return <SesionView user={currentUser} />;
      case 'CU01_PASSWORD':
        return <CambiarPasswordView />;
      case 'CU02':
        return <AuditoriaView />;
      case 'CU03':
        return <UsuariosView user={currentUser} onPermissionsUpdated={refreshCurrentUser} />;
      case 'CU04':
        return <ZonasCoberturaView user={currentUser} />;
      case 'CU05':
      case 'CU06':
      case 'CU07':
        return <ClientesView user={currentUser} />;
      case 'CU08':
        return <ServicioInternetView user={currentUser} />;
      case 'CU09':
        return <MensualidadGeneracionView user={currentUser} />;
      case 'CU10':
        return <PagoMensualidadView />;
      case 'CU11':
        return <HistorialPagosView />;
      case 'CU12':
        return <AlertasVencimientoView />;
      case 'CU13':
        return <ServiciosCorteView onIrACorte={handleIrACorte} />;
      case 'CU14':
        return <CorteRegistroView initialServicio={corteServicioSelected} />;
      case 'CU15':
        return <ReactivacionesView user={currentUser} />;
      case 'CU16':
        return <PlanesInternetView user={currentUser} />;
      case 'CU17':
        return <AsignarPlanView user={currentUser} />;
      default:
        return <ClientesView user={currentUser} />;
    }
  };

  // --- Estado de arranque ---
  if (booting) {
    return (
      <div className="boot-screen">
        <RefreshCw size={26} className="spin" />
        <span>Cargando TELCOM…</span>
      </div>
    );
  }

  // --- Página pública (Landing Page de inicio) ---
  if (view === 'landing') {
    return (
      <LandingView
        portalLabel={currentUser ? 'Ir al Panel de Gestión' : undefined}
        onEnterPortal={() => {
          if (currentUser) {
            setView('admin');
          } else {
            setView('login');
          }
        }}
      />
    );
  }

  // --- Protección de rutas: sin sesión no se entra al panel ---
  if (view === 'login' || !isAuthenticated) {
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        onBack={() => setView('landing')}
      />
    );
  }

  // --- Panel administrativo (módulos existentes) ---
  return (
    <div className={`app-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand-icon">
            <Radio size={24} />
          </div>
          <div>
            <div className="brand-title">TELCOM ISP</div>
            <div className="brand-subtitle">Panel de Gestión</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {visibleMenuSections.map((section, idx) => (
            <MenuGroup
              key={section.title || idx}
              group={section}
              activeId={effectiveCu}
              onSelect={(id) => {
                setActiveCU(id);
                setSidebarOpen(false);
              }}
            />
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="btn btn-secondary sidebar-logout"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            <span className="sidebar-logout-label">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />

      <main className="main-content">
        <header className="top-bar">
          <div className="top-bar-left">
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Abrir menú"
            >
              ☰
            </button>
            <span className="top-bar-title">{activeSectionLabel}</span>
          </div>

          <div className="top-bar-right">
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => setView('landing')}
              title="Ver Landing Page pública"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginRight: '0.75rem' }}
            >
              <Radio size={14} />
              <span>Ver Sitio Web</span>
            </button>
            <div className="top-bar-user">
              <div className="user-avatar" aria-hidden="true">
                {(currentUser?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="top-bar-user-info">
                <span className="top-bar-user-name">{currentUser?.name}</span>
                <span className="top-bar-user-email">{currentUser?.email}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="content-body">{renderActiveView()}</div>
      </main>
    </div>
  );
}
