import { apiClient } from '../../../../services/apiClient.js';
import { isDemoMode } from '../../../../config/appConfig.js';

// Datos de ejemplo SOLO para el modo demostración (desactivado por defecto).
export const mockAlertas = [
  {
    mensualidad_id: 1,
    codigo_factura: 'FAC-2026-10-A91',
    cliente: 'Carlos Andrés Mendoza',
    servicio: 'Plan Fibra Ultra 100 Mbps',
    monto: 220.00,
    fecha_vencimiento: '2026-10-10',
    dias_retraso: 2,
    severidad: 'MEDIA',
  },
  {
    mensualidad_id: 4,
    codigo_factura: 'FAC-2026-09-F99',
    cliente: 'Fernando Torres Gutierrez',
    servicio: 'Plan Corporativo 300 Mbps',
    monto: 450.00,
    fecha_vencimiento: '2026-09-15',
    dias_retraso: 27,
    severidad: 'CRITICA',
  },
];

export const alertasService = {
  async fetchAlertas() {
    if (isDemoMode()) return mockAlertas;
    const res = await apiClient.get('/cu12/alertas');
    return res?.data?.alertas ?? [];
  }
};
