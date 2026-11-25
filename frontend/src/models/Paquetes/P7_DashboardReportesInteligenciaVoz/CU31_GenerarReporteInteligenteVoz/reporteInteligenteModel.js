import { apiClient } from '../../../../services/apiClient.js';

/** CU31: solo Laravel interpreta y consulta; no hay credenciales ni resultados locales. */
export const reporteInteligenteService = {
  async generarReporte({ comando, intencion } = {}) {
    const payload = intencion != null
      ? { intencion }
      : { comando: typeof comando === 'string' ? comando.trim() : '' };
    const respuesta = await apiClient.post('/cu31/reportes/generar', payload);
    const datos = respuesta?.data;
    if (!datos?.interpretacion || !datos?.reporte
      || !Array.isArray(datos.reporte.columnas) || !Array.isArray(datos.reporte.filas)
      || !Array.isArray(datos.reporte.totales)) {
      throw new Error('El servidor devolvió un reporte inválido. Vuelve a intentarlo.');
    }
    return datos;
  },
};

export const EJEMPLOS_REPORTES = [
  'Muéstrame los clientes de Villa Primero de Mayo y sus planes.',
  'Muéstrame los clientes activos por zona.',
  'Muéstrame los ingresos de este mes.',
  'Muéstrame las mensualidades pendientes y clientes en mora.',
  'Cuántos servicios activos y planes tenemos.',
  'Cuánto inventario disponible tenemos.',
  'Muéstrame las instalaciones realizadas este mes.',
];
