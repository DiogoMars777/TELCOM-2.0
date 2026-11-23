const { generateWatermarks, boundaryIcon, controlIcon, entityIcon, actorIcon } = require('../diagram_helpers');

// =========================================================================
// CU30 - PROCESAR INTENCIÓN DE VOZ CON IA (NLP) (Diogo Rocha - P7)
// Controller: IntencionVozController (procesar, historial, intenciones, ejemplos)
// Boundary: UI_IntencionVoz
// Service: NlpIntencionService
// Entity: IntencionVozIA
// Entities en vivo / Auxiliares: Cliente, Zona, Pago, Bitacora
// =========================================================================

function buildCU30Communication() {
  const width = 1680;
  const height = 960;
  const tabW = 460;

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
  <text x="30" y="38" class="tab-title">sd CU30 Procesar intención de voz con IA (NLP)</text>

  <rect x="20" y="45" width="${width - 40}" height="${height - 65}" fill="#ffffff" stroke="#64748b" stroke-width="1" />

  <g opacity="0.45">
    ${generateWatermarks(width, height)}
  </g>

  <!-- LÍNEAS DE ENLACE -->
  <line x1="150" y1="420" x2="380" y2="420" class="link-line" />
  <line x1="430" y1="420" x2="680" y2="420" class="link-line" />
  <line x1="730" y1="420" x2="980" y2="420" class="link-line" />
  <line x1="1040" y1="420" x2="1340" y2="420" class="link-line" />
  <line x1="1010" y1="380" x2="1010" y2="180" class="link-line" />
  <line x1="1040" y1="150" x2="1200" y2="150" class="link-line" />
  <line x1="1380" y1="380" x2="1380" y2="180" class="link-line" />
  <line x1="710" y1="460" x2="710" y2="690" class="link-line" />

  <!-- INSTANCIAS ROBUSTEZ BCE -->
  <g transform="translate(120, 420)">
    ${actorIcon(0, 0)}
    <text x="0" y="45" class="node-title">Operador / Asistente</text>
  </g>

  <g transform="translate(405, 420)">
    ${boundaryIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">UI_IntencionVoz</text>
  </g>

  <g transform="translate(710, 420)">
    ${controlIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">IntencionVozController</text>
  </g>

  <g transform="translate(1010, 420)">
    ${controlIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">NlpIntencionService</text>
  </g>

  <g transform="translate(1380, 420)">
    ${entityIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">IntencionVozIA</text>
  </g>

  <g transform="translate(1010, 150)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Cliente</text>
  </g>

  <g transform="translate(1230, 150)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Zona</text>
  </g>

  <g transform="translate(1380, 150)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Usuario</text>
  </g>

  <g transform="translate(710, 720)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Bitacora</text>
  </g>

  <!-- MENSAJES Y LLAMADAS -->
  <g transform="translate(145, 335)">
    <text x="0" y="0" class="flow-1">1: enviarComandoVozTexto(dictado) &rarr;</text>
    <text x="0" y="18" class="flow-2">2: consultarHistorialNLP(filtros) &rarr;</text>
    <text x="0" y="36" class="flow-3">3: obtenerCatalogoIntenciones() &rarr;</text>
  </g>

  <g transform="translate(425, 335)">
    <text x="0" y="0" class="flow-1">1.1: procesar(Request $request) &rarr;</text>
    <text x="0" y="18" class="flow-2">2.1: historial(Request $request) &rarr;</text>
    <text x="0" y="36" class="flow-3">3.1: intenciones(), ejemplos() &rarr;</text>
  </g>

  <g transform="translate(740, 385)">
    <text x="0" y="0" class="flow-1">1.2: procesar($textoDictado): array &rarr;</text>
  </g>

  <g transform="translate(1020, 270)">
    <text x="0" y="0" class="flow-1">1.3: Cliente::where('estadoCliente','ACTIVO')->count() &rarr;</text>
  </g>

  <g transform="translate(1080, 120)">
    <text x="0" y="0" class="flow-1">1.4: Zona::pluck('nombreZona') &rarr;</text>
  </g>

  <g transform="translate(1070, 445)">
    <text x="0" y="0" class="flow-1">1.5: IntencionVozIA::create([intencion, confianza, entidades, datosEnVivo]) &rarr;</text>
    <text x="0" y="18" class="flow-2">2.2: with('usuario')->orderByDesc()->paginate() &rarr;</text>
  </g>

  <g transform="translate(1395, 270)">
    <text x="0" y="0" class="flow-2">2.3: with('usuario') &rarr;</text>
  </g>

  <g transform="translate(725, 570)">
    <text x="0" y="0" class="flow-1">1.6: AuditLogger::log('CU30', 'PROCESAR_INTENCION_NLP', motor, intencion) &rarr;</text>
  </g>

  <!-- LEYENDA INFERIOR -->
  <g transform="translate(50, 860)">
    <rect x="0" y="0" width="1580" height="42" fill="#f8fafc" stroke="#cbd5e1" rx="4" />
    <text x="20" y="26" font-size="11" font-weight="bold" fill="#0f172a">Convención de Flujos:</text>
    <text x="170" y="26" class="flow-1">&bull; Flujo 1: Procesamiento semántico con IA/NLP, extracción de entidades y datos en vivo</text>
    <text x="800" y="26" class="flow-2">&bull; Flujo 2: Historial de intenciones con trazabilidad y métricas de latencia</text>
    <text x="1310" y="26" class="flow-3">&bull; Flujo 3: Catálogo de comandos de voz</text>
  </g>
</svg>`;
}

function buildCU30ClassAnalysis() {
  const width = 1420;
  const height = 660;
  const tabW = 520;

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
  <text x="18" y="30" class="tab-title">sd Diagrama de análisis de clases - CU30 Procesar intención de voz con IA (NLP)</text>

  <rect x="10" y="35" width="${width - 20}" height="${height - 45}" fill="#ffffff" stroke="#000000" stroke-width="1" />

  <!-- LÍNEAS DE ASOCIACIÓN -->
  <!-- Actor a UI -->
  <line x1="110" y1="330" x2="160" y2="330" class="link-line" />

  <!-- UI a Controller -->
  <line x1="380" y1="330" x2="440" y2="330" class="link-line" />

  <!-- Controller a Entidad Principal (SOLO A INTENCIONVOZIA!) -->
  <line x1="720" y1="330" x2="790" y2="330" class="link-line" />

  <!-- IntencionVozIA a Usuario (Arriba) -->
  <line x1="905" y1="215" x2="905" y2="170" class="link-line" />
  <text x="915" y="200" class="mult-text">0..*</text>
  <text x="915" y="185" class="mult-text">1</text>

  <!-- IntencionVozIA a Cliente (Derecha) -->
  <line x1="1020" y1="330" x2="1100" y2="330" class="link-line" />
  <text x="1035" y="320" class="mult-text">0..*</text>
  <text x="1075" y="320" class="mult-text">0..1</text>

  <!-- Cliente a Zona (Abajo de Cliente) -->
  <line x1="1205" y1="415" x2="1205" y2="480" class="link-line" />
  <text x="1215" y="435" class="mult-text">0..*</text>
  <text x="1215" y="470" class="mult-text">1</text>

  <!-- 1. ACTOR -->
  <g transform="translate(60, 330)">
    ${actorIcon(0, 0)}
    <text x="0" y="45" class="class-title">Operador / Asistente</text>
  </g>

  <!-- 2. BOUNDARY -->
  <g transform="translate(160, 245)">
    <rect x="0" y="0" width="220" height="170" class="class-box" />
    <text x="110" y="20" class="class-title">UI_IntencionVoz</text>
    <line x1="0" y1="28" x2="220" y2="28" class="divider" />
    <text x="10" y="48" class="method-text">+ escucharVoz(): void</text>
    <text x="10" y="70" class="method-text">+ enviarTextoComando(): void</text>
    <text x="10" y="92" class="method-text">+ listarHistorialNLP(): void</text>
    <text x="10" y="114" class="method-text">+ renderizarRespuesta(): void</text>
    <line x1="0" y1="124" x2="220" y2="124" class="divider" />
    <text x="10" y="146" class="method-text">+ mostrarDatosEnVivo(): void</text>
  </g>

  <!-- 3. CONTROL -->
  <g transform="translate(440, 235)">
    <rect x="0" y="0" width="280" height="190" class="class-box" />
    <text x="140" y="20" class="class-title">IntencionVozController</text>
    <line x1="0" y1="28" x2="280" y2="28" class="divider" />
    <text x="10" y="48" class="method-text">+ procesar(): void</text>
    <text x="10" y="72" class="method-text">+ historial(): void</text>
    <text x="10" y="96" class="method-text">+ intenciones(): void</text>
    <text x="10" y="120" class="method-text">+ ejemplos(): void</text>
    <line x1="0" y1="128" x2="280" y2="128" class="divider" />
    <text x="10" y="148" class="method-text">- clasificarSemantica(): void</text>
    <text x="10" y="168" class="method-text">- auditarIntencion(): void</text>
  </g>

  <!-- 4. TABLA PRINCIPAL: IntencionVozIA -->
  <g transform="translate(790, 215)">
    <rect x="0" y="0" width="230" height="230" class="class-box" />
    <text x="115" y="20" class="class-title">IntencionVozIA</text>
    <line x1="0" y1="28" x2="230" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idIntencion: int</text>
    <text x="10" y="64" class="attr-text">- idUsuario: int</text>
    <text x="10" y="82" class="attr-text">- textoEntrada: text</text>
    <text x="10" y="100" class="attr-text">- intencionCanonica: string</text>
    <text x="10" y="118" class="attr-text">- categoria: string</text>
    <text x="10" y="136" class="attr-text">- confianza: float</text>
    <text x="10" y="154" class="attr-text">- entidadesExtraidas: json</text>
    <text x="10" y="172" class="attr-text">- datosEnVivo: json</text>
    <line x1="0" y1="180" x2="230" y2="180" class="divider" />
    <text x="10" y="200" class="method-text">+ create(): void</text>
    <text x="10" y="214" class="method-text">+ findOrFail(): void</text>
  </g>

  <!-- 5. ENTIDAD RELACIONADA (ARRIBA): Usuario (Auditoría y autor del dictado) -->
  <g transform="translate(790, 50)">
    <rect x="0" y="0" width="230" height="120" class="class-box" />
    <text x="115" y="20" class="class-title">Usuario</text>
    <line x1="0" y1="28" x2="230" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idUsuario: int</text>
    <text x="10" y="64" class="attr-text">- nombreCompleto: string</text>
    <text x="10" y="82" class="attr-text">- nombreUsuario: string</text>
    <line x1="0" y1="90" x2="230" y2="90" class="divider" />
    <text x="10" y="108" class="method-text">+ find(): void</text>
  </g>

  <!-- 6. ENTIDAD RELACIONADA (DERECHA): Cliente (Consultado para datos en vivo) -->
  <g transform="translate(1100, 245)">
    <rect x="0" y="0" width="210" height="170" class="class-box" />
    <text x="105" y="20" class="class-title">Cliente</text>
    <line x1="0" y1="28" x2="210" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idCliente: int</text>
    <text x="10" y="64" class="attr-text">- codigoCliente: string</text>
    <text x="10" y="82" class="attr-text">- nombreCompleto: string</text>
    <text x="10" y="100" class="attr-text">- idZona: int</text>
    <line x1="0" y1="108" x2="210" y2="108" class="divider" />
    <text x="10" y="128" class="method-text">+ find(): void</text>
    <text x="10" y="146" class="method-text">+ count(): void</text>
  </g>

  <!-- 7. ENTIDAD RELACIONADA (ABAJO DE CLIENTE): Zona -->
  <g transform="translate(1100, 480)">
    <rect x="0" y="0" width="210" height="120" class="class-box" />
    <text x="105" y="20" class="class-title">Zona</text>
    <line x1="0" y1="28" x2="210" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idZona: int</text>
    <text x="10" y="64" class="attr-text">- nombreZona: string</text>
    <line x1="0" y1="72" x2="210" y2="72" class="divider" />
    <text x="10" y="92" class="method-text">+ pluck(): void</text>
  </g>
</svg>`;
}

function buildCU30Sequence() {
  const width = 1680;
  const height = 1150;
  const tabW = 460;

  const xAdmin = 70;
  const xUI = 250;
  const xCtrl = 480;
  const xNlp = 730;
  const xZona = 960;
  const xCli = 1170;
  const xEnt = 1380;
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
  <text x="30" y="38" class="tab-title">sd CU30 Procesar intención de voz con IA (NLP)</text>

  <rect x="20" y="45" width="${width - 40}" height="${height - 65}" fill="#ffffff" stroke="#64748b" stroke-width="1" />

  <g opacity="0.4">
    ${generateWatermarks(width, height)}
  </g>

  <!-- LÍNEAS DE VIDA -->
  <line x1="${xAdmin}" y1="130" x2="${xAdmin}" y2="${height - 50}" class="life-line" />
  <line x1="${xUI}" y1="130" x2="${xUI}" y2="${height - 50}" class="life-line" />
  <line x1="${xCtrl}" y1="130" x2="${xCtrl}" y2="${height - 50}" class="life-line" />
  <line x1="${xNlp}" y1="130" x2="${xNlp}" y2="${height - 50}" class="life-line" />
  <line x1="${xZona}" y1="130" x2="${xZona}" y2="${height - 50}" class="life-line" />
  <line x1="${xCli}" y1="130" x2="${xCli}" y2="${height - 50}" class="life-line" />
  <line x1="${xEnt}" y1="130" x2="${xEnt}" y2="${height - 50}" class="life-line" />
  <line x1="${xBit}" y1="130" x2="${xBit}" y2="${height - 50}" class="life-line" />

  <!-- CABECERAS -->
  <g transform="translate(${xAdmin}, 90)">
    ${actorIcon(0, 0)}
    <text x="0" y="40" class="life-title">Operador / Asistente</text>
  </g>
  <g transform="translate(${xUI}, 90)">
    ${boundaryIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">UI_IntencionVoz</text>
  </g>
  <g transform="translate(${xCtrl}, 90)">
    ${controlIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">IntencionVozController</text>
  </g>
  <g transform="translate(${xNlp}, 90)">
    ${controlIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">NlpIntencionService</text>
  </g>
  <g transform="translate(${xZona}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">Zona</text>
  </g>
  <g transform="translate(${xCli}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">Cliente</text>
  </g>
  <g transform="translate(${xEnt}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">IntencionVozIA</text>
  </g>
  <g transform="translate(${xBit}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">Bitacora</text>
  </g>

  <!-- BLOQUE 1: PROCESAMIENTO NLP -->
  <rect x="35" y="150" width="${width - 70}" height="350" class="frame-box" />
  <path d="M 35,170 L 35,150 L 380,150 L 392,170 Z" class="frame-tab" />
  <text x="45" y="164" class="frame-title">alt Flujo 1: Procesar intención con IA y generar datos en vivo</text>

  <rect x="${xAdmin - 5}" y="175" width="10" height="305" class="act-bar" />
  <rect x="${xUI - 5}" y="175" width="10" height="300" class="act-bar" />
  <rect x="${xCtrl - 5}" y="185" width="10" height="275" class="act-bar" />

  <line x1="${xAdmin + 5}" y1="180" x2="${xUI - 5}" y2="180" class="msg-call" />
  <polygon points="${xUI - 5},180 ${xUI - 11},177 ${xUI - 11},183" fill="#1e293b" />
  <text x="100" y="175" class="call-text">1: enviarComandoTexto("¿Cuántos clientes activos tenemos en Plan 3000?")</text>

  <line x1="${xUI + 5}" y1="195" x2="${xCtrl - 5}" y2="195" class="msg-call" />
  <polygon points="${xCtrl - 5},195 ${xCtrl - 11},192 ${xCtrl - 11},198" fill="#1e293b" />
  <text x="280" y="190" class="call-text">1.1: procesar(Request $request)</text>

  <line x1="${xCtrl + 5}" y1="215" x2="${xNlp - 5}" y2="215" class="msg-call" />
  <polygon points="${xNlp - 5},215 ${xNlp - 11},212 ${xNlp - 11},218" fill="#1e293b" />
  <text x="510" y="210" class="call-text">1.2: procesar($textoDictado): array</text>

  <line x1="${xNlp + 5}" y1="235" x2="${xNlp + 35}" y2="235" class="msg-call" />
  <line x1="${xNlp + 35}" y1="235" x2="${xNlp + 35}" y2="250" class="msg-call" />
  <line x1="${xNlp + 35}" y1="250" x2="${xNlp + 5}" y2="250" class="msg-call" />
  <polygon points="${xNlp + 5},250 ${xNlp + 11},247 ${xNlp + 11},253" fill="#1e293b" />
  <text x="${xNlp + 40}" y="246" class="call-text">clasificarIntencion() & extraerEntidades(['zona' => 'Plan 3000'])</text>

  <!-- Consulta Zona -->
  <line x1="${xNlp + 5}" y1="270" x2="${xZona - 5}" y2="270" class="msg-call" />
  <polygon points="${xZona - 5},270 ${xZona - 11},267 ${xZona - 11},273" fill="#1e293b" />
  <text x="750" y="265" class="call-text">1.3: whereLike('nombreZona','Plan 3000')->first()</text>

  <line x1="${xZona - 5}" y1="290" x2="${xNlp + 5}" y2="290" class="msg-ret" />
  <text x="810" y="285" class="ret-text">($zonaEncontrada: {idZona: 3})</text>

  <!-- Consulta Cliente -->
  <line x1="${xNlp + 5}" y1="315" x2="${xCli - 5}" y2="315" class="msg-call" />
  <polygon points="${xCli - 5},315 ${xCli - 11},312 ${xCli - 11},318" fill="#1e293b" />
  <text x="750" y="310" class="call-text">1.4: where('estadoCliente','ACTIVO')->where('idZona',3)->count()</text>

  <line x1="${xCli - 5}" y1="335" x2="${xNlp + 5}" y2="335" class="msg-ret" />
  <text x="810" y="330" class="ret-text">($totalClientesZona: 142)</text>

  <line x1="${xNlp - 5}" y1="360" x2="${xCtrl + 5}" y2="360" class="msg-ret" />
  <text x="510" y="355" class="ret-text">($resultadoNLP: {intencion, confianza, respuesta, datosEnVivo})</text>

  <line x1="${xCtrl + 5}" y1="385" x2="${xEnt - 5}" y2="385" class="msg-call" />
  <polygon points="${xEnt - 5},385 ${xEnt - 11},382 ${xEnt - 11},388" fill="#1e293b" />
  <text x="1100" y="380" class="call-text">1.5: IntencionVozIA::create([textoEntrada, intencion, entidades, respuesta])</text>

  <line x1="${xEnt - 5}" y1="405" x2="${xCtrl + 5}" y2="405" class="msg-ret" />
  <text x="1150" y="400" class="ret-text">($registroPersistido)</text>

  <line x1="${xCtrl + 5}" y1="430" x2="${xBit - 5}" y2="430" class="msg-call" />
  <polygon points="${xBit - 5},430 ${xBit - 11},427 ${xBit - 11},433" fill="#1e293b" />
  <text x="1100" y="425" class="call-text">1.6: AuditLogger::log('CU30', 'PROCESAR_INTENCION_NLP', detalle)</text>

  <line x1="${xCtrl - 5}" y1="455" x2="${xUI + 5}" y2="455" class="msg-ret" />
  <text x="280" y="450" class="ret-text">success($resultado, 'Intención de voz procesada exitosamente con IA')</text>

  <line x1="${xUI - 5}" y1="475" x2="${xAdmin + 5}" y2="475" class="msg-ret" />
  <text x="100" y="470" class="ret-text">renderizarRespuestaVozYDatosEnVivo()</text>
</svg>`;
}

module.exports = {
  buildCU30Communication,
  buildCU30ClassAnalysis,
  buildCU30Sequence,
};

