import { useCallback, useEffect, useState } from 'react';
import { historialPagosService } from '../../../../models/Paquetes/FacturacionCobranza/CU11_ConsultarHistorialPagos/historialPagoModel.js';
import { describeApiError } from '../../../../services/apiClient.js';

const FILTROS_INICIALES = {
  buscar: '', plan_id: '', periodo: '', metodo_pago: '', fecha_desde: '', fecha_hasta: '', por_pagina: 20,
};

export function useHistorialPagosController() {
  const [pagos, setPagos] = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [filtrosAplicados, setFiltrosAplicados] = useState(FILTROS_INICIALES);
  const [opciones, setOpciones] = useState({ planes: [], metodos: [] });
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async (pagina = 1, actuales = filtrosAplicados) => {
    setLoading(true);
    setError('');
    try {
      const resultado = await historialPagosService.fetchHistorial({ ...actuales, page: pagina });
      setPagos(resultado.pagos);
      setMeta(resultado.meta);
    } catch (err) {
      setPagos([]);
      setError(describeApiError(err));
    } finally {
      setLoading(false);
    }
  }, [filtrosAplicados]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => {
    historialPagosService.fetchFiltros().then(setOpciones).catch(() => {});
  }, []);

  const actualizarFiltro = (campo, valor) => setFiltros((prev) => ({ ...prev, [campo]: valor }));
  const aplicarFiltros = (event) => {
    event?.preventDefault();
    setFiltrosAplicados({ ...filtros });
  };
  const limpiarFiltros = () => {
    setFiltros(FILTROS_INICIALES);
    setFiltrosAplicados(FILTROS_INICIALES);
  };
  const abrirDetalle = async (id) => {
    setLoadingDetalle(true);
    setError('');
    try { setDetalle(await historialPagosService.fetchDetalle(id)); }
    catch (err) { setError(describeApiError(err)); }
    finally { setLoadingDetalle(false); }
  };

  return {
    pagos, filtros, opciones, meta, detalle, loading, loadingDetalle, error,
    actualizarFiltro, aplicarFiltros, limpiarFiltros, cambiarPagina: cargar,
    abrirDetalle, cerrarDetalle: () => setDetalle(null), recargar: () => cargar(meta.current_page),
  };
}
