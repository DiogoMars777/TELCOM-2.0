import { useState, useEffect } from 'react';
import { mensualidadService } from '../../../../models/Paquetes/FacturacionCobranza/CU09_GenerarMensualidades/mensualidadModel';
import { describeApiError } from '../../../../services/apiClient';

export function useMensualidadGeneracionController() {
  const [mensualidades, setMensualidades] = useState([]);
  const [periodo, setPeriodo] = useState(() => {
    const fecha = new Date();
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);         // Error de carga del listado
  const [resultMsg, setResultMsg] = useState(null); // Resultado de la facturación

  const loadMensualidades = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mensualidadService.fetchMensualidades(periodo);
      setMensualidades(data);
    } catch (e) {
      setMensualidades([]);
      setError(describeApiError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMensualidades();
  }, [periodo]);

  const handleGenerar = async () => {
    setLoading(true);
    setResultMsg(null);
    try {
      const res = await mensualidadService.generarMensualidades(periodo);
      // Éxito únicamente cuando el backend confirmó la facturación.
      setResultMsg({
        type: 'success',
        text: res?.message || `Mensualidades para el período ${periodo} procesadas exitosamente.`,
      });
      loadMensualidades();
    } catch (err) {
      setResultMsg({ type: 'danger', text: describeApiError(err) });
    } finally {
      setLoading(false);
    }
  };

  return {
    mensualidades,
    periodo,
    setPeriodo,
    loading,
    error,
    resultMsg,
    handleGenerar,
    reload: loadMensualidades,
  };
}
