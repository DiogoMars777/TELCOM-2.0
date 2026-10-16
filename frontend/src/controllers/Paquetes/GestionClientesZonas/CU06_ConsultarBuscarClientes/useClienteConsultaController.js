import { useState, useEffect } from 'react';
import { clienteConsultaService } from '../../../../models/Paquetes/GestionClientesZonas/CU06_ConsultarBuscarClientes/clienteConsultaModel';
import { describeApiError } from '../../../../services/apiClient';

export function useClienteConsultaController() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');

  const loadClientes = async () => {
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
  };

  useEffect(() => {
    loadClientes();
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
