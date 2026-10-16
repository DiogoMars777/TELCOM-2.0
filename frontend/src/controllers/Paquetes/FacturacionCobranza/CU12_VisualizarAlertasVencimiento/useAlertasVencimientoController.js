import { useState, useEffect } from 'react';
import { alertasService } from '../../../../models/Paquetes/FacturacionCobranza/CU12_VisualizarAlertasVencimiento/alertaVencimientoModel';
import { describeApiError } from '../../../../services/apiClient';

export function useAlertasVencimientoController() {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [severidadFiltro, setSeveridadFiltro] = useState('');

  const loadAlertas = async () => {
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
  };

  useEffect(() => {
    loadAlertas();
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
