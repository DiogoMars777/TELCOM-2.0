import { apiClient } from '../../../../services/apiClient.js';
import { isDemoMode } from '../../../../config/appConfig.js';

/**
 * CU19 - Modelo para Asignar equipo en comodato a un servicio.
 *
 * Conecta con los endpoints del backend:
 *   - GET  /cu19/servicios-activos
 *   - GET  /cu19/equipos-disponibles
 *   - GET  /cu19/servicios/{id}/equipos
 *   - GET  /cu19/asignaciones
 *   - POST /cu19/servicios/{id}/asignar-equipo
 *   - POST /cu19/asignaciones/{id}/retirar
 */

// Datos de prueba exclusivamente para modo demostración
export const mockServiciosCu19 = [
  {
    id: 1,
    codigo_servicio: 'SRV-88201',
    cliente_nombre: 'Carlos Andrés Mendoza Paredes',
    ci: '5829102',
    direccion: 'Av. San Martín #450, Edif. El Portal 3A',
    estado_servicio: 'ACTIVO',
    plan_nombre: 'Plan Fibra Ultra 100 Mbps',
    ip_asignada: '10.20.10.101',
    mac_router: 'BC:5F:F4:10:01:01',
    cliente: {
      id: 1,
      nombreCompleto: 'Carlos Andrés Mendoza Paredes',
      ci: '5829102',
      telefonoPrincipal: '+591 76543210',
    },
    equipo_comodato_actual: {
      id: 1,
      fecha_asignacion: '2026-01-05',
      es_vigente: true,
      equipo: {
        id: 1,
        numero_serie: 'SN-HW-2026-0001',
        mac: 'BC:5F:F4:10:01:01',
        ip: '10.20.10.101',
        propiedad: 'TELCOM_COMODATO',
        estado_equipo: 'ASIGNADO',
        producto: {
          nombre: 'ONT Huawei EchoLife HG8145V5',
          tipo_equipo: 'ONU',
          marca: 'Huawei',
          modelo: 'HG8145V5',
        },
      },
    },
  },
  {
    id: 2,
    codigo_servicio: 'SRV-SCZ-88002',
    cliente_nombre: 'María René Aguilera Justiniano',
    ci: '6928192',
    direccion: 'Calle Los Tajibos #120, Sirari',
    estado_servicio: 'ACTIVO',
    plan_nombre: 'Plan Hogar Plus 50 Mbps',
    ip_asignada: '10.20.10.102',
    mac_router: null,
    cliente: {
      id: 2,
      nombreCompleto: 'María René Aguilera Justiniano',
      ci: '6928192',
      telefonoPrincipal: '+591 77123456',
    },
    equipo_comodato_actual: null,
  },
  {
    id: 3,
    codigo_servicio: 'SRV-SCZ-88003',
    cliente_nombre: 'Juan Pablo Camacho Ortiz',
    ci: '7820193',
    direccion: '4to Anillo y Av. Busch #310',
    estado_servicio: 'SUSPENDIDO',
    plan_nombre: 'Plan Básico 30 Mbps',
    ip_asignada: '10.20.10.103',
    mac_router: null,
    cliente: {
      id: 3,
      nombreCompleto: 'Juan Pablo Camacho Ortiz',
      ci: '7820193',
      telefonoPrincipal: '+591 78901234',
    },
    equipo_comodato_actual: null,
  },
];

export const mockEquiposDisponiblesCu19 = [
  {
    id: 21,
    numero_serie: 'SN-HW-2026-0021',
    mac: 'BC:5F:F4:10:01:15',
    ip: '10.20.10.121',
    asignada: false,
    propiedad: 'TELCOM_COMODATO',
    estado_equipo: 'DISPONIBLE',
    producto: {
      id: 1,
      nombre: 'ONT Huawei EchoLife HG8145V5',
      tipo_equipo: 'ONU',
      marca: 'Huawei',
      modelo: 'HG8145V5',
      inventario: { stock_actual: 39 },
    },
  },
  {
    id: 22,
    numero_serie: 'SN-HW-2026-0022',
    mac: 'BC:5F:F4:10:01:16',
    ip: '10.20.10.122',
    asignada: false,
    propiedad: 'TELCOM_COMODATO',
    estado_equipo: 'DISPONIBLE',
    producto: {
      id: 2,
      nombre: 'ONT Huawei OptiXstar Wi-Fi 6',
      tipo_equipo: 'ONU',
      marca: 'Huawei',
      modelo: 'OptiXstar K562',
      inventario: { stock_actual: 35 },
    },
  },
  {
    id: 23,
    numero_serie: 'SN-HW-2026-0023',
    mac: 'BC:5F:F4:10:01:17',
    ip: '10.20.10.123',
    asignada: false,
    propiedad: 'TELCOM_COMODATO',
    estado_equipo: 'DISPONIBLE',
    producto: {
      id: 3,
      nombre: 'Router ZTE F601 Gigabit GPON',
      tipo_equipo: 'Router',
      marca: 'ZTE',
      modelo: 'ZXHN F601',
      inventario: { stock_actual: 80 },
    },
  },
  {
    id: 24,
    numero_serie: 'SN-HW-2026-0024',
    mac: 'BC:5F:F4:10:01:18',
    ip: '10.20.10.124',
    asignada: false,
    propiedad: 'TELCOM_COMODATO',
    estado_equipo: 'DISPONIBLE',
    producto: {
      id: 4,
      nombre: 'Modem VDSL2 TP-Link Archer',
      tipo_equipo: 'Modem',
      marca: 'TP-Link',
      modelo: 'VR400',
      inventario: { stock_actual: 15 },
    },
  },
];

function normalizarServicio(s) {
  const clienteNombre = s.cliente_nombre
    || (s.cliente ? `${s.cliente.nombreCompleto || s.cliente.nombres || ''}`.trim() : null)
    || 'Cliente Sin Nombre';

  const estado = s.estado_servicio || s.estado?.nombreEstado || (s.idEstadoServicio === 1 ? 'ACTIVO' : 'INACTIVO');

  return {
    ...s,
    id: s.id ?? s.idServicio,
    codigo_servicio: s.codigo_servicio ?? s.codigoServicio ?? `SRV-${s.idServicio || s.id}`,
    cliente_nombre: clienteNombre,
    estado_servicio: estado,
    ip_asignada: s.ip_asignada ?? s.ipAsignada ?? null,
    mac_router: s.mac_router ?? s.macRouter ?? null,
  };
}

function normalizarEquipo(e) {
  const prod = e.producto ?? {};
  return {
    ...e,
    id: e.id ?? e.idEquipo,
    numero_serie: e.numero_serie ?? e.numeroSerie ?? '',
    mac: e.mac ?? '',
    ip: e.ip ?? '',
    asignada: Boolean(e.asignada),
    estado_equipo: e.estado_equipo ?? e.estadoEquipo ?? 'DISPONIBLE',
    propiedad: e.propiedad ?? 'TELCOM_COMODATO',
    producto: {
      id: prod.id ?? prod.idProducto ?? null,
      nombre: prod.nombre ?? 'Dispositivo',
      tipo_equipo: prod.tipo_equipo ?? prod.tipoEquipo ?? 'ONU',
      marca: prod.marca ?? '',
      modelo: prod.modelo ?? '',
      inventario: prod.inventario ?? { stock_actual: 0 },
    },
  };
}

export const asignacionEquipoModel = {
  /**
   * Consulta los servicios aptos para asignación en comodato.
   */
  async fetchServicios(params = {}) {
    if (isDemoMode()) {
      let filtered = [...mockServiciosCu19];
      if (params.buscar) {
        const term = params.buscar.toLowerCase();
        filtered = filtered.filter(
          (s) => s.codigo_servicio.toLowerCase().includes(term)
            || s.cliente_nombre.toLowerCase().includes(term)
            || (s.ci && s.ci.includes(term))
        );
      }
      return filtered.map(normalizarServicio);
    }

    const res = await apiClient.get('/cu19/servicios-activos', params);
    const data = res?.data?.data ?? res?.data ?? [];
    const list = Array.isArray(data) ? data : [];
    return list.map(normalizarServicio);
  },

  /**
   * Consulta los equipos disponibles en inventario para entrega en comodato.
   */
  async fetchEquiposDisponibles(params = {}) {
    if (isDemoMode()) {
      let filtered = [...mockEquiposDisponiblesCu19];
      if (params.tipo_equipo) {
        filtered = filtered.filter(
          (e) => e.producto.tipo_equipo.toLowerCase() === params.tipo_equipo.toLowerCase()
        );
      }
      if (params.buscar) {
        const term = params.buscar.toLowerCase();
        filtered = filtered.filter(
          (e) => e.numero_serie.toLowerCase().includes(term)
            || e.mac.toLowerCase().includes(term)
            || e.producto.modelo.toLowerCase().includes(term)
        );
      }
      return {
        equipos: filtered.map(normalizarEquipo),
        total_disponibles: filtered.length,
        tipos_disponibles: ['ONU', 'Router', 'Modem'],
      };
    }

    const res = await apiClient.get('/cu19/equipos-disponibles', params);
    const data = res?.data ?? {};
    const equipos = Array.isArray(data.equipos) ? data.equipos.map(normalizarEquipo) : [];
    return {
      equipos,
      total_disponibles: data.total_disponibles ?? equipos.length,
      tipos_disponibles: data.tipos_disponibles ?? ['ONU', 'Router', 'Modem'],
    };
  },

  /**
   * Obtiene los equipos asignados e historial de comodatos de un servicio.
   */
  async fetchServicioEquipos(servicioId) {
    if (isDemoMode()) {
      const s = mockServiciosCu19.find((srv) => srv.id === Number(servicioId));
      return {
        servicio: s ? normalizarServicio(s) : null,
        comodato_vigente: s?.equipo_comodato_actual ?? null,
        historial: s?.equipo_comodato_actual ? [s.equipo_comodato_actual] : [],
      };
    }

    const res = await apiClient.get(`/cu19/servicios/${servicioId}/equipos`);
    return res?.data ?? { servicio: null, comodato_vigente: null, historial: [] };
  },

  /**
   * Ejecuta la asignación formal del equipo en comodato al servicio de Internet.
   */
  async asignarEquipo(servicioId, payload) {
    if (isDemoMode()) {
      const servicio = mockServiciosCu19.find((s) => s.id === Number(servicioId));
      if (!servicio) throw new Error('Servicio inexistente o suspendido.');
      if (servicio.estado_servicio !== 'ACTIVO') {
        throw new Error('Servicio inexistente o suspendido. Solo es posible asociar equipos a servicios con estado ACTIVO.');
      }
      const equipo = mockEquiposDisponiblesCu19.find(
        (e) => e.id === Number(payload.equipo_id) || e.numero_serie === payload.numero_serie
      );
      if (!equipo) throw new Error('El equipo especificado no se encuentra registrado.');
      if (equipo.asignada) throw new Error('Alerta de stock: El equipo ya se encuentra asignado.');

      equipo.asignada = true;
      equipo.estado_equipo = 'ASIGNADO';
      const asignacion = {
        id: Math.floor(Math.random() * 9000) + 100,
        fecha_asignacion: payload.fecha_asignacion || new Date().toISOString().slice(0, 10),
        es_vigente: true,
        equipo,
      };
      servicio.equipo_comodato_actual = asignacion;
      return { data: asignacion, message: 'Equipo asignado en comodato exitosamente.' };
    }

    return await apiClient.post(`/cu19/servicios/${servicioId}/asignar-equipo`, payload);
  },

  /**
   * Registra el retiro formal de un equipo en comodato.
   */
  async desvincularEquipo(asignacionId, payload) {
    if (isDemoMode()) {
      return { message: 'Equipo retirado del comodato exitosamente.' };
    }
    return await apiClient.post(`/cu19/asignaciones/${asignacionId}/retirar`, payload);
  },
};
