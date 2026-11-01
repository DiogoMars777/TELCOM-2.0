import React, { useState } from 'react';
import { useEquiposController } from '../../../../controllers/Paquetes/EquiposInventario/CU18_RegistrarCatalogoEquipos/useEquiposController';
import { Package, Plus, Search, Layers, Cpu, Hash, CheckCircle, AlertCircle, X } from 'lucide-react';

export default function EquiposView() {
  const {
    productos,
    loading,
    error,
    filtroTipo,
    setFiltroTipo,
    productoSeleccionado,
    seleccionarProducto,
    showModalNuevo,
    setShowModalNuevo,
    showModalUnidad,
    setShowModalUnidad,
    handleCrearModelo,
    handleRegistrarUnidad,
  } = useEquiposController();

  const [nuevoModelo, setNuevoModelo] = useState({
    nombre: '',
    tipo_equipo: 'ONU',
    marca: '',
    modelo: '',
    descripcion: '',
    stock_inicial: 0,
  });

  const [nuevaUnidad, setNuevaUnidad] = useState({
    numero_serie: '',
    mac: '',
    propiedad: 'COMODATO',
  });

  const onCrearModeloSubmit = async (e) => {
    e.preventDefault();
    const ok = await handleCrearModelo(nuevoModelo);
    if (ok) {
      setNuevoModelo({
        nombre: '',
        tipo_equipo: 'ONU',
        marca: '',
        modelo: '',
        descripcion: '',
        stock_inicial: 0,
      });
    }
  };

  const onRegistrarUnidadSubmit = async (e) => {
    e.preventDefault();
    if (!productoSeleccionado) return;
    const ok = await handleRegistrarUnidad(productoSeleccionado.id, nuevaUnidad);
    if (ok) {
      setNuevaUnidad({ numero_serie: '', mac: '', propiedad: 'COMODATO' });
    }
  };

  return (
    <div className="module-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '10px', borderRadius: '12px', color: '#38bdf8' }}>
              <Package size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
                Catálogo de Equipos e Inventario (CU18)
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
                Gestión de hardware de telecomunicaciones, stock central y seriales físicos de ONTs y routers.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowModalNuevo(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 18px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
          }}
        >
          <Plus size={18} />
          Registrar Modelo en Catálogo
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Barra de filtros */}
      <div style={{ background: '#0b1329', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
          <Search size={18} />
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Filtrar tipo:</span>
        </div>
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          style={{
            background: '#04070f',
            color: '#f8fafc',
            border: '1px solid #334155',
            borderRadius: '6px',
            padding: '8px 14px',
            fontSize: '0.875rem',
          }}
        >
          <option value="">Todos los tipos</option>
          <option value="ONU">ONT / ONU (Fibra Óptica)</option>
          <option value="ROUTER">Router Wi-Fi</option>
          <option value="SWITCH">Switch de Distribución</option>
          <option value="CABLE">Cable Drop / Insumos</option>
        </select>
        <div style={{ marginLeft: 'auto', color: '#64748b', fontSize: '0.875rem' }}>
          Total registrados: <strong style={{ color: '#38bdf8' }}>{productos.length}</strong>
        </div>
      </div>

      {/* Grid de contenido */}
      <div style={{ display: 'grid', gridTemplateColumns: productoSeleccionado ? '1fr 420px' : '1fr', gap: '24px' }}>
        {/* Tabla de Productos del Catálogo */}
        <div style={{ background: '#0b1329', border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="#38bdf8" />
              Modelos Registrados en Catálogo
            </h2>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Cargando equipos del inventario...</div>
          ) : productos.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No hay equipos registrados bajo este criterio.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid #1e293b', color: '#94a3b8' }}>
                    <th style={{ padding: '12px 16px' }}>Equipo / Modelo</th>
                    <th style={{ padding: '12px 16px' }}>Tipo</th>
                    <th style={{ padding: '12px 16px' }}>Marca</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Stock Disponible</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Estado</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((prod) => {
                    const isSelected = productoSeleccionado?.id === prod.id;
                    const stock = prod.inventario?.stockActual ?? 0;
                    return (
                      <tr
                        key={prod.id}
                        onClick={() => seleccionarProducto(prod)}
                        style={{
                          borderBottom: '1px solid #1e293b',
                          background: isSelected ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                        }}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: '600', color: '#f8fafc' }}>{prod.nombre}</div>
                          <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Modelo: {prod.modelo}</div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#1e293b', color: '#38bdf8', fontSize: '0.75rem', fontWeight: '600' }}>
                            {prod.tipoEquipo || prod.tipo_equipo}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#cbd5e1' }}>{prod.marca}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontWeight: '700',
                            fontSize: '0.85rem',
                            background: stock > 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: stock > 0 ? '#4ade80' : '#f87171',
                          }}>
                            {stock} unidades
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            background: prod.estado === 'ACTIVO' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                            color: prod.estado === 'ACTIVO' ? '#38bdf8' : '#94a3b8',
                          }}>
                            {prod.estado}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              seleccionarProducto(prod);
                            }}
                            style={{
                              background: '#1e293b',
                              color: '#38bdf8',
                              border: '1px solid #334155',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                            }}
                          >
                            Ver Seriales
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Panel lateral de Detalle y Unidades Físicas */}
        {productoSeleccionado && (
          <div style={{ background: '#0b1329', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#38bdf8', textTransform: 'uppercase', fontWeight: '700' }}>
                  {productoSeleccionado.tipoEquipo}
                </span>
                <h3 style={{ margin: '4px 0 0 0', color: '#f8fafc', fontSize: '1.25rem' }}>
                  {productoSeleccionado.nombre}
                </h3>
                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{productoSeleccionado.marca} - {productoSeleccionado.modelo}</div>
              </div>
              <button
                onClick={() => setProductoSeleccionado(null)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ background: '#04070f', padding: '14px', borderRadius: '8px', border: '1px solid #1e293b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Stock en Bodega:</span>
                <strong style={{ color: '#4ade80' }}>{productoSeleccionado.inventario?.stockActual ?? 0} unidades</strong>
              </div>
              <div style={{ color: '#cbd5e1', fontSize: '0.8rem', lineHeight: '1.4' }}>
                {productoSeleccionado.descripcion || 'Sin descripción técnica adicional.'}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Hash size={16} color="#38bdf8" />
                Unidades Físicas (Seriales)
              </h4>
              <button
                onClick={() => setShowModalUnidad(true)}
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                + Alta Serial
              </button>
            </div>

            {/* Listado de unidades físicas serializadas */}
            <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {!productoSeleccionado.equipos || productoSeleccionado.equipos.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                  No hay unidades físicas serializadas para este modelo aún.
                </div>
              ) : (
                productoSeleccionado.equipos.map((eq) => (
                  <div key={eq.id} style={{ background: '#04070f', border: '1px solid #1e293b', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '700', color: '#f8fafc', fontSize: '0.85rem' }}>S/N: {eq.numeroSerie}</span>
                      <span style={{
                        fontSize: '0.7rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: eq.estadoEquipo === 'DISPONIBLE' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                        color: eq.estadoEquipo === 'DISPONIBLE' ? '#4ade80' : '#facc15',
                      }}>
                        {eq.estadoEquipo}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
                      <span>MAC: {eq.mac || 'N/A'}</span>
                      <span>Régimen: {eq.propiedad}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Nuevo Modelo en Catálogo */}
      {showModalNuevo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#0b1329', border: '1px solid #1e293b', borderRadius: '14px', width: '90%', maxWidth: '500px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#f8fafc', fontSize: '1.25rem' }}>Registrar Modelo en Catálogo</h3>
            <form onSubmit={onCrearModeloSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>Nombre Descriptivo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Router ONT Dual Band Wi-Fi 6"
                  value={nuevoModelo.nombre}
                  onChange={(e) => setNuevoModelo({ ...nuevoModelo, nombre: e.target.value })}
                  style={{ width: '100%', background: '#04070f', border: '1px solid #334155', borderRadius: '6px', padding: '8px 12px', color: '#f8fafc', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>Tipo de Equipo</label>
                  <select
                    value={nuevoModelo.tipo_equipo}
                    onChange={(e) => setNuevoModelo({ ...nuevoModelo, tipo_equipo: e.target.value })}
                    style={{ width: '100%', background: '#04070f', border: '1px solid #334155', borderRadius: '6px', padding: '8px 12px', color: '#f8fafc', boxSizing: 'border-box' }}
                  >
                    <option value="ONU">ONT / ONU</option>
                    <option value="ROUTER">Router Wi-Fi</option>
                    <option value="SWITCH">Switch</option>
                    <option value="CABLE">Cable / Insumo</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>Marca</label>
                  <input
                    type="text"
                    required
                    placeholder="Huawei / ZTE / TP-Link"
                    value={nuevoModelo.marca}
                    onChange={(e) => setNuevoModelo({ ...nuevoModelo, marca: e.target.value })}
                    style={{ width: '100%', background: '#04070f', border: '1px solid #334155', borderRadius: '6px', padding: '8px 12px', color: '#f8fafc', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>Modelo</label>
                  <input
                    type="text"
                    required
                    placeholder="HG8145V5 / Archer C6"
                    value={nuevoModelo.modelo}
                    onChange={(e) => setNuevoModelo({ ...nuevoModelo, modelo: e.target.value })}
                    style={{ width: '100%', background: '#04070f', border: '1px solid #334155', borderRadius: '6px', padding: '8px 12px', color: '#f8fafc', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>Stock Inicial</label>
                  <input
                    type="number"
                    min="0"
                    value={nuevoModelo.stock_inicial}
                    onChange={(e) => setNuevoModelo({ ...nuevoModelo, stock_inicial: parseInt(e.target.value, 10) || 0 })}
                    style={{ width: '100%', background: '#04070f', border: '1px solid #334155', borderRadius: '6px', padding: '8px 12px', color: '#f8fafc', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>Descripción Técnica</label>
                <textarea
                  rows="3"
                  placeholder="Puertos GE, bandas 2.4/5GHz, potencia óptica admitida..."
                  value={nuevoModelo.descripcion}
                  onChange={(e) => setNuevoModelo({ ...nuevoModelo, descripcion: e.target.value })}
                  style={{ width: '100%', background: '#04070f', border: '1px solid #334155', borderRadius: '6px', padding: '8px 12px', color: '#f8fafc', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModalNuevo(false)}
                  style={{ background: '#1e293b', border: 'none', color: '#cbd5e1', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ background: '#0284c7', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Guardar Modelo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Registrar Unidad Física (Serial / MAC) */}
      {showModalUnidad && productoSeleccionado && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#0b1329', border: '1px solid #1e293b', borderRadius: '14px', width: '90%', maxWidth: '450px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#f8fafc', fontSize: '1.25rem' }}>Alta de Unidad Física</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 16px 0' }}>
              Para: <strong style={{ color: '#38bdf8' }}>{productoSeleccionado.nombre}</strong>
            </p>

            <form onSubmit={onRegistrarUnidadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>Número de Serie (S/N)</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. HWTC-4829104A"
                  value={nuevaUnidad.numero_serie}
                  onChange={(e) => setNuevaUnidad({ ...nuevaUnidad, numero_serie: e.target.value })}
                  style={{ width: '100%', background: '#04070f', border: '1px solid #334155', borderRadius: '6px', padding: '8px 12px', color: '#f8fafc', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>Dirección MAC (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. AC:84:C6:52:11:09"
                  value={nuevaUnidad.mac}
                  onChange={(e) => setNuevaUnidad({ ...nuevaUnidad, mac: e.target.value })}
                  style={{ width: '100%', background: '#04070f', border: '1px solid #334155', borderRadius: '6px', padding: '8px 12px', color: '#f8fafc', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>Régimen de Tenencia</label>
                <select
                  value={nuevaUnidad.propiedad}
                  onChange={(e) => setNuevaUnidad({ ...nuevaUnidad, propiedad: e.target.value })}
                  style={{ width: '100%', background: '#04070f', border: '1px solid #334155', borderRadius: '6px', padding: '8px 12px', color: '#f8fafc', boxSizing: 'border-box' }}
                >
                  <option value="COMODATO">Comodato (Propiedad TELCOM)</option>
                  <option value="VENTA">Venta al Cliente</option>
                  <option value="EMPRESA">Uso Interno Empresa</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModalUnidad(false)}
                  style={{ background: '#1e293b', border: 'none', color: '#cbd5e1', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ background: '#0284c7', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Registrar Serial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
