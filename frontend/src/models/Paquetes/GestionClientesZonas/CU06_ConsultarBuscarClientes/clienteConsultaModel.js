import { apiClient } from '../../../../services/apiClient.js';
import { isDemoMode } from '../../../../config/appConfig.js';

// Datos de ejemplo SOLO para el modo demostración (desactivado por defecto).
export const mockClientesList = [
  {
    id: 1,
    codigo_cliente: 'CLI-10001',
    documento_identidad: '8492019',
    nombres: 'Carlos Andrés',
    apellidos: 'Mendoza Paredes',
    telefono: '+591 76543210',
    email: 'carlos.mendoza@email.com',
    direccion: 'Av. Siempre Viva #742',
    estado: 'ACTIVO',
    zona_nombre: 'Zona Norte',
  },
  {
    id: 2,
    codigo_cliente: 'CLI-10002',
    documento_identidad: '5318921',
    nombres: 'Valeria',
    apellidos: 'Rojas Silva',
    telefono: '+591 71239841',
    email: 'valeria.rojas@email.com',
    direccion: 'Calle Los Pinos #12',
    estado: 'ACTIVO',
    zona_nombre: 'Zona Sur',
  },
  {
    id: 3,
    codigo_cliente: 'CLI-10003',
    documento_identidad: '4928102',
    nombres: 'Fernando',
    apellidos: 'Torres Gutierrez',
    telefono: '+591 69821455',
    email: 'fernando.torres@email.com',
    direccion: 'Barrio Central #88',
    estado: 'SUSPENDIDO',
    zona_nombre: 'Zona Central',
  },
];

export const clienteConsultaService = {
  async fetchClientes(params = {}) {
    if (isDemoMode()) return mockClientesList;
    const res = await apiClient.get('/cu06/clientes', params);
    // La API responde { success, message, data: <paginator> }: el arreglo de
    // clientes viene en `data.data` (paginación de Laravel). Se admite además
    // `data` como arreglo directo por si el endpoint no estuviera paginado.
    const payload = res?.data;
    if (Array.isArray(payload)) return payload;
    return payload?.data ?? [];
  }
};
