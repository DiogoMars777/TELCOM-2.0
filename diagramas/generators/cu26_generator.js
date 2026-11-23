const { generateWatermarks, boundaryIcon, controlIcon, entityIcon, actorIcon } = require('../diagram_helpers');

// =========================================================================
// CU26 - VISUALIZAR DASHBOARD ADMINISTRATIVO Y FINANCIERO (Yeremi Segobia - P7)
// Análisis de Clases:
// Actor -> UI_DashboardAdminFinanciero -> DashboardAdminFinancieroController -> ServicioInternet
// A partir de ServicioInternet:
// ServicioInternet "0..*" -up- "1" Cliente
// Cliente "0..*" -up- "1" Zona
// ServicioInternet "0..*" -down- "1" PlanInternet
// ServicioInternet "1" -right- "0..*" Mensualidad
// Mensualidad "1" -right- "0..1" Pago
// Pago "0..*" -down- "1" MetodoPago
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

  <!-- INSTANCIAS -->
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

  <!-- MENSAJES -->
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
    <text x="0" y="16" class="flow-2">2.2: leftJoin('MetodoPago')->groupBy() &rarr;</text>
  </g>

  <g transform="translate(860, 260)">
    <text x="0" y="0" class="flow-1">1.4: where('estado','PENDIENTE')->sum('monto') &rarr;</text>
    <text x="0" y="16" class="flow-2">2.3: selectRaw('sum(monto)')->groupBy('periodo') &rarr;</text>
    <text x="0" y="32" class="flow-3">3.2: join('Cliente')->where('estado','PENDIENTE') &rarr;</text>
  </g>

  <g transform="translate(800, 435)">
    <text x="0" y="0" class="flow-1">1.5: where('estadoCliente','ACTIVO')->count() &rarr;</text>
  </g>

  <g transform="translate(410, 620)">
    <text x="0" y="0" class="flow-1">1.6: leftJoin('EstadoServicio')->groupBy('estado') &rarr;</text>
  </g>

  <g transform="translate(775, 620)">
    <text x="0" y="0" class="flow-1">1.7: withCount(['asignaciones' => whereNull('fechaFin')]) &rarr;</text>
  </g>

  <g transform="translate(900, 645)">
    <text x="0" y="0" class="flow-1">1.8: select('capacidadNodos')->withCount('servicios') &rarr;</text>
  </g>

  <g transform="translate(550, 340)">
    <text x="0" y="0" class="flow-1">1.9: log('CU26', 'CONSULTA_DASHBOARD') &rarr;</text>
  </g>

  <g transform="translate(50, 890)">
    <rect x="0" y="0" width="1580" height="42" fill="#f8fafc" stroke="#cbd5e1" rx="4" />
    <text x="20" y="26" font-size="11" font-weight="bold" fill="#0f172a">Convención de Flujos:</text>
    <text x="170" y="26" class="flow-1">&bull; Flujo 1: Métricas operativas y financieras</text>
    <text x="650" y="26" class="flow-2">&bull; Flujo 2: Desglose financiero</text>
    <text x="1050" y="26" class="flow-3">&bull; Flujo 3: Alertas de morosidad</text>
  </g>
</svg>`;
}

function buildCU26ClassAnalysis() {
  const width = 1750;
  const height = 750;
  const tabW = 560;

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
  <text x="18" y="30" class="tab-title">sd Diagrama de análisis de clases - CU26 Visualizar Dashboard administrativo y financiero</text>

  <rect x="10" y="35" width="${width - 20}" height="${height - 45}" fill="#ffffff" stroke="#000000" stroke-width="1" />

  <!-- LÍNEAS DE ASOCIACIÓN -->
  <!-- Actor a UI -->
  <line x1="110" y1="360" x2="160" y2="360" class="link-line" />

  <!-- UI a Controller -->
  <line x1="410" y1="360" x2="470" y2="360" class="link-line" />

  <!-- Controller a Entidad Principal (SOLO A SERVICIOINTERNET!) -->
  <line x1="770" y1="360" x2="830" y2="360" class="link-line" />

  <!-- ServicioInternet a Cliente (Arriba) -->
  <line x1="935" y1="260" x2="935" y2="170" class="link-line" />
  <text x="945" y="245" class="mult-text">0..*</text>
  <text x="945" y="185" class="mult-text">1</text>

  <!-- Cliente a Zona (Arriba a la derecha) -->
  <line x1="1040" y1="110" x2="1120" y2="110" class="link-line" />
  <text x="1055" y="100" class="mult-text">0..*</text>
  <text x="1100" y="100" class="mult-text">1</text>

  <!-- ServicioInternet a PlanInternet (Abajo) -->
  <line x1="935" y1="460" x2="935" y2="550" class="link-line" />
  <text x="945" y="480" class="mult-text">0..*</text>
  <text x="945" y="535" class="mult-text">1</text>

  <!-- ServicioInternet a Mensualidad (Derecha) -->
  <line x1="1040" y1="360" x2="1120" y2="360" class="link-line" />
  <text x="1055" y="350" class="mult-text">1</text>
  <text x="1100" y="350" class="mult-text">0..*</text>

  <!-- Mensualidad a Pago (Derecha) -->
  <line x1="1330" y1="360" x2="1410" y2="360" class="link-line" />
  <text x="1345" y="350" class="mult-text">1</text>
  <text x="1390" y="350" class="mult-text">0..1</text>

  <!-- Pago a MetodoPago (Abajo) -->
  <line x1="1515" y1="450" x2="1515" y2="550" class="link-line" />
  <text x="1525" y="475" class="mult-text">0..*</text>
  <text x="1525" y="535" class="mult-text">1</text>

  <!-- 1. ACTOR -->
  <g transform="translate(60, 360)">
    ${actorIcon(0, 0)}
    <text x="0" y="45" class="class-title">Administrador / Secretaría</text>
  </g>

  <!-- 2. BOUNDARY -->
  <g transform="translate(160, 275)">
    <rect x="0" y="0" width="250" height="170" class="class-box" />
    <text x="125" y="20" class="class-title">UI_DashboardAdminFinanciero</text>
    <line x1="0" y1="28" x2="250" y2="28" class="divider" />
    <text x="10" y="48" class="method-text">+ consultarDashboard(): void</text>
    <text x="10" y="70" class="method-text">+ filtrarFinanciero(): void</text>
    <text x="10" y="92" class="method-text">+ consultarAlertas(): void</text>
    <text x="10" y="114" class="method-text">+ renderizarKPIs(): void</text>
    <line x1="0" y1="124" x2="250" y2="124" class="divider" />
    <text x="10" y="146" class="method-text">+ exportarResumen(): void</text>
  </g>

  <!-- 3. CONTROL -->
  <g transform="translate(470, 270)">
    <rect x="0" y="0" width="300" height="180" class="class-box" />
    <text x="150" y="20" class="class-title">DashboardAdminFinancieroController</text>
    <line x1="0" y1="28" x2="300" y2="28" class="divider" />
    <text x="10" y="50" class="method-text">+ index(): void</text>
    <text x="10" y="74" class="method-text">+ financiero(): void</text>
    <text x="10" y="98" class="method-text">+ alertas(): void</text>
    <text x="10" y="122" class="method-text">+ metricasGenerales(): void</text>
    <line x1="0" y1="132" x2="300" y2="132" class="divider" />
    <text x="10" y="154" class="method-text">+ calcularKPIs(): void</text>
  </g>

  <!-- 4. TABLA PRINCIPAL: ServicioInternet -->
  <g transform="translate(830, 260)">
    <rect x="0" y="0" width="210" height="200" class="class-box" />
    <text x="105" y="20" class="class-title">ServicioInternet</text>
    <line x1="0" y1="28" x2="210" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idServicio: int</text>
    <text x="10" y="64" class="attr-text">- codigoServicio: string</text>
    <text x="10" y="82" class="attr-text">- idCliente: int</text>
    <text x="10" y="100" class="attr-text">- idPlan: int</text>
    <text x="10" y="118" class="attr-text">- idEstadoServicio: int</text>
    <text x="10" y="136" class="attr-text">- fechaActivacion: date</text>
    <line x1="0" y1="144" x2="210" y2="144" class="divider" />
    <text x="10" y="164" class="method-text">+ count(): void</text>
    <text x="10" y="184" class="method-text">+ groupBy(): void</text>
  </g>

  <!-- 5. ENTIDAD: Cliente (Arriba) -->
  <g transform="translate(830, 50)">
    <rect x="0" y="0" width="210" height="120" class="class-box" />
    <text x="105" y="20" class="class-title">Cliente</text>
    <line x1="0" y1="28" x2="210" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idCliente: int</text>
    <text x="10" y="64" class="attr-text">- nombreCompleto: string</text>
    <text x="10" y="82" class="attr-text">- idZona: int</text>
    <line x1="0" y1="90" x2="210" y2="90" class="divider" />
    <text x="10" y="108" class="method-text">+ find(): void</text>
  </g>

  <!-- 6. ENTIDAD: Zona (Arriba Derecha de Cliente) -->
  <g transform="translate(1120, 50)">
    <rect x="0" y="0" width="210" height="120" class="class-box" />
    <text x="105" y="20" class="class-title">Zona</text>
    <line x1="0" y1="28" x2="210" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idZona: int</text>
    <text x="10" y="64" class="attr-text">- nombreZona: string</text>
    <text x="10" y="82" class="attr-text">- capacidadNodos: int</text>
    <line x1="0" y1="90" x2="210" y2="90" class="divider" />
    <text x="10" y="108" class="method-text">+ withCount(): void</text>
  </g>

  <!-- 7. ENTIDAD: PlanInternet (Abajo) -->
  <g transform="translate(830, 550)">
    <rect x="0" y="0" width="210" height="120" class="class-box" />
    <text x="105" y="20" class="class-title">PlanInternet</text>
    <line x1="0" y1="28" x2="210" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idPlan: int</text>
    <text x="10" y="64" class="attr-text">- nombrePlan: string</text>
    <text x="10" y="82" class="attr-text">- precioMensual: decimal</text>
    <line x1="0" y1="90" x2="210" y2="90" class="divider" />
    <text x="10" y="108" class="method-text">+ all(): void</text>
  </g>

  <!-- 8. ENTIDAD: Mensualidad (Derecha de ServicioInternet) -->
  <g transform="translate(1120, 275)">
    <rect x="0" y="0" width="210" height="170" class="class-box" />
    <text x="105" y="20" class="class-title">Mensualidad</text>
    <line x1="0" y1="28" x2="210" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idMensualidad: int</text>
    <text x="10" y="64" class="attr-text">- periodo: string</text>
    <text x="10" y="82" class="attr-text">- monto: decimal</text>
    <text x="10" y="100" class="attr-text">- estado: string</text>
    <text x="10" y="118" class="attr-text">- idServicio: int</text>
    <line x1="0" y1="126" x2="210" y2="126" class="divider" />
    <text x="10" y="146" class="method-text">+ where(): void</text>
    <text x="10" y="162" class="method-text">+ sum(): void</text>
  </g>

  <!-- 9. ENTIDAD: Pago (Derecha de Mensualidad) -->
  <g transform="translate(1410, 275)">
    <rect x="0" y="0" width="210" height="175" class="class-box" />
    <text x="105" y="20" class="class-title">Pago</text>
    <line x1="0" y1="28" x2="210" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idPago: int</text>
    <text x="10" y="64" class="attr-text">- fechaPago: date</text>
    <text x="10" y="82" class="attr-text">- montoTotal: decimal</text>
    <text x="10" y="100" class="attr-text">- idMetodoPago: int</text>
    <text x="10" y="118" class="attr-text">- idMensualidad: int</text>
    <line x1="0" y1="126" x2="210" y2="126" class="divider" />
    <text x="10" y="146" class="method-text">+ sum(): void</text>
    <text x="10" y="164" class="method-text">+ count(): void</text>
  </g>

  <!-- 10. ENTIDAD: MetodoPago (Abajo de Pago) -->
  <g transform="translate(1410, 550)">
    <rect x="0" y="0" width="210" height="120" class="class-box" />
    <text x="105" y="20" class="class-title">MetodoPago</text>
    <line x1="0" y1="28" x2="210" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idMetodoPago: int</text>
    <text x="10" y="64" class="attr-text">- nombreMetodo: string</text>
    <text x="10" y="82" class="attr-text">- descripcion: string</text>
    <line x1="0" y1="90" x2="210" y2="90" class="divider" />
    <text x="10" y="108" class="method-text">+ find(): void</text>
  </g>
</svg>`;
}

function buildCU26Sequence() {
  const width = 1680;
  const height = 1150;
  const tabW = 460;

  const xAdmin = 90;
  const xUI = 280;
  const xCtrl = 510;
  const xServ = 750;
  const xPago = 1000;
  const xMens = 1200;
  const xCli = 1400;
  const xBit = 1580;

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
  <line x1="${xPago}" y1="130" x2="${xPago}" y2="${height - 50}" class="life-line" />
  <line x1="${xMens}" y1="130" x2="${xMens}" y2="${height - 50}" class="life-line" />
  <line x1="${xCli}" y1="130" x2="${xCli}" y2="${height - 50}" class="life-line" />
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
  <g transform="translate(${xPago}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">Pago</text>
  </g>
  <g transform="translate(${xMens}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">Mensualidad</text>
  </g>
  <g transform="translate(${xCli}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">Cliente</text>
  </g>
  <g transform="translate(${xBit}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">Bitacora</text>
  </g>

  <!-- BLOQUE 1 -->
  <rect x="35" y="150" width="${width - 70}" height="320" class="frame-box" />
  <path d="M 35,170 L 35,150 L 390,150 L 402,170 Z" class="frame-tab" />
  <text x="45" y="164" class="frame-title">alt Flujo 1: Carga general de métricas operativas y financieras</text>

  <rect x="${xAdmin - 5}" y="175" width="10" height="275" class="act-bar" />
  <rect x="${xUI - 5}" y="175" width="10" height="270" class="act-bar" />
  <rect x="${xCtrl - 5}" y="185" width="10" height="245" class="act-bar" />

  <line x1="${xAdmin + 5}" y1="180" x2="${xUI - 5}" y2="180" class="msg-call" />
  <polygon points="${xUI - 5},180 ${xUI - 11},177 ${xUI - 11},183" fill="#1e293b" />
  <text x="130" y="175" class="call-text">1: consultarDashboard(periodo)</text>

  <line x1="${xUI + 5}" y1="195" x2="${xCtrl - 5}" y2="195" class="msg-call" />
  <polygon points="${xCtrl - 5},195 ${xCtrl - 11},192 ${xCtrl - 11},198" fill="#1e293b" />
  <text x="320" y="190" class="call-text">1.1: index(Request $request)</text>

  <line x1="${xCtrl + 5}" y1="215" x2="${xServ - 5}" y2="215" class="msg-call" />
  <polygon points="${xServ - 5},215 ${xServ - 11},212 ${xServ - 11},218" fill="#1e293b" />
  <text x="540" y="210" class="call-text">1.2: obtenerMetricasGenerales(periodo)</text>

  <!-- Consulta Pago -->
  <line x1="${xServ + 5}" y1="235" x2="${xPago - 5}" y2="235" class="msg-call" />
  <polygon points="${xPago - 5},235 ${xPago - 11},232 ${xPago - 11},238" fill="#1e293b" />
  <text x="780" y="230" class="call-text">1.3: Pago::sum('montoTotal')</text>

  <line x1="${xPago - 5}" y1="255" x2="${xServ + 5}" y2="255" class="msg-ret" />
  <text x="820" y="250" class="ret-text">($totalRecaudado)</text>

  <!-- Consulta Mensualidad -->
  <line x1="${xServ + 5}" y1="280" x2="${xMens - 5}" y2="280" class="msg-call" />
  <polygon points="${xMens - 5},280 ${xMens - 11},277 ${xMens - 11},283" fill="#1e293b" />
  <text x="880" y="275" class="call-text">1.4: Mensualidad::where('estado','PENDIENTE')->sum('monto')</text>

  <line x1="${xMens - 5}" y1="300" x2="${xServ + 5}" y2="300" class="msg-ret" />
  <text x="940" y="295" class="ret-text">($carteraVencida)</text>

  <!-- Consulta Cliente -->
  <line x1="${xServ + 5}" y1="325" x2="${xCli - 5}" y2="325" class="msg-call" />
  <polygon points="${xCli - 5},325 ${xCli - 11},322 ${xCli - 11},328" fill="#1e293b" />
  <text x="960" y="320" class="call-text">1.5: Cliente::where('estadoCliente','ACTIVO')->count()</text>

  <line x1="${xCli - 5}" y1="345" x2="${xServ + 5}" y2="345" class="msg-ret" />
  <text x="1040" y="340" class="ret-text">($totalAbonados)</text>

  <line x1="${xServ - 5}" y1="370" x2="${xCtrl + 5}" y2="370" class="msg-ret" />
  <text x="560" y="365" class="ret-text">($metricasConsolidadas)</text>

  <line x1="${xCtrl + 5}" y1="390" x2="${xBit - 5}" y2="390" class="msg-call" />
  <polygon points="${xBit - 5},390 ${xBit - 11},387 ${xBit - 11},393" fill="#1e293b" />
  <text x="1100" y="385" class="call-text">1.6: AuditLogger::log('CU26', 'CONSULTA_DASHBOARD', ip)</text>

  <line x1="${xCtrl - 5}" y1="415" x2="${xUI + 5}" y2="415" class="msg-ret" />
  <text x="330" y="410" class="ret-text">success({metricas})</text>

  <line x1="${xUI - 5}" y1="435" x2="${xAdmin + 5}" y2="435" class="msg-ret" />
  <text x="130" y="430" class="ret-text">renderizarTarjetasKPIyGraficos()</text>

  <!-- BLOQUE 2 -->
  <rect x="35" y="490" width="${width - 70}" height="240" class="frame-box" />
  <path d="M 35,510 L 35,490 L 330,490 L 342,510 Z" class="frame-tab" />
  <text x="45" y="504" class="frame-title">alt Flujo 2: Alertas tempranas de morosidad</text>

  <rect x="${xAdmin - 5}" y="515" width="10" height="195" class="act-bar" />
  <rect x="${xUI - 5}" y="515" width="10" height="190" class="act-bar" />
  <rect x="${xCtrl - 5}" y="525" width="10" height="165" class="act-bar" />

  <line x1="${xAdmin + 5}" y1="520" x2="${xUI - 5}" y2="520" class="msg-call" />
  <polygon points="${xUI - 5},520 ${xUI - 11},517 ${xUI - 11},523" fill="#1e293b" />
  <text x="130" y="515" class="call-text">2: consultarAlertasMorosidad()</text>

  <line x1="${xUI + 5}" y1="540" x2="${xCtrl - 5}" y2="540" class="msg-call" />
  <polygon points="${xCtrl - 5},540 ${xCtrl - 11},537 ${xCtrl - 11},543" fill="#1e293b" />
  <text x="320" y="535" class="call-text">2.1: alertas()</text>

  <line x1="${xCtrl + 5}" y1="565" x2="${xMens - 5}" y2="565" class="msg-call" />
  <polygon points="${xMens - 5},565 ${xMens - 11},562 ${xMens - 11},568" fill="#1e293b" />
  <text x="650" y="560" class="call-text">2.2: Mensualidad::where('estado','VENCIDA')->with('servicio.cliente')->get()</text>

  <line x1="${xMens - 5}" y1="595" x2="${xCtrl + 5}" y2="595" class="msg-ret" />
  <text x="750" y="590" class="ret-text">($morososCriticos)</text>

  <line x1="${xCtrl - 5}" y1="640" x2="${xUI + 5}" y2="640" class="msg-ret" />
  <text x="330" y="635" class="ret-text">success({alertas: $morososCriticos})</text>

  <line x1="${xUI - 5}" y1="670" x2="${xAdmin + 5}" y2="670" class="msg-ret" />
  <text x="130" y="665" class="ret-text">desplegarBandejaAlertasMora()</text>
</svg>`;
}

module.exports = {
  buildCU26Communication,
  buildCU26ClassAnalysis,
  buildCU26Sequence,
};
