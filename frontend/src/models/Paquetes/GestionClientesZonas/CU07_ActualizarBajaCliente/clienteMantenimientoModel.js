import { apiClient } from '../../../../services/apiClient.js';

export const clienteMantenimientoService = {
  async updateCliente(id, data) {
    return await apiClient.put(`/cu07/clientes/${id}`, data);
  },

  async bajaLogica(id, motivo) {
    return await apiClient.delete(`/cu07/clientes/${id}/baja`, { motivo_baja: motivo });
  }
};
