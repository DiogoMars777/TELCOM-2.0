import { apiClient } from '../../../../services/apiClient.js';
import { isDemoMode } from '../../../../config/appConfig.js';

// Mocks para modo demostración
export const mockTecnicos = [
  { id: 1, nombre_completo: 'Carlos Mendoza Paredes', especialidad: 'Fibra Óptica y Fusión FTTH', telefono: '70011223', activo: true },
  { id: 2, nombre_completo: 'Rodrigo Justiniano Arce', especialidad: 'Instalaciones Domiciliarias y ONT', telefono: '70044556', activo: true },
  { id: 3, nombre_completo: 'Marcelo Fernández Ramos', especialidad: 'Radioenlace y Redes GPON', telefono: '70077889', activo: true },
];

export const mockSolicitudes = [
  {
    id: 1,
    numero_orden: 'ORD-2026-P01',
    fecha_solicitud: '2026-10-25',
    direccion: 'Av. San Martín #450, Equipetrol',
    referencia: 'Edificio Los Tajibos, Dpto 4B',
    estado_solicitud: 'PENDIENTE',
    observacion: 'Solicitud para conexión de 100 Mbps fibra monomodo',
    cliente_id: 1,
    cliente: { id: 1, nombre_completo: 'María René Aguilera', telefono_principal: '71022334', ci: '4589211 SC' },
    instalacion: null,
  },
  {
    id: 2,
    numero_orden: 'ORD-2026-P02',
    fecha_solicitud: '2026-10-26',
    direccion: 'Barrio Sirari, Calle 4 Este #12',
    referencia: 'Casa de 2 pisos portón café',
    estado_solicitud: 'PENDIENTE',
    observacion: 'Requiere acometida de 40 metros desde caja NAP-04',
    cliente_id: 2,
    cliente: { id: 2, nombre_completo: 'Jorge Vaca Diez', telefono_principal: '72155667', ci: '5920145 SC' },
    instalacion: null,
  },
];

export const mockAgenda = [
  {
    id: 1,
    fecha_programada: '2026-10-29',
    hora_programada: '09:00',
    tecnico_id: 1,
    estado_instalacion: 'PROGRAMADA',
  },
  {
    id: 2,
    fecha_programada: '2026-10-29',
    hora_programada: '14:30',
    tecnico_id: 1,
    estado_instalacion: 'PROGRAMADA',
  },
];

function normalizarSolicitud(s) {
  const cliente = s.cliente;
  const clienteNombre = s.cliente_nombre
    || (cliente ? (cliente.nombre_completo || `${cliente.nombres ?? ''} ${cliente.apellidos ?? ''}`.trim()) : 'Sin asignar');

  return {
    ...s,
    id: s.id || s.idSolicitud,
    numero_orden: s.numero_orden || s.numeroOrden,
    fecha_solicitud: s.fecha_solicitud || s.fechaSolicitud,
    estado_solicitud: s.estado_solicitud || s.estadoSolicitud,
    cliente_id: s.cliente_id || s.idCliente,
    cliente_nombre: clienteNombre,
    cliente_telefono: cliente?.telefono_principal || cliente?.telefono || s.telefono || '—',
    cliente_ci: cliente?.ci || cliente?.documento_identidad || '—',
  };
}

function normalizarTecnico(t) {
  return {
    ...t,
    id: t.id || t.idTecnico,
    nombre_completo: t.nombre_completo || t.nombreCompleto,
    especialidad: t.especialidad || 'Instalaciones FTTH',
    telefono: t.telefono || '—',
  };
}

function normalizarAgenda(item) {
  return {
    ...item,
    id: item.id || item.idInstalacion,
    tecnico_id: item.tecnico_id || item.idTecnico,
    fecha_programada: item.fecha_programada || item.fechaProgramada,
    hora_programada: (item.hora_programada || item.horaProgramada || '09:00').slice(0, 5),
    estado_instalacion: item.estado_instalacion || item.estadoInstalacion,
  };
}

export const instalacionesService = {
  /**
   * Obtiene la lista de solicitudes, cuadrillas técnicas y agenda existente.
   */
  async fetchInstalaciones() {
    if (isDemoMode()) {
      return {
        solicitudes: mockSolicitudes.map(normalizarSolicitud),
        tecnicos: mockTecnicos.map(normalizarTecnico),
        agenda: mockAgenda.map(normalizarAgenda),
      };
    }

    const res = await apiClient.get('/cu22/instalaciones');
    const data = res?.data || {};

    const solicitudes = (data.solicitudes ?? []).map(normalizarSolicitud);
    const tecnicos = (data.tecnicos ?? []).map(normalizarTecnico);
    const agenda = (data.agenda ?? []).map(normalizarAgenda);

    return { solicitudes, tecnicos, agenda };
  },

  /**
   * Registra y programa una instalación asignando técnico, fecha y hora.
   * @param {{ solicitud_id: number, tecnico_id: number, fecha_programada: string, hora_programada: string, costo_instalacion?: number, observaciones?: string }} datos
   */
  async programarInstalacion(datos) {
    if (isDemoMode()) {
      const nuevaInstalacion = {
        id: Date.now(),
        solicitud_id: Number(datos.solicitud_id),
        tecnico_id: Number(datos.tecnico_id),
        fecha_programada: datos.fecha_programada,
        hora_programada: datos.hora_programada,
        costo_instalacion: Number(datos.costo_instalacion || 150.00),
        estado_instalacion: 'PROGRAMADA',
        observaciones: datos.observaciones || '',
      };
      mockAgenda.push(nuevaInstalacion);
      const sol = mockSolicitudes.find((s) => s.id === Number(datos.solicitud_id));
      if (sol) sol.estado_solicitud = 'PROGRAMADA';

      return {
        success: true,
        message: 'Instalación programada y técnico asignado exitosamente.',
        data: { instalacion: nuevaInstalacion },
      };
    }

    const payload = {
      solicitud_id: Number(datos.solicitud_id),
      tecnico_id: Number(datos.tecnico_id),
      fecha_programada: datos.fecha_programada,
      hora_programada: datos.hora_programada || '09:00',
      costo_instalacion: datos.costo_instalacion !== undefined && datos.costo_instalacion !== ''
        ? Number(datos.costo_instalacion)
        : 150.00,
      observaciones: datos.observaciones ? String(datos.observaciones).trim() : null,
    };

    return await apiClient.post('/cu22/instalaciones', payload);
  },
};
