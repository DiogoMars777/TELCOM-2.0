const { generateWatermarks, boundaryIcon, controlIcon, entityIcon, actorIcon } = require('../diagram_helpers');

// =========================================================================
// CU24 - GESTIONAR PROVEEDORES (Dunston Madariaga - P5 Equipos, Proveedores e Inventario)
// Controller: ProveedorController (index, show, store, update, activar, desactivar)
// Boundary: UI_Proveedor
// Entity Principal: Proveedor
// Entity Auditoría: Bitacora
// Entity Relacionada: Compra
// =========================================================================

function buildCU24Communication() {
  const width = 1600;
  const height = 900;
  const tabW = 380;

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

  <!-- Pestaña de Diagrama EA -->
  <path d="M 20,45 L 20,24 L ${tabW},24 L ${tabW + 16},45 Z" fill="#ffffff" stroke="#64748b" stroke-width="1" />
  <text x="30" y="38" class="tab-title">sd CU24 Gestionar proveedores</text>

  <!-- Marco Exterior -->
  <rect x="20" y="45" width="${width - 40}" height="${height - 65}" fill="#ffffff" stroke="#64748b" stroke-width="1" />

  <!-- Marcas de agua EA Trial -->
  <g opacity="0.45">
    ${generateWatermarks(width, height)}
  </g>

  <!-- LÍNEAS DE ENLACE -->
  <!-- Actor -> Boundary -->
  <line x1="150" y1="360" x2="380" y2="360" class="link-line" />

  <!-- Boundary -> Controller -->
  <line x1="420" y1="360" x2="730" y2="360" class="link-line" />

  <!-- Controller -> Proveedor (Principal) -->
  <line x1="770" y1="360" x2="1160" y2="360" class="link-line" />

  <!-- Controller -> Bitacora (Auditoría abajo) -->
  <line x1="750" y1="400" x2="750" y2="650" class="link-line" />

  <!-- Proveedor -> Compra (Relación arriba a la derecha) -->
  <line x1="1200" y1="330" x2="1200" y2="170" class="link-line" />

  <!-- INSTANCIAS DEL PATRÓN ROBUSTEZ BCE -->
  <!-- 1. Actor -->
  <g transform="translate(120, 360)">
    ${actorIcon(0, 0)}
    <text x="0" y="45" class="node-title">Administrador / Almacén</text>
  </g>

  <!-- 2. Boundary: UI_Proveedor -->
  <g transform="translate(400, 360)">
    ${boundaryIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">UI_Proveedor</text>
  </g>

  <!-- 3. Control: ProveedorController -->
  <g transform="translate(750, 360)">
    ${controlIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">ProveedorController</text>
  </g>

  <!-- 4. Entity: Proveedor -->
  <g transform="translate(1180, 360)">
    ${entityIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">Proveedor</text>
  </g>

  <!-- 5. Entity: Bitacora -->
  <g transform="translate(750, 680)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Bitacora</text>
  </g>

  <!-- 6. Entity: Compra -->
  <g transform="translate(1200, 140)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Compra</text>
  </g>

  <!-- MENSAJES Y LLAMADAS DE COMUNICACIÓN -->
  <!-- Entre Actor y UI -->
  <g transform="translate(150, 260)">
    <text x="0" y="0" class="flow-1">1: consultarProveedores(buscar, estado) &rarr;</text>
    <text x="0" y="18" class="flow-2">2: registrarProveedor(datos) &rarr;</text>
    <text x="0" y="36" class="flow-3">3: actualizarProveedor(id, datos) &rarr;</text>
    <text x="0" y="54" class="flow-4">4: cambiarEstadoProveedor(id, estado) &rarr;</text>
  </g>

  <!-- Entre UI y Controller -->
  <g transform="translate(430, 260)">
    <text x="0" y="0" class="flow-1">1.1: index(Request $request) &rarr;</text>
    <text x="0" y="18" class="flow-2">2.1: store(Request $request) &rarr;</text>
    <text x="0" y="36" class="flow-3">3.1: update(Request $request, id) &rarr;</text>
    <text x="0" y="54" class="flow-4">4.1: activar(id) / desactivar(id) &rarr;</text>
  </g>

  <!-- Entre Controller y Proveedor -->
  <g transform="translate(790, 260)">
    <text x="0" y="0" class="flow-1">1.2: query()-&gt;whereLike()-&gt;orderBy()-&gt;get() &rarr;</text>
    <text x="0" y="18" class="flow-2">2.2: create([...datos, estado: true]) &rarr;</text>
    <text x="0" y="36" class="flow-3">3.2: findOrFail(id)-&gt;update(datos) &rarr;</text>
    <text x="0" y="54" class="flow-4">4.2: findOrFail(id)-&gt;update(['estado' =&gt; bool]) &rarr;</text>
  </g>

  <!-- Entre Proveedor y Compra -->
  <g transform="translate(1215, 240)">
    <text x="0" y="0" class="flow-4">4.3: compras()-&gt;exists() [valida integridad histórica] &rarr;</text>
  </g>

  <!-- Entre Controller y Bitacora -->
  <g transform="translate(765, 520)">
    <text x="0" y="0" class="flow-2">2.3: log('CU24', 'CREAR_PROVEEDOR', detalle) &rarr;</text>
    <text x="0" y="20" class="flow-3">3.3: log('CU24', 'ACTUALIZAR_PROVEEDOR', prev, nuevos) &rarr;</text>
    <text x="0" y="40" class="flow-4">4.4: log('CU24', 'ESTADO_PROVEEDOR', resultado) &rarr;</text>
  </g>

  <!-- LEYENDA INFERIOR -->
  <g transform="translate(50, 810)">
    <rect x="0" y="0" width="1500" height="42" fill="#f8fafc" stroke="#cbd5e1" rx="4" />
    <text x="20" y="26" font-size="11" font-weight="bold" fill="#0f172a">Convención de Flujos:</text>
    <text x="170" y="26" class="flow-1">&bull; Flujo 1: Búsqueda y listado filtrado de proveedores (ILIKE y estado)</text>
    <text x="640" y="26" class="flow-2">&bull; Flujo 2: Registro con validación NIT único y auditoría</text>
    <text x="1000" y="26" class="flow-3">&bull; Flujo 3: Actualización de datos</text>
    <text x="1200" y="26" class="flow-4">&bull; Flujo 4: Baja lógica conservando compras</text>
  </g>
</svg>`;
}

function buildCU24ClassAnalysis() {
  const width = 1680;
  const height = 920;
  const tabW = 380;

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
  <text x="30" y="38" class="tab-title">class CU24 Gestionar proveedores</text>

  <!-- Marco Exterior -->
  <rect x="20" y="45" width="${width - 40}" height="${height - 65}" fill="#ffffff" stroke="#606060" stroke-width="1" />

  <!-- Marcas de agua EA Trial -->
  <g opacity="0.45">
    ${generateWatermarks(width, height)}
  </g>

  <!-- ASOCIACIONES -->
  <!-- Actor a UI -->
  <line x1="85" y1="280" x2="130" y2="280" class="ea-line" />

  <!-- UI a Controller -->
  <line x1="380" y1="280" x2="450" y2="280" class="ea-line" />
  <text x="400" y="272" class="assoc-text">invoca</text>

  <!-- Controller a Proveedor -->
  <line x1="740" y1="280" x2="820" y2="280" class="ea-line" />
  <text x="760" y="272" class="assoc-text">gestiona</text>
  <text x="750" y="295" class="mult-text">1</text>
  <text x="800" y="295" class="mult-text">0..*</text>

  <!-- Controller a Bitacora -->
  <line x1="600" y1="390" x2="600" y2="580" class="ea-line" />
  <text x="610" y="490" class="assoc-text">registra auditoría</text>
  <text x="610" y="415" class="mult-text">1</text>
  <text x="610" y="565" class="mult-text">0..*</text>

  <!-- Proveedor a Compra -->
  <line x1="1100" y1="280" x2="1200" y2="280" class="ea-line" />
  <text x="1130" y="272" class="assoc-text">suministra</text>
  <text x="1110" y="295" class="mult-text">1</text>
  <text x="1180" y="295" class="mult-text">0..*</text>

  <!-- CAJAS EA -->
  <!-- Actor -->
  <g transform="translate(60, 280)">
    ${actorIcon(0, 0)}
    <text x="0" y="45" class="class-title">Administrador / Almacén</text>
  </g>

  <!-- Boundary: UI_Proveedor -->
  <g transform="translate(130, 170)">
    <rect x="0" y="0" width="250" height="220" class="class-box" />
    <text x="125" y="20" class="class-title">UI_Proveedor</text>
    <line x1="0" y1="28" x2="250" y2="28" class="divider" />
    <text x="10" y="48" class="method-text">+ listarProveedores(): void</text>
    <text x="10" y="70" class="method-text">+ filtrarPorTexto(buscar): void</text>
    <text x="10" y="92" class="method-text">+ filtrarPorEstado(activo): void</text>
    <text x="10" y="114" class="method-text">+ abrirFormularioCrear(): void</text>
    <text x="10" y="136" class="method-text">+ abrirFormularioEditar(id): void</text>
    <text x="10" y="158" class="method-text">+ submitRegistrar(datos): void</text>
    <text x="10" y="180" class="method-text">+ submitActualizar(id, datos): void</text>
    <text x="10" y="202" class="method-text">+ confirmarCambioEstado(id): void</text>
  </g>

  <!-- Controller: ProveedorController -->
  <g transform="translate(450, 170)">
    <rect x="0" y="0" width="290" height="220" class="class-box" />
    <text x="145" y="20" class="class-title">ProveedorController</text>
    <line x1="0" y1="28" x2="290" y2="28" class="divider" />
    <text x="10" y="48" class="method-text">+ index(Request $request): JsonResponse</text>
    <text x="10" y="72" class="method-text">+ show(int $proveedor): JsonResponse</text>
    <text x="10" y="96" class="method-text">+ store(Request $request): JsonResponse</text>
    <text x="10" y="120" class="method-text">+ update(Request $req, int $id): Json</text>
    <text x="10" y="144" class="method-text">+ activar(int $proveedor): JsonResponse</text>
    <text x="10" y="168" class="method-text">+ desactivar(int $proveedor): JsonResponse</text>
    <text x="10" y="192" class="method-text">- validarProveedor(req, prov): array</text>
    <text x="10" y="212" class="method-text">- auditar(prov, accion, res): void</text>
  </g>

  <!-- Entity: Proveedor -->
  <g transform="translate(820, 150)">
    <rect x="0" y="0" width="280" height="260" class="class-box" />
    <text x="140" y="20" class="class-title">Proveedor</text>
    <line x1="0" y1="28" x2="280" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idProveedor: int</text>
    <text x="10" y="64" class="attr-text">- razonSocial: string</text>
    <text x="10" y="82" class="attr-text">- nit: string</text>
    <text x="10" y="100" class="attr-text">- telefono: string</text>
    <text x="10" y="118" class="attr-text">- correo: string</text>
    <text x="10" y="136" class="attr-text">- direccion: string</text>
    <text x="10" y="154" class="attr-text">- estado: boolean</text>
    <text x="10" y="172" class="attr-text">- created_at: timestamp</text>
    <text x="10" y="190" class="attr-text">- updated_at: timestamp</text>
    <line x1="0" y1="198" x2="280" y2="198" class="divider" />
    <text x="10" y="216" class="method-text">+ compras(): HasMany</text>
    <text x="10" y="234" class="method-text">+ scopeActivos(query): Builder</text>
    <text x="10" y="252" class="method-text">+ scopeWhereLike(query, col, val): Builder</text>
  </g>

  <!-- Entity: Compra -->
  <g transform="translate(1200, 170)">
    <rect x="0" y="0" width="260" height="220" class="class-box" />
    <text x="130" y="20" class="class-title">Compra</text>
    <line x1="0" y1="28" x2="260" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idCompra: int</text>
    <text x="10" y="64" class="attr-text">- nroComprobante: string</text>
    <text x="10" y="82" class="attr-text">- fechaCompra: date</text>
    <text x="10" y="100" class="attr-text">- montoTotal: decimal</text>
    <text x="10" y="118" class="attr-text">- idProveedor: int</text>
    <text x="10" y="136" class="attr-text">- idEstadoCompra: int</text>
    <line x1="0" y1="144" x2="260" y2="144" class="divider" />
    <text x="10" y="164" class="method-text">+ proveedor(): BelongsTo</text>
    <text x="10" y="184" class="method-text">+ detalles(): HasMany</text>
    <text x="10" y="204" class="method-text">+ where(col, val): Builder</text>
  </g>

  <!-- Entity: Bitacora -->
  <g transform="translate(480, 580)">
    <rect x="0" y="0" width="240" height="190" class="class-box" />
    <text x="120" y="20" class="class-title">Bitacora</text>
    <line x1="0" y1="28" x2="240" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idBitacora: int</text>
    <text x="10" y="64" class="attr-text">- casoUso: string = 'CU24'</text>
    <text x="10" y="82" class="attr-text">- accion: string</text>
    <text x="10" y="100" class="attr-text">- detalles: text</text>
    <text x="10" y="118" class="attr-text">- ip: string</text>
    <text x="10" y="136" class="attr-text">- idUsuario: int</text>
    <text x="10" y="154" class="attr-text">- fechaHora: timestamp</text>
    <line x1="0" y1="162" x2="240" y2="162" class="divider" />
    <text x="10" y="180" class="method-text">+ create(array $datos): Bitacora</text>
  </g>
</svg>`;
}

function buildCU24Sequence() {
  const width = 1600;
  const height = 1100;
  const tabW = 380;

  const xAdmin = 90;
  const xUI = 330;
  const xCtrl = 680;
  const xProv = 1080;
  const xBit = 1420;

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

  <!-- Pestaña de Diagrama EA -->
  <path d="M 20,45 L 20,24 L ${tabW},24 L ${tabW + 16},45 Z" fill="#ffffff" stroke="#64748b" stroke-width="1" />
  <text x="30" y="38" class="tab-title">sd CU24 Gestionar proveedores</text>

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
  <line x1="${xProv}" y1="130" x2="${xProv}" y2="${height - 50}" class="life-line" />
  <line x1="${xBit}" y1="130" x2="${xBit}" y2="${height - 50}" class="life-line" />

  <!-- CABECERAS -->
  <g transform="translate(${xAdmin}, 90)">
    ${actorIcon(0, 0)}
    <text x="0" y="40" class="life-title">Administrador / Almacén</text>
  </g>
  <g transform="translate(${xUI}, 90)">
    ${boundaryIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">UI_Proveedor</text>
  </g>
  <g transform="translate(${xCtrl}, 90)">
    ${controlIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">ProveedorController</text>
  </g>
  <g transform="translate(${xProv}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">Proveedor</text>
  </g>
  <g transform="translate(${xBit}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">Bitacora</text>
  </g>

  <!-- BLOQUE 1: LISTADO -->
  <rect x="35" y="150" width="${width - 70}" height="180" class="frame-box" />
  <path d="M 35,170 L 35,150 L 360,150 L 372,170 Z" class="frame-tab" />
  <text x="45" y="164" class="frame-title">alt Flujo 1: Consultar y buscar proveedores con filtros</text>

  <rect x="${xAdmin - 5}" y="175" width="10" height="135" class="act-bar" />
  <rect x="${xUI - 5}" y="175" width="10" height="130" class="act-bar" />
  <rect x="${xCtrl - 5}" y="185" width="10" height="105" class="act-bar" />

  <line x1="${xAdmin + 5}" y1="180" x2="${xUI - 5}" y2="180" class="msg-call" />
  <polygon points="${xUI - 5},180 ${xUI - 11},177 ${xUI - 11},183" fill="#1e293b" />
  <text x="130" y="175" class="call-text">1: consultarProveedores(buscar, estado)</text>

  <line x1="${xUI + 5}" y1="195" x2="${xCtrl - 5}" y2="195" class="msg-call" />
  <polygon points="${xCtrl - 5},195 ${xCtrl - 11},192 ${xCtrl - 11},198" fill="#1e293b" />
  <text x="380" y="190" class="call-text">1.1: index(Request $request)</text>

  <line x1="${xCtrl + 5}" y1="210" x2="${xProv - 5}" y2="210" class="msg-call" />
  <polygon points="${xProv - 5},210 ${xProv - 11},207 ${xProv - 11},213" fill="#1e293b" />
  <text x="730" y="205" class="call-text">1.2: query()->whereLike()->orderBy('razonSocial')->get()</text>

  <line x1="${xProv - 5}" y1="235" x2="${xCtrl + 5}" y2="235" class="msg-ret" />
  <text x="780" y="230" class="ret-text">($proveedores)</text>

  <line x1="${xCtrl - 5}" y1="265" x2="${xUI + 5}" y2="265" class="msg-ret" />
  <text x="420" y="260" class="ret-text">success({proveedores}, 'Proveedores obtenidos exitosamente')</text>

  <line x1="${xUI - 5}" y1="290" x2="${xAdmin + 5}" y2="290" class="msg-ret" />
  <text x="130" y="285" class="ret-text">renderizarTablaProveedores()</text>

  <!-- BLOQUE 2: REGISTRO -->
  <rect x="35" y="350" width="${width - 70}" height="220" class="frame-box" />
  <path d="M 35,370 L 35,350 L 320,350 L 332,370 Z" class="frame-tab" />
  <text x="45" y="364" class="frame-title">alt Flujo 2: Registrar nuevo proveedor</text>

  <rect x="${xAdmin - 5}" y="375" width="10" height="175" class="act-bar" />
  <rect x="${xUI - 5}" y="375" width="10" height="170" class="act-bar" />
  <rect x="${xCtrl - 5}" y="385" width="10" height="145" class="act-bar" />

  <line x1="${xAdmin + 5}" y1="380" x2="${xUI - 5}" y2="380" class="msg-call" />
  <polygon points="${xUI - 5},380 ${xUI - 11},177 ${xUI - 11},383" fill="#1e293b" />
  <text x="130" y="375" class="call-text">2: registrarProveedor(razonSocial, nit, telefono, correo, direccion)</text>

  <line x1="${xUI + 5}" y1="395" x2="${xCtrl - 5}" y2="395" class="msg-call" />
  <polygon points="${xCtrl - 5},395 ${xCtrl - 11},392 ${xCtrl - 11},398" fill="#1e293b" />
  <text x="380" y="390" class="call-text">2.1: store(Request $request)</text>

  <line x1="${xCtrl + 5}" y1="415" x2="${xCtrl + 35}" y2="415" class="msg-call" />
  <line x1="${xCtrl + 35}" y1="415" x2="${xCtrl + 35}" y2="430" class="msg-call" />
  <line x1="${xCtrl + 35}" y1="430" x2="${xCtrl + 5}" y2="430" class="msg-call" />
  <polygon points="${xCtrl + 5},430 ${xCtrl + 11},427 ${xCtrl + 11},433" fill="#1e293b" />
  <text x="${xCtrl + 40}" y="426" class="call-text">validarProveedor() [NIT único, campos requeridos]</text>

  <line x1="${xCtrl + 5}" y1="450" x2="${xProv - 5}" y2="450" class="msg-call" />
  <polygon points="${xProv - 5},450 ${xProv - 11},447 ${xProv - 11},453" fill="#1e293b" />
  <text x="730" y="445" class="call-text">2.2: create([...datos, 'estado' => true])</text>

  <line x1="${xProv - 5}" y1="470" x2="${xCtrl + 5}" y2="470" class="msg-ret" />
  <text x="780" y="465" class="ret-text">($proveedorCreado)</text>

  <line x1="${xCtrl + 5}" y1="490" x2="${xBit - 5}" y2="490" class="msg-call" />
  <polygon points="${xBit - 5},490 ${xBit - 11},487 ${xBit - 11},493" fill="#1e293b" />
  <text x="1100" y="485" class="call-text">2.3: log('CU24', 'CREAR_PROVEEDOR', detalle)</text>

  <line x1="${xCtrl - 5}" y1="520" x2="${xUI + 5}" y2="520" class="msg-ret" />
  <text x="420" y="515" class="ret-text">success({proveedor}, 'Proveedor registrado exitosamente.', 201)</text>

  <!-- BLOQUE 3: ACTUALIZAR Y CAMBIAR ESTADO -->
  <rect x="35" y="590" width="${width - 70}" height="220" class="frame-box" />
  <path d="M 35,610 L 35,590 L 360,590 L 372,610 Z" class="frame-tab" />
  <text x="45" y="604" class="frame-title">alt Flujo 3 y 4: Actualización y cambio de estado (Baja lógica)</text>

  <rect x="${xAdmin - 5}" y="615" width="10" height="175" class="act-bar" />
  <rect x="${xUI - 5}" y="615" width="10" height="170" class="act-bar" />
  <rect x="${xCtrl - 5}" y="625" width="10" height="145" class="act-bar" />

  <line x1="${xAdmin + 5}" y1="620" x2="${xUI - 5}" y2="620" class="msg-call" />
  <polygon points="${xUI - 5},620 ${xUI - 11},617 ${xUI - 11},623" fill="#1e293b" />
  <text x="130" y="615" class="call-text">3: desactivarProveedor(id) / actualizarProveedor(id, datos)</text>

  <line x1="${xUI + 5}" y1="640" x2="${xCtrl - 5}" y2="640" class="msg-call" />
  <polygon points="${xCtrl - 5},640 ${xCtrl - 11},637 ${xCtrl - 11},643" fill="#1e293b" />
  <text x="380" y="635" class="call-text">3.1: desactivar(id) / update(Request $request, id)</text>

  <line x1="${xCtrl + 5}" y1="660" x2="${xProv - 5}" y2="660" class="msg-call" />
  <polygon points="${xProv - 5},660 ${xProv - 11},657 ${xProv - 11},663" fill="#1e293b" />
  <text x="730" y="655" class="call-text">3.2: findOrFail(id)->update(['estado' => false])</text>

  <line x1="${xProv - 5}" y1="680" x2="${xCtrl + 5}" y2="680" class="msg-ret" />
  <text x="780" y="675" class="ret-text">($proveedorActualizado)</text>

  <line x1="${xCtrl + 5}" y1="700" x2="${xBit - 5}" y2="700" class="msg-call" />
  <polygon points="${xBit - 5},700 ${xBit - 11},697 ${xBit - 11},703" fill="#1e293b" />
  <text x="1100" y="695" class="call-text">3.3: log('CU24', 'DESACTIVAR_PROVEEDOR', detalle)</text>

  <line x1="${xCtrl - 5}" y1="730" x2="${xUI + 5}" y2="730" class="msg-ret" />
  <text x="420" y="725" class="ret-text">success({proveedor}, 'Proveedor desactivado exitosamente.')</text>

  <line x1="${xUI - 5}" y1="755" x2="${xAdmin + 5}" y2="755" class="msg-ret" />
  <text x="130" y="750" class="ret-text">actualizarVistaYMostrarAlerta()</text>
</svg>`;
}

module.exports = {
  buildCU24Communication,
  buildCU24ClassAnalysis,
  buildCU24Sequence,
};

