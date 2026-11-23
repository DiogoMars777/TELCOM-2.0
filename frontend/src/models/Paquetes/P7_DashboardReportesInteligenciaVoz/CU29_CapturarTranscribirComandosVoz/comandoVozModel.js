import { apiClient } from '../../../../services/apiClient.js';
import { isDemoMode } from '../../../../config/appConfig.js';

export const mockHistorialComandos = [
  {
    id: 1,
    texto: 'Mostrar ingresos de la Zona Norte del último mes',
    intencion: 'REPORTE_INGRESOS',
    parametros: { zona_id: 1, rango_etiqueta: 'Último mes' },
    estado: 'CONFIRMADO',
    confianza: 0.98,
    fechaHora: '20/11/2026 14:30',
    usuario: 'Administrador Principal',
  },
  {
    id: 2,
    texto: 'Reporte de clientes morosos y cartera vencida',
    intencion: 'REPORTE_MOROSIDAD',
    parametros: {},
    estado: 'TRANSCRITO',
    confianza: 0.95,
    fechaHora: '20/11/2026 11:15',
    usuario: 'Administrador Principal',
  },
];

export const mockEjemplosVoz = [
  {
    texto: 'Mostrar ingresos de la Zona Norte del último mes',
    intencion: 'Ingresos y Pagos',
    icono: 'CreditCard',
    tipo: 'ingresos_pagos',
  },
  {
    texto: 'Reporte de clientes morosos y cartera vencida',
    intencion: 'Morosidad y Cortes',
    icono: 'AlertTriangle',
    tipo: 'morosidad_cortes',
  },
  {
    texto: 'Listar clientes activos de la Zona Este',
    intencion: 'Clientes por Zona',
    icono: 'Users',
    tipo: 'clientes_zona',
  },
  {
    texto: 'Consultar equipos asignados en comodato',
    intencion: 'Equipos e Instalaciones',
    icono: 'HardDrive',
    tipo: 'equipos_instalaciones',
  },
  {
    texto: 'Ver pagos de hoy cobrados por código QR',
    intencion: 'Ingresos QR de Hoy',
    icono: 'CreditCard',
    tipo: 'ingresos_pagos',
  },
];

export const comandoVozModel = {
  /**
   * Envía el texto dictado/transcrito para su procesamiento en el backend (Paso 8 y 9 de CU29)
   */
  async transcribirComando(payload) {
    if (isDemoMode()) {
      return {
        idComando: Date.now(),
        textoDictado: payload.texto_dictado,
        intencion: 'REPORTE_INGRESOS',
        reporteSugerido: 'ingresos_pagos',
        parametros: { rango_etiqueta: 'Último mes' },
        resumen: "Acción: Consultar reporte 'Ingresos y Recaudación' | Período: Último mes",
        confianza: 0.98,
        estado: 'TRANSCRITO',
        fechaHora: new Date().toISOString(),
      };
    }
    const res = await apiClient.post('/cu29/transcribir', payload);
    return res?.data ?? null;
  },

  /**
   * Obtiene el historial de comandos dictados (Paso 9 de CU29)
   */
  async fetchHistorial() {
    if (isDemoMode()) return mockHistorialComandos;
    const res = await apiClient.get('/cu29/historial');
    return res?.data ?? [];
  },

  /**
   * Confirma la ejecución o corrección del comando de voz (Paso 8 de CU29)
   */
  async confirmarComando(payload) {
    if (isDemoMode()) {
      return {
        textoConfirmado: payload.texto_ajustado,
        interpretacion: {
          intencion: 'REPORTE_INGRESOS',
          reporteSugerido: 'ingresos_pagos',
          parametros: {},
        },
        mensaje: 'Comando confirmado en modo demostración.',
      };
    }
    const res = await apiClient.post('/cu29/confirmar', payload);
    return res?.data ?? null;
  },

  /**
   * Obtiene la lista de comandos en lenguaje natural sugeridos
   */
  async fetchEjemplos() {
    if (isDemoMode()) return mockEjemplosVoz;
    const res = await apiClient.get('/cu29/ejemplos');
    return res?.data ?? mockEjemplosVoz;
  },
};
