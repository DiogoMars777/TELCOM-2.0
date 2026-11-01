import { useState, useEffect, useCallback } from 'react';
import { equiposService } from '../../../../models/Paquetes/EquiposInventario/CU18_RegistrarCatalogoEquipos/equiposModel.js';

export function useEquiposController() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [showModalNuevo, setShowModalNuevo] = useState(false);
  const [showModalUnidad, setShowModalUnidad] = useState(false);

  const cargarProductos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await equiposService.listar({ tipo_equipo: filtroTipo });
      setProductos(data);
    } catch (err) {
      setError(err.message || 'Error al cargar el inventario de equipos.');
    } finally {
      setLoading(false);
    }
  }, [filtroTipo]);

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  const seleccionarProducto = async (producto) => {
    try {
      const detalle = await equiposService.obtenerDetalle(producto.id);
      setProductoSeleccionado(detalle);
    } catch {
      setProductoSeleccionado(producto);
    }
  };

  const handleCrearModelo = async (formData) => {
    try {
      setLoading(true);
      await equiposService.registrarModelo(formData);
      setShowModalNuevo(false);
      await cargarProductos();
      return true;
    } catch (err) {
      setError(err.message || 'Error al registrar el modelo de equipo.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarUnidad = async (idProducto, datosUnidad) => {
    try {
      setLoading(true);
      await equiposService.registrarUnidadFisica(idProducto, datosUnidad);
      setShowModalUnidad(false);
      const actualizado = await equiposService.obtenerDetalle(idProducto);
      setProductoSeleccionado(actualizado);
      await cargarProductos();
      return true;
    } catch (err) {
      setError(err.message || 'Error al registrar la unidad física.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    productos,
    loading,
    error,
    filtroTipo,
    setFiltroTipo,
    productoSeleccionado,
    setProductoSeleccionado,
    seleccionarProducto,
    showModalNuevo,
    setShowModalNuevo,
    showModalUnidad,
    setShowModalUnidad,
    handleCrearModelo,
    handleRegistrarUnidad,
    recargar: cargarProductos,
  };
}

