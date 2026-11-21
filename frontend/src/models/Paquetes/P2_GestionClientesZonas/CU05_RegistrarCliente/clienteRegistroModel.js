import { apiClient } from '../../../../services/apiClient.js';
import { isDemoMode } from '../../../../config/appConfig.js';

// Datos de ejemplo SOLO para el modo demostración (desactivado por defecto).
export const mockZonasCu05 = [
  { id: 1, codigo: 'ZON-NORTE', nombre: 'Zona Norte - Fibra Troncal', ciudad: 'La Paz / El Alto', tecnologia: 'FTTH GPON', capacidad_nodos: 500, activo: true },
  { id: 2, codigo: 'ZON-SUR', nombre: 'Zona Sur - Anillo Metropolitano', ciudad: 'Santa Cruz', tecnologia: 'FTTH GPON', capacidad_nodos: 800, activo: true },
  { id: 3, codigo: 'ZON-CENTRO', nombre: 'Zona Central - Casco Viejo', ciudad: 'Cochabamba', tecnologia: 'Radioenlace 5GHz', capacidad_nodos: 200, activo: true },
];

export const initialCliente = {
  tipo_documento: 'CI',
  documento_identidad: '',
  nombres: '',
  apellidos: '',
  telefono: '',
  email: '',
  direccion: '',
  zona_id: '',
};

export const clienteRegistroService = {
  async fetchZonas() {
    if (isDemoMode()) return mockZonasCu05;
    const res = await apiClient.get('/cu05/zonas');
    // La API responde { success, message, data: [...] }: el catálogo de zonas
    // viene directamente en `data` (igual que CU04). Se admite además la forma
    // `data.data` por si el endpoint pasara a devolver un listado paginado.
    const data = res?.data;
    return Array.isArray(data) ? data : (data?.data ?? []);
  },

  async registerCliente(data) {
    return await apiClient.post('/cu05/clientes', data);
  }
};
