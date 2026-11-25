import { useState, useEffect, useCallback, useRef } from 'react';
import { reporteTradicionalModel } from '../../../../models/Paquetes/P7_DashboardReportesInteligenciaVoz/CU27_GenerarExportarReportesTradicionales/reporteTradicionalModel.js';

const DICCIONARIO_FALLBACK = {
  clientes_zona: {
    codigoCliente: 'Código Cliente',
    ci: 'C.I.',
    nombreCompleto: 'Nombre Completo',
    telefonoPrincipal: 'Teléfono',
    correo: 'Correo',
    nombreZona: 'Zona',
    barrioZona: 'Barrio',
    estadoCliente: 'Estado',
    totalServicios: 'Servicios Activos',
  },
  ingresos_pagos: {
    numeroComprobante: 'N° Comprobante',
    fechaHora: 'Fecha y Hora',
    clienteNombre: 'Cliente',
    codigoCliente: 'Código Abonado',
    periodo: 'Período',
    nombreMetodo: 'Método Pago',
    montoTotal: 'Monto (Bs.)',
    nombreCajero: 'Cajero',
  },
  morosidad_cortes: {
    codigoFactura: 'Factura N°',
    clienteNombre: 'Abonado',
    clienteCi: 'C.I.',
    codigoServicio: 'Código Servicio',
    nombreZona: 'Zona',
    nombrePlan: 'Plan',
    periodo: 'Período',
    fechaVencimiento: 'Vencimiento',
    monto: 'Monto Mora (Bs.)',
    estadoServicio: 'Estado Servicio',
  },
  equipos_instalaciones: {
    codigo: 'Identificador / Serie',
    cliente: 'Abonado',
    servicio: 'Código Servicio',
    detalle: 'Detalle / Modelo',
    tipo: 'Tipo',
    fecha: 'Fecha',
    responsable: 'Técnico / Responsable',
    estado: 'Estado',
    costo: 'Costo (Bs.)',
  },
};

export function useReporteTradicionalController(initialTipo = 'clientes_zona', initialFilters = {}) {
  const [catalogo, setCatalogo] = useState([]);
  const [tipoReporte, setTipoReporte] = useState(initialTipo);
  const [parametros, setParametros] = useState({ zonas: [], metodos: [], estadosCliente: [] });
  const [diccionarioColumnas, setDiccionarioColumnas] = useState(DICCIONARIO_FALLBACK);

  // Columnas activas para visualización y exportación
  const [columnasSeleccionadas, setColumnasSeleccionadas] = useState([]);

  // Análisis con IA (Gemini)
  const [analisisIa, setAnalisisIa] = useState(null);
  const [cargandoIa, setCargandoIa] = useState(false);
  const [reproduciendoAudio, setReproduciendoAudio] = useState(false);

  // Filtros del reporte
  const [filtros, setFiltros] = useState({
    fecha_desde: '',
    fecha_hasta: '',
    zona_id: '',
    estado_cliente: '',
    metodo_pago: '',
    tipo_subreporte: 'comodatos',
    buscar: '',
    ...initialFilters,
  });

  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);
  const [vistaImpresion, setVistaImpresion] = useState(false);
  const [vistaActiva, setVistaActiva] = useState('combinada'); // 'tabla', 'graficos', 'combinada'

  const synthRef = useRef(null);

  // Inicialización de catálogo, parámetros y columnas
  useEffect(() => {
    let isMounted = true;
    async function inicializar() {
      try {
        const [cat, params, cols] = await Promise.all([
          reporteTradicionalModel.fetchCatalogo(),
          reporteTradicionalModel.fetchParametros(),
          reporteTradicionalModel.fetchColumnas(),
        ]);
        if (isMounted) {
          setCatalogo(cat);
          setParametros(params);
          if (cols && Object.keys(cols).length > 0) {
            setDiccionarioColumnas(cols);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Error al cargar el catálogo de reportes.');
        }
      }
    }
    inicializar();
    return () => {
      isMounted = false;
    };
  }, []);

  // Al cambiar tipo de reporte, sincronizar columnas por defecto
  useEffect(() => {
    const mapaActual = diccionarioColumnas[tipoReporte] || DICCIONARIO_FALLBACK[tipoReporte] || {};
    setColumnasSeleccionadas(Object.keys(mapaActual));
    setAnalisisIa(null);
    detenerAudioNarrativa();
  }, [tipoReporte, diccionarioColumnas]);

  // Manejo de props iniciales externas
  useEffect(() => {
    if (initialTipo && initialTipo !== tipoReporte) {
      setTipoReporte(initialTipo);
    }
    if (initialFilters && Object.keys(initialFilters).length > 0) {
      setFiltros((prev) => ({ ...prev, ...initialFilters }));

      const payload = {
        tipo_reporte: initialTipo || tipoReporte,
        ...filtros,
        ...initialFilters,
      };
      setLoading(true);
      setError(null);
      reporteTradicionalModel.generarReporte(payload)
        .then((res) => {
          setResultado(res);
          if (res?.registros?.length > 0) {
            setMensajeExito(`Reporte generado exitosamente con ${res.registros.length} registros para ${res.titulo}.`);
          } else {
            setMensajeExito('No se encontraron registros para los filtros seleccionados.');
          }
        })
        .catch((err) => {
          setError(err?.message || 'Error al generar el reporte.');
        })
        .finally(() => setLoading(false));
    }
  }, [initialTipo, initialFilters]);

  const cambiarFiltro = (campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
    setError(null);
  };

  const seleccionarTipoReporte = (nuevoTipo) => {
    setTipoReporte(nuevoTipo);
    setResultado(null);
    setError(null);
    setMensajeExito(null);
    setAnalisisIa(null);
  };

  const limpiarFiltros = () => {
    setFiltros({
      fecha_desde: '',
      fecha_hasta: '',
      zona_id: '',
      estado_cliente: '',
      metodo_pago: '',
      tipo_subreporte: 'comodatos',
      buscar: '',
    });
    setError(null);
  };

  // Selector Dinámico de Columnas
  const toggleColumna = (colKey) => {
    setColumnasSeleccionadas((prev) => {
      if (prev.includes(colKey)) {
        if (prev.length === 1) return prev; // Mantener al menos 1 columna activa
        return prev.filter((k) => k !== colKey);
      }
      return [...prev, colKey];
    });
  };

  const seleccionarTodasColumnas = () => {
    const mapaActual = diccionarioColumnas[tipoReporte] || DICCIONARIO_FALLBACK[tipoReporte] || {};
    setColumnasSeleccionadas(Object.keys(mapaActual));
  };

  const seleccionarPresetColumnas = (preset) => {
    const mapaActual = diccionarioColumnas[tipoReporte] || DICCIONARIO_FALLBACK[tipoReporte] || {};
    const todas = Object.keys(mapaActual);

    if (preset === 'todas') {
      setColumnasSeleccionadas(todas);
      return;
    }

    if (preset === 'financieras') {
      const fin = todas.filter((k) =>
        k.toLowerCase().includes('monto') ||
        k.toLowerCase().includes('deuda') ||
        k.toLowerCase().includes('metodo') ||
        k.toLowerCase().includes('comprobante') ||
        k.toLowerCase().includes('costo') ||
        k.toLowerCase().includes('periodo')
      );
      setColumnasSeleccionadas(fin.length > 0 ? fin : todas);
      return;
    }

    if (preset === 'contacto') {
      const con = todas.filter((k) =>
        k.toLowerCase().includes('nombre') ||
        k.toLowerCase().includes('cliente') ||
        k.toLowerCase().includes('telefono') ||
        k.toLowerCase().includes('correo') ||
        k.toLowerCase().includes('ci')
      );
      setColumnasSeleccionadas(con.length > 0 ? con : todas);
      return;
    }

    if (preset === 'operativas') {
      const op = todas.filter((k) =>
        k.toLowerCase().includes('zona') ||
        k.toLowerCase().includes('servicio') ||
        k.toLowerCase().includes('estado') ||
        k.toLowerCase().includes('tipo') ||
        k.toLowerCase().includes('fecha')
      );
      setColumnasSeleccionadas(op.length > 0 ? op : todas);
    }
  };

  /**
   * Genera el reporte consolidado
   */
  const handleGenerarReporte = useCallback(async () => {
    if (filtros.fecha_desde && filtros.fecha_hasta && filtros.fecha_desde > filtros.fecha_hasta) {
      setError('Rango de fechas inválido: La fecha inicial no puede ser posterior a la fecha final.');
      return;
    }

    setLoading(true);
    setError(null);
    setMensajeExito(null);

    try {
      const payload = {
        tipo_reporte: tipoReporte,
        ...filtros,
      };

      const res = await reporteTradicionalModel.generarReporte(payload);
      setResultado(res);

      if (!res?.registros || res.registros.length === 0) {
        setMensajeExito('No se encontraron registros para los filtros seleccionados.');
      } else {
        setMensajeExito(`Reporte generado exitosamente con ${res.registros.length} registros.`);
      }
    } catch (err) {
      setError(err?.message || 'Error al procesar y generar el reporte.');
    } finally {
      setLoading(false);
    }
  }, [tipoReporte, filtros]);

  /**
   * Ejecutar análisis con Inteligencia Artificial (Gemini)
   */
  const ejecutarAnalisisIa = async () => {
    if (!resultado || !resultado.registros || resultado.registros.length === 0) {
      setError('Primero genera un reporte con datos para que la IA pueda analizarlo.');
      return;
    }

    setCargandoIa(true);
    setError(null);
    try {
      const data = await reporteTradicionalModel.fetchAnalisisIa({
        tipo_reporte: tipoReporte,
        ...filtros,
      });
      setAnalisisIa(data);
      setMensajeExito('Análisis ejecutivo generado exitosamente.');
    } catch (err) {
      setError(err?.message || 'No se pudo generar el análisis de IA.');
    } finally {
      setCargandoIa(false);
    }
  };

  /**
   * Síntesis de voz (Text-to-Speech)
   */
  const reproducirAudioNarrativa = (texto) => {
    if (!('speechSynthesis' in window)) {
      setError('Tu navegador no soporta síntesis de voz nativa.');
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'es-BO';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setReproduciendoAudio(true);
    utterance.onend = () => setReproduciendoAudio(false);
    utterance.onerror = () => setReproduciendoAudio(false);

    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const detenerAudioNarrativa = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setReproduciendoAudio(false);
  };

  /**
   * Procesador de comandos por voz o escritura para control dinámico de columnas y exportación
   */
  const procesarComandoVozEscritura = async (comandoRaw) => {
    const cmd = (comandoRaw || '').toLowerCase().trim();
    if (!cmd) return;

    setError(null);
    const mapaActual = diccionarioColumnas[tipoReporte] || DICCIONARIO_FALLBACK[tipoReporte] || {};
    const todasLasKeys = Object.keys(mapaActual);

    // 1. Detección de selección de columnas
    // Ej: "solo clientes y monto", "ocultar correo", "mostrar solo telefono"
    const palabras = cmd.split(/[\s,]+/);

    // Mapeo de términos habituales a claves
    const aliasMapa = {
      cliente: ['nombreCompleto', 'clienteNombre', 'cliente'],
      nombre: ['nombreCompleto', 'clienteNombre', 'cliente'],
      telefono: ['telefonoPrincipal'],
      correo: ['correo'],
      email: ['correo'],
      zona: ['nombreZona', 'zona'],
      barrio: ['barrioZona'],
      estado: ['estadoCliente', 'estadoServicio', 'estadoEquipo', 'estadoInstalacion', 'estado'],
      servicio: ['totalServicios', 'codigoServicio', 'servicio'],
      deuda: ['monto', 'deudaTotal'],
      mora: ['monto', 'deudaTotal'],
      monto: ['montoTotal', 'monto', 'costo'],
      importe: ['montoTotal', 'monto'],
      comprobante: ['numeroComprobante'],
      factura: ['codigoFactura', 'numeroComprobante'],
      metodo: ['nombreMetodo'],
      cajero: ['nombreCajero'],
      periodo: ['periodo'],
      fecha: ['fechaHora', 'fechaVencimiento', 'fecha', 'fechaRegistro'],
      vencimiento: ['fechaVencimiento'],
      ci: ['ci', 'clienteCi'],
      cedula: ['ci', 'clienteCi'],
      equipo: ['detalle', 'tipoEquipo', 'numeroSerie'],
      serie: ['numeroSerie', 'codigo'],
    };

    // Comprobar si pide ocultar/quitar alguna columna
    if (cmd.includes('ocultar') || cmd.includes('quitar') || cmd.includes('sin ')) {
      const aOcultar = [];
      Object.entries(aliasMapa).forEach(([alias, keys]) => {
        if (cmd.includes(alias)) {
          keys.forEach((k) => {
            if (todasLasKeys.includes(k)) aOcultar.push(k);
          });
        }
      });
      if (aOcultar.length > 0) {
        setColumnasSeleccionadas((prev) => {
          const nuevas = prev.filter((k) => !aOcultar.includes(k));
          return nuevas.length > 0 ? nuevas : prev;
        });
        setMensajeExito(`Comando aplicado: Ocultando columnas seleccionadas.`);
      }
    } else if (cmd.includes('solo') || cmd.includes('mostrar') || cmd.includes('columnas')) {
      const aIncluir = [];
      Object.entries(aliasMapa).forEach(([alias, keys]) => {
        if (cmd.includes(alias)) {
          keys.forEach((k) => {
            if (todasLasKeys.includes(k) && !aIncluir.includes(k)) aIncluir.push(k);
          });
        }
      });
      if (aIncluir.length > 0) {
        setColumnasSeleccionadas(aIncluir);
        setMensajeExito(`Comando aplicado: Mostrando ${aIncluir.length} columnas especificadas.`);
      }
    } else if (cmd.includes('todas las columnas') || cmd.includes('todas')) {
      seleccionarTodasColumnas();
      setMensajeExito('Comando aplicado: Mostrando todas las columnas.');
    }

    // 2. Detección de acción de exportación o reporte
    if (cmd.includes('exportar a excel') || cmd.includes('descargar excel') || cmd.includes('excel')) {
      if (resultado && resultado.registros && resultado.registros.length > 0) {
        await handleExportarExcel();
      } else {
        await handleGenerarReporte();
        await handleExportarExcel();
      }
    } else if (cmd.includes('exportar a pdf') || cmd.includes('descargar pdf') || cmd.includes('imprimir') || cmd.includes('pdf')) {
      if (resultado && resultado.registros && resultado.registros.length > 0) {
        handleExportarPdf();
      } else {
        await handleGenerarReporte();
        handleExportarPdf();
      }
    } else if (cmd.includes('analizar') || cmd.includes('ia') || cmd.includes('inteligencia') || cmd.includes('resumen')) {
      await ejecutarAnalisisIa();
    } else if (cmd.includes('generar') || cmd.includes('reporte') || cmd.includes('consultar')) {
      await handleGenerarReporte();
    }
  };

  /**
   * Exporta a archivo Excel (.csv con BOM UTF-8)
   */
  const handleExportarExcel = async () => {
    if (!resultado || !resultado.registros || resultado.registros.length === 0) {
      setError('Primero debe generar un reporte con registros para poder exportarlo.');
      return;
    }

    setExporting(true);
    setError(null);
    try {
      await reporteTradicionalModel.descargarExcel(
        {
          tipo_reporte: tipoReporte,
          ...filtros,
        },
        columnasSeleccionadas
      );
      setMensajeExito(`Archivo Excel generado con ${columnasSeleccionadas.length} columnas y descargado.`);
    } catch (err) {
      setError(err?.message || 'Error al generar o descargar el archivo Excel. Por favor reintente.');
    } finally {
      setExporting(false);
    }
  };

  /**
   * Activa vista para imprimir o guardar como PDF oficial
   */
  const handleExportarPdf = () => {
    if (!resultado || !resultado.registros || resultado.registros.length === 0) {
      setError('Primero debe generar un reporte con registros para poder exportarlo a PDF.');
      return;
    }
    setVistaImpresion(true);
  };

  const cerrarVistaImpresion = () => {
    setVistaImpresion(false);
  };

  const dispararImpresionNativa = () => {
    window.print();
  };

  return {
    catalogo,
    tipoReporte,
    parametros,
    diccionarioColumnas,
    columnasSeleccionadas,
    analisisIa,
    cargandoIa,
    reproduciendoAudio,
    filtros,
    resultado,
    loading,
    exporting,
    error,
    mensajeExito,
    vistaImpresion,
    vistaActiva,
    setVistaActiva,
    seleccionarTipoReporte,
    cambiarFiltro,
    limpiarFiltros,
    toggleColumna,
    seleccionarTodasColumnas,
    seleccionarPresetColumnas,
    ejecutarAnalisisIa,
    reproducirAudioNarrativa,
    detenerAudioNarrativa,
    procesarComandoVozEscritura,
    handleGenerarReporte,
    handleExportarExcel,
    handleExportarPdf,
    cerrarVistaImpresion,
    dispararImpresionNativa,
  };
}
