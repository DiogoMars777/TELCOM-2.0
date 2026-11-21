import React from 'react';
import { FileBarChart, RefreshCw } from 'lucide-react';
import { canAccessCu } from '../../../../config/access.js';
import { useReporteInteligenteController } from '../../../../controllers/Paquetes/P7_DashboardReportesInteligenciaVoz/CU31_GenerarReporteInteligenteVoz/useReporteInteligenteController.js';
import { EJEMPLOS_REPORTES } from '../../../../models/Paquetes/P7_DashboardReportesInteligenciaVoz/CU31_GenerarReporteInteligenteVoz/reporteInteligenteModel.js';
import './ReporteInteligenteView.css';

function formatear(valor, formato) {
  if (valor === null || valor === undefined) return 'Sin dato';
  if (formato === 'moneda') return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(Number(valor));
  if (formato === 'entero') return new Intl.NumberFormat('es-BO').format(Number(valor));
  return String(valor);
}

export default function ReporteInteligenteView({ user, transcripcion = '' }) {
  const permitido = canAccessCu(user, 'CU31');
  const controlador = useReporteInteligenteController(permitido, transcripcion);
  if (!permitido) {
    return <div className="alert alert-danger" role="alert">No tienes autorización para generar reportes.</div>;
  }

  return <ReporteInteligenteContenido {...controlador} />;
}

export function ReporteInteligenteContenido({ comando, setComando, generar, loading, error, datos }) {
  const reporte = datos?.reporte;
  const filtros = Object.entries(datos?.interpretacion?.filtros || {});

  return (
    <div className="view-panel cu31-view">
      <div className="view-header">
        <div>
          <h2><FileBarChart size={25} aria-hidden="true" /> Reporte inteligente</h2>
          <p className="subtitle">Solicita un reporte de TELCOM con tus propias palabras.</p>
        </div>
      </div>

      <form className="cu31-solicitud" aria-busy={loading} onSubmit={(event) => { event.preventDefault(); void generar(); }}>
        <label htmlFor="cu31-comando">Solicitud o comando transcrito</label>
        <textarea id="cu31-comando" rows={3} minLength={3} maxLength={1000} required
          value={comando} onChange={(event) => setComando(event.target.value)} disabled={loading}
          aria-describedby="cu31-ayuda" placeholder="Por ejemplo: Muéstrame los ingresos de este mes." />
        <div className="cu31-acciones">
          <p id="cu31-ayuda">Escribe o pega la transcripción que deseas consultar.</p>
          <button className="btn btn-primary" type="submit" disabled={loading || !comando.trim()}>
            {loading ? <RefreshCw size={17} className="spin" aria-hidden="true" /> : <FileBarChart size={17} aria-hidden="true" />}
            {loading ? 'Generando reporte…' : 'Generar reporte'}
          </button>
        </div>
      </form>

      <details className="cu31-ejemplos" open>
        <summary>Ejemplos de solicitudes</summary>
        <div>{EJEMPLOS_REPORTES.map((ejemplo) => (
          <button type="button" className="cu31-ejemplo" key={ejemplo} disabled={loading} onClick={() => setComando(ejemplo)}>{ejemplo}</button>
        ))}</div>
      </details>

      {loading && <p className="cu31-estado" role="status">Procesando tu solicitud y consultando los datos del sistema…</p>}
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {reporte && (
        <section className="cu31-resultado" aria-labelledby="cu31-titulo" aria-live="polite">
          <div className="cu31-interpretacion">
            <strong>Solicitud interpretada:</strong> {reporte.titulo}
            <span>Tipo: <code>{datos.interpretacion.tipo}</code></span>
            <span>{datos.interpretacion.origen === 'estructurada' ? 'Intención recibida' : 'Interpretada desde el texto'}</span>
            <dl>{filtros.length ? filtros.map(([clave, valor]) => (
              <div key={clave}><dt>{clave.replaceAll('_', ' ')}</dt><dd>{String(valor)}</dd></div>
            )) : <div><dt>Filtros</dt><dd>Sin filtros adicionales</dd></div>}</dl>
          </div>
          <h3 id="cu31-titulo">{reporte.titulo}</h3>
          <p className="cu31-resumen">{reporte.resumen}</p>
          <div className="cu31-totales">{reporte.totales.map((total) => (
            <div key={total.clave}><span>{total.etiqueta}</span><strong>{formatear(total.valor, total.formato)}</strong></div>
          ))}</div>
          {reporte.truncado && <p className="alert alert-warning" role="status">Se muestran las primeras {reporte.limite_filas} filas. Los totales incluyen todos los resultados. Refina los filtros para consultar menos filas.</p>}
          <div className="cu31-tabla">
            <table>
              <caption>{reporte.titulo}</caption>
              <thead><tr>{reporte.columnas.map((columna) => <th scope="col" key={columna.clave}>{columna.etiqueta}</th>)}</tr></thead>
              <tbody>{reporte.filas.length ? reporte.filas.map((fila, indice) => (
                <tr key={indice}>{reporte.columnas.map((columna) => <td key={columna.clave}>{formatear(fila[columna.clave], columna.formato)}</td>)}</tr>
              )) : <tr><td colSpan={reporte.columnas.length}>No hay resultados para los filtros aplicados.</td></tr>}</tbody>
            </table>
          </div>
          <p className="cu31-pie">Datos del sistema al generar la consulta{reporte.generado_en ? ` · ${new Date(reporte.generado_en).toLocaleString('es-BO', { timeZone: 'America/La_Paz' })}` : ''}</p>
        </section>
      )}
    </div>
  );
}
