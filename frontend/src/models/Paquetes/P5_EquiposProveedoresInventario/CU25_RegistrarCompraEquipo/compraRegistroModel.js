import { apiClient } from '../../../../services/apiClient.js';

/**
 * Modelo de datos / Servicio API para el Caso de Uso 25:
 * Registrar Compra de Equipo y Actualizar Stock.
 */
export const compraRegistroModel = {
  /**
   * Obtener listado de compras con filtros opcionales.
   */
  async getCompras(params = {}) {
    const res = await apiClient.get('/cu25/compras', params);
    return res;
  },

  /**
   * Consultar detalle de una compra específica.
   */
  async getCompra(id) {
    const res = await apiClient.get(`/cu25/compras/${id}`);
    return res;
  },

  /**
   * Obtener proveedores activos para el selector.
   */
  async getProveedores() {
    const res = await apiClient.get('/cu25/compras/proveedores');
    return res;
  },

  /**
   * Obtener productos del catálogo con existencias actuales de inventario.
   */
  async getProductos() {
    const res = await apiClient.get('/cu25/compras/productos');
    return res;
  },

  /**
   * Obtener catálogo de estados de compra.
   */
  async getEstados() {
    const res = await apiClient.get('/cu25/compras/estados');
    return res;
  },

  /**
   * Registrar nueva orden de compra e incrementar stock en inventario.
   */
  async createCompra(payload) {
    const res = await apiClient.post('/cu25/compras', payload);
    return res;
  },
};
