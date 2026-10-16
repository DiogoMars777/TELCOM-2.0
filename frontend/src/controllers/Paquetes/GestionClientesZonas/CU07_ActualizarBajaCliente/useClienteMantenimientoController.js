import { useState, useEffect, useCallback } from 'react';
import { clienteMantenimientoService } from '../../../../models/Paquetes/GestionClientesZonas/CU07_ActualizarBajaCliente/clienteMantenimientoModel';
import { clienteConsultaService } from '../../../../models/Paquetes/GestionClientesZonas/CU06_ConsultarBuscarClientes/clienteConsultaModel';
import { describeApiError } from '../../../../services/apiClient';

export function useClienteMantenimientoController() {
  const [clientes, setClientes] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [bajaMotivo, setBajaMotivo] = useState('');
  const [showBajaModal, setShowBajaModal] = useState(false);

  const loadClientes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await clienteConsultaService.fetchClientes({});
      setClientes(data);
      setSelectedCliente((prev) => {
        const stillExists = prev && data.find((c) => c.id === prev.id);
        return stillExists || data[0] || null;
      });
    } catch (e) {
      setClientes([]);
      setError(describeApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await clienteConsultaService.fetchClientes({});
        if (!ignore) {
          setClientes(data);
          setSelectedCliente((prev) => {
            const stillExists = prev && data.find((c) => c.id === prev.id);
            return stillExists || data[0] || null;
          });
        }
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
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedCliente) return;
    setLoading(true);
    setMessage(null);
    try {
      await clienteMantenimientoService.updateCliente(selectedCliente.id, selectedCliente);
      setMessage({ type: 'success', text: 'Datos del cliente actualizados exitosamente.' });
    } catch (err) {
      setMessage({ type: 'danger', text: describeApiError(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleBajaLogica = async () => {
    if (!selectedCliente) return;
    if (!bajaMotivo) {
      setMessage({ type: 'danger', text: 'Debe ingresar un motivo de baja.' });
      return;
    }
    setLoading(true);
    try {
      await clienteMantenimientoService.bajaLogica(selectedCliente.id, bajaMotivo);
      setSelectedCliente(prev => ({ ...prev, estado: 'INACTIVO' }));
      setShowBajaModal(false);
      setMessage({ type: 'warning', text: 'Cliente dado de baja lógica correctamente.' });
    } catch (err) {
      setMessage({ type: 'danger', text: describeApiError(err) });
    } finally {
      setLoading(false);
    }
  };

  return {
    clientes,
    selectedCliente,
    setSelectedCliente,
    loading,
    error,
    message,
    bajaMotivo,
    setBajaMotivo,
    showBajaModal,
    setShowBajaModal,
    handleUpdate,
    handleBajaLogica,
    reload: loadClientes,
  };
}
