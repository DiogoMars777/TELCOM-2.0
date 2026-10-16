import React from 'react';
import { useClienteConsultaController } from '../../../../controllers/Paquetes/GestionClientesZonas/CU06_ConsultarBuscarClientes/useClienteConsultaController';
import { Search, Phone, Mail, MapPin, Filter, AlertCircle, RefreshCw } from 'lucide-react';
// Estilos acotados a esta pantalla (incluye tarjetas en móvil).
import './ClienteConsultaView.css';

// Color del badge según el estado del cliente (tema oscuro TELCOM).
// INACTIVO corresponde a un cliente dado de baja lógica.
const BADGE_ESTADO = {
  ACTIVO: 'badge-success',
  SUSPENDIDO: 'badge-warning',
  INACTIVO: 'badge-danger',
};

export default function ClienteConsultaView() {
  const {
    clientes,
    loading,
    error,
    busqueda,
    setBusqueda,
    estadoFiltro,
    setEstadoFiltro,
  } = useClienteConsultaController();

  return (
    <div className="view-panel cu06-view">
      <div className="view-header">
        <div>
          <h2>Consultar y Buscar Clientes</h2>
          <p className="subtitle">Búsqueda rápida por CI, código, nombres o contacto</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={18} /> No se pudo consultar los clientes: {error}
        </div>
      )}

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
      </div>

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
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="cu06-status">
                  <RefreshCw size={16} className="spin" /> Cargando clientes…
                </td>
              </tr>
            )}
            {!loading && clientes.length === 0 && (
              <tr>
                <td colSpan={6} className="cu06-status">Sin registros</td>
              </tr>
            )}
            {clientes.map((c) => (
              <tr key={c.id}>
                <td data-label="Código">
                  <span className="cu06-cell"><strong>{c.codigo_cliente}</strong></span>
                </td>
                <td data-label="Documento">
                  <span className="cu06-cell">{c.documento_identidad}</span>
                </td>
                <td data-label="Abonado / Cliente">
                  <span className="cu06-cell"><strong>{c.nombres} {c.apellidos}</strong></span>
                </td>
                <td data-label="Contacto">
                  <span className="cu06-cell">
                    <span className="cu06-line"><Phone size={12} /> {c.telefono}</span>
                    <span className="cu06-line cu06-muted"><Mail size={12} /> {c.email}</span>
                  </span>
                </td>
                <td data-label="Dirección / Zona">
                  <span className="cu06-cell">
                    <span className="cu06-line"><MapPin size={12} /> {c.direccion}</span>
                    <span className="cu06-line cu06-muted">{c.zona_nombre || '—'}</span>
                  </span>
                </td>
                <td data-label="Estado">
                  <span className="cu06-cell">
                    <span className={`badge ${BADGE_ESTADO[c.estado] || 'badge-info'}`}>
                      {c.estado}
                    </span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
