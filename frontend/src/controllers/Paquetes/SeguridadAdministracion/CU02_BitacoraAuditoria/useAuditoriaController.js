import { useState, useEffect } from 'react';
import { auditoriaService } from '../../../../models/Paquetes/SeguridadAdministracion/CU02_BitacoraAuditoria/auditoriaModel';
import { describeApiError } from '../../../../services/apiClient';

export function useAuditoriaController() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioFiltro, setUsuarioFiltro] = useState('');
  const [accionFiltro, setAccionFiltro] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await auditoriaService.fetchLogs({
        user_id: usuarioFiltro,
        accion: accionFiltro,
      });
      setLogs(data);
    } catch (err) {
      setLogs([]);
      setError(describeApiError(err));
    } finally {
      setLoading(false);
    }
  };

  // Lista de usuarios reales de la bitácora (para el primer filtro).
  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const data = await auditoriaService.fetchUsuarios();
        if (activo) setUsuarios(data);
      } catch {
        // Si el listado falla, el filtro queda solo con "Todos los usuarios".
        if (activo) setUsuarios([]);
      }
    })();
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    loadLogs();
  }, [usuarioFiltro, accionFiltro]);

  return {
    logs,
    loading,
    error,
    usuarios,
    usuarioFiltro,
    setUsuarioFiltro,
    accionFiltro,
    setAccionFiltro,
    reload: loadLogs,
  };
}
