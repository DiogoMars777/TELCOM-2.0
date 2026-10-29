import React, { useState, useMemo } from 'react';
import { useAsignacionEquipoController } from '../../../../controllers/Paquetes/EquiposInventario/CU19_AsignarEquipoComodato/useAsignacionEquipoController';
import { hasPermission } from '../../../../config/access';
import {
  HardDrive, Search, CheckCircle2, AlertCircle, AlertTriangle,
  X, RefreshCw, User, Calendar, RotateCcw,
  ScanLine, ShieldCheck, ArrowRight,
  ChevronDown, ChevronUp, ChevronsUpDown, Layers, LayoutGrid, Zap,
} from 'lucide-react';
import './AsignarEquipoComodatoView.css';

export default function AsignarEquipoComodatoView({ user }) {
  const {
    servicios,
    loadingServicios,
    serviciosError,
    busquedaServicio,
    setBusquedaServicio,
    loadServicios,
    servicioId,
    seleccionarServicio,
    servicioSeleccionado,
    comodatoVigente,
    historialComodatos,
    loadingDetalleServicio,
    detalleError,

    equiposDisponibles,
    tiposDisponibles,
    tipoSeleccionado,
    cambiarTipoEquipo,
    busquedaEquipo,
    setBusquedaEquipo,
    ejecutarBusquedaEquipo,
    loadingEquipos,
    equiposError,
    loadEquiposDisponibles,

    showModalAsignar,
    equipoParaAsignar,
    formAsignar,
    setFormAsignar,
    savingAsignacion,
    asignarError,
    asignarSuccess,
    openModalAsignar,
    closeModalAsignar,
    handleConfirmarAsignacion,

    showModalRetiro,
    asignacionParaRetirar,
    formRetiro,
    setFormRetiro,
    savingRetiro,
    retiroError,
    retiroSuccess,
    openModalRetiro,
    closeModalRetiro,
    handleConfirmarRetiro,
  } = useAsignacionEquipoController();

  const [filtroSoloActivos, setFiltroSoloActivos] = useState(false);
  const [vistaModo, setVistaModo] = useState('agrupado'); // 'agrupado' | 'cuadricula'
  const [modelosDesplegados, setModelosDesplegados] = useState({});

  // Agrupar equipos disponibles por modelo/producto para presentación compacta
  const gruposModelos = useMemo(() => {
    const mapa = new Map();
    equiposDisponibles.forEach((eq) => {
      const prod = eq.producto || {};
      const key = prod.id ? String(prod.id) : `${prod.marca}-${prod.modelo}`;
      if (!mapa.has(key)) {
        mapa.set(key, {
          key,
          productoId: prod.id,
          marca: prod.marca || 'Marca Estándar',
          modelo: prod.modelo || 'Modelo Base',
          nombre: prod.nombre || `${prod.marca || ''} ${prod.modelo || ''}`.trim() || 'Dispositivo de Red',
          tipo_equipo: prod.tipo_equipo || 'EQUIPO',
          stock_actual: prod.inventario?.stock_actual ?? null,
          unidades: [],
        });
      }
      mapa.get(key).unidades.push(eq);
    });
    return Array.from(mapa.values());
  }, [equiposDisponibles]);

  // Si hay una búsqueda de texto activa (S/N o MAC), desplegamos los modelos automáticamente
  const isModeloAbierto = (key) => {
    if (busquedaEquipo && busquedaEquipo.trim() !== '') {
      return true;
    }
    return Boolean(modelosDesplegados[key]);
  };

  const toggleModelo = (key) => {
    setModelosDesplegados((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const todosDesplegados = useMemo(() => {
    if (gruposModelos.length === 0) return false;
    return gruposModelos.every((g) => isModeloAbierto(g.key));
  }, [gruposModelos, modelosDesplegados, busquedaEquipo]);

  const toggleTodosModelos = () => {
    if (todosDesplegados) {
      setModelosDesplegados({});
    } else {
      const todos = {};
      gruposModelos.forEach((g) => {
        todos[g.key] = true;
      });
      setModelosDesplegados(todos);
    }
  };

  // Verificación de permiso RBAC (Administrador, Secretaría, Técnico)
  const puedeAsignar = hasPermission(user, 'equipos.assign');

  // Comprobar si el servicio está activo (Precondición de negocio)
  const esServicioActivo = servicioSeleccionado && (
    servicioSeleccionado.estado_servicio === 'ACTIVO' ||
    servicioSeleccionado.idEstadoServicio === 1
  );

  const handleBuscarServicios = (e) => {
    e.preventDefault();
    loadServicios(busquedaServicio);
  };

  const serviciosFiltrados = filtroSoloActivos
    ? servicios.filter((s) => s.estado_servicio === 'ACTIVO')
    : servicios;

  return (
    <div className="view-panel cu19-view">
      {/* Cabecera del Caso de Uso */}
      <div className="view-header">
        <div>
          <h2>Asignar Equipo en Comodato a un Servicio</h2>
          <p className="subtitle">
            Registro y entrega formal de equipos vinculados a servicios de Internet activos.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              loadServicios(busquedaServicio);
              loadEquiposDisponibles(tipoSeleccionado, busquedaEquipo);
            }}
            title="Refrescar datos de servicios y stock"
          >
            <RefreshCw size={15} /> Actualizar
          </button>
        </div>
      </div>

      {/* Alertas de éxito o error globales */}
      {asignarSuccess && (
        <div className="alert alert-success" role="alert">
          <CheckCircle2 size={18} /> {asignarSuccess}
        </div>
      )}
      {retiroSuccess && (
        <div className="alert alert-success" role="alert">
          <CheckCircle2 size={18} /> {retiroSuccess}
        </div>
      )}
      {serviciosError && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={18} /> Error al cargar servicios: {serviciosError}
        </div>
      )}
      {equiposError && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={18} /> Error al consultar inventario: {equiposError}
        </div>
      )}
      {detalleError && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={18} /> Error al consultar detalles del servicio: {detalleError}
        </div>
      )}

      {/* Estructura Principal en dos columnas */}
      <div className="cu19-grid-main">
        {/* Columna Izquierda: Búsqueda y Selección de Servicio */}
        <div className="cu19-service-panel">
          <div className="card-item" style={{ padding: '1rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={16} /> 1. Seleccionar Servicio del Cliente
            </h3>

            {/* Buscador de servicios */}
            <form onSubmit={handleBuscarServicios} className="cu19-search-box">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por código, cliente o CI…"
                value={busquedaServicio}
                onChange={(e) => setBusquedaServicio(e.target.value)}
              />
              <button type="submit" className="btn btn-secondary" title="Buscar servicio">
                <Search size={16} />
              </button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filtroSoloActivos}
                  onChange={(e) => setFiltroSoloActivos(e.target.checked)}
                />
                Solo mostrar servicios activos
              </label>
              <small className="text-muted">{serviciosFiltrados.length} encontrados</small>
            </div>

            {/* Lista desplegable / scroll de servicios */}
            <div className="cu19-service-list">
              {loadingServicios ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
                  <RefreshCw size={18} className="spin" /> Cargando servicios…
                </div>
              ) : serviciosFiltrados.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
                  No se encontraron servicios con ese criterio.
                </div>
              ) : (
                serviciosFiltrados.map((srv) => {
                  const isSelected = String(srv.id) === String(servicioId);
                  const isActivo = srv.estado_servicio === 'ACTIVO';
                  return (
                    <div
                      key={srv.id}
                      className={`cu19-service-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => seleccionarServicio(srv.id)}
                    >
                      <div className="cu19-service-item-header">
                        <span className="cu19-service-code">{srv.codigo_servicio}</span>
                        <span className={`badge badge-${isActivo ? 'success' : 'warning'}`}>
                          {srv.estado_servicio || 'DESCONOCIDO'}
                        </span>
                      </div>
                      <span className="cu19-service-client">
                        {srv.cliente_nombre || 'Cliente'} {srv.ci ? `(CI: ${srv.ci})` : ''}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Tarjeta de Servicio Seleccionado */}
          {servicioSeleccionado ? (
            <div className="cu19-selected-card">
              <div className="cu19-card-header">
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                    {servicioSeleccionado.codigo_servicio}
                  </h4>
                  <small style={{ color: '#64748b' }}>
                    {servicioSeleccionado.cliente_nombre}
                  </small>
                </div>
                <span className={`badge badge-${esServicioActivo ? 'success' : 'danger'}`}>
                  {servicioSeleccionado.estado_servicio}
                </span>
              </div>

              {/* Advertencia si no está activo (Excepción CU19) */}
              {!esServicioActivo && (
                <div className="alert alert-warning" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                  <AlertTriangle size={16} />
                  <strong>Servicio suspendido o inactivo:</strong> No se puede entregar equipo en comodato a un servicio que no esté ACTIVO.
                </div>
              )}

              <div className="cu19-card-meta">
                <div>
                  <span className="cu19-meta-label">Plan Contratado</span>
                  <span className="cu19-meta-value">{servicioSeleccionado.plan_nombre || '—'}</span>
                </div>
                <div>
                  <span className="cu19-meta-label">IP Asignada</span>
                  <span className="cu19-meta-value">{servicioSeleccionado.ip_asignada || 'Dinámica'}</span>
                </div>
                <div>
                  <span className="cu19-meta-label">Dirección</span>
                  <span className="cu19-meta-value">{servicioSeleccionado.direccion || '—'}</span>
                </div>
                <div>
                  <span className="cu19-meta-label">MAC Registrada</span>
                  <span className="cu19-meta-value">{servicioSeleccionado.mac_router || 'No vinculada'}</span>
                </div>
              </div>

              {/* Dispositivo actualmente en comodato */}
              {loadingDetalleServicio ? (
                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>
                  <RefreshCw size={16} className="spin" /> Verificando comodato actual…
                </div>
              ) : comodatoVigente ? (
                <div className="cu19-current-comodato">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span className="cu19-current-comodato-title">
                      <ShieldCheck size={14} style={{ display: 'inline', verticalAlign: 'sub' }} /> Equipo en Comodato Vigente
                    </span>
                    {puedeAsignar && (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => openModalRetiro(comodatoVigente)}
                        title="Registrar devolución o retiro de este equipo"
                      >
                        <RotateCcw size={12} /> Retirar
                      </button>
                    )}
                  </div>
                  <div className="cu19-current-comodato-name">
                    {comodatoVigente.equipo?.producto?.nombre || 'Dispositivo'}
                  </div>
                  <div className="cu19-current-comodato-meta">
                    S/N: <strong>{comodatoVigente.equipo?.numero_serie}</strong> | MAC: <strong>{comodatoVigente.equipo?.mac}</strong>
                  </div>
                  <div className="cu19-current-comodato-date">
                    Entregado el: {comodatoVigente.fecha_asignacion || '—'}
                  </div>
                </div>
              ) : (
                <div className="cu19-current-empty">
                  Sin equipo en comodato actualmente vinculado a este servicio.
                </div>
              )}
            </div>
          ) : (
            <div className="card-item" style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
              <HardDrive size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
              <p style={{ margin: 0 }}>Seleccione un servicio en la lista para ver su información y gestionar su comodato.</p>
            </div>
          )}
        </div>

        {/* Columna Derecha: Catálogo de Equipos Disponibles en Stock */}
        <div className="cu19-equipos-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HardDrive size={18} /> 2. Equipos Disponibles en Inventario
            </h3>
            <span className="badge badge-info">
              {equiposDisponibles.length} equipos listos para entrega
            </span>
          </div>

          {/* Barra de Filtros por Tipo y Buscador por Serie/MAC */}
          <div className="cu19-filters-bar">
            {/* Pestañas de tipos */}
            <div className="cu19-type-tabs">
              <button
                className={`cu19-tab-btn ${tipoSeleccionado === '' ? 'active' : ''}`}
                onClick={() => cambiarTipoEquipo('')}
              >
                Todos
              </button>
              {tiposDisponibles.map((tipo) => (
                <button
                  key={tipo}
                  className={`cu19-tab-btn ${tipoSeleccionado === tipo ? 'active' : ''}`}
                  onClick={() => cambiarTipoEquipo(tipo)}
                >
                  {tipo}
                </button>
              ))}
            </div>

            {/* Búsqueda rápida por Número de Serie o MAC */}
            <form onSubmit={ejecutarBusquedaEquipo} style={{ display: 'flex', gap: '0.35rem', flexGrow: 1, maxWidth: '340px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '2rem', paddingRight: busquedaEquipo ? '2rem' : '0.75rem' }}
                  placeholder="Escanear o ingresar S/N o MAC…"
                  value={busquedaEquipo}
                  onChange={(e) => setBusquedaEquipo(e.target.value)}
                />
                <ScanLine size={15} style={{ position: 'absolute', left: '0.65rem', top: '0.65rem', color: '#94a3b8' }} />
                {busquedaEquipo && (
                  <button
                    type="button"
                    onClick={() => {
                      setBusquedaEquipo('');
                      loadEquiposDisponibles(tipoSeleccionado, '');
                    }}
                    style={{
                      position: 'absolute',
                      right: '0.5rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '0.2rem',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="Limpiar búsqueda"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button type="submit" className="btn btn-secondary" title="Buscar equipo">
                <Search size={16} />
              </button>
            </form>
          </div>

          {/* Barra de Controles: Plegar/Desplegar y Selector de Modo de Vista */}
          {equiposDisponibles.length > 0 && (
            <div className="cu19-controls-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {vistaModo === 'agrupado' && (
                  <button
                    type="button"
                    className="cu19-toggle-all-btn"
                    onClick={toggleTodosModelos}
                    title={todosDesplegados ? "Plegar todos los modelos" : "Desplegar todos los modelos"}
                  >
                    <ChevronsUpDown size={14} />
                    {todosDesplegados ? 'Plegar todos los modelos' : 'Desplegar todos los modelos'}
                  </button>
                )}
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {vistaModo === 'agrupado'
                    ? `${gruposModelos.length} ${gruposModelos.length === 1 ? 'modelo' : 'modelos'} (${equiposDisponibles.length} unidades físicas)`
                    : `${equiposDisponibles.length} unidades disponibles`}
                </span>
              </div>

              <div className="cu19-view-modes">
                <button
                  type="button"
                  className={`cu19-view-btn ${vistaModo === 'agrupado' ? 'active' : ''}`}
                  onClick={() => setVistaModo('agrupado')}
                  title="Ver agrupado por modelo (plegable y compacto)"
                >
                  <Layers size={13} /> Agrupado por Modelo
                </button>
                <button
                  type="button"
                  className={`cu19-view-btn ${vistaModo === 'cuadricula' ? 'active' : ''}`}
                  onClick={() => setVistaModo('cuadricula')}
                  title="Ver todas las tarjetas en cuadrícula directa"
                >
                  <LayoutGrid size={13} /> Ver Cuadrícula
                </button>
              </div>
            </div>
          )}

          {/* Lista de equipos disponibles */}
          {loadingEquipos ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <RefreshCw size={24} className="spin" />
              <p style={{ marginTop: '0.5rem' }}>Consultando stock disponible…</p>
            </div>
          ) : equiposDisponibles.length === 0 ? (
            <div className="card-item" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              <AlertCircle size={32} style={{ margin: '0 auto 0.5rem', color: '#f59e0b' }} />
              <h4>Alerta de Stock</h4>
              <p style={{ margin: '0 0 1rem' }}>
                No hay equipos disponibles en el inventario que coincidan con los filtros seleccionados.
              </p>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  setTipoSeleccionado('');
                  setBusquedaEquipo('');
                  loadEquiposDisponibles('', '');
                }}
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="cu19-equipos-scroll-wrap">
              {vistaModo === 'agrupado' ? (
                /* Vista Acordeón Plegable por Modelo de Dispositivo */
                <div className="cu19-accordion-list">
                  {gruposModelos.map((grupo) => {
                    const abierto = isModeloAbierto(grupo.key);
                    const primerEquipo = grupo.unidades[0];

                    return (
                      <div
                        key={grupo.key}
                        className={`cu19-accordion-item ${abierto ? 'open' : ''}`}
                      >
                        {/* Cabecera Plegable */}
                        <div
                          className="cu19-accordion-header"
                          onClick={() => toggleModelo(grupo.key)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              toggleModelo(grupo.key);
                            }
                          }}
                        >
                          <div className="cu19-accordion-title-area">
                            <div className="cu19-accordion-badges">
                              <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                                {grupo.tipo_equipo}
                              </span>
                              <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                                {grupo.unidades.length} {grupo.unidades.length === 1 ? 'unidad' : 'unidades'} listas
                              </span>
                              {grupo.stock_actual !== null && (
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  Stock: {grupo.stock_actual}
                                </span>
                              )}
                            </div>

                            <h4 className="cu19-accordion-model">
                              {grupo.marca} {grupo.modelo}
                            </h4>
                            <p className="cu19-accordion-desc">
                              {grupo.nombre}
                            </p>
                          </div>

                          <div className="cu19-accordion-actions">
                            {/* Botón rápido para asignar el primer equipo disponible sin tener que desplegar */}
                            {puedeAsignar && (
                              <button
                                type="button"
                                className="btn btn-sm btn-primary"
                                style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', gap: '0.35rem' }}
                                disabled={!servicioId || !esServicioActivo}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (primerEquipo) openModalAsignar(primerEquipo);
                                }}
                                title={
                                  !servicioId
                                    ? 'Seleccione primero un servicio de Internet en el panel izquierdo'
                                    : !esServicioActivo
                                      ? 'El servicio no se encuentra ACTIVO'
                                      : `Asignar inmediatamente primer ${grupo.modelo} disponible (${primerEquipo?.numero_serie})`
                                }
                              >
                                <Zap size={13} /> Asignar disponible
                              </button>
                            )}

                            {/* Botón de Plegar / Desplegar */}
                            <button
                              type="button"
                              className="cu19-accordion-toggle-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleModelo(grupo.key);
                              }}
                              title={abierto ? 'Plegar unidades de este modelo' : 'Desplegar unidades de este modelo'}
                            >
                              {abierto ? (
                                <>
                                  <ChevronUp size={15} /> Plegar
                                </>
                              ) : (
                                <>
                                  <ChevronDown size={15} /> Ver {grupo.unidades.length} {grupo.unidades.length === 1 ? 'unidad' : 'unidades'}
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Contenido desplegable: Tarjetas de las unidades físicas */}
                        {abierto && (
                          <div className="cu19-accordion-body">
                            <div className="cu19-equipos-grid">
                              {grupo.unidades.map((equipo, idx) => (
                                <div key={equipo.id} className="cu19-equipo-card">
                                  <div>
                                    <div className="cu19-equipo-card-header">
                                      <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                                        Unidad #{idx + 1}
                                      </span>
                                      <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                                        Disponible
                                      </span>
                                    </div>

                                    <div className="cu19-equipo-tech" style={{ marginTop: '0.5rem' }}>
                                      <div className="cu19-equipo-tech-row">
                                        <span style={{ color: '#64748b' }}>S/N:</span>
                                        <strong>{equipo.numero_serie}</strong>
                                      </div>
                                      <div className="cu19-equipo-tech-row">
                                        <span style={{ color: '#64748b' }}>MAC:</span>
                                        <strong>{equipo.mac || 'N/A'}</strong>
                                      </div>
                                      {equipo.ip && (
                                        <div className="cu19-equipo-tech-row">
                                          <span style={{ color: '#64748b' }}>IP:</span>
                                          <span>{equipo.ip}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    className="btn btn-primary"
                                    style={{ width: '100%', justifyContent: 'center' }}
                                    disabled={!puedeAsignar || !servicioId || !esServicioActivo}
                                    onClick={() => openModalAsignar(equipo)}
                                    title={
                                      !puedeAsignar
                                        ? 'No tienes permiso equipos.assign'
                                        : !servicioId
                                          ? 'Seleccione primero un servicio de Internet'
                                          : !esServicioActivo
                                            ? 'El servicio no se encuentra ACTIVO'
                                            : 'Asignar esta unidad en comodato'
                                    }
                                  >
                                    <ArrowRight size={16} /> Asignar en Comodato
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Vista en Cuadrícula Directa (todas las tarjetas) */
                <div className="cu19-equipos-grid">
                  {equiposDisponibles.map((equipo) => {
                    const prod = equipo.producto || {};
                    const stock = prod.inventario?.stock_actual ?? '—';
                    return (
                      <div key={equipo.id} className="cu19-equipo-card">
                        <div>
                          <div className="cu19-equipo-card-header">
                            <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                              {prod.tipo_equipo || 'EQUIPO'}
                            </span>
                            <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                              Stock: {stock}
                            </span>
                          </div>

                          <div className="cu19-equipo-model" style={{ marginTop: '0.4rem' }}>
                            {prod.marca} {prod.modelo}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.5rem' }}>
                            {prod.nombre}
                          </div>

                          <div className="cu19-equipo-tech">
                            <div className="cu19-equipo-tech-row">
                              <span style={{ color: '#64748b' }}>S/N:</span>
                              <strong>{equipo.numero_serie}</strong>
                            </div>
                            <div className="cu19-equipo-tech-row">
                              <span style={{ color: '#64748b' }}>MAC:</span>
                              <strong>{equipo.mac || 'N/A'}</strong>
                            </div>
                            {equipo.ip && (
                              <div className="cu19-equipo-tech-row">
                                <span style={{ color: '#64748b' }}>IP:</span>
                                <span>{equipo.ip}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ width: '100%', justifyContent: 'center' }}
                          disabled={!puedeAsignar || !servicioId || !esServicioActivo}
                          onClick={() => openModalAsignar(equipo)}
                          title={
                            !puedeAsignar
                              ? 'No tienes permiso equipos.assign'
                              : !servicioId
                                ? 'Seleccione primero un servicio de Internet'
                                : !esServicioActivo
                                  ? 'El servicio no se encuentra ACTIVO'
                                  : 'Asignar este equipo en comodato'
                          }
                        >
                          <ArrowRight size={16} /> Asignar en Comodato
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Historial de comodatos del servicio */}
          {servicioSeleccionado && (
            <div className="cu19-history-section">
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                <Calendar size={16} /> Historial de Asignaciones en Comodato del Servicio
              </h4>
              {historialComodatos.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.5rem 0 0' }}>
                  No se registran asignaciones previas de comodato para este servicio.
                </p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="cu19-history-table">
                    <thead>
                      <tr>
                        <th>Estado</th>
                        <th>Equipo (Marca / Modelo)</th>
                        <th>Número de Serie</th>
                        <th>MAC</th>
                        <th>Fecha Asignación</th>
                        <th>Fecha Retiro</th>
                        <th>Motivo Retiro</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historialComodatos.map((asig) => {
                        const esVig = asig.es_vigente;
                        const eq = asig.equipo || {};
                        return (
                          <tr key={asig.id}>
                            <td>
                              <span className={`badge badge-${esVig ? 'success' : 'secondary'}`}>
                                {esVig ? 'VIGENTE' : 'RETIRADO'}
                              </span>
                            </td>
                            <td>{eq.producto?.nombre || `${eq.producto?.marca || ''} ${eq.producto?.modelo || ''}`}</td>
                            <td><strong>{eq.numero_serie}</strong></td>
                            <td><code>{eq.mac || '—'}</code></td>
                            <td>{asig.fecha_asignacion || '—'}</td>
                            <td>{asig.fecha_retiro || '—'}</td>
                            <td>{asig.motivo_retiro || '—'}</td>
                            <td>
                              {esVig && puedeAsignar && (
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => openModalRetiro(asig)}
                                >
                                  Retirar
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Confirmar Asignación en Comodato (CU19) */}
      {showModalAsignar && equipoParaAsignar && servicioSeleccionado && (
        <div className="cu19-modal-overlay">
          <div className="cu19-modal" role="dialog" aria-modal="true">
            <div className="cu19-modal-header">
              <h3>
                <ShieldCheck size={18} color="var(--info)" /> Confirmar Entrega en Comodato
              </h3>
              <button
                type="button"
                className="cu19-modal-close"
                onClick={closeModalAsignar}
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmarAsignacion}>
              <div className="cu19-modal-body">
                {asignarError && (
                  <div className="alert alert-danger" role="alert">
                    <AlertCircle size={16} /> {asignarError}
                  </div>
                )}

                {/* Resumen del servicio y cliente */}
                <div>
                  <label className="cu19-meta-label">Servicio & Cliente</label>
                  <div className="cu19-summary-box">
                    <div>
                      <strong>Servicio:</strong> <span>{servicioSeleccionado.codigo_servicio}</span>
                    </div>
                    <div>
                      <strong>Estado:</strong> <span className="badge badge-success">{servicioSeleccionado.estado_servicio}</span>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <strong>Cliente:</strong> <span>{servicioSeleccionado.cliente_nombre} {servicioSeleccionado.ci ? `(CI: ${servicioSeleccionado.ci})` : ''}</span>
                    </div>
                  </div>
                </div>

                {/* Resumen del dispositivo */}
                <div>
                  <label className="cu19-meta-label">Equipo Seleccionado para Entrega</label>
                  <div className="cu19-summary-box cu19-summary-highlight">
                    <div>
                      <strong>Tipo:</strong> <span className="badge badge-info">{equipoParaAsignar.producto?.tipo_equipo}</span>
                    </div>
                    <div>
                      <strong>Marca/Modelo:</strong> <span>{equipoParaAsignar.producto?.marca} {equipoParaAsignar.producto?.modelo}</span>
                    </div>
                    <div>
                      <strong>Número de Serie:</strong> <span className="cu19-mono-val">{equipoParaAsignar.numero_serie}</span>
                    </div>
                    <div>
                      <strong>Dirección MAC:</strong> <span className="cu19-mono-val">{equipoParaAsignar.mac}</span>
                    </div>
                  </div>
                </div>

                {/* Fecha de Entrega / Asignación */}
                <div className="form-group">
                  <label className="form-label" htmlFor="cu19-fecha-input">
                    Fecha de Asignación / Entrega
                  </label>
                  <input
                    id="cu19-fecha-input"
                    type="date"
                    className="form-control"
                    value={formAsignar.fecha_asignacion}
                    onChange={(e) => setFormAsignar({ ...formAsignar, fecha_asignacion: e.target.value })}
                    required
                  />
                </div>

                {/* Si ya hay comodato vigente, ofrecer reemplazo formal */}
                {comodatoVigente && (
                  <div className="cu19-replace-box">
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', margin: 0 }}>
                      <input
                        type="checkbox"
                        checked={formAsignar.reemplazar_vigente}
                        onChange={(e) => setFormAsignar({ ...formAsignar, reemplazar_vigente: e.target.checked })}
                      />
                      <span>
                        <strong style={{ color: 'var(--warning)' }}>Reemplazar equipo vigente anterior:</strong> El equipo actual ({comodatoVigente.equipo?.numero_serie}) será retirado formalmente y volverá a estar disponible en inventario.
                      </span>
                    </label>

                    {formAsignar.reemplazar_vigente && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Motivo del cambio de equipo…"
                          value={formAsignar.motivo_reemplazo}
                          onChange={(e) => setFormAsignar({ ...formAsignar, motivo_reemplazo: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Observaciones */}
                <div className="form-group">
                  <label className="form-label" htmlFor="cu19-obs-input">
                    Observaciones Técnicas / Acta de Entrega (Opcional)
                  </label>
                  <textarea
                    id="cu19-obs-input"
                    className="form-control"
                    rows="2"
                    placeholder="Detalles sobre el estado del equipo o notas de entrega al cliente…"
                    value={formAsignar.observaciones}
                    onChange={(e) => setFormAsignar({ ...formAsignar, observaciones: e.target.value })}
                  />
                </div>
              </div>

              <div className="cu19-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModalAsignar}
                  disabled={savingAsignacion}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingAsignacion}
                >
                  {savingAsignacion ? (
                    <>
                      <RefreshCw size={14} className="spin" /> Registrando…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} /> Confirmar Entrega en Comodato
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Retiro / Devolución de Equipo (CU19) */}
      {showModalRetiro && asignacionParaRetirar && (
        <div className="cu19-modal-overlay">
          <div className="cu19-modal" role="dialog" aria-modal="true">
            <div className="cu19-modal-header">
              <h3>
                <RotateCcw size={18} color="var(--danger)" /> Registrar Retiro de Equipo
              </h3>
              <button
                type="button"
                className="cu19-modal-close"
                onClick={closeModalRetiro}
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmarRetiro}>
              <div className="cu19-modal-body">
                {retiroError && (
                  <div className="alert alert-danger" role="alert">
                    <AlertCircle size={16} /> {retiroError}
                  </div>
                )}

                <div className="cu19-summary-box">
                  <div>
                    <strong>S/N:</strong> <span className="cu19-mono-val">{asignacionParaRetirar.equipo?.numero_serie}</span>
                  </div>
                  <div>
                    <strong>MAC:</strong> <span className="cu19-mono-val">{asignacionParaRetirar.equipo?.mac}</span>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <strong>Modelo:</strong> <span>{asignacionParaRetirar.equipo?.producto?.nombre}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="cu19-retiro-fecha">
                    Fecha de Retiro / Devolución
                  </label>
                  <input
                    id="cu19-retiro-fecha"
                    type="date"
                    className="form-control"
                    value={formRetiro.fecha_retiro}
                    onChange={(e) => setFormRetiro({ ...formRetiro, fecha_retiro: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="cu19-retiro-estado">
                    Estado Físico del Equipo al Retornar
                  </label>
                  <select
                    id="cu19-retiro-estado"
                    className="form-control"
                    value={formRetiro.estado_equipo}
                    onChange={(e) => setFormRetiro({ ...formRetiro, estado_equipo: e.target.value })}
                  >
                    <option value="DISPONIBLE">Operativo / Disponible para nuevo comodato</option>
                    <option value="REVISION">Para Mantenimiento / Revisión técnica</option>
                    <option value="DANADO">Dañado / Averiado</option>
                    <option value="BAJA">Baja definitiva</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="cu19-retiro-motivo">
                    Motivo de Retiro *
                  </label>
                  <input
                    id="cu19-retiro-motivo"
                    type="text"
                    className="form-control"
                    placeholder="Ej: Baja de servicio, cambio por daño, actualización de equipo…"
                    value={formRetiro.motivo_retiro}
                    onChange={(e) => setFormRetiro({ ...formRetiro, motivo_retiro: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="cu19-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModalRetiro}
                  disabled={savingRetiro}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={savingRetiro}
                >
                  {savingRetiro ? (
                    <>
                      <RefreshCw size={14} className="spin" /> Guardando…
                    </>
                  ) : (
                    'Confirmar Retiro'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
