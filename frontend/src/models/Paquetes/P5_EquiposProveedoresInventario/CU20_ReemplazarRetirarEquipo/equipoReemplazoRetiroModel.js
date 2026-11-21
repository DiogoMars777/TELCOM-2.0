import { apiClient } from '../../../../services/apiClient.js';

const MAX_PAGINAS_SERVICIOS = 100;

function normalizarServicio(servicio) {
  if (!servicio) return null;
  const cliente = servicio.cliente;
  return {
    ...servicio,
    id: servicio.id ?? servicio.idServicio,
    codigo_servicio: servicio.codigo_servicio ?? servicio.codigoServicio,
    cliente_nombre: servicio.cliente_nombre
      || [cliente?.nombres, cliente?.apellidos].filter(Boolean).join(' '),
  };
}

function normalizarEquipo(equipo) {
  if (!equipo) return null;
  return {
    ...equipo,
    id: equipo.idEquipo ?? equipo.id,
    numero_serie: equipo.numeroSerie ?? equipo.numero_serie,
    estado: equipo.estadoEquipo ?? equipo.estado,
  };
}

function normalizarAsignacion(asignacion) {
  if (!asignacion) return null;
  return {
    ...asignacion,
    id: asignacion.idAsignacionEquipo ?? asignacion.id,
    fecha_asignacion: asignacion.fechaAsignacion ?? asignacion.fecha_asignacion,
    fecha_retiro: asignacion.fechaRetiro ?? asignacion.fecha_retiro ?? null,
    motivo_retiro: asignacion.motivoRetiro ?? asignacion.motivo_retiro ?? null,
    equipo: normalizarEquipo(asignacion.equipo),
  };
}

/** CU20: transporte y adaptación del contrato real; apiClient gestiona la sesión. */
export const equipoReemplazoRetiroService = {
  async fetchServicios() {
    const primera = await apiClient.get('/cu08/servicios');
    const pagina = primera?.data;
    const servicios = Array.isArray(pagina) ? [...pagina] : [...(pagina?.data ?? [])];
    const totalPaginas = Number(pagina?.last_page);
    const ultimaPagina = Math.min(
      Number.isFinite(totalPaginas) && totalPaginas > 1 ? totalPaginas : 1,
      MAX_PAGINAS_SERVICIOS,
    );

    // Mismo recorrido secuencial de la paginación Laravel que utiliza CU17.
    for (let page = 2; page <= ultimaPagina; page += 1) {
      const res = await apiClient.get('/cu08/servicios', { page });
      servicios.push(...(res?.data?.data ?? []));
    }
    return servicios.map(normalizarServicio);
  },

  async fetchEquipoServicio(servicioId) {
    const res = await apiClient.get(`/cu20/servicios/${servicioId}/equipo`);
    const data = res?.data;
    return {
      servicio: normalizarServicio(data?.servicio),
      asignacion_activa: normalizarAsignacion(data?.asignacion_activa),
      equipo_actual: normalizarEquipo(data?.equipo_actual),
      historial: (data?.historial ?? []).map(normalizarAsignacion),
    };
  },

  async fetchEquiposDisponibles() {
    const res = await apiClient.get('/cu20/equipos/disponibles');
    return (res?.data?.equipos ?? []).map(normalizarEquipo);
  },

  reemplazarEquipo(servicioId, equipoNuevoId, motivo) {
    return apiClient.post(`/cu20/servicios/${servicioId}/equipo/reemplazar`, {
      equipo_nuevo_id: Number(equipoNuevoId),
      motivo: motivo.trim(),
    });
  },

  retirarEquipo(servicioId, motivo) {
    return apiClient.post(`/cu20/servicios/${servicioId}/equipo/retirar`, {
      motivo: motivo.trim(),
    });
  },
};
