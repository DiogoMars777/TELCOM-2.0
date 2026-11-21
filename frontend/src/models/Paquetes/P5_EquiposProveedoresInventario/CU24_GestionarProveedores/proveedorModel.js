import { apiClient } from '../../../../services/apiClient.js';

const ENDPOINT = '/cu24/proveedores';

/** CU24: datos reales del catálogo, sin almacenamiento local ni eliminación física. */
export const proveedorService = {
  async fetchProveedores(params = {}) {
    const res = await apiClient.get(ENDPOINT, params);
    return res.data.proveedores;
  },

  async fetchProveedor(id) {
    const res = await apiClient.get(`${ENDPOINT}/${id}`);
    return res.data.proveedor;
  },

  async crearProveedor(data) {
    const res = await apiClient.post(ENDPOINT, data);
    return res.data.proveedor;
  },

  async actualizarProveedor(id, data) {
    const res = await apiClient.put(`${ENDPOINT}/${id}`, data);
    return res.data.proveedor;
  },

  async activarProveedor(id) {
    const res = await apiClient.put(`${ENDPOINT}/${id}/activar`);
    return res.data.proveedor;
  },

  async desactivarProveedor(id) {
    const res = await apiClient.put(`${ENDPOINT}/${id}/desactivar`);
    return res.data.proveedor;
  },
};
