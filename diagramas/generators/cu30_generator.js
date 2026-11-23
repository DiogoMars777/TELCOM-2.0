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
  <line x1="730" y1="420" x2="1000" y2="420" class="link-line" />
  <line x1="1050" y1="420" x2="1320" y2="420" class="link-line" />
  <line x1="1020" y1="380" x2="1020" y2="180" class="link-line" />
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

  <g transform="translate(1020, 420)">
    ${controlIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">NlpIntencionService</text>
  </g>

  <g transform="translate(1360, 420)">
    ${entityIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">IntencionVozIA</text>
  </g>

  <g transform="translate(1020, 150)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Cliente / Zona / Pago</text>
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

  <g transform="translate(745, 385)">
    <text x="0" y="0" class="flow-1">1.2: procesar($textoDictado): array &rarr;</text>
  </g>

  <g transform="translate(1035, 270)">
    <text x="0" y="0" class="flow-1">1.3: extraerEntidades() -> consultarDatosEnVivo() &rarr;</text>
    <text x="0" y="18" class="flow-1">1.4: generarRespuestaAsistente() &rarr;</text>
  </g>

  <g transform="translate(1070, 445)">
    <text x="0" y="0" class="flow-1">1.5: IntencionVozIA::create([intencion, confianza, entidades, datosEnVivo]) &rarr;</text>
    <text x="0" y="18" class="flow-2">2.2: with('usuario')->orderByDesc()->paginate() &rarr;</text>
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
  <text x="30" y="38" class="tab-title">class CU30 Procesar intención de voz con IA (NLP)</text>

  <rect x="20" y="45" width="${width - 40}" height="${height - 65}" fill="#ffffff" stroke="#606060" stroke-width="1" />

  <g opacity="0.45">
    ${generateWatermarks(width, height)}
  </g>

  <!-- ASOCIACIONES -->
  <line x1="85" y1="280" x2="130" y2="280" class="ea-line" />
  <line x1="390" y1="280" x2="470" y2="280" class="ea-line" />
  <text x="410" y="272" class="assoc-text">invoca</text>

  <line x1="770" y1="280" x2="840" y2="280" class="ea-line" />
  <text x="785" y="272" class="assoc-text">delega a</text>

  <line x1="1120" y1="280" x2="1200" y2="280" class="ea-line" />
  <text x="1140" y="272" class="assoc-text">persiste</text>
  <text x="1130" y="295" class="mult-text">1</text>
  <text x="1185" y="295" class="mult-text">0..*</text>

  <line x1="980" y1="180" x2="980" y2="100" class="ea-line" />
  <text x="990" y="145" class="assoc-text">consulta en vivo</text>

  <line x1="620" y1="390" x2="620" y2="560" class="ea-line" />
  <text x="630" y="475" class="assoc-text">registra auditoría</text>

  <!-- CAJAS EA -->
  <g transform="translate(60, 280)">
    ${actorIcon(0, 0)}
    <text x="0" y="45" class="class-title">Operador / Asistente</text>
  </g>

  <g transform="translate(130, 160)">
    <rect x="0" y="0" width="260" height="230" class="class-box" />
    <text x="130" y="20" class="class-title">UI_IntencionVoz</text>
    <line x1="0" y1="28" x2="260" y2="28" class="divider" />
    <text x="10" y="48" class="method-text">+ escucharVozDictada(): void</text>
    <text x="10" y="70" class="method-text">+ enviarTextoComando(txt): void</text>
    <text x="10" y="92" class="method-text">+ listarHistorialNLP(): void</text>
    <text x="10" y="114" class="method-text">+ renderizarRespuestaAsistente(): void</text>
    <text x="10" y="136" class="method-text">+ mostrarWidgetsDatosEnVivo(): void</text>
    <text x="10" y="158" class="method-text">+ navegarAccionSugerida(url): void</text>
    <text x="10" y="180" class="method-text">+ reproducirVozSintetizada(): void</text>
  </g>

  <g transform="translate(470, 160)">
    <rect x="0" y="0" width="300" height="230" class="class-box" />
    <text x="150" y="20" class="class-title">IntencionVozController</text>
    <line x1="0" y1="28" x2="300" y2="28" class="divider" />
    <text x="10" y="48" class="method-text">+ procesar(Request $request): JsonResponse</text>
    <text x="10" y="72" class="method-text">+ historial(Request $request): JsonResponse</text>
    <text x="10" y="96" class="method-text">+ intenciones(): JsonResponse</text>
    <text x="10" y="120" class="method-text">+ ejemplos(): JsonResponse</text>
    <text x="10" y="144" class="method-text">- auditarIntencion(id, canonica, motor): void</text>
  </g>

  <g transform="translate(840, 170)">
    <rect x="0" y="0" width="280" height="240" class="class-box" />
    <text x="140" y="20" class="class-title">NlpIntencionService</text>
    <line x1="0" y1="28" x2="280" y2="28" class="divider" />
    <text x="10" y="48" class="method-text">+ procesar(string $texto): array</text>
    <text x="10" y="70" class="method-text">- clasificarIntencion(string $txt): array</text>
    <text x="10" y="92" class="method-text">- extraerEntidades(string $txt): array</text>
    <text x="10" y="114" class="method-text">- generarRespuesta(intencion, ent): string</text>
    <text x="10" y="136" class="method-text">- construirAccionSugerida(intencion): array</text>
    <text x="10" y="158" class="method-text">- obtenerDatosEnVivo(intencion, ent): array</text>
  </g>

  <g transform="translate(1200, 150)">
    <rect x="0" y="0" width="280" height="270" class="class-box" />
    <text x="140" y="20" class="class-title">IntencionVozIA</text>
    <line x1="0" y1="28" x2="280" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idIntencion: int</text>
    <text x="10" y="64" class="attr-text">- idUsuario: int</text>
    <text x="10" y="82" class="attr-text">- textoEntrada: text</text>
    <text x="10" y="100" class="attr-text">- intencionCanonica: string</text>
    <text x="10" y="118" class="attr-text">- categoria: string</text>
    <text x="10" y="136" class="attr-text">- confianza: decimal</text>
    <text x="10" y="154" class="attr-text">- motor: string</text>
    <text x="10" y="172" class="attr-text">- entidadesExtraidas: json</text>
    <text x="10" y="190" class="attr-text">- accionSugerida: json</text>
    <text x="10" y="208" class="attr-text">- datosEnVivo: json</text>
    <line x1="0" y1="216" x2="280" y2="216" class="divider" />
    <text x="10" y="236" class="method-text">+ usuario(): BelongsTo</text>
    <text x="10" y="254" class="method-text">+ scopeFiltrar(query, filtros): Builder</text>
  </g>

  <g transform="translate(860, 0)">
    <rect x="0" y="0" width="240" height="100" class="class-box" />
    <text x="120" y="18" class="class-title">Cliente / Zona / Pago</text>
    <line x1="0" y1="24" x2="240" y2="24" class="divider" />
    <text x="10" y="40" class="attr-text">Modelos del Dominio TELCOM</text>
    <line x1="0" y1="50" x2="240" y2="50" class="divider" />
    <text x="10" y="70" class="method-text">+ consultas analíticas en vivo()</text>
  </g>

  <g transform="translate(500, 560)">
    <rect x="0" y="0" width="240" height="160" class="class-box" />
    <text x="120" y="18" class="class-title">Bitacora</text>
    <line x1="0" y1="24" x2="240" y2="24" class="divider" />
    <text x="10" y="40" class="attr-text">- idBitacora: int   - casoUso: 'CU30'</text>
    <text x="10" y="56" class="attr-text">- accion: 'PROCESAR_INTENCION_NLP'</text>
    <text x="10" y="72" class="attr-text">- detalles: text</text>
    <line x1="0" y1="80" x2="240" y2="80" class="divider" />
    <text x="10" y="100" class="method-text">+ create(array $datos): Bitacora</text>
  </g>
</svg>`;
}

function buildCU30Sequence() {
  const width = 1680;
  const height = 1150;
  const tabW = 460;

  const xAdmin = 90;
  const xUI = 320;
  const xCtrl = 640;
  const xNlp = 980;
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
  <g transform="translate(${xEnt}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">IntencionVozIA</text>
  </g>
  <g transform="translate(${xBit}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">Bitacora</text>
  </g>

  <!-- BLOQUE 1: PROCESAMIENTO NLP -->
  <rect x="35" y="150" width="${width - 70}" height="320" class="frame-box" />
  <path d="M 35,170 L 35,150 L 380,150 L 392,170 Z" class="frame-tab" />
  <text x="45" y="164" class="frame-title">alt Flujo 1: Procesar intención con IA y generar datos en vivo</text>

  <rect x="${xAdmin - 5}" y="175" width="10" height="275" class="act-bar" />
  <rect x="${xUI - 5}" y="175" width="10" height="270" class="act-bar" />
  <rect x="${xCtrl - 5}" y="185" width="10" height="245" class="act-bar" />

  <line x1="${xAdmin + 5}" y1="180" x2="${xUI - 5}" y2="180" class="msg-call" />
  <polygon points="${xUI - 5},180 ${xUI - 11},177 ${xUI - 11},183" fill="#1e293b" />
  <text x="130" y="175" class="call-text">1: enviarComandoTexto("Muéstrame las mensualidades vencidas en Plan 3000")</text>

  <line x1="${xUI + 5}" y1="195" x2="${xCtrl - 5}" y2="195" class="msg-call" />
  <polygon points="${xCtrl - 5},195 ${xCtrl - 11},192 ${xCtrl - 11},198" fill="#1e293b" />
  <text x="360" y="190" class="call-text">1.1: procesar(Request $request)</text>

  <line x1="${xCtrl + 5}" y1="215" x2="${xNlp - 5}" y2="215" class="msg-call" />
  <polygon points="${xNlp - 5},215 ${xNlp - 11},212 ${xNlp - 11},218" fill="#1e293b" />
  <text x="690" y="210" class="call-text">1.2: procesar($textoDictado): array</text>

  <line x1="${xNlp + 5}" y1="235" x2="${xNlp + 35}" y2="235" class="msg-call" />
  <line x1="${xNlp + 35}" y1="235" x2="${xNlp + 35}" y2="250" class="msg-call" />
  <line x1="${xNlp + 35}" y1="250" x2="${xNlp + 5}" y2="250" class="msg-call" />
  <polygon points="${xNlp + 5},250 ${xNlp + 11},247 ${xNlp + 11},253" fill="#1e293b" />
  <text x="${xNlp + 40}" y="246" class="call-text">clasificarIntencion() & extraerEntidades(['zona' => 'Plan 3000'])</text>

  <line x1="${xNlp + 5}" y1="275" x2="${xNlp + 35}" y2="275" class="msg-call" />
  <line x1="${xNlp + 35}" y1="275" x2="${xNlp + 35}" y2="290" class="msg-call" />
  <line x1="${xNlp + 35}" y1="290" x2="${xNlp + 5}" y2="290" class="msg-call" />
  <polygon points="${xNlp + 5},290 ${xNlp + 11},287 ${xNlp + 11},293" fill="#1e293b" />
  <text x="${xNlp + 40}" y="286" class="call-text">obtenerDatosEnVivo() -> Mensualidad::where('estado','VENCIDA')->get()</text>

  <line x1="${xNlp - 5}" y1="315" x2="${xCtrl + 5}" y2="315" class="msg-ret" />
  <text x="730" y="310" class="ret-text">($resultadoNLP: {intencion, confianza, accion, respuesta, datosEnVivo})</text>

  <line x1="${xCtrl + 5}" y1="340" x2="${xEnt - 5}" y2="340" class="msg-call" />
  <polygon points="${xEnt - 5},340 ${xEnt - 11},337 ${xEnt - 11},343" fill="#1e293b" />
  <text x="1020" y="335" class="call-text">1.3: IntencionVozIA::create([textoEntrada, intencion, entidades, respuesta])</text>

  <line x1="${xEnt - 5}" y1="365" x2="${xCtrl + 5}" y2="365" class="msg-ret" />
  <text x="1050" y="360" class="ret-text">($registroPersistido)</text>

  <line x1="${xCtrl + 5}" y1="390" x2="${xBit - 5}" y2="390" class="msg-call" />
  <polygon points="${xBit - 5},390 ${xBit - 11},387 ${xBit - 11},393" fill="#1e293b" />
  <text x="1020" y="385" class="call-text">1.4: AuditLogger::log('CU30', 'PROCESAR_INTENCION_NLP', detalle)</text>

  <line x1="${xCtrl - 5}" y1="415" x2="${xUI + 5}" y2="415" class="msg-ret" />
  <text x="390" y="410" class="ret-text">success($resultado, 'Intención de voz procesada exitosamente con IA')</text>

  <line x1="${xUI - 5}" y1="440" x2="${xAdmin + 5}" y2="440" class="msg-ret" />
  <text x="130" y="435" class="ret-text">renderizarRespuestaVozYDatosEnVivo()</text>
</svg>`;
}

module.exports = {
  buildCU30Communication,
  buildCU30ClassAnalysis,
  buildCU30Sequence,
};

