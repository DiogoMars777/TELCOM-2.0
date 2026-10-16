/**
 * Configuración pública del sitio TELCOM.
 * -------------------------------------------------------------------
 * Todos los datos de demostración (contacto, redes, estadísticas, textos
 * públicos) viven aquí. Edita este archivo sin tocar los componentes.
 */

export const siteConfig = {
  brand: {
    name: 'TELCOM',
    suffix: '',
    tagline: 'Internet de fibra para el mundo moderno',
  },

  // Encabezado
  nav: {
    links: [
      { id: 'planes', label: 'Planes' },
      { id: 'cobertura', label: 'Cobertura' },
      { id: 'nosotros', label: 'Nosotros' },
      { id: 'contacto', label: 'Contacto' },
    ],
    portalLabel: 'Portal Empleados',
  },

  // Sección principal (hero)
  hero: {
    titleLines: ['Internet de fibra', 'para el mundo', 'moderno'],
    subtitle:
      'Conectividad simétrica, estable y de baja latencia para tu hogar. Instalación el mismo día y soporte humano cuando lo necesites.',
    emailPlaceholder: 'Ingresa tu correo',
    cta: 'Contratar',
    // Opcional: URL de una fotografía real (p. ej. una persona sosteniendo una
    // tarjeta negra). Si se deja vacío, se usa la composición visual en CSS/SVG.
    image: '',
    imageAlt: 'Persona sosteniendo una tarjeta TELCOM',
  },

  // Sección de planes (los datos concretos están en plans.js)
  plansSection: {
    title: 'Planes Residenciales',
    subtitle:
      'Elige la velocidad que acompaña tu día. Sin contratos forzados ni costos ocultos.',
    badge: 'MÁS ELEGIDO',
    cta: 'Contratar',
    note: 'Precios en bolivianos (Bs), impuestos incluidos.',
  },

  // Portal de Empleados (pantalla de inicio de sesión)
  portal: {
    title: 'Conectividad Confiable & Gestión Inteligente',
    subtitle: 'Sistema de Gestión de Telecomunicaciones',
    description:
      'La plataforma interna de TELCOM para administrar abonados, servicios, cobranzas y equipos desde un solo lugar.',
    // Opcional: URL de una imagen de fibra óptica / centro de datos.
    // Si se deja vacío, se usa la composición visual en CSS/SVG.
    image: '',
    features: [
      {
        id: 'seguridad',
        title: 'Seguridad',
        text: 'Sesiones protegidas con tokens de acceso.',
      },
      {
        id: 'roles',
        title: 'Control de acceso por roles',
        text: 'Cada empleado accede solo a lo que le corresponde.',
      },
      {
        id: 'correo',
        title: 'Integración de correo',
        text: 'Notificaciones y avisos automáticos.',
      },
    ],
    forgotLabel: '¿Olvidaste tu contraseña?',
  },

  // Sección de cobertura
  coverage: {
    title: 'Cobertura',
    subtitle: 'Comprueba si la red de fibra ya llega a tu zona.',
    placeholder: 'Escribe tu barrio o ciudad',
    button: 'Consultar',
    demoResult: '¡Buenas noticias! La red de fibra TELCOM llega a esa zona.',
  },

  // Sección "Quiénes somos"
  about: {
    title: 'Quiénes Somos',
    body: 'Somos una empresa boliviana de telecomunicaciones dedicada a llevar fibra óptica real a los hogares. Construimos nuestra propia red para que estudiar, trabajar y entretenerse sea algo que simplemente funciona.',
  },

  // Estadísticas (números grandes en celeste)
  stats: [
    { value: '99.9%', label: 'Estabilidad' },
    { value: '100%', label: 'Fibra simétrica' },
    { value: '24/7', label: 'Soporte' },
  ],

  // Llamada a la acción final
  cta: {
    title: 'Lleva fibra óptica a tu hogar',
    subtitle: 'Déjanos tu correo y un asesor se pondrá en contacto contigo.',
    emailPlaceholder: 'tu@correo.com',
    button: 'Contratar',
  },

  // Contacto y redes (pie de página)
  contact: {
    phone: '+591 700 12345',
    email: 'contacto@telcom.com',
    address: 'Av. Arce #1234, La Paz, Bolivia',
    schedule: 'Atención de lunes a domingo, 8:00 a 22:00',
  },

  social: [
    { id: 'whatsapp', label: 'WhatsApp', url: 'https://wa.me/59170012345' },
    { id: 'instagram', label: 'Instagram', url: 'https://instagram.com/telcom' },
    { id: 'facebook', label: 'Facebook', url: 'https://facebook.com/telcom' },
  ],

  footer: {
    legal: 'Todos los derechos reservados.',
  },
};
