import { useState, useEffect, useCallback } from 'react';
import { reporteTradicionalModel } from '../../../../models/Paquetes/DashboardReportesInteligenciaVoz/CU27_GenerarExportarReportesTradicionales/reporteTradicionalModel.js';

export function useReporteTradicionalController(initialTipo = 'clientes_zona', initialFilters = {}) {
  const [catalogo, setCatalogo] = useState([]);
  const [tipoReporte, setTipoReporte] = useState(initialTipo);
  const [parametros, setParametros] = useState({ zonas: [], metodos: [], estadosCliente: [] });

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

  // Inicialización de catálogo y parámetros
  useEffect(() => {
    let isMounted = true;
    async function inicializar() {
      try {
        const [cat, params] = await Promise.all([
          reporteTradicionalModel.fetchCatalogo(),
          reporteTradicionalModel.fetchParametros(),
        ]);
        if (isMounted) {
          setCatalogo(cat);
          setParametros(params);
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

  // Actualizar tipo si cambian props externas (ej: orden por voz de CU29)
  useEffect(() => {
    if (initialTipo && initialTipo !== tipoReporte) {
      setTipoReporte(initialTipo);
    }
    if (initialFilters && Object.keys(initialFilters).length > 0) {
      setFiltros((prev) => ({ ...prev, ...initialFilters }));

      // Si viene con filtros iniciales desde voz (ej: Zona Norte y fechas), generar automáticamente
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

  /**
   * Genera el reporte consolidado (Paso 6 y 7 de CU27)
   */
  const handleGenerarReporte = useCallback(async () => {
    // Validación de excepciones: Rango de fechas inválido (Excepción 2)
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
        // Excepción 1: No se encuentran registros para los filtros seleccionados
        setMensajeExito('No se encontraron registros para los filtros seleccionados.');
      } else {
        setMensajeExito(`Reporte generado exitosamente con ${res.registros.length} registros.`);
      }
    } catch (err) {
      // Excepción 2 y 3: Errores en parámetros o conexión
      setError(err?.message || 'Error al procesar y generar el reporte.');
    } finally {
      setLoading(false);
    }
  }, [tipoReporte, filtros]);

  /**
   * Exporta a archivo Excel (.csv con BOM UTF-8) (Paso 8 y 9 de CU27)
   */
  const handleExportarExcel = async () => {
    if (!resultado || !resultado.registros || resultado.registros.length === 0) {
      setError('Primero debe generar un reporte con registros para poder exportarlo.');
      return;
    }

    setExporting(true);
    setError(null);
    try {
      await reporteTradicionalModel.descargarExcel({
        tipo_reporte: tipoReporte,
        ...filtros,
      });
      setMensajeExito('Archivo Excel generado y descargado al dispositivo.');
    } catch (err) {
      // Excepción 3: Error en la generación o descarga del archivo
      setError(err?.message || 'Error al generar o descargar el archivo Excel. Por favor reintente.');
    } finally {
      setExporting(false);
    }
  };

  /**
   * Activa vista para imprimir o guardar como PDF oficial (Paso 8 y 9 de CU27)
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
    filtros,
    resultado,
    loading,
    exporting,
    error,
    mensajeExito,
    vistaImpresion,
    seleccionarTipoReporte,
    cambiarFiltro,
    limpiarFiltros,
    handleGenerarReporte,
    handleExportarExcel,
    handleExportarPdf,
    cerrarVistaImpresion,
    dispararImpresionNativa,
  };
}
