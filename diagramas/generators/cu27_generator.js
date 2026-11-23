const { generateWatermarks, boundaryIcon, controlIcon, entityIcon, actorIcon } = require('../diagram_helpers');

// =========================================================================
// CU27 - GENERAR Y EXPORTAR REPORTES TRADICIONALES (Daniel Candia - P7)
// Controller: ReporteTradicionalController (catalogo, parametros, generar, exportarExcel, exportarPdf)
// Boundary: UI_ReporteTradicional
// Domain Service / Entity: ReporteTradicional
// Entities: Cliente, Zona, Pago, Mensualidad, Equipo, Bitacora
// =========================================================================

function buildCU27Communication() {
  const width = 1650;
  const height = 920;
  const tabW = 420;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background:#ffffff; font-family: 'Segoe UI', Arial, sans-serif;">
  <defs>
    <style>
      .tab-title { font-size: 11px; font-weight: bold; fill: #1e293b; }
      .node-title { font-size: 12px; font-weight: bold; fill: #0f172a; text-anchor: middle; }
      .link-line { stroke: #64748b; stroke-width: 1.2; fill: none; }
      .flow-1 { fill: #0f172a; font-size: 10.5px; font-weight: bold; }
      .flow-2 { fill: #b91c1c; font-size: 10.5px; font-weight: bold; }
      .flow-3 { fill: #15803d; font-size: 10.5px; font-weight: bold; }
      .flow-4 { fill: #1d4ed8; font-size: 10.5px; font-weight: bold; }
    </style>
  </defs>

  <path d="M 20,45 L 20,24 L ${tabW},24 L ${tabW + 16},45 Z" fill="#ffffff" stroke="#64748b" stroke-width="1" />
  <text x="30" y="38" class="tab-title">sd CU27 Generar y exportar reportes tradicionales</text>

  <rect x="20" y="45" width="${width - 40}" height="${height - 65}" fill="#ffffff" stroke="#64748b" stroke-width="1" />

  <g opacity="0.45">
    ${generateWatermarks(width, height)}
  </g>

  <!-- LÍNEAS DE ENLACE -->
  <line x1="105" y1="360" x2="330" y2="360" class="link-line" />
  <line x1="370" y1="360" x2="680" y2="360" class="link-line" />
  <line x1="720" y1="360" x2="1140" y2="360" class="link-line" />
  <line x1="700" y1="400" x2="700" y2="650" class="link-line" />
  <line x1="700" y1="320" x2="700" y2="150" class="link-line" />
  <line x1="1160" y1="320" x2="1160" y2="150" class="link-line" />
  <line x1="1160" y1="400" x2="1160" y2="650" class="link-line" />
  <line x1="1190" y1="360" x2="1470" y2="360" class="link-line" />

  <!-- INSTANCIAS ROBUSTEZ BCE -->
  <g transform="translate(80, 360)">
    ${actorIcon(0, 0)}
    <text x="0" y="45" class="node-title">Administrador / Gerencia</text>
  </g>

  <g transform="translate(350, 360)">
    ${boundaryIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">UI_ReporteTradicional</text>
  </g>

  <g transform="translate(700, 360)">
    ${controlIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">ReporteTradicionalController</text>
  </g>

  <g transform="translate(1160, 360)">
    ${entityIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">ReporteTradicional</text>
  </g>

  <g transform="translate(700, 130)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Zona</text>
  </g>

  <g transform="translate(700, 670)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Bitacora</text>
  </g>

  <g transform="translate(1160, 130)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Cliente</text>
  </g>

  <g transform="translate(1160, 670)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Pago</text>
  </g>

  <g transform="translate(1500, 360)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Mensualidad</text>
  </g>

  <!-- MENSAJES Y LLAMADAS -->
  <g transform="translate(125, 275)">
    <text x="0" y="0" class="flow-1">1: consultarCatalogoReportes() &rarr;</text>
    <text x="0" y="16" class="flow-1">1.3: cargarParametrosFiltros() &rarr;</text>
    <text x="0" y="32" class="flow-2">2: generarReporte(tipo, filtros) &rarr;</text>
    <text x="0" y="48" class="flow-3">3: exportarAExcel() &rarr;</text>
    <text x="0" y="64" class="flow-4">4: exportarAPdf() &rarr;</text>
  </g>

  <g transform="translate(385, 260)">
    <text x="0" y="0" class="flow-1">1.1: catalogo() &rarr;</text>
    <text x="0" y="15" class="flow-1">1.4: parametros() &rarr;</text>
    <text x="0" y="30" class="flow-2">2.1: generar(Request) &rarr;</text>
    <text x="0" y="45" class="flow-3">3.1: exportarExcel(Request) &rarr;</text>
    <text x="0" y="60" class="flow-4">4.1: exportarPdf(Request) &rarr;</text>
  </g>

  <g transform="translate(710, 210)">
    <text x="0" y="0" class="flow-1">1.5: query()->select(['idZona', 'nombreZona'])->get() &rarr;</text>
  </g>

  <g transform="translate(740, 260)">
    <text x="0" y="0" class="flow-1">1.2: catalogo() &rarr;</text>
    <text x="0" y="18" class="flow-2">2.2: generar(tipo, filtros) &rarr;</text>
    <text x="0" y="36" class="flow-3">3.2: generar(tipo, filtros) &rarr;</text>
    <text x="0" y="54" class="flow-4">4.2: generar(tipo, filtros) &rarr;</text>
  </g>

  <g transform="translate(710, 480)">
    <text x="0" y="0" class="flow-2">2.4: log('CU27', 'GENERAR_REPORTE', detalle) &rarr;</text>
    <text x="0" y="20" class="flow-3">3.3: log('CU27', 'EXPORTAR_EXCEL', detalle) &rarr;</text>
    <text x="0" y="40" class="flow-4">4.3: log('CU27', 'EXPORTAR_PDF', detalle) &rarr;</text>
  </g>

  <g transform="translate(1170, 210)">
    <text x="0" y="0" class="flow-2">2.3.1: table('Cliente')->leftJoin('Zona')->get() &rarr;</text>
  </g>

  <g transform="translate(1170, 490)">
    <text x="0" y="0" class="flow-2">2.3.2: table('Pago')->join('MetodoPago')->whereBetween()->get() &rarr;</text>
  </g>

  <g transform="translate(1210, 345)">
    <text x="0" y="0" class="flow-2">2.3.3: table('Mensualidad')->whereIn('estado', ['PENDIENTE','VENCIDA'])->get() &rarr;</text>
  </g>

  <!-- LEYENDA INFERIOR -->
  <g transform="translate(50, 830)">
    <rect x="0" y="0" width="1550" height="42" fill="#f8fafc" stroke="#cbd5e1" rx="4" />
    <text x="20" y="26" font-size="11" font-weight="bold" fill="#0f172a">Convención de Flujos:</text>
    <text x="170" y="26" class="flow-1">&bull; Flujo 1: Consultar catálogo de reportes y parámetros de filtrado</text>
    <text x="580" y="26" class="flow-2">&bull; Flujo 2: Generar consulta consolidada y auditoría</text>
    <text x="940" y="26" class="flow-3">&bull; Flujo 3: Exportar reporte a Excel (CSV con BOM UTF-8)</text>
    <text x="1270" y="26" class="flow-4">&bull; Flujo 4: Exportar reporte a PDF oficial</text>
  </g>
</svg>`;
}

function buildCU27ClassAnalysis() {
  const width = 1780;
  const height = 980;
  const tabW = 440;

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
  <text x="30" y="38" class="tab-title">class CU27 Generar y exportar reportes tradicionales</text>

  <rect x="20" y="45" width="${width - 40}" height="${height - 65}" fill="#ffffff" stroke="#606060" stroke-width="1" />

  <g opacity="0.45">
    ${generateWatermarks(width, height)}
  </g>

  <!-- LÍNEAS DE ASOCIACIÓN -->
  <line x1="85" y1="280" x2="130" y2="280" class="ea-line" />
  <line x1="360" y1="280" x2="420" y2="280" class="ea-line" />
  <text x="375" y="272" class="assoc-text">invoca</text>

  <line x1="680" y1="280" x2="740" y2="280" class="ea-line" />
  <text x="690" y="272" class="assoc-text">genera</text>

  <line x1="550" y1="390" x2="550" y2="600" class="ea-line" />
  <text x="560" y="500" class="assoc-text">registra auditoría</text>

  <line x1="1020" y1="230" x2="1110" y2="230" class="ea-line" />
  <text x="1035" y="222" class="assoc-text">consulta</text>

  <line x1="1020" y1="360" x2="1110" y2="480" class="ea-line" />
  <text x="1040" y="410" class="assoc-text">consolida</text>

  <line x1="950" y1="410" x2="950" y2="600" class="ea-line" />
  <text x="960" y="510" class="assoc-text">evalúa mora</text>

  <!-- CAJAS -->
  <g transform="translate(60, 280)">
    ${actorIcon(0, 0)}
    <text x="0" y="45" class="class-title">Administrador / Gerencia</text>
  </g>

  <g transform="translate(130, 160)">
    <rect x="0" y="0" width="230" height="240" class="class-box" />
    <text x="115" y="20" class="class-title">UI_ReporteTradicional</text>
    <line x1="0" y1="28" x2="230" y2="28" class="divider" />
    <text x="10" y="48" class="method-text">+ consultarCatalogo(): void</text>
    <text x="10" y="70" class="method-text">+ seleccionarTipoReporte(): void</text>
    <text x="10" y="92" class="method-text">+ cambiarFiltro(): void</text>
    <text x="10" y="114" class="method-text">+ limpiarFiltros(): void</text>
    <text x="10" y="136" class="method-text">+ handleGenerarReporte(): void</text>
    <text x="10" y="158" class="method-text">+ handleExportarExcel(): void</text>
    <text x="10" y="180" class="method-text">+ handleExportarPdf(): void</text>
    <text x="10" y="202" class="method-text">+ previsualizarImpresion(): void</text>
  </g>

  <g transform="translate(420, 180)">
    <rect x="0" y="0" width="260" height="200" class="class-box" />
    <text x="130" y="20" class="class-title">ReporteTradicionalController</text>
    <line x1="0" y1="28" x2="260" y2="28" class="divider" />
    <text x="10" y="55" class="method-text">+ catalogo(): JsonResponse</text>
    <text x="10" y="85" class="method-text">+ parametros(): JsonResponse</text>
    <text x="10" y="115" class="method-text">+ generar(Request): JsonResponse</text>
    <text x="10" y="145" class="method-text">+ exportarExcel(Request): Streamed</text>
    <text x="10" y="175" class="method-text">+ exportarPdf(Request): JsonResponse</text>
  </g>

  <g transform="translate(740, 160)">
    <rect x="0" y="0" width="280" height="240" class="class-box" />
    <text x="140" y="20" class="class-title">ReporteTradicional</text>
    <line x1="0" y1="28" x2="280" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">+ TIPO_CLIENTES_ZONA: string</text>
    <text x="10" y="64" class="attr-text">+ TIPO_INGRESOS_PAGOS: string</text>
    <text x="10" y="82" class="attr-text">+ TIPO_MOROSIDAD_CORTES: string</text>
    <text x="10" y="100" class="attr-text">+ TIPO_EQUIPOS_INSTAL: string</text>
    <line x1="0" y1="108" x2="280" y2="108" class="divider" />
    <text x="10" y="126" class="method-text">+ catalogo(): array</text>
    <text x="10" y="146" class="method-text">+ generar(tipo, filtros): array</text>
    <text x="10" y="166" class="method-text">- generarClientesZona(filtros): array</text>
    <text x="10" y="186" class="method-text">- generarIngresosPagos(filtros): array</text>
    <text x="10" y="206" class="method-text">- generarMorosidadCortes(f): array</text>
  </g>

  <g transform="translate(1110, 130)">
    <rect x="0" y="0" width="240" height="200" class="class-box" />
    <text x="120" y="18" class="class-title">Cliente</text>
    <line x1="0" y1="24" x2="240" y2="24" class="divider" />
    <text x="10" y="42" class="attr-text">- idCliente: int</text>
    <text x="10" y="58" class="attr-text">- codigoCliente: string</text>
    <text x="10" y="74" class="attr-text">- nombreCompleto: string</text>
    <text x="10" y="90" class="attr-text">- telefonoPrincipal: string</text>
    <text x="10" y="106" class="attr-text">- email: string</text>
    <text x="10" y="122" class="attr-text">- estadoCliente: string</text>
    <text x="10" y="138" class="attr-text">- idZona: int</text>
    <line x1="0" y1="146" x2="240" y2="146" class="divider" />
    <text x="10" y="166" class="method-text">+ leftJoin(): Builder   + get(): void</text>
  </g>

  <g transform="translate(1110, 420)">
    <rect x="0" y="0" width="230" height="170" class="class-box" />
    <text x="115" y="18" class="class-title">Pago</text>
    <line x1="0" y1="24" x2="230" y2="24" class="divider" />
    <text x="10" y="40" class="attr-text">- idPago: int</text>
    <text x="10" y="56" class="attr-text">- fechaHora: timestamp</text>
    <text x="10" y="72" class="attr-text">- montoTotal: decimal</text>
    <text x="10" y="88" class="attr-text">- numeroComprobante: string</text>
    <text x="10" y="104" class="attr-text">- idMetodoPago: int</text>
    <line x1="0" y1="112" x2="230" y2="112" class="divider" />
    <text x="10" y="132" class="method-text">+ whereBetween(): Builder</text>
  </g>

  <g transform="translate(850, 600)">
    <rect x="0" y="0" width="220" height="170" class="class-box" />
    <text x="110" y="18" class="class-title">Mensualidad</text>
    <line x1="0" y1="24" x2="220" y2="24" class="divider" />
    <text x="10" y="40" class="attr-text">- idMensualidad: int</text>
    <text x="10" y="56" class="attr-text">- periodo: string</text>
    <text x="10" y="72" class="attr-text">- fechaVencimiento: date</text>
    <text x="10" y="88" class="attr-text">- monto: decimal</text>
    <text x="10" y="104" class="attr-text">- estado: string</text>
    <line x1="0" y1="112" x2="220" y2="112" class="divider" />
    <text x="10" y="132" class="method-text">+ whereIn(): Builder</text>
  </g>

  <g transform="translate(440, 600)">
    <rect x="0" y="0" width="220" height="170" class="class-box" />
    <text x="110" y="18" class="class-title">Bitacora</text>
    <line x1="0" y1="24" x2="220" y2="24" class="divider" />
    <text x="10" y="40" class="attr-text">- idBitacora: int</text>
    <text x="10" y="56" class="attr-text">- accion: string</text>
    <text x="10" y="72" class="attr-text">- detalles: text</text>
    <text x="10" y="88" class="attr-text">- idUsuario: int</text>
    <line x1="0" y1="96" x2="220" y2="96" class="divider" />
    <text x="10" y="116" class="method-text">+ create(): void</text>
  </g>
</svg>`;
}

function buildCU27Sequence() {
  const width = 1680;
  const height = 1180;
  const tabW = 440;

  const xAdmin = 90;
  const xUI = 320;
  const xCtrl = 640;
  const xDom = 1000;
  const xEnt = 1320;
  const xBit = 1540;

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
  <text x="30" y="38" class="tab-title">sd CU27 Generar y exportar reportes tradicionales</text>

  <rect x="20" y="45" width="${width - 40}" height="${height - 65}" fill="#ffffff" stroke="#64748b" stroke-width="1" />

  <g opacity="0.4">
    ${generateWatermarks(width, height)}
  </g>

  <!-- LÍNEAS DE VIDA -->
  <line x1="${xAdmin}" y1="130" x2="${xAdmin}" y2="${height - 50}" class="life-line" />
  <line x1="${xUI}" y1="130" x2="${xUI}" y2="${height - 50}" class="life-line" />
  <line x1="${xCtrl}" y1="130" x2="${xCtrl}" y2="${height - 50}" class="life-line" />
  <line x1="${xDom}" y1="130" x2="${xDom}" y2="${height - 50}" class="life-line" />
  <line x1="${xEnt}" y1="130" x2="${xEnt}" y2="${height - 50}" class="life-line" />
  <line x1="${xBit}" y1="130" x2="${xBit}" y2="${height - 50}" class="life-line" />

  <!-- CABECERAS -->
  <g transform="translate(${xAdmin}, 90)">
    ${actorIcon(0, 0)}
    <text x="0" y="40" class="life-title">Administrador / Gerencia</text>
  </g>
  <g transform="translate(${xUI}, 90)">
    ${boundaryIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">UI_ReporteTradicional</text>
  </g>
  <g transform="translate(${xCtrl}, 90)">
    ${controlIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">ReporteTradicionalController</text>
  </g>
  <g transform="translate(${xDom}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">ReporteTradicional</text>
  </g>
  <g transform="translate(${xEnt}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">Cliente / Pago / Mensualidad</text>
  </g>
  <g transform="translate(${xBit}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">Bitacora</text>
  </g>

  <!-- BLOQUE 1: CATÁLOGO Y PARÁMETROS -->
  <rect x="35" y="150" width="${width - 70}" height="195" class="frame-box" />
  <path d="M 35,170 L 35,150 L 360,150 L 372,170 Z" class="frame-tab" />
  <text x="45" y="164" class="frame-title">alt Flujo 1: Consultar catálogo y parámetros de filtrado</text>

  <rect x="${xAdmin - 5}" y="175" width="10" height="150" class="act-bar" />
  <rect x="${xUI - 5}" y="175" width="10" height="145" class="act-bar" />
  <rect x="${xCtrl - 5}" y="185" width="10" height="120" class="act-bar" />

  <line x1="${xAdmin + 5}" y1="180" x2="${xUI - 5}" y2="180" class="msg-call" />
  <polygon points="${xUI - 5},180 ${xUI - 11},177 ${xUI - 11},183" fill="#1e293b" />
  <text x="130" y="175" class="call-text">1: consultarCatalogoReportes()</text>

  <line x1="${xUI + 5}" y1="195" x2="${xCtrl - 5}" y2="195" class="msg-call" />
  <polygon points="${xCtrl - 5},195 ${xCtrl - 11},192 ${xCtrl - 11},198" fill="#1e293b" />
  <text x="410" y="190" class="call-text">1.1: catalogo()</text>

  <line x1="${xCtrl + 5}" y1="210" x2="${xDom - 5}" y2="210" class="msg-call" />
  <polygon points="${xDom - 5},210 ${xDom - 11},207 ${xDom - 11},213" fill="#1e293b" />
  <text x="730" y="205" class="call-text">1.2: catalogo(): array</text>

  <line x1="${xDom - 5}" y1="225" x2="${xCtrl + 5}" y2="225" class="msg-ret" />
  <text x="750" y="222" class="ret-text">($catalogoDisponibles)</text>

  <line x1="${xCtrl + 5}" y1="245" x2="${xEnt - 5}" y2="245" class="msg-call" />
  <polygon points="${xEnt - 5},245 ${xEnt - 11},242 ${xEnt - 11},248" fill="#1e293b" />
  <text x="730" y="240" class="call-text">1.3: Zona::select()->get(), MetodoPago::select()->get()</text>

  <line x1="${xEnt - 5}" y1="260" x2="${xCtrl + 5}" y2="260" class="msg-ret" />
  <text x="960" y="256" class="ret-text">($zonas, $metodos, $estados)</text>

  <line x1="${xCtrl - 5}" y1="285" x2="${xUI + 5}" y2="285" class="msg-ret" />
  <text x="410" y="280" class="ret-text">success({catalogo, parametros})</text>

  <line x1="${xUI - 5}" y1="305" x2="${xAdmin + 5}" y2="305" class="msg-ret" />
  <text x="130" y="300" class="ret-text">renderizarFormularioFiltros()</text>

  <!-- BLOQUE 2: GENERAR Y AUDITAR -->
  <rect x="35" y="360" width="${width - 70}" height="260" class="frame-box" />
  <path d="M 35,380 L 35,360 L 370,360 L 382,380 Z" class="frame-tab" />
  <text x="45" y="374" class="frame-title">alt Flujo 2: Generar consulta consolidada y auditoría</text>

  <rect x="${xAdmin - 5}" y="385" width="10" height="215" class="act-bar" />
  <rect x="${xUI - 5}" y="385" width="10" height="210" class="act-bar" />
  <rect x="${xCtrl - 5}" y="395" width="10" height="185" class="act-bar" />

  <line x1="${xAdmin + 5}" y1="390" x2="${xUI - 5}" y2="390" class="msg-call" />
  <polygon points="${xUI - 5},390 ${xUI - 11},387 ${xUI - 11},393" fill="#1e293b" />
  <text x="130" y="385" class="call-text">2: generarReporte(tipo, filtros)</text>

  <line x1="${xUI + 5}" y1="410" x2="${xCtrl - 5}" y2="410" class="msg-call" />
  <polygon points="${xCtrl - 5},410 ${xCtrl - 11},407 ${xCtrl - 11},413" fill="#1e293b" />
  <text x="410" y="405" class="call-text">2.1: generar(Request $request)</text>

  <line x1="${xCtrl + 5}" y1="430" x2="${xDom - 5}" y2="430" class="msg-call" />
  <polygon points="${xDom - 5},430 ${xDom - 11},427 ${xDom - 11},433" fill="#1e293b" />
  <text x="730" y="425" class="call-text">2.2: generar($tipo, $filtros): array</text>

  <line x1="${xDom + 5}" y1="450" x2="${xEnt - 5}" y2="450" class="msg-call" />
  <polygon points="${xEnt - 5},450 ${xEnt - 11},447 ${xEnt - 11},453" fill="#1e293b" />
  <text x="1040" y="445" class="call-text">2.3: DB::table(entidades)->where(filtros)->get()</text>

  <line x1="${xEnt - 5}" y1="475" x2="${xDom + 5}" y2="475" class="msg-ret" />
  <text x="1080" y="470" class="ret-text">($filas, $totales)</text>

  <line x1="${xDom - 5}" y1="495" x2="${xCtrl + 5}" y2="495" class="msg-ret" />
  <text x="750" y="490" class="ret-text">($reporteConsolidado)</text>

  <line x1="${xCtrl + 5}" y1="520" x2="${xBit - 5}" y2="520" class="msg-call" />
  <polygon points="${xBit - 5},520 ${xBit - 11},517 ${xBit - 11},523" fill="#1e293b" />
  <text x="1040" y="515" class="call-text">2.4: AuditLogger::log('CU27', 'GENERAR_REPORTE', detalle)</text>

  <line x1="${xCtrl - 5}" y1="545" x2="${xUI + 5}" y2="545" class="msg-ret" />
  <text x="410" y="540" class="ret-text">success({reporte: $reporteConsolidado})</text>

  <line x1="${xUI - 5}" y1="570" x2="${xAdmin + 5}" y2="570" class="msg-ret" />
  <text x="130" y="565" class="ret-text">mostrarTablaReporteConKPIs()</text>

  <!-- BLOQUE 3: EXPORTACIÓN -->
  <rect x="35" y="640" width="${width - 70}" height="220" class="frame-box" />
  <path d="M 35,660 L 35,640 L 330,640 L 342,660 Z" class="frame-tab" />
  <text x="45" y="654" class="frame-title">alt Flujo 3 y 4: Exportación a Excel y PDF oficial</text>

  <rect x="${xAdmin - 5}" y="665" width="10" height="175" class="act-bar" />
  <rect x="${xUI - 5}" y="665" width="10" height="170" class="act-bar" />
  <rect x="${xCtrl - 5}" y="675" width="10" height="145" class="act-bar" />

  <line x1="${xAdmin + 5}" y1="670" x2="${xUI - 5}" y2="670" class="msg-call" />
  <polygon points="${xUI - 5},670 ${xUI - 11},667 ${xUI - 11},673" fill="#1e293b" />
  <text x="130" y="665" class="call-text">3: exportarExcel(tipo, filtros) / exportarPdf()</text>

  <line x1="${xUI + 5}" y1="690" x2="${xCtrl - 5}" y2="690" class="msg-call" />
  <polygon points="${xCtrl - 5},690 ${xCtrl - 11},687 ${xCtrl - 11},693" fill="#1e293b" />
  <text x="410" y="685" class="call-text">3.1: exportarExcel(Request) / exportarPdf(Request)</text>

  <line x1="${xCtrl + 5}" y1="715" x2="${xBit - 5}" y2="715" class="msg-call" />
  <polygon points="${xBit - 5},715 ${xBit - 11},712 ${xBit - 11},718" fill="#1e293b" />
  <text x="1040" y="710" class="call-text">3.2: AuditLogger::log('CU27', 'EXPORTAR_ARCHIVO', detalle)</text>

  <line x1="${xCtrl - 5}" y1="745" x2="${xUI + 5}" y2="745" class="msg-ret" />
  <text x="410" y="740" class="ret-text">response()->streamDownload() / JsonResponse base64</text>

  <line x1="${xUI - 5}" y1="770" x2="${xAdmin + 5}" y2="770" class="msg-ret" />
  <text x="130" y="765" class="ret-text">descargarArchivoBlobOImpresion()</text>
</svg>`;
}

module.exports = {
  buildCU27Communication,
  buildCU27ClassAnalysis,
  buildCU27Sequence,
};

