const { generateWatermarks, boundaryIcon, controlIcon, entityIcon, actorIcon } = require('../diagram_helpers');

// =========================================================================
// CU29 - CAPTURAR Y TRANSCRIBIR COMANDOS DE VOZ (Daniel Candia - P7)
// Controller: ComandoVozController (transcribir, historial, ejemplos)
// Boundary: UI_ComandoVoz
// Entity: ComandoVoz
// Entities Auxiliares: Zona, Bitacora
// =========================================================================

function buildCU29Communication() {
  const width = 1600;
  const height = 900;
  const tabW = 420;

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
  <text x="30" y="38" class="tab-title">sd CU29 Capturar y transcribir comandos de voz</text>

  <rect x="20" y="45" width="${width - 40}" height="${height - 65}" fill="#ffffff" stroke="#64748b" stroke-width="1" />

  <g opacity="0.45">
    ${generateWatermarks(width, height)}
  </g>

  <!-- LÍNEAS DE ENLACE -->
  <line x1="140" y1="360" x2="380" y2="360" class="link-line" />
  <line x1="420" y1="360" x2="710" y2="360" class="link-line" />
  <line x1="750" y1="360" x2="1140" y2="360" class="link-line" />
  <line x1="730" y1="320" x2="730" y2="150" class="link-line" />
  <line x1="1160" y1="320" x2="1160" y2="150" class="link-line" />

  <!-- INSTANCIAS ROBUSTEZ BCE -->
  <g transform="translate(110, 360)">
    ${actorIcon(0, 0)}
    <text x="0" y="45" class="node-title">Usuario / Operador</text>
  </g>

  <g transform="translate(400, 360)">
    ${boundaryIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">UI_ComandoVoz</text>
  </g>

  <g transform="translate(730, 360)">
    ${controlIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">ComandoVozController</text>
  </g>

  <g transform="translate(1160, 360)">
    ${entityIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">ComandoVoz</text>
  </g>

  <g transform="translate(730, 130)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Zona</text>
  </g>

  <g transform="translate(1160, 130)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Usuario</text>
  </g>

  <!-- MENSAJES Y LLAMADAS -->
  <g transform="translate(150, 275)">
    <text x="0" y="0" class="flow-1">1: cargarEjemplosComandos() &rarr;</text>
    <text x="0" y="18" class="flow-2">2: enviarAudioComando(blobAudio) &rarr;</text>
    <text x="0" y="36" class="flow-3">3: consultarHistorialVoz() &rarr;</text>
  </g>

  <g transform="translate(425, 260)">
    <text x="0" y="0" class="flow-1">1.1: ejemplos() &rarr;</text>
    <text x="0" y="18" class="flow-2">2.1: transcribir(Request $request) &rarr;</text>
    <text x="0" y="36" class="flow-3">3.1: historial(Request $request) &rarr;</text>
  </g>

  <g transform="translate(745, 220)">
    <text x="0" y="0" class="flow-2">2.2: Zona::pluck('nombreZona') [contexto geográfico] &rarr;</text>
  </g>

  <g transform="translate(775, 335)">
    <text x="0" y="0" class="flow-2">2.3: create([audioRuta, textoDictado, intencion, confianza]) &rarr;</text>
    <text x="0" y="20" class="flow-3">3.2: with('usuario')->orderByDesc('idComando')->paginate() &rarr;</text>
  </g>

  <g transform="translate(1175, 220)">
    <text x="0" y="0" class="flow-3">3.3: with('usuario') &rarr;</text>
  </g>

  <!-- LEYENDA INFERIOR -->
  <g transform="translate(50, 810)">
    <rect x="0" y="0" width="1500" height="42" fill="#f8fafc" stroke="#cbd5e1" rx="4" />
    <text x="20" y="26" font-size="11" font-weight="bold" fill="#0f172a">Convención de Flujos:</text>
    <text x="170" y="26" class="flow-1">&bull; Flujo 1: Sugerencias y catálogo de ejemplos auditivos</text>
    <text x="580" y="26" class="flow-2">&bull; Flujo 2: Captura en navegador, persistencia de audio WAV y transcripción NLP</text>
    <text x="1150" y="26" class="flow-3">&bull; Flujo 3: Historial paginado con trazabilidad</text>
  </g>
</svg>`;
}

function buildCU29ClassAnalysis() {
  const width = 1420;
  const height = 580;
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
  <text x="18" y="30" class="tab-title">sd Diagrama de análisis de clases - CU29 Capturar y transcribir comandos de voz</text>

  <rect x="10" y="35" width="${width - 20}" height="${height - 45}" fill="#ffffff" stroke="#000000" stroke-width="1" />

  <!-- LÍNEAS DE ASOCIACIÓN -->
  <!-- Actor a UI -->
  <line x1="110" y1="330" x2="160" y2="330" class="link-line" />

  <!-- UI a Controller -->
  <line x1="380" y1="330" x2="440" y2="330" class="link-line" />

  <!-- Controller a Entidad Principal (SOLO A COMANDOVOZ!) -->
  <line x1="720" y1="330" x2="790" y2="330" class="link-line" />

  <!-- ComandoVoz a Usuario (Arriba) -->
  <line x1="905" y1="220" x2="905" y2="170" class="link-line" />
  <text x="915" y="205" class="mult-text">0..*</text>
  <text x="915" y="185" class="mult-text">1</text>

  <!-- ComandoVoz a Zona (Derecha) -->
  <line x1="1020" y1="330" x2="1100" y2="330" class="link-line" />
  <text x="1035" y="320" class="mult-text">0..*</text>
  <text x="1075" y="320" class="mult-text">0..1</text>

  <!-- 1. ACTOR -->
  <g transform="translate(60, 330)">
    ${actorIcon(0, 0)}
    <text x="0" y="45" class="class-title">Usuario / Operador</text>
  </g>

  <!-- 2. BOUNDARY -->
  <g transform="translate(160, 245)">
    <rect x="0" y="0" width="220" height="170" class="class-box" />
    <text x="110" y="20" class="class-title">UI_ComandoVoz</text>
    <line x1="0" y1="28" x2="220" y2="28" class="divider" />
    <text x="10" y="48" class="method-text">+ iniciarGrabacion(): void</text>
    <text x="10" y="70" class="method-text">+ detenerGrabacionYEnviar(): void</text>
    <text x="10" y="92" class="method-text">+ reproducirAudioGrabado(): void</text>
    <text x="10" y="114" class="method-text">+ listarHistorial(pagina): void</text>
    <line x1="0" y1="124" x2="220" y2="124" class="divider" />
    <text x="10" y="146" class="method-text">+ mostrarTranscripcion(): void</text>
  </g>

  <!-- 3. CONTROL -->
  <g transform="translate(440, 235)">
    <rect x="0" y="0" width="280" height="190" class="class-box" />
    <text x="140" y="20" class="class-title">ComandoVozController</text>
    <line x1="0" y1="28" x2="280" y2="28" class="divider" />
    <text x="10" y="48" class="method-text">+ transcribir(): void</text>
    <text x="10" y="72" class="method-text">+ historial(): void</text>
    <text x="10" y="96" class="method-text">+ ejemplos(): void</text>
    <text x="10" y="120" class="method-text">- clasificarIntencion(): void</text>
    <line x1="0" y1="128" x2="280" y2="128" class="divider" />
    <text x="10" y="148" class="method-text">- extraerParametros(): void</text>
    <text x="10" y="168" class="method-text">- almacenarAudio(): void</text>
  </g>

  <!-- 4. TABLA PRINCIPAL: ComandoVoz -->
  <g transform="translate(790, 220)">
    <rect x="0" y="0" width="230" height="220" class="class-box" />
    <text x="115" y="20" class="class-title">ComandoVoz</text>
    <line x1="0" y1="28" x2="230" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idComandoVoz: int</text>
    <text x="10" y="64" class="attr-text">- idUsuario: int</text>
    <text x="10" y="82" class="attr-text">- textoDictado: text</text>
    <text x="10" y="100" class="attr-text">- intencion: string</text>
    <text x="10" y="118" class="attr-text">- parametros: json</text>
    <text x="10" y="136" class="attr-text">- confianza: float</text>
    <text x="10" y="154" class="attr-text">- estado: string</text>
    <text x="10" y="172" class="attr-text">- duracionSegundos: float</text>
    <line x1="0" y1="180" x2="230" y2="180" class="divider" />
    <text x="10" y="200" class="method-text">+ create(): void</text>
    <text x="10" y="214" class="method-text">+ interpretar(): void</text>
  </g>

  <!-- 5. ENTIDAD RELACIONADA (ARRIBA): Usuario (Relación belongsTo con Usuario) -->
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

  <!-- 6. ENTIDAD RELACIONADA (DERECHA): Zona (Consultada durante interpretación geográfica) -->
  <g transform="translate(1100, 255)">
    <rect x="0" y="0" width="230" height="150" class="class-box" />
    <text x="115" y="20" class="class-title">Zona</text>
    <line x1="0" y1="28" x2="230" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idZona: int</text>
    <text x="10" y="64" class="attr-text">- nombreZona: string</text>
    <text x="10" y="82" class="attr-text">- codigo: string</text>
    <line x1="0" y1="90" x2="230" y2="90" class="divider" />
    <text x="10" y="112" class="method-text">+ pluck(): void</text>
    <text x="10" y="132" class="method-text">+ first(): void</text>
  </g>
</svg>`;
}

function buildCU29Sequence() {
  const width = 1600;
  const height = 1100;
  const tabW = 420;

  const xAdmin = 90;
  const xUI = 300;
  const xCtrl = 570;
  const xZona = 860;
  const xEnt = 1140;
  const xUsu = 1440;

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
  <text x="30" y="38" class="tab-title">sd CU29 Capturar y transcribir comandos de voz</text>

  <rect x="20" y="45" width="${width - 40}" height="${height - 65}" fill="#ffffff" stroke="#64748b" stroke-width="1" />

  <g opacity="0.4">
    ${generateWatermarks(width, height)}
  </g>

  <!-- LÍNEAS DE VIDA -->
  <line x1="${xAdmin}" y1="130" x2="${xAdmin}" y2="${height - 50}" class="life-line" />
  <line x1="${xUI}" y1="130" x2="${xUI}" y2="${height - 50}" class="life-line" />
  <line x1="${xCtrl}" y1="130" x2="${xCtrl}" y2="${height - 50}" class="life-line" />
  <line x1="${xZona}" y1="130" x2="${xZona}" y2="${height - 50}" class="life-line" />
  <line x1="${xEnt}" y1="130" x2="${xEnt}" y2="${height - 50}" class="life-line" />
  <line x1="${xUsu}" y1="130" x2="${xUsu}" y2="${height - 50}" class="life-line" />

  <!-- CABECERAS -->
  <g transform="translate(${xAdmin}, 90)">
    ${actorIcon(0, 0)}
    <text x="0" y="40" class="life-title">Usuario / Operador</text>
  </g>
  <g transform="translate(${xUI}, 90)">
    ${boundaryIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">UI_ComandoVoz</text>
  </g>
  <g transform="translate(${xCtrl}, 90)">
    ${controlIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">ComandoVozController</text>
  </g>
  <g transform="translate(${xZona}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">Zona</text>
  </g>
  <g transform="translate(${xEnt}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">ComandoVoz</text>
  </g>
  <g transform="translate(${xUsu}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">Usuario</text>
  </g>

  <!-- BLOQUE 1: TRANSCRIBIR VOZ -->
  <rect x="35" y="150" width="${width - 70}" height="280" class="frame-box" />
  <path d="M 35,170 L 35,150 L 370,150 L 382,170 Z" class="frame-tab" />
  <text x="45" y="164" class="frame-title">alt Flujo 1: Grabar audio, procesar y transcribir comando</text>

  <rect x="${xAdmin - 5}" y="175" width="10" height="235" class="act-bar" />
  <rect x="${xUI - 5}" y="175" width="10" height="230" class="act-bar" />
  <rect x="${xCtrl - 5}" y="185" width="10" height="205" class="act-bar" />

  <line x1="${xAdmin + 5}" y1="180" x2="${xUI - 5}" y2="180" class="msg-call" />
  <polygon points="${xUI - 5},180 ${xUI - 11},177 ${xUI - 11},183" fill="#1e293b" />
  <text x="130" y="175" class="call-text">1: enviarAudioComando(blobWav, textoDictado)</text>

  <line x1="${xUI + 5}" y1="195" x2="${xCtrl - 5}" y2="195" class="msg-call" />
  <polygon points="${xCtrl - 5},195 ${xCtrl - 11},192 ${xCtrl - 11},198" fill="#1e293b" />
  <text x="350" y="190" class="call-text">1.1: transcribir(Request $request)</text>

  <line x1="${xCtrl + 5}" y1="215" x2="${xZona - 5}" y2="215" class="msg-call" />
  <polygon points="${xZona - 5},215 ${xZona - 11},212 ${xZona - 11},218" fill="#1e293b" />
  <text x="590" y="210" class="call-text">1.2: Zona::pluck('nombreZona') [contexto geográfico]</text>

  <line x1="${xZona - 5}" y1="235" x2="${xCtrl + 5}" y2="235" class="msg-ret" />
  <text x="640" y="230" class="ret-text">($zonasContexto)</text>

  <line x1="${xCtrl + 5}" y1="255" x2="${xEnt - 5}" y2="255" class="msg-call" />
  <polygon points="${xEnt - 5},255 ${xEnt - 11},252 ${xEnt - 11},258" fill="#1e293b" />
  <text x="590" y="250" class="call-text">1.3: ComandoVoz::create([textoDictado, intencion, reporteSugerido, confianza])</text>

  <line x1="${xEnt - 5}" y1="280" x2="${xCtrl + 5}" y2="280" class="msg-ret" />
  <text x="820" y="275" class="ret-text">($comandoGuardado)</text>

  <line x1="${xCtrl - 5}" y1="335" x2="${xUI + 5}" y2="335" class="msg-ret" />
  <text x="360" y="330" class="ret-text">success({transcripcion, intencion, accion_sugerida})</text>

  <line x1="${xUI - 5}" y1="360" x2="${xAdmin + 5}" y2="360" class="msg-ret" />
  <text x="130" y="355" class="ret-text">mostrarTextoInterpretadoYModalAccion()</text>

  <!-- BLOQUE 2: HISTORIAL -->
  <rect x="35" y="460" width="${width - 70}" height="220" class="frame-box" />
  <path d="M 35,480 L 35,460 L 310,460 L 322,480 Z" class="frame-tab" />
  <text x="45" y="474" class="frame-title">alt Flujo 2: Consultar historial de transcripciones</text>

  <rect x="${xAdmin - 5}" y="485" width="10" height="175" class="act-bar" />
  <rect x="${xUI - 5}" y="485" width="10" height="170" class="act-bar" />
  <rect x="${xCtrl - 5}" y="495" width="10" height="145" class="act-bar" />

  <line x1="${xAdmin + 5}" y1="490" x2="${xUI - 5}" y2="490" class="msg-call" />
  <polygon points="${xUI - 5},490 ${xUI - 11},487 ${xUI - 11},493" fill="#1e293b" />
  <text x="130" y="485" class="call-text">2: consultarHistorialVoz(filtro)</text>

  <line x1="${xUI + 5}" y1="510" x2="${xCtrl - 5}" y2="510" class="msg-call" />
  <polygon points="${xCtrl - 5},510 ${xCtrl - 11},507 ${xCtrl - 11},513" fill="#1e293b" />
  <text x="350" y="505" class="call-text">2.1: historial(Request $request)</text>

  <line x1="${xCtrl + 5}" y1="535" x2="${xEnt - 5}" y2="535" class="msg-call" />
  <polygon points="${xEnt - 5},535 ${xEnt - 11},532 ${xEnt - 11},538" fill="#1e293b" />
  <text x="600" y="530" class="call-text">2.2: ComandoVoz::with('usuario')->orderByDesc('idComando')->paginate()</text>

  <line x1="${xEnt - 5}" y1="560" x2="${xCtrl + 5}" y2="560" class="msg-ret" />
  <text x="820" y="555" class="ret-text">($historialPaginado)</text>

  <line x1="${xCtrl - 5}" y1="585" x2="${xUI + 5}" y2="585" class="msg-ret" />
  <text x="360" y="580" class="ret-text">success({historial: $historialPaginado})</text>

  <line x1="${xUI - 5}" y1="610" x2="${xAdmin + 5}" y2="610" class="msg-ret" />
  <text x="130" y="605" class="ret-text">renderizarTablaHistorialComandos()</text>
</svg>`;
}

module.exports = {
  buildCU29Communication,
  buildCU29ClassAnalysis,
  buildCU29Sequence,
};

