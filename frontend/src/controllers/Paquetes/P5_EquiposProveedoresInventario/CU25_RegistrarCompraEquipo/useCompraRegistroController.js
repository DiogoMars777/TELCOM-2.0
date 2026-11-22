import { useState, useEffect, useCallback } from 'react';
import { compraRegistroModel } from '../../../../models/Paquetes/P5_EquiposProveedoresInventario/CU25_RegistrarCompraEquipo/compraRegistroModel.js';
import { describeApiError } from '../../../../services/apiClient.js';

export function useCompraRegistroController() {
  const [compras, setCompras] = useState([]);
  const [stats, setStats] = useState({ total_compras: 0, total_inversion: 0 });
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [estados, setEstados] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    proveedor_id: '',
    fecha_desde: '',
    fecha_hasta: '',
  });

  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCompra, setSelectedCompra] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Estado del formulario de nueva compra
  const [form, setForm] = useState({
    proveedor_id: '',
    nro_comprobante: '',
    fecha_compra: new Date().toISOString().slice(0, 10),
    observacion: '',
    detalles: [
      { producto_id: '', cantidad: 1, precio_unitario: '', series_raw: '' },
    ],
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [comprasRes, provRes, prodRes, estRes] = await Promise.all([
        compraRegistroModel.getCompras(filters),
        compraRegistroModel.getProveedores(),
        compraRegistroModel.getProductos(),
        compraRegistroModel.getEstados(),
      ]);

      const data = comprasRes.data || {};
      setCompras(data.compras || []);
      setStats({
        total_compras: data.total_compras || (data.compras || []).length,
        total_inversion: data.total_inversion || 0,
      });
      setProveedores(provRes.data || []);
      setProductos(prodRes.data || []);
      setEstados(estRes.data || []);
    } catch (e) {
      setError(describeApiError(e));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (key, val) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
  };

  const openCreate = () => {
    setForm({
      proveedor_id: proveedores[0]?.id ? String(proveedores[0].id) : '',
      nro_comprobante: `FAC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
      fecha_compra: new Date().toISOString().slice(0, 10),
      observacion: '',
      detalles: [
        {
          producto_id: productos[0]?.id ? String(productos[0].id) : '',
          cantidad: 10,
          precio_unitario: 250,
          series_raw: '',
        },
      ],
    });
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormError(null);
  };

  const handleAddItem = () => {
    setForm((prev) => ({
      ...prev,
      detalles: [
        ...prev.detalles,
        {
          producto_id: productos[0]?.id ? String(productos[0].id) : '',
          cantidad: 1,
          precio_unitario: '',
          series_raw: '',
        },
      ],
    }));
  };

  const handleRemoveItem = (index) => {
    if (form.detalles.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      detalles: prev.detalles.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index, field, value) => {
    setForm((prev) => {
      const updated = [...prev.detalles];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, detalles: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!form.proveedor_id) {
      setFormError('Debe seleccionar un proveedor.');
      return;
    }

    if (form.detalles.length === 0) {
      setFormError('Debe incluir al menos un producto a ingresar al inventario.');
      return;
    }

    // Validar detalles
    const payloadDetalles = [];
    for (const d of form.detalles) {
      if (!d.producto_id) {
        setFormError('Todos los ítems deben tener un producto seleccionado.');
        return;
      }
      const cant = Number(d.cantidad);
      if (isNaN(cant) || cant <= 0) {
        setFormError('La cantidad debe ser mayor a 0 para todos los ítems.');
        return;
      }
      const prec = Number(d.precio_unitario) || 0;

      // Parsear números de serie si se proporcionaron
      const series = [];
      if (d.series_raw && typeof d.series_raw === 'string') {
        const lineas = d.series_raw.split('\n');
        for (const l of lineas) {
          const item = l.trim();
          if (item) {
            const parts = item.split(',');
            series.push({
              numero_serie: parts[0]?.trim() || null,
              mac: parts[1]?.trim() || null,
            });
          }
        }
      }

      payloadDetalles.push({
        producto_id: Number(d.producto_id),
        cantidad: cant,
        precio_unitario: prec,
        series: series.length > 0 ? series : null,
      });
    }

    setIsSubmitting(true);
    try {
      const payload = {
        proveedor_id: Number(form.proveedor_id),
        nro_comprobante: form.nro_comprobante.trim(),
        fecha_compra: form.fecha_compra,
        observacion: form.observacion?.trim() || null,
        detalles: payloadDetalles,
      };

      await compraRegistroModel.createCompra(payload);
      setSuccessMessage('¡Compra de equipos registrada y stock actualizado con éxito!');
      setShowModal(false);
      await loadData();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setFormError(describeApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDetail = (compra) => {
    setSelectedCompra(compra);
    setShowDetailModal(true);
  };

  const closeDetail = () => {
    setSelectedCompra(null);
    setShowDetailModal(false);
  };

  return {
    compras,
    stats,
    proveedores,
    productos,
    estados,
    loading,
    error,
    formError,
    successMessage,
    filters,
    handleFilterChange,
    showModal,
    openCreate,
    closeModal,
    form,
    setForm,
    handleAddItem,
    handleRemoveItem,
    handleItemChange,
    handleSubmit,
    isSubmitting,
    selectedCompra,
    showDetailModal,
    openDetail,
    closeDetail,
    refresh: loadData,
  };
}
