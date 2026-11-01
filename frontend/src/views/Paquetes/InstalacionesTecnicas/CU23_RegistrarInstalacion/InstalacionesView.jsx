import React, { useState } from 'react';
import { useInstalacionesController } from '../../../../controllers/Paquetes/InstalacionesTecnicas/CU23_RegistrarInstalacion/useInstalacionesController';
import { Wrench, Plus, Search, Calendar, UserCheck, CheckCircle2, AlertCircle, X, MapPin } from 'lucide-react';

export default function InstalacionesView() {
  const {
    instalaciones,
    tecnicos,
    loading,
    error,
    filtroEstado,
    setFiltroEstado,
    showModalProgramar,
    setShowModalProgramar,
    showModalFinalizar,
    setShowModalFinalizar,
    instalacionSeleccionada,
    setInstalacionSeleccionada,
    handleProgramar,
    handleAsignarTecnico,
    handleFinalizar,
  } = useInstalacionesController();

  const [formProgramar, setFormProgramar] = useState({
    cliente_id: '',
    direccion: '',
    referencia: '',
    fecha_programada: new Date().toISOString().split('T')[0],
    costo_instalacion: '150.00',
    tecnico_id: '',
    observacion: '',
  });

  const [formFinalizar, setFormFinalizar] = useState({
    fecha_realizada: new Date().toISOString().split('T')[0],
    observacion: 'Instalación completada y verificada en domicilio.',
  });

  const onProgramarSubmit = async (e) => {
    e.preventDefault();
    const ok = await handleProgramar(formProgramar);
    if (ok) {
      setFormProgramar({
        cliente_id: '',
        direccion: '',
        referencia: '',
        fecha_programada: new Date().toISOString().split('T')[0],
        costo_instalacion: '150.00',
        tecnico_id: '',
        observacion: '',
      });
    }
  };

  const onFinalizarSubmit = async (e) => {
    e.preventDefault();
    if (!instalacionSeleccionada) return;
    await handleFinalizar(instalacionSeleccionada.id, formFinalizar);
  };

  return (
    <div className="module-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(234, 179, 8, 0.15)', padding: '10px', borderRadius: '12px', color: '#facc15' }}>
              <Wrench size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
                Órdenes de Instalación Técnica (CU23)
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
                Programación de órdenes domiciliarias, asignación de cuadrillas y certificación de servicio.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowModalProgramar(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
            color: '#0f172a',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 18px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(234, 179, 8, 0.25)',
          }}
        >
          <Plus size={18} />
          Agendar Nueva Instalación
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filtros */}
      <div style={{ background: '#0b1329', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
          <Search size={18} />
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Filtrar estado:</span>
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          style={{
            background: '#04070f',
            color: '#f8fafc',
            border: '1px solid #334155',
            borderRadius: '6px',
            padding: '8px 14px',
            fontSize: '0.875rem',
          }}
        >
          <option value="">Todos los estados</option>
          <option value="PROGRAMADA">PROGRAMADA</option>
          <option value="ASIGNADA">ASIGNADA A CUADRILLA</option>
          <option value="FINALIZADA">FINALIZADA</option>
        </select>
        <div style={{ marginLeft: 'auto', color: '#64748b', fontSize: '0.875rem' }}>
          Total órdenes: <strong style={{ color: '#facc15' }}>{instalaciones.length}</strong>
        </div>
      </div>

      {/* Tabla de Órdenes */}
      <div style={{ background: '#0b1329', border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Cargando órdenes de instalación...</div>
        ) : instalaciones.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No hay instalaciones con este filtro.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid #1e293b', color: '#94a3b8' }}>
                  <th style={{ padding: '12px 16px' }}>Orden / Solicitud</th>
                  <th style={{ padding: '12px 16px' }}>Abonado / Dirección</th>
                  <th style={{ padding: '12px 16px' }}>Fecha Programada</th>
                  <th style={{ padding: '12px 16px' }}>Técnico Asignado</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Estado</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {instalaciones.map((inst) => {
                  const cliente = inst.solicitud?.cliente;
                  const tecnico = inst.tecnico;
                  const isFinalizada = inst.estadoInstalacion === 'FINALIZADA';

                  return (
                    <tr key={inst.id} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: '700', color: '#facc15' }}>
                          {inst.solicitud?.numeroOrden || `ORD-INT-${inst.id}`}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.75rem' }}>ID Instalación #{inst.id}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: '600', color: '#f8fafc' }}>
                          {cliente ? `${cliente.nombres || ''} ${cliente.apellidos || ''}` : 'Abonado Registrado'}
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} color="#64748b" />
                          {inst.solicitud?.direccion || 'Domicilio del abonado'}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#cbd5e1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} color="#94a3b8" />
                          {inst.fechaProgramada}
                        </div>
                        {inst.fechaRealizada && (
                          <div style={{ color: '#4ade80', fontSize: '0.75rem' }}>Realizada: {inst.fechaRealizada}</div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {tecnico ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <UserCheck size={14} color="#38bdf8" />
                            <span style={{ color: '#e2e8f0', fontWeight: '500' }}>{tecnico.nombreCompleto}</span>
                          </div>
                        ) : (
                          <select
                            onChange={(e) => handleAsignarTecnico(inst.id, e.target.value)}
                            defaultValue=""
                            style={{ background: '#04070f', color: '#f8fafc', border: '1px solid #334155', borderRadius: '4px', padding: '4px 8px', fontSize: '0.75rem' }}
                          >
                            <option value="" disabled>Asignar técnico...</option>
                            {tecnicos.map((t) => (
                              <option key={t.id} value={t.id}>{t.nombreCompleto}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          background: isFinalizada
                            ? 'rgba(34, 197, 94, 0.15)'
                            : inst.estadoInstalacion === 'ASIGNADA'
                            ? 'rgba(56, 189, 248, 0.15)'
                            : 'rgba(234, 179, 8, 0.15)',
                          color: isFinalizada ? '#4ade80' : inst.estadoInstalacion === 'ASIGNADA' ? '#38bdf8' : '#facc15',
                        }}>
                          {inst.estadoInstalacion}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        {!isFinalizada && (
                          <button
                            onClick={() => {
                              setInstalacionSeleccionada(inst);
                              setShowModalFinalizar(true);
                            }}
                            style={{
                              background: 'rgba(34, 197, 94, 0.15)',
                              color: '#4ade80',
                              border: '1px solid rgba(34, 197, 94, 0.3)',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <CheckCircle2 size={14} />
                            Finalizar Obra
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

      {/* Modal: Programar Orden */}
      {showModalProgramar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#0b1329', border: '1px solid #1e293b', borderRadius: '14px', width: '90%', maxWidth: '520px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#f8fafc', fontSize: '1.25rem' }}>Agendar Orden de Instalación</h3>
            <form onSubmit={onProgramarSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>ID Cliente Abonado</label>
                <input
                  type="number"
                  required
                  placeholder="Ej. 1"
                  value={formProgramar.cliente_id}
                  onChange={(e) => setFormProgramar({ ...formProgramar, cliente_id: e.target.value })}
                  style={{ width: '100%', background: '#04070f', border: '1px solid #334155', borderRadius: '6px', padding: '8px 12px', color: '#f8fafc', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>Dirección Domiciliaria</label>
                <input
                  type="text"
                  required
                  placeholder="Calle, Número, Barrio..."
                  value={formProgramar.direccion}
                  onChange={(e) => setFormProgramar({ ...formProgramar, direccion: e.target.value })}
                  style={{ width: '100%', background: '#04070f', border: '1px solid #334155', borderRadius: '6px', padding: '8px 12px', color: '#f8fafc', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>Fecha Programada</label>
                  <input
                    type="date"
                    required
                    value={formProgramar.fecha_programada}
                    onChange={(e) => setFormProgramar({ ...formProgramar, fecha_programada: e.target.value })}
                    style={{ width: '100%', background: '#04070f', border: '1px solid #334155', borderRadius: '6px', padding: '8px 12px', color: '#f8fafc', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>Técnico Responsable</label>
                  <select
                    value={formProgramar.tecnico_id}
                    onChange={(e) => setFormProgramar({ ...formProgramar, tecnico_id: e.target.value })}
                    style={{ width: '100%', background: '#04070f', border: '1px solid #334155', borderRadius: '6px', padding: '8px 12px', color: '#f8fafc', boxSizing: 'border-box' }}
                  >
                    <option value="">Sin asignar aún</option>
                    {tecnicos.map((t) => (
                      <option key={t.id} value={t.id}>{t.nombreCompleto}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>Observaciones Técnicas</label>
                <textarea
                  rows="2"
                  placeholder="Potencia óptica requerida, bobina drop estimada..."
                  value={formProgramar.observacion}
                  onChange={(e) => setFormProgramar({ ...formProgramar, observacion: e.target.value })}
                  style={{ width: '100%', background: '#04070f', border: '1px solid #334155', borderRadius: '6px', padding: '8px 12px', color: '#f8fafc', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModalProgramar(false)}
                  style={{ background: '#1e293b', border: 'none', color: '#cbd5e1', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ background: '#eab308', border: 'none', color: '#0f172a', padding: '8px 16px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Agendar Orden
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Finalizar Obra */}
      {showModalFinalizar && instalacionSeleccionada && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#0b1329', border: '1px solid #1e293b', borderRadius: '14px', width: '90%', maxWidth: '450px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#f8fafc', fontSize: '1.25rem' }}>Certificar Finalización Técnica</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 16px 0' }}>
              Orden: <strong style={{ color: '#facc15' }}>{instalacionSeleccionada.solicitud?.numeroOrden || `#${instalacionSeleccionada.id}`}</strong>
            </p>

            <form onSubmit={onFinalizarSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>Fecha Real de Finalización</label>
                <input
                  type="date"
                  required
                  value={formFinalizar.fecha_realizada}
                  onChange={(e) => setFormFinalizar({ ...formFinalizar, fecha_realizada: e.target.value })}
                  style={{ width: '100%', background: '#04070f', border: '1px solid #334155', borderRadius: '6px', padding: '8px 12px', color: '#f8fafc', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>Informe de Instalación / Cierre</label>
                <textarea
                  rows="3"
                  required
                  value={formFinalizar.observacion}
                  onChange={(e) => setFormFinalizar({ ...formFinalizar, observacion: e.target.value })}
                  style={{ width: '100%', background: '#04070f', border: '1px solid #334155', borderRadius: '6px', padding: '8px 12px', color: '#f8fafc', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModalFinalizar(false)}
                  style={{ background: '#1e293b', border: 'none', color: '#cbd5e1', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ background: '#16a34a', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Confirmar Finalización
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
