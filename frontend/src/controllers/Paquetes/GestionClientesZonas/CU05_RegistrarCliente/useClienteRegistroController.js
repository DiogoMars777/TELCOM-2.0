import { useState, useEffect, useCallback } from 'react';
import { clienteRegistroService, initialCliente } from '../../../../models/Paquetes/GestionClientesZonas/CU05_RegistrarCliente/clienteRegistroModel';
import { describeApiError } from '../../../../services/apiClient';

export function useClienteRegistroController(onSuccess) {
  const [cliente, setCliente] = useState(initialCliente);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const [zonas, setZonas] = useState([]);
  const [loadingZonas, setLoadingZonas] = useState(true);
  const [zonasError, setZonasError] = useState(null);

  const loadZonas = useCallback(async () => {
    setLoadingZonas(true);
    setZonasError(null);
    try {
      const data = await clienteRegistroService.fetchZonas();
      setZonas(data);
    } catch (e) {
      setZonas([]);
      setZonasError(describeApiError(e));
    } finally {
      setLoadingZonas(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await clienteRegistroService.fetchZonas();
        if (!ignore) setZonas(data);
      } catch (e) {
        if (!ignore) {
          setZonas([]);
          setZonasError(describeApiError(e));
        }
      } finally {
        if (!ignore) setLoadingZonas(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCliente(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await clienteRegistroService.registerCliente(cliente);
      // Éxito únicamente cuando el backend respondió confirmando la operación.
      const codigo = res?.data?.codigo_cliente;
      setSuccessMsg(
        codigo
          ? `Cliente registrado exitosamente (Código: ${codigo}).`
          : (res?.message || 'Cliente registrado exitosamente.')
      );
      setCliente(initialCliente);
      if (onSuccess) onSuccess();
    } catch (err) {
      setErrorMsg(describeApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return {
    cliente,
    loading,
    successMsg,
    errorMsg,
    zonas,
    loadingZonas,
    zonasError,
    reloadZonas: loadZonas,
    handleChange,
    handleSubmit,
  };
}
