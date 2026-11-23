const { generateWatermarks, boundaryIcon, controlIcon, entityIcon, actorIcon } = require('../diagram_helpers');

// =========================================================================
// CU28 - GENERAR Y RESTAURAR COPIAS DE SEGURIDAD (Dennar Huarachi - P1)
// Controller: CopiasSeguridadController (index, store, download, restore, destroy)
// Boundary: UI_CopiasSeguridad
// Entity Principal: CopiaSeguridad
// Entities Auxiliares: Usuario, Bitacora
// =========================================================================

function buildCU28Communication() {
  const width = 1620;
  const height = 940;
  const tabW = 440;

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
      .flow-4 { fill: #1d4ed8; font-size: 10.5px; font-weight: bold; }
    </style>
  </defs>

  <path d="M 20,45 L 20,24 L ${tabW},24 L ${tabW + 16},45 Z" fill="#ffffff" stroke="#64748b" stroke-width="1" />
  <text x="30" y="38" class="tab-title">sd CU28 Generar y restaurar copias de seguridad</text>

  <rect x="20" y="45" width="${width - 40}" height="${height - 65}" fill="#ffffff" stroke="#64748b" stroke-width="1" />

  <g opacity="0.45">
    ${generateWatermarks(width, height)}
  </g>

  <!-- LÍNEAS DE ENLACE -->
  <line x1="150" y1="380" x2="380" y2="380" class="link-line" />
  <line x1="420" y1="380" x2="720" y2="380" class="link-line" />
  <line x1="770" y1="380" x2="1140" y2="380" class="link-line" />
  <line x1="740" y1="340" x2="740" y2="160" class="link-line" />
  <line x1="740" y1="420" x2="740" y2="670" class="link-line" />

  <!-- INSTANCIAS ROBUSTEZ BCE -->
  <g transform="translate(120, 380)">
    ${actorIcon(0, 0)}
    <text x="0" y="45" class="node-title">Administrador del Sistema</text>
  </g>

  <g transform="translate(400, 380)">
    ${boundaryIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">UI_CopiasSeguridad</text>
  </g>

  <g transform="translate(740, 380)">
    ${controlIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">CopiasSeguridadController</text>
  </g>

  <g transform="translate(1160, 380)">
    ${entityIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">CopiaSeguridad</text>
  </g>

  <g transform="translate(740, 140)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Usuario</text>
  </g>

  <g transform="translate(740, 700)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Bitacora</text>
  </g>

  <!-- MENSAJES Y LLAMADAS -->
  <g transform="translate(145, 280)">
    <text x="0" y="0" class="flow-1">1: consultarBackups() &rarr;</text>
    <text x="0" y="18" class="flow-2">2: crearBackup(tipo, descripcion) &rarr;</text>
    <text x="0" y="36" class="flow-3">3: restaurarBaseDatos(idCopia) &rarr;</text>
    <text x="0" y="54" class="flow-4">4: descargarArchivo(idCopia) &rarr;</text>
  </g>

  <g transform="translate(425, 280)">
    <text x="0" y="0" class="flow-1">1.1: index() &rarr;</text>
    <text x="0" y="18" class="flow-2">2.1: store(Request $request) &rarr;</text>
    <text x="0" y="36" class="flow-3">3.1: restore(int $id) &rarr;</text>
    <text x="0" y="54" class="flow-4">4.1: download(int $id) &rarr;</text>
  </g>

  <g transform="translate(755, 230)">
    <text x="0" y="0" class="flow-1">1.3: with('usuario:idUsuario,nombreCompleto') &rarr;</text>
    <text x="0" y="16" class="flow-2">2.2: auth()->user()->idUsuario &rarr;</text>
  </g>

  <g transform="translate(775, 335)">
    <text x="0" y="0" class="flow-1">1.2: orderByDesc('idCopiaSeguridad')->get() &rarr;</text>
    <text x="0" y="18" class="flow-2">2.3: Process(pg_dump) -> create([nombre, ruta, tamano]) &rarr;</text>
    <text x="0" y="36" class="flow-3">3.2: findOrFail(id) -> Process(psql restore) &rarr;</text>
    <text x="0" y="54" class="flow-4">4.2: findOrFail(id) -> Storage::download() &rarr;</text>
  </g>

  <g transform="translate(755, 520)">
    <text x="0" y="0" class="flow-2">2.4: log('CU28', 'GENERAR_BACKUP', nombre, bytes) &rarr;</text>
    <text x="0" y="20" class="flow-3">3.3: log('CU28', 'RESTAURAR_BACKUP', resultado, estado) &rarr;</text>
    <text x="0" y="40" class="flow-4">4.3: log('CU28', 'DESCARGAR_BACKUP', idCopia) &rarr;</text>
  </g>

  <!-- LEYENDA INFERIOR -->
  <g transform="translate(50, 850)">
    <rect x="0" y="0" width="1520" height="42" fill="#f8fafc" stroke="#cbd5e1" rx="4" />
    <text x="20" y="26" font-size="11" font-weight="bold" fill="#0f172a">Convención de Flujos:</text>
    <text x="170" y="26" class="flow-1">&bull; Flujo 1: Listado de copias y verificación de integridad en disco</text>
    <text x="640" y="26" class="flow-2">&bull; Flujo 2: Generación de volcado con pg_dump y registro de metadatos</text>
    <text x="1150" y="26" class="flow-3">&bull; Flujo 3: Restauración con psql y trazabilidad crítica</text>
  </g>
</svg>`;
}

function buildCU28ClassAnalysis() {
  const width = 1380;
  const height = 540;
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
  <text x="18" y="30" class="tab-title">sd Diagrama de análisis de clases - CU28 Generar y restaurar copias de seguridad</text>

  <rect x="10" y="35" width="${width - 20}" height="${height - 45}" fill="#ffffff" stroke="#000000" stroke-width="1" />

  <!-- LÍNEAS DE ASOCIACIÓN -->
  <!-- Actor a UI -->
  <line x1="110" y1="260" x2="160" y2="260" class="link-line" />

  <!-- UI a Controller -->
  <line x1="380" y1="260" x2="440" y2="260" class="link-line" />

  <!-- Controller a Entidad Principal (SOLO A COPIASEGURIDAD!) -->
  <line x1="720" y1="260" x2="780" y2="260" class="link-line" />

  <!-- CopiaSeguridad a Usuario (Derecha) -->
  <line x1="1010" y1="260" x2="1080" y2="260" class="link-line" />
  <text x="1025" y="250" class="mult-text">0..*</text>
  <text x="1065" y="250" class="mult-text">1</text>

  <!-- 1. ACTOR -->
  <g transform="translate(60, 260)">
    ${actorIcon(0, 0)}
    <text x="0" y="45" class="class-title">Administrador del Sistema</text>
  </g>

  <!-- 2. BOUNDARY -->
  <g transform="translate(160, 175)">
    <rect x="0" y="0" width="220" height="170" class="class-box" />
    <text x="110" y="20" class="class-title">UI_CopiasSeguridad</text>
    <line x1="0" y1="28" x2="220" y2="28" class="divider" />
    <text x="10" y="48" class="method-text">+ listarCopiasSeguridad(): void</text>
    <text x="10" y="70" class="method-text">+ submitGenerarBackup(): void</text>
    <text x="10" y="92" class="method-text">+ descargarCopia(id): void</text>
    <text x="10" y="114" class="method-text">+ ejecutarRestauracion(id): void</text>
    <line x1="0" y1="124" x2="220" y2="124" class="divider" />
    <text x="10" y="146" class="method-text">+ eliminarCopia(id): void</text>
  </g>

  <!-- 3. CONTROL -->
  <g transform="translate(440, 165)">
    <rect x="0" y="0" width="280" height="190" class="class-box" />
    <text x="140" y="20" class="class-title">CopiasSeguridadController</text>
    <line x1="0" y1="28" x2="280" y2="28" class="divider" />
    <text x="10" y="48" class="method-text">+ index(): void</text>
    <text x="10" y="70" class="method-text">+ store(): void</text>
    <text x="10" y="92" class="method-text">+ download(): void</text>
    <text x="10" y="114" class="method-text">+ restore(): void</text>
    <line x1="0" y1="124" x2="280" y2="124" class="divider" />
    <text x="10" y="146" class="method-text">+ destroy(): void</text>
    <text x="10" y="168" class="method-text">- resolverBinario(): void</text>
  </g>

  <!-- 4. TABLA PRINCIPAL: CopiaSeguridad -->
  <g transform="translate(780, 150)">
    <rect x="0" y="0" width="230" height="220" class="class-box" />
    <text x="115" y="20" class="class-title">CopiaSeguridad</text>
    <line x1="0" y1="28" x2="230" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idCopiaSeguridad: int</text>
    <text x="10" y="64" class="attr-text">- nombreArchivo: string</text>
    <text x="10" y="82" class="attr-text">- ruta: string</text>
    <text x="10" y="100" class="attr-text">- tamanoBytes: bigint</text>
    <text x="10" y="118" class="attr-text">- idUsuario: int</text>
    <text x="10" y="136" class="attr-text">- descripcion: string</text>
    <text x="10" y="154" class="attr-text">- tipo: string</text>
    <text x="10" y="172" class="attr-text">- estado: string</text>
    <line x1="0" y1="180" x2="230" y2="180" class="divider" />
    <text x="10" y="200" class="method-text">+ create(): void</text>
    <text x="10" y="214" class="method-text">+ findOrFail(): void</text>
  </g>

  <!-- 5. ENTIDAD RELACIONADA (DERECHA): Usuario (Ocupada vía foreign key idUsuario) -->
  <g transform="translate(1080, 185)">
    <rect x="0" y="0" width="230" height="150" class="class-box" />
    <text x="115" y="20" class="class-title">Usuario</text>
    <line x1="0" y1="28" x2="230" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idUsuario: int</text>
    <text x="10" y="64" class="attr-text">- nombreCompleto: string</text>
    <text x="10" y="82" class="attr-text">- email: string</text>
    <text x="10" y="100" class="attr-text">- nombreUsuario: string</text>
    <line x1="0" y1="108" x2="230" y2="108" class="divider" />
    <text x="10" y="128" class="method-text">+ find(): void</text>
    <text x="10" y="142" class="method-text">+ with(): void</text>
  </g>
</svg>`;
}

function buildCU28Sequence() {
  const width = 1620;
  const height = 1150;
  const tabW = 440;

  const xAdmin = 90;
  const xUI = 330;
  const xCtrl = 680;
  const xEnt = 1100;
  const xBit = 1440;

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
  <text x="30" y="38" class="tab-title">sd CU28 Generar y restaurar copias de seguridad</text>

  <rect x="20" y="45" width="${width - 40}" height="${height - 65}" fill="#ffffff" stroke="#64748b" stroke-width="1" />

  <g opacity="0.4">
    ${generateWatermarks(width, height)}
  </g>

  <!-- LÍNEAS DE VIDA -->
  <line x1="${xAdmin}" y1="130" x2="${xAdmin}" y2="${height - 50}" class="life-line" />
  <line x1="${xUI}" y1="130" x2="${xUI}" y2="${height - 50}" class="life-line" />
  <line x1="${xCtrl}" y1="130" x2="${xCtrl}" y2="${height - 50}" class="life-line" />
  <line x1="${xEnt}" y1="130" x2="${xEnt}" y2="${height - 50}" class="life-line" />
  <line x1="${xBit}" y1="130" x2="${xBit}" y2="${height - 50}" class="life-line" />

  <!-- CABECERAS -->
  <g transform="translate(${xAdmin}, 90)">
    ${actorIcon(0, 0)}
    <text x="0" y="40" class="life-title">Administrador del Sistema</text>
  </g>
  <g transform="translate(${xUI}, 90)">
    ${boundaryIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">UI_CopiasSeguridad</text>
  </g>
  <g transform="translate(${xCtrl}, 90)">
    ${controlIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">CopiasSeguridadController</text>
  </g>
  <g transform="translate(${xEnt}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">CopiaSeguridad</text>
  </g>
  <g transform="translate(${xBit}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">Bitacora</text>
  </g>

  <!-- BLOQUE 1: GENERAR BACKUP -->
  <rect x="35" y="150" width="${width - 70}" height="280" class="frame-box" />
  <path d="M 35,170 L 35,150 L 370,150 L 382,170 Z" class="frame-tab" />
  <text x="45" y="164" class="frame-title">alt Flujo 1: Generar backup manual (pg_dump)</text>

  <rect x="${xAdmin - 5}" y="175" width="10" height="235" class="act-bar" />
  <rect x="${xUI - 5}" y="175" width="10" height="230" class="act-bar" />
  <rect x="${xCtrl - 5}" y="185" width="10" height="205" class="act-bar" />

  <line x1="${xAdmin + 5}" y1="180" x2="${xUI - 5}" y2="180" class="msg-call" />
  <polygon points="${xUI - 5},180 ${xUI - 11},177 ${xUI - 11},183" fill="#1e293b" />
  <text x="130" y="175" class="call-text">1: solicitarGenerarBackup(tipo: 'MANUAL', descripcion)</text>

  <line x1="${xUI + 5}" y1="195" x2="${xCtrl - 5}" y2="195" class="msg-call" />
  <polygon points="${xCtrl - 5},195 ${xCtrl - 11},192 ${xCtrl - 11},198" fill="#1e293b" />
  <text x="380" y="190" class="call-text">1.1: store(Request $request)</text>

  <line x1="${xCtrl + 5}" y1="215" x2="${xCtrl + 35}" y2="215" class="msg-call" />
  <line x1="${xCtrl + 35}" y1="215" x2="${xCtrl + 35}" y2="230" class="msg-call" />
  <line x1="${xCtrl + 35}" y1="230" x2="${xCtrl + 5}" y2="230" class="msg-call" />
  <polygon points="${xCtrl + 5},230 ${xCtrl + 11},227 ${xCtrl + 11},233" fill="#1e293b" />
  <text x="${xCtrl + 40}" y="226" class="call-text">resolverBinario('pg_dump') & ejecutarProceso()</text>

  <line x1="${xCtrl + 5}" y1="255" x2="${xEnt - 5}" y2="255" class="msg-call" />
  <polygon points="${xEnt - 5},255 ${xEnt - 11},252 ${xEnt - 11},258" fill="#1e293b" />
  <text x="740" y="250" class="call-text">1.2: CopiaSeguridad::create([nombreArchivo, ruta, tamanoBytes, estado: 'EXITOSO'])</text>

  <line x1="${xEnt - 5}" y1="280" x2="${xCtrl + 5}" y2="280" class="msg-ret" />
  <text x="780" y="275" class="ret-text">($copiaRegistrada)</text>

  <line x1="${xCtrl + 5}" y1="305" x2="${xBit - 5}" y2="305" class="msg-call" />
  <polygon points="${xBit - 5},305 ${xBit - 11},302 ${xBit - 11},308" fill="#1e293b" />
  <text x="1140" y="300" class="call-text">1.3: AuditLogger::log('CU28', 'GENERAR_BACKUP', detalle)</text>

  <line x1="${xCtrl - 5}" y1="335" x2="${xUI + 5}" y2="335" class="msg-ret" />
  <text x="420" y="330" class="ret-text">success({copia: $copiaRegistrada}, 'Backup generado correctamente')</text>

  <line x1="${xUI - 5}" y1="360" x2="${xAdmin + 5}" y2="360" class="msg-ret" />
  <text x="130" y="355" class="ret-text">actualizarTablaYDescargarOpcion()</text>

  <!-- BLOQUE 2: RESTAURAR BASE DE DATOS -->
  <rect x="35" y="460" width="${width - 70}" height="320" class="frame-box" />
  <path d="M 35,480 L 35,460 L 370,460 L 382,480 Z" class="frame-tab" />
  <text x="45" y="474" class="frame-title">alt Flujo 2: Restaurar base de datos desde copia (psql)</text>

  <rect x="${xAdmin - 5}" y="485" width="10" height="275" class="act-bar" />
  <rect x="${xUI - 5}" y="485" width="10" height="270" class="act-bar" />
  <rect x="${xCtrl - 5}" y="495" width="10" height="245" class="act-bar" />

  <line x1="${xAdmin + 5}" y1="490" x2="${xUI - 5}" y2="490" class="msg-call" />
  <polygon points="${xUI - 5},490 ${xUI - 11},487 ${xUI - 11},493" fill="#1e293b" />
  <text x="130" y="485" class="call-text">2: confirmarYEjecutarRestauracion(idCopia)</text>

  <line x1="${xUI + 5}" y1="510" x2="${xCtrl - 5}" y2="510" class="msg-call" />
  <polygon points="${xCtrl - 5},510 ${xCtrl - 11},507 ${xCtrl - 11},513" fill="#1e293b" />
  <text x="380" y="505" class="call-text">2.1: restore(int $id)</text>

  <line x1="${xCtrl + 5}" y1="535" x2="${xEnt - 5}" y2="535" class="msg-call" />
  <polygon points="${xEnt - 5},535 ${xEnt - 11},532 ${xEnt - 11},538" fill="#1e293b" />
  <text x="740" y="530" class="call-text">2.2: CopiaSeguridad::findOrFail($id)</text>

  <line x1="${xEnt - 5}" y1="560" x2="${xCtrl + 5}" y2="560" class="msg-ret" />
  <text x="780" y="555" class="ret-text">($copiaSeguridad)</text>

  <line x1="${xCtrl + 5}" y1="585" x2="${xCtrl + 35}" y2="585" class="msg-call" />
  <line x1="${xCtrl + 35}" y1="585" x2="${xCtrl + 35}" y2="600" class="msg-call" />
  <line x1="${xCtrl + 35}" y1="600" x2="${xCtrl + 5}" y2="600" class="msg-call" />
  <polygon points="${xCtrl + 5},600 ${xCtrl + 11},597 ${xCtrl + 11},603" fill="#1e293b" />
  <text x="${xCtrl + 40}" y="596" class="call-text">resolverBinario('psql') & ejecutarRestauracion($ruta)</text>

  <line x1="${xCtrl + 5}" y1="630" x2="${xBit - 5}" y2="630" class="msg-call" />
  <polygon points="${xBit - 5},630 ${xBit - 11},627 ${xBit - 11},633" fill="#1e293b" />
  <text x="1140" y="625" class="call-text">2.3: AuditLogger::log('CU28', 'RESTAURAR_BACKUP', 'RESTAURACION_EXITOSA')</text>

  <line x1="${xCtrl - 5}" y1="660" x2="${xUI + 5}" y2="660" class="msg-ret" />
  <text x="420" y="655" class="ret-text">success(null, 'Base de datos restaurada exitosamente.')</text>

  <line x1="${xUI - 5}" y1="690" x2="${xAdmin + 5}" y2="690" class="msg-ret" />
  <text x="130" y="685" class="ret-text">mostrarMensajeExitoYRefrescarEstado()</text>
</svg>`;
}

module.exports = {
  buildCU28Communication,
  buildCU28ClassAnalysis,
  buildCU28Sequence,
};

