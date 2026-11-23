const { generateWatermarks, boundaryIcon, controlIcon, entityIcon, actorIcon } = require('../diagram_helpers');

// =========================================================================
// CU25 - REGISTRAR COMPRA DE EQUIPOS Y ACTUALIZACIÓN DE STOCK (Annett Cruz - P5)
// Análisis de Clases:
// Actor -> UI_CompraRegistro -> CompraEquipoRegistroController -> Compra (SOLO A COMPRA)
// A partir de Compra:
// Compra "0..*" -up- "1" Proveedor
// Compra "0..*" -down- "1" EstadoCompra
// Compra "1" -right- "1..*" DetalleCompra
// DetalleCompra "0..*" -right- "1" Inventario
// Inventario "1" -down- "1" ProductoEquipo
// =========================================================================

function buildCU25Communication() {
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
      .flow-4 { fill: #1d4ed8; font-size: 10.5px; font-weight: bold; }
    </style>
  </defs>

  <path d="M 20,45 L 20,24 L ${tabW},24 L ${tabW + 16},45 Z" fill="#ffffff" stroke="#64748b" stroke-width="1" />
  <text x="30" y="38" class="tab-title">sd CU25 Registrar compra de equipos y actualización de stock</text>

  <rect x="20" y="45" width="${width - 40}" height="${height - 65}" fill="#ffffff" stroke="#64748b" stroke-width="1" />

  <g opacity="0.45">
    ${generateWatermarks(width, height)}
  </g>

  <!-- LÍNEAS DE ENLACE -->
  <line x1="150" y1="420" x2="380" y2="420" class="link-line" />
  <line x1="420" y1="420" x2="700" y2="420" class="link-line" />
  <line x1="750" y1="420" x2="1080" y2="420" class="link-line" />
  <line x1="710" y1="380" x2="520" y2="180" class="link-line" />
  <line x1="740" y1="380" x2="940" y2="180" class="link-line" />
  <line x1="710" y1="450" x2="540" y2="680" class="link-line" />
  <line x1="730" y1="460" x2="730" y2="680" class="link-line" />

  <!-- INSTANCIAS -->
  <g transform="translate(120, 420)">
    ${actorIcon(0, 0)}
    <text x="0" y="45" class="node-title">Administrador / Almacén</text>
  </g>

  <g transform="translate(400, 420)">
    ${boundaryIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">UI_CompraRegistro</text>
  </g>

  <g transform="translate(730, 420)">
    ${controlIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">CompraEquipoRegistroController</text>
  </g>

  <g transform="translate(1110, 420)">
    ${entityIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">Compra</text>
  </g>

  <g transform="translate(500, 160)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Proveedor</text>
  </g>

  <g transform="translate(960, 160)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">ProductoEquipo</text>
  </g>

  <g transform="translate(520, 710)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">DetalleCompra</text>
  </g>

  <g transform="translate(730, 710)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Inventario</text>
  </g>

  <!-- MENSAJES -->
  <g transform="translate(140, 320)">
    <text x="0" y="0" class="flow-1">1: consultarCompras(filtros) &rarr;</text>
    <text x="0" y="18" class="flow-2">2: cargarFormularioCompra() &rarr;</text>
    <text x="0" y="36" class="flow-3">3: registrarOrdenCompra(cabecera, items) &rarr;</text>
    <text x="0" y="54" class="flow-4">4: verDetalleCompra(id) &rarr;</text>
  </g>

  <g transform="translate(420, 320)">
    <text x="0" y="0" class="flow-1">1.1: index(Request $request) &rarr;</text>
    <text x="0" y="18" class="flow-2">2.1: proveedores(), productos() &rarr;</text>
    <text x="0" y="36" class="flow-3">3.1: store(Request $request) &rarr;</text>
    <text x="0" y="54" class="flow-4">4.1: show(int $id) &rarr;</text>
  </g>

  <g transform="translate(470, 250)">
    <text x="0" y="0" class="flow-2">2.2: where('estado', true)->get() &rarr;</text>
  </g>

  <g transform="translate(860, 250)">
    <text x="0" y="0" class="flow-2">2.3: with('inventarios')->get() &rarr;</text>
  </g>

  <g transform="translate(770, 345)">
    <text x="0" y="0" class="flow-1">1.2: with(['proveedor','detalles'])->get() &rarr;</text>
    <text x="0" y="18" class="flow-3">3.3: DB::transaction() { Compra::create() } &rarr;</text>
    <text x="0" y="36" class="flow-3">3.7: update(['montoTotal' => $total]) &rarr;</text>
  </g>

  <g transform="translate(400, 580)">
    <text x="0" y="0" class="flow-3">3.4: create([idCompra, idProducto, cant, pUnit]) &rarr;</text>
  </g>

  <g transform="translate(740, 580)">
    <text x="0" y="0" class="flow-3">3.5: increment('stockActual', cant) &rarr;</text>
  </g>

  <g transform="translate(50, 870)">
    <rect x="0" y="0" width="1580" height="42" fill="#f8fafc" stroke="#cbd5e1" rx="4" />
    <text x="20" y="26" font-size="11" font-weight="bold" fill="#0f172a">Convención de Flujos:</text>
    <text x="170" y="26" class="flow-1">&bull; Flujo 1: Consulta y filtrado</text>
    <text x="440" y="26" class="flow-2">&bull; Flujo 2: Catálogo de proveedores y productos</text>
    <text x="910" y="26" class="flow-3">&bull; Flujo 3: Registro atómico con DB::transaction</text>
  </g>
</svg>`;
}

function buildCU25ClassAnalysis() {
  const width = 1750;
  const height = 750;
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
  <text x="18" y="30" class="tab-title">sd Diagrama de análisis de clases - CU25 Registrar compra de equipo y actualizar stock</text>

  <rect x="10" y="35" width="${width - 20}" height="${height - 45}" fill="#ffffff" stroke="#000000" stroke-width="1" />

  <!-- LÍNEAS DE ASOCIACIÓN -->
  <!-- Actor a UI -->
  <line x1="110" y1="360" x2="160" y2="360" class="link-line" />

  <!-- UI a Controller -->
  <line x1="380" y1="360" x2="440" y2="360" class="link-line" />

  <!-- Controller a Entidad Principal (SOLO A COMPRA!) -->
  <line x1="720" y1="360" x2="780" y2="360" class="link-line" />

  <!-- Compra a Proveedor (Arriba) -->
  <line x1="885" y1="260" x2="885" y2="170" class="link-line" />
  <text x="895" y="245" class="mult-text">0..*</text>
  <text x="895" y="185" class="mult-text">1</text>

  <!-- Compra a EstadoCompra (Abajo) -->
  <line x1="885" y1="460" x2="885" y2="550" class="link-line" />
  <text x="895" y="480" class="mult-text">0..*</text>
  <text x="895" y="535" class="mult-text">1</text>

  <!-- Compra a DetalleCompra (Derecha) -->
  <line x1="990" y1="360" x2="1070" y2="360" class="link-line" />
  <text x="1005" y="350" class="mult-text">1</text>
  <text x="1050" y="350" class="mult-text">1..*</text>

  <!-- DetalleCompra a Inventario (Derecha) -->
  <line x1="1280" y1="360" x2="1360" y2="360" class="link-line" />
  <text x="1295" y="350" class="mult-text">0..*</text>
  <text x="1340" y="350" class="mult-text">1</text>

  <!-- Inventario a ProductoEquipo (Abajo) -->
  <line x1="1465" y1="450" x2="1465" y2="540" class="link-line" />
  <text x="1475" y="475" class="mult-text">1</text>
  <text x="1475" y="525" class="mult-text">1</text>

  <!-- 1. ACTOR -->
  <g transform="translate(60, 360)">
    ${actorIcon(0, 0)}
    <text x="0" y="45" class="class-title">Administrador / Almacén</text>
  </g>

  <!-- 2. BOUNDARY -->
  <g transform="translate(160, 275)">
    <rect x="0" y="0" width="220" height="170" class="class-box" />
    <text x="110" y="20" class="class-title">UI_CompraRegistro</text>
    <line x1="0" y1="28" x2="220" y2="28" class="divider" />
    <text x="10" y="48" class="method-text">+ listarCompras(): void</text>
    <text x="10" y="70" class="method-text">+ abrirModalRegistro(): void</text>
    <text x="10" y="92" class="method-text">+ agregarItemDetalle(): void</text>
    <text x="10" y="114" class="method-text">+ registrarCompraEquipo(): void</text>
    <line x1="0" y1="124" x2="220" y2="124" class="divider" />
    <text x="10" y="146" class="method-text">+ verDetalleCompra(): void</text>
  </g>

  <!-- 3. CONTROL -->
  <g transform="translate(440, 265)">
    <rect x="0" y="0" width="280" height="190" class="class-box" />
    <text x="140" y="20" class="class-title">CompraEquipoRegistroController</text>
    <line x1="0" y1="28" x2="280" y2="28" class="divider" />
    <text x="10" y="48" class="method-text">+ index(): void</text>
    <text x="10" y="70" class="method-text">+ show(): void</text>
    <text x="10" y="92" class="method-text">+ proveedores(): void</text>
    <text x="10" y="114" class="method-text">+ productos(): void</text>
    <text x="10" y="136" class="method-text">+ estados(): void</text>
    <text x="10" y="158" class="method-text">+ store(): void</text>
  </g>

  <!-- 4. TABLA PRINCIPAL: Compra -->
  <g transform="translate(780, 260)">
    <rect x="0" y="0" width="210" height="200" class="class-box" />
    <text x="105" y="20" class="class-title">Compra</text>
    <line x1="0" y1="28" x2="210" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idCompra: int</text>
    <text x="10" y="64" class="attr-text">- nroComprobante: string</text>
    <text x="10" y="82" class="attr-text">- fechaCompra: date</text>
    <text x="10" y="100" class="attr-text">- montoTotal: decimal</text>
    <text x="10" y="118" class="attr-text">- observacion: string</text>
    <text x="10" y="136" class="attr-text">- idProveedor: int</text>
    <text x="10" y="154" class="attr-text">- idEstadoCompra: int</text>
    <line x1="0" y1="162" x2="210" y2="162" class="divider" />
    <text x="10" y="180" class="method-text">+ create(): void</text>
    <text x="10" y="196" class="method-text">+ update(): void</text>
  </g>

  <!-- 5. ENTIDAD: Proveedor (Arriba) -->
  <g transform="translate(780, 50)">
    <rect x="0" y="0" width="210" height="120" class="class-box" />
    <text x="105" y="20" class="class-title">Proveedor</text>
    <line x1="0" y1="28" x2="210" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idProveedor: int</text>
    <text x="10" y="64" class="attr-text">- razonSocial: string</text>
    <text x="10" y="82" class="attr-text">- nit: string</text>
    <line x1="0" y1="90" x2="210" y2="90" class="divider" />
    <text x="10" y="108" class="method-text">+ where(): void</text>
  </g>

  <!-- 6. ENTIDAD: EstadoCompra (Abajo) -->
  <g transform="translate(780, 550)">
    <rect x="0" y="0" width="210" height="120" class="class-box" />
    <text x="105" y="20" class="class-title">EstadoCompra</text>
    <line x1="0" y1="28" x2="210" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idEstadoCompra: int</text>
    <text x="10" y="64" class="attr-text">- nombreEstado: string</text>
    <text x="10" y="82" class="attr-text">- descripcion: string</text>
    <line x1="0" y1="90" x2="210" y2="90" class="divider" />
    <text x="10" y="108" class="method-text">+ all(): void</text>
  </g>

  <!-- 7. ENTIDAD: DetalleCompra (Derecha) -->
  <g transform="translate(1070, 275)">
    <rect x="0" y="0" width="210" height="170" class="class-box" />
    <text x="105" y="20" class="class-title">DetalleCompra</text>
    <line x1="0" y1="28" x2="210" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idDetalleCompra: int</text>
    <text x="10" y="64" class="attr-text">- cantidad: int</text>
    <text x="10" y="82" class="attr-text">- precioUnitario: decimal</text>
    <text x="10" y="100" class="attr-text">- subtotal: decimal</text>
    <text x="10" y="118" class="attr-text">- idCompra: int</text>
    <line x1="0" y1="126" x2="210" y2="126" class="divider" />
    <text x="10" y="146" class="method-text">+ create(): void</text>
  </g>

  <!-- 8. ENTIDAD: Inventario (Derecha de DetalleCompra) -->
  <g transform="translate(1360, 280)">
    <rect x="0" y="0" width="210" height="170" class="class-box" />
    <text x="105" y="20" class="class-title">Inventario</text>
    <line x1="0" y1="28" x2="210" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idInventario: int</text>
    <text x="10" y="64" class="attr-text">- stockActual: int</text>
    <text x="10" y="82" class="attr-text">- idProducto: int</text>
    <line x1="0" y1="90" x2="210" y2="90" class="divider" />
    <text x="10" y="112" class="method-text">+ find(): void</text>
    <text x="10" y="132" class="method-text">+ save(): void</text>
  </g>

  <!-- 9. ENTIDAD: ProductoEquipo (Abajo de Inventario) -->
  <g transform="translate(1360, 540)">
    <rect x="0" y="0" width="210" height="150" class="class-box" />
    <text x="105" y="20" class="class-title">ProductoEquipo</text>
    <line x1="0" y1="28" x2="210" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idProducto: int</text>
    <text x="10" y="64" class="attr-text">- nombre: string</text>
    <text x="10" y="82" class="attr-text">- marca: string</text>
    <text x="10" y="100" class="attr-text">- modelo: string</text>
    <line x1="0" y1="108" x2="210" y2="108" class="divider" />
    <text x="10" y="128" class="method-text">+ all(): void</text>
  </g>
</svg>`;
}

function buildCU25Sequence() {
  const width = 1680;
  const height = 1180;
  const tabW = 460;

  const xAdmin = 90;
  const xUI = 320;
  const xCtrl = 600;
  const xProv = 860;
  const xComp = 1080;
  const xDet = 1280;
  const xInv = 1480;

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
  <text x="30" y="38" class="tab-title">sd CU25 Registrar compra de equipos y actualización de stock</text>

  <rect x="20" y="45" width="${width - 40}" height="${height - 65}" fill="#ffffff" stroke="#64748b" stroke-width="1" />

  <g opacity="0.4">
    ${generateWatermarks(width, height)}
  </g>

  <!-- LÍNEAS DE VIDA -->
  <line x1="${xAdmin}" y1="130" x2="${xAdmin}" y2="${height - 50}" class="life-line" />
  <line x1="${xUI}" y1="130" x2="${xUI}" y2="${height - 50}" class="life-line" />
  <line x1="${xCtrl}" y1="130" x2="${xCtrl}" y2="${height - 50}" class="life-line" />
  <line x1="${xProv}" y1="130" x2="${xProv}" y2="${height - 50}" class="life-line" />
  <line x1="${xComp}" y1="130" x2="${xComp}" y2="${height - 50}" class="life-line" />
  <line x1="${xDet}" y1="130" x2="${xDet}" y2="${height - 50}" class="life-line" />
  <line x1="${xInv}" y1="130" x2="${xInv}" y2="${height - 50}" class="life-line" />

  <!-- CABECERAS -->
  <g transform="translate(${xAdmin}, 90)">
    ${actorIcon(0, 0)}
    <text x="0" y="40" class="life-title">Administrador</text>
  </g>
  <g transform="translate(${xUI}, 90)">
    ${boundaryIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">UI_CompraRegistro</text>
  </g>
  <g transform="translate(${xCtrl}, 90)">
    ${controlIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">CompraEquipoRegistroController</text>
  </g>
  <g transform="translate(${xProv}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">Proveedor</text>
  </g>
  <g transform="translate(${xComp}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">Compra</text>
  </g>
  <g transform="translate(${xDet}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">DetalleCompra</text>
  </g>
  <g transform="translate(${xInv}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">Inventario</text>
  </g>

  <!-- BLOQUE 1 -->
  <rect x="35" y="150" width="${width - 70}" height="190" class="frame-box" />
  <path d="M 35,170 L 35,150 L 360,150 L 372,170 Z" class="frame-tab" />
  <text x="45" y="164" class="frame-title">alt Flujo 1: Cargar proveedores y catálogo de equipos</text>

  <rect x="${xAdmin - 5}" y="175" width="10" height="140" class="act-bar" />
  <rect x="${xUI - 5}" y="175" width="10" height="135" class="act-bar" />
  <rect x="${xCtrl - 5}" y="185" width="10" height="110" class="act-bar" />

  <line x1="${xAdmin + 5}" y1="180" x2="${xUI - 5}" y2="180" class="msg-call" />
  <polygon points="${xUI - 5},180 ${xUI - 11},177 ${xUI - 11},183" fill="#1e293b" />
  <text x="130" y="175" class="call-text">1: abrirFormularioCompra()</text>

  <line x1="${xUI + 5}" y1="195" x2="${xCtrl - 5}" y2="195" class="msg-call" />
  <polygon points="${xCtrl - 5},195 ${xCtrl - 11},192 ${xCtrl - 11},198" fill="#1e293b" />
  <text x="360" y="190" class="call-text">1.1: proveedores(), productos()</text>

  <line x1="${xCtrl + 5}" y1="215" x2="${xProv - 5}" y2="215" class="msg-call" />
  <polygon points="${xProv - 5},215 ${xProv - 11},212 ${xProv - 11},218" fill="#1e293b" />
  <text x="640" y="210" class="call-text">1.2: Proveedor::where('estado', true)->get()</text>

  <line x1="${xProv - 5}" y1="240" x2="${xCtrl + 5}" y2="240" class="msg-ret" />
  <text x="670" y="235" class="ret-text">($proveedoresActivos)</text>

  <line x1="${xCtrl - 5}" y1="265" x2="${xUI + 5}" y2="265" class="msg-ret" />
  <text x="390" y="260" class="ret-text">success({proveedores, productos})</text>

  <line x1="${xUI - 5}" y1="290" x2="${xAdmin + 5}" y2="290" class="msg-ret" />
  <text x="130" y="285" class="ret-text">renderizarFormularioConSelectores()</text>

  <!-- BLOQUE 2 -->
  <rect x="35" y="360" width="${width - 70}" height="420" class="frame-box" />
  <path d="M 35,380 L 35,360 L 400,360 L 412,380 Z" class="frame-tab" />
  <text x="45" y="374" class="frame-title">alt Flujo 2: Registrar compra y actualizar stock (Transacción DB)</text>

  <rect x="${xAdmin - 5}" y="385" width="10" height="375" class="act-bar" />
  <rect x="${xUI - 5}" y="385" width="10" height="370" class="act-bar" />
  <rect x="${xCtrl - 5}" y="395" width="10" height="345" class="act-bar" />

  <line x1="${xAdmin + 5}" y1="390" x2="${xUI - 5}" y2="390" class="msg-call" />
  <polygon points="${xUI - 5},390 ${xUI - 11},387 ${xUI - 11},393" fill="#1e293b" />
  <text x="130" y="385" class="call-text">2: submitCompra(idProveedor, nroComprobante, items)</text>

  <line x1="${xUI + 5}" y1="410" x2="${xCtrl - 5}" y2="410" class="msg-call" />
  <polygon points="${xCtrl - 5},410 ${xCtrl - 11},407 ${xCtrl - 11},413" fill="#1e293b" />
  <text x="360" y="405" class="call-text">2.1: store(Request $request)</text>

  <line x1="${xCtrl + 5}" y1="430" x2="${xCtrl + 35}" y2="430" class="msg-call" />
  <line x1="${xCtrl + 35}" y1="430" x2="${xCtrl + 35}" y2="445" class="msg-call" />
  <line x1="${xCtrl + 35}" y1="445" x2="${xCtrl + 5}" y2="445" class="msg-call" />
  <polygon points="${xCtrl + 5},445 ${xCtrl + 11},442 ${xCtrl + 11},448" fill="#1e293b" />
  <text x="${xCtrl + 40}" y="440" class="call-text">DB::beginTransaction() & validate()</text>

  <line x1="${xCtrl + 5}" y1="470" x2="${xComp - 5}" y2="470" class="msg-call" />
  <polygon points="${xComp - 5},470 ${xComp - 11},467 ${xComp - 11},473" fill="#1e293b" />
  <text x="690" y="465" class="call-text">2.2: create([nroComprobante, fecha, idProveedor, montoTotal: 0])</text>

  <line x1="${xComp - 5}" y1="490" x2="${xCtrl + 5}" y2="490" class="msg-ret" />
  <text x="730" y="485" class="ret-text">($compraId)</text>

  <line x1="${xCtrl + 5}" y1="520" x2="${xDet - 5}" y2="520" class="msg-call" />
  <polygon points="${xDet - 5},520 ${xDet - 11},517 ${xDet - 11},523" fill="#1e293b" />
  <text x="790" y="515" class="call-text">2.3: foreach items: DetalleCompra::create([idCompra, idProducto, cant, pUnit])</text>

  <line x1="${xDet - 5}" y1="545" x2="${xCtrl + 5}" y2="545" class="msg-ret" />
  <text x="960" y="540" class="ret-text">($detalleInsertado)</text>

  <line x1="${xCtrl + 5}" y1="570" x2="${xInv - 5}" y2="570" class="msg-call" />
  <polygon points="${xInv - 5},570 ${xInv - 11},567 ${xInv - 11},573" fill="#1e293b" />
  <text x="960" y="565" class="call-text">2.4: Inventario::where('idProducto', $idProd)->increment('stockActual', $cant)</text>

  <line x1="${xInv - 5}" y1="595" x2="${xCtrl + 5}" y2="595" class="msg-ret" />
  <text x="1120" y="590" class="ret-text">(nuevoStockConfirmado)</text>

  <line x1="${xCtrl + 5}" y1="625" x2="${xComp - 5}" y2="625" class="msg-call" />
  <polygon points="${xComp - 5},625 ${xComp - 11},622 ${xComp - 11},628" fill="#1e293b" />
  <text x="690" y="620" class="call-text">2.5: Compra::where('idCompra', $id)->update(['montoTotal' => $sumTotal])</text>

  <line x1="${xCtrl + 5}" y1="655" x2="${xCtrl + 35}" y2="655" class="msg-call" />
  <line x1="${xCtrl + 35}" y1="655" x2="${xCtrl + 35}" y2="670" class="msg-call" />
  <line x1="${xCtrl + 35}" y1="670" x2="${xCtrl + 5}" y2="670" class="msg-call" />
  <polygon points="${xCtrl + 5},670 ${xCtrl - 11},667 ${xCtrl - 11},673" fill="#1e293b" />
  <text x="${xCtrl + 40}" y="665" class="call-text">DB::commit()</text>

  <line x1="${xCtrl - 5}" y1="700" x2="${xUI + 5}" y2="700" class="msg-ret" />
  <text x="390" y="695" class="ret-text">success({compra: $compraFresh}, 'Compra registrada y stock actualizado')</text>

  <line x1="${xUI - 5}" y1="730" x2="${xAdmin + 5}" y2="730" class="msg-ret" />
  <text x="130" y="725" class="ret-text">notificarExitoYActualizarTabla()</text>
</svg>`;
}

module.exports = {
  buildCU25Communication,
  buildCU25ClassAnalysis,
  buildCU25Sequence,
};
