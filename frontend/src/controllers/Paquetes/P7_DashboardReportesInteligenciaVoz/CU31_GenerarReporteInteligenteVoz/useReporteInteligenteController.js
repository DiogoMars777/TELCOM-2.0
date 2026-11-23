import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { reporteInteligenteService } from '../../../../models/Paquetes/P7_DashboardReportesInteligenciaVoz/CU31_GenerarReporteInteligenteVoz/reporteInteligenteModel.js';
import { describeApiError } from '../../../../services/apiClient.js';

// Solo estos códigos públicos del backend reciben mensajes específicos, nunca texto remoto.
const ERRORES = {
  GEMINI_NO_CONFIGURADO: 'La interpretación de texto no está configurada. Solicita configurar GEMINI_API_KEY en el backend.',
  GEMINI_MODELO_NO_CONFIGURADO: 'Falta configurar un GEMINI_MODEL compatible en el backend.',
  GEMINI_TIMEOUT: 'No se pudo conectar con Gemini o se agotó el tiempo de espera. Vuelve a intentarlo.',
  GEMINI_HTTP: 'Gemini no pudo interpretar la solicitud. Revisa la configuración o inténtalo más tarde.',
  GEMINI_RESPUESTA_INVALIDA: 'La interpretación recibida no es válida. Reformula el comando y vuelve a intentarlo.',
  REPORTE_DATOS_NO_DISPONIBLES: 'No se pudieron consultar los datos del reporte. Inténtalo más tarde.',
};

/** Estado del controlador, comprobable sin DOM ni dependencias de pruebas adicionales. */
export function crearControladorReporte({ puedeGenerar, service = reporteInteligenteService }) {
  let estado = { comando: '', loading: false, error: null, datos: null };
  let version = 0;
  const listeners = new Set();
  const actualizar = (cambios) => {
    estado = { ...estado, ...cambios };
    listeners.forEach((listener) => listener());
  };
  const controlador = {
    getSnapshot: () => estado,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setComando(comando) {
      if (!estado.loading && typeof comando === 'string') {
        actualizar({ comando, error: null, datos: null });
      }
    },
    // Punto de entrada futuro de CU30: generar({ tipo, filtros }). Omite la interpretación.
    async generar(intencion = null) {
      if (estado.loading) return;
      if (!puedeGenerar) {
        actualizar({ error: 'No tienes autorización para generar reportes.', datos: null });
        return;
      }
      const comando = estado.comando.trim();
      if (!intencion && (comando.length < 3 || comando.length > 1000)) {
        actualizar({ error: 'Introduce una solicitud de entre 3 y 1000 caracteres.', datos: null });
        return;
      }
      const actual = ++version;
      actualizar({ loading: true, error: null, datos: null });
      try {
        const datos = await service.generarReporte(intencion ? { intencion } : { comando });
        if (actual === version) actualizar({ datos });
      } catch (error) {
        if (actual === version) actualizar({ error: ERRORES[error.errors?.codigo] || describeApiError(error), datos: null });
      } finally {
        if (actual === version) actualizar({ loading: false });
      }
    },
    invalidar() {
      ++version;
      actualizar({ loading: false, datos: null });
    },
  };
  return controlador;
}

/** CU29 podrá actualizar transcripcion; el usuario conserva el control de generar. */
export function useReporteInteligenteController(puedeGenerar, transcripcion = '') {
  const controlador = useMemo(() => crearControladorReporte({ puedeGenerar }), [puedeGenerar]);
  const estado = useSyncExternalStore(controlador.subscribe, controlador.getSnapshot, controlador.getSnapshot);
  useEffect(() => {
    controlador.setComando(transcripcion);
  }, [controlador, transcripcion]);
  useEffect(() => () => controlador.invalidar(), [controlador]);

  return { ...estado, setComando: controlador.setComando, generar: controlador.generar };
}
