import { apiClient } from '../../../../services/apiClient.js';
import { isDemoMode } from '../../../../config/appConfig.js';

export const mockIntencionResult = {
  texto_original: 'Buscar clientes activos en Zona Norte',
  intencion_canonica: 'CONSULTAR_CLIENTES',
  categoria: 'Clientes y Abonados',
  confianza: 0.96,
  motor: 'LOCAL_NLP',
  entidades: {
    estado: 'ACTIVO',
    zona: 'Zona Norte',
  },
  accion_sugerida: {
    tipo: 'navigate_to',
    destino: 'CU06',
    modulo: 'Consultar y Buscar Clientes',
    parametros: { estado: 'ACTIVO', zona: 'Zona Norte' },
    requiere_focus: true,
  },
  respuesta_asistente: 'Entendido. Mostrando el padrón de clientes con estado ACTIVO en Zona Norte.',
  datos_en_vivo: {
    tipo_dato: 'conteo_clientes',
    total: 8,
    estado: 'ACTIVO',
    zona: 'Zona Norte',
    mensaje: 'Se registran 8 abonados con el criterio solicitado.',
  },
  tiempo_procesamiento: 15,
  es_accionable: true,
  id_intencion: 1,
  fecha_hora: new Date().toISOString(),
};

export const intencionVozService = {
  /**
   * Procesar texto o dictado con IA (CU30)
   */
  async procesarIntencion({ texto, duracion = 0, confianza = null }) {
    if (isDemoMode()) {
      return {
        ...mockIntencionResult,
        texto_original: texto,
        id_intencion: Date.now(),
      };
    }

    const res = await apiClient.post('/cu30/procesar', {
      texto_dictado: texto,
      duracion_segundos: duracion,
      confianza_audio: confianza,
    });

    return res?.data ?? res;
  },

  /**
   * Obtener historial de intenciones procesadas
   */
  async fetchHistorial(params = {}) {
    if (isDemoMode()) {
      return [mockIntencionResult];
    }

    const res = await apiClient.get('/cu30/historial', params);
    const data = res?.data;
    return Array.isArray(data) ? data : (data?.data ?? []);
  },

  /**
   * Catálogo de intenciones soportadas por la IA
   */
  async fetchCatalogo() {
    if (isDemoMode()) {
      return {
        intenciones: [
          { codigo: 'CONSULTAR_CLIENTES', label: 'Buscar Clientes', destino: 'CU06', categoria: 'Clientes' },
          { codigo: 'SERVICIOS_CORTE', label: 'Servicios para Corte', destino: 'CU13', categoria: 'Cortes' },
        ],
        motor_activo: 'DEMO_NLP',
      };
    }

    const res = await apiClient.get('/cu30/catalogo');
    return res?.data ?? res;
  },

  /**
   * Enviar retroalimentación / feedback de precisión
   */
  async enviarFeedback({ idIntencion, esCorrecto, esperada = null, comentario = null }) {
    if (isDemoMode()) {
      return { id_intencion: idIntencion, estado: esCorrecto ? 'CONFIRMADO' : 'CORREGIDO' };
    }

    const res = await apiClient.post('/cu30/feedback', {
      id_intencion: idIntencion,
      es_correcto: esCorrecto,
      intencion_esperada: esperada,
      comentario,
    });

    return res?.data ?? res;
  },

  /**
   * Ejecutar la acción mapeada por la intención
   */
  async ejecutarAccion(idIntencion) {
    if (isDemoMode()) {
      return { id_intencion: idIntencion, estado: 'EJECUTADO' };
    }

    const res = await apiClient.post('/cu30/ejecutar', {
      id_intencion: idIntencion,
    });

    return res?.data ?? res;
  },
};
