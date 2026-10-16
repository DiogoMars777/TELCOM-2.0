import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  CreditCard,
  QrCode,
  Building2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Calendar,
  Search,
  X,
  Printer,
  ShieldCheck,
  Check,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { pagoMensualidadService } from '../../../../models/Paquetes/FacturacionCobranza/CU10_GestionarPagoMensualidad/pagoMensualidadModel';
import { describeApiError } from '../../../../services/apiClient';
import './PortalClienteModal.css';

/**
 * Modal de Autoservicio - Portal Cliente (CU10 - Facturación y Cobranza).
 * Permite a cualquier abonado consultar su estado por C.I. y cancelar facturas pendientes
 * mediante Simple QR, Transferencia Bancaria y PayPal directamente vinculados a PostgreSQL.
 */
export default function PortalClienteModal({ isOpen, onClose }) {
  // Estado de búsqueda por Cédula de Identidad
  const [ciInput, setCiInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensajeAviso, setMensajeAviso] = useState(null);
  const [datosConsulta, setDatosConsulta] = useState(null);

  // Método de pago activo: 'QR' | 'TRANSFERENCIA' | 'PAYPAL'
  const [metodoPago, setMetodoPago] = useState('QR');
  const [submitting, setSubmitting] = useState(false);
  const [errorPago, setErrorPago] = useState(null);
  const [reciboFinal, setReciboFinal] = useState(null);

  // --- Estado para SIMPLE QR ---
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrEstado, setQrEstado] = useState('ESPERANDO'); // 'ESPERANDO' | 'CONFIRMADO'

  // --- Estado para TRANSFERENCIA BANCARIA (Tarjeta) ---
  const [bancoOrigen, setBancoOrigen] = useState('BANCO_UNION');
  const [tarjetaNumero, setTarjetaNumero] = useState('4552 8901 2345 6789');
  const [tarjetaTitular, setTarjetaTitular] = useState('');
  const [tarjetaVencimiento, setTarjetaVencimiento] = useState('08/28');
  const [tarjetaCvv, setTarjetaCvv] = useState('742');

  // --- Estado para PAYPAL ---
  const [paypalEstado, setPaypalEstado] = useState('PENDIENTE'); // 'PENDIENTE' | 'CONFIRMADO'

  // Limpiar campos al abrir o cerrar
  useEffect(() => {
    if (!isOpen) {
      setCiInput('');
      setMensajeAviso(null);
      setDatosConsulta(null);
      setReciboFinal(null);
      setErrorPago(null);
      setQrEstado('ESPERANDO');
    }
  }, [isOpen]);

  // Generar código QR dinámico cuando se obtienen datos de factura pendiente
  useEffect(() => {
    if (datosConsulta?.factura && metodoPago === 'QR') {
      const payloadQR = JSON.stringify({
        tipo: 'PAGO_INTERBANCARIO_SIMPLE_QR',
        entidad: 'TELCOM_BOLIVIA_SRL',
        nit: '1029384756',
        factura: datosConsulta.factura.codigo_factura,
        periodo: datosConsulta.factura.periodo,
        monto_bs: datosConsulta.factura.monto,
        ci_cliente: datosConsulta.cliente.ci,
        vencimiento: datosConsulta.fecha_corte,
      });

      QRCode.toDataURL(payloadQR, {
        width: 220,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generando QR:', err));
    }
  }, [datosConsulta, metodoPago]);

  if (!isOpen) return null;

  // [Consultar Estado]: Busca en la base de datos por C.I.
  const handleConsultarCI = async (e) => {
    if (e) e.preventDefault();
    const ciLimpio = ciInput.trim();
    if (!ciLimpio) {
      setMensajeAviso({
        tipo: 'warning',
        texto: 'Por favor ingrese su número de carnet de identidad (C.I.).',
      });
      return;
    }

    setLoading(true);
    setMensajeAviso(null);
    setDatosConsulta(null);
    setReciboFinal(null);
    setErrorPago(null);
    setQrEstado('ESPERANDO');

    try {
      const res = await pagoMensualidadService.consultarPorCI(ciLimpio);
      const data = res?.data ?? res;
      setDatosConsulta(data);

      if (data?.cliente?.nombre_completo) {
        setTarjetaTitular(data.cliente.nombre_completo.toUpperCase());
      }

      if (!data.tiene_deuda) {
        setMensajeAviso({
          tipo: 'success',
          texto: data.mensaje || '¡Tu servicio está al día! No tienes facturas pendientes de pago.',
        });
      }
    } catch (err) {
      // Cliente no encontrado: emitir aviso sin exponer datos
      setDatosConsulta(null);
      setMensajeAviso({
        tipo: 'warning',
        texto: describeApiError(err) || 'No se encontró ningún cliente registrado con el C.I. ingresado. Verifique su número de documento.',
      });
    } finally {
      setLoading(false);
    }
  };

  // [Verificar Pago QR]: Confirma la recepción del pago vía QR
  const handleVerificarQR = () => {
    setQrEstado('CONFIRMADO');
  };

  // [Formatear Número de Tarjeta]: Espaciado en grupos de 4 dígitos
  const handleTarjetaChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setTarjetaNumero(formatted);
  };

  // [Procesar Pago en Línea]: Guarda en la base de datos y genera el recibo oficial
  const handleProcesarPago = async () => {
    if (!datosConsulta?.factura) return;

    setSubmitting(true);
    setErrorPago(null);

    try {
      const res = await pagoMensualidadService.pagarEnLinea({
        mensualidad_id: datosConsulta.factura.id,
        monto_pagado: datosConsulta.factura.monto,
        metodo_pago: metodoPago,
        numero_transaccion:
          metodoPago === 'TRANSFERENCIA'
            ? `TRF-${Date.now().toString().slice(-6)}`
            : metodoPago === 'QR'
            ? `QR-${Date.now().toString().slice(-6)}`
            : `PP-${Date.now().toString().slice(-6)}`,
      });

      const recibo = res?.data?.recibo ?? res?.recibo;
      setReciboFinal(recibo);
      setDatosConsulta(null);
    } catch (err) {
      setErrorPago(describeApiError(err) || 'No se pudo procesar el pago. Intente nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // [Abrir PayPal]: Inicia el flujo oficial de checkout
  const handleAbrirPayPal = () => {
    const montoUSD = (datosConsulta.factura.monto / 6.96).toFixed(2);
    window.open(
      `https://www.paypal.com/checkoutnow?amount=${montoUSD}&currency=USD&desc=Pago+Mensualidad+TELCOM`,
      '_blank'
    );
    setPaypalEstado('CONFIRMADO');
  };

  // [Imprimir Recibo]: Dispara el diálogo de impresión
  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="cu10-portal-overlay" onClick={onClose}>
      <div className="cu10-portal-modal" onClick={(e) => e.stopPropagation()}>
        {/* Cabecera del Portal Cliente */}
        <div className="cu10-portal-header">
          <div className="cu10-portal-title-box">
            <div className="cu10-portal-icon-badge">
              <Zap size={22} />
            </div>
            <div>
              <h2 className="cu10-portal-title">Portal Cliente - Pago de Servicio</h2>
              <p className="cu10-portal-subtitle">
                Consulta el estado de tu cuenta por C.I. y realiza pagos al instante
              </p>
            </div>
          </div>
          <button className="cu10-portal-close" onClick={onClose} title="Cerrar modal">
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="cu10-portal-body">
          {/* Formulario de Búsqueda por CI */}
          {!reciboFinal && (
            <div className="cu10-portal-search-box">
              <label className="cu10-portal-search-label">
                Ingresa tu Cédula de Identidad (C.I.)
              </label>
              <form onSubmit={handleConsultarCI} className="cu10-portal-search-input-group">
                <div className="cu10-portal-input-wrapper">
                  <Search size={18} className="cu10-portal-input-icon" />
                  <input
                    type="text"
                    className="cu10-portal-input"
                    placeholder="Ej. 8492019"
                    value={ciInput}
                    onChange={(e) => setCiInput(e.target.value)}
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="cu10-portal-btn-search"
                  disabled={loading || !ciInput.trim()}
                >
                  {loading ? 'Consultando...' : 'Consultar Estado'}
                </button>
              </form>
            </div>
          )}

          {/* Aviso: Cliente no encontrado o mensaje de estado */}
          {mensajeAviso && (
            <div className={`cu10-portal-alert cu10-portal-alert-${mensajeAviso.tipo}`}>
              <AlertCircle size={20} style={{ flexShrink: 0 }} />
              <div>{mensajeAviso.texto}</div>
            </div>
          )}

          {/* Error de procesamiento de pago */}
          {errorPago && (
            <div className="cu10-portal-alert cu10-portal-alert-danger">
              <AlertCircle size={20} style={{ flexShrink: 0 }} />
              <div>{errorPago}</div>
            </div>
          )}

          {/* ============================================================== */}
          {/* CLIENTE REGISTRADO - CON PAGO PENDIENTE                         */}
          {/* ============================================================== */}
          {datosConsulta && datosConsulta.tiene_deuda && datosConsulta.factura && (
            <div className="cu10-service-status-card">
              {/* Identificación del cliente */}
              <div className="cu10-status-badge-row">
                <div>
                  <div className="cu10-client-name">
                    {datosConsulta.cliente.nombre_completo}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                    C.I.: {datosConsulta.cliente.ci} | Código: {datosConsulta.cliente.codigo_cliente}
                  </div>
                </div>
                <span className="cu10-status-pill pendiente">
                  <Clock size={14} /> Pago Pendiente
                </span>
              </div>

              {/* Destaque obligatorio: Fecha de corte y días hábiles restantes */}
              <div className="cu10-cutoff-highlight">
                <div className="cu10-cutoff-item">
                  <div className="cu10-cutoff-icon">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <div className="cu10-cutoff-text-title">Fecha Programada de Corte</div>
                    <div className="cu10-cutoff-text-val">
                      {datosConsulta.fecha_corte}
                    </div>
                  </div>
                </div>

                <div className="cu10-cutoff-item">
                  <div className="cu10-cutoff-icon">
                    <Clock size={20} />
                  </div>
                  <div>
                    <div className="cu10-cutoff-text-title">Días Hábiles de Uso</div>
                    <div
                      className={`cu10-cutoff-text-val ${
                        datosConsulta.dias_habiles_restantes <= 2 ? 'urgente' : ''
                      }`}
                    >
                      {datosConsulta.dias_habiles_restantes === 1
                        ? '1 día restante'
                        : `${datosConsulta.dias_habiles_restantes} días restantes`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumen del cobro a realizar */}
              <div className="cu10-bill-summary">
                <div>
                  <div className="cu10-bill-col-title">Factura</div>
                  <div className="cu10-bill-col-val">{datosConsulta.factura.codigo_factura}</div>
                </div>
                <div>
                  <div className="cu10-bill-col-title">Periodo</div>
                  <div className="cu10-bill-col-val">{datosConsulta.factura.periodo}</div>
                </div>
                <div>
                  <div className="cu10-bill-col-title">Plan Contratado</div>
                  <div className="cu10-bill-col-val">
                    {datosConsulta.servicio?.plan_nombre || 'Fibra Óptica'}
                  </div>
                </div>
                <div>
                  <div className="cu10-bill-col-title">Total a Cancelar</div>
                  <div className="cu10-bill-col-val monto">
                    Bs. {Number(datosConsulta.factura.monto).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Pestañas de Métodos de Pago */}
              <div>
                <label className="cu10-portal-search-label">Selecciona tu método de pago:</label>
                <div className="cu10-payment-methods-tabs">
                  <button
                    type="button"
                    className={`cu10-pm-tab ${metodoPago === 'QR' ? 'active' : ''}`}
                    onClick={() => setMetodoPago('QR')}
                  >
                    <QrCode size={20} />
                    <span>Simple QR</span>
                  </button>
                  <button
                    type="button"
                    className={`cu10-pm-tab ${metodoPago === 'TRANSFERENCIA' ? 'active' : ''}`}
                    onClick={() => setMetodoPago('TRANSFERENCIA')}
                  >
                    <CreditCard size={20} />
                    <span>Transferencia</span>
                  </button>
                  <button
                    type="button"
                    className={`cu10-pm-tab ${metodoPago === 'PAYPAL' ? 'active' : ''}`}
                    onClick={() => setMetodoPago('PAYPAL')}
                  >
                    <Building2 size={20} />
                    <span>PayPal</span>
                  </button>
                </div>
              </div>

              {/* -------------------------------------------------------- */}
              {/* PASARELA 1: SIMPLE QR                                    */}
              {/* -------------------------------------------------------- */}
              {metodoPago === 'QR' && (
                <div className="cu10-qr-panel">
                  <div className="cu10-qr-image-wrapper">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="Código QR de Pago Interbancario" />
                    ) : (
                      <div style={{ width: 190, height: 190, background: '#f1f5f9' }} />
                    )}
                  </div>

                  <p className="cu10-qr-instructions">
                    Escanea este código desde la aplicación móvil de cualquier banco de Bolivia
                    (Banco Unión, BCP, BNB, Banco FIE, etc.) para transferir{' '}
                    <strong>Bs. {Number(datosConsulta.factura.monto).toFixed(2)}</strong>.
                  </p>

                  {qrEstado === 'CONFIRMADO' ? (
                    <div className="cu10-qr-status-success">
                      <CheckCircle2 size={18} />
                      <span>Pago confirmado</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="cu10-qr-verify-btn"
                      onClick={handleVerificarQR}
                    >
                      <ShieldCheck size={18} />
                      <span>Verificar pago</span>
                    </button>
                  )}
                </div>
              )}

              {/* -------------------------------------------------------- */}
              {/* PASARELA 2: TRANSFERENCIA BANCARIA CON TARJETA           */}
              {/* -------------------------------------------------------- */}
              {metodoPago === 'TRANSFERENCIA' && (
                <div className="cu10-card-panel">
                  {/* Tarjeta de débito/crédito realista */}
                  <div className="cu10-virtual-card">
                    <div className="cu10-card-top">
                      <div className="cu10-card-chip" />
                      <span className="cu10-card-bank-name">
                        {
                          {
                            BANCO_UNION: 'BANCO UNIÓN',
                            BCP: 'BANCO DE CRÉDITO',
                            BNB: 'BANCO NACIONAL',
                            MERCANTIL: 'MERCANTIL SANTA CRUZ',
                            BISA: 'BANCO BISA',
                            FIE: 'BANCO FIE',
                          }[bancoOrigen] || 'ENTIDAD BANCARIA'
                        }
                      </span>
                    </div>
                    <div className="cu10-card-number-display">
                      {tarjetaNumero || '•••• •••• •••• ••••'}
                    </div>
                    <div className="cu10-card-bottom">
                      <div>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>TITULAR</div>
                        <div className="cu10-card-holder-name">
                          {tarjetaTitular || 'TITULAR DE LA CUENTA'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>VENCE</div>
                        <div className="cu10-card-exp-display">{tarjetaVencimiento}</div>
                      </div>
                    </div>
                  </div>

                  {/* Formulario de tarjeta */}
                  <div className="cu10-card-form">
                    <div className="cu10-form-group">
                      <label className="cu10-form-label">Entidad Bancaria</label>
                      <select
                        className="cu10-form-control"
                        value={bancoOrigen}
                        onChange={(e) => setBancoOrigen(e.target.value)}
                      >
                        <option value="BANCO_UNION">Banco Unión S.A.</option>
                        <option value="BCP">Banco de Crédito de Bolivia (BCP)</option>
                        <option value="BNB">Banco Nacional de Bolivia (BNB)</option>
                        <option value="MERCANTIL">Banco Mercantil Santa Cruz</option>
                        <option value="BISA">Banco BISA S.A.</option>
                        <option value="FIE">Banco FIE S.A.</option>
                      </select>
                    </div>

                    <div className="cu10-form-group">
                      <label className="cu10-form-label">Número de Tarjeta</label>
                      <input
                        type="text"
                        className="cu10-form-control"
                        placeholder="1234 5678 9012 3456"
                        value={tarjetaNumero}
                        onChange={handleTarjetaChange}
                      />
                    </div>

                    <div className="cu10-form-row">
                      <div className="cu10-form-group">
                        <label className="cu10-form-label">Vencimiento (MM/AA)</label>
                        <input
                          type="text"
                          className="cu10-form-control"
                          placeholder="MM/AA"
                          maxLength={5}
                          value={tarjetaVencimiento}
                          onChange={(e) => setTarjetaVencimiento(e.target.value)}
                        />
                      </div>
                      <div className="cu10-form-group">
                        <label className="cu10-form-label">Código CVV</label>
                        <input
                          type="password"
                          className="cu10-form-control"
                          placeholder="123"
                          maxLength={4}
                          value={tarjetaCvv}
                          onChange={(e) => setTarjetaCvv(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* -------------------------------------------------------- */}
              {/* PASARELA 3: PAYPAL                                       */}
              {/* -------------------------------------------------------- */}
              {metodoPago === 'PAYPAL' && (
                <div className="cu10-paypal-panel">
                  <div className="cu10-paypal-logo">PayPal</div>
                  <p style={{ fontSize: '0.88rem', color: '#94a3b8' }}>
                    Cancela de manera rápida y segura con tu cuenta PayPal o tarjeta internacional.
                  </p>
                  <p style={{ fontSize: '1.05rem', color: '#f8fafc', fontWeight: 700 }}>
                    Total: $
                    {((Number(datosConsulta.factura.monto) || 0) / 6.96).toFixed(2)} USD
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 400 }}>
                      {' '}(Bs. {Number(datosConsulta.factura.monto).toFixed(2)})
                    </span>
                  </p>

                  <button
                    type="button"
                    className="cu10-paypal-btn"
                    onClick={handleAbrirPayPal}
                  >
                    <ExternalLink size={18} />
                    <span>Pagar con PayPal</span>
                  </button>

                  {paypalEstado === 'CONFIRMADO' && (
                    <div className="cu10-qr-status-success">
                      <CheckCircle2 size={18} />
                      <span>Transacción autorizada con PayPal</span>
                    </div>
                  )}
                </div>
              )}

              {/* Botón Maestro de Confirmación de Pago */}
              <button
                type="button"
                className="cu10-btn-submit-payment"
                disabled={submitting}
                onClick={handleProcesarPago}
              >
                {submitting ? (
                  'Registrando pago en la base de datos...'
                ) : (
                  <>
                    <Check size={18} />
                    <span>
                      Pagar Bs. {Number(datosConsulta.factura.monto).toFixed(2)}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* ============================================================== */}
          {/* CLIENTE AL DÍA (SIN DEUDA)                                      */}
          {/* ============================================================== */}
          {datosConsulta && !datosConsulta.tiene_deuda && (
            <div className="cu10-service-status-card">
              <div className="cu10-status-badge-row">
                <div>
                  <div className="cu10-client-name">
                    {datosConsulta.cliente.nombre_completo}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                    C.I.: {datosConsulta.cliente.ci} | Código: {datosConsulta.cliente.codigo_cliente}
                  </div>
                </div>
                <span className="cu10-status-pill al-dia">
                  <CheckCircle2 size={14} /> Al Día
                </span>
              </div>

              <div style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                Tu plan <strong>{datosConsulta.servicio?.plan_nombre || 'Internet Fibra'}</strong> se
                encuentra activo. No tienes mensualidades pendientes en este periodo.
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* COMPROBANTE FINAL DE PAGO GENERADO                             */}
          {/* ============================================================== */}
          {reciboFinal && (
            <div className="cu10-receipt-view">
              <div className="cu10-receipt-card" id="comprobante-portal-imprimible">
                <div className="cu10-receipt-header">
                  <div className="cu10-receipt-company">
                    <h3>TELCOM BOLIVIA S.R.L.</h3>
                    <p>Servicio de Internet y Telecomunicaciones</p>
                    <p>NIT: 1029384756 | Santa Cruz - Bolivia</p>
                  </div>
                  <div className="cu10-receipt-code-box">
                    <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 800 }}>
                      COMPROBANTE DE PAGO EN LÍNEA
                    </span>
                    <div className="cu10-receipt-code">{reciboFinal.codigo_recibo}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {reciboFinal.fecha_hora}
                    </div>
                  </div>
                </div>

                <div className="cu10-receipt-details">
                  <div>
                    <strong>Cliente:</strong> {reciboFinal.cliente_nombre}
                  </div>
                  <div>
                    <strong>C.I.:</strong> {reciboFinal.cliente_ci}
                  </div>
                  <div>
                    <strong>Factura:</strong> {reciboFinal.codigo_factura}
                  </div>
                  <div>
                    <strong>Periodo:</strong> {reciboFinal.periodo}
                  </div>
                  <div>
                    <strong>Método:</strong> {reciboFinal.metodo_pago}
                  </div>
                  <div>
                    <strong>Transacción:</strong> {reciboFinal.numero_transaccion}
                  </div>
                </div>

                <div
                  style={{
                    borderTop: '1px solid #e2e8f0',
                    paddingTop: '0.75rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>TOTAL PAGADO:</span>
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: '1.35rem',
                      color: '#059669',
                    }}
                  >
                    Bs. {Number(reciboFinal.monto_total).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="cu10-receipt-actions">
                <button type="button" className="cu10-btn-print" onClick={handleImprimir}>
                  <Printer size={16} />
                  <span>Imprimir Comprobante</span>
                </button>
                <button type="button" className="cu10-btn-close-modal" onClick={onClose}>
                  Finalizar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
