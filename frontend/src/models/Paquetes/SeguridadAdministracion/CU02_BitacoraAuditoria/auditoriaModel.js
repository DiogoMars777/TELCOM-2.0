import { apiClient } from '../../../../services/apiClient.js';
import { isDemoMode } from '../../../../config/appConfig.js';

// Datos de ejemplo SOLO para el modo demostración (desactivado por defecto).
export const mockAuditoriaLogs = [
  {
    id: 1,
    user: { name: 'Admin Telecom', email: 'admin@telcom.com' },
    modulo: 'CU08_RegistrarActivarServicio',
    accion: 'ACTIVACION',
    detalles: 'Activación de servicio SRV-88201 para cliente CLI-10001 (100 Mbps)',
    ip_origen: '192.168.1.15',
    created_at: '2026-10-12 14:30:00',
  },
  {
    id: 2,
    user: { name: 'Cajero Principal', email: 'cajero@telcom.com' },
    modulo: 'CU10_GestionarPagoMensualidad',
    accion: 'REGISTRO_PAGO',
    detalles: 'Cobro de mensualidad FAC-2026-10-A91 por Bs. 220.00 vía QR',
    ip_origen: '192.168.1.22',
    created_at: '2026-10-12 12:15:20',
  },
  {
    id: 3,
    user: { name: 'Técnico Soporte', email: 'soporte@telcom.com' },
    modulo: 'CU14_RegistrarCorteRealizado',
    accion: 'CORTE_LOGICO',
    detalles: 'Corte lógico ejecutado por mora > 15 días en servicio SRV-44102',
    ip_origen: '192.168.1.48',
    created_at: '2026-10-12 10:00:11',
  },
];

export const auditoriaService = {
  async fetchLogs(filters = {}) {
    if (isDemoMode()) return mockAuditoriaLogs;
    const res = await apiClient.get('/cu02/auditoria', filters);
    return res?.data?.data ?? [];
  },

  // Usuarios reales que aparecen en la bitácora (para el filtro por usuario).
  async fetchUsuarios() {
    if (isDemoMode()) {
      const vistos = new Map();
      mockAuditoriaLogs.forEach((log) => {
        const u = log.user;
        if (u && !vistos.has(u.email)) {
          vistos.set(u.email, { id: vistos.size + 1, name: u.name, email: u.email });
        }
      });
      return [...vistos.values()];
    }
    const res = await apiClient.get('/cu02/auditoria/usuarios');
    return res?.data ?? [];
  }
};
