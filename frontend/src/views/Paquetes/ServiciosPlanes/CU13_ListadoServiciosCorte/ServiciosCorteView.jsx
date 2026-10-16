import React from 'react';
import { useServiciosCorteController } from '../../../../controllers/Paquetes/ServiciosPlanes/CU13_ListadoServiciosCorte/useServiciosCorteController';
import {
  Scissors,
  AlertCircle,
  RefreshCw,
  FileSpreadsheet,
  Printer,
  Search,
  MapPin,
  Calendar,
  Phone,
  CreditCard,
  XCircle,
  Wifi
} from 'lucide-react';

export default function ServiciosCorteView({ onIrACorte }) {
  const {
    servicios,
    zonas,
    loading,
    error,
    reload,
    diasMora,
    setDiasMora,
    zonaId,
    setZonaId,
    buscar,
    setBuscar,
    page,
    setPage,
    meta,
    limpiarFiltros,
    exportarCsv,
    imprimirHojaRuta,
  } = useServiciosCorteController();

  const hayFiltrosActivos = Boolean(buscar || zonaId || diasMora !== 5);

  return (
    <div className="view-panel printable-area">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-area, .printable-area * {
            visibility: visible;
          }
          .printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: #fff !important;
            color: #000 !important;
          }
          .no-print {
            display: none !important;
          }
          .data-table th, .data-table td {
            color: #000 !important;
            border-bottom: 1px solid #ccc !important;
            padding: 6px 8px !important;
          }
          .data-table th {
            background-color: #f1f5f9 !important;
          }
        }
      `}</style>

      {/* Cabecera del Panel */}
      <div className="view-header no-print">
        <div>
          <h2>Consultar Listado de Servicios para Corte</h2>
          <p className="subtitle">Lotes de abonados con mora vencida listos para suspensión técnica</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={imprimirHojaRuta}
            disabled={loading || servicios.length === 0}
            title="Imprimir orden o listado técnico de corte"
          >
            <Printer size={16} /> Hoja de Ruta
          </button>
          <button
            className="btn btn-secondary"
            onClick={exportarCsv}
            disabled={loading || servicios.length === 0}
            title="Descargar listado en formato Excel / CSV"
          >
            <FileSpreadsheet size={16} /> Exportar Excel
          </button>
          <button className="btn btn-secondary" onClick={reload} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger no-print" role="alert">
          <AlertCircle size={18} /> No se pudo cargar el listado de servicios para corte: {error}
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="filters-bar no-print" style={{ flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <div className="search-box" style={{ minWidth: '220px' }}>
          <Search size={16} style={{ color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Buscar por cliente, CI, IP o código…"
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
          />
        </div>

        <div className="filter-item">
          <MapPin size={16} style={{ color: '#94a3b8' }} />
          <select value={zonaId} onChange={(e) => setZonaId(e.target.value)}>
            <option value="">Todas las Zonas</option>
            {zonas.map((z) => (
              <option key={z.id} value={z.id}>
                {z.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <Calendar size={16} style={{ color: '#94a3b8' }} />
          <select value={diasMora} onChange={(e) => setDiasMora(Number(e.target.value))}>
            <option value="0">Cualquier mora (≥ 0 días)</option>
            <option value="5">Tolerancia base (≥ 5 días)</option>
            <option value="10">Mora moderada (≥ 10 días)</option>
            <option value="15">Mora crítica (≥ 15 días)</option>
            <option value="30">Mora severa (≥ 30 días)</option>
          </select>
        </div>

        {hayFiltrosActivos && (
          <button
            className="btn btn-sm btn-secondary"
            onClick={limpiarFiltros}
            title="Restablecer filtros a valores por defecto"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <XCircle size={14} /> Limpiar
          </button>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          <span className="badge badge-warning">
            {meta?.total ?? servicios.length} {(meta?.total ?? servicios.length) === 1 ? 'abonado elegible' : 'abonados elegibles'}
          </span>
        </div>
      </div>

      {/* Encabezado visible únicamente en impresión física */}
      <div className="only-print" style={{ display: 'none', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>TELCOM - Hoja de Ruta de Cortes Técnicos</h2>
        <p style={{ margin: '0.25rem 0', color: '#64748b' }}>
          Fecha de emisión: {new Date().toLocaleDateString('es-BO')} | Total de abonados a cortar: {meta?.total ?? servicios.length}
        </p>
      </div>

      {/* Tabla de Servicios para Corte */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Servicio</th>
              <th>Cliente Deudor</th>
              <th>Zona de Cobertura</th>
              <th>Plan</th>
              <th>IP Asignada</th>
              <th>Días de Mora</th>
              <th>Deuda Pendiente</th>
              <th className="no-print">Acción Operativa</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                  <RefreshCw size={18} className="spin" /> Consultando servicios en mora…
                </td>
              </tr>
            )}
            {!loading && servicios.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: '2.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <p style={{ margin: 0, fontWeight: 500 }}>No se encontraron servicios que cumplan con los criterios de corte seleccionados.</p>
                    {hayFiltrosActivos && (
                      <button className="btn btn-sm btn-secondary" onClick={limpiarFiltros} style={{ marginTop: '0.5rem' }}>
                        <XCircle size={14} /> Restablecer filtros
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
            {!loading && servicios.map((s) => (
              <tr key={s.id}>
                <td>
                  <strong>{s.codigo_servicio}</strong>
                </td>
                <td>
                  <div>
                    <strong>{s.cliente_nombre}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', gap: '0.6rem', marginTop: '0.15rem' }}>
                      {s.cliente_ci && <span><CreditCard size={12} style={{ verticalAlign: 'middle' }} /> CI: {s.cliente_ci}</span>}
                      {s.cliente_telefono && <span><Phone size={12} style={{ verticalAlign: 'middle' }} /> {s.cliente_telefono}</span>}
                    </div>
                  </div>
                </td>
                <td>
                  <span className="badge badge-info">{s.zona_nombre}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span>{s.plan_nombre}</span>
                    {s.velocidad_mbps && (
                      <span className="badge badge-primary" style={{ width: 'fit-content', fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                        <Wifi size={10} style={{ marginRight: '0.2rem' }} /> {s.velocidad_mbps} Mbps
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <code>{s.ip_asignada || '—'}</code>
                </td>
                <td>
                  <strong className="text-danger" style={{ color: '#ef4444' }}>
                    {s.dias_mora ?? 0} días
                  </strong>
                </td>
                <td>
                  <div>
                    <strong className="text-danger" style={{ color: '#ef4444', fontSize: '0.95rem' }}>
                      {s.monto_deuda != null ? `Bs. ${Number(s.monto_deuda).toFixed(2)}` : '—'}
                    </strong>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      {s.mensualidades_pendientes} {s.mensualidades_pendientes === 1 ? 'mensualidad' : 'mensualidades'}
                    </div>
                  </div>
                </td>
                <td className="no-print">
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => onIrACorte && onIrACorte(s)}
                    title="Proceder al corte técnico de este servicio"
                  >
                    <Scissors size={14} /> Proceder a Corte
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Barra de Paginación */}
      {!loading && meta && meta.last_page > 1 && (
        <div
          className="pagination-bar no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1rem',
            padding: '0.75rem 0.5rem',
            borderTop: '1px solid var(--border-color)',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}
        >
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
            Página <strong>{meta.current_page}</strong> de <strong>{meta.last_page}</strong> (Mostrando {servicios.length} de {meta.total} registros)
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-sm btn-secondary"
              disabled={page <= 1 || loading}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              ◀ Anterior
            </button>
            <button
              className="btn btn-sm btn-secondary"
              disabled={page >= meta.last_page || loading}
              onClick={() => setPage(p => p + 1)}
            >
              Siguiente ▶
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
