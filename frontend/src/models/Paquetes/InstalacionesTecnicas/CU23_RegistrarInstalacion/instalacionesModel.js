import { apiClient } from '../../../../services/apiClient.js';

export const instalacionesService = {
  /**
   * Listar órdenes de instalación técnica.
   */
  async listar(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.estado) params.append('estado', filtros.estado);
    if (filtros.tecnico_id) params.append('tecnico_id', filtros.tecnico_id);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get(`/cu23/instalaciones${query}`);
    return res.data?.instalaciones || [];
  },

  /**
   * Listar personal técnico activo para asignación de cuadrillas.
   */
  async listarTecnicos() {
    const res = await apiClient.get('/cu23/instalaciones/tecnicos');
    return res.data?.tecnicos || [];
  },

  /**
   * Programar nueva orden de instalación técnica.
   */
  async agendarInstalacion(datos) {
    const res = await apiClient.post('/cu23/instalaciones', datos);
    return res.data?.instalacion;
  },

  /**
   * Asignar técnico responsable a la orden.
   */
  async asignarTecnico(idInstalacion, tecnicoId) {
    const res = await apiClient.put(`/cu23/instalaciones/${idInstalacion}/tecnico`, {
      tecnico_id: tecnicoId,
    });
    return res.data?.instalacion;
  },

  /**
   * Finalizar instalación técnica en campo.
   */
  async finalizarInstalacion(idInstalacion, datos) {
    const res = await apiClient.put(`/cu23/instalaciones/${idInstalacion}/finalizar`, datos);
    return res.data?.instalacion;
  },
};
