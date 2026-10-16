import React from 'react';
import { usePagoMensualidadController } from '../../../../controllers/Paquetes/FacturacionCobranza/CU10_GestionarPagoMensualidad/usePagoMensualidadController';
import {
  Receipt,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  Banknote,
  QrCode,
  Building2,
  CreditCard,
  Printer,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Check,
  Lock,
} from 'lucide-react';
import './PagoMensualidadView.css';

/**
 * Vista de Gestión de Pago de Mensualidad y Cobranza (CU10).
 * Integra cobros en Efectivo, Simple QR, Transferencia Bancaria con tarjeta de débito y PayPal.
 */
export default function PagoMensualidadView() {
  const {
    pendientes,
    selectedFactura,
    busqueda,
    setBusqueda,
    loading,
    submitting,
    error,
    metodoPago,
    observaciones,
    setObservaciones,
    reciboGenerado,
    montoCobrar,
    montoRecibido,
    setMontoRecibido,
    vuelto,
    montoFaltante,
    montoUSD,
    qrEstado,
    qrTransaccion,
    qrDataUrl,
    verificarPagoQR,
    bancoOrigen,
    setBancoOrigen,
    tarjetaNumero,
    handleTarjetaNumeroChange,
    tarjetaTitular,
    setTarjetaTitular,
    tarjetaVencimiento,
    setTarjetaVencimiento,
    tarjetaCvv,
    setTarjetaCvv,
    transfVerificada,
    nroComprobanteTransf,
    procesarTransferencia,
    paypalEstado,
    paypalTransaccionId,
    abrirPayPal,
    confirmarTransaccionPayPal,
    handleSelectFactura,
    handleCambiarMetodo,
    handleRegistrarPago,
    handleNuevoCobro,
    handleImprimirRecibo,
  } = usePagoMensualidadController();

  // Nombre formateado para mostrar en la tarjeta de débito
  const bancoNombreLegible = {
    BANCO_UNION: 'Banco Unión S.A.',
    BCP: 'Banco de Crédito (BCP)',
    BNB: 'Banco Nacional de Bolivia',
    MERCANTIL: 'Mercantil Santa Cruz',
    BISA: 'Banco BISA S.A.',
    FIE: 'Banco FIE S.A.',
  }[bancoOrigen] || 'Entidad Bancaria';

  return (
    <div className="view-panel cu10-view">
      {/* Encabezado del Módulo de Cobranza */}
      <div className="view-header">
        <div>
          <h2>Gestionar Pago de Mensualidad</h2>
          <p className="subtitle">
            Caja y pasarela de cobranza: Efectivo, Simple QR, Transferencia Bancaria y PayPal
          </p>
        </div>
      </div>

      {/* Alerta de Error Global */}
      {error && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* VISTA DEL RECIBO OFICIAL (Imprimible al completar el cobro)    */}
      {/* ============================================================== */}
      {reciboGenerado ? (
        <div className="cu10-recibo-container">
          <div className="cu10-recibo-card" id="recibo-imprimible">
            {/* Cabecera del Recibo */}
            <div className="cu10-recibo-header">
              <div className="cu10-recibo-empresa">
                <h2>TELCOM BOLIVIA S.R.L.</h2>
                <p>Servicios de Telecomunicaciones e Internet de Alta Velocidad</p>
                <p>NIT: 1029384756 | Casa Matriz: Av. Cristo Redentor #450</p>
              </div>
              <div className="cu10-recibo-nro">
                <span className="badge-recibo">RECIBO DE COBRANZA</span>
                <p><strong>Nº:</strong> {reciboGenerado.codigo_recibo}</p>
                <p><strong>Fecha:</strong> {reciboGenerado.fecha_pago}</p>
              </div>
            </div>

            {/* Datos del Cliente y Servicio */}
            <div className="cu10-recibo-grid">
              <div className="cu10-recibo-item">
                <span>Cliente / Abonado:</span>
                <span>{reciboGenerado.cliente_nombre}</span>
              </div>
              <div className="cu10-recibo-item">
                <span>Documento (CI / NIT):</span>
                <span>{reciboGenerado.cliente_ci}</span>
              </div>
              <div className="cu10-recibo-item">
                <span>Código de Cliente:</span>
                <span>{reciboGenerado.cliente_codigo}</span>
              </div>
              <div className="cu10-recibo-item">
                <span>Código de Servicio:</span>
                <span>{reciboGenerado.servicio_codigo}</span>
              </div>
              <div className="cu10-recibo-item">
                <span>Plan de Internet:</span>
                <span>{reciboGenerado.plan_nombre}</span>
              </div>
              <div className="cu10-recibo-item">
                <span>Período Cancelado:</span>
                <span>{reciboGenerado.periodo}</span>
              </div>
              <div className="cu10-recibo-item">
                <span>Factura Asociada:</span>
                <span>{reciboGenerado.factura_codigo}</span>
              </div>
              <div className="cu10-recibo-item">
                <span>Método de Pago:</span>
                <span>{reciboGenerado.metodo_pago}</span>
              </div>
              {reciboGenerado.numero_transaccion && (
                <div className="cu10-recibo-item" style={{ gridColumn: '1 / -1' }}>
                  <span>Nº de Transacción / Comprobante:</span>
                  <span>{reciboGenerado.numero_transaccion}</span>
                </div>
              )}
            </div>

            {/* Total Pagado */}
            <div className="cu10-recibo-total-box">
              <span>Total Pagado:</span>
              <span className="monto-grande">Bs. {Number(reciboGenerado.monto).toFixed(2)}</span>
            </div>

            {/* Pie de Recibo Oficial */}
            <div className="cu10-recibo-footer">
              <span>Estado en BD: <strong>PAGADO (Confirmado)</strong></span>
              <span>¡Gracias por su puntualidad! TELCOM Redes</span>
            </div>
          </div>

          {/* Acciones del Recibo */}
          <div className="cu10-recibo-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleImprimirRecibo}
            >
              <Printer size={18} />
              <span>Imprimir Recibo Oficial</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleNuevoCobro}
            >
              <RotateCcw size={18} />
              <span>Registrar Otro Cobro</span>
            </button>
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* PANEL DE COBRANZA PRINCIPAL (A dos columnas responsivas)      */
        /* ============================================================== */
        <div className="cu10-layout">
          {/* COLUMNA 1: Listado de Facturas Pendientes desde BD */}
          <div className="cu10-pendientes-panel">
            <div className="cu10-pendientes-header">
              <h3>Facturas Pendientes</h3>
              <span className="cu10-pendientes-counter">
                {pendientes.length} por cobrar
              </span>
            </div>

            {/* Buscador de Facturas por Cliente / CI / Código */}
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Buscar por cliente, CI o factura..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                aria-label="Buscar facturas pendientes"
              />
              {loading && <RefreshCw size={14} className="spin" />}
            </div>

            {/* Lista de Facturas Seleccionables */}
            <div className="cu10-pendientes-list">
              {pendientes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8' }}>
                  {loading ? 'Cargando facturas…' : 'No hay facturas pendientes de cobro.'}
                </div>
              ) : (
                pendientes.map((f) => {
                  const isSelected = selectedFactura?.id === f.id;
                  const clienteNom = f.cliente
                    ? `${f.cliente.nombres ?? ''} ${f.cliente.apellidos ?? ''}`.trim()
                    : f.cliente_nombre || 'Cliente Particular';

                  return (
                    <div
                      key={f.id}
                      className={`cu10-factura-card ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => handleSelectFactura(f)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="cu10-factura-row-top">
                        <span className="cu10-factura-code">{f.codigo_factura}</span>
                        <span className="cu10-factura-monto">Bs. {Number(f.monto).toFixed(2)}</span>
                      </div>
                      <div className="cu10-factura-cliente">{clienteNom}</div>
                      <div className="cu10-factura-row-sub">
                        <span>Período: {f.periodo}</span>
                        <span>Vence: {f.fecha_vencimiento ? String(f.fecha_vencimiento).substring(0, 10) : '—'}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMNA 2: Proceso de Cobro y Métodos de Pago */}
          <div className="cu10-cobranza-panel">
            {!selectedFactura ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                <Receipt size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                <h3>Seleccione una factura pendiente</h3>
                <p>Elija una factura de la lista izquierda para procesar el cobro y emitir el recibo.</p>
              </div>
            ) : (
              <form onSubmit={handleRegistrarPago}>
                {/* Resumen de la Factura Activa */}
                <div className="cu10-detalle-factura-box">
                  <div className="cu10-detalle-item">
                    <span className="cu10-detalle-label">Factura Nº</span>
                    <span className="cu10-detalle-val">{selectedFactura.codigo_factura}</span>
                  </div>
                  <div className="cu10-detalle-item">
                    <span className="cu10-detalle-label">Abonado</span>
                    <span className="cu10-detalle-val">
                      {selectedFactura.cliente
                        ? `${selectedFactura.cliente.nombres ?? ''} ${selectedFactura.cliente.apellidos ?? ''}`.trim()
                        : selectedFactura.cliente_nombre || '—'}
                    </span>
                  </div>
                  <div className="cu10-detalle-item">
                    <span className="cu10-detalle-label">Documento</span>
                    <span className="cu10-detalle-val">{selectedFactura.cliente?.documento_identidad || '—'}</span>
                  </div>
                  <div className="cu10-detalle-item">
                    <span className="cu10-detalle-label">Período</span>
                    <span className="cu10-detalle-val">{selectedFactura.periodo}</span>
                  </div>
                  <div className="cu10-detalle-item" style={{ gridColumn: '1 / -1' }}>
                    <span className="cu10-detalle-label">Total a Cobrar</span>
                    <span className="cu10-detalle-val destacado">Bs. {montoCobrar.toFixed(2)}</span>
                  </div>
                </div>

                {/* Selector de Métodos de Pago (4 opciones: Efectivo, QR, Transferencia, PayPal) */}
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
                    Seleccione el Método de Pago:
                  </label>
                  <div className="cu10-metodos-grid">
                    <button
                      type="button"
                      className={`cu10-metodo-btn ${metodoPago === 'EFECTIVO' ? 'active' : ''}`}
                      onClick={() => handleCambiarMetodo('EFECTIVO')}
                    >
                      <Banknote size={22} />
                      <span>Efectivo</span>
                    </button>

                    <button
                      type="button"
                      className={`cu10-metodo-btn ${metodoPago === 'QR' ? 'active' : ''}`}
                      onClick={() => handleCambiarMetodo('QR')}
                    >
                      <QrCode size={22} />
                      <span>Simple QR</span>
                    </button>

                    <button
                      type="button"
                      className={`cu10-metodo-btn ${metodoPago === 'TRANSFERENCIA' ? 'active' : ''}`}
                      onClick={() => handleCambiarMetodo('TRANSFERENCIA')}
                    >
                      <Building2 size={22} />
                      <span>Transferencia</span>
                    </button>

                    <button
                      type="button"
                      className={`cu10-metodo-btn ${metodoPago === 'PAYPAL' ? 'active' : ''}`}
                      onClick={() => handleCambiarMetodo('PAYPAL')}
                    >
                      <CreditCard size={22} />
                      <span>PayPal</span>
                    </button>
                  </div>
                </div>

                {/* ============================================================== */}
                {/* 1. INTERFAZ PARA PAGO EN EFECTIVO                             */}
                {/* ============================================================== */}
                {metodoPago === 'EFECTIVO' && (
                  <div className="cu10-metodo-content">
                    <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      Cobro en Ventanilla (Efectivo)
                    </h4>
                    <div className="cu10-efectivo-calc">
                      <div className="form-group">
                        <label>Monto Recibido del Cliente (Bs.)</label>
                        <input
                          type="number"
                          step="0.50"
                          min="0"
                          required
                          value={montoRecibido}
                          onChange={(e) => setMontoRecibido(e.target.value)}
                          placeholder="Ej. 250.00"
                        />
                        <div className="cu10-quick-cash">
                          <button
                            type="button"
                            className="cu10-cash-chip"
                            onClick={() => setMontoRecibido(String(montoCobrar))}
                          >
                            Exacto (Bs. {montoCobrar})
                          </button>
                          <button
                            type="button"
                            className="cu10-cash-chip"
                            onClick={() => setMontoRecibido(String(Math.ceil(montoCobrar / 50) * 50))}
                          >
                            Bs. {Math.ceil(montoCobrar / 50) * 50}
                          </button>
                          <button
                            type="button"
                            className="cu10-cash-chip"
                            onClick={() => setMontoRecibido(String(Math.ceil(montoCobrar / 100) * 100))}
                          >
                            Bs. {Math.ceil(montoCobrar / 100) * 100}
                          </button>
                        </div>
                      </div>

                      <div className={`cu10-vuelto-card ${montoFaltante > 0 ? 'faltante' : ''}`}>
                        <span className="cu10-vuelto-label">
                          {montoFaltante > 0 ? 'Faltante por Cubrir' : 'Cambio / Vuelto a Entregar'}
                        </span>
                        <span className="cu10-vuelto-monto">
                          Bs. {montoFaltante > 0 ? montoFaltante.toFixed(2) : vuelto.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ============================================================== */}
                {/* 2. INTERFAZ PARA SIMPLE QR (Verificar Pago -> Confirmado)     */}
                {/* ============================================================== */}
                {metodoPago === 'QR' && (
                  <div className="cu10-metodo-content">
                    {/* Tarjeta Oficial Simple QR Interbancario */}
                    <div className="cu10-qr-card-container">
                      <div className="cu10-qr-header">
                        <div className="cu10-qr-brand-badge">
                          <span className="cu10-qr-brand-text">SIMPLE</span>
                          <span className="cu10-qr-brand-sub">PAGO MÓVIL</span>
                        </div>
                        <span className="cu10-qr-interbank-text">Interbancario ASOBAN</span>
                      </div>

                      <div className="cu10-qr-display-frame">
                        {qrDataUrl ? (
                          <div className="cu10-qr-image-wrapper">
                            <img
                              src={qrDataUrl}
                              alt="Código QR Simple Oficial"
                              className="cu10-qr-img"
                            />
                            {/* Insignia central auténtica de Simple QR */}
                            <div className="cu10-qr-center-logo">
                              <span>QR</span>
                            </div>
                          </div>
                        ) : (
                          <div className="cu10-qr-placeholder">
                            <span className="spin">⏳</span>
                            <span>Generando código QR...</span>
                          </div>
                        )}
                      </div>

                      <div className="cu10-qr-amount-banner">
                        <span className="cu10-qr-amount-label">Monto a Cobrar</span>
                        <span className="cu10-qr-amount-val">Bs. {montoCobrar.toFixed(2)}</span>
                      </div>

                      <p className="cu10-qr-instruction">
                        Escanea desde cualquier app bancaria de Bolivia (Banco Unión, BCP, BNB, Mercantil, BISA, Ganadero, FIE, etc.)
                      </p>

                      {/* Estado y verificación del pago */}
                      <div className="cu10-qr-action-area">
                        {qrEstado === 'CONFIRMADO' ? (
                          <div className="cu10-status-pill confirmado">
                            <CheckCircle2 size={16} />
                            <span>Pago Confirmado (Tx: {qrTransaccion})</span>
                          </div>
                        ) : (
                          <div className="cu10-status-pill esperando">
                            <span className="spin">⏳</span>
                            <span>Esperando escaneo del cliente...</span>
                          </div>
                        )}

                        <div className="cu10-qr-buttons">
                          {qrEstado === 'CONFIRMADO' ? (
                            <button
                              type="button"
                              className="btn btn-success btn-sm full-width"
                              disabled
                            >
                              <Check size={14} /> Pago Confirmado
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm full-width"
                              onClick={verificarPagoQR}
                            >
                              <ShieldCheck size={14} /> Verificar Pago
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ============================================================== */}
                {/* 3. INTERFAZ PARA TRANSFERENCIA BANCARIA (Con Tarjeta)         */}
                {/* ============================================================== */}
                {metodoPago === 'TRANSFERENCIA' && (
                  <div className="cu10-metodo-content">
                    <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      Transferencia Bancaria / Débito en Línea
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
                      Ingrese los datos de la tarjeta de débito o cuenta bancaria del abonado para autorizar la transferencia:
                    </p>

                    {/* Tarjeta de Débito Bancaria Realista (Mockup) */}
                    <div className="cu10-card-preview">
                      <div className="cu10-card-top">
                        <div className="cu10-card-chip" />
                        <span className="cu10-card-bank">{bancoNombreLegible}</span>
                      </div>
                      <div className="cu10-card-number">
                        {tarjetaNumero || '•••• •••• •••• ••••'}
                      </div>
                      <div className="cu10-card-bottom">
                        <div className="cu10-card-holder-group">
                          <span className="cu10-card-holder-label">Titular de la Cuenta</span>
                          <span className="cu10-card-holder-name">{tarjetaTitular || 'TITULAR'}</span>
                        </div>
                        <div className="cu10-card-expires-group">
                          <span className="cu10-card-expires-label">Vence</span>
                          <span className="cu10-card-expires-val">{tarjetaVencimiento || 'MM/AA'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Formulario de Entrada de la Tarjeta */}
                    <div className="form-grid">
                      <div className="form-group full-width">
                        <label>Entidad Financiera (Banco)</label>
                        <select
                          value={bancoOrigen}
                          onChange={(e) => {
                            setBancoOrigen(e.target.value);
                            setTransfVerificada(false);
                          }}
                        >
                          <option value="BANCO_UNION">Banco Unión S.A.</option>
                          <option value="BCP">Banco de Crédito de Bolivia (BCP)</option>
                          <option value="BNB">Banco Nacional de Bolivia (BNB)</option>
                          <option value="MERCANTIL">Banco Mercantil Santa Cruz</option>
                          <option value="BISA">Banco BISA S.A.</option>
                          <option value="FIE">Banco FIE S.A.</option>
                        </select>
                      </div>

                      <div className="form-group full-width">
                        <label>Número de Tarjeta de Débito / Cuenta</label>
                        <input
                          type="text"
                          required
                          maxLength={19}
                          placeholder="4552 •••• •••• 8492"
                          value={tarjetaNumero}
                          onChange={(e) => handleTarjetaNumeroChange(e.target.value)}
                        />
                      </div>

                      <div className="form-group full-width">
                        <label>Nombre del Titular de la Cuenta</label>
                        <input
                          type="text"
                          required
                          placeholder="Nombre y Apellidos del Titular"
                          value={tarjetaTitular}
                          onChange={(e) => {
                            setTarjetaTitular(e.target.value.toUpperCase());
                            setTransfVerificada(false);
                          }}
                        />
                      </div>

                      <div className="form-group">
                        <label>Vencimiento (MM/AA)</label>
                        <input
                          type="text"
                          required
                          maxLength={5}
                          placeholder="08/28"
                          value={tarjetaVencimiento}
                          onChange={(e) => {
                            setTarjetaVencimiento(e.target.value);
                            setTransfVerificada(false);
                          }}
                        />
                      </div>

                      <div className="form-group">
                        <label>Código de Seguridad (CVV)</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="password"
                            required
                            maxLength={4}
                            placeholder="742"
                            value={tarjetaCvv}
                            onChange={(e) => {
                              setTarjetaCvv(e.target.value.replace(/\D/g, ''));
                              setTransfVerificada(false);
                            }}
                          />
                          <Lock size={14} style={{ position: 'absolute', right: 12, top: 12, color: '#94a3b8' }} />
                        </div>
                      </div>
                    </div>

                    {/* Botón de Pago / Procesamiento */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                      {transfVerificada ? (
                        <button
                          type="button"
                          className="btn btn-success"
                          disabled
                        >
                          <CheckCircle2 size={16} />
                          <span>Transferencia Autorizada</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={procesarTransferencia}
                        >
                          <ShieldCheck size={16} />
                          <span>Pagar Bs. {montoCobrar.toFixed(2)}</span>
                        </button>
                      )}

                      {transfVerificada && (
                        <span style={{ fontSize: '0.82rem', color: '#34d399', fontWeight: 600 }}>
                          ✓ Transacción aprobada por la red bancaria ({nroComprobanteTransf}).
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* ============================================================== */}
                {/* 4. INTERFAZ PARA PAYPAL (Redirección oficial y confirmación)  */}
                {/* ============================================================== */}
                {metodoPago === 'PAYPAL' && (
                  <div className="cu10-metodo-content">
                    <div className="cu10-paypal-box">
                      <div className="cu10-paypal-header">
                        <div className="cu10-paypal-logo">
                          Pay<span>Pal</span> Checkout
                        </div>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Pasarela Internacional</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Monto en Bolivianos:</div>
                          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>
                            Bs. {montoCobrar.toFixed(2)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Equivalente en Dólares (USD):</div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffc439' }}>
                            ${montoUSD} USD
                          </div>
                        </div>
                      </div>

                      <p style={{ fontSize: '0.82rem', color: '#cbd5e1', margin: 0 }}>
                        Al pulsar el botón se abrirá la página oficial de <strong>PayPal</strong> con el monto
                        y concepto de la factura listos para autorizar el cobro.
                      </p>

                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn-paypal-checkout"
                          onClick={abrirPayPal}
                        >
                          <ExternalLink size={18} />
                          <span>Pagar con PayPal (Abrir PayPal)</span>
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={confirmarTransaccionPayPal}
                        >
                          Confirmar Recepción de Fondos
                        </button>
                      </div>

                      {paypalEstado === 'CONFIRMADO' && (
                        <div className="cu10-status-pill confirmado">
                          <CheckCircle2 size={16} />
                          <span>Transacción confirmada por PayPal: <strong>{paypalTransaccionId}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Observaciones generales del cobro */}
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label>Observaciones (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej. Pago realizado por un tercero / observación de caja"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                  />
                </div>

                {/* Botón Principal: Confirmar Cobro y Guardar en PostgreSQL */}
                <div className="form-footer" style={{ marginTop: '1.25rem' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={
                      submitting ||
                      !selectedFactura ||
                      (metodoPago === 'EFECTIVO' && montoFaltante > 0) ||
                      (metodoPago === 'QR' && qrEstado !== 'CONFIRMADO') ||
                      (metodoPago === 'TRANSFERENCIA' && !transfVerificada) ||
                      (metodoPago === 'PAYPAL' && paypalEstado !== 'CONFIRMADO')
                    }
                  >
                    <Receipt size={18} />
                    <span>
                      {submitting
                        ? 'Registrando en Base de Datos...'
                        : `Confirmar Cobro de Bs. ${montoCobrar.toFixed(2)} y Emitir Recibo`}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
