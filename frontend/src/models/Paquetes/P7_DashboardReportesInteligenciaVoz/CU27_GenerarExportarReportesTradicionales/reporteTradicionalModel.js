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
    return res?.data ?? { zonas: [], metodos: [], estadosCliente: [], columnas: {} };
  },

  /**
   * Obtiene el diccionario de columnas exportables por reporte
   */
  async fetchColumnas() {
    if (isDemoMode()) {
      return {
        clientes_zona: {
          codigoCliente: 'Código Cliente',
          ci: 'C.I.',
          nombreCompleto: 'Nombre Completo',
          telefonoPrincipal: 'Teléfono',
          correo: 'Correo',
          nombreZona: 'Zona',
          barrioZona: 'Barrio',
          estadoCliente: 'Estado',
          totalServicios: 'Servicios Activos',
        },
        ingresos_pagos: {
          numeroComprobante: 'N° Comprobante',
          fechaHora: 'Fecha y Hora',
          clienteNombre: 'Cliente',
          codigoCliente: 'Código Abonado',
          periodo: 'Período',
          nombreMetodo: 'Método Pago',
          montoTotal: 'Monto (Bs.)',
          nombreCajero: 'Cajero',
        },
        morosidad_cortes: {
          codigoFactura: 'Factura N°',
          clienteNombre: 'Abonado',
          clienteCi: 'C.I.',
          codigoServicio: 'Código Servicio',
          nombreZona: 'Zona',
          nombrePlan: 'Plan',
          periodo: 'Período',
          fechaVencimiento: 'Vencimiento',
          monto: 'Monto Mora (Bs.)',
          estadoServicio: 'Estado Servicio',
        },
        equipos_instalaciones: {
          codigo: 'Identificador / Serie',
          cliente: 'Abonado',
          servicio: 'Código Servicio',
          detalle: 'Detalle / Modelo',
          tipo: 'Tipo',
          fecha: 'Fecha',
          responsable: 'Técnico / Responsable',
          estado: 'Estado',
          costo: 'Costo (Bs.)',
        },
      };
    }
    const res = await apiClient.get('/cu27/columnas');
    return res?.data ?? {};
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
   * Genera el análisis ejecutivo con Inteligencia Artificial (Gemini) y TTS
   */
  async fetchAnalisisIa(filtros) {
    if (isDemoMode()) {
      return {
        resumen_ejecutivo: 'La cartera comercial de TELCOM presenta estabilidad con un 90% de clientes activos.',
        puntos_clave: [
          'Mayor concentración de abonados en Zona Norte.',
          'Recaudación fluida por canales QR y transferencias.',
          'Índice de mora controlado bajo el 8%.',
        ],
        alerta_riesgo: 'Monitorear los 2 clientes en mora preventiva antes de fin de mes.',
        recomendacion: 'Reactivar promociones de fibra óptica en nodos con baja densidad de ocupación.',
        narrativa_tts: 'Señor Administrador, la cartera comercial presenta un 90% de clientes activos. Se recomienda revisar los clientes en mora preventiva.',
      };
    }
    const res = await apiClient.post('/cu27/analisis-ia', filtros);
    return res?.data ?? null;
  },

  /**
   * Descarga el reporte en formato Excel (.csv compatible) con columnas dinámicas seleccionadas
   */
  async descargarExcel(filtros, columnas = []) {
    const queryParams = { ...filtros };
    if (Array.isArray(columnas) && columnas.length > 0) {
      queryParams.columnas = columnas.join(',');
    }

    const params = new URLSearchParams(
      Object.entries(queryParams).filter(([, v]) => v !== null && v !== undefined && v !== '')
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
  async obtenerPdf(filtros, columnas = []) {
    const payload = { ...filtros };
    if (Array.isArray(columnas) && columnas.length > 0) {
      payload.columnas = columnas.join(',');
    }
    if (isDemoMode()) {
      return {
        titulo: 'Reporte Demo TELCOM',
        reporte: { kpis: {}, registros: [] },
        fechaGeneracion: new Date().toLocaleDateString('es-BO'),
      };
    }
    const res = await apiClient.get('/cu27/exportar-pdf', payload);
    return res?.data ?? null;
  },
};
