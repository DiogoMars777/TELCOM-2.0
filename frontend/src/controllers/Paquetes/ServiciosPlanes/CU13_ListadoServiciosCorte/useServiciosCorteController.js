import { useState, useEffect, useCallback } from 'react';
import { serviciosCorteService } from '../../../../models/Paquetes/ServiciosPlanes/CU13_ListadoServiciosCorte/servicioCorteModel';
import { zonaService } from '../../../../models/Paquetes/GestionClientesZonas/CU04_ZonasCobertura/zonaCoberturaModel';
import { describeApiError } from '../../../../services/apiClient';

export function useServiciosCorteController() {
  const [servicios, setServicios] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filtros interactivos y paginación
  const [diasMora, setDiasMora] = useState(5);
  const [zonaId, setZonaId] = useState('');
  const [buscar, setBuscar] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 });

  // Cargar catálogo de zonas para el filtro
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await zonaService.fetchZonas();
        if (active) setZonas(list || []);
      } catch {
        if (active) setZonas([]);
      }
    })();
    return () => { active = false; };
  }, []);

  const loadServicios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await serviciosCorteService.fetchServiciosCorte({
        dias_mora: diasMora,
        zona_id: zonaId,
        buscar: buscar.trim(),
        page,
      });
      setServicios(data);
      if (data?.meta) {
        setMeta(data.meta);
      }
    } catch (e) {
      setServicios([]);
      setMeta({ current_page: 1, last_page: 1, total: 0, per_page: 15 });
      setError(describeApiError(e));
    } finally {
      setLoading(false);
    }
  }, [diasMora, zonaId, buscar, page]);

  useEffect(() => {
    loadServicios();
  }, [loadServicios]);

  const handleSetDiasMora = (val) => {
    setDiasMora(val);
    setPage(1);
  };

  const handleSetZonaId = (val) => {
    setZonaId(val);
    setPage(1);
  };

  const handleSetBuscar = (val) => {
    setBuscar(val);
    setPage(1);
  };

  const limpiarFiltros = () => {
    setDiasMora(5);
    setZonaId('');
    setBuscar('');
    setPage(1);
  };

  // Exportar listado a Excel / CSV con codificación UTF-8 BOM
  const exportarCsv = async () => {
    try {
      // Obtenemos todos los registros que coinciden con los filtros
      const data = await serviciosCorteService.fetchServiciosCorte({
        dias_mora: diasMora,
        zona_id: zonaId,
        buscar: buscar.trim(),
        todos: true,
      });

      if (!data || data.length === 0) {
        alert('No hay registros para exportar con los filtros actuales.');
        return;
      }

      const headers = [
        'Código Servicio',
        'Cliente Deudor',
        'Documento / CI',
        'Teléfono',
        'Zona de Cobertura',
        'Plan Contratado',
        'IP Asignada',
        'Días de Mora',
        'Deuda Total (Bs.)',
      ];

      const rows = data.map((s) => [
        `"${s.codigo_servicio || ''}"`,
        `"${(s.cliente_nombre || '').replace(/"/g, '""')}"`,
        `"${s.cliente_ci || ''}"`,
        `"${s.cliente_telefono || ''}"`,
        `"${s.zona_nombre || ''}"`,
        `"${s.plan_nombre || ''}"`,
        `"${s.ip_asignada || ''}"`,
        s.dias_mora ?? 0,
        s.monto_deuda != null ? Number(s.monto_deuda).toFixed(2) : '0.00',
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const fecha = new Date().toISOString().slice(0, 10);
      link.setAttribute('href', url);
      link.setAttribute('download', `TELCOM_Servicios_Para_Corte_${fecha}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Error al exportar los datos: ' + describeApiError(e));
    }
  };

  const imprimirHojaRuta = () => {
    window.print();
  };

  return {
    servicios,
    zonas,
    loading,
    error,
    reload: loadServicios,
    diasMora,
    setDiasMora: handleSetDiasMora,
    zonaId,
    setZonaId: handleSetZonaId,
    buscar,
    setBuscar: handleSetBuscar,
    page,
    setPage,
    meta,
    limpiarFiltros,
    exportarCsv,
    imprimirHojaRuta,
  };
}
