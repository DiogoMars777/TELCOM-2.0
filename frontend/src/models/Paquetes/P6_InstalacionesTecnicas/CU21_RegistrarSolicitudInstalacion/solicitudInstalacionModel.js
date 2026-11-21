import { apiClient } from '../../../../services/apiClient.js';
import { isDemoMode } from '../../../../config/appConfig.js';

export const mockSolicitudesCu21 = [
  {
    id: 1,
    idSolicitud: 1,
    numero_orden: 'ORD-2026-00001',
    numeroOrden: 'ORD-2026-00001',
    fecha_solicitud: '2026-10-25',
    fechaSolicitud: '2026-10-25',
    direccion: 'Barrio Luján, Calle Las Palmas #32',
    referencia: 'A dos cuadras del centro de salud',
    latitud: -17.7833,
    longitud: -63.1821,
    estado_solicitud: 'PENDIENTE',
    estadoSolicitud: 'PENDIENTE',
    observacion: 'Solicitud para paquete Fibra 50 Mbps',
    cliente_id: 1,
    idCliente: 1,
    cliente: {
      idCliente: 1,
      codigoCliente: 'CLI-00001',
      ci: '7894561',
      nombreCompleto: 'Juan Carlos Perez',
      telefonoPrincipal: '71234567',
      correo: 'jperez@gmail.com',
      direccion: 'Barrio Luján, Calle Las Palmas #32',
    },
  },
  {
    id: 2,
    idSolicitud: 2,
    numero_orden: 'ORD-2026-00002',
    numeroOrden: 'ORD-2026-00002',
    fecha_solicitud: '2026-10-26',
    fechaSolicitud: '2026-10-26',
    direccion: 'Urbanización Paitití, Manzano 12, Lote 5',
    referencia: 'Portón negro frente al parque',
    latitud: -17.7712,
    longitud: -63.1645,
    estado_solicitud: 'PROGRAMADA',
    estadoSolicitud: 'PROGRAMADA',
    observacion: 'Acometida estándar de 50 metros',
    cliente_id: 2,
    idCliente: 2,
    cliente: {
      idCliente: 2,
      codigoCliente: 'CLI-00002',
      ci: '6543210',
      nombreCompleto: 'María René Fernández',
      telefonoPrincipal: '78912345',
      correo: 'mfernandez@gmail.com',
      direccion: 'Urbanización Paitití, Manzano 12, Lote 5',
    },
  },
];

export const initialSolicitudInterna = {
  cliente_id: '',
  direccion: '',
  referencia: '',
  latitud: '',
  longitud: '',
  zona_id: '',
  plan_sugerido: '',
  observacion: '',
};

export const initialSolicitudPublica = {
  nombres: '',
  ci: '',
  telefono: '',
  email: '',
  direccion: '',
  referencia: '',
  zona_id: '',
  latitud: '',
  longitud: '',
  plan_sugerido: '',
  observacion: '',
};

export const solicitudInstalacionService = {
  async fetchSolicitudes(filtros = {}) {
    if (isDemoMode()) {
      let result = [...mockSolicitudesCu21];
      if (filtros.estado) {
        result = result.filter(
          (s) => (s.estado_solicitud || s.estadoSolicitud) === filtros.estado
        );
      }
      if (filtros.search) {
        const q = filtros.search.toLowerCase();
        result = result.filter(
          (s) =>
            s.numero_orden.toLowerCase().includes(q) ||
            s.cliente?.nombreCompleto?.toLowerCase().includes(q) ||
            s.cliente?.ci?.includes(q) ||
            s.direccion?.toLowerCase().includes(q)
        );
      }
      return {
        data: result,
        total: result.length,
        current_page: 1,
        last_page: 1,
      };
    }

    const params = new URLSearchParams();
    if (filtros.estado) params.append('estado', filtros.estado);
    if (filtros.search) params.append('search', filtros.search);
    if (filtros.fecha_desde) params.append('fecha_desde', filtros.fecha_desde);
    if (filtros.fecha_hasta) params.append('fecha_hasta', filtros.fecha_hasta);
    if (filtros.page) params.append('page', filtros.page);
    if (filtros.per_page) params.append('per_page', filtros.per_page);

    const res = await apiClient.get(`/cu21/solicitudes?${params.toString()}`);
    return res?.data ?? { data: [], total: 0 };
  },

  async fetchSolicitudDetalle(id) {
    if (isDemoMode()) {
      return mockSolicitudesCu21.find((s) => s.id === Number(id)) || null;
    }
    const res = await apiClient.get(`/cu21/solicitudes/${id}`);
    return res?.data ?? null;
  },

  async crearSolicitud(payload) {
    const res = await apiClient.post('/cu21/solicitudes', payload);
    return res;
  },

  async crearSolicitudPublica(payload) {
    const res = await apiClient.post('/cu21/solicitudes/publica', payload);
    return res;
  },

  async buscarClientes(query = '') {
    if (isDemoMode()) {
      return [
        { idCliente: 1, codigoCliente: 'CLI-00001', ci: '7894561', nombreCompleto: 'Juan Carlos Perez', telefonoPrincipal: '71234567', direccion: 'Barrio Luján #32' },
        { idCliente: 2, codigoCliente: 'CLI-00002', ci: '6543210', nombreCompleto: 'María René Fernández', telefonoPrincipal: '78912345', direccion: 'Paitití Mz 12 Lt 5' },
      ];
    }
    const res = await apiClient.get(`/cu21/clientes-disponibles?q=${encodeURIComponent(query)}`);
    return Array.isArray(res?.data) ? res.data : [];
  },

  async fetchZonasDisponibles() {
    if (isDemoMode()) {
      return [
        { idZona: 1, nombreZona: 'Luján', estadoCobertura: 'Disponible', tecnologia: 'FTTH GPON' },
        { idZona: 2, nombreZona: 'Paitití', estadoCobertura: 'Disponible', tecnologia: 'FTTH GPON' },
        { idZona: 3, nombreZona: 'Pentaguazú 2', estadoCobertura: 'Parcial', tecnologia: 'FTTH GPON' },
        { idZona: 4, nombreZona: 'Pentaguazú 3', estadoCobertura: 'Disponible', tecnologia: 'FTTH GPON' },
        { idZona: 5, nombreZona: 'Coloradillo', estadoCobertura: 'En expansión', tecnologia: 'Radioenlace' },
      ];
    }
    const res = await apiClient.get('/cu21/zonas-cobertura');
    return Array.isArray(res?.data) ? res.data : [];
  },

  async cancelarSolicitud(id, motivo) {
    const res = await apiClient.put(`/cu21/solicitudes/${id}/cancelar`, { motivo });
    return res;
  },
};

