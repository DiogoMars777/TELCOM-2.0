import React from 'react';
import {
  useServicioInternetController,
} from '../../../../controllers/Paquetes/ServiciosPlanes/CU08_RegistrarActivarServicio/useServicioInternetController';
import { hasPermission } from '../../../../config/access.js';
import {
  Plus, Wifi, AlertCircle, RefreshCw, MapPin, Eye, X, CheckCircle, AlertTriangle, User,
} from 'lucide-react';

/* ─── Badge de estado ────────────────────────────────────────────────────── */
function EstadoBadge({ estado }) {
  const e = (estado ?? '').toUpperCase();
  const cls =
    e === 'ACTIVO'   ? 'badge badge-success' :
    e === 'CORTADO'  ? 'badge badge-danger'  :
    e === 'RETIRADO' ? 'badge badge-secondary' :
                       'badge badge-warning';
  return <span className={cls}>{e || 'ACTIVO'}</span>;
}

/* ─── Modal de detalle ───────────────────────────────────────────────────── */
function DetalleModal({ servicio, onClose }) {
  if (!servicio) return null;
  const plan    = servicio.asignacion_plan_actual?.plan ?? servicio.asignacionPlanActual?.plan;
  const precio  = servicio.precio_mensual  ?? plan?.precio_mensual  ?? plan?.precioMensual  ?? '—';
  const veloc   = servicio.velocidad_mbps  ?? plan?.velocidad_mbps  ?? plan?.velocidadMbps  ?? '—';
  const planNom = servicio.plan_nombre     ?? plan?.nombre_plan     ?? plan?.nombrePlan     ?? '—';

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-card"
        style={{
          maxWidth: 580,
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
          }}
        >
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem' }}>
            <Wifi size={18} color="var(--primary)" />
            Detalle del Servicio
          </h3>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} title="Cerrar ventana">
            <X size={16} />
          </button>
        </div>

        <div
          style={{
            padding: '1.25rem 1.5rem',
            overflowY: 'auto',
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.75rem 1.25rem',
            fontSize: '0.85rem',
          }}
        >
          <div><span style={{ color: 'var(--text-secondary)' }}>Código:</span><br /><strong>{servicio.codigoServicio ?? servicio.codigo_servicio}</strong></div>
          <div><span style={{ color: 'var(--text-secondary)' }}>Estado:</span><br /><EstadoBadge estado={servicio.estadoServicio ?? servicio.estado_servicio} /></div>
          <div><span style={{ color: 'var(--text-secondary)' }}>Cliente:</span><br /><strong>{servicio.cliente_nombre}</strong></div>
          <div><span style={{ color: 'var(--text-secondary)' }}>Zona:</span><br />{servicio.zona_nombre ?? '—'}</div>
          <div><span style={{ color: 'var(--text-secondary)' }}>Plan:</span><br />{planNom}</div>
          <div><span style={{ color: 'var(--text-secondary)' }}>Velocidad:</span><br />{veloc !== '—' ? `${veloc} Mbps` : '—'}</div>
          <div><span style={{ color: 'var(--text-secondary)' }}>Precio mensual:</span><br />{precio !== '—' ? `Bs. ${Number(precio).toFixed(2)}` : '—'}</div>
          <div><span style={{ color: 'var(--text-secondary)' }}>Día de corte:</span><br />{servicio.diaCorte ?? servicio.dia_corte ?? '—'}</div>
          <div><span style={{ color: 'var(--text-secondary)' }}>Fecha activación:</span><br />{servicio.fechaActivacion ?? servicio.fecha_activacion ?? '—'}</div>
          <div><span style={{ color: 'var(--text-secondary)' }}>Fecha base corte:</span><br />{servicio.fechaCorteBase ?? '—'}</div>
          <div style={{ gridColumn: 'span 2' }}><span style={{ color: 'var(--text-secondary)' }}>Dirección:</span><br />{servicio.direccion ?? servicio.direccion_instalacion ?? '—'}</div>
          <div style={{ gridColumn: 'span 2' }}><span style={{ color: 'var(--text-secondary)' }}>Referencia:</span><br />{servicio.referencia ?? '—'}</div>
          <div><span style={{ color: 'var(--text-secondary)' }}>Latitud:</span><br />{servicio.latitud ?? '—'}</div>
          <div><span style={{ color: 'var(--text-secondary)' }}>Longitud:</span><br />{servicio.longitud ?? '—'}</div>
          <div><span style={{ color: 'var(--text-secondary)' }}>Usuario Winbox:</span><br /><code>{servicio.usuarioWinbox ?? '—'}</code></div>
          <div><span style={{ color: 'var(--text-secondary)' }}>IP Asignada:</span><br /><code>{servicio.ipAsignada ?? servicio.ip_asignada ?? '—'}</code></div>
          <div><span style={{ color: 'var(--text-secondary)' }}>MAC Router/ONT:</span><br /><code>{servicio.macRouter ?? servicio.mac_router ?? '—'}</code></div>
        </div>

        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Vista principal CU08 ───────────────────────────────────────────────── */
export default function ServicioInternetView({ user }) {
  const {
    servicios, loading, error, formError,
    showModal, setShowModal,
    showDetailModal, setShowDetailModal,
    selectedServicio,
    clientes, zonas, planes, catalogError,
    clienteSeleccionado, serviciosClienteSeleccionado, posibleDuplicado,
    formServicio, setFormServicio,
    handleClienteChange, handlePlanChange,
    handleCrear, handleVerDetalle,
  } = useServicioInternetController();

  const puedeGestionar = hasPermission(user, 'servicios.manage');

  // Cerrar modales con tecla Escape
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowModal(false);
        setShowDetailModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setShowModal, setShowDetailModal]);

  return (
    <div className="view-panel">
      {/* ─── Encabezado ──────────────────────────────────────────────────── */}
      <div className="view-header">
        <div>
          <h2>Registrar y Activar Servicio de Internet</h2>
          <p className="subtitle">
            CU08 – Alta de servicios para clientes con zona, plan, dirección y coordenadas GPS
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
          disabled={!puedeGestionar}
          title={puedeGestionar ? undefined : 'Sin permiso: servicios.manage'}
        >
          <Plus size={16} /> Registrar Servicio
        </button>
      </div>

      {/* ─── Alertas de error ─────────────────────────────────────────────── */}
      {error && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={18} /> No se pudo cargar la lista de servicios: {error}
        </div>
      )}
      {catalogError && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={18} /> No se pudieron cargar los catálogos: {catalogError}
        </div>
      )}

      {/* ─── Tabla de servicios ───────────────────────────────────────────── */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Cliente</th>
              <th>Zona</th>
              <th>Plan / Velocidad</th>
              <th>Precio</th>
              <th>Dirección</th>
              <th>GPS</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', color: '#94a3b8' }}>
                  <RefreshCw size={16} className="spin" /> Cargando servicios…
                </td>
              </tr>
            )}
            {!loading && servicios.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', color: '#94a3b8' }}>
                  Sin registros — use el botón «Registrar Servicio» para agregar el primero.
                </td>
              </tr>
            )}
            {servicios.map((s) => {
              const plan    = s.asignacion_plan_actual?.plan ?? s.asignacionPlanActual?.plan;
              const planNom = s.plan_nombre ?? plan?.nombre_plan ?? plan?.nombrePlan ?? '—';
              const veloc   = s.velocidad_mbps ?? plan?.velocidad_mbps ?? plan?.velocidadMbps ?? null;
              const precio  = s.precio_mensual ?? plan?.precio_mensual ?? null;
              const lat     = s.latitud;
              const lon     = s.longitud;

              return (
                <tr key={s.id ?? s.idServicio}>
                  <td><strong>{s.codigoServicio ?? s.codigo_servicio}</strong></td>
                  <td>{s.cliente_nombre ?? '—'}</td>
                  <td>{s.zona_nombre ?? '—'}</td>
                  <td>
                    {planNom}
                    {veloc && (
                      <><br /><span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{veloc} Mbps</span></>
                    )}
                  </td>
                  <td>{precio ? `Bs. ${Number(precio).toFixed(2)}` : '—'}</td>
                  <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.direccion ?? s.direccion_instalacion ?? '—'}
                    {s.referencia && (
                      <><br /><small style={{ color: '#94a3b8' }}>{s.referencia}</small></>
                    )}
                  </td>
                  <td>
                    {lat && lon ? (
                      <a
                        href={`https://maps.google.com/?q=${lat},${lon}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'var(--accent)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <MapPin size={13} /> {Number(lat).toFixed(4)}, {Number(lon).toFixed(4)}
                      </a>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>Sin GPS</span>
                    )}
                  </td>
                  <td>
                    <EstadoBadge estado={s.estadoServicio ?? s.estado_servicio} />
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleVerDetalle(s)}
                      title="Ver detalle completo"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ─── Modal: Registrar Servicio ────────────────────────────────────── */}
      {showModal && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div
            className="modal-card"
            style={{
              maxWidth: 680,
              width: '95%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden',
            }}
          >
            {/* Cabecera FIJA del modal */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                flexShrink: 0,
              }}
            >
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem' }}>
                <Wifi size={20} color="var(--primary)" />
                Registrar y Activar Servicio
              </h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowModal(false)}
                title="Cerrar ventana (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleCrear}
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minHeight: 0,
                overflow: 'hidden',
                margin: 0,
              }}
            >
              {/* Contenido scrolleable del formulario */}
              <div
                style={{
                  padding: '1.25rem 1.5rem',
                  overflowY: 'auto',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                {/* ── Sección 1: Datos del cliente ── */}
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', margin: '0 0 0.25rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  1. Cliente y Zona
                </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Cliente <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <select
                    required
                    value={formServicio.idCliente}
                    onChange={(e) => handleClienteChange(e.target.value)}
                  >
                    <option value="">— Seleccione un cliente activo —</option>
                    {clientes.map((c) => {
                      const cId    = c.id ?? c.idCliente;
                      const cNom   = c.nombreCompleto ?? `${c.nombres ?? ''} ${c.apellidos ?? ''}`.trim();
                      const cCod   = c.codigo_cliente ?? c.codigoCliente ?? '';
                      return (
                        <option key={cId} value={cId}>
                          {cNom} {cCod && `— ${cCod}`}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* ── Paso 5 del CU08: Mostrar datos y servicios actuales del cliente ── */}
                {clienteSeleccionado && (
                  <div style={{
                    gridColumn: 'span 2',
                    background: 'rgba(59, 130, 246, 0.06)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    borderRadius: 8,
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.82rem',
                  }}>
                    <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <User size={14} /> Datos y servicios actuales del cliente
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', color: 'var(--text-secondary)' }}>
                      <div><strong>C.I.:</strong> {clienteSeleccionado.ci ?? clienteSeleccionado.documento_identidad ?? 'S/N'}</div>
                      <div><strong>Teléfono:</strong> {clienteSeleccionado.telefonoPrincipal ?? clienteSeleccionado.telefono ?? 'S/N'}</div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <strong>Dirección registrada:</strong> {clienteSeleccionado.direccion || 'No registrada'}
                      </div>
                    </div>
                    <div style={{ marginTop: '0.5rem', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '0.4rem' }}>
                      <span style={{ fontWeight: 600 }}>Servicios contratados ({serviciosClienteSeleccionado.length}):</span>
                      {serviciosClienteSeleccionado.length === 0 ? (
                        <span style={{ color: '#94a3b8', marginLeft: '0.35rem' }}>No tiene servicios previos registrados.</span>
                      ) : (
                        <ul style={{ margin: '0.3rem 0 0 1rem', padding: 0, fontSize: '0.78rem' }}>
                          {serviciosClienteSeleccionado.map((sc) => (
                            <li key={sc.id ?? sc.idServicio}>
                              <code>{sc.codigo_servicio ?? sc.codigoServicio}</code> — {sc.plan_nombre ?? sc.asignacionPlanActual?.plan?.nombrePlan ?? 'Plan'} ({sc.zona_nombre ?? sc.zona?.nombreZona ?? 'Zona'}) — <EstadoBadge estado={sc.estado_servicio ?? sc.estado?.nombreEstado} />
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Zona de Cobertura</label>
                  <select
                    value={formServicio.idZona}
                    onChange={(e) => setFormServicio({ ...formServicio, idZona: e.target.value })}
                  >
                    <option value="">— Seleccione una zona activa —</option>
                    {zonas.length === 0 && (
                      <option value="" disabled>⚠️ No hay zonas de cobertura registradas</option>
                    )}
                    {zonas.map((z) => {
                      const zId  = z.id ?? z.idZona ?? z.zona_id;
                      const zNom = z.nombreZona ?? z.nombre ?? z.nombre_zona ?? `Zona ${zId}`;
                      const zCiu = z.ciudad ? ` (${z.ciudad})` : '';
                      return (
                        <option key={zId} value={zId}>
                          {zNom}{zCiu}
                        </option>
                      );
                    })}
                  </select>
                  {zonas.length === 0 && (
                    <small style={{ color: '#f59e0b', display: 'block', marginTop: '0.35rem' }}>
                      No hay zonas cargadas. Puedes crearlas en <strong>Infraestructura ➔ Zonas de Cobertura (CU04)</strong> o ejecutar el seeder.
                    </small>
                  )}
                </div>
              </div>

              {/* ── Sección 2: Plan ── */}
              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', margin: '1rem 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                2. Plan de Internet
              </p>

              <div className="form-group">
                <label>Plan Activo</label>
                <select
                  value={formServicio.idPlan}
                  onChange={(e) => handlePlanChange(e.target.value)}
                >
                  <option value="">— Seleccione un plan vigente —</option>
                  {planes.map((p) => {
                    const pId    = p.id ?? p.idPlan;
                    const pNom   = p.nombre_plan ?? p.nombrePlan ?? `Plan ${pId}`;
                    const pVeloc = p.velocidad_mbps ?? p.velocidadMbps ?? '';
                    const pPrecio= p.precio_mensual ?? p.precioMensual ?? '';
                    return (
                      <option key={pId} value={pId}>
                        {pNom}{pVeloc ? ` — ${pVeloc} Mbps` : ''}{pPrecio ? ` — Bs. ${Number(pPrecio).toFixed(2)}` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* ── Excepción 6: Advertencia sobre posible duplicidad ── */}
              {posibleDuplicado && (
                <div style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: 8,
                  padding: '0.6rem 0.85rem',
                  fontSize: '0.82rem',
                  color: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                }}>
                  <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Advertencia de posible duplicidad (Excepción 6):</strong>
                    <div style={{ fontSize: '0.76rem', color: '#fbbf24' }}>
                      Este cliente ya cuenta con un servicio registrado en la misma zona con este plan. Verifique antes de continuar para evitar duplicidad.
                    </div>
                  </div>
                </div>
              )}

              {/* ── Sección 3: Fechas ── */}
              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', margin: '1rem 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                3. Fechas y Corte
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Fecha de Activación <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    type="date"
                    required
                    value={formServicio.fechaActivacion}
                    onChange={(e) => setFormServicio({ ...formServicio, fechaActivacion: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Fecha Base de Corte <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    type="date"
                    required
                    value={formServicio.fechaCorteBase}
                    onChange={(e) => setFormServicio({ ...formServicio, fechaCorteBase: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Día de Corte Mensual</label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={formServicio.diaCorte}
                    onChange={(e) => setFormServicio({ ...formServicio, diaCorte: e.target.value })}
                  />
                </div>
              </div>

              {/* ── Sección 4: Domicilio ── */}
              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', margin: '0.5rem 0 0.25rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                4. Domicilio del Servicio
              </p>

              <div className="form-group">
                <label>Dirección</label>
                <input
                  type="text"
                  placeholder="Ej. Av. República #123, Barrio Norte"
                  value={formServicio.direccion}
                  onChange={(e) => setFormServicio({ ...formServicio, direccion: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Referencia del Domicilio</label>
                <input
                  type="text"
                  placeholder="Ej. Frente al parque, casa azul con portón negro"
                  value={formServicio.referencia}
                  onChange={(e) => setFormServicio({ ...formServicio, referencia: e.target.value })}
                />
              </div>

              {/* ── Sección 5: GPS ── */}
              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', margin: '0.5rem 0 0.25rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                5. Coordenadas GPS
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Latitud</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Ej. -17.3895"
                    value={formServicio.latitud}
                    onChange={(e) => setFormServicio({ ...formServicio, latitud: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Longitud</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Ej. -66.1568"
                    value={formServicio.longitud}
                    onChange={(e) => setFormServicio({ ...formServicio, longitud: e.target.value })}
                  />
                </div>
              </div>

              {/* ── Sección 6: Winbox / Red ── */}
              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', margin: '0.5rem 0 0.25rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                6. Red y Equipos (Winbox / Router)
              </p>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 0.5rem 0' }}>
                Campos opcionales para identificar el equipo en Winbox o registrar la IP/MAC del router.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Usuario Winbox</label>
                  <input
                    type="text"
                    placeholder="Ej. cliente_001"
                    value={formServicio.usuarioWinbox}
                    onChange={(e) => setFormServicio({ ...formServicio, usuarioWinbox: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>IP Asignada</label>
                  <input
                    type="text"
                    placeholder="Ej. 10.10.0.45"
                    value={formServicio.ipAsignada}
                    onChange={(e) => setFormServicio({ ...formServicio, ipAsignada: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>MAC Router / ONT</label>
                  <input
                    type="text"
                    placeholder="Ej. E4:8D:8C:1A:2B:3C"
                    value={formServicio.macRouter}
                    onChange={(e) => setFormServicio({ ...formServicio, macRouter: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Observaciones</label>
                <textarea
                  rows={2}
                  placeholder="Notas adicionales sobre la instalación…"
                  value={formServicio.observacion}
                  onChange={(e) => setFormServicio({ ...formServicio, observacion: e.target.value })}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* ── Info de estado inicial ── */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: 8,
                padding: '0.6rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.82rem',
                color: '#10b981',
              }}>
                <CheckCircle size={15} />
                El servicio se registrará con estado <strong>ACTIVO</strong> y la operación quedará registrada en la bitácora.
              </div>

              {/* ── Error del formulario ── */}
              {formError && (
                <div className="alert alert-danger" role="alert">
                  <AlertCircle size={18} /> {formError}
                </div>
              )}
            </div>

            {/* Pie FIJO de acciones: SIEMPRE visible y accesible */}
            <div
              style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '0.75rem',
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw size={14} className="spin" /> Guardando…
                  </>
                ) : (
                  'Registrar y Activar Servicio'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      )}

      {/* ─── Modal de detalle ─────────────────────────────────────────────── */}
      {showDetailModal && (
        <DetalleModal servicio={selectedServicio} onClose={() => setShowDetailModal(false)} />
      )}
    </div>
  );
}
