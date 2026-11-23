const { generateWatermarks, boundaryIcon, controlIcon, entityIcon, actorIcon } = require('../diagram_helpers');

// =========================================================================
// CU31 - GENERAR REPORTE INTELIGENTE VÍA COMANDO DE VOZ (Dunston Madariaga - P7)
// Controller: ReporteInteligenteController (generar)
// Boundary: UI_ReporteInteligente
// Services: GeminiIntencionService, CatalogoReportesService
// Entities: Cliente, Mensualidad, Pago, ServicioInternet, Bitacora
// =========================================================================

function buildCU31Communication() {
  const width = 1680;
  const height = 960;
  const tabW = 480;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background:#ffffff; font-family: 'Segoe UI', Arial, sans-serif;">
  <defs>
    <style>
      .tab-title { font-size: 11px; font-weight: bold; fill: #1e293b; }
      .node-title { font-size: 12px; font-weight: bold; fill: #0f172a; text-anchor: middle; }
      .link-line { stroke: #64748b; stroke-width: 1.3; fill: none; }
      .flow-1 { fill: #0f172a; font-size: 10.5px; font-weight: bold; }
      .flow-2 { fill: #b91c1c; font-size: 10.5px; font-weight: bold; }
      .flow-3 { fill: #15803d; font-size: 10.5px; font-weight: bold; }
    </style>
  </defs>

  <path d="M 20,45 L 20,24 L ${tabW},24 L ${tabW + 16},45 Z" fill="#ffffff" stroke="#64748b" stroke-width="1" />
  <text x="30" y="38" class="tab-title">sd CU31 Generar reporte inteligente vía comando de voz</text>

  <rect x="20" y="45" width="${width - 40}" height="${height - 65}" fill="#ffffff" stroke="#64748b" stroke-width="1" />

  <g opacity="0.45">
    ${generateWatermarks(width, height)}
  </g>

  <!-- LÍNEAS DE ENLACE -->
  <line x1="150" y1="420" x2="380" y2="420" class="link-line" />
  <line x1="430" y1="420" x2="680" y2="420" class="link-line" />
  <line x1="710" y1="380" x2="710" y2="180" class="link-line" />
  <line x1="740" y1="420" x2="1040" y2="420" class="link-line" />
  <line x1="1100" y1="420" x2="1350" y2="420" class="link-line" />
  <line x1="710" y1="460" x2="710" y2="690" class="link-line" />

  <!-- INSTANCIAS ROBUSTEZ BCE -->
  <g transform="translate(120, 420)">
    ${actorIcon(0, 0)}
    <text x="0" y="45" class="node-title">Administrador / Gerencia</text>
  </g>

  <g transform="translate(405, 420)">
    ${boundaryIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">UI_ReporteInteligente</text>
  </g>

  <g transform="translate(710, 420)">
    ${controlIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">ReporteInteligenteController</text>
  </g>

  <g transform="translate(710, 150)">
    ${controlIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">GeminiIntencionService</text>
  </g>

  <g transform="translate(1070, 420)">
    ${controlIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">CatalogoReportesService</text>
  </g>

  <g transform="translate(1380, 420)">
    ${entityIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">Cliente / Pago / Mensualidad</text>
  </g>

  <g transform="translate(710, 720)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Bitacora</text>
  </g>

  <!-- MENSAJES Y LLAMADAS -->
  <g transform="translate(145, 345)">
    <text x="0" y="0" class="flow-1">1: dictarComandoReporte(comando/intencion) &rarr;</text>
    <text x="0" y="18" class="flow-2">2: visualizarReporteGenerado(datos) &rarr;</text>
  </g>

  <g transform="translate(425, 345)">
    <text x="0" y="0" class="flow-1">1.1: generar(Request $request) &rarr;</text>
  </g>

  <g transform="translate(725, 270)">
    <text x="0" y="0" class="flow-1">1.2: interpretar($comando) [Gemini AI / LLM] &rarr;</text>
  </g>

  <g transform="translate(755, 385)">
    <text x="0" y="0" class="flow-1">1.3: generar($intencionEstructurada): array &rarr;</text>
  </g>

  <g transform="translate(1105, 385)">
    <text x="0" y="0" class="flow-1">1.4: DB::table(entidades)->select()->where()->get() &rarr;</text>
  </g>

  <g transform="translate(725, 570)">
    <text x="0" y="0" class="flow-1">1.5: AuditLogger::log('CU31', 'GENERAR_REPORTE_INTELIGENTE', tipo, filas) &rarr;</text>
  </g>

  <!-- LEYENDA INFERIOR -->
  <g transform="translate(50, 860)">
    <rect x="0" y="0" width="1580" height="42" fill="#f8fafc" stroke="#cbd5e1" rx="4" />
    <text x="20" y="26" font-size="11" font-weight="bold" fill="#0f172a">Convención de Flujos:</text>
    <text x="170" y="26" class="flow-1">&bull; Flujo 1: Interpretación con IA generativa (Gemini), resolución de reporte y consulta analítica</text>
    <text x="890" y="26" class="flow-2">&bull; Flujo 2: Renderizado en vivo con KPIs calculados y auditoría</text>
  </g>
</svg>`;
}

function buildCU31ClassAnalysis() {
  const width = 1750;
  const height = 980;
  const tabW = 480;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background:#ffffff; font-family: Arial, Helvetica, sans-serif;">
  <defs>
    <style>
      .tab-title { font-size: 10px; font-weight: bold; fill: #1e293b; }
      .class-box { fill: #ffffea; stroke: #606060; stroke-width: 1; }
      .class-title { font-size: 12px; font-weight: bold; fill: #000000; text-anchor: middle; }
      .attr-text { font-size: 10.5px; fill: #000000; font-family: monospace, Arial; }
      .method-text { font-size: 10.5px; fill: #000000; font-family: monospace, Arial; }
      .assoc-text { font-size: 10.5px; fill: #334155; font-style: italic; }
      .mult-text { font-size: 11px; fill: #000000; font-weight: bold; }
      .ea-line { stroke: #505050; stroke-width: 1; fill: none; }
      .divider { stroke: #707070; stroke-width: 0.8; }
    </style>
  </defs>

  <path d="M 20,45 L 20,24 L ${tabW},24 L ${tabW + 16},45 Z" fill="#ffffff" stroke="#606060" stroke-width="1" />
  <text x="30" y="38" class="tab-title">class CU31 Generar reporte inteligente vía comando de voz</text>

  <rect x="20" y="45" width="${width - 40}" height="${height - 65}" fill="#ffffff" stroke="#606060" stroke-width="1" />

  <g opacity="0.45">
    ${generateWatermarks(width, height)}
  </g>

  <!-- ASOCIACIONES -->
  <line x1="85" y1="280" x2="130" y2="280" class="ea-line" />
  <line x1="390" y1="280" x2="470" y2="280" class="ea-line" />
  <text x="410" y="272" class="assoc-text">invoca</text>

  <line x1="620" y1="170" x2="620" y2="110" class="ea-line" />
  <text x="630" y="145" class="assoc-text">interpreta con</text>

  <line x1="770" y1="280" x2="850" y2="280" class="ea-line" />
  <text x="790" y="272" class="assoc-text">consulta catálogo</text>

  <line x1="1130" y1="280" x2="1210" y2="280" class="ea-line" />
  <text x="1150" y="272" class="assoc-text">lee entidades</text>

  <line x1="620" y1="390" x2="620" y2="560" class="ea-line" />
  <text x="630" y="475" class="assoc-text">registra auditoría</text>

  <!-- CAJAS EA -->
  <g transform="translate(60, 280)">
    ${actorIcon(0, 0)}
    <text x="0" y="45" class="class-title">Administrador / Gerencia</text>
  </g>

  <g transform="translate(130, 160)">
    <rect x="0" y="0" width="260" height="230" class="class-box" />
    <text x="130" y="20" class="class-title">UI_ReporteInteligente</text>
    <line x1="0" y1="28" x2="260" y2="28" class="divider" />
    <text x="10" y="48" class="method-text">+ dictarComandoReporte(): void</text>
    <text x="10" y="70" class="method-text">+ enviarComandoTexto(texto): void</text>
    <text x="10" y="92" class="method-text">+ previsualizarInterpretacion(): void</text>
    <text x="10" y="114" class="method-text">+ renderizarTablaReporteIA(): void</text>
    <text x="10" y="136" class="method-text">+ renderizarResumenKPIs(): void</text>
    <text x="10" y="158" class="method-text">+ exportarAExcel(): void</text>
    <text x="10" y="180" class="method-text">+ exportarAPdf(): void</text>
  </g>

  <g transform="translate(470, 170)">
    <rect x="0" y="0" width="300" height="210" class="class-box" />
    <text x="150" y="20" class="class-title">ReporteInteligenteController</text>
    <line x1="0" y1="28" x2="300" y2="28" class="divider" />
    <text x="10" y="55" class="method-text">+ generar(Request, Gemini, Catalogo): Json</text>
    <text x="10" y="85" class="method-text">- validarEntrada(Request $request): array</text>
    <text x="10" y="115" class="method-text">- auditarReporte(tipo, filas, origen): void</text>
  </g>

  <g transform="translate(490, 10)">
    <rect x="0" y="0" width="260" height="100" class="class-box" />
    <text x="130" y="18" class="class-title">GeminiIntencionService</text>
    <line x1="0" y1="24" x2="260" y2="24" class="divider" />
    <text x="10" y="45" class="method-text">+ interpretar(string $comando): array</text>
    <text x="10" y="70" class="method-text">- promptSistema(): string</text>
  </g>

  <g transform="translate(850, 170)">
    <rect x="0" y="0" width="280" height="230" class="class-box" />
    <text x="140" y="20" class="class-title">CatalogoReportesService</text>
    <line x1="0" y1="28" x2="280" y2="28" class="divider" />
    <text x="10" y="48" class="method-text">+ generar(array $intencion): array</text>
    <text x="10" y="70" class="method-text">- reporteClientesPorZona(filtros): array</text>
    <text x="10" y="92" class="method-text">- reporteMorosidad(filtros): array</text>
    <text x="10" y="114" class="method-text">- reporteIngresos(filtros): array</text>
    <text x="10" y="136" class="method-text">- reporteInstalaciones(filtros): array</text>
  </g>

  <g transform="translate(1210, 160)">
    <rect x="0" y="0" width="260" height="240" class="class-box" />
    <text x="130" y="20" class="class-title">Entidades del Dominio</text>
    <line x1="0" y1="28" x2="260" y2="28" class="divider" />
    <text x="10" y="48" class="attr-text">- Cliente (idCliente, idZona, estado)</text>
    <text x="10" y="70" class="attr-text">- Mensualidad (monto, estado, periodo)</text>
    <text x="10" y="92" class="attr-text">- Pago (montoTotal, fechaPago)</text>
    <text x="10" y="114" class="attr-text">- ServicioInternet (idPlan, estado)</text>
    <line x1="0" y1="124" x2="260" y2="124" class="divider" />
    <text x="10" y="146" class="method-text">+ join(), where(), get()</text>
    <text x="10" y="168" class="method-text">+ sum(), count(), avg()</text>
  </g>

  <g transform="translate(500, 560)">
    <rect x="0" y="0" width="240" height="160" class="class-box" />
    <text x="120" y="18" class="class-title">Bitacora</text>
    <line x1="0" y1="24" x2="240" y2="24" class="divider" />
    <text x="10" y="40" class="attr-text">- idBitacora: int   - casoUso: 'CU31'</text>
    <text x="10" y="56" class="attr-text">- accion: 'GENERAR_REPORTE'</text>
    <text x="10" y="72" class="attr-text">- detalles: text</text>
    <line x1="0" y1="80" x2="240" y2="80" class="divider" />
    <text x="10" y="100" class="method-text">+ create(array $datos): Bitacora</text>
  </g>
</svg>`;
}

function buildCU31Sequence() {
  const width = 1680;
  const height = 1150;
  const tabW = 480;

  const xAdmin = 90;
  const xUI = 320;
  const xCtrl = 640;
  const xGemini = 960;
  const xCat = 1260;
  const xBit = 1550;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background:#ffffff; font-family: 'Segoe UI', Arial, sans-serif;">
  <defs>
    <style>
      .tab-title { font-size: 11px; font-weight: bold; fill: #1e293b; }
      .life-title { font-size: 11.5px; font-weight: bold; fill: #0f172a; text-anchor: middle; }
      .life-line { stroke: #94a3b8; stroke-width: 1; stroke-dasharray: 4,4; fill: none; }
      .act-bar { fill: #ffffff; stroke: #475569; stroke-width: 1.2; }
      .msg-call { stroke: #1e293b; stroke-width: 1.2; fill: none; }
      .msg-ret { stroke: #64748b; stroke-width: 1.1; stroke-dasharray: 4,3; fill: none; }
      .call-text { font-size: 10px; font-weight: bold; fill: #0f172a; }
      .ret-text { font-size: 9.5px; fill: #475569; font-style: italic; }
      .frame-box { fill: none; stroke: #64748b; stroke-width: 1; }
      .frame-title { font-size: 10.5px; font-weight: bold; fill: #0f172a; }
      .frame-tab { fill: #ffffff; stroke: #64748b; stroke-width: 1; }
    </style>
  </defs>

  <path d="M 20,45 L 20,24 L ${tabW},24 L ${tabW + 16},45 Z" fill="#ffffff" stroke="#64748b" stroke-width="1" />
  <text x="30" y="38" class="tab-title">sd CU31 Generar reporte inteligente vía comando de voz</text>

  <rect x="20" y="45" width="${width - 40}" height="${height - 65}" fill="#ffffff" stroke="#64748b" stroke-width="1" />

  <g opacity="0.4">
    ${generateWatermarks(width, height)}
  </g>

  <!-- LÍNEAS DE VIDA -->
  <line x1="${xAdmin}" y1="130" x2="${xAdmin}" y2="${height - 50}" class="life-line" />
  <line x1="${xUI}" y1="130" x2="${xUI}" y2="${height - 50}" class="life-line" />
  <line x1="${xCtrl}" y1="130" x2="${xCtrl}" y2="${height - 50}" class="life-line" />
  <line x1="${xGemini}" y1="130" x2="${xGemini}" y2="${height - 50}" class="life-line" />
  <line x1="${xCat}" y1="130" x2="${xCat}" y2="${height - 50}" class="life-line" />
  <line x1="${xBit}" y1="130" x2="${xBit}" y2="${height - 50}" class="life-line" />

  <!-- CABECERAS -->
  <g transform="translate(${xAdmin}, 90)">
    ${actorIcon(0, 0)}
    <text x="0" y="40" class="life-title">Administrador / Gerencia</text>
  </g>
  <g transform="translate(${xUI}, 90)">
    ${boundaryIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">UI_ReporteInteligente</text>
  </g>
  <g transform="translate(${xCtrl}, 90)">
    ${controlIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">ReporteInteligenteController</text>
  </g>
  <g transform="translate(${xGemini}, 90)">
    ${controlIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">GeminiIntencionService</text>
  </g>
  <g transform="translate(${xCat}, 90)">
    ${controlIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">CatalogoReportesService</text>
  </g>
  <g transform="translate(${xBit}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">Bitacora</text>
  </g>

  <!-- BLOQUE 1: GENERACIÓN INTELIGENTE -->
  <rect x="35" y="150" width="${width - 70}" height="350" class="frame-box" />
  <path d="M 35,170 L 35,150 L 390,150 L 402,170 Z" class="frame-tab" />
  <text x="45" y="164" class="frame-title">alt Flujo 1: Interpretar con Gemini y consultar catálogo de reportes</text>

  <rect x="${xAdmin - 5}" y="175" width="10" height="305" class="act-bar" />
  <rect x="${xUI - 5}" y="175" width="10" height="300" class="act-bar" />
  <rect x="${xCtrl - 5}" y="185" width="10" height="275" class="act-bar" />

  <line x1="${xAdmin + 5}" y1="180" x2="${xUI - 5}" y2="180" class="msg-call" />
  <polygon points="${xUI - 5},180 ${xUI - 11},177 ${xUI - 11},183" fill="#1e293b" />
  <text x="130" y="175" class="call-text">1: dictarComandoReporte("Genera un reporte de morosos de la Zona Norte")</text>

  <line x1="${xUI + 5}" y1="195" x2="${xCtrl - 5}" y2="195" class="msg-call" />
  <polygon points="${xCtrl - 5},195 ${xCtrl - 11},192 ${xCtrl - 11},198" fill="#1e293b" />
  <text x="360" y="190" class="call-text">1.1: generar(Request $request)</text>

  <line x1="${xCtrl + 5}" y1="215" x2="${xGemini - 5}" y2="215" class="msg-call" />
  <polygon points="${xGemini - 5},215 ${xGemini - 11},212 ${xGemini - 11},218" fill="#1e293b" />
  <text x="690" y="210" class="call-text">1.2: interpretar($comando): {tipo: 'morosidad_cortes', filtros: {zona: 'Norte'}}</text>

  <line x1="${xGemini - 5}" y1="240" x2="${xCtrl + 5}" y2="240" class="msg-ret" />
  <text x="730" y="235" class="ret-text">($intencionEstructurada)</text>

  <line x1="${xCtrl + 5}" y1="265" x2="${xCat - 5}" y2="265" class="msg-call" />
  <polygon points="${xCat - 5},265 ${xCat - 11},262 ${xCat - 11},268" fill="#1e293b" />
  <text x="690" y="260" class="call-text">1.3: generar($intencion): DB::table('Mensualidad')->leftJoin('Cliente')->get()</text>

  <line x1="${xCat - 5}" y1="290" x2="${xCtrl + 5}" y2="290" class="msg-ret" />
  <text x="980" y="285" class="ret-text">($reporteGenerado: {tipo, filas, columnas, resumen, truncado})</text>

  <line x1="${xCtrl + 5}" y1="320" x2="${xBit - 5}" y2="320" class="msg-call" />
  <polygon points="${xBit - 5},320 ${xBit - 11},317 ${xBit - 11},323" fill="#1e293b" />
  <text x="1100" y="315" class="call-text">1.4: AuditLogger::log('CU31', 'GENERAR_REPORTE_INTELIGENTE', detalle)</text>

  <line x1="${xCtrl - 5}" y1="350" x2="${xUI + 5}" y2="350" class="msg-ret" />
  <text x="390" y="345" class="ret-text">success({interpretacion, reporte}, 'Reporte generado correctamente')</text>

  <line x1="${xUI - 5}" y1="380" x2="${xAdmin + 5}" y2="380" class="msg-ret" />
  <text x="130" y="375" class="ret-text">visualizarReporteConMetricasYExportar()</text>
</svg>`;
}

module.exports = {
  buildCU31Communication,
  buildCU31ClassAnalysis,
  buildCU31Sequence,
};

