import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Edit3,
  UserX,
  Save,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
} from 'lucide-react';
import { clienteConsultaService } from '../../../models/Paquetes/GestionClientesZonas/CU06_ConsultarBuscarClientes/clienteConsultaModel';
import {
  clienteRegistroService,
  initialCliente,
} from '../../../models/Paquetes/GestionClientesZonas/CU05_RegistrarCliente/clienteRegistroModel';
import { clienteMantenimientoService } from '../../../models/Paquetes/GestionClientesZonas/CU07_ActualizarBajaCliente/clienteMantenimientoModel';
import { describeApiError } from '../../../services/apiClient';
import { canAccessCu } from '../../../config/access';
import './ClientesView.css';

const BADGE_ESTADO = {
  ACTIVO: 'badge-success',
  SUSPENDIDO: 'badge-warning',
  INACTIVO: 'badge-danger',
};

export default function ClientesView({ user }) {
  // Permisos según el rol autenticado
  const canCreate = user ? canAccessCu(user, 'CU05') : true;
  const canUpdate = user ? canAccessCu(user, 'CU07') : true;

  // Estado del listado y filtros (CU06)
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');

  // Catálogo de zonas para selección (CU05 / CU07)
  const [zonas, setZonas] = useState([]);
  const [loadingZonas, setLoadingZonas] = useState(false);
  const [zonasError, setZonasError] = useState(null);

  // Mensaje de retroalimentación superior
  const [feedback, setFeedback] = useState(null);

  // Modal: Registrar Nuevo Cliente (CU05)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCliente, setNewCliente] = useState(initialCliente);
  const [savingCreate, setSavingCreate] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Modal: Editar Datos de Cliente (CU07)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCliente, setEditCliente] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState(null);

  // Modal: Dar Baja Lógica (CU07)
  const [showBajaModal, setShowBajaModal] = useState(false);
  const [bajaCliente, setBajaCliente] = useState(null);
  const [motivoBaja, setMotivoBaja] = useState('');
  const [savingBaja, setSavingBaja] = useState(false);
  const [bajaError, setBajaError] = useState(null);

  // Cargar catálogo de zonas
  const loadZonas = useCallback(async () => {
    setLoadingZonas(true);
    setZonasError(null);
    try {
      const data = await clienteRegistroService.fetchZonas();
      setZonas(Array.isArray(data) ? data : []);
    } catch (e) {
      setZonas([]);
      setZonasError(describeApiError(e));
    } finally {
      setLoadingZonas(false);
    }
  }, []);

  // Cargar listado de clientes (CU06)
  const loadClientes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await clienteConsultaService.fetchClientes({
        buscar: busqueda,
        estado: estadoFiltro,
      });
      // Filtrado local de respaldo (útil en modo demostración)
      const term = busqueda.toLowerCase().trim();
      const filtered = (Array.isArray(data) ? data : []).filter((c) => {
        const matchesTerm =
          !term ||
          String(c.nombres ?? '').toLowerCase().includes(term) ||
          String(c.apellidos ?? '').toLowerCase().includes(term) ||
          String(c.documento_identidad ?? '').toLowerCase().includes(term) ||
          String(c.codigo_cliente ?? '').toLowerCase().includes(term) ||
          String(c.telefono ?? '').includes(term);
        const matchesEstado = !estadoFiltro || c.estado === estadoFiltro;
        return matchesTerm && matchesEstado;
      });
      setClientes(filtered);
    } catch (e) {
      setClientes([]);
      setError(describeApiError(e));
    } finally {
      setLoading(false);
    }
  }, [busqueda, estadoFiltro]);

  useEffect(() => {
    loadClientes();
  }, [loadClientes]);

  useEffect(() => {
    loadZonas();
  }, [loadZonas]);

  // --- Handlers: Modal Registrar Cliente (CU05) ---
  const handleOpenCreate = () => {
    setNewCliente(initialCliente);
    setCreateError(null);
    setShowCreateModal(true);
    if (zonas.length === 0) loadZonas();
  };

  const handleCloseCreate = () => {
    if (savingCreate) return;
    setShowCreateModal(false);
    setCreateError(null);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSavingCreate(true);
    setCreateError(null);

    try {
      const res = await clienteRegistroService.registerCliente(newCliente);
      const codigo = res?.data?.codigo_cliente;
      setFeedback({
        type: 'success',
        text: codigo
          ? `Cliente registrado exitosamente (Código: ${codigo}).`
          : res?.message || 'Cliente registrado exitosamente.',
      });
      setShowCreateModal(false);
      setNewCliente(initialCliente);
      await loadClientes();
    } catch (err) {
      setCreateError(describeApiError(err));
    } finally {
      setSavingCreate(false);
    }
  };

  // --- Handlers: Modal Editar Cliente (CU07) ---
  const handleOpenEdit = (cliente) => {
    setEditCliente({
      id: cliente.id,
      codigo_cliente: cliente.codigo_cliente,
      documento_identidad: cliente.documento_identidad,
      tipo_documento: cliente.tipo_documento || 'CI',
      nombres: cliente.nombres || '',
      apellidos: cliente.apellidos || '',
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      direccion: cliente.direccion || '',
      zona_id: cliente.zona_id || '',
      estado: cliente.estado,
    });
    setEditError(null);
    setShowEditModal(true);
    if (zonas.length === 0) loadZonas();
  };

  const handleCloseEdit = () => {
    if (savingEdit) return;
    setShowEditModal(false);
    setEditCliente(null);
    setEditError(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editCliente) return;

    setSavingEdit(true);
    setEditError(null);

    try {
      const payload = {
        nombres: editCliente.nombres,
        apellidos: editCliente.apellidos,
        telefono: editCliente.telefono,
        email: editCliente.email,
        direccion: editCliente.direccion,
      };
      if (editCliente.zona_id) {
        payload.zona_id = parseInt(editCliente.zona_id, 10);
      }

      await clienteMantenimientoService.updateCliente(editCliente.id, payload);
      setFeedback({
        type: 'success',
        text: `Datos del cliente ${editCliente.codigo_cliente} actualizados exitosamente.`,
      });
      setShowEditModal(false);
      setEditCliente(null);
      await loadClientes();
    } catch (err) {
      setEditError(describeApiError(err));
    } finally {
      setSavingEdit(false);
    }
  };

  // --- Handlers: Modal Baja Lógica (CU07) ---
  const handleOpenBaja = (cliente) => {
    setBajaCliente(cliente);
    setMotivoBaja('');
    setBajaError(null);
    setShowBajaModal(true);
  };

  const handleCloseBaja = () => {
    if (savingBaja) return;
    setShowBajaModal(false);
    setBajaCliente(null);
    setBajaError(null);
  };

  const handleBajaSubmit = async (e) => {
    e.preventDefault();
    if (!bajaCliente) return;
    if (!motivoBaja.trim()) {
      setBajaError('Debe ingresar un motivo para registrar la baja lógica.');
      return;
    }

    setSavingBaja(true);
    setBajaError(null);

    try {
      await clienteMantenimientoService.bajaLogica(bajaCliente.id, motivoBaja.trim());
      setFeedback({
        type: 'warning',
        text: `El cliente ${bajaCliente.codigo_cliente} fue dado de baja lógica correctamente (INACTIVO).`,
      });
      setShowBajaModal(false);
      setBajaCliente(null);
      await loadClientes();
    } catch (err) {
      setBajaError(describeApiError(err));
    } finally {
      setSavingBaja(false);
    }
  };

  return (
    <div className="view-panel clientes-view">
      {/* Encabezado principal del módulo */}
      <div className="view-header">
        <div>
          <h2>Gestión de Clientes</h2>
          <p className="subtitle">
            Padrón general de abonados: consulta, alta rápida, actualización de datos y baja lógica
          </p>
        </div>
        <div className="clientes-header-actions">
          {canCreate && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOpenCreate}
              aria-label="Registrar nuevo cliente"
            >
              <UserPlus size={18} />
              <span>Nuevo Cliente</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerta de notificación superior */}
      {feedback && (
        <div className={`alert alert-${feedback.type}`} role="alert">
          {feedback.type === 'danger' ? (
            <AlertCircle size={18} />
          ) : feedback.type === 'warning' ? (
            <AlertTriangle size={18} />
          ) : (
            <CheckCircle2 size={18} />
          )}
          <span>{feedback.text}</span>
          <button
            type="button"
            className="clientes-modal-close"
            style={{ marginLeft: 'auto' }}
            onClick={() => setFeedback(null)}
            aria-label="Cerrar notificación"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Error de consulta */}
      {error && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={18} />
          <span>No se pudo consultar los clientes: {error}</span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ marginLeft: 'auto' }}
            onClick={loadClientes}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Barra de Filtros y Búsqueda (CU06) */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por Nombre, CI, Teléfono o Código..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar clientes"
          />
        </div>

        <div className="filter-item">
          <Filter size={16} />
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            aria-label="Filtrar por estado"
          >
            <option value="">Todos los Estados</option>
            <option value="ACTIVO">ACTIVO</option>
            <option value="SUSPENDIDO">SUSPENDIDO</option>
            <option value="INACTIVO">INACTIVO</option>
          </select>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={loadClientes}
          disabled={loading}
          title="Actualizar listado"
          aria-label="Actualizar listado"
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          <span>Actualizar</span>
        </button>

        <span className="clientes-counter">
          {loading ? 'Buscando...' : `${clientes.length} abonados encontrados`}
        </span>
      </div>

      {/* Tabla Unificada de Clientes */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Documento</th>
              <th>Abonado / Cliente</th>
              <th>Contacto</th>
              <th>Dirección / Zona</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="clientes-status-cell">
                  <RefreshCw size={16} className="spin" /> Cargando clientes…
                </td>
              </tr>
            )}

            {!loading && clientes.length === 0 && (
              <tr>
                <td colSpan={7} className="clientes-status-cell">
                  {busqueda || estadoFiltro
                    ? 'No se encontraron clientes con los filtros aplicados.'
                    : 'Aún no hay clientes registrados en el sistema.'}
                </td>
              </tr>
            )}

            {!loading &&
              clientes.map((c) => (
                <tr key={c.id}>
                  <td data-label="Código">
                    <span className="clientes-cell">
                      <strong>{c.codigo_cliente}</strong>
                    </span>
                  </td>

                  <td data-label="Documento">
                    <span className="clientes-cell">
                      <span>{c.documento_identidad}</span>
                      {c.tipo_documento && (
                        <span className="clientes-muted">{c.tipo_documento}</span>
                      )}
                    </span>
                  </td>

                  <td data-label="Abonado / Cliente">
                    <span className="clientes-cell">
                      <strong>
                        {c.nombres} {c.apellidos}
                      </strong>
                    </span>
                  </td>

                  <td data-label="Contacto">
                    <span className="clientes-cell">
                      <span className="clientes-line">
                        <Phone size={13} /> {c.telefono || '—'}
                      </span>
                      <span className="clientes-line clientes-muted">
                        <Mail size={13} /> {c.email || '—'}
                      </span>
                    </span>
                  </td>

                  <td data-label="Dirección / Zona">
                    <span className="clientes-cell">
                      <span className="clientes-line">
                        <MapPin size={13} /> {c.direccion || '—'}
                      </span>
                      {c.zona_nombre && (
                        <span className="clientes-zona-tag">{c.zona_nombre}</span>
                      )}
                    </span>
                  </td>

                  <td data-label="Estado">
                    <span className="clientes-cell">
                      <span className={`badge ${BADGE_ESTADO[c.estado] || 'badge-info'}`}>
                        {c.estado}
                      </span>
                    </span>
                  </td>

                  <td data-label="Acciones">
                    <div className="clientes-actions-cell">
                      {canUpdate ? (
                        <>
                          <button
                            type="button"
                            className="btn-action btn-action-edit"
                            onClick={() => handleOpenEdit(c)}
                            title="Editar información del cliente"
                            aria-label={`Editar cliente ${c.codigo_cliente}`}
                          >
                            <Edit3 size={14} />
                            <span>Editar</span>
                          </button>

                          {c.estado !== 'INACTIVO' ? (
                            <button
                              type="button"
                              className="btn-action btn-action-baja"
                              onClick={() => handleOpenBaja(c)}
                              title="Dar baja lógica al abonado"
                              aria-label={`Dar de baja a ${c.codigo_cliente}`}
                            >
                              <UserX size={14} />
                              <span>Baja</span>
                            </button>
                          ) : (
                            <span className="clientes-muted" style={{ fontSize: '0.75rem' }}>
                              Inactivo
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="clientes-muted" style={{ fontSize: '0.75rem' }}>
                          Solo lectura
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: REGISTRAR NUEVO CLIENTE (CU05)                        */}
      {/* ============================================================== */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={handleCloseCreate}>
          <div
            className="modal-card clientes-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="modal-create-title"
          >
            <div className="clientes-modal-header">
              <div className="clientes-modal-title-group">
                <div className="clientes-modal-icon-badge">
                  <UserPlus size={22} />
                </div>
                <div>
                  <h3 id="modal-create-title" className="clientes-modal-title">
                    Registrar Nuevo Cliente
                  </h3>
                  <p className="clientes-modal-subtitle">
                    Ingreso de abonado al sistema de telecomunicaciones (CU05)
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="clientes-modal-close"
                onClick={handleCloseCreate}
                disabled={savingCreate}
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            {createError && (
              <div className="alert alert-danger" role="alert">
                <AlertCircle size={18} />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Tipo de Documento</label>
                  <select
                    name="tipo_documento"
                    value={newCliente.tipo_documento}
                    onChange={(e) =>
                      setNewCliente({ ...newCliente, tipo_documento: e.target.value })
                    }
                  >
                    <option value="CI">Cédula de Identidad (CI)</option>
                    <option value="NIT">NIT (Empresarial)</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Nº de Documento</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 8492019"
                    value={newCliente.documento_identidad}
                    onChange={(e) =>
                      setNewCliente({ ...newCliente, documento_identidad: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Nombres</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Carlos Andrés"
                    value={newCliente.nombres}
                    onChange={(e) =>
                      setNewCliente({ ...newCliente, nombres: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Apellidos</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Mendoza Paredes"
                    value={newCliente.apellidos}
                    onChange={(e) =>
                      setNewCliente({ ...newCliente, apellidos: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Teléfono / Celular</label>
                  <input
                    type="text"
                    required
                    placeholder="+591 76543210"
                    value={newCliente.telefono}
                    onChange={(e) =>
                      setNewCliente({ ...newCliente, telefono: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    placeholder="carlos.mendoza@email.com"
                    value={newCliente.email}
                    onChange={(e) =>
                      setNewCliente({ ...newCliente, email: e.target.value })
                    }
                  />
                </div>

                <div className="form-group full-width">
                  <label>Dirección de Domicilio</label>
                  <input
                    type="text"
                    required
                    placeholder="Av. Principal #742, Barrio Equipetrol"
                    value={newCliente.direccion}
                    onChange={(e) =>
                      setNewCliente({ ...newCliente, direccion: e.target.value })
                    }
                  />
                </div>

                <div className="form-group full-width">
                  <label>Zona de Cobertura</label>
                  <select
                    name="zona_id"
                    value={newCliente.zona_id}
                    onChange={(e) =>
                      setNewCliente({ ...newCliente, zona_id: e.target.value })
                    }
                    required
                    disabled={loadingZonas}
                  >
                    <option value="">
                      {loadingZonas
                        ? 'Cargando zonas...'
                        : zonasError
                        ? 'Error al cargar zonas'
                        : 'Seleccione una zona'}
                    </option>
                    {zonas.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.nombre}
                        {z.ciudad ? ` — ${z.ciudad}` : ''}
                      </option>
                    ))}
                  </select>
                  {zonasError && (
                    <span className="clientes-muted" style={{ color: 'var(--danger)' }}>
                      No se pudieron cargar zonas: {zonasError}
                    </span>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseCreate}
                  disabled={savingCreate}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingCreate || loadingZonas}
                >
                  <Save size={18} />
                  <span>{savingCreate ? 'Guardando...' : 'Registrar Cliente'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: EDITAR DATOS DEL CLIENTE (CU07)                       */}
      {/* ============================================================== */}
      {showEditModal && editCliente && (
        <div className="modal-backdrop" onClick={handleCloseEdit}>
          <div
            className="modal-card clientes-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="modal-edit-title"
          >
            <div className="clientes-modal-header">
              <div className="clientes-modal-title-group">
                <div className="clientes-modal-icon-badge">
                  <Edit3 size={22} />
                </div>
                <div>
                  <h3 id="modal-edit-title" className="clientes-modal-title">
                    Editar Datos del Cliente
                  </h3>
                  <p className="clientes-modal-subtitle">
                    Abonado: <strong>{editCliente.codigo_cliente}</strong> ({editCliente.estado})
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="clientes-modal-close"
                onClick={handleCloseEdit}
                disabled={savingEdit}
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            {editError && (
              <div className="alert alert-danger" role="alert">
                <AlertCircle size={18} />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Código de Cliente</label>
                  <input type="text" value={editCliente.codigo_cliente} disabled />
                </div>

                <div className="form-group">
                  <label>Nº de Documento</label>
                  <input type="text" value={editCliente.documento_identidad} disabled />
                </div>

                <div className="form-group">
                  <label>Nombres</label>
                  <input
                    type="text"
                    required
                    value={editCliente.nombres}
                    onChange={(e) =>
                      setEditCliente({ ...editCliente, nombres: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Apellidos</label>
                  <input
                    type="text"
                    required
                    value={editCliente.apellidos}
                    onChange={(e) =>
                      setEditCliente({ ...editCliente, apellidos: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Teléfono / Celular</label>
                  <input
                    type="text"
                    required
                    value={editCliente.telefono}
                    onChange={(e) =>
                      setEditCliente({ ...editCliente, telefono: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    value={editCliente.email}
                    onChange={(e) =>
                      setEditCliente({ ...editCliente, email: e.target.value })
                    }
                  />
                </div>

                <div className="form-group full-width">
                  <label>Dirección</label>
                  <input
                    type="text"
                    required
                    value={editCliente.direccion}
                    onChange={(e) =>
                      setEditCliente({ ...editCliente, direccion: e.target.value })
                    }
                  />
                </div>

                {zonas.length > 0 && (
                  <div className="form-group full-width">
                    <label>Zona de Cobertura</label>
                    <select
                      value={editCliente.zona_id || ''}
                      onChange={(e) =>
                        setEditCliente({ ...editCliente, zona_id: e.target.value })
                      }
                    >
                      <option value="">Seleccione una zona (opcional)</option>
                      {zonas.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.nombre}
                          {z.ciudad ? ` — ${z.ciudad}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseEdit}
                  disabled={savingEdit}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingEdit}
                >
                  <Save size={18} />
                  <span>{savingEdit ? 'Actualizando...' : 'Guardar Cambios'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: DAR DE BAJA LÓGICA (CU07)                             */}
      {/* ============================================================== */}
      {showBajaModal && bajaCliente && (
        <div className="modal-backdrop" onClick={handleCloseBaja}>
          <div
            className="modal-card clientes-modal-card modal-danger"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="modal-baja-title"
          >
            <div className="clientes-modal-header">
              <div className="clientes-modal-title-group">
                <div className="clientes-modal-icon-badge danger">
                  <UserX size={22} />
                </div>
                <div>
                  <h3 id="modal-baja-title" className="clientes-modal-title">
                    Confirmar Baja Lógica
                  </h3>
                  <p className="clientes-modal-subtitle">
                    Inactivación segura con resguardo contable y legal (CU07)
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="clientes-modal-close"
                onClick={handleCloseBaja}
                disabled={savingBaja}
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            {bajaError && (
              <div className="alert alert-danger" role="alert">
                <AlertCircle size={18} />
                <span>{bajaError}</span>
              </div>
            )}

            <div className="clientes-baja-summary">
              <div>
                <strong>Abonado:</strong> {bajaCliente.nombres} {bajaCliente.apellidos}
              </div>
              <div>
                <strong>Código:</strong> {bajaCliente.codigo_cliente} |{' '}
                <strong>Documento:</strong> {bajaCliente.documento_identidad}
              </div>
              <div>
                <strong>Dirección:</strong> {bajaCliente.direccion || 'No especificada'}
              </div>
            </div>

            <p className="text-warning" style={{ fontSize: '0.85rem', margin: '0.25rem 0' }}>
              Esta acción marcará el registro como <strong>INACTIVO</strong> (Soft Delete). Se
              conservará el historial contable, facturas y bitácora del cliente.
            </p>

            <form onSubmit={handleBajaSubmit}>
              <div className="form-group">
                <label>Motivo de la Baja Lógica *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ej. Solicitud voluntaria del cliente por cambio de domicilio..."
                  value={motivoBaja}
                  onChange={(e) => setMotivoBaja(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseBaja}
                  disabled={savingBaja}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={savingBaja}
                >
                  <UserX size={18} />
                  <span>{savingBaja ? 'Procesando...' : 'Confirmar Baja Lógica'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
