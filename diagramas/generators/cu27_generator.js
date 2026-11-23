const { generateWatermarks, boundaryIcon, controlIcon, entityIcon, actorIcon } = require('../diagram_helpers');

// =========================================================================
// CU27 - GENERAR Y EXPORTAR REPORTES TRADICIONALES (Daniel Candia - P7)
// Análisis de Clases:
// Actor -> UI_ReporteTradicional -> ReporteTradicionalController -> ReporteTradicional
// A partir de ReporteTradicional:
// ReporteTradicional "1" -up- "0..*" Cliente
// Cliente "0..*" -right- "1" Zona
// ReporteTradicional "1" -down- "0..*" Mensualidad
// ReporteTradicional "1" -right- "0..*" Pago
// Pago "0..*" -down- "1" MetodoPago
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

  <!-- INSTANCIAS -->
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

  <!-- MENSAJES -->
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
  </g>

  <g transform="translate(710, 480)">
    <text x="0" y="0" class="flow-2">2.4: log('CU27', 'GENERAR_REPORTE') &rarr;</text>
    <text x="0" y="20" class="flow-3">3.3: log('CU27', 'EXPORTAR_EXCEL') &rarr;</text>
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

  <g transform="translate(50, 830)">
    <rect x="0" y="0" width="1550" height="42" fill="#f8fafc" stroke="#cbd5e1" rx="4" />
    <text x="20" y="26" font-size="11" font-weight="bold" fill="#0f172a">Convención de Flujos:</text>
    <text x="170" y="26" class="flow-1">&bull; Flujo 1: Consultar catálogo de reportes</text>
    <text x="560" y="26" class="flow-2">&bull; Flujo 2: Generar consulta consolidada</text>
    <text x="940" y="26" class="flow-3">&bull; Flujo 3: Exportar reporte a Excel (CSV)</text>
    <text x="1270" y="26" class="flow-4">&bull; Flujo 4: Exportar reporte a PDF</text>
  </g>
</svg>`;
}

function buildCU27ClassAnalysis() {
  const width = 1750;
  const height = 750;
  const tabW = 540;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background:#ffffff; font-family: 'Segoe UI', Arial, sans-serif;">
  <defs>
    <style>
      .tab-title { font-size: 11px; font-weight: bold; fill: #000000; }
      .class-box { fill: #FFF2E6; stroke: #8A4B38; stroke-width: 1; rx: 6; ry: 6; }
      .class-title { font-size: 12px; font-weight: bold; fill: #000000; text-anchor: middle; }
      .attr-text { font-size: 11px; fill: #000000; font-family: 'Segoe UI', Arial, sans-serif; }
      .method-text { font-size: 11px; fill: #000000; font-family: 'Segoe UI', Arial, sans-serif; }
      .mult-text { font-size: 11px; fill: #000000; font-weight: bold; }
      .link-line { stroke: #000000; stroke-width: 1; fill: none; }
      .divider { stroke: #8A4B38; stroke-width: 0.8; }
    </style>
  </defs>

  <path d="M 10,35 L 10,18 L ${tabW},18 L ${tabW + 14},35 Z" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="18" y="30" class="tab-title">sd Diagrama de análisis de clases - CU27 Generar y exportar reportes tradicionales</text>

  <rect x="10" y="35" width="${width - 20}" height="${height - 45}" fill="#ffffff" stroke="#000000" stroke-width="1" />

  <!-- LÍNEAS DE ASOCIACIÓN -->
  <!-- Actor a UI -->
  <line x1="110" y1="360" x2="160" y2="360" class="link-line" />

  <!-- UI a Controller -->
  <line x1="390" y1="360" x2="450" y2="360" class="link-line" />

  <!-- Controller a Entidad Principal (SOLO A REPORTETRADICIONAL!) -->
  <line x1="730" y1="360" x2="800" y2="360" class="link-line" />

  <!-- ReporteTradicional a Cliente (Arriba) -->
  <line x1="910" y1="260" x2="910" y2="170" class="link-line" />
  <text x="920" y="245" class="mult-text">1</text>
  <text x="920" y="185" class="mult-text">0..*</text>

  <!-- Cliente a Zona (Arriba a la derecha) -->
  <line x1="1020" y1="110" x2="1100" y2="110" class="link-line" />
  <text x="1035" y="100" class="mult-text">0..*</text>
  <text x="1080" y="100" class="mult-text">1</text>

  <!-- ReporteTradicional a Mensualidad (Abajo) -->
  <line x1="910" y1="460" x2="910" y2="550" class="link-line" />
  <text x="920" y="480" class="mult-text">1</text>
  <text x="920" y="535" class="mult-text">0..*</text>

  <!-- ReporteTradicional a Pago (Derecha) -->
  <line x1="1020" y1="360" x2="1100" y2="360" class="link-line" />
  <text x="1035" y="350" class="mult-text">1</text>
  <text x="1080" y="350" class="mult-text">0..*</text>

  <!-- Pago a MetodoPago (Abajo de Pago) -->
  <line x1="1205" y1="440" x2="1205" y2="550" class="link-line" />
  <text x="1215" y="465" class="mult-text">0..*</text>
  <text x="1215" y="535" class="mult-text">1</text>

  <!-- 1. ACTOR -->
  <g transform="translate(60, 360)">
    ${actorIcon(0, 0)}
    <text x="0" y="45" class="class-title">Administrador / Gerencia</text>
  </g>

  <!-- 2. BOUNDARY -->
  <g transform="translate(160, 275)">
    <rect x="0" y="0" width="230" height="170" class="class-box" />
    <text x="115" y="20" class="class-title">UI_ReporteTradicional</text>
    <line x1="0" y1="28" x2="230" y2="28" class="divider" />
    <text x="10" y="48" class="method-text">+ consultarCatalogo(): void</text>
    <text x="10" y="70" class="method-text">+ seleccionarTipoReporte(): void</text>
    <text x="10" y="92" class="method-text">+ handleGenerarReporte(): void</text>
    <text x="10" y="114" class="method-text">+ handleExportarExcel(): void</text>
    <line x1="0" y1="124" x2="230" y2="124" class="divider" />
    <text x="10" y="146" class="method-text">+ handleExportarPdf(): void</text>
  </g>

  <!-- 3. CONTROL -->
  <g transform="translate(450, 270)">
    <rect x="0" y="0" width="280" height="180" class="class-box" />
    <text x="140" y="20" class="class-title">ReporteTradicionalController</text>
    <line x1="0" y1="28" x2="280" y2="28" class="divider" />
    <text x="10" y="50" class="method-text">+ catalogo(): void</text>
    <text x="10" y="72" class="method-text">+ parametros(): void</text>
    <text x="10" y="94" class="method-text">+ generar(): void</text>
    <text x="10" y="116" class="method-text">+ exportarExcel(): void</text>
    <line x1="0" y1="126" x2="280" y2="126" class="divider" />
    <text x="10" y="148" class="method-text">+ exportarPdf(): void</text>
  </g>

  <!-- 4. TABLA PRINCIPAL: ReporteTradicional -->
  <g transform="translate(800, 260)">
    <rect x="0" y="0" width="220" height="200" class="class-box" />
    <text x="110" y="20" class="class-title">ReporteTradicional</text>
    <line x1="0" y1="28" x2="220" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- tipoReporte: string</text>
    <text x="10" y="64" class="attr-text">- fechaDesde: date</text>
    <text x="10" y="82" class="attr-text">- fechaHasta: date</text>
    <text x="10" y="100" class="attr-text">- filtros: json</text>
    <text x="10" y="118" class="attr-text">- formatoSalida: string</text>
    <line x1="0" y1="126" x2="220" y2="126" class="divider" />
    <text x="10" y="146" class="method-text">+ catalogo(): void</text>
    <text x="10" y="166" class="method-text">+ generar(): void</text>
  </g>

  <!-- 5. ENTIDAD: Cliente (Arriba) -->
  <g transform="translate(800, 50)">
    <rect x="0" y="0" width="220" height="120" class="class-box" />
    <text x="110" y="20" class="class-title">Cliente</text>
    <line x1="0" y1="28" x2="220" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idCliente: int</text>
    <text x="10" y="64" class="attr-text">- nombreCompleto: string</text>
    <text x="10" y="82" class="attr-text">- idZona: int</text>
    <line x1="0" y1="90" x2="220" y2="90" class="divider" />
    <text x="10" y="108" class="method-text">+ get(): void</text>
  </g>

  <!-- 6. ENTIDAD: Zona (Arriba Derecha de Cliente) -->
  <g transform="translate(1100, 50)">
    <rect x="0" y="0" width="210" height="120" class="class-box" />
    <text x="105" y="20" class="class-title">Zona</text>
    <line x1="0" y1="28" x2="210" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idZona: int</text>
    <text x="10" y="64" class="attr-text">- nombreZona: string</text>
    <text x="10" y="82" class="attr-text">- codigo: string</text>
    <line x1="0" y1="90" x2="210" y2="90" class="divider" />
    <text x="10" y="108" class="method-text">+ select(): void</text>
  </g>

  <!-- 7. ENTIDAD: Mensualidad (Abajo) -->
  <g transform="translate(800, 550)">
    <rect x="0" y="0" width="220" height="130" class="class-box" />
    <text x="110" y="20" class="class-title">Mensualidad</text>
    <line x1="0" y1="28" x2="220" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idMensualidad: int</text>
    <text x="10" y="64" class="attr-text">- periodo: string</text>
    <text x="10" y="82" class="attr-text">- estado: string</text>
    <text x="10" y="100" class="attr-text">- monto: decimal</text>
    <line x1="0" y1="108" x2="220" y2="108" class="divider" />
    <text x="10" y="124" class="method-text">+ whereIn(): void</text>
  </g>

  <!-- 8. ENTIDAD: Pago (Derecha de ReporteTradicional) -->
  <g transform="translate(1100, 275)">
    <rect x="0" y="0" width="210" height="165" class="class-box" />
    <text x="105" y="20" class="class-title">Pago</text>
    <line x1="0" y1="28" x2="210" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idPago: int</text>
    <text x="10" y="64" class="attr-text">- fechaPago: date</text>
    <text x="10" y="82" class="attr-text">- montoTotal: decimal</text>
    <text x="10" y="100" class="attr-text">- idMetodoPago: int</text>
    <line x1="0" y1="108" x2="210" y2="108" class="divider" />
    <text x="10" y="128" class="method-text">+ whereBetween(): void</text>
    <text x="10" y="146" class="method-text">+ sum(): void</text>
  </g>

  <!-- 9. ENTIDAD: MetodoPago (Abajo de Pago) -->
  <g transform="translate(1100, 550)">
    <rect x="0" y="0" width="210" height="120" class="class-box" />
    <text x="105" y="20" class="class-title">MetodoPago</text>
    <line x1="0" y1="28" x2="210" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idMetodoPago: int</text>
    <text x="10" y="64" class="attr-text">- nombreMetodo: string</text>
    <text x="10" y="82" class="attr-text">- estado: string</text>
    <line x1="0" y1="90" x2="210" y2="90" class="divider" />
    <text x="10" y="108" class="method-text">+ get(): void</text>
  </g>
</svg>`;
}

function buildCU27Sequence() {
  const width = 1680;
  const height = 1180;
  const tabW = 460;

  const xAdmin = 70;
  const xUI = 240;
  const xCtrl = 440;
  const xDom = 650;
  const xZona = 840;
  const xCli = 1030;
  const xPago = 1220;
  const xMens = 1410;
  const xBit = 1590;

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
  <line x1="${xZona}" y1="130" x2="${xZona}" y2="${height - 50}" class="life-line" />
  <line x1="${xCli}" y1="130" x2="${xCli}" y2="${height - 50}" class="life-line" />
  <line x1="${xPago}" y1="130" x2="${xPago}" y2="${height - 50}" class="life-line" />
  <line x1="${xMens}" y1="130" x2="${xMens}" y2="${height - 50}" class="life-line" />
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
  <g transform="translate(${xZona}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">Zona</text>
  </g>
  <g transform="translate(${xCli}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">Cliente</text>
  </g>
  <g transform="translate(${xPago}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">Pago</text>
  </g>
  <g transform="translate(${xMens}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">Mensualidad</text>
  </g>
  <g transform="translate(${xBit}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">Bitacora</text>
  </g>

  <!-- BLOQUE 1 -->
  <rect x="35" y="150" width="${width - 70}" height="205" class="frame-box" />
  <path d="M 35,170 L 35,150 L 360,150 L 372,170 Z" class="frame-tab" />
  <text x="45" y="164" class="frame-title">alt Flujo 1: Consultar catálogo y parámetros de filtrado</text>

  <rect x="${xAdmin - 5}" y="175" width="10" height="160" class="act-bar" />
  <rect x="${xUI - 5}" y="175" width="10" height="155" class="act-bar" />
  <rect x="${xCtrl - 5}" y="185" width="10" height="130" class="act-bar" />

  <line x1="${xAdmin + 5}" y1="180" x2="${xUI - 5}" y2="180" class="msg-call" />
  <polygon points="${xUI - 5},180 ${xUI - 11},177 ${xUI - 11},183" fill="#1e293b" />
  <text x="100" y="175" class="call-text">1: consultarCatalogoReportes()</text>

  <line x1="${xUI + 5}" y1="195" x2="${xCtrl - 5}" y2="195" class="msg-call" />
  <polygon points="${xCtrl - 5},195 ${xCtrl - 11},192 ${xCtrl - 11},198" fill="#1e293b" />
  <text x="270" y="190" class="call-text">1.1: catalogo(), parametros()</text>

  <line x1="${xCtrl + 5}" y1="210" x2="${xDom - 5}" y2="210" class="msg-call" />
  <polygon points="${xDom - 5},210 ${xDom - 11},207 ${xDom - 11},213" fill="#1e293b" />
  <text x="460" y="205" class="call-text">1.2: catalogo(): array</text>

  <line x1="${xDom - 5}" y1="225" x2="${xCtrl + 5}" y2="225" class="msg-ret" />
  <text x="490" y="222" class="ret-text">($catalogoDisponibles)</text>

  <line x1="${xCtrl + 5}" y1="245" x2="${xZona - 5}" y2="245" class="msg-call" />
  <polygon points="${xZona - 5},245 ${xZona - 11},242 ${xZona - 11},248" fill="#1e293b" />
  <text x="500" y="240" class="call-text">1.3: Zona::query()->select(['idZona', 'nombreZona'])->get()</text>

  <line x1="${xZona - 5}" y1="265" x2="${xCtrl + 5}" y2="265" class="msg-ret" />
  <text x="600" y="260" class="ret-text">($zonasParametros)</text>

  <line x1="${xCtrl - 5}" y1="290" x2="${xUI + 5}" y2="290" class="msg-ret" />
  <text x="270" y="285" class="ret-text">success({catalogo, parametros})</text>

  <line x1="${xUI - 5}" y1="315" x2="${xAdmin + 5}" y2="315" class="msg-ret" />
  <text x="100" y="310" class="ret-text">renderizarFormularioFiltros()</text>

  <!-- BLOQUE 2 -->
  <rect x="35" y="370" width="${width - 70}" height="280" class="frame-box" />
  <path d="M 35,390 L 35,370 L 370,370 L 382,390 Z" class="frame-tab" />
  <text x="45" y="384" class="frame-title">alt Flujo 2: Generar consulta consolidada y auditoría</text>

  <rect x="${xAdmin - 5}" y="395" width="10" height="235" class="act-bar" />
  <rect x="${xUI - 5}" y="395" width="10" height="230" class="act-bar" />
  <rect x="${xCtrl - 5}" y="405" width="10" height="205" class="act-bar" />

  <line x1="${xAdmin + 5}" y1="400" x2="${xUI - 5}" y2="400" class="msg-call" />
  <polygon points="${xUI - 5},400 ${xUI - 11},397 ${xUI - 11},403" fill="#1e293b" />
  <text x="100" y="395" class="call-text">2: generarReporte(tipo, filtros)</text>

  <line x1="${xUI + 5}" y1="420" x2="${xCtrl - 5}" y2="420" class="msg-call" />
  <polygon points="${xCtrl - 5},420 ${xCtrl - 11},417 ${xCtrl - 11},423" fill="#1e293b" />
  <text x="270" y="415" class="call-text">2.1: generar(Request $request)</text>

  <line x1="${xCtrl + 5}" y1="440" x2="${xDom - 5}" y2="440" class="msg-call" />
  <polygon points="${xDom - 5},440 ${xDom - 11},437 ${xDom - 11},443" fill="#1e293b" />
  <text x="460" y="435" class="call-text">2.2: generar($tipo, $filtros): array</text>

  <!-- Query Cliente -->
  <line x1="${xDom + 5}" y1="460" x2="${xCli - 5}" y2="460" class="msg-call" />
  <polygon points="${xCli - 5},460 ${xCli - 11},457 ${xCli - 11},463" fill="#1e293b" />
  <text x="680" y="455" class="call-text">2.3.1: table('Cliente')->leftJoin('Zona')->get()</text>

  <line x1="${xCli - 5}" y1="480" x2="${xDom + 5}" y2="480" class="msg-ret" />
  <text x="740" y="475" class="ret-text">($clientes)</text>

  <!-- Query Pago -->
  <line x1="${xDom + 5}" y1="500" x2="${xPago - 5}" y2="500" class="msg-call" />
  <polygon points="${xPago - 5},500 ${xPago - 11},497 ${xPago - 11},503" fill="#1e293b" />
  <text x="680" y="495" class="call-text">2.3.2: table('Pago')->join('MetodoPago')->get()</text>

  <line x1="${xPago - 5}" y1="520" x2="${xDom + 5}" y2="520" class="msg-ret" />
  <text x="740" y="515" class="ret-text">($pagos)</text>

  <!-- Query Mensualidad -->
  <line x1="${xDom + 5}" y1="540" x2="${xMens - 5}" y2="540" class="msg-call" />
  <polygon points="${xMens - 5},540 ${xMens - 11},537 ${xMens - 11},543" fill="#1e293b" />
  <text x="680" y="535" class="call-text">2.3.3: table('Mensualidad')->whereIn('estado', ['PENDIENTE','VENCIDA'])->get()</text>

  <line x1="${xMens - 5}" y1="560" x2="${xDom + 5}" y2="560" class="msg-ret" />
  <text x="740" y="555" class="ret-text">($mensualidades)</text>

  <line x1="${xDom - 5}" y1="580" x2="${xCtrl + 5}" y2="580" class="msg-ret" />
  <text x="490" y="575" class="ret-text">($reporteConsolidado)</text>

  <line x1="${xCtrl + 5}" y1="595" x2="${xBit - 5}" y2="595" class="msg-call" />
  <polygon points="${xBit - 5},595 ${xBit - 11},592 ${xBit - 11},598" fill="#1e293b" />
  <text x="1100" y="590" class="call-text">2.4: AuditLogger::log('CU27', 'GENERAR_REPORTE', detalle)</text>

  <line x1="${xCtrl - 5}" y1="610" x2="${xUI + 5}" y2="610" class="msg-ret" />
  <text x="270" y="605" class="ret-text">success({reporte: $reporteConsolidado})</text>

  <line x1="${xUI - 5}" y1="625" x2="${xAdmin + 5}" y2="625" class="msg-ret" />
  <text x="100" y="620" class="ret-text">mostrarTablaReporteConKPIs()</text>

  <!-- BLOQUE 3 -->
  <rect x="35" y="670" width="${width - 70}" height="200" class="frame-box" />
  <path d="M 35,690 L 35,670 L 330,670 L 342,690 Z" class="frame-tab" />
  <text x="45" y="684" class="frame-title">alt Flujo 3: Exportar reporte a Excel</text>

  <rect x="${xAdmin - 5}" y="695" width="10" height="155" class="act-bar" />
  <rect x="${xUI - 5}" y="695" width="10" height="150" class="act-bar" />
  <rect x="${xCtrl - 5}" y="705" width="10" height="125" class="act-bar" />

  <line x1="${xAdmin + 5}" y1="700" x2="${xUI - 5}" y2="700" class="msg-call" />
  <polygon points="${xUI - 5},700 ${xUI - 11},697 ${xUI - 11},703" fill="#1e293b" />
  <text x="100" y="695" class="call-text">3: exportarExcel(tipo, filtros)</text>

  <line x1="${xUI + 5}" y1="720" x2="${xCtrl - 5}" y2="720" class="msg-call" />
  <polygon points="${xCtrl - 5},720 ${xCtrl - 11},717 ${xCtrl - 11},723" fill="#1e293b" />
  <text x="270" y="715" class="call-text">3.1: exportarExcel(Request)</text>

  <line x1="${xCtrl + 5}" y1="740" x2="${xBit - 5}" y2="740" class="msg-call" />
  <polygon points="${xBit - 5},740 ${xBit - 11},737 ${xBit - 11},743" fill="#1e293b" />
  <text x="1100" y="735" class="call-text">3.2: AuditLogger::log('CU27', 'EXPORTAR_ARCHIVO')</text>

  <line x1="${xCtrl - 5}" y1="765" x2="${xUI + 5}" y2="765" class="msg-ret" />
  <text x="270" y="760" class="ret-text">response()->streamDownload()</text>

  <line x1="${xUI - 5}" y1="790" x2="${xAdmin + 5}" y2="790" class="msg-ret" />
  <text x="100" y="785" class="ret-text">descargarArchivoBlob()</text>
</svg>`;
}

module.exports = {
  buildCU27Communication,
  buildCU27ClassAnalysis,
  buildCU27Sequence,
};
