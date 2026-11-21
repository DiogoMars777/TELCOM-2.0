import { useState, useEffect, useCallback } from 'react';
import { dashboardAdminFinancieroService, mockDashboardData } from '../../../../models/Paquetes/P7_DashboardReportesInteligenciaVoz/CU26_VisualizarDashboardAdminFinanciero/dashboardAdminFinancieroModel.js';
import { describeApiError } from '../../../../services/apiClient.js';

export function useDashboardAdminFinancieroController() {
  const [data, setData] = useState(mockDashboardData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [periodo, setPeriodo] = useState('mes_actual');
  const [activeTab, setActiveTab] = useState('todos'); // 'todos' | 'financiero' | 'operativo' | 'alertas'
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const loadDashboard = useCallback(async (selectedPeriodo = periodo) => {
    setLoading(true);
    setError(null);
    try {
      const result = await dashboardAdminFinancieroService.fetchResumen(selectedPeriodo);
      setData(result || mockDashboardData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error al cargar dashboard CU26:', err);
      setError(describeApiError(err));
      // Conservar datos existentes o mock en caso de fallo para no romper la vista
      setData((prev) => prev || mockDashboardData);
    } finally {
      setLoading(false);
    }
  }, [periodo]);

  useEffect(() => {
    let ignore = false;
    loadDashboard(periodo);
    return () => {
      ignore = true;
    };
  }, [periodo, loadDashboard]);

  const handlePeriodoChange = (newPeriodo) => {
    setPeriodo(newPeriodo);
  };

  const handleReload = () => {
    loadDashboard(periodo);
  };

  return {
    data,
    loading,
    error,
    periodo,
    activeTab,
    setActiveTab,
    lastUpdated,
    handlePeriodoChange,
    handleReload,
  };
}
