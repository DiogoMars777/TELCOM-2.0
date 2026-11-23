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
  <line x1="740" y1="420" x2="980" y2="420" class="link-line" />
  <line x1="1040" y1="400" x2="1260" y2="260" class="link-line" />
  <line x1="1340" y1="260" x2="1490" y2="260" class="link-line" />
  <line x1="1040" y1="440" x2="1260" y2="560" class="link-line" />
  <line x1="1340" y1="560" x2="1490" y2="560" class="link-line" />
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

  <g transform="translate(1010, 420)">
    ${controlIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">CatalogoReportesService</text>
  </g>

  <g transform="translate(1300, 260)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Cliente</text>
  </g>

  <g transform="translate(1520, 260)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Zona</text>
  </g>

  <g transform="translate(1300, 560)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Mensualidad</text>
  </g>

  <g transform="translate(1520, 560)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Pago</text>
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

  <g transform="translate(740, 385)">
    <text x="0" y="0" class="flow-1">1.3: generar($intencionEstructurada): array &rarr;</text>
  </g>

  <g transform="translate(1045, 320)">
    <text x="0" y="0" class="flow-1">1.4.1: table('Cliente')->leftJoin('Zona')->get() &rarr;</text>
  </g>

  <g transform="translate(1045, 510)">
    <text x="0" y="0" class="flow-1">1.4.2: table('Mensualidad')->whereIn('estado')->get() &rarr;</text>
  </g>

  <g transform="translate(1350, 520)">
    <text x="0" y="0" class="flow-1">1.4.3: table('Pago')->get() &rarr;</text>
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
  const width = 1450;
  const height = 680;
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
  <text x="18" y="30" class="tab-title">sd Diagrama de análisis de clases - CU31 Generar reporte inteligente vía comando de voz</text>

  <rect x="10" y="35" width="${width - 20}" height="${height - 45}" fill="#ffffff" stroke="#000000" stroke-width="1" />

  <!-- LÍNEAS DE ASOCIACIÓN -->
  <!-- Actor a UI -->
  <line x1="110" y1="330" x2="160" y2="330" class="link-line" />

  <!-- UI a Controller -->
  <line x1="380" y1="330" x2="440" y2="330" class="link-line" />

  <!-- Controller a Entidad Principal (SOLO A REPORTEINTELIGENTE!) -->
  <line x1="720" y1="330" x2="790" y2="330" class="link-line" />

  <!-- ReporteInteligente a Cliente (Derecha) -->
  <line x1="1020" y1="330" x2="1100" y2="330" class="link-line" />
  <text x="1035" y="320" class="mult-text">1</text>
  <text x="1080" y="320" class="mult-text">0..*</text>

  <!-- Cliente a Zona (Arriba de Cliente) -->
  <line x1="1205" y1="245" x2="1205" y2="170" class="link-line" />
  <text x="1215" y="230" class="mult-text">0..*</text>
  <text x="1215" y="185" class="mult-text">1</text>

  <!-- ReporteInteligente a Mensualidad (Abajo) -->
  <line x1="905" y1="440" x2="905" y2="500" class="link-line" />
  <text x="915" y="460" class="mult-text">1</text>
  <text x="915" y="490" class="mult-text">0..*</text>

  <!-- Mensualidad a Pago (Derecha de Mensualidad) -->
  <line x1="1020" y1="580" x2="1100" y2="580" class="link-line" />
  <text x="1035" y="570" class="mult-text">1</text>
  <text x="1075" y="570" class="mult-text">0..1</text>

  <!-- 1. ACTOR -->
  <g transform="translate(60, 330)">
    ${actorIcon(0, 0)}
    <text x="0" y="45" class="class-title">Administrador / Gerencia</text>
  </g>

  <!-- 2. BOUNDARY -->
  <g transform="translate(160, 245)">
    <rect x="0" y="0" width="220" height="170" class="class-box" />
    <text x="110" y="20" class="class-title">UI_ReporteInteligente</text>
    <line x1="0" y1="28" x2="220" y2="28" class="divider" />
    <text x="10" y="48" class="method-text">+ dictarComandoReporte(): void</text>
    <text x="10" y="70" class="method-text">+ enviarComandoTexto(): void</text>
    <text x="10" y="92" class="method-text">+ previsualizarInterpretacion(): void</text>
    <text x="10" y="114" class="method-text">+ renderizarTablaReporteIA(): void</text>
    <line x1="0" y1="124" x2="220" y2="124" class="divider" />
    <text x="10" y="146" class="method-text">+ exportarReporte(): void</text>
  </g>

  <!-- 3. CONTROL -->
  <g transform="translate(440, 235)">
    <rect x="0" y="0" width="280" height="190" class="class-box" />
    <text x="140" y="20" class="class-title">ReporteInteligenteController</text>
    <line x1="0" y1="28" x2="280" y2="28" class="divider" />
    <text x="10" y="48" class="method-text">+ generar(): void</text>
    <text x="10" y="72" class="method-text">- validarEntrada(): void</text>
    <text x="10" y="96" class="method-text">- auditarReporte(): void</text>
    <line x1="0" y1="108" x2="280" y2="108" class="divider" />
    <text x="10" y="130" class="method-text">- resolverIntencion(): void</text>
    <text x="10" y="152" class="method-text">- ejecutarConsulta(): void</text>
  </g>

  <!-- 4. TABLA PRINCIPAL: ReporteInteligente -->
  <g transform="translate(790, 220)">
    <rect x="0" y="0" width="230" height="220" class="class-box" />
    <text x="115" y="20" class="class-title">ReporteInteligente</text>
    <line x1="0" y1="28" x2="230" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idReporte: int</text>
    <text x="10" y="64" class="attr-text">- tipoReporte: string</text>
    <text x="10" y="82" class="attr-text">- comandoOrigen: text</text>
    <text x="10" y="100" class="attr-text">- filtrosAplicados: json</text>
    <text x="10" y="118" class="attr-text">- filasDevueltas: int</text>
    <text x="10" y="136" class="attr-text">- idUsuario: int</text>
    <text x="10" y="154" class="attr-text">- fechaGeneracion: timestamp</text>
    <line x1="0" y1="162" x2="230" y2="162" class="divider" />
    <text x="10" y="182" class="method-text">+ generar(): void</text>
    <text x="10" y="200" class="method-text">+ estructurarKPIs(): void</text>
  </g>

  <!-- 5. ENTIDAD RELACIONADA (DERECHA): Cliente -->
  <g transform="translate(1100, 245)">
    <rect x="0" y="0" width="210" height="170" class="class-box" />
    <text x="105" y="20" class="class-title">Cliente</text>
    <line x1="0" y1="28" x2="210" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idCliente: int</text>
    <text x="10" y="64" class="attr-text">- codigoCliente: string</text>
    <text x="10" y="82" class="attr-text">- idZona: int</text>
    <text x="10" y="100" class="attr-text">- estadoCliente: string</text>
    <line x1="0" y1="108" x2="210" y2="108" class="divider" />
    <text x="10" y="128" class="method-text">+ find(): void</text>
    <text x="10" y="146" class="method-text">+ get(): void</text>
  </g>

  <!-- 6. ENTIDAD RELACIONADA (ARRIBA DE CLIENTE): Zona -->
  <g transform="translate(1100, 50)">
    <rect x="0" y="0" width="210" height="120" class="class-box" />
    <text x="105" y="20" class="class-title">Zona</text>
    <line x1="0" y1="28" x2="210" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idZona: int</text>
    <text x="10" y="64" class="attr-text">- nombreZona: string</text>
    <text x="10" y="82" class="attr-text">- codigo: string</text>
    <line x1="0" y1="90" x2="210" y2="90" class="divider" />
    <text x="10" y="108" class="method-text">+ find(): void</text>
  </g>

  <!-- 7. ENTIDAD RELACIONADA (ABAJO): Mensualidad -->
  <g transform="translate(790, 500)">
    <rect x="0" y="0" width="230" height="150" class="class-box" />
    <text x="115" y="20" class="class-title">Mensualidad</text>
    <line x1="0" y1="28" x2="230" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idMensualidad: int</text>
    <text x="10" y="64" class="attr-text">- periodo: string</text>
    <text x="10" y="82" class="attr-text">- monto: decimal</text>
    <text x="10" y="100" class="attr-text">- estado: string</text>
    <line x1="0" y1="108" x2="230" y2="108" class="divider" />
    <text x="10" y="128" class="method-text">+ where(): void</text>
  </g>

  <!-- 8. ENTIDAD RELACIONADA (DERECHA DE MENSUALIDAD): Pago -->
  <g transform="translate(1100, 500)">
    <rect x="0" y="0" width="210" height="150" class="class-box" />
    <text x="105" y="20" class="class-title">Pago</text>
    <line x1="0" y1="28" x2="210" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idPago: int</text>
    <text x="10" y="64" class="attr-text">- fechaHora: timestamp</text>
    <text x="10" y="82" class="attr-text">- montoTotal: decimal</text>
    <text x="10" y="100" class="attr-text">- idMetodoPago: int</text>
    <line x1="0" y1="108" x2="210" y2="108" class="divider" />
    <text x="10" y="128" class="method-text">+ find(): void</text>
  </g>
</svg>`;
}

function buildCU31Sequence() {
  const width = 1680;
  const height = 1150;
  const tabW = 480;

  const xAdmin = 70;
  const xUI = 230;
  const xCtrl = 420;
  const xGemini = 630;
  const xCat = 840;
  const xCli = 1050;
  const xMens = 1250;
  const xPago = 1430;
  const xBit = 1600;

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
  <line x1="${xCli}" y1="130" x2="${xCli}" y2="${height - 50}" class="life-line" />
  <line x1="${xMens}" y1="130" x2="${xMens}" y2="${height - 50}" class="life-line" />
  <line x1="${xPago}" y1="130" x2="${xPago}" y2="${height - 50}" class="life-line" />
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
  <g transform="translate(${xCli}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">Cliente</text>
  </g>
  <g transform="translate(${xMens}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">Mensualidad</text>
  </g>
  <g transform="translate(${xPago}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">Pago</text>
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
  <text x="100" y="175" class="call-text">1: dictarComandoReporte("Genera un reporte de morosos de la Zona Norte")</text>

  <line x1="${xUI + 5}" y1="195" x2="${xCtrl - 5}" y2="195" class="msg-call" />
  <polygon points="${xCtrl - 5},195 ${xCtrl - 11},192 ${xCtrl - 11},198" fill="#1e293b" />
  <text x="250" y="190" class="call-text">1.1: generar(Request $request)</text>

  <line x1="${xCtrl + 5}" y1="215" x2="${xGemini - 5}" y2="215" class="msg-call" />
  <polygon points="${xGemini - 5},215 ${xGemini - 11},212 ${xGemini - 11},218" fill="#1e293b" />
  <text x="440" y="210" class="call-text">1.2: interpretar($comando): {tipo: 'morosidad_cortes', filtros: {zona: 'Norte'}}</text>

  <line x1="${xGemini - 5}" y1="240" x2="${xCtrl + 5}" y2="240" class="msg-ret" />
  <text x="480" y="235" class="ret-text">($intencionEstructurada)</text>

  <line x1="${xCtrl + 5}" y1="265" x2="${xCat - 5}" y2="265" class="msg-call" />
  <polygon points="${xCat - 5},265 ${xCat - 11},262 ${xCat - 11},268" fill="#1e293b" />
  <text x="440" y="260" class="call-text">1.3: generar($intencionEstructurada)</text>

  <!-- Query Mensualidad -->
  <line x1="${xCat + 5}" y1="285" x2="${xMens - 5}" y2="285" class="msg-call" />
  <polygon points="${xMens - 5},285 ${xMens - 11},282 ${xMens - 11},288" fill="#1e293b" />
  <text x="860" y="280" class="call-text">1.4: whereIn('estado', ['PENDIENTE','VENCIDA'])->get()</text>

  <line x1="${xMens - 5}" y1="305" x2="${xCat + 5}" y2="305" class="msg-ret" />
  <text x="920" y="300" class="ret-text">($mensualidadesVencidas)</text>

  <!-- Query Cliente -->
  <line x1="${xCat + 5}" y1="330" x2="${xCli - 5}" y2="330" class="msg-call" />
  <polygon points="${xCli - 5},330 ${xCli - 11},327 ${xCli - 11},333" fill="#1e293b" />
  <text x="860" y="325" class="call-text">1.5: table('Cliente')->leftJoin('Zona')->get()</text>

  <line x1="${xCli - 5}" y1="350" x2="${xCat + 5}" y2="350" class="msg-ret" />
  <text x="920" y="345" class="ret-text">($clientesZona)</text>

  <line x1="${xCat - 5}" y1="375" x2="${xCtrl + 5}" y2="375" class="msg-ret" />
  <text x="500" y="370" class="ret-text">($reporteGenerado: {tipo, filas, columnas, resumen, truncado})</text>

  <line x1="${xCtrl + 5}" y1="395" x2="${xBit - 5}" y2="395" class="msg-call" />
  <polygon points="${xBit - 5},395 ${xBit - 11},392 ${xBit - 11},398" fill="#1e293b" />
  <text x="1100" y="390" class="call-text">1.6: AuditLogger::log('CU31', 'GENERAR_REPORTE_INTELIGENTE', detalle)</text>

  <line x1="${xCtrl - 5}" y1="420" x2="${xUI + 5}" y2="420" class="msg-ret" />
  <text x="250" y="415" class="ret-text">success({interpretacion, reporte}, 'Reporte generado correctamente')</text>

  <line x1="${xUI - 5}" y1="445" x2="${xAdmin + 5}" y2="445" class="msg-ret" />
  <text x="100" y="440" class="ret-text">visualizarReporteConMetricasYExportar()</text>
</svg>`;
}

module.exports = {
  buildCU31Communication,
  buildCU31ClassAnalysis,
  buildCU31Sequence,
};

