const fs = require('fs');
const path = require('path');

const outputDir = path.resolve(__dirname);

// Helper para marcas de agua Enterprise Architect 17.2 Trial
function generateWatermarks(width, height) {
  let watermarks = '';
  for (let y = 95; y < height - 40; y += 45) {
    watermarks += `
    <text x="30" y="${y}" fill="#d5dae2" font-family="Arial, sans-serif" font-size="11.5" letter-spacing="1">
      EA 17.2 Unregistered Trial Version   EA 17.2 Unregistered Trial Version   EA 17.2 Unregistered Trial Version   EA 17.2 Unregistered Trial Version   EA 17.2 Unregistered Trial Version   EA 17.2 Unregistered Trial Version
    </text>`;
  }
  return watermarks;
}

// Iconos de robustez
const boundaryIcon = (cx, cy, r = 18) => `
  <line x1="${cx - r - 5}" y1="${cy - r}" x2="${cx - r - 5}" y2="${cy + r}" stroke="#475569" stroke-width="2.5" />
  <line x1="${cx - r - 5}" y1="${cy}" x2="${cx - r}" y2="${cy}" stroke="#475569" stroke-width="2" />
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffea" stroke="#475569" stroke-width="2" />
`;

const controlIcon = (cx, cy, r = 18) => `
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffea" stroke="#475569" stroke-width="2" />
  <path d="M ${cx - 5} ${cy - r} L ${cx + 4} ${cy - r - 4} L ${cx + 2} ${cy - r} C ${cx + 11} ${cy - r + 3} ${cx + r + 2} ${cy - 2} ${cx + r} ${cy + 6}" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round" />
  <polygon points="${cx - 7},${cy - r} ${cx + 4},${cy - r - 6} ${cx + 1},${cy - r + 5}" fill="#475569" />
`;

const entityIcon = (cx, cy, r = 18) => `
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffea" stroke="#475569" stroke-width="2" />
  <line x1="${cx - r}" y1="${cy + r + 4}" x2="${cx + r}" y2="${cy + r + 4}" stroke="#475569" stroke-width="2.5" />
`;

const actorIcon = (cx, cy) => `
  <circle cx="${cx}" cy="${cy - 26}" r="8.5" fill="#ffffea" stroke="#1e293b" stroke-width="1.8" />
  <line x1="${cx}" y1="${cy - 17.5}" x2="${cx}" y2="${cy + 5}" stroke="#1e293b" stroke-width="2" />
  <line x1="${cx - 15}" y1="${cy - 8}" x2="${cx + 15}" y2="${cy - 8}" stroke="#1e293b" stroke-width="2" />
  <line x1="${cx}" y1="${cy + 5}" x2="${cx - 12}" y2="${cy + 25}" stroke="#1e293b" stroke-width="2" />
  <line x1="${cx}" y1="${cy + 5}" x2="${cx + 12}" y2="${cy + 25}" stroke="#1e293b" stroke-width="2" />
`;

function wrapHtml(title, svgContent) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #f8fafc;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
      padding: 20px 14px;
      font-family: Arial, Helvetica, sans-serif;
    }
    .header-bar {
      width: 100%;
      max-width: 1680px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      border: 1px solid #e2e8f0;
    }
    .header-bar h1 {
      font-size: 15px;
      color: #0f172a;
      font-weight: 700;
    }
    .btn-action {
      background: #0284c7;
      color: #ffffff;
      border: none;
      padding: 7px 14px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      text-decoration: none;
    }
    .btn-action:hover { background: #0369a1; }
    .card {
      background: #ffffff;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
      width: 100%;
      max-width: 1680px;
      overflow-x: auto;
      border: 1px solid #cbd5e1;
    }
    svg { width: 100%; height: auto; display: block; }
  </style>
</head>
<body>
  <div class="header-bar">
    <h1>${title} &mdash; Estándar Enterprise Architect 17.2</h1>
    <button class="btn-action" onclick="window.print()">Imprimir / Exportar a PDF</button>
  </div>
  <div class="card">
    ${svgContent}
  </div>
</body>
</html>`;
}

// =========================================================================
// 1. CU27 - DIAGRAMA DE COMUNICACIÓN
// =========================================================================
function buildCU27Communication() {
  const width = 1650;
  const height = 920;
  const tabW = 420;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background:#ffffff; font-family: Arial, Helvetica, sans-serif;">
  <defs>
    <style>
      .tab-title { font-size: 10px; font-weight: bold; fill: #1e293b; }
      .node-title { font-size: 12px; font-weight: bold; fill: #0f172a; text-anchor: middle; }
      .link-line { stroke: #64748b; stroke-width: 1.2; fill: none; }
      .flow-1 { fill: #0f172a; font-size: 10.5px; font-weight: bold; font-family: Arial, sans-serif; }
      .flow-2 { fill: #b91c1c; font-size: 10.5px; font-weight: bold; font-family: Arial, sans-serif; }
      .flow-3 { fill: #15803d; font-size: 10.5px; font-weight: bold; font-family: Arial, sans-serif; }
      .flow-4 { fill: #1d4ed8; font-size: 10.5px; font-weight: bold; font-family: Arial, sans-serif; }
      .sub-msg { font-size: 9.5px; font-weight: normal; fill: #475569; }
    </style>
  </defs>

  <!-- Pestaña de Diagrama EA -->
  <path d="M 20,45 L 20,24 L ${tabW},24 L ${tabW + 16},45 Z" fill="#ffffff" stroke="#64748b" stroke-width="1" />
  <text x="30" y="38" class="tab-title">sd CU27 Generar y exportar reportes tradicionales</text>

  <!-- Marco Exterior -->
  <rect x="20" y="45" width="${width - 40}" height="${height - 65}" fill="#ffffff" stroke="#64748b" stroke-width="1" />

  <!-- Marcas de agua -->
  <g opacity="0.45">
    ${generateWatermarks(width, height)}
  </g>

  <!-- LÍNEAS DE ENLACE ENTRE INSTANCIAS -->
  <!-- Admin a UI -->
  <line x1="105" y1="360" x2="330" y2="360" class="link-line" />

  <!-- UI a Controller -->
  <line x1="370" y1="360" x2="680" y2="360" class="link-line" />

  <!-- Controller a ReporteTradicional (Servicio de Dominio) -->
  <line x1="720" y1="360" x2="1140" y2="360" class="link-line" />

  <!-- Controller a Bitacora (Vertical hacia abajo) -->
  <line x1="700" y1="400" x2="700" y2="650" class="link-line" />

  <!-- Controller a Zona (Diagonal hacia arriba) -->
  <line x1="700" y1="320" x2="700" y2="150" class="link-line" />

  <!-- ReporteTradicional a Cliente (Diagonal hacia arriba-derecha) -->
  <line x1="1160" y1="320" x2="1160" y2="150" class="link-line" />

  <!-- ReporteTradicional a Pago (Diagonal hacia abajo-derecha) -->
  <line x1="1160" y1="400" x2="1160" y2="650" class="link-line" />

  <!-- ReporteTradicional a Mensualidad -->
  <line x1="1185" y1="360" x2="1480" y2="360" class="link-line" />

  <!-- NODOS / INSTANCIAS -->

  <!-- 1. Actor: Administrador -->
  <g transform="translate(100, 360)">
    ${actorIcon(0, 0)}
    <text x="0" y="48" class="node-title">Administrador</text>
  </g>

  <!-- 2. Boundary: UI_ReporteTradicional -->
  <g transform="translate(350, 360)">
    ${boundaryIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">UI_ReporteTradicional</text>
  </g>

  <!-- 3. Control: ReporteTradicionalController -->
  <g transform="translate(700, 360)">
    ${controlIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">ReporteTradicionalController</text>
  </g>

  <!-- 4. Dominio: ReporteTradicional -->
  <g transform="translate(1160, 360)">
    ${entityIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">ReporteTradicional</text>
  </g>

  <!-- 5. Entity: Zona -->
  <g transform="translate(700, 130)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Zona</text>
  </g>

  <!-- 6. Entity: Bitacora -->
  <g transform="translate(700, 670)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Bitacora</text>
  </g>

  <!-- 7. Entity: Cliente -->
  <g transform="translate(1160, 130)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Cliente</text>
  </g>

  <!-- 8. Entity: Pago -->
  <g transform="translate(1160, 670)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Pago</text>
  </g>

  <!-- 9. Entity: Mensualidad -->
  <g transform="translate(1500, 360)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Mensualidad</text>
  </g>

  <!-- ================= MENSAJES Y LLAMADAS DE COMUNICACIÓN ================= -->

  <!-- Mensajes entre Administrador y UI -->
  <g transform="translate(125, 275)">
    <text x="0" y="0" class="flow-1">1: consultarCatalogoReportes() &rarr;</text>
    <text x="0" y="16" class="flow-1">1.3: cargarParametrosFiltros() &rarr;</text>
    <text x="0" y="32" class="flow-2">2: generarReporte(tipo, filtros) &rarr;</text>
    <text x="0" y="48" class="flow-3">3: exportarAExcel() &rarr;</text>
    <text x="0" y="64" class="flow-4">4: exportarAPdf() &rarr;</text>
  </g>

  <!-- Mensajes entre UI y Controller -->
  <g transform="translate(385, 260)">
    <text x="0" y="0" class="flow-1">1.1: catalogo() &rarr;</text>
    <text x="0" y="15" class="flow-1">1.4: parametros() &rarr;</text>
    <text x="0" y="30" class="flow-2">2.1: generar(Request) &rarr;</text>
    <text x="0" y="45" class="flow-3">3.1: exportarExcel(Request) &rarr;</text>
    <text x="0" y="60" class="flow-4">4.1: exportarPdf(Request) &rarr;</text>
  </g>

  <!-- Mensajes entre Controller y Zona -->
  <g transform="translate(710, 210)">
    <text x="0" y="0" class="flow-1">1.5: query()-&gt;select(['idZona', 'nombreZona', 'codigo'])-&gt;get() &rarr;</text>
  </g>

  <!-- Mensajes entre Controller y ReporteTradicional -->
  <g transform="translate(740, 260)">
    <text x="0" y="0" class="flow-1">1.2: catalogo() &rarr;</text>
    <text x="0" y="18" class="flow-2">2.2: generar(tipo, filtros) &rarr;</text>
    <text x="0" y="36" class="flow-3">3.2: generar(tipo, filtros) &rarr;</text>
    <text x="0" y="54" class="flow-4">4.2: generar(tipo, filtros) &rarr;</text>
  </g>

  <!-- Mensajes entre Controller y Bitacora -->
  <g transform="translate(710, 480)">
    <text x="0" y="0" class="flow-2">2.4: log('CU27', 'GENERAR_REPORTE', detalle) &rarr;</text>
    <text x="0" y="20" class="flow-3">3.3: log('CU27', 'EXPORTAR_EXCEL', detalle) &rarr;</text>
    <text x="0" y="40" class="flow-4">4.3: log('CU27', 'EXPORTAR_PDF', detalle) &rarr;</text>
  </g>

  <!-- Mensajes entre ReporteTradicional y Cliente -->
  <g transform="translate(1170, 210)">
    <text x="0" y="0" class="flow-2">2.3.1: table('Cliente')-&gt;leftJoin('Zona')-&gt;leftJoin('ServicioInternet')-&gt;get() &rarr;</text>
  </g>

  <!-- Mensajes entre ReporteTradicional y Pago -->
  <g transform="translate(1170, 490)">
    <text x="0" y="0" class="flow-2">2.3.2: table('Pago')-&gt;join('MetodoPago')-&gt;whereBetween()-&gt;get() &rarr;</text>
  </g>

  <!-- Mensajes entre ReporteTradicional y Mensualidad -->
  <g transform="translate(1210, 345)">
    <text x="0" y="0" class="flow-2">2.3.3: table('Mensualidad')-&gt;whereIn('estado', ['PENDIENTE','VENCIDA'])-&gt;get() &rarr;</text>
  </g>

  <!-- LEYENDA INFERIOR -->
  <g transform="translate(50, 830)">
    <rect x="0" y="0" width="1550" height="42" fill="#f8fafc" stroke="#cbd5e1" rx="4" />
    <text x="20" y="26" font-size="11" font-weight="bold" fill="#0f172a">Convención de Flujos:</text>
    <text x="170" y="26" class="flow-1">&bull; Flujo 1: Consultar catálogo de reportes y parámetros de filtrado</text>
    <text x="580" y="26" class="flow-2">&bull; Flujo 2: Generar consulta consolidada y auditoría</text>
    <text x="940" y="26" class="flow-3">&bull; Flujo 3: Exportar reporte a Excel (CSV con BOM)</text>
    <text x="1270" y="26" class="flow-4">&bull; Flujo 4: Exportar reporte a PDF oficial</text>
  </g>
</svg>
  `;
}

// =========================================================================
// 2. CU27 - ANÁLISIS DE CLASES
// =========================================================================
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

  <!-- Pestaña de Diagrama EA -->
  <path d="M 20,45 L 20,24 L ${tabW},24 L ${tabW + 16},45 Z" fill="#ffffff" stroke="#606060" stroke-width="1" />
  <text x="30" y="38" class="tab-title">class CU27 Generar y exportar reportes tradicionales</text>

  <!-- Marco Exterior -->
  <rect x="20" y="45" width="${width - 40}" height="${height - 65}" fill="#ffffff" stroke="#606060" stroke-width="1" />

  <!-- Marcas de agua -->
  <g opacity="0.45">
    ${generateWatermarks(width, height)}
  </g>

  <!-- LÍNEAS DE ASOCIACIÓN -->

  <!-- Actor a UI -->
  <line x1="85" y1="280" x2="130" y2="280" class="ea-line" />

  <!-- UI a Controller -->
  <line x1="360" y1="280" x2="420" y2="280" class="ea-line" />
  <text x="375" y="272" class="assoc-text">invoca</text>

  <!-- Controller a ReporteTradicional -->
  <line x1="680" y1="280" x2="740" y2="280" class="ea-line" />
  <text x="690" y="272" class="assoc-text">genera</text>

  <!-- Controller a Bitacora (Vertical hacia abajo) -->
  <line x1="550" y1="390" x2="550" y2="600" class="ea-line" />
  <text x="560" y="500" class="assoc-text">registra auditoría</text>
  <text x="560" y="415" class="mult-text">1</text>
  <text x="560" y="585" class="mult-text">0..*</text>

  <!-- ReporteTradicional a Cliente (Hacia la derecha superior) -->
  <line x1="1020" y1="230" x2="1110" y2="230" class="ea-line" />
  <text x="1035" y="222" class="assoc-text">consulta</text>
  <text x="1030" y="245" class="mult-text">1</text>
  <text x="1085" y="245" class="mult-text">0..*</text>

  <!-- Cliente a Zona (Vertical hacia arriba) -->
  <line x1="1230" y1="130" x2="1230" y2="90" class="ea-line" />
  <line x1="1230" y1="90" x2="880" y2="90" class="ea-line" />
  <line x1="880" y1="90" x2="880" y2="130" class="ea-line" />
  <text x="1040" y="82" class="assoc-text">pertenece a</text>
  <text x="1210" y="115" class="mult-text">0..*</text>
  <text x="895" y="115" class="mult-text">1</text>

  <!-- ReporteTradicional a Pago (Hacia la derecha inferior) -->
  <line x1="1020" y1="360" x2="1110" y2="480" class="ea-line" />
  <text x="1040" y="410" class="assoc-text">consolida</text>
  <text x="1030" y="380" class="mult-text">1</text>
  <text x="1090" y="470" class="mult-text">0..*</text>

  <!-- Pago a MetodoPago (Hacia la derecha) -->
  <line x1="1340" y1="520" x2="1420" y2="520" class="ea-line" />
  <text x="1355" y="512" class="assoc-text">utiliza</text>
  <text x="1350" y="535" class="mult-text">0..*</text>
  <text x="1400" y="535" class="mult-text">1</text>

  <!-- ReporteTradicional a Mensualidad -->
  <line x1="950" y1="410" x2="950" y2="600" class="ea-line" />
  <text x="960" y="510" class="assoc-text">evalúa mora</text>
  <text x="960" y="430" class="mult-text">1</text>
  <text x="960" y="585" class="mult-text">0..*</text>

  <!-- ReporteTradicional a Equipo -->
  <line x1="830" y1="410" x2="830" y2="720" class="ea-line" />
  <line x1="830" y1="720" x2="1110" y2="720" class="ea-line" />
  <text x="950" y="712" class="assoc-text">audita comodatos</text>
  <text x="840" y="430" class="mult-text">1</text>
  <text x="1080" y="712" class="mult-text">0..*</text>

  <!-- CLASES / CAJAS EA -->

  <!-- Actor: Administrador -->
  <g transform="translate(60, 280)">
    ${actorIcon(0, 0)}
    <text x="0" y="45" class="class-title">Administrador</text>
  </g>

  <!-- Boundary: UI_ReporteTradicional -->
  <g transform="translate(130, 160)">
    <rect x="0" y="0" width="230" height="240" class="class-box" />
    <text x="115" y="20" class="class-title">UI_ReporteTradicional</text>
    <line x1="0" y1="28" x2="230" y2="28" class="divider" />
    <!-- Métodos -->
    <text x="10" y="48" class="method-text">+ consultarCatalogo(): void</text>
    <text x="10" y="70" class="method-text">+ seleccionarTipoReporte(): void</text>
    <text x="10" y="92" class="method-text">+ cambiarFiltro(): void</text>
    <text x="10" y="114" class="method-text">+ limpiarFiltros(): void</text>
    <text x="10" y="136" class="method-text">+ handleGenerarReporte(): void</text>
    <text x="10" y="158" class="method-text">+ handleExportarExcel(): void</text>
    <text x="10" y="180" class="method-text">+ handleExportarPdf(): void</text>
    <text x="10" y="202" class="method-text">+ previsualizarImpresion(): void</text>
    <text x="10" y="224" class="method-text">+ dispararImpresion(): void</text>
  </g>

  <!-- Control: ReporteTradicionalController -->
  <g transform="translate(420, 180)">
    <rect x="0" y="0" width="260" height="200" class="class-box" />
    <text x="130" y="20" class="class-title">ReporteTradicionalController</text>
    <line x1="0" y1="28" x2="260" y2="28" class="divider" />
    <!-- Métodos -->
    <text x="10" y="55" class="method-text">+ catalogo(): JsonResponse</text>
    <text x="10" y="85" class="method-text">+ parametros(): JsonResponse</text>
    <text x="10" y="115" class="method-text">+ generar(Request): JsonResponse</text>
    <text x="10" y="145" class="method-text">+ exportarExcel(Request): Streamed</text>
    <text x="10" y="175" class="method-text">+ exportarPdf(Request): JsonResponse</text>
  </g>

  <!-- Dominio: ReporteTradicional -->
  <g transform="translate(740, 160)">
    <rect x="0" y="0" width="280" height="240" class="class-box" />
    <text x="140" y="20" class="class-title">ReporteTradicional</text>
    <line x1="0" y1="28" x2="280" y2="28" class="divider" />
    <!-- Atributos constantes -->
    <text x="10" y="46" class="attr-text">+ TIPO_CLIENTES_ZONA: string</text>
    <text x="10" y="64" class="attr-text">+ TIPO_INGRESOS_PAGOS: string</text>
    <text x="10" y="82" class="attr-text">+ TIPO_MOROSIDAD_CORTES: string</text>
    <text x="10" y="100" class="attr-text">+ TIPO_EQUIPOS_INSTAL: string</text>
    <line x1="0" y1="108" x2="280" y2="108" class="divider" />
    <!-- Métodos -->
    <text x="10" y="126" class="method-text">+ catalogo(): array</text>
    <text x="10" y="146" class="method-text">+ generar(tipo, filtros): array</text>
    <text x="10" y="166" class="method-text">- generarClientesZona(filtros): array</text>
    <text x="10" y="186" class="method-text">- generarIngresosPagos(filtros): array</text>
    <text x="10" y="206" class="method-text">- generarMorosidadCortes(f): array</text>
    <text x="10" y="226" class="method-text">- generarEquiposInstalaciones(f): array</text>
  </g>

  <!-- Entity: Zona -->
  <g transform="translate(760, 20)">
    <rect x="0" y="0" width="230" height="110" class="class-box" />
    <text x="115" y="18" class="class-title">Zona</text>
    <line x1="0" y1="24" x2="230" y2="24" class="divider" />
    <text x="10" y="40" class="attr-text">- idZona: int</text>
    <text x="10" y="56" class="attr-text">- nombreZona: string</text>
    <text x="10" y="72" class="attr-text">- codigo: string</text>
    <line x1="0" y1="78" x2="230" y2="78" class="divider" />
    <text x="10" y="96" class="method-text">+ select(): void  + get(): void</text>
  </g>

  <!-- Entity: Cliente -->
  <g transform="translate(1110, 130)">
    <rect x="0" y="0" width="240" height="200" class="class-box" />
    <text x="120" y="18" class="class-title">Cliente</text>
    <line x1="0" y1="24" x2="240" y2="24" class="divider" />
    <text x="10" y="42" class="attr-text">- idCliente: int</text>
    <text x="10" y="58" class="attr-text">- codigoCliente: string</text>
    <text x="10" y="74" class="attr-text">- ci: string</text>
    <text x="10" y="90" class="attr-text">- nombreCompleto: string</text>
    <text x="10" y="106" class="attr-text">- telefonoPrincipal: string</text>
    <text x="10" y="122" class="attr-text">- email: string</text>
    <text x="10" y="138" class="attr-text">- estadoCliente: string</text>
    <text x="10" y="154" class="attr-text">- idZona: int</text>
    <line x1="0" y1="162" x2="240" y2="162" class="divider" />
    <text x="10" y="182" class="method-text">+ leftJoin(): void  + where(): void</text>
  </g>

  <!-- Entity: Pago -->
  <g transform="translate(1110, 420)">
    <rect x="0" y="0" width="230" height="190" class="class-box" />
    <text x="115" y="18" class="class-title">Pago</text>
    <line x1="0" y1="24" x2="230" y2="24" class="divider" />
    <text x="10" y="40" class="attr-text">- idPago: int</text>
    <text x="10" y="56" class="attr-text">- fechaHora: timestamp</text>
    <text x="10" y="72" class="attr-text">- montoTotal: decimal</text>
    <text x="10" y="88" class="attr-text">- numeroComprobante: string</text>
    <text x="10" y="104" class="attr-text">- observacion: string</text>
    <text x="10" y="120" class="attr-text">- idMetodoPago: int</text>
    <text x="10" y="136" class="attr-text">- idUsuario: int</text>
    <line x1="0" y1="144" x2="230" y2="144" class="divider" />
    <text x="10" y="164" class="method-text">+ join(): void  + whereBetween(): void</text>
  </g>

  <!-- Entity: MetodoPago -->
  <g transform="translate(1420, 460)">
    <rect x="0" y="0" width="210" height="120" class="class-box" />
    <text x="105" y="18" class="class-title">MetodoPago</text>
    <line x1="0" y1="24" x2="210" y2="24" class="divider" />
    <text x="10" y="40" class="attr-text">- idMetodoPago: int</text>
    <text x="10" y="56" class="attr-text">- nombreMetodo: string</text>
    <text x="10" y="72" class="attr-text">- estado: string</text>
    <line x1="0" y1="80" x2="210" y2="80" class="divider" />
    <text x="10" y="100" class="method-text">+ select(): void  + get(): void</text>
  </g>

  <!-- Entity: Mensualidad -->
  <g transform="translate(850, 600)">
    <rect x="0" y="0" width="220" height="170" class="class-box" />
    <text x="110" y="18" class="class-title">Mensualidad</text>
    <line x1="0" y1="24" x2="220" y2="24" class="divider" />
    <text x="10" y="40" class="attr-text">- idMensualidad: int</text>
    <text x="10" y="56" class="attr-text">- periodo: string</text>
    <text x="10" y="72" class="attr-text">- fechaVencimiento: date</text>
    <text x="10" y="88" class="attr-text">- monto: decimal</text>
    <text x="10" y="104" class="attr-text">- estado: string</text>
    <text x="10" y="120" class="attr-text">- idServicio: int</text>
    <line x1="0" y1="128" x2="220" y2="128" class="divider" />
    <text x="10" y="148" class="method-text">+ whereIn(): void  + get(): void</text>
  </g>

  <!-- Entity: Equipo -->
  <g transform="translate(1110, 660)">
    <rect x="0" y="0" width="230" height="170" class="class-box" />
    <text x="115" y="18" class="class-title">Equipo</text>
    <line x1="0" y1="24" x2="230" y2="24" class="divider" />
    <text x="10" y="40" class="attr-text">- idEquipo: int</text>
    <text x="10" y="56" class="attr-text">- numeroSerie: string</text>
    <text x="10" y="72" class="attr-text">- mac: string</text>
    <text x="10" y="88" class="attr-text">- ipAsignada: string</text>
    <text x="10" y="104" class="attr-text">- estadoEquipo: string</text>
    <text x="10" y="120" class="attr-text">- idProducto: int</text>
    <line x1="0" y1="128" x2="230" y2="128" class="divider" />
    <text x="10" y="148" class="method-text">+ join(): void  + get(): void</text>
  </g>

  <!-- Entity: Bitacora -->
  <g transform="translate(440, 600)">
    <rect x="0" y="0" width="220" height="180" class="class-box" />
    <text x="110" y="18" class="class-title">Bitacora</text>
    <line x1="0" y1="24" x2="220" y2="24" class="divider" />
    <text x="10" y="40" class="attr-text">- idBitacora: int</text>
    <text x="10" y="56" class="attr-text">- fechaHora: timestamp</text>
    <text x="10" y="72" class="attr-text">- accion: string</text>
    <text x="10" y="88" class="attr-text">- modulo: string</text>
    <text x="10" y="104" class="attr-text">- descripcion: string</text>
    <text x="10" y="120" class="attr-text">- idUsuario: int</text>
    <line x1="0" y1="128" x2="220" y2="128" class="divider" />
    <text x="10" y="148" class="method-text">+ create(): void</text>
    <text x="10" y="166" class="method-text">+ log(): void</text>
  </g>

</svg>
  `;
}

// =========================================================================
// 3. CU27 - DIAGRAMA DE SECUENCIA
// =========================================================================
function buildCU27Sequence() {
  const width = 1680;
  const height = 1180;
  const tabW = 440;

  // Coordenadas X de las líneas de vida
  const xAdmin = 90;
  const xUI = 320;
  const xCtrl = 640;
  const xDom = 1000;
  const xEnt = 1320;
  const xBit = 1540;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background:#ffffff; font-family: Arial, Helvetica, sans-serif;">
  <defs>
    <style>
      .tab-title { font-size: 10px; font-weight: bold; fill: #1e293b; }
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

  <!-- Pestaña de Diagrama EA -->
  <path d="M 20,45 L 20,24 L ${tabW},24 L ${tabW + 16},45 Z" fill="#ffffff" stroke="#64748b" stroke-width="1" />
  <text x="30" y="38" class="tab-title">sd CU27 Generar y exportar reportes tradicionales</text>

  <!-- Marco Exterior -->
  <rect x="20" y="45" width="${width - 40}" height="${height - 65}" fill="#ffffff" stroke="#64748b" stroke-width="1" />

  <!-- Marcas de agua -->
  <g opacity="0.4">
    ${generateWatermarks(width, height)}
  </g>

  <!-- LÍNEAS DE VIDA VERTICALES -->
  <line x1="${xAdmin}" y1="130" x2="${xAdmin}" y2="${height - 50}" class="life-line" />
  <line x1="${xUI}" y1="130" x2="${xUI}" y2="${height - 50}" class="life-line" />
  <line x1="${xCtrl}" y1="130" x2="${xCtrl}" y2="${height - 50}" class="life-line" />
  <line x1="${xDom}" y1="130" x2="${xDom}" y2="${height - 50}" class="life-line" />
  <line x1="${xEnt}" y1="130" x2="${xEnt}" y2="${height - 50}" class="life-line" />
  <line x1="${xBit}" y1="130" x2="${xBit}" y2="${height - 50}" class="life-line" />

  <!-- CABECERAS DE LÍNEAS DE VIDA -->
  <!-- Admin -->
  <g transform="translate(${xAdmin}, 90)">
    ${actorIcon(0, 0)}
    <text x="0" y="40" class="life-title">Administrador</text>
  </g>

  <!-- UI_ReporteTradicional -->
  <g transform="translate(${xUI}, 90)">
    ${boundaryIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">UI_ReporteTradicional</text>
  </g>

  <!-- ReporteTradicionalController -->
  <g transform="translate(${xCtrl}, 90)">
    ${controlIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">ReporteTradicionalController</text>
  </g>

  <!-- ReporteTradicional -->
  <g transform="translate(${xDom}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">ReporteTradicional</text>
  </g>

  <!-- Cliente / Pago / Zona -->
  <g transform="translate(${xEnt}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">Cliente / Pago / Zona</text>
  </g>

  <!-- Bitacora -->
  <g transform="translate(${xBit}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">Bitacora</text>
  </g>

  <!-- ================= BLOQUE 1: FLUJO CATÁLOGO Y PARÁMETROS ================= -->
  <rect x="35" y="150" width="${width - 70}" height="195" class="frame-box" />
  <path d="M 35,170 L 35,150 L 360,150 L 372,170 Z" class="frame-tab" />
  <text x="45" y="164" class="frame-title">alt Flujo 1: Consultar catálogo y parámetros de filtrado</text>

  <!-- Barras de activación -->
  <rect x="${xAdmin - 5}" y="175" width="10" height="150" class="act-bar" />
  <rect x="${xUI - 5}" y="175" width="10" height="145" class="act-bar" />
  <rect x="${xCtrl - 5}" y="185" width="10" height="120" class="act-bar" />

  <!-- 1: consultarCatalogoReportes() -->
  <line x1="${xAdmin + 5}" y1="180" x2="${xUI - 5}" y2="180" class="msg-call" marker-end="url(#arrow)" />
  <polygon points="${xUI - 5},180 ${xUI - 11},177 ${xUI - 11},183" fill="#1e293b" />
  <text x="130" y="175" class="call-text">1: consultarCatalogoReportes()</text>

  <!-- 1.1: catalogo() -->
  <line x1="${xUI + 5}" y1="195" x2="${xCtrl - 5}" y2="195" class="msg-call" />
  <polygon points="${xCtrl - 5},195 ${xCtrl - 11},192 ${xCtrl - 11},198" fill="#1e293b" />
  <text x="410" y="190" class="call-text">1.1: catalogo()</text>

  <!-- 1.2: catalogo() a ReporteTradicional -->
  <line x1="${xCtrl + 5}" y1="210" x2="${xDom - 5}" y2="210" class="msg-call" />
  <polygon points="${xDom - 5},210 ${xDom - 11},207 ${xDom - 11},213" fill="#1e293b" />
  <text x="730" y="205" class="call-text">1.2: catalogo(): array</text>

  <!-- Retorno catálogo -->
  <line x1="${xDom - 5}" y1="225" x2="${xCtrl + 5}" y2="225" class="msg-ret" />
  <text x="750" y="222" class="ret-text">($catalogoDisponibles)</text>

  <!-- 1.3: parametros() a Zona -->
  <line x1="${xCtrl + 5}" y1="245" x2="${xEnt - 5}" y2="245" class="msg-call" />
  <polygon points="${xEnt - 5},245 ${xEnt - 11},242 ${xEnt - 11},248" fill="#1e293b" />
  <text x="730" y="240" class="call-text">1.3: Zona::select()-&gt;get(), MetodoPago::select()-&gt;get()</text>

  <!-- Retorno parámetros -->
  <line x1="${xEnt - 5}" y1="260" x2="${xCtrl + 5}" y2="260" class="msg-ret" />
  <text x="960" y="256" class="ret-text">($zonas, $metodos, $estados)</text>

  <!-- Respuesta JSON a UI -->
  <line x1="${xCtrl - 5}" y1="285" x2="${xUI + 5}" y2="285" class="msg-ret" />
  <text x="410" y="280" class="ret-text">success({catalogo, parametros})</text>

  <!-- Renderizado UI -->
  <line x1="${xUI - 5}" y1="310" x2="${xAdmin + 5}" y2="310" class="msg-ret" />
  <text x="130" y="305" class="ret-text">mostrarCatalogoYFormularioFiltros()</text>

  <!-- ================= BLOQUE 2: GENERAR REPORTE ================= -->
  <rect x="35" y="360" width="${width - 70}" height="280" class="frame-box" />
  <path d="M 35,380 L 35,360 L 340,360 L 352,380 Z" class="frame-tab" />
  <text x="45" y="374" class="frame-title">alt Flujo 2: Generar y visualizar reporte consolidado</text>

  <!-- Barras de activación -->
  <rect x="${xAdmin - 5}" y="385" width="10" height="235" class="act-bar" />
  <rect x="${xUI - 5}" y="385" width="10" height="230" class="act-bar" />
  <rect x="${xCtrl - 5}" y="395" width="10" height="205" class="act-bar" />
  <rect x="${xDom - 5}" y="425" width="10" height="110" class="act-bar" />

  <!-- 2: generarReporte -->
  <line x1="${xAdmin + 5}" y1="395" x2="${xUI - 5}" y2="395" class="msg-call" />
  <polygon points="${xUI - 5},395 ${xUI - 11},392 ${xUI - 11},398" fill="#1e293b" />
  <text x="110" y="390" class="call-text">2: generarReporte(tipo, filtros)</text>

  <!-- 2.1: generar(Request) -->
  <line x1="${xUI + 5}" y1="410" x2="${xCtrl - 5}" y2="410" class="msg-call" />
  <polygon points="${xCtrl - 5},410 ${xCtrl - 11},407 ${xCtrl - 11},413" fill="#1e293b" />
  <text x="380" y="405" class="call-text">2.1: generar(Request $request)</text>

  <!-- Self-call validación -->
  <path d="M ${xCtrl + 5},420 L ${xCtrl + 25},420 L ${xCtrl + 25},435 L ${xCtrl + 5},435" fill="none" stroke="#1e293b" stroke-width="1.1" />
  <polygon points="${xCtrl + 5},435 ${xCtrl + 11},432 ${xCtrl + 11},438" fill="#1e293b" />
  <text x="${xCtrl + 30}" y="430" class="call-text">validate(filtros)</text>

  <!-- 2.2: generar() a ReporteTradicional -->
  <line x1="${xCtrl + 5}" y1="450" x2="${xDom - 5}" y2="450" class="msg-call" />
  <polygon points="${xDom - 5},450 ${xDom - 11},447 ${xDom - 11},453" fill="#1e293b" />
  <text x="730" y="445" class="call-text">2.2: generar($tipo, $filtros): array</text>

  <!-- 2.3: Consulta DB Eloquent a Entidades -->
  <line x1="${xDom + 5}" y1="470" x2="${xEnt - 5}" y2="470" class="msg-call" />
  <polygon points="${xEnt - 5},470 ${xEnt - 11},467 ${xEnt - 11},473" fill="#1e293b" />
  <text x="1050" y="465" class="call-text">2.3: table('Cliente')-&gt;leftJoin()-&gt;where()-&gt;get() / Pago::whereBetween()</text>

  <!-- Retorno DB -->
  <line x1="${xEnt - 5}" y1="495" x2="${xDom + 5}" y2="495" class="msg-ret" />
  <text x="1100" y="490" class="ret-text">($registrosFiltrados)</text>

  <!-- Retorno estructura consolidada con KPIs -->
  <line x1="${xDom - 5}" y1="525" x2="${xCtrl + 5}" y2="525" class="msg-ret" />
  <text x="750" y="520" class="ret-text">return {titulo, registros, kpis, subtipo}</text>

  <!-- 2.4: Auditoría obligatoria a Bitacora -->
  <line x1="${xCtrl + 5}" y1="550" x2="${xBit - 5}" y2="550" class="msg-call" />
  <polygon points="${xBit - 5},550 ${xBit - 11},547 ${xBit - 11},553" fill="#1e293b" />
  <text x="850" y="545" class="call-text">2.4: AuditLogger::log('CU27', 'GENERAR_REPORTE', ...)</text>

  <!-- Retorno API JSON a UI -->
  <line x1="${xCtrl - 5}" y1="580" x2="${xUI + 5}" y2="580" class="msg-ret" />
  <text x="400" y="575" class="ret-text">success($reporte, 'Reporte generado exitosamente.')</text>

  <!-- Presentación en pantalla -->
  <line x1="${xUI - 5}" y1="605" x2="${xAdmin + 5}" y2="605" class="msg-ret" />
  <text x="110" y="600" class="ret-text">renderizarTablaResultadosYTarjetasKPI()</text>

  <!-- ================= BLOQUE 3: EXPORTAR A EXCEL ================= -->
  <rect x="35" y="655" width="${width - 70}" height="220" class="frame-box" />
  <path d="M 35,675 L 35,655 L 330,655 L 342,675 Z" class="frame-tab" />
  <text x="45" y="669" class="frame-title">alt Flujo 3: Exportar reporte a formato Excel (CSV)</text>

  <rect x="${xAdmin - 5}" y="680" width="10" height="180" class="act-bar" />
  <rect x="${xUI - 5}" y="680" width="10" height="175" class="act-bar" />
  <rect x="${xCtrl - 5}" y="690" width="10" height="150" class="act-bar" />

  <!-- 3: exportarAExcel -->
  <line x1="${xAdmin + 5}" y1="690" x2="${xUI - 5}" y2="690" class="msg-call" />
  <polygon points="${xUI - 5},690 ${xUI - 11},687 ${xUI - 11},693" fill="#1e293b" />
  <text x="120" y="685" class="call-text">3: exportarAExcel()</text>

  <!-- 3.1: exportarExcel(Request) -->
  <line x1="${xUI + 5}" y1="705" x2="${xCtrl - 5}" y2="705" class="msg-call" />
  <polygon points="${xCtrl - 5},705 ${xCtrl - 11},702 ${xCtrl - 11},708" fill="#1e293b" />
  <text x="390" y="700" class="call-text">3.1: exportarExcel(Request $request)</text>

  <!-- 3.2: generar() a ReporteTradicional -->
  <line x1="${xCtrl + 5}" y1="720" x2="${xDom - 5}" y2="720" class="msg-call" />
  <polygon points="${xDom - 5},720 ${xDom - 11},717 ${xDom - 11},723" fill="#1e293b" />
  <text x="730" y="715" class="call-text">3.2: generar($tipo, $filtros)</text>

  <!-- Retorno datos -->
  <line x1="${xDom - 5}" y1="740" x2="${xCtrl + 5}" y2="740" class="msg-ret" />
  <text x="750" y="735" class="ret-text">($datosReporte)</text>

  <!-- 3.3: Auditoría -->
  <line x1="${xCtrl + 5}" y1="760" x2="${xBit - 5}" y2="760" class="msg-call" />
  <polygon points="${xBit - 5},760 ${xBit - 11},757 ${xBit - 11},763" fill="#1e293b" />
  <text x="850" y="755" class="call-text">3.3: AuditLogger::log('CU27', 'EXPORTAR_EXCEL', ...)</text>

  <!-- 3.4: Streaming CSV con BOM UTF-8 -->
  <line x1="${xCtrl - 5}" y1="790" x2="${xUI + 5}" y2="790" class="msg-ret" />
  <text x="380" y="785" class="ret-text">response()-&gt;streamDownload(callback, "TELCOM_Reporte_*.csv")</text>

  <!-- Descarga en navegador -->
  <line x1="${xUI - 5}" y1="820" x2="${xAdmin + 5}" y2="820" class="msg-ret" />
  <text x="120" y="815" class="ret-text">descargarArchivoBinarioCSV()</text>

  <!-- ================= BLOQUE 4: EXPORTAR A PDF ================= -->
  <rect x="35" y="890" width="${width - 70}" height="230" class="frame-box" />
  <path d="M 35,910 L 35,890 L 350,890 L 362,910 Z" class="frame-tab" />
  <text x="45" y="904" class="frame-title">alt Flujo 4: Exportar reporte a PDF e impresión oficial</text>

  <rect x="${xAdmin - 5}" y="920" width="10" height="180" class="act-bar" />
  <rect x="${xUI - 5}" y="920" width="10" height="175" class="act-bar" />
  <rect x="${xCtrl - 5}" y="930" width="10" height="130" class="act-bar" />

  <!-- 4: exportarAPdf -->
  <line x1="${xAdmin + 5}" y1="930" x2="${xUI - 5}" y2="930" class="msg-call" />
  <polygon points="${xUI - 5},930 ${xUI - 11},927 ${xUI - 11},933" fill="#1e293b" />
  <text x="120" y="925" class="call-text">4: exportarAPdf()</text>

  <!-- 4.1: exportarPdf(Request) -->
  <line x1="${xUI + 5}" y1="945" x2="${xCtrl - 5}" y2="945" class="msg-call" />
  <polygon points="${xCtrl - 5},945 ${xCtrl - 11},942 ${xCtrl - 11},948" fill="#1e293b" />
  <text x="390" y="940" class="call-text">4.1: exportarPdf(Request $request)</text>

  <!-- 4.2: generar() a ReporteTradicional -->
  <line x1="${xCtrl + 5}" y1="965" x2="${xDom - 5}" y2="965" class="msg-call" />
  <polygon points="${xDom - 5},965 ${xDom - 11},962 ${xDom - 11},968" fill="#1e293b" />
  <text x="730" y="960" class="call-text">4.2: generar($tipo, $filtros)</text>

  <!-- 4.3: Auditoría -->
  <line x1="${xCtrl + 5}" y1="990" x2="${xBit - 5}" y2="990" class="msg-call" />
  <polygon points="${xBit - 5},990 ${xBit - 11},987 ${xBit - 11},993" fill="#1e293b" />
  <text x="850" y="985" class="call-text">4.3: AuditLogger::log('CU27', 'EXPORTAR_PDF', ...)</text>

  <!-- Retorno estructura PDF con membrete oficial -->
  <line x1="${xCtrl - 5}" y1="1020" x2="${xUI + 5}" y2="1020" class="msg-ret" />
  <text x="380" y="1015" class="ret-text">success({reporte, titulo, empresa, nit, direccion, usuarioGenerador})</text>

  <!-- Vista previa e impresión nativa -->
  <line x1="${xUI - 5}" y1="1055" x2="${xAdmin + 5}" y2="1055" class="msg-ret" />
  <text x="120" y="1050" class="ret-text">abrirVistaPreviaImprimible() / window.print()</text>

</svg>
  `;
}

// =========================================================================
// 4. CU29 - DIAGRAMA DE COMUNICACIÓN
// =========================================================================
function buildCU29Communication() {
  const width = 1650;
  const height = 900;
  const tabW = 420;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background:#ffffff; font-family: Arial, Helvetica, sans-serif;">
  <defs>
    <style>
      .tab-title { font-size: 10px; font-weight: bold; fill: #1e293b; }
      .node-title { font-size: 12px; font-weight: bold; fill: #0f172a; text-anchor: middle; }
      .link-line { stroke: #64748b; stroke-width: 1.2; fill: none; }
      .flow-1 { fill: #0f172a; font-size: 10.5px; font-weight: bold; }
      .flow-2 { fill: #b91c1c; font-size: 10.5px; font-weight: bold; }
      .flow-3 { fill: #1d4ed8; font-size: 10.5px; font-weight: bold; }
      .flow-4 { fill: #15803d; font-size: 10.5px; font-weight: bold; }
    </style>
  </defs>

  <!-- Pestaña de Diagrama EA -->
  <path d="M 20,45 L 20,24 L ${tabW},24 L ${tabW + 16},45 Z" fill="#ffffff" stroke="#64748b" stroke-width="1" />
  <text x="30" y="38" class="tab-title">sd CU29 Capturar y transcribir comandos de voz</text>

  <!-- Marco Exterior -->
  <rect x="20" y="45" width="${width - 40}" height="${height - 65}" fill="#ffffff" stroke="#64748b" stroke-width="1" />

  <!-- Marcas de agua -->
  <g opacity="0.45">
    ${generateWatermarks(width, height)}
  </g>

  <!-- LÍNEAS DE ENLACE ENTRE INSTANCIAS -->
  <!-- Admin a UI_ComandoVoz -->
  <line x1="105" y1="360" x2="310" y2="360" class="link-line" />

  <!-- UI_ComandoVoz a Controller -->
  <line x1="360" y1="360" x2="680" y2="360" class="link-line" />

  <!-- Controller a ComandoVoz (Entidad/NLP) -->
  <line x1="725" y1="360" x2="1140" y2="360" class="link-line" />

  <!-- ComandoVoz a Zona (Vertical hacia arriba) -->
  <line x1="1160" y1="320" x2="1160" y2="150" class="link-line" />

  <!-- Controller a Bitacora (Vertical hacia abajo) -->
  <line x1="700" y1="400" x2="700" y2="650" class="link-line" />

  <!-- UI_ComandoVoz a UI_ReporteTradicional (Handoff cruzado) -->
  <line x1="335" y1="400" x2="335" y2="650" class="link-line" />

  <!-- Controller a Usuario (Diagonal) -->
  <line x1="720" y1="400" x2="1140" y2="650" class="link-line" />

  <!-- NODOS / INSTANCIAS -->

  <!-- Actor: Administrador -->
  <g transform="translate(100, 360)">
    ${actorIcon(0, 0)}
    <text x="0" y="48" class="node-title">Administrador</text>
  </g>

  <!-- Boundary: UI_ComandoVoz -->
  <g transform="translate(335, 360)">
    ${boundaryIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">UI_ComandoVoz</text>
  </g>

  <!-- Control: ComandoVozController -->
  <g transform="translate(700, 360)">
    ${controlIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">ComandoVozController</text>
  </g>

  <!-- Entity / NLP: ComandoVoz -->
  <g transform="translate(1160, 360)">
    ${entityIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">ComandoVoz</text>
  </g>

  <!-- Entity: Zona -->
  <g transform="translate(1160, 130)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Zona</text>
  </g>

  <!-- Entity: Bitacora -->
  <g transform="translate(700, 670)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Bitacora</text>
  </g>

  <!-- Boundary: UI_ReporteTradicional -->
  <g transform="translate(335, 670)">
    ${boundaryIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">UI_ReporteTradicional</text>
  </g>

  <!-- Entity: Usuario -->
  <g transform="translate(1160, 670)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Usuario</text>
  </g>

  <!-- MENSAJES Y LLAMADAS -->

  <!-- Entre Admin y UI_ComandoVoz -->
  <g transform="translate(125, 275)">
    <text x="0" y="0" class="flow-1">1: activarMicrofonoYDictar() &rarr;</text>
    <text x="0" y="16" class="flow-2">2: confirmarComando(id, textoAjustado) &rarr;</text>
    <text x="0" y="32" class="flow-3">3: listarHistorialComandos() &rarr;</text>
    <text x="0" y="48" class="flow-4">4: seleccionarComandoEjemplo() &rarr;</text>
  </g>

  <!-- Entre UI_ComandoVoz y Controller -->
  <g transform="translate(370, 270)">
    <text x="0" y="0" class="flow-1">1.2: transcribir(Request $request) &rarr;</text>
    <text x="0" y="20" class="flow-2">2.1: confirmar(Request $request) &rarr;</text>
    <text x="0" y="40" class="flow-3">3.1: historial() &rarr;</text>
    <text x="0" y="60" class="flow-4">4.1: ejemplos() &rarr;</text>
  </g>

  <!-- Entre Controller y ComandoVoz (NLP & Eloquent) -->
  <g transform="translate(735, 270)">
    <text x="0" y="0" class="flow-1">1.3: interpretar(texto): array &rarr;</text>
    <text x="0" y="16" class="flow-1">1.5: create([idUsuario, textoDictado, intencion, parametros, ...]) &rarr;</text>
    <text x="0" y="34" class="flow-2">2.2: find($idComando) &rarr;</text>
    <text x="0" y="50" class="flow-2">2.3: update(['textoDictado', 'intencion', 'estado'=&gt;'CONFIRMADO']) &rarr;</text>
    <text x="0" y="66" class="flow-3">3.2: with('usuario')-&gt;orderByDesc()-&gt;take(15)-&gt;get() &rarr;</text>
  </g>

  <!-- Entre ComandoVoz y Zona -->
  <g transform="translate(1170, 210)">
    <text x="0" y="0" class="flow-1">1.4: table('Zona')-&gt;where('codigo', 'ilike', ...)-&gt;first() &rarr;</text>
  </g>

  <!-- Entre Controller y Bitacora -->
  <g transform="translate(710, 500)">
    <text x="0" y="0" class="flow-1">1.6: log('CU29', 'TRANSCRIBIR_VOZ', detalle) &rarr;</text>
    <text x="0" y="22" class="flow-2">2.4: log('CU29', 'CONFIRMAR_COMANDO', detalle) &rarr;</text>
  </g>

  <!-- Entre UI_ComandoVoz y UI_ReporteTradicional -->
  <g transform="translate(140, 520)">
    <text x="0" y="0" class="flow-2">2.5: onIrAReporteTradicional(reporteSugerido, parametros) &rarr;</text>
    <text x="0" y="18" font-size="9.5px" fill="#64748b">(Carga automática de filtros en CU27)</text>
  </g>

  <!-- LEYENDA INFERIOR -->
  <g transform="translate(50, 815)">
    <rect x="0" y="0" width="1550" height="42" fill="#f8fafc" stroke="#cbd5e1" rx="4" />
    <text x="20" y="26" font-size="11" font-weight="bold" fill="#0f172a">Convención de Flujos:</text>
    <text x="170" y="26" class="flow-1">&bull; Flujo 1: Captura de voz, Speech-to-Text y procesamiento NLP</text>
    <text x="610" y="26" class="flow-2">&bull; Flujo 2: Confirmación/Ajuste de comando y handoff a CU27</text>
    <text x="1040" y="26" class="flow-3">&bull; Flujo 3: Consulta de historial auditado</text>
    <text x="1330" y="26" class="flow-4">&bull; Flujo 4: Catálogo de comandos de ejemplo</text>
  </g>
</svg>
  `;
}

// =========================================================================
// 5. CU29 - ANÁLISIS DE CLASES
// =========================================================================
function buildCU29ClassAnalysis() {
  const width = 1680;
  const height = 940;
  const tabW = 420;

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

  <!-- Pestaña de Diagrama EA -->
  <path d="M 20,45 L 20,24 L ${tabW},24 L ${tabW + 16},45 Z" fill="#ffffff" stroke="#606060" stroke-width="1" />
  <text x="30" y="38" class="tab-title">class CU29 Capturar y transcribir comandos de voz</text>

  <!-- Marco Exterior -->
  <rect x="20" y="45" width="${width - 40}" height="${height - 65}" fill="#ffffff" stroke="#606060" stroke-width="1" />

  <!-- Marcas de agua -->
  <g opacity="0.45">
    ${generateWatermarks(width, height)}
  </g>

  <!-- LÍNEAS DE ASOCIACIÓN -->
  <!-- Actor a UI -->
  <line x1="85" y1="280" x2="130" y2="280" class="ea-line" />

  <!-- UI a Controller -->
  <line x1="360" y1="280" x2="420" y2="280" class="ea-line" />
  <text x="375" y="272" class="assoc-text">invoca</text>

  <!-- Controller a ComandoVoz -->
  <line x1="680" y1="280" x2="740" y2="280" class="ea-line" />
  <text x="690" y="272" class="assoc-text">gestiona</text>

  <!-- ComandoVoz a Zona (Vertical hacia arriba) -->
  <line x1="880" y1="170" x2="880" y2="120" class="ea-line" />
  <text x="890" y="145" class="assoc-text">resuelve entidad</text>
  <text x="890" y="165" class="mult-text">0..*</text>
  <text x="890" y="130" class="mult-text">0..1</text>

  <!-- Controller a Bitacora (Vertical hacia abajo) -->
  <line x1="550" y1="380" x2="550" y2="580" class="ea-line" />
  <text x="560" y="480" class="assoc-text">registra auditoría</text>
  <text x="560" y="405" class="mult-text">1</text>
  <text x="560" y="565" class="mult-text">0..*</text>

  <!-- ComandoVoz a Usuario (Hacia abajo-derecha) -->
  <line x1="880" y1="410" x2="880" y2="580" class="ea-line" />
  <text x="890" y="490" class="assoc-text">pertenece a</text>
  <text x="890" y="430" class="mult-text">0..*</text>
  <text x="890" y="565" class="mult-text">1</text>

  <!-- UI_ComandoVoz a UI_ReporteTradicional -->
  <line x1="245" y1="400" x2="245" y2="580" class="ea-line" />
  <text x="255" y="490" class="assoc-text">redirige con filtros</text>

  <!-- CLASES / CAJAS EA -->

  <!-- Actor: Administrador -->
  <g transform="translate(60, 280)">
    ${actorIcon(0, 0)}
    <text x="0" y="45" class="class-title">Administrador</text>
  </g>

  <!-- Boundary: UI_ComandoVoz -->
  <g transform="translate(130, 160)">
    <rect x="0" y="0" width="230" height="240" class="class-box" />
    <text x="115" y="20" class="class-title">UI_ComandoVoz</text>
    <line x1="0" y1="28" x2="230" y2="28" class="divider" />
    <!-- Métodos -->
    <text x="10" y="48" class="method-text">+ iniciarDictado(): void</text>
    <text x="10" y="70" class="method-text">+ detenerDictado(): void</text>
    <text x="10" y="92" class="method-text">+ handleTextoChange(): void</text>
    <text x="10" y="114" class="method-text">+ handleConfirmarComando(): void</text>
    <text x="10" y="136" class="method-text">+ handleSeleccionarEjemplo(): void</text>
    <text x="10" y="158" class="method-text">+ listarHistorial(): void</text>
    <text x="10" y="180" class="method-text">+ alternarModoManual(): void</text>
    <text x="10" y="202" class="method-text">+ limpiar(): void</text>
  </g>

  <!-- Control: ComandoVozController -->
  <g transform="translate(420, 180)">
    <rect x="0" y="0" width="260" height="200" class="class-box" />
    <text x="130" y="20" class="class-title">ComandoVozController</text>
    <line x1="0" y1="28" x2="260" y2="28" class="divider" />
    <!-- Métodos -->
    <text x="10" y="55" class="method-text">+ transcribir(Request): JsonResponse</text>
    <text x="10" y="85" class="method-text">+ historial(Request): JsonResponse</text>
    <text x="10" y="115" class="method-text">+ confirmar(Request): JsonResponse</text>
    <text x="10" y="145" class="method-text">+ ejemplos(): JsonResponse</text>
  </g>

  <!-- Entity / NLP: ComandoVoz -->
  <g transform="translate(740, 170)">
    <rect x="0" y="0" width="280" height="240" class="class-box" />
    <text x="140" y="20" class="class-title">ComandoVoz</text>
    <line x1="0" y1="28" x2="280" y2="28" class="divider" />
    <!-- Atributos -->
    <text x="10" y="44" class="attr-text">- idComandoVoz: int</text>
    <text x="10" y="60" class="attr-text">- idUsuario: int</text>
    <text x="10" y="76" class="attr-text">- textoDictado: string</text>
    <text x="10" y="92" class="attr-text">- intencion: string</text>
    <text x="10" y="108" class="attr-text">- parametros: array</text>
    <text x="10" y="124" class="attr-text">- confianza: float</text>
    <text x="10" y="140" class="attr-text">- estado: string</text>
    <text x="10" y="156" class="attr-text">- duracionSegundos: float</text>
    <line x1="0" y1="164" x2="280" y2="164" class="divider" />
    <!-- Métodos -->
    <text x="10" y="180" class="method-text">+ create(): ComandoVoz</text>
    <text x="10" y="196" class="method-text">+ find(): ?ComandoVoz</text>
    <text x="10" y="212" class="method-text">+ update(): bool</text>
    <text x="10" y="228" class="method-text">+ interpretar(texto): array</text>
  </g>

  <!-- Entity: Zona -->
  <g transform="translate(760, 20)">
    <rect x="0" y="0" width="240" height="100" class="class-box" />
    <text x="120" y="18" class="class-title">Zona</text>
    <line x1="0" y1="24" x2="240" y2="24" class="divider" />
    <text x="10" y="40" class="attr-text">- idZona: int</text>
    <text x="10" y="56" class="attr-text">- nombreZona: string</text>
    <text x="10" y="72" class="attr-text">- codigo: string</text>
    <line x1="0" y1="78" x2="240" y2="78" class="divider" />
    <text x="10" y="94" class="method-text">+ where(): void  + first(): void</text>
  </g>

  <!-- Entity: Bitacora -->
  <g transform="translate(440, 580)">
    <rect x="0" y="0" width="220" height="180" class="class-box" />
    <text x="110" y="18" class="class-title">Bitacora</text>
    <line x1="0" y1="24" x2="220" y2="24" class="divider" />
    <text x="10" y="40" class="attr-text">- idBitacora: int</text>
    <text x="10" y="56" class="attr-text">- fechaHora: timestamp</text>
    <text x="10" y="72" class="attr-text">- accion: string</text>
    <text x="10" y="88" class="attr-text">- modulo: string</text>
    <text x="10" y="104" class="attr-text">- descripcion: string</text>
    <text x="10" y="120" class="attr-text">- idUsuario: int</text>
    <line x1="0" y1="128" x2="220" y2="128" class="divider" />
    <text x="10" y="148" class="method-text">+ create(): void</text>
    <text x="10" y="166" class="method-text">+ log(): void</text>
  </g>

  <!-- Entity: Usuario -->
  <g transform="translate(760, 580)">
    <rect x="0" y="0" width="240" height="180" class="class-box" />
    <text x="120" y="18" class="class-title">Usuario</text>
    <line x1="0" y1="24" x2="240" y2="24" class="divider" />
    <text x="10" y="40" class="attr-text">- idUsuario: int</text>
    <text x="10" y="56" class="attr-text">- nombreUsuario: string</text>
    <text x="10" y="72" class="attr-text">- nombreCompleto: string</text>
    <text x="10" y="88" class="attr-text">- correo: string</text>
    <text x="10" y="104" class="attr-text">- activo: boolean</text>
    <line x1="0" y1="112" x2="240" y2="112" class="divider" />
    <text x="10" y="132" class="method-text">+ find(): void</text>
    <text x="10" y="152" class="method-text">+ belongsTo(): void</text>
  </g>

  <!-- Boundary Receptor: UI_ReporteTradicional -->
  <g transform="translate(130, 580)">
    <rect x="0" y="0" width="230" height="140" class="class-box" />
    <text x="115" y="20" class="class-title">UI_ReporteTradicional</text>
    <line x1="0" y1="28" x2="230" y2="28" class="divider" />
    <text x="10" y="48" class="method-text">+ seleccionarTipoReporte(): void</text>
    <text x="10" y="70" class="method-text">+ aplicarFiltros(filtros): void</text>
    <text x="10" y="92" class="method-text">+ handleGenerarReporte(): void</text>
  </g>
</svg>
  `;
}

// =========================================================================
// 6. CU29 - DIAGRAMA DE SECUENCIA
// =========================================================================
function buildCU29Sequence() {
  const width = 1680;
  const height = 1120;
  const tabW = 420;

  const xAdmin = 90;
  const xUI = 320;
  const xCtrl = 640;
  const xNLP = 980;
  const xZona = 1260;
  const xBit = 1440;
  const xUIRep = 1580;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background:#ffffff; font-family: Arial, Helvetica, sans-serif;">
  <defs>
    <style>
      .tab-title { font-size: 10px; font-weight: bold; fill: #1e293b; }
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

  <!-- Pestaña de Diagrama EA -->
  <path d="M 20,45 L 20,24 L ${tabW},24 L ${tabW + 16},45 Z" fill="#ffffff" stroke="#64748b" stroke-width="1" />
  <text x="30" y="38" class="tab-title">sd CU29 Capturar y transcribir comandos de voz</text>

  <!-- Marco Exterior -->
  <rect x="20" y="45" width="${width - 40}" height="${height - 65}" fill="#ffffff" stroke="#64748b" stroke-width="1" />

  <!-- Marcas de agua -->
  <g opacity="0.4">
    ${generateWatermarks(width, height)}
  </g>

  <!-- LÍNEAS DE VIDA VERTICALES -->
  <line x1="${xAdmin}" y1="130" x2="${xAdmin}" y2="${height - 50}" class="life-line" />
  <line x1="${xUI}" y1="130" x2="${xUI}" y2="${height - 50}" class="life-line" />
  <line x1="${xCtrl}" y1="130" x2="${xCtrl}" y2="${height - 50}" class="life-line" />
  <line x1="${xNLP}" y1="130" x2="${xNLP}" y2="${height - 50}" class="life-line" />
  <line x1="${xZona}" y1="130" x2="${xZona}" y2="${height - 50}" class="life-line" />
  <line x1="${xBit}" y1="130" x2="${xBit}" y2="${height - 50}" class="life-line" />
  <line x1="${xUIRep}" y1="130" x2="${xUIRep}" y2="${height - 50}" class="life-line" />

  <!-- CABECERAS -->
  <g transform="translate(${xAdmin}, 90)">
    ${actorIcon(0, 0)}
    <text x="0" y="40" class="life-title">Administrador</text>
  </g>

  <g transform="translate(${xUI}, 90)">
    ${boundaryIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">UI_ComandoVoz</text>
  </g>

  <g transform="translate(${xCtrl}, 90)">
    ${controlIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">ComandoVozController</text>
  </g>

  <g transform="translate(${xNLP}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">ComandoVoz (NLP)</text>
  </g>

  <g transform="translate(${xZona}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">Zona</text>
  </g>

  <g transform="translate(${xBit}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">Bitacora</text>
  </g>

  <g transform="translate(${xUIRep}, 90)">
    ${boundaryIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">UI_ReporteTradicional</text>
  </g>

  <!-- ================= BLOQUE 1: CAPTURA Y TRANSCRIPCIÓN ================= -->
  <rect x="35" y="150" width="${width - 70}" height="320" class="frame-box" />
  <path d="M 35,170 L 35,150 L 360,150 L 372,170 Z" class="frame-tab" />
  <text x="45" y="164" class="frame-title">alt Flujo 1: Captura de voz, Speech-to-Text y procesamiento NLP</text>

  <rect x="${xAdmin - 5}" y="175" width="10" height="275" class="act-bar" />
  <rect x="${xUI - 5}" y="175" width="10" height="270" class="act-bar" />
  <rect x="${xCtrl - 5}" y="225" width="10" height="205" class="act-bar" />
  <rect x="${xNLP - 5}" y="250" width="10" height="135" class="act-bar" />

  <!-- 1: activarMicrofonoYDictar -->
  <line x1="${xAdmin + 5}" y1="180" x2="${xUI - 5}" y2="180" class="msg-call" />
  <polygon points="${xUI - 5},180 ${xUI - 11},177 ${xUI - 11},183" fill="#1e293b" />
  <text x="110" y="175" class="call-text">1: activarMicrofonoYDictar("Mostrar ingresos de la Zona Norte...")</text>

  <!-- Self-call reconocimiento Web Speech -->
  <path d="M ${xUI + 5},195 L ${xUI + 25},195 L ${xUI + 25},210 L ${xUI + 5},210" fill="none" stroke="#1e293b" stroke-width="1.1" />
  <polygon points="${xUI + 5},210 ${xUI + 11},207 ${xUI + 11},213" fill="#1e293b" />
  <text x="${xUI + 30}" y="205" class="call-text">webkitSpeechRecognition.start() -&gt; onresult(textoTranscrito)</text>

  <!-- 1.1: transcribir() a Controller -->
  <line x1="${xUI + 5}" y1="230" x2="${xCtrl - 5}" y2="230" class="msg-call" />
  <polygon points="${xCtrl - 5},230 ${xCtrl - 11},227 ${xCtrl - 11},233" fill="#1e293b" />
  <text x="380" y="225" class="call-text">1.1: transcribir(Request {texto_dictado, duracion_segundos})</text>

  <!-- 1.2: interpretar() a ComandoVoz NLP -->
  <line x1="${xCtrl + 5}" y1="255" x2="${xNLP - 5}" y2="255" class="msg-call" />
  <polygon points="${xNLP - 5},255 ${xNLP - 11},252 ${xNLP - 11},258" fill="#1e293b" />
  <text x="690" y="250" class="call-text">1.2: interpretar($texto): array</text>

  <!-- 1.3: Detección dinámica de Zona en BD -->
  <line x1="${xNLP + 5}" y1="280" x2="${xZona - 5}" y2="280" class="msg-call" />
  <polygon points="${xZona - 5},280 ${xZona - 11},277 ${xZona - 11},283" fill="#1e293b" />
  <text x="1030" y="275" class="call-text">1.3: table('Zona')-&gt;where('codigo', 'ilike', '%SCZ-NORTE%')-&gt;first()</text>

  <!-- Retorno zona -->
  <line x1="${xZona - 5}" y1="305" x2="${xNLP + 5}" y2="305" class="msg-ret" />
  <text x="1050" y="300" class="ret-text">($zonaEncontrada: idZona 3)</text>

  <!-- Retorno interpretación -->
  <line x1="${xNLP - 5}" y1="335" x2="${xCtrl + 5}" y2="335" class="msg-ret" />
  <text x="700" y="330" class="ret-text">{intencion: 'REPORTE_INGRESOS', parametros: {zona_id: 3, ...}}</text>

  <!-- 1.4: create() persistencia -->
  <line x1="${xCtrl + 5}" y1="360" x2="${xNLP - 5}" y2="360" class="msg-call" />
  <polygon points="${xNLP - 5},360 ${xNLP - 11},357 ${xNLP - 11},363" fill="#1e293b" />
  <text x="690" y="355" class="call-text">1.4: create([idUsuario, textoDictado, intencion, parametros, ...])</text>

  <!-- 1.5: Bitacora de auditoria -->
  <line x1="${xCtrl + 5}" y1="385" x2="${xBit - 5}" y2="385" class="msg-call" />
  <polygon points="${xBit - 5},385 ${xBit - 11},382 ${xBit - 11},388" fill="#1e293b" />
  <text x="800" y="380" class="call-text">1.5: AuditLogger::log('CU29', 'TRANSCRIBIR_VOZ', ...)</text>

  <!-- Retorno JSON a UI -->
  <line x1="${xCtrl - 5}" y1="410" x2="${xUI + 5}" y2="410" class="msg-ret" />
  <text x="390" y="405" class="ret-text">success({idComando, textoDictado, intencion, parametros, resumen})</text>

  <!-- Visualización en UI -->
  <line x1="${xUI - 5}" y1="435" x2="${xAdmin + 5}" y2="435" class="msg-ret" />
  <text x="110" y="430" class="ret-text">mostrarTranscripcionYInterpretacionVisual()</text>

  <!-- ================= BLOQUE 2: CONFIRMAR Y EJECUTAR REPORTE ================= -->
  <rect x="35" y="490" width="${width - 70}" height="320" class="frame-box" />
  <path d="M 35,510 L 35,490 L 380,490 L 392,510 Z" class="frame-tab" />
  <text x="45" y="504" class="frame-title">alt Flujo 2: Confirmar o ajustar texto transcrito y ejecutar reporte</text>

  <rect x="${xAdmin - 5}" y="520" width="10" height="270" class="act-bar" />
  <rect x="${xUI - 5}" y="520" width="10" height="265" class="act-bar" />
  <rect x="${xCtrl - 5}" y="540" width="10" height="175" class="act-bar" />

  <!-- 2: confirmarComando -->
  <line x1="${xAdmin + 5}" y1="530" x2="${xUI - 5}" y2="530" class="msg-call" />
  <polygon points="${xUI - 5},530 ${xUI - 11},527 ${xUI - 11},533" fill="#1e293b" />
  <text x="110" y="525" class="call-text">2: confirmarComando(idComando, textoAjustado)</text>

  <!-- 2.1: confirmar(Request) -->
  <line x1="${xUI + 5}" y1="550" x2="${xCtrl - 5}" y2="550" class="msg-call" />
  <polygon points="${xCtrl - 5},550 ${xCtrl - 11},547 ${xCtrl - 11},553" fill="#1e293b" />
  <text x="380" y="545" class="call-text">2.1: confirmar(Request {id_comando, texto_ajustado})</text>

  <!-- 2.2: find() y update() -->
  <line x1="${xCtrl + 5}" y1="575" x2="${xNLP - 5}" y2="575" class="msg-call" />
  <polygon points="${xNLP - 5},575 ${xNLP - 11},572 ${xNLP - 11},578" fill="#1e293b" />
  <text x="690" y="570" class="call-text">2.2: find($id)-&gt;update(['estado'=&gt;'CONFIRMADO', 'textoDictado'=&gt;...])</text>

  <!-- Retorno update -->
  <line x1="${xNLP - 5}" y1="600" x2="${xCtrl + 5}" y2="600" class="msg-ret" />
  <text x="750" y="595" class="ret-text">(comandoActualizado)</text>

  <!-- 2.3: Bitacora de confirmación -->
  <line x1="${xCtrl + 5}" y1="625" x2="${xBit - 5}" y2="625" class="msg-call" />
  <polygon points="${xBit - 5},625 ${xBit - 11},622 ${xBit - 11},628" fill="#1e293b" />
  <text x="800" y="620" class="call-text">2.3: AuditLogger::log('CU29', 'CONFIRMAR_COMANDO', ...)</text>

  <!-- Retorno confirmación -->
  <line x1="${xCtrl - 5}" y1="660" x2="${xUI + 5}" y2="660" class="msg-ret" />
  <text x="390" y="655" class="ret-text">success({textoConfirmado, interpretacion})</text>

  <!-- 2.4: Handoff cruzado hacia CU27 con filtros precargados -->
  <line x1="${xUI + 5}" y1="695" x2="${xUIRep - 5}" y2="695" class="msg-call" />
  <polygon points="${xUIRep - 5},695 ${xUIRep - 11},692 ${xUIRep - 11},698" fill="#1e293b" />
  <text x="750" y="690" class="call-text">2.4: onIrAReporteTradicional('ingresos_pagos', {zona_id: 3, fecha_desde: ...})</text>

  <!-- Notificación al usuario y redirección de vista -->
  <line x1="${xUI - 5}" y1="740" x2="${xAdmin + 5}" y2="740" class="msg-ret" />
  <text x="110" y="735" class="ret-text">abrirModuloCU27ConResultadosPrecargados()</text>

  <!-- ================= BLOQUE 3: HISTORIAL DE COMANDOS ================= -->
  <rect x="35" y="830" width="${width - 70}" height="220" class="frame-box" />
  <path d="M 35,850 L 35,830 L 330,830 L 342,850 Z" class="frame-tab" />
  <text x="45" y="844" class="frame-title">alt Flujo 3: Consultar historial de comandos dictados</text>

  <rect x="${xAdmin - 5}" y="860" width="10" height="170" class="act-bar" />
  <rect x="${xUI - 5}" y="860" width="10" height="165" class="act-bar" />
  <rect x="${xCtrl - 5}" y="875" width="10" height="130" class="act-bar" />

  <!-- 3: listarHistorial -->
  <line x1="${xAdmin + 5}" y1="875" x2="${xUI - 5}" y2="875" class="msg-call" />
  <polygon points="${xUI - 5},875 ${xUI - 11},872 ${xUI - 11},878" fill="#1e293b" />
  <text x="120" y="870" class="call-text">3: listarHistorialComandos()</text>

  <!-- 3.1: historial() -->
  <line x1="${xUI + 5}" y1="895" x2="${xCtrl - 5}" y2="895" class="msg-call" />
  <polygon points="${xCtrl - 5},895 ${xCtrl - 11},892 ${xCtrl - 11},898" fill="#1e293b" />
  <text x="390" y="890" class="call-text">3.1: historial()</text>

  <!-- 3.2: with('usuario')->take(15)->get() -->
  <line x1="${xCtrl + 5}" y1="920" x2="${xNLP - 5}" y2="920" class="msg-call" />
  <polygon points="${xNLP - 5},920 ${xNLP - 11},917 ${xNLP - 11},923" fill="#1e293b" />
  <text x="690" y="915" class="call-text">3.2: with('usuario')-&gt;orderByDesc('created_at')-&gt;take(15)-&gt;get()</text>

  <!-- Retorno historial -->
  <line x1="${xNLP - 5}" y1="950" x2="${xCtrl + 5}" y2="950" class="msg-ret" />
  <text x="750" y="945" class="ret-text">($coleccionComandos)</text>

  <!-- Respuesta JSON -->
  <line x1="${xCtrl - 5}" y1="980" x2="${xUI + 5}" y2="980" class="msg-ret" />
  <text x="390" y="975" class="ret-text">success($historialMapeado, 'Historial obtenido.')</text>

  <!-- Renderizado historial en UI -->
  <line x1="${xUI - 5}" y1="1010" x2="${xAdmin + 5}" y2="1010" class="msg-ret" />
  <text x="120" y="1005" class="ret-text">mostrarListaHistorialConChipsDeEstado()</text>

</svg>
  `;
}

// =========================================================================
// EJECUCIÓN Y GENERACIÓN DE LOS 6 DIAGRAMAS
// =========================================================================

const diagrams = [
  {
    name: 'CU27_Diagrama_Comunicacion',
    title: 'CU27: Diagrama de Comunicación - Generar y Exportar Reportes Tradicionales',
    content: buildCU27Communication().trim(),
  },
  {
    name: 'CU27_Analisis_Clases',
    title: 'CU27: Análisis de Clases - Generar y Exportar Reportes Tradicionales',
    content: buildCU27ClassAnalysis().trim(),
  },
  {
    name: 'CU27_Diagrama_Secuencia',
    title: 'CU27: Diagrama Secuencial - Generar y Exportar Reportes Tradicionales',
    content: buildCU27Sequence().trim(),
  },
  {
    name: 'CU29_Diagrama_Comunicacion',
    title: 'CU29: Diagrama de Comunicación - Capturar y Transcribir Comandos de Voz',
    content: buildCU29Communication().trim(),
  },
  {
    name: 'CU29_Analisis_Clases',
    title: 'CU29: Análisis de Clases - Capturar y Transcribir Comandos de Voz',
    content: buildCU29ClassAnalysis().trim(),
  },
  {
    name: 'CU29_Diagrama_Secuencia',
    title: 'CU29: Diagrama Secuencial - Capturar y Transcribir Comandos de Voz',
    content: buildCU29Sequence().trim(),
  },
];

diagrams.forEach((d) => {
  const svgPath = path.join(outputDir, `${d.name}.svg`);
  const htmlPath = path.join(outputDir, `${d.name}.html`);

  fs.writeFileSync(svgPath, d.content, 'utf8');
  fs.writeFileSync(htmlPath, wrapHtml(d.title, d.content), 'utf8');
  console.log(`[OK] Generado: ${d.name}.svg y ${d.name}.html`);
});

console.log('\\nTodos los diagramas para CU27 y CU29 han sido generados exitosamente en:', outputDir);
