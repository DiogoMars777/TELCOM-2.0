import { useState, useEffect, useRef, useCallback } from 'react';
import { comandoVozModel } from '../../../../models/Paquetes/P7_DashboardReportesInteligenciaVoz/CU29_CapturarTranscribirComandosVoz/comandoVozModel.js';

export function useComandoVozController(onEjecutarComando = null) {
  const [textoTranscrito, setTextoTranscrito] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [soportaVoz, setSoportaVoz] = useState(true);
  const [permisoDenegado, setPermisoDenegado] = useState(false);
  const [modoManual, setModoManual] = useState(false);

  const [interpretacion, setInterpretacion] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [ejemplos, setEjemplos] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(0);

  // Inicialización de soporte de micrófono, ejemplos e historial
  useEffect(() => {
    let isMounted = true;

    // Verificar soporte de Web Speech API en el navegador
    const SpeechRecognition = typeof window !== 'undefined'
      ? (window.SpeechRecognition || window.webkitSpeechRecognition)
      : null;

    if (!SpeechRecognition) {
      setSoportaVoz(false);
      setModoManual(true);
    }

    async function cargarInicial() {
      try {
        const [hist, ej] = await Promise.all([
          comandoVozModel.fetchHistorial(),
          comandoVozModel.fetchEjemplos(),
        ]);
        if (isMounted) {
          setHistorial(hist);
          setEjemplos(ej);
        }
      } catch {
        // Fallback no bloqueante
      }
    }
    cargarInicial();

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
    };
  }, []);

  /**
   * Inicia la captura de audio por micrófono y transcripción en tiempo real (Paso 2, 3, 4 y 5)
   */
  const iniciarDictado = useCallback(() => {
    const SpeechRecognition = typeof window !== 'undefined'
      ? (window.SpeechRecognition || window.webkitSpeechRecognition)
      : null;

    if (!SpeechRecognition) {
      setSoportaVoz(false);
      setModoManual(true);
      setError('Su navegador no soporta captura de voz directa. Puede ingresar sus comandos por teclado.');
      return;
    }

    try {
      // Detener sesión previa si existía
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'es-BO'; // Español de Bolivia (con fallback natural a español latinoamericano)
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
        setError(null);
        setMensajeExito(null);
        setRecordingSeconds(0);
        startTimeRef.current = Date.now();
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);
      };

      // Paso 6: Transcripción en tiempo real dentro del campo de entrada
      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setTextoTranscrito(transcript);
      };

      // Manejo de Excepciones del CU29
      recognition.onerror = (event) => {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsRecording(false);

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          // Excepción 1: Permiso de micrófono denegado
          setPermisoDenegado(true);
          setModoManual(true);
          setError('Permiso de micrófono denegado o no disponible. Se ha habilitado la entrada manual por teclado.');
        } else if (event.error === 'no-speech') {
          // Excepción 2: Audio inaudible o silencio prolongado
          setError('Audio inaudible o silencio prolongado. Por favor, acérquese al micrófono o presione "Reintentar dictado".');
        } else if (event.error === 'network') {
          // Excepción 3: Error de conexión con el servicio de transcripción
          setError('Falla de conexión con el motor de transcripción. Por favor reintente o use el teclado.');
        } else {
          setError(`Detalle de reconocimiento de voz: ${event.error || 'interrumpido'}. Puede escribir el comando manualmente.`);
        }
      };

      recognition.onend = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setError('No se pudo inicializar el micrófono. Se habilita el teclado para ingresar la consulta.');
      setModoManual(true);
    }
  }, []);

  /**
   * Finaliza el dictado manualmente
   */
  const detenerDictado = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
  }, [isRecording]);

  /**
   * Permite ajustes manuales del texto transcrito (Paso 7 de CU29)
   */
  const handleTextoChange = (nuevoTexto) => {
    setTextoTranscrito(nuevoTexto);
    setError(null);
    setMensajeExito(null);
  };

  /**
   * Carga uno de los comandos sugeridos con 1 clic
   */
  const handleSeleccionarEjemplo = (ejemplo) => {
    setTextoTranscrito(ejemplo.texto);
    setError(null);
    setMensajeExito(null);
  };

  /**
   * Confirma el comando transcrito para su envío a interpretación y ejecución (Paso 8 y 9)
   */
  const handleConfirmarComando = async () => {
    const texto = textoTranscrito.trim();
    if (!texto) {
      setError('Por favor dicte o escriba un comando antes de confirmar.');
      return;
    }

    setLoading(true);
    setError(null);
    setMensajeExito(null);

    const duracion = startTimeRef.current > 0
      ? Number(((Date.now() - startTimeRef.current) / 1000).toFixed(1))
      : 0;

    try {
      const res = await comandoVozModel.transcribirComando({
        texto_dictado: texto,
        duracion_segundos: duracion,
        confianza: 0.98,
      });

      setInterpretacion(res);
      setMensajeExito('Comando de voz procesado y registrado en la bitácora de auditoría.');

      // Refrescar historial
      const hist = await comandoVozModel.fetchHistorial();
      setHistorial(hist);

      // Si existe un callback para saltar automáticamente a ejecutar el reporte en CU27
      if (onEjecutarComando && res?.reporteSugerido) {
        onEjecutarComando(res.reporteSugerido, res.parametros || {});
      }
    } catch (err) {
      setError(err?.message || 'Error al procesar el comando de voz. Verifique su conexión y reintente.');
    } finally {
      setLoading(false);
    }
  };

  const limpiar = () => {
    setTextoTranscrito('');
    setInterpretacion(null);
    setError(null);
    setMensajeExito(null);
  };

  return {
    textoTranscrito,
    isRecording,
    recordingSeconds,
    soportaVoz,
    permisoDenegado,
    modoManual,
    interpretacion,
    historial,
    ejemplos,
    loading,
    error,
    mensajeExito,
    setModoManual,
    iniciarDictado,
    detenerDictado,
    handleTextoChange,
    handleSeleccionarEjemplo,
    handleConfirmarComando,
    limpiar,
  };
}
