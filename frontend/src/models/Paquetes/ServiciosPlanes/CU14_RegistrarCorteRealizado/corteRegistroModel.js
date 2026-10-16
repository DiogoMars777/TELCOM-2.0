import { apiClient } from '../../../../services/apiClient.js';

export const corteRegistroService = {
  async registrarCorte(data) {
    return await apiClient.post('/cu14/cortes', data);
  }
};
