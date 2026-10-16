import { apiClient } from '../../../../services/apiClient.js';
import { isDemoMode } from '../../../../config/appConfig.js';

// Datos de ejemplo SOLO para el modo demostración (desactivado por defecto).
// Son datos FICTICIOS: no corresponden a clientes reales.
export const mockZonas = [
  {
    id: 1,
    codigo: 'ZON-NORTE',
    nombre: 'Zona Norte - Fibra Troncal',
    ciudad: 'La Paz / El Alto',
    barrio: 'Villa Fátima',
    tecnologia: 'FTTH GPON',
    estado_cobertura: 'Disponible',
    capacidad_nodos: 500,
    area_mapa: {
      type: 'Polygon',
      coordinates: [[
        [-68.16, -16.47],
        [-68.12, -16.47],
        [-68.12, -16.50],
        [-68.16, -16.50],
        [-68.16, -16.47],
      ]],
    },
    activo: true,
  },
  {
    id: 2,
    codigo: 'ZON-SUR',
    nombre: 'Zona Sur - Anillo Metropolitano',
    ciudad: 'Santa Cruz',
    barrio: 'Equipetrol',
    tecnologia: 'FTTH GPON',
    estado_cobertura: 'Parcial',
    capacidad_nodos: 800,
    area_mapa: {
      type: 'Polygon',
      coordinates: [[
        [-63.20, -17.75],
        [-63.15, -17.75],
        [-63.15, -17.80],
        [-63.20, -17.80],
        [-63.20, -17.75],
      ]],
    },
    activo: true,
  },
  {
    id: 3,
    codigo: 'ZON-CENTRO',
    nombre: 'Zona Central - Casco Viejo',
    ciudad: 'Cochabamba',
    barrio: 'Centro',
    tecnologia: 'Radioenlace 5GHz',
    // Registro "antiguo" de ejemplo: sin estado ni área conocidos.
    estado_cobertura: null,
    capacidad_nodos: 200,
    area_mapa: null,
    activo: true,
  },
];

export const zonaService = {
  async fetchZonas() {
    if (isDemoMode()) return mockZonas;
    const res = await apiClient.get('/cu04/zonas');
    // El endpoint de CU04 devuelve el arreglo directamente en `data`
    // (a diferencia de los listados paginados, cuyo `data.data` es el arreglo).
    // Se aceptan ambas formas para no romper si el backend pagina a futuro.
    const data = res?.data;
    return Array.isArray(data) ? data : (data?.data ?? []);
  },

  async createZona(data) {
    return await apiClient.post('/cu04/zonas', data);
  },

  async updateZona(id, data) {
    return await apiClient.put(`/cu04/zonas/${id}`, data);
  }
};
