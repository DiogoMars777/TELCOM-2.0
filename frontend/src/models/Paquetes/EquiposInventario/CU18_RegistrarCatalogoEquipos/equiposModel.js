import { apiClient } from '../../../../services/apiClient.js';

export const equiposService = {
  /**
   * Listar modelos del catálogo de equipos y su stock.
   */
  async listar(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.tipo_equipo) params.append('tipo_equipo', filtros.tipo_equipo);
    if (filtros.estado) params.append('estado', filtros.estado);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get(`/cu18/equipos${query}`);
    return res.data?.productos || [];
  },

  /**
   * Registrar nuevo modelo técnico en el catálogo.
   */
  async registrarModelo(datos) {
    const res = await apiClient.post('/cu18/equipos', datos);
    return res.data?.producto;
  },

  /**
   * Consultar detalle de un producto con sus números de serie físicos.
   */
  async obtenerDetalle(id) {
    const res = await apiClient.get(`/cu18/equipos/${id}`);
    return res.data?.producto;
  },

  /**
   * Dar de alta una unidad física serializada en inventario.
   */
  async registrarUnidadFisica(idProducto, datos) {
    const res = await apiClient.post(`/cu18/equipos/${idProducto}/unidades`, datos);
    return res.data?.equipo;
  },
};
