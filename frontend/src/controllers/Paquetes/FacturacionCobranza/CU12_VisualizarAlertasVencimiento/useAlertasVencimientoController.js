import { useState, useEffect, useCallback } from 'react';
import { alertasService } from '../../../../models/Paquetes/FacturacionCobranza/CU12_VisualizarAlertasVencimiento/alertaVencimientoModel';
import { describeApiError } from '../../../../services/apiClient';

export function useAlertasVencimientoController() {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [severidadFiltro, setSeveridadFiltro] = useState('');

  const loadAlertas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await alertasService.fetchAlertas();
      const filtered = data.filter(a => !severidadFiltro || a.severidad === severidadFiltro);
      setAlertas(filtered);
    } catch (e) {
      setAlertas([]);
      setError(describeApiError(e));
    } finally {
      setLoading(false);
    }
  }, [severidadFiltro]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await alertasService.fetchAlertas();
        if (!ignore) {
          const filtered = data.filter(a => !severidadFiltro || a.severidad === severidadFiltro);
          setAlertas(filtered);
        }
      } catch (e) {
        if (!ignore) {
          setAlertas([]);
          setError(describeApiError(e));
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [severidadFiltro]);

  return {
    alertas,
    loading,
    error,
    severidadFiltro,
    setSeveridadFiltro,
    reload: loadAlertas,
  };
}
