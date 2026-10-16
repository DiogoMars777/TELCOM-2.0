import React from 'react';
import {
  AlertCircle, CalendarDays, ChevronLeft, ChevronRight, Download, Eye,
  FileSearch, Filter, History, Printer, ReceiptText, RefreshCw, Search, X,
} from 'lucide-react';
import { useHistorialPagosController } from '../../../../controllers/Paquetes/FacturacionCobranza/CU11_ConsultarHistorialPagos/useHistorialPagosController.js';
import './HistorialPagosView.css';

const moneda = (valor) => new Intl.NumberFormat('es-BO', {
  style: 'currency', currency: 'BOB', minimumFractionDigits: 2,
}).format(Number(valor || 0));

const fechaHora = (valor) => valor
  ? new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(String(valor).replace(' ', 'T')))
  : 'Sin fecha';

function Comprobante({ pago, onClose }) {
  const imprimir = () => window.print();
  return (
    <div className="cu11-modal" role="dialog" aria-modal="true" aria-labelledby="titulo-comprobante">
      <button className="cu11-modal-backdrop" aria-label="Cerrar comprobante" onClick={onClose} />
      <article className="cu11-receipt">
        <header className="cu11-receipt-actions no-print">
          <button className="btn btn-secondary" onClick={onClose}><X size={17} /> Cerrar</button>
          <div>
            <button className="btn btn-secondary" onClick={imprimir}><Printer size={17} /> Imprimir</button>
            <button className="btn btn-primary" onClick={imprimir} title="Selecciona Guardar como PDF en el diálogo de impresión">
              <Download size={17} /> Descargar PDF
            </button>
          </div>
        </header>
        <div className="cu11-receipt-paper">
          <div className="cu11-receipt-brand">
            <div className="cu11-receipt-logo"><ReceiptText size={27} /></div>
            <div><strong>TELCOM</strong><span>Servicios de Internet</span></div>
            <div className="cu11-receipt-number"><small>COMPROBANTE</small><b>{pago.codigo_recibo}</b></div>
          </div>
          <h2 id="titulo-comprobante">Comprobante de pago</h2>
          <p className="cu11-receipt-date">Registrado el {fechaHora(pago.fecha_pago)}</p>
          <section className="cu11-receipt-grid">
            <div><span>Cliente</span><strong>{pago.cliente_nombre}</strong></div>
            <div><span>Código de cliente</span><strong>{pago.cliente_codigo || 'No registrado'}</strong></div>
            <div><span>Servicio</span><strong>{pago.servicio_codigo || 'No registrado'}</strong></div>
            <div><span>CI</span><strong>{pago.cliente_ci || 'No registrado'}</strong></div>
          </section>
          <div className="cu11-receipt-table-wrap">
            <table className="cu11-receipt-table">
              <thead><tr><th>Periodo cancelado</th><th>Factura</th><th>Monto aplicado</th></tr></thead>
              <tbody>
                {(pago.detalles?.length ? pago.detalles : [{ monto_pagado: pago.monto_pagado, mensualidad: {} }]).map((detalle, i) => (
                  <tr key={detalle.id || i}>
                    <td>{detalle.mensualidad?.periodo || pago.periodos?.[i] || 'Pago registrado'}</td>
                    <td>{detalle.mensualidad?.codigo_factura || detalle.mensualidad?.codigoFactura || '—'}</td>
                    <td>{moneda(detalle.monto_pagado ?? detalle.montoAplicado ?? pago.monto_pagado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <section className="cu11-receipt-summary">
            <div><span>Método de pago</span><strong>{pago.metodo_pago}</strong></div>
            {pago.numero_transaccion && <div><span>N.º de transacción</span><strong>{pago.numero_transaccion}</strong></div>}
            <div className="cu11-receipt-total"><span>Total pagado</span><strong>{moneda(pago.monto_pagado)}</strong></div>
          </section>
          <footer className="cu11-receipt-footer">
            <span>Registrado por: <strong>{pago.cajero_nombre}</strong></span>
            <span>Este comprobante fue regenerado desde el registro inmutable del pago.</span>
          </footer>
        </div>
      </article>
    </div>
  );
}

export default function HistorialPagosView() {
  const c = useHistorialPagosController();
  return (
    <div className="view-panel cu11-page">
      <header className="cu11-heading">
        <div className="cu11-heading-icon"><History size={25} /></div>
        <div><h2>Historial de pagos</h2><p>Consulta los cobros registrados y recupera sus comprobantes sin alterar la información financiera.</p></div>
      </header>

      {c.error && <div className="alert alert-danger" role="alert"><AlertCircle size={18} /><span>{c.error}</span><button onClick={c.recargar}>Reintentar</button></div>}

      <form className="cu11-filters" onSubmit={c.aplicarFiltros}>
        <div className="cu11-filter-title"><Filter size={18} /><strong>Buscar y filtrar</strong></div>
        <label className="cu11-field cu11-search"><span>Cliente, CI, servicio o comprobante</span><div><Search size={17} /><input value={c.filtros.buscar} onChange={(e) => c.actualizarFiltro('buscar', e.target.value)} placeholder="Ej.: CLI-001, 7845123 o SRV-001" /></div></label>
        <label className="cu11-field"><span>Tipo de servicio</span><select value={c.filtros.plan_id} onChange={(e) => c.actualizarFiltro('plan_id', e.target.value)}><option value="">Todos los tipos de servicio</option>{c.opciones.planes.map((plan) => <option key={plan.id} value={plan.id}>{plan.nombre}{plan.velocidad_mbps ? ` — ${plan.velocidad_mbps} Mbps` : ''}</option>)}</select></label>
        <label className="cu11-field"><span>Periodo</span><input type="month" value={c.filtros.periodo} onChange={(e) => c.actualizarFiltro('periodo', e.target.value)} /></label>
        <label className="cu11-field"><span>Método de pago</span><select value={c.filtros.metodo_pago} onChange={(e) => c.actualizarFiltro('metodo_pago', e.target.value)}><option value="">Todos los métodos</option>{c.opciones.metodos.map((m) => <option key={m} value={m}>{m}</option>)}</select></label>
        <label className="cu11-field"><span>Desde</span><input type="date" value={c.filtros.fecha_desde} onChange={(e) => c.actualizarFiltro('fecha_desde', e.target.value)} /></label>
        <label className="cu11-field"><span>Hasta</span><input type="date" min={c.filtros.fecha_desde || undefined} value={c.filtros.fecha_hasta} onChange={(e) => c.actualizarFiltro('fecha_hasta', e.target.value)} /></label>
        <div className="cu11-filter-actions"><button type="button" className="btn btn-secondary" onClick={c.limpiarFiltros}>Limpiar</button><button className="btn btn-primary" type="submit"><Search size={16} /> Consultar</button></div>
      </form>

      <section className="cu11-results" aria-busy={c.loading}>
        <div className="cu11-results-head"><div className="cu11-results-summary"><span className="cu11-results-title">Resultados encontrados</span><div><strong>{c.meta.total} pago{c.meta.total === 1 ? '' : 's'}</strong><span> encontrado{c.meta.total === 1 ? '' : 's'}</span></div></div><button className="btn btn-secondary" onClick={c.recargar} disabled={c.loading}><RefreshCw className={c.loading ? 'spin' : ''} size={16} /> Actualizar</button></div>
        {c.loading ? <div className="cu11-state"><RefreshCw className="spin" size={28} /><strong>Consultando pagos…</strong></div>
          : c.pagos.length === 0 ? <div className="cu11-state"><FileSearch size={38} /><strong>No existen pagos registrados</strong><span>Prueba con otros criterios de búsqueda.</span></div>
          : <>
            <div className="cu11-table-wrap"><table className="cu11-table"><thead><tr><th>Comprobante</th><th>Cliente y servicio</th><th>Periodos</th><th>Fecha</th><th>Método</th><th>Monto</th><th><span className="sr-only">Acciones</span></th></tr></thead><tbody>{c.pagos.map((p) => <tr key={p.id}><td data-label="Comprobante"><strong>{p.codigo_recibo}</strong></td><td data-label="Cliente y servicio"><strong>{p.cliente_nombre}</strong><small>{p.cliente_codigo || 'Sin código'} · {p.servicio_codigo || 'Sin servicio'}</small></td><td data-label="Periodos">{p.periodos?.join(', ') || '—'}</td><td data-label="Fecha"><span className="cu11-date"><CalendarDays size={15} />{fechaHora(p.fecha_pago)}</span></td><td data-label="Método"><span className="cu11-method">{p.metodo_pago}</span></td><td data-label="Monto"><strong className="cu11-amount">{moneda(p.monto_pagado)}</strong></td><td><button className="cu11-view" onClick={() => c.abrirDetalle(p.id)} disabled={c.loadingDetalle}><Eye size={17} /> Ver comprobante</button></td></tr>)}</tbody></table></div>
            <nav className="cu11-pagination" aria-label="Paginación"><button disabled={c.meta.current_page <= 1} onClick={() => c.cambiarPagina(c.meta.current_page - 1)}><ChevronLeft size={17} /> Anterior</button><span>Página <strong>{c.meta.current_page}</strong> de {c.meta.last_page}</span><button disabled={c.meta.current_page >= c.meta.last_page} onClick={() => c.cambiarPagina(c.meta.current_page + 1)}>Siguiente <ChevronRight size={17} /></button></nav>
          </>}
      </section>
      {c.detalle && <Comprobante pago={c.detalle} onClose={c.cerrarDetalle} />}
    </div>
  );
}
