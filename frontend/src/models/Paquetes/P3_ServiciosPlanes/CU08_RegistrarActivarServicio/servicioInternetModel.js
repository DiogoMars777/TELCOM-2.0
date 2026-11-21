import { apiClient } from '../../../../services/apiClient.js';
import { isDemoMode } from '../../../../config/appConfig.js';

// ─── Datos de ejemplo para modo demostración ──────────────────────────────────
export const mockServiciosList = [
  {
    id: 1,
    idServicio: 1,
    codigoServicio: 'SRV-AB123456',
    codigo_servicio: 'SRV-AB123456',
    idCliente: 1,
    cliente_nombre: 'Carlos Andrés Mendoza',
    idZona: 1,
    zona_nombre: 'Zona Norte',
    plan_nombre: 'Plan Fibra Ultra 100 Mbps',
    velocidad_mbps: 100,
    precio_mensual: '220.00',
    fechaActivacion: '2025-01-10',
    fechaCorteBase: '2025-01-10',
    diaCorte: 10,
    direccion: 'Av. Siempre Viva #742',
    referencia: 'Frente al parque',
    latitud: -17.3895,
    longitud: -66.1568,
    usuarioWinbox: 'cliente_001',
    ipAsignada: '10.10.0.45',
    macRouter: 'E4:8D:8C:1A:2B:3C',
    estado_servicio: 'ACTIVO',
    estadoServicio: 'ACTIVO',
  },
  {
    id: 2,
    idServicio: 2,
    codigoServicio: 'SRV-CD789012',
    codigo_servicio: 'SRV-CD789012',
    idCliente: 2,
    cliente_nombre: 'Valeria Rojas Silva',
    idZona: 2,
    zona_nombre: 'Zona Sur',
    plan_nombre: 'Plan Hogar Plus 50 Mbps',
    velocidad_mbps: 50,
    precio_mensual: '160.00',
    fechaActivacion: '2025-02-01',
    fechaCorteBase: '2025-02-01',
    diaCorte: 15,
    direccion: 'Calle Los Pinos #12',
    referencia: 'Casa verde con portón negro',
    latitud: -17.4100,
    longitud: -66.1200,
    usuarioWinbox: 'cliente_002',
    ipAsignada: null,
    macRouter: null,
    estado_servicio: 'ACTIVO',
    estadoServicio: 'ACTIVO',
  },
];

export const mockClientesCu08 = [
  {
    id: 1, idCliente: 1,
    codigo_cliente: 'CLI-10001',
    ci: '7845123',
    telefonoPrincipal: '71234567',
    nombreCompleto: 'Carlos Andrés Mendoza Paredes',
    nombres: 'Carlos Andrés',
    apellidos: 'Mendoza Paredes',
    direccion: 'Av. Siempre Viva #742',
    estadoCliente: 'ACTIVO',
  },
  {
    id: 2, idCliente: 2,
    codigo_cliente: 'CLI-10002',
    ci: '6589124',
    telefonoPrincipal: '79876543',
    nombreCompleto: 'Valeria Rojas Silva',
    nombres: 'Valeria',
    apellidos: 'Rojas Silva',
    direccion: 'Calle Los Pinos #12',
    estadoCliente: 'ACTIVO',
  },
];

export const mockZonasCu08 = [
  { id: 1, idZona: 1, nombre: 'Zona Norte', nombreZona: 'Zona Norte', estado: true, ciudad: 'Cochabamba' },
  { id: 2, idZona: 2, nombre: 'Zona Sur',   nombreZona: 'Zona Sur',   estado: true, ciudad: 'Cochabamba' },
];

export const mockPlanesCu08 = [
  { id: 1, idPlan: 1, nombre_plan: 'Plan Básico 30 Mbps',       velocidad_mbps: 30,  precio_mensual: 130.00, activo: true },
  { id: 2, idPlan: 2, nombre_plan: 'Plan Hogar Plus 50 Mbps',   velocidad_mbps: 50,  precio_mensual: 160.00, activo: true },
  { id: 3, idPlan: 3, nombre_plan: 'Plan Fibra Ultra 100 Mbps', velocidad_mbps: 100, precio_mensual: 220.00, activo: true },
];

// ─── Normalización de nombre de cliente ───────────────────────────────────────
function nombreCliente(s) {
  if (s.cliente_nombre) return s.cliente_nombre;
  if (s.cliente) {
    const nombres  = s.cliente.nombres ?? s.cliente.nombreCompleto ?? '';
    const apellidos = s.cliente.apellidos ?? '';
    return `${nombres} ${apellidos}`.trim();
  }
  return '—';
}

// ─── Normalización de nombre de zona ─────────────────────────────────────────
function nombreZona(s) {
  if (s.zona_nombre) return s.zona_nombre;
  if (s.zona) return s.zona.nombreZona ?? s.zona.nombre ?? '—';
  return '—';
}

// ─── Utilidad para extraer arrays de cualquier formato de respuesta de Laravel ─
function extractArray(res, key = null) {
  if (!res) return [];
  if (key) {
    if (Array.isArray(res?.[key])) return res[key];
    if (Array.isArray(res?.data?.[key])) return res.data[key];
  }
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data?.data?.data)) return res.data.data.data;
  if (res?.data && typeof res.data === 'object') {
    for (const val of Object.values(res.data)) {
      if (Array.isArray(val)) return val;
    }
  }
  return [];
}

// ─── Servicio API ─────────────────────────────────────────────────────────────
export const servicioInternetService = {
  async fetchServicios() {
    if (isDemoMode()) return mockServiciosList;
    const res = await apiClient.get('/cu08/servicios');
    return extractArray(res).map((s) => ({
      ...s,
      cliente_nombre: nombreCliente(s),
      zona_nombre: nombreZona(s),
    }));
  },

  async fetchClientes() {
    if (isDemoMode()) return mockClientesCu08;
    // Clientes activos desde CU06
    const res = await apiClient.get('/cu06/clientes?estado=ACTIVO');
    return extractArray(res);
  },

  async fetchZonas() {
    if (isDemoMode()) return mockZonasCu08;
    // Zonas con cobertura desde CU08 catálogos (permiso servicios.manage)
    const res = await apiClient.get('/cu08/zonas');
    return extractArray(res);
  },

  async fetchPlanes() {
    if (isDemoMode()) return mockPlanesCu08;
    // Planes activos desde CU08 catálogos
    const res = await apiClient.get('/cu08/planes');
    return extractArray(res, 'planes');
  },

  async registrarServicio(data) {
    return await apiClient.post('/cu08/servicios', data);
  },

  async actualizarServicio(id, data) {
    return await apiClient.put(`/cu08/servicios/${id}`, data);
  },
};
