import { useState, useEffect, useCallback } from 'react';
import { clienteConsultaService } from '../../../../models/Paquetes/GestionClientesZonas/CU06_ConsultarBuscarClientes/clienteConsultaModel';
import { describeApiError } from '../../../../services/apiClient';

export function useClienteConsultaController() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');

  const loadClientes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await clienteConsultaService.fetchClientes({
        buscar: busqueda,
        estado: estadoFiltro,
      });
      // Filtrado local de respaldo (útil en modo demostración).
      const term = busqueda.toLowerCase();
      const filtered = data.filter(c => {
        const matchesTerm = !busqueda ||
          String(c.nombres ?? '').toLowerCase().includes(term) ||
          String(c.apellidos ?? '').toLowerCase().includes(term) ||
          String(c.documento_identidad ?? '').includes(busqueda) ||
          String(c.codigo_cliente ?? '').toLowerCase().includes(term);
        const matchesEstado = !estadoFiltro || c.estado === estadoFiltro;
        return matchesTerm && matchesEstado;
      });
      setClientes(filtered);
    } catch (e) {
      setClientes([]);
      setError(describeApiError(e));
    } finally {
      setLoading(false);
    }
  }, [busqueda, estadoFiltro]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await clienteConsultaService.fetchClientes({
          buscar: busqueda,
          estado: estadoFiltro,
        });
        if (ignore) return;
        const term = busqueda.toLowerCase();
        const filtered = data.filter(c => {
          const matchesTerm = !busqueda ||
            String(c.nombres ?? '').toLowerCase().includes(term) ||
            String(c.apellidos ?? '').toLowerCase().includes(term) ||
            String(c.documento_identidad ?? '').includes(busqueda) ||
            String(c.codigo_cliente ?? '').toLowerCase().includes(term);
          const matchesEstado = !estadoFiltro || c.estado === estadoFiltro;
          return matchesTerm && matchesEstado;
        });
        setClientes(filtered);
      } catch (e) {
        if (!ignore) {
          setClientes([]);
          setError(describeApiError(e));
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [busqueda, estadoFiltro]);

  return {
    clientes,
    loading,
    error,
    busqueda,
    setBusqueda,
    estadoFiltro,
    setEstadoFiltro,
    reload: loadClientes,
  };
}
