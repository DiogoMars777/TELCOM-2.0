import { useState, useEffect, useCallback, useRef } from 'react';
import { intencionVozService } from '../../../../models/Paquetes/P7_DashboardReportesInteligenciaVoz/CU30_ProcesarIntencionVozIA/intencionVozModel.js';
import { describeApiError } from '../../../../services/apiClient.js';

export function useIntencionVozController({ onNavigate } = {}) {
  const [texto, setTexto] = useState('');
  const [escuchando, setEscuchando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [filtroCategoria, setFiltroCategoria] = useState('TODAS');
  const [feedbackEnviado, setFeedbackEnviado] = useState(null);
  const [vozSoportada, setVozSoportada] = useState(false);

  const recognitionRef = useRef(null);
  const duracionInicioRef = useRef(null);

  // Inicializar compatibilidad con Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVozSoportada(true);
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-BO';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setEscuchando(true);
        setError(null);
        duracionInicioRef.current = Date.now();
      };

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setTexto(transcript);
      };

      recognition.onerror = (event) => {
        setEscuchando(false);
        if (event.error !== 'no-speech') {
          setError(`Error del micrófono: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setEscuchando(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Cargar catálogo de intenciones e historial inicial
  const cargarDatosIniciales = useCallback(async () => {
    try {
      const [catData, histData] = await Promise.all([
        intencionVozService.fetchCatalogo(),
        intencionVozService.fetchHistorial({ per_page: 10 }),
      ]);
      setCatalogo(catData?.intenciones || []);
      setHistorial(histData || []);
    } catch (e) {
      // Tolera error silencioso en la carga secundaria
    }
  }, []);

  useEffect(() => {
    cargarDatosIniciales();
  }, [cargarDatosIniciales]);

  // Iniciar escucha por micrófono
  const startListening = () => {
    if (!recognitionRef.current) {
      setError('Tu navegador no soporta reconocimiento de voz nativo. Puedes escribir tu consulta en el campo de texto.');
      return;
    }
    setError(null);
    try {
      recognitionRef.current.start();
    } catch (e) {
      // Si ya estaba activo, reiniciar
      recognitionRef.current.stop();
      setTimeout(() => recognitionRef.current.start(), 200);
    }
  };

  // Detener escucha
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setEscuchando(false);
  };

  // Procesar intención
  const handleProcesar = async (textoAProcesar = null) => {
    const query = (textoAProcesar !== null ? textoAProcesar : texto).trim();
    if (!query || query.length < 2) {
      setError('Por favor ingresa o dicta una orden con al menos 2 caracteres.');
      return;
    }

    setProcesando(true);
    setError(null);
    setFeedbackEnviado(null);

    const duracionSeg = duracionInicioRef.current
      ? (Date.now() - duracionInicioRef.current) / 1000
      : 0;
    duracionInicioRef.current = null;

    try {
      const res = await intencionVozService.procesarIntencion({
        texto: query,
        duracion: duracionSeg,
      });

      setResultado(res);
      setTexto('');

      // Refrescar historial
      const nuevoHistorial = await intencionVozService.fetchHistorial({ per_page: 10 });
      setHistorial(nuevoHistorial || []);
    } catch (e) {
      setError(describeApiError(e));
    } finally {
      setProcesando(false);
    }
  };

  // Ejecutar acción sugerida (navegar a la pantalla correspondiente)
  const handleEjecutarAccion = async () => {
    if (!resultado || !resultado.accion_sugerida) return;
    const destino = resultado.accion_sugerida.destino;

    if (resultado.id_intencion) {
      try {
        await intencionVozService.ejecutarAccion(resultado.id_intencion);
      } catch (e) {
        // Ignorar fallo de estado para no bloquear la navegación
      }
    }

    if (typeof onNavigate === 'function' && destino) {
      onNavigate(destino);
    }
  };

  // Enviar retroalimentación
  const handleFeedback = async (esCorrecto, comentario = null) => {
    if (!resultado?.id_intencion) return;
    try {
      await intencionVozService.enviarFeedback({
        idIntencion: resultado.id_intencion,
        esCorrecto,
        comentario,
      });
      setFeedbackEnviado(esCorrecto ? 'positivo' : 'negativo');
    } catch (e) {
      // Ignorar fallo en feedback secundario
    }
  };

  // Seleccionar ejemplo del catálogo
  const handleSeleccionarEjemplo = (ejemploTexto) => {
    setTexto(ejemploTexto);
    handleProcesar(ejemploTexto);
  };

  return {
    texto,
    setTexto,
    escuchando,
    procesando,
    error,
    resultado,
    setResultado,
    historial,
    catalogo,
    filtroCategoria,
    setFiltroCategoria,
    feedbackEnviado,
    vozSoportada,
    startListening,
    stopListening,
    handleProcesar,
    handleEjecutarAccion,
    handleFeedback,
    handleSeleccionarEjemplo,
  };
}
