import React from 'react';
import { useClienteMantenimientoController } from '../../../../controllers/Paquetes/GestionClientesZonas/CU07_ActualizarBajaCliente/useClienteMantenimientoController';
import { UserX, Save, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
// Estilos acotados a esta pantalla (ocultado de la barra vertical).
import './ClienteMantenimientoView.css';

export default function ClienteMantenimientoView() {
  const {
    clientes,
    selectedCliente,
    setSelectedCliente,
    loading,
    error,
    message,
    bajaMotivo,
    setBajaMotivo,
    showBajaModal,
    setShowBajaModal,
    handleUpdate,
    handleBajaLogica,
  } = useClienteMantenimientoController();

  return (
    <div className="view-panel cu07-view">
      <div className="view-header">
        <div>
          <h2>Actualizar Datos y Dar Baja Lógica a Cliente</h2>
          <p className="subtitle">Mantenimiento de información de abonados y borrado seguro (Soft Delete)</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={18} /> No se pudo cargar la lista de clientes: {error}
        </div>
      )}

      {message && (
        <div className={`alert alert-${message.type}`} role="alert">
          {message.type === 'danger' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          {message.text}
        </div>
      )}

      {!selectedCliente ? (
        !error && (
          <div className="alert alert-warning">
            <AlertTriangle size={18} /> No hay clientes disponibles para modificar.
          </div>
        )
      ) : (
        <>
          <div className="cliente-select-bar">
            <label>Seleccionar Cliente a Modificar:</label>
            <select
              value={selectedCliente.id}
              onChange={(e) => {
                const found = clientes.find(c => c.id === parseInt(e.target.value));
                if (found) setSelectedCliente(found);
              }}
            >
              {clientes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.codigo_cliente} - {c.nombres} {c.apellidos} ({c.estado})
                </option>
              ))}
            </select>
          </div>

          <div className="form-card">
            <form onSubmit={handleUpdate}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Código</label>
                  <input type="text" value={selectedCliente.codigo_cliente || ''} disabled />
                </div>

                <div className="form-group">
                  <label>Documento</label>
                  <input type="text" value={selectedCliente.documento_identidad || ''} disabled />
                </div>

                <div className="form-group">
                  <label>Nombres</label>
                  <input
                    type="text"
                    value={selectedCliente.nombres || ''}
                    onChange={(e) => setSelectedCliente({ ...selectedCliente, nombres: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Apellidos</label>
                  <input
                    type="text"
                    value={selectedCliente.apellidos || ''}
                    onChange={(e) => setSelectedCliente({ ...selectedCliente, apellidos: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Teléfono</label>
                  <input
                    type="text"
                    value={selectedCliente.telefono || ''}
                    onChange={(e) => setSelectedCliente({ ...selectedCliente, telefono: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={selectedCliente.email || ''}
                    onChange={(e) => setSelectedCliente({ ...selectedCliente, email: e.target.value })}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Dirección</label>
                  <input
                    type="text"
                    value={selectedCliente.direccion || ''}
                    onChange={(e) => setSelectedCliente({ ...selectedCliente, direccion: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-actions-split">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <Save size={16} /> Guardar Cambios
                </button>

                {selectedCliente.estado !== 'INACTIVO' && (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => setShowBajaModal(true)}
                    disabled={loading}
                  >
                    <UserX size={16} /> Dar Baja Lógica
                  </button>
                )}
              </div>
            </form>
          </div>
        </>
      )}

      {showBajaModal && selectedCliente && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Confirmar Baja Lógica del Cliente</h3>
            <p className="text-warning">
              Esta acción marcará el registro como inactivo y conservará el historial contable y legal del cliente.
            </p>
            <div className="form-group">
              <label>Motivo de la Baja Lógica</label>
              <textarea
                rows={3}
                placeholder="Ej. Solicitud voluntaria por cambio de domicilio"
                value={bajaMotivo}
                onChange={(e) => setBajaMotivo(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowBajaModal(false)}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleBajaLogica} disabled={loading}>
                Confirmar Baja Lógica
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
