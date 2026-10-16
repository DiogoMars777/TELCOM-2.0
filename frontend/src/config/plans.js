/**
 * Planes residenciales TELCOM (datos de demostración).
 * -------------------------------------------------------------------
 * Edita precios, velocidades y beneficios sin tocar los componentes.
 * `highlighted: true` marca la tarjeta con la etiqueta «MÁS ELEGIDO».
 */

export const plans = [
  {
    id: 'fibra-10',
    name: 'Plan 10 Megas',
    speedMbps: 10,
    price: 100,
    currency: 'Bs',
    period: 'al mes',
    highlighted: false,
    features: [
      'Fibra óptica simétrica',
      'WiFi de doble banda',
      'Instalación gratuita',
    ],
  },
  {
    id: 'fibra-15',
    name: 'Plan 15 Megas',
    speedMbps: 15,
    price: 150,
    currency: 'Bs',
    period: 'al mes',
    highlighted: true,
    features: [
      'Fibra óptica simétrica',
      'WiFi de doble banda',
      'Instalación gratuita',
      'Soporte prioritario',
    ],
  },
  {
    id: 'fibra-20',
    name: 'Plan 20 Megas',
    speedMbps: 20,
    price: 200,
    currency: 'Bs',
    period: 'al mes',
    highlighted: false,
    features: [
      'Fibra óptica simétrica',
      'WiFi de doble banda',
      'Instalación gratuita',
      'IP fija disponible',
    ],
  },
  {
    id: 'fibra-30',
    name: 'Plan 30 Megas',
    speedMbps: 30,
    price: 299,
    currency: 'Bs',
    period: 'al mes',
    highlighted: false,
    features: [
      'Fibra óptica simétrica',
      'WiFi de doble banda',
      'Instalación gratuita',
      'IP fija disponible',
      'Soporte prioritario',
    ],
  },
];
