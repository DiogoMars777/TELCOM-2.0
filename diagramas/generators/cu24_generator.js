const { generateWatermarks, boundaryIcon, controlIcon, entityIcon, actorIcon } = require('../diagram_helpers');

// =========================================================================
// CU24 - GESTIONAR PROVEEDORES (Dunston Madariaga - P5)
// Análisis de Clases:
// Actor -> UI_Proveedor -> ProveedorController -> Proveedor (SOLO a Proveedor)
// A partir de Proveedor:
// Proveedor "0..*" -up- "1" Usuario
// Proveedor "1" -right- "0..*" Compra
// Compra "1" -right- "1..*" DetalleCompra
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

  <path d="M 20,45 L 20,24 L ${tabW},24 L ${tabW + 16},45 Z" fill="#ffffff" stroke="#64748b" stroke-width="1" />
  <text x="30" y="38" class="tab-title">sd CU24 Gestionar proveedores</text>

  <rect x="20" y="45" width="${width - 40}" height="${height - 65}" fill="#ffffff" stroke="#64748b" stroke-width="1" />

  <g opacity="0.45">
    ${generateWatermarks(width, height)}
  </g>

  <!-- LÍNEAS DE ENLACE -->
  <line x1="150" y1="360" x2="380" y2="360" class="link-line" />
  <line x1="420" y1="360" x2="730" y2="360" class="link-line" />
  <line x1="770" y1="360" x2="1160" y2="360" class="link-line" />
  <line x1="750" y1="400" x2="750" y2="650" class="link-line" />

  <!-- INSTANCIAS DEL PATRÓN ROBUSTEZ BCE -->
  <g transform="translate(120, 360)">
    ${actorIcon(0, 0)}
    <text x="0" y="45" class="node-title">Administrador / Almacén</text>
  </g>

  <g transform="translate(400, 360)">
    ${boundaryIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">UI_Proveedor</text>
  </g>

  <g transform="translate(750, 360)">
    ${controlIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">ProveedorController</text>
  </g>

  <g transform="translate(1180, 360)">
    ${entityIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">Proveedor</text>
  </g>

  <g transform="translate(750, 680)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Bitacora</text>
  </g>

  <!-- MENSAJES -->
  <g transform="translate(150, 260)">
    <text x="0" y="0" class="flow-1">1: consultarProveedores(buscar, estado) &rarr;</text>
    <text x="0" y="18" class="flow-2">2: registrarProveedor(datos) &rarr;</text>
    <text x="0" y="36" class="flow-3">3: actualizarProveedor(id, datos) &rarr;</text>
    <text x="0" y="54" class="flow-4">4: cambiarEstadoProveedor(id, estado) &rarr;</text>
  </g>

  <g transform="translate(430, 260)">
    <text x="0" y="0" class="flow-1">1.1: index(Request $request) &rarr;</text>
    <text x="0" y="18" class="flow-2">2.1: store(Request $request) &rarr;</text>
    <text x="0" y="36" class="flow-3">3.1: update(Request $request, id) &rarr;</text>
    <text x="0" y="54" class="flow-4">4.1: activar(id) / desactivar(id) &rarr;</text>
  </g>

  <g transform="translate(790, 260)">
    <text x="0" y="0" class="flow-1">1.2: query()-&gt;whereLike()-&gt;orderBy()-&gt;get() &rarr;</text>
    <text x="0" y="18" class="flow-2">2.2: create([...datos, estado: true]) &rarr;</text>
    <text x="0" y="36" class="flow-3">3.2: findOrFail(id)-&gt;update(datos) &rarr;</text>
    <text x="0" y="54" class="flow-4">4.2: findOrFail(id)-&gt;update(['estado' =&gt; bool]) &rarr;</text>
  </g>

  <g transform="translate(765, 520)">
    <text x="0" y="0" class="flow-2">2.3: log('CU24', 'CREAR_PROVEEDOR') &rarr;</text>
    <text x="0" y="20" class="flow-3">3.3: log('CU24', 'ACTUALIZAR_PROVEEDOR') &rarr;</text>
    <text x="0" y="40" class="flow-4">4.3: log('CU24', 'ESTADO_PROVEEDOR') &rarr;</text>
  </g>

  <g transform="translate(50, 810)">
    <rect x="0" y="0" width="1500" height="42" fill="#f8fafc" stroke="#cbd5e1" rx="4" />
    <text x="20" y="26" font-size="11" font-weight="bold" fill="#0f172a">Convención de Flujos:</text>
    <text x="170" y="26" class="flow-1">&bull; Flujo 1: Búsqueda y listado filtrado</text>
    <text x="560" y="26" class="flow-2">&bull; Flujo 2: Registro de proveedor</text>
    <text x="890" y="26" class="flow-3">&bull; Flujo 3: Actualización de datos</text>
    <text x="1190" y="26" class="flow-4">&bull; Flujo 4: Cambio de estado</text>
  </g>
</svg>`;
}

function buildCU24ClassAnalysis() {
  const width = 1100;
  const height = 540;
  const tabW = 480;

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

  <!-- Pestaña de Diagrama EA -->
  <path d="M 10,35 L 10,18 L ${tabW},18 L ${tabW + 14},35 Z" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="18" y="30" class="tab-title">sd Diagrama de análisis de clases - CU24 Gestionar proveedores</text>

  <!-- Marco Exterior -->
  <rect x="10" y="35" width="${width - 20}" height="${height - 45}" fill="#ffffff" stroke="#000000" stroke-width="1" />

  <!-- LÍNEAS DE ASOCIACIÓN -->
  <!-- Actor a UI -->
  <line x1="110" y1="260" x2="160" y2="260" class="link-line" />

  <!-- UI a Controller -->
  <line x1="370" y1="260" x2="430" y2="260" class="link-line" />

  <!-- Controller a Entidad Principal (SOLO A PROVEEDOR, ÚNICO MODELO USADO EN EL CONTROLADOR) -->
  <line x1="670" y1="260" x2="740" y2="260" class="link-line" />

  <!-- 1. ACTOR -->
  <g transform="translate(60, 260)">
    ${actorIcon(0, 0)}
    <text x="0" y="45" class="class-title">Administrador / Almacén</text>
  </g>

  <!-- 2. BOUNDARY: UI_Proveedor -->
  <g transform="translate(160, 175)">
    <rect x="0" y="0" width="210" height="170" class="class-box" />
    <text x="105" y="20" class="class-title">UI_Proveedor</text>
    <line x1="0" y1="28" x2="210" y2="28" class="divider" />
    <text x="10" y="48" class="method-text">+ listarProveedores(): void</text>
    <text x="10" y="70" class="method-text">+ registrarProveedor(): void</text>
    <text x="10" y="92" class="method-text">+ actualizarProveedor(): void</text>
    <text x="10" y="114" class="method-text">+ cambiarEstado(): void</text>
    <line x1="0" y1="124" x2="210" y2="124" class="divider" />
    <text x="10" y="146" class="method-text">+ mostrarDetalle(): void</text>
  </g>

  <!-- 3. CONTROL: ProveedorController -->
  <g transform="translate(430, 170)">
    <rect x="0" y="0" width="240" height="180" class="class-box" />
    <text x="120" y="20" class="class-title">ProveedorController</text>
    <line x1="0" y1="28" x2="240" y2="28" class="divider" />
    <text x="10" y="50" class="method-text">+ index(): void</text>
    <text x="10" y="72" class="method-text">+ show(): void</text>
    <text x="10" y="94" class="method-text">+ store(): void</text>
    <text x="10" y="116" class="method-text">+ update(): void</text>
    <text x="10" y="138" class="method-text">+ activar(): void</text>
    <text x="10" y="160" class="method-text">+ desactivar(): void</text>
  </g>

  <!-- 4. TABLA PRINCIPAL: Proveedor (Única tabla ocupada en el código) -->
  <g transform="translate(740, 160)">
    <rect x="0" y="0" width="230" height="200" class="class-box" />
    <text x="115" y="20" class="class-title">Proveedor</text>
    <line x1="0" y1="28" x2="230" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idProveedor: int</text>
    <text x="10" y="64" class="attr-text">- razonSocial: string</text>
    <text x="10" y="82" class="attr-text">- nit: string</text>
    <text x="10" y="100" class="attr-text">- telefono: string</text>
    <text x="10" y="118" class="attr-text">- correo: string</text>
    <text x="10" y="136" class="attr-text">- direccion: string</text>
    <text x="10" y="154" class="attr-text">- estado: boolean</text>
    <line x1="0" y1="162" x2="230" y2="162" class="divider" />
    <text x="10" y="180" class="method-text">+ create(): void</text>
    <text x="10" y="196" class="method-text">+ update(): void</text>
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

  <path d="M 20,45 L 20,24 L ${tabW},24 L ${tabW + 16},45 Z" fill="#ffffff" stroke="#64748b" stroke-width="1" />
  <text x="30" y="38" class="tab-title">sd CU24 Gestionar proveedores</text>

  <rect x="20" y="45" width="${width - 40}" height="${height - 65}" fill="#ffffff" stroke="#64748b" stroke-width="1" />

  <g opacity="0.4">
    ${generateWatermarks(width, height)}
  </g>

  <!-- LÍNEAS DE VIDA -->
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

  <!-- BLOQUE 1 -->
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
  <text x="420" y="260" class="ret-text">success({proveedores})</text>

  <line x1="${xUI - 5}" y1="290" x2="${xAdmin + 5}" y2="290" class="msg-ret" />
  <text x="130" y="285" class="ret-text">renderizarTablaProveedores()</text>

  <!-- BLOQUE 2 -->
  <rect x="35" y="350" width="${width - 70}" height="220" class="frame-box" />
  <path d="M 35,370 L 35,350 L 320,350 L 332,370 Z" class="frame-tab" />
  <text x="45" y="364" class="frame-title">alt Flujo 2: Registrar nuevo proveedor</text>

  <rect x="${xAdmin - 5}" y="375" width="10" height="175" class="act-bar" />
  <rect x="${xUI - 5}" y="375" width="10" height="170" class="act-bar" />
  <rect x="${xCtrl - 5}" y="385" width="10" height="145" class="act-bar" />

  <line x1="${xAdmin + 5}" y1="380" x2="${xUI - 5}" y2="380" class="msg-call" />
  <polygon points="${xUI - 5},380 ${xUI - 11},177 ${xUI - 11},383" fill="#1e293b" />
  <text x="130" y="375" class="call-text">2: registrarProveedor(razonSocial, nit, telefono)</text>

  <line x1="${xUI + 5}" y1="395" x2="${xCtrl - 5}" y2="395" class="msg-call" />
  <polygon points="${xCtrl - 5},395 ${xCtrl - 11},392 ${xCtrl - 11},398" fill="#1e293b" />
  <text x="380" y="390" class="call-text">2.1: store(Request $request)</text>

  <line x1="${xCtrl + 5}" y1="415" x2="${xCtrl + 35}" y2="415" class="msg-call" />
  <line x1="${xCtrl + 35}" y1="415" x2="${xCtrl + 35}" y2="430" class="msg-call" />
  <line x1="${xCtrl + 35}" y1="430" x2="${xCtrl + 5}" y2="430" class="msg-call" />
  <polygon points="${xCtrl + 5},430 ${xCtrl + 11},427 ${xCtrl + 11},433" fill="#1e293b" />
  <text x="${xCtrl + 40}" y="426" class="call-text">validarProveedor()</text>

  <line x1="${xCtrl + 5}" y1="450" x2="${xProv - 5}" y2="450" class="msg-call" />
  <polygon points="${xProv - 5},450 ${xProv - 11},447 ${xProv - 11},453" fill="#1e293b" />
  <text x="730" y="445" class="call-text">2.2: create([...datos, 'estado' => true])</text>

  <line x1="${xProv - 5}" y1="470" x2="${xCtrl + 5}" y2="470" class="msg-ret" />
  <text x="780" y="465" class="ret-text">($proveedorCreado)</text>

  <line x1="${xCtrl + 5}" y1="490" x2="${xBit - 5}" y2="490" class="msg-call" />
  <polygon points="${xBit - 5},490 ${xBit - 11},487 ${xBit - 11},493" fill="#1e293b" />
  <text x="1100" y="485" class="call-text">2.3: log('CU24', 'CREAR_PROVEEDOR')</text>

  <line x1="${xCtrl - 5}" y1="520" x2="${xUI + 5}" y2="520" class="msg-ret" />
  <text x="420" y="515" class="ret-text">success({proveedor}, 201)</text>

  <!-- BLOQUE 3 -->
  <rect x="35" y="590" width="${width - 70}" height="220" class="frame-box" />
  <path d="M 35,610 L 35,590 L 360,590 L 372,610 Z" class="frame-tab" />
  <text x="45" y="604" class="frame-title">alt Flujo 3: Desactivar proveedor (Baja lógica)</text>

  <rect x="${xAdmin - 5}" y="615" width="10" height="175" class="act-bar" />
  <rect x="${xUI - 5}" y="615" width="10" height="170" class="act-bar" />
  <rect x="${xCtrl - 5}" y="625" width="10" height="145" class="act-bar" />

  <line x1="${xAdmin + 5}" y1="620" x2="${xUI - 5}" y2="620" class="msg-call" />
  <polygon points="${xUI - 5},620 ${xUI - 11},617 ${xUI - 11},623" fill="#1e293b" />
  <text x="130" y="615" class="call-text">3: desactivarProveedor(id)</text>

  <line x1="${xUI + 5}" y1="640" x2="${xCtrl - 5}" y2="640" class="msg-call" />
  <polygon points="${xCtrl - 5},640 ${xCtrl - 11},637 ${xCtrl - 11},643" fill="#1e293b" />
  <text x="380" y="635" class="call-text">3.1: desactivar(id)</text>

  <line x1="${xCtrl + 5}" y1="660" x2="${xProv - 5}" y2="660" class="msg-call" />
  <polygon points="${xProv - 5},660 ${xProv - 11},657 ${xProv - 11},663" fill="#1e293b" />
  <text x="730" y="655" class="call-text">3.2: findOrFail(id)->update(['estado' => false])</text>

  <line x1="${xProv - 5}" y1="680" x2="${xCtrl + 5}" y2="680" class="msg-ret" />
  <text x="780" y="675" class="ret-text">($proveedorActualizado)</text>

  <line x1="${xCtrl + 5}" y1="700" x2="${xBit - 5}" y2="700" class="msg-call" />
  <polygon points="${xBit - 5},700 ${xBit - 11},697 ${xBit - 11},703" fill="#1e293b" />
  <text x="1100" y="695" class="call-text">3.3: log('CU24', 'DESACTIVAR_PROVEEDOR')</text>

  <line x1="${xCtrl - 5}" y1="730" x2="${xUI + 5}" y2="730" class="msg-ret" />
  <text x="420" y="725" class="ret-text">success({proveedor}, 'Proveedor desactivado')</text>

  <line x1="${xUI - 5}" y1="755" x2="${xAdmin + 5}" y2="755" class="msg-ret" />
  <text x="130" y="750" class="ret-text">actualizarVista()</text>
</svg>`;
}

module.exports = {
  buildCU24Communication,
  buildCU24ClassAnalysis,
  buildCU24Sequence,
};
