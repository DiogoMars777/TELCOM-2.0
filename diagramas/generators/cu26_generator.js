const { generateWatermarks, boundaryIcon, controlIcon, entityIcon, actorIcon } = require('../diagram_helpers');

// =========================================================================
// CU26 - VISUALIZAR DASHBOARD ADMINISTRATIVO Y FINANCIERO (Yeremi Segobia - P7)
// Controller: DashboardAdminFinancieroController (index, financiero, alertas)
// Boundary: UI_DashboardAdminFinanciero
// Entities: Pago, Mensualidad, Cliente, ServicioInternet, PlanInternet, Zona, Bitacora
// =========================================================================

function buildCU26Communication() {
  const width = 1680;
  const height = 980;
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
      .sub-msg { font-size: 9.5px; font-weight: normal; fill: #475569; }
    </style>
  </defs>

  <path d="M 20,45 L 20,24 L ${tabW},24 L ${tabW + 16},45 Z" fill="#ffffff" stroke="#64748b" stroke-width="1" />
  <text x="30" y="38" class="tab-title">sd CU26 Visualizar Dashboard administrativo y financiero</text>

  <rect x="20" y="45" width="${width - 40}" height="${height - 65}" fill="#ffffff" stroke="#64748b" stroke-width="1" />

  <g opacity="0.45">
    ${generateWatermarks(width, height)}
  </g>

  <!-- LÍNEAS DE ENLACE -->
  <line x1="160" y1="460" x2="380" y2="460" class="link-line" />
  <line x1="430" y1="460" x2="720" y2="460" class="link-line" />
  <line x1="750" y1="430" x2="570" y2="200" class="link-line" />
  <line x1="770" y1="430" x2="940" y2="200" class="link-line" />
  <line x1="790" y1="460" x2="1160" y2="460" class="link-line" />
  <line x1="740" y1="490" x2="560" y2="730" class="link-line" />
  <line x1="760" y1="490" x2="760" y2="730" class="link-line" />
  <line x1="780" y1="490" x2="970" y2="730" class="link-line" />
  <line x1="740" y1="440" x2="680" y2="330" class="link-line" />

  <!-- INSTANCIAS ROBUSTEZ BCE -->
  <g transform="translate(130, 460)">
    ${actorIcon(0, 0)}
    <text x="0" y="45" class="node-title">Administrador / Secretaría</text>
  </g>

  <g transform="translate(405, 460)">
    ${boundaryIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">UI_DashboardAdminFinanciero</text>
  </g>

  <g transform="translate(760, 460)">
    ${controlIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">DashboardAdminFinancieroController</text>
  </g>

  <g transform="translate(560, 180)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Pago</text>
  </g>

  <g transform="translate(950, 180)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Mensualidad</text>
  </g>

  <g transform="translate(1200, 460)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Cliente</text>
  </g>

  <g transform="translate(540, 750)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">ServicioInternet</text>
  </g>

  <g transform="translate(760, 750)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">PlanInternet</text>
  </g>

  <g transform="translate(980, 750)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Zona</text>
  </g>

  <g transform="translate(680, 300)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="40" class="node-title">Bitacora</text>
  </g>

  <!-- MENSAJES Y LLAMADAS -->
  <g transform="translate(150, 380)">
    <text x="0" y="0" class="flow-1">1: consultarDashboard(periodo) &rarr;</text>
    <text x="0" y="18" class="flow-2">2: filtrarFinanciero(periodo) &rarr;</text>
    <text x="0" y="36" class="flow-3">3: consultarAlertasMorosidad() &rarr;</text>
  </g>

  <g transform="translate(420, 380)">
    <text x="0" y="0" class="flow-1">1.1: index(Request $request) &rarr;</text>
    <text x="0" y="18" class="flow-2">2.1: financiero(Request $request) &rarr;</text>
    <text x="0" y="36" class="flow-3">3.1: alertas() &rarr;</text>
  </g>

  <g transform="translate(500, 260)">
    <text x="0" y="0" class="flow-1">1.3: sum('montoTotal'), count(*) [recaudación] &rarr;</text>
    <text x="0" y="16" class="flow-2">2.2: leftJoin('MetodoPago')->groupBy() [canales QR/Efectivo] &rarr;</text>
  </g>

  <g transform="translate(860, 260)">
    <text x="0" y="0" class="flow-1">1.4: where('estado','PENDIENTE')->sum('monto') [cartera vencida] &rarr;</text>
    <text x="0" y="16" class="flow-2">2.3: selectRaw('sum(monto)')->groupBy('periodo') [evolución semestral] &rarr;</text>
    <text x="0" y="32" class="flow-3">3.2: join('Cliente')->where('estado','PENDIENTE')->orderByDesc('mora') &rarr;</text>
  </g>

  <g transform="translate(800, 435)">
    <text x="0" y="0" class="flow-1">1.5: where('estadoCliente','ACTIVO')->count() [clientes activos] &rarr;</text>
    <text x="0" y="18" class="flow-3">3.3: findOrFail(idCliente) [contacto/deuda] &rarr;</text>
  </g>

  <g transform="translate(410, 620)">
    <text x="0" y="0" class="flow-1">1.6: leftJoin('EstadoServicio')->groupBy('estado') [servicios activos/cortes] &rarr;</text>
  </g>

  <g transform="translate(775, 620)">
    <text x="0" y="0" class="flow-1">1.7: withCount(['asignaciones' => whereNull('fechaFin')]) [abonados por plan] &rarr;</text>
  </g>

  <g transform="translate(900, 645)">
    <text x="0" y="0" class="flow-1">1.8: select('capacidadNodos')->withCount('servicios') [saturación red] &rarr;</text>
  </g>

  <g transform="translate(550, 340)">
    <text x="0" y="0" class="flow-1">1.9: log('CU26', 'CONSULTA_DASHBOARD', ip) &rarr;</text>
  </g>

  <!-- LEYENDA INFERIOR -->
  <g transform="translate(50, 890)">
    <rect x="0" y="0" width="1580" height="42" fill="#f8fafc" stroke="#cbd5e1" rx="4" />
    <text x="20" y="26" font-size="11" font-weight="bold" fill="#0f172a">Convención de Flujos:</text>
    <text x="170" y="26" class="flow-1">&bull; Flujo 1: Carga general de métricas operativas y financieras (Tarjetas KPI)</text>
    <text x="730" y="26" class="flow-2">&bull; Flujo 2: Consulta analítica financiera (Gráficos evolutivos y métodos)</text>
    <text x="1230" y="26" class="flow-3">&bull; Flujo 3: Alertas tempranas de morosidad</text>
  </g>
</svg>`;
}

function buildCU26ClassAnalysis() {
  const width = 1750;
  const height = 980;
  const tabW = 460;

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
  <text x="30" y="38" class="tab-title">class CU26 Visualizar Dashboard administrativo y financiero</text>

  <rect x="20" y="45" width="${width - 40}" height="${height - 65}" fill="#ffffff" stroke="#606060" stroke-width="1" />

  <g opacity="0.45">
    ${generateWatermarks(width, height)}
  </g>

  <!-- ASOCIACIONES -->
  <line x1="85" y1="280" x2="130" y2="280" class="ea-line" />
  <line x1="390" y1="280" x2="470" y2="280" class="ea-line" />
  <text x="410" y="272" class="assoc-text">invoca</text>

  <line x1="790" y1="280" x2="870" y2="280" class="ea-line" />
  <text x="810" y="272" class="assoc-text">consulta</text>

  <line x1="990" y1="180" x2="990" y2="100" class="ea-line" />
  <text x="1000" y="145" class="assoc-text">recaudación</text>

  <line x1="1130" y1="280" x2="1220" y2="280" class="ea-line" />
  <text x="1150" y="272" class="assoc-text">monitorea mora</text>

  <line x1="990" y1="390" x2="990" y2="470" class="ea-line" />
  <text x="1000" y="430" class="assoc-text">red de clientes</text>

  <line x1="990" y1="670" x2="990" y2="730" class="ea-line" />
  <text x="1000" y="705" class="assoc-text">distribución</text>

  <line x1="630" y1="390" x2="630" y2="560" class="ea-line" />
  <text x="640" y="480" class="assoc-text">audita</text>

  <!-- CAJAS EA -->
  <g transform="translate(60, 280)">
    ${actorIcon(0, 0)}
    <text x="0" y="45" class="class-title">Administrador / Secretaría</text>
  </g>

  <g transform="translate(130, 160)">
    <rect x="0" y="0" width="260" height="230" class="class-box" />
    <text x="130" y="20" class="class-title">UI_DashboardAdminFinanciero</text>
    <line x1="0" y1="28" x2="260" y2="28" class="divider" />
    <text x="10" y="48" class="method-text">+ consultarDashboard(periodo): void</text>
    <text x="10" y="70" class="method-text">+ filtrarFinanciero(periodo): void</text>
    <text x="10" y="92" class="method-text">+ consultarAlertasMorosidad(): void</text>
    <text x="10" y="114" class="method-text">+ cambiarPeriodoFiltro(): void</text>
    <text x="10" y="136" class="method-text">+ renderizarKPIs(): void</text>
    <text x="10" y="158" class="method-text">+ renderizarGraficos(): void</text>
    <text x="10" y="180" class="method-text">+ renderizarAlertasMora(): void</text>
    <text x="10" y="202" class="method-text">+ exportarResumen(): void</text>
  </g>

  <g transform="translate(470, 160)">
    <rect x="0" y="0" width="320" height="230" class="class-box" />
    <text x="160" y="20" class="class-title">DashboardAdminFinancieroController</text>
    <line x1="0" y1="28" x2="320" y2="28" class="divider" />
    <text x="10" y="48" class="method-text">+ index(Request $request): JsonResponse</text>
    <text x="10" y="72" class="method-text">+ financiero(Request $request): JsonResponse</text>
    <text x="10" y="96" class="method-text">+ alertas(): JsonResponse</text>
    <text x="10" y="120" class="method-text">- calcularKPIsRecaudacion(): array</text>
    <text x="10" y="144" class="method-text">- calcularCarteraVencida(): array</text>
    <text x="10" y="168" class="method-text">- obtenerSaturacionNodos(): array</text>
    <text x="10" y="192" class="method-text">- auditarConsulta(): void</text>
  </g>

  <g transform="translate(870, 180)">
    <rect x="0" y="0" width="260" height="210" class="class-box" />
    <text x="130" y="20" class="class-title">DashboardMetricasService</text>
    <line x1="0" y1="28" x2="260" y2="28" class="divider" />
    <text x="10" y="48" class="method-text">+ obtenerMetricasGenerales(): array</text>
    <text x="10" y="72" class="method-text">+ obtenerMetricasFinancieras(): array</text>
    <text x="10" y="96" class="method-text">+ obtenerAlertasMorosidad(): array</text>
    <text x="10" y="120" class="method-text">+ calcularTasaMorosidad(): float</text>
    <text x="10" y="144" class="method-text">+ consolidarIngresosMetodo(): array</text>
  </g>

  <g transform="translate(870, 0)">
    <rect x="0" y="0" width="240" height="100" class="class-box" />
    <text x="120" y="18" class="class-title">Pago</text>
    <line x1="0" y1="24" x2="240" y2="24" class="divider" />
    <text x="10" y="40" class="attr-text">- idPago: int   - montoTotal: decimal</text>
    <text x="10" y="56" class="attr-text">- fechaPago: date   - idMetodoPago: int</text>
    <line x1="0" y1="64" x2="240" y2="64" class="divider" />
    <text x="10" y="82" class="method-text">+ sum(): decimal   + count(): int</text>
  </g>

  <g transform="translate(1220, 200)">
    <rect x="0" y="0" width="260" height="170" class="class-box" />
    <text x="130" y="18" class="class-title">Mensualidad</text>
    <line x1="0" y1="24" x2="260" y2="24" class="divider" />
    <text x="10" y="40" class="attr-text">- idMensualidad: int</text>
    <text x="10" y="56" class="attr-text">- periodo: string   - monto: decimal</text>
    <text x="10" y="72" class="attr-text">- estado: string   - fechaVencimiento: date</text>
    <line x1="0" y1="80" x2="260" y2="80" class="divider" />
    <text x="10" y="100" class="method-text">+ where(col, val): Builder</text>
    <text x="10" y="120" class="method-text">+ sum(col): decimal</text>
  </g>

  <g transform="translate(870, 470)">
    <rect x="0" y="0" width="260" height="200" class="class-box" />
    <text x="130" y="18" class="class-title">Cliente</text>
    <line x1="0" y1="24" x2="260" y2="24" class="divider" />
    <text x="10" y="40" class="attr-text">- idCliente: int   - codigoCliente: string</text>
    <text x="10" y="56" class="attr-text">- nombreCompleto: string</text>
    <text x="10" y="72" class="attr-text">- estadoCliente: string</text>
    <text x="10" y="88" class="attr-text">- idZona: int</text>
    <line x1="0" y1="96" x2="260" y2="96" class="divider" />
    <text x="10" y="116" class="method-text">+ count(): int   + find(id): Cliente</text>
    <text x="10" y="136" class="method-text">+ servicios(): HasMany</text>
  </g>

  <g transform="translate(870, 730)">
    <rect x="0" y="0" width="260" height="180" class="class-box" />
    <text x="130" y="18" class="class-title">ServicioInternet</text>
    <line x1="0" y1="24" x2="260" y2="24" class="divider" />
    <text x="10" y="40" class="attr-text">- idServicio: int   - idCliente: int</text>
    <text x="10" y="56" class="attr-text">- idPlan: int   - idEstadoServicio: int</text>
    <line x1="0" y1="64" x2="260" y2="64" class="divider" />
    <text x="10" y="84" class="method-text">+ groupBy(): Builder   + count(): int</text>
    <text x="10" y="104" class="method-text">+ mensualidades(): HasMany</text>
  </g>

  <g transform="translate(1220, 730)">
    <rect x="0" y="0" width="240" height="150" class="class-box" />
    <text x="120" y="18" class="class-title">Zona</text>
    <line x1="0" y1="24" x2="240" y2="24" class="divider" />
    <text x="10" y="40" class="attr-text">- idZona: int   - nombreZona: string</text>
    <text x="10" y="56" class="attr-text">- capacidadNodos: int</text>
    <line x1="0" y1="64" x2="240" y2="64" class="divider" />
    <text x="10" y="84" class="method-text">+ withCount('servicios'): Builder</text>
  </g>

  <g transform="translate(510, 560)">
    <rect x="0" y="0" width="240" height="160" class="class-box" />
    <text x="120" y="18" class="class-title">Bitacora</text>
    <line x1="0" y1="24" x2="240" y2="24" class="divider" />
    <text x="10" y="40" class="attr-text">- idBitacora: int   - casoUso: 'CU26'</text>
    <text x="10" y="56" class="attr-text">- accion: string   - detalles: text</text>
    <line x1="0" y1="64" x2="240" y2="64" class="divider" />
    <text x="10" y="84" class="method-text">+ create(array $datos): Bitacora</text>
  </g>
</svg>`;
}

function buildCU26Sequence() {
  const width = 1680;
  const height = 1150;
  const tabW = 460;

  const xAdmin = 90;
  const xUI = 320;
  const xCtrl = 640;
  const xServ = 980;
  const xEnt = 1320;
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
  <text x="30" y="38" class="tab-title">sd CU26 Visualizar Dashboard administrativo y financiero</text>

  <rect x="20" y="45" width="${width - 40}" height="${height - 65}" fill="#ffffff" stroke="#64748b" stroke-width="1" />

  <g opacity="0.4">
    ${generateWatermarks(width, height)}
  </g>

  <!-- LÍNEAS DE VIDA -->
  <line x1="${xAdmin}" y1="130" x2="${xAdmin}" y2="${height - 50}" class="life-line" />
  <line x1="${xUI}" y1="130" x2="${xUI}" y2="${height - 50}" class="life-line" />
  <line x1="${xCtrl}" y1="130" x2="${xCtrl}" y2="${height - 50}" class="life-line" />
  <line x1="${xServ}" y1="130" x2="${xServ}" y2="${height - 50}" class="life-line" />
  <line x1="${xEnt}" y1="130" x2="${xEnt}" y2="${height - 50}" class="life-line" />
  <line x1="${xBit}" y1="130" x2="${xBit}" y2="${height - 50}" class="life-line" />

  <!-- CABECERAS -->
  <g transform="translate(${xAdmin}, 90)">
    ${actorIcon(0, 0)}
    <text x="0" y="40" class="life-title">Administrador / Secretaría</text>
  </g>
  <g transform="translate(${xUI}, 90)">
    ${boundaryIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">UI_DashboardAdminFinanciero</text>
  </g>
  <g transform="translate(${xCtrl}, 90)">
    ${controlIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">DashboardAdminFinancieroController</text>
  </g>
  <g transform="translate(${xServ}, 90)">
    ${controlIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">DashboardMetricasService</text>
  </g>
  <g transform="translate(${xEnt}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">Pago / Mensualidad / Cliente</text>
  </g>
  <g transform="translate(${xBit}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">Bitacora</text>
  </g>

  <!-- BLOQUE 1: INDEX KPIS -->
  <rect x="35" y="150" width="${width - 70}" height="280" class="frame-box" />
  <path d="M 35,170 L 35,150 L 390,150 L 402,170 Z" class="frame-tab" />
  <text x="45" y="164" class="frame-title">alt Flujo 1: Carga general de métricas operativas y financieras</text>

  <rect x="${xAdmin - 5}" y="175" width="10" height="235" class="act-bar" />
  <rect x="${xUI - 5}" y="175" width="10" height="230" class="act-bar" />
  <rect x="${xCtrl - 5}" y="185" width="10" height="205" class="act-bar" />

  <line x1="${xAdmin + 5}" y1="180" x2="${xUI - 5}" y2="180" class="msg-call" />
  <polygon points="${xUI - 5},180 ${xUI - 11},177 ${xUI - 11},183" fill="#1e293b" />
  <text x="130" y="175" class="call-text">1: consultarDashboard(periodo)</text>

  <line x1="${xUI + 5}" y1="195" x2="${xCtrl - 5}" y2="195" class="msg-call" />
  <polygon points="${xCtrl - 5},195 ${xCtrl - 11},192 ${xCtrl - 11},198" fill="#1e293b" />
  <text x="360" y="190" class="call-text">1.1: index(Request $request)</text>

  <line x1="${xCtrl + 5}" y1="215" x2="${xServ - 5}" y2="215" class="msg-call" />
  <polygon points="${xServ - 5},215 ${xServ - 11},212 ${xServ - 11},218" fill="#1e293b" />
  <text x="690" y="210" class="call-text">1.2: obtenerMetricasGenerales(periodo)</text>

  <line x1="${xServ + 5}" y1="240" x2="${xEnt - 5}" y2="240" class="msg-call" />
  <polygon points="${xEnt - 5},240 ${xEnt - 11},237 ${xEnt - 11},243" fill="#1e293b" />
  <text x="1020" y="235" class="call-text">1.3: Pago::sum('montoTotal'), Mensualidad::where('estado','PENDIENTE')->sum()</text>

  <line x1="${xEnt - 5}" y1="270" x2="${xServ + 5}" y2="270" class="msg-ret" />
  <text x="1050" y="265" class="ret-text">($kpisRecaudacion, $carteraVencida)</text>

  <line x1="${xServ + 5}" y1="295" x2="${xEnt - 5}" y2="295" class="msg-call" />
  <polygon points="${xEnt - 5},295 ${xEnt - 11},292 ${xEnt - 11},298" fill="#1e293b" />
  <text x="1020" y="290" class="call-text">1.4: Cliente::count(), ServicioInternet::groupBy('estado')->count()</text>

  <line x1="${xEnt - 5}" y1="320" x2="${xServ + 5}" y2="320" class="msg-ret" />
  <text x="1050" y="315" class="ret-text">($abonados, $distribucionServicios)</text>

  <line x1="${xServ - 5}" y1="345" x2="${xCtrl + 5}" y2="345" class="msg-ret" />
  <text x="730" y="340" class="ret-text">($metricasConsolidadas)</text>

  <line x1="${xCtrl + 5}" y1="365" x2="${xBit - 5}" y2="365" class="msg-call" />
  <polygon points="${xBit - 5},365 ${xBit - 11},362 ${xBit - 11},368" fill="#1e293b" />
  <text x="1020" y="360" class="call-text">1.5: AuditLogger::log('CU26', 'CONSULTA_DASHBOARD', ip)</text>

  <line x1="${xCtrl - 5}" y1="385" x2="${xUI + 5}" y2="385" class="msg-ret" />
  <text x="390" y="380" class="ret-text">success({metricas}, 'Dashboard obtenido exitosamente')</text>

  <line x1="${xUI - 5}" y1="405" x2="${xAdmin + 5}" y2="405" class="msg-ret" />
  <text x="130" y="400" class="ret-text">renderizarTarjetasKPIyGraficos()</text>

  <!-- BLOQUE 2: ALERTAS DE MOROSIDAD -->
  <rect x="35" y="460" width="${width - 70}" height="240" class="frame-box" />
  <path d="M 35,480 L 35,460 L 330,460 L 342,480 Z" class="frame-tab" />
  <text x="45" y="474" class="frame-title">alt Flujo 3: Alertas tempranas de morosidad</text>

  <rect x="${xAdmin - 5}" y="485" width="10" height="195" class="act-bar" />
  <rect x="${xUI - 5}" y="485" width="10" height="190" class="act-bar" />
  <rect x="${xCtrl - 5}" y="495" width="10" height="165" class="act-bar" />

  <line x1="${xAdmin + 5}" y1="490" x2="${xUI - 5}" y2="490" class="msg-call" />
  <polygon points="${xUI - 5},490 ${xUI - 11},487 ${xUI - 11},493" fill="#1e293b" />
  <text x="130" y="485" class="call-text">2: consultarAlertasMorosidad()</text>

  <line x1="${xUI + 5}" y1="510" x2="${xCtrl - 5}" y2="510" class="msg-call" />
  <polygon points="${xCtrl - 5},510 ${xCtrl - 11},507 ${xCtrl - 11},513" fill="#1e293b" />
  <text x="360" y="505" class="call-text">2.1: alertas()</text>

  <line x1="${xCtrl + 5}" y1="535" x2="${xEnt - 5}" y2="535" class="msg-call" />
  <polygon points="${xEnt - 5},535 ${xEnt - 11},532 ${xEnt - 11},538" fill="#1e293b" />
  <text x="730" y="530" class="call-text">2.2: Mensualidad::where('estado','VENCIDA')->with('servicio.cliente')->orderByDesc('mora')->get()</text>

  <line x1="${xEnt - 5}" y1="565" x2="${xCtrl + 5}" y2="565" class="msg-ret" />
  <text x="890" y="560" class="ret-text">($morososCriticos)</text>

  <line x1="${xCtrl - 5}" y1="610" x2="${xUI + 5}" y2="610" class="msg-ret" />
  <text x="390" y="605" class="ret-text">success({alertas: $morososCriticos})</text>

  <line x1="${xUI - 5}" y1="640" x2="${xAdmin + 5}" y2="640" class="msg-ret" />
  <text x="130" y="635" class="ret-text">desplegarBandejaAlertasMora()</text>
</svg>`;
}

module.exports = {
  buildCU26Communication,
  buildCU26ClassAnalysis,
  buildCU26Sequence,
};

