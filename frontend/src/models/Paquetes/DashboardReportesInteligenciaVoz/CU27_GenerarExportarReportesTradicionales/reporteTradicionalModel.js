import { apiClient } from '../../../../services/apiClient.js';
import { isDemoMode } from '../../../../config/appConfig.js';

export const mockCatalogoReportes = [
  {
    id: 'clientes_zona',
    nombre: 'Clientes por Zona de Cobertura',
    categoria: 'Comercial y Abonados',
    descripcion: 'Consolidado de clientes registrados agrupados por nodo y zona de cobertura, con detalle de servicios contratados y estado operativo.',
    icono: 'Users',
    filtros: ['zona_id', 'estado_cliente', 'fecha_desde', 'fecha_hasta', 'buscar'],
  },
  {
    id: 'ingresos_pagos',
    nombre: 'Ingresos y Recaudación de Pagos',
    categoria: 'Financiero y Cobranzas',
    descripcion: 'Informe detallado de pagos cobrados en ventanilla, transferencias y QR con desglose por período, método de pago y cajero.',
    icono: 'CreditCard',
    filtros: ['metodo_pago', 'fecha_desde', 'fecha_hasta', 'buscar'],
  },
  {
    id: 'morosidad_cortes',
    nombre: 'Morosidad y Servicios para Corte',
    categoria: 'Cobranzas y Operaciones',
    descripcion: 'Reporte de abonados con facturas vencidas, meses acumulados de deuda y servicios en riesgo de corte preventivo.',
    icono: 'AlertTriangle',
    filtros: ['zona_id', 'fecha_desde', 'fecha_hasta', 'buscar'],
  },
  {
    id: 'equipos_instalaciones',
    nombre: 'Equipos en Comodato e Instalaciones Técnicas',
    categoria: 'Infraestructura e Inventario',
    descripcion: 'Control de equipamiento físico entregado a clientes (ONUs/Routers) y balance de órdenes técnicas finalizadas en campo.',
    icono: 'HardDrive',
    filtros: ['tipo_subreporte', 'buscar'],
  },
];

export const reporteTradicionalModel = {
  /**
   * Obtiene el catálogo de reportes disponibles (Paso 2 de CU27)
   */
  async fetchCatalogo() {
    if (isDemoMode()) return mockCatalogoReportes;
    const res = await apiClient.get('/cu27/catalogo');
    return res?.data ?? mockCatalogoReportes;
  },

  /**
   * Obtiene los parámetros para filtros (zonas, métodos de pago, etc.)
   */
  async fetchParametros() {
    if (isDemoMode()) {
      return {
        zonas: [
          { id: 1, nombre: 'Zona Norte - Equipetrol / Sirari', codigo: 'ZON-SCZ-NORTE' },
          { id: 2, nombre: 'Zona Este - Villa 1ro de Mayo', codigo: 'ZON-SCZ-ESTE' },
          { id: 3, nombre: 'Zona Sur - Casco Viejo', codigo: 'ZON-SCZ-SUR' },
        ],
        metodos: [
          { id: 1, nombre: 'EFECTIVO' },
          { id: 2, nombre: 'QR' },
          { id: 3, nombre: 'TRANSFERENCIA' },
          { id: 4, nombre: 'PAYPAL' },
        ],
        estadosCliente: ['ACTIVO', 'INACTIVO', 'SUSPENDIDO'],
      };
    }
    const res = await apiClient.get('/cu27/parametros');
    return res?.data ?? { zonas: [], metodos: [], estadosCliente: [] };
  },

  /**
   * Genera el reporte consolidado aplicando filtros (Paso 6 y 7 de CU27)
   */
  async generarReporte(filtros) {
    if (isDemoMode()) {
      return {
        tipo: filtros.tipo_reporte || 'clientes_zona',
        titulo: 'Reporte Demostrativo TELCOM',
        kpis: {
          total_registros: 20,
          clientes_activos: 18,
          clientes_inactivos: 2,
          servicios_activos: 20,
        },
        registros: [],
        fechaCorte: new Date().toISOString(),
      };
    }
    const res = await apiClient.get('/cu27/generar', filtros);
    return res?.data ?? null;
  },

  /**
   * Descarga el reporte en formato Excel (.csv compatible) (Paso 8 y 9 de CU27)
   */
  async descargarExcel(filtros) {
    const params = new URLSearchParams(
      Object.entries(filtros).filter(([, v]) => v !== null && v !== undefined && v !== '')
    );
    const token = apiClient.getToken?.() || localStorage.getItem('telcom_token');
    const baseUrl = apiClient.getBaseUrl?.() || '/api';
    const downloadUrl = `${baseUrl}/cu27/exportar-excel?${params.toString()}`;

    // Realizar descarga con fetch para incluir el encabezado Bearer Token
    const res = await fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error('Error al descargar el archivo Excel.');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TELCOM_Reporte_${filtros.tipo_reporte || 'general'}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    return true;
  },

  /**
   * Obtiene la estructura oficial para impresión o exportación a PDF (Paso 8 y 9 de CU27)
   */
  async obtenerPdf(filtros) {
    if (isDemoMode()) {
      return {
        titulo: 'Reporte Demo TELCOM',
        reporte: { kpis: {}, registros: [] },
        fechaGeneracion: new Date().toLocaleDateString('es-BO'),
      };
    }
    const res = await apiClient.get('/cu27/exportar-pdf', filtros);
    return res?.data ?? null;
  },
};
