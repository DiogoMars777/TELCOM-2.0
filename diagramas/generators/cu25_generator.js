const { generateWatermarks, boundaryIcon, controlIcon, entityIcon, actorIcon } = require('../diagram_helpers');

// =========================================================================
// CU25 - REGISTRAR COMPRA DE EQUIPOS Y ACTUALIZACIÓN DE STOCK (Annett Cruz - P5)
// Controller: CompraEquipoRegistroController (index, show, proveedores, productos, store)
// Boundary: UI_CompraRegistro
// Entities: Compra, DetalleCompra, Proveedor, ProductoEquipo, Inventario, Bitacora
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

  <!-- Pestaña de Diagrama EA -->
  <path d="M 20,45 L 20,24 L ${tabW},24 L ${tabW + 16},45 Z" fill="#ffffff" stroke="#64748b" stroke-width="1" />
  <text x="30" y="38" class="tab-title">sd CU25 Registrar compra de equipos y actualización de stock</text>

  <!-- Marco Exterior -->
  <rect x="20" y="45" width="${width - 40}" height="${height - 65}" fill="#ffffff" stroke="#64748b" stroke-width="1" />

  <!-- Marcas de agua -->
  <g opacity="0.45">
    ${generateWatermarks(width, height)}
  </g>

  <!-- LÍNEAS DE ENLACE -->
  <!-- Actor -> Boundary -->
  <line x1="150" y1="420" x2="380" y2="420" class="link-line" />

  <!-- Boundary -> Controller -->
  <line x1="420" y1="420" x2="700" y2="420" class="link-line" />

  <!-- Controller -> Compra (Derecha) -->
  <line x1="750" y1="420" x2="1080" y2="420" class="link-line" />

  <!-- Controller -> Proveedor (Arriba Izquierda) -->
  <line x1="710" y1="380" x2="520" y2="180" class="link-line" />

  <!-- Controller -> ProductoEquipo (Arriba Derecha) -->
  <line x1="740" y1="380" x2="940" y2="180" class="link-line" />

  <!-- Controller -> DetalleCompra (Abajo Izquierda) -->
  <line x1="710" y1="450" x2="540" y2="680" class="link-line" />

  <!-- Controller -> Inventario (Abajo Centro) -->
  <line x1="730" y1="460" x2="730" y2="680" class="link-line" />

  <!-- Controller -> Bitacora (Abajo Derecha) -->
  <line x1="760" y1="450" x2="980" y2="680" class="link-line" />

  <!-- Compra -> DetalleCompra -->
  <line x1="1100" y1="450" x2="560" y2="700" class="link-line" />

  <!-- INSTANCIAS DEL PATRÓN ROBUSTEZ BCE -->
  <!-- 1. Actor -->
  <g transform="translate(120, 420)">
    ${actorIcon(0, 0)}
    <text x="0" y="45" class="node-title">Administrador / Almacén</text>
  </g>

  <!-- 2. Boundary: UI_CompraRegistro -->
  <g transform="translate(400, 420)">
    ${boundaryIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">UI_CompraRegistro</text>
  </g>

  <!-- 3. Control: CompraEquipoRegistroController -->
  <g transform="translate(730, 420)">
    ${controlIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">CompraEquipoRegistroController</text>
  </g>

  <!-- 4. Entity: Compra -->
  <g transform="translate(1110, 420)">
    ${entityIcon(0, 0, 24)}
    <text x="0" y="48" class="node-title">Compra</text>
  </g>

  <!-- 5. Entity: Proveedor -->
  <g transform="translate(500, 160)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Proveedor</text>
  </g>

  <!-- 6. Entity: ProductoEquipo -->
  <g transform="translate(960, 160)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">ProductoEquipo</text>
  </g>

  <!-- 7. Entity: DetalleCompra -->
  <g transform="translate(520, 710)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">DetalleCompra</text>
  </g>

  <!-- 8. Entity: Inventario -->
  <g transform="translate(730, 710)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Inventario</text>
  </g>

  <!-- 9. Entity: Bitacora -->
  <g transform="translate(1000, 710)">
    ${entityIcon(0, 0, 22)}
    <text x="0" y="44" class="node-title">Bitacora</text>
  </g>

  <!-- MENSAJES Y LLAMADAS -->
  <!-- Actor a UI -->
  <g transform="translate(140, 320)">
    <text x="0" y="0" class="flow-1">1: consultarCompras(filtros) &rarr;</text>
    <text x="0" y="18" class="flow-2">2: cargarFormularioCompra() &rarr;</text>
    <text x="0" y="36" class="flow-3">3: registrarOrdenCompra(cabecera, items) &rarr;</text>
    <text x="0" y="54" class="flow-4">4: verDetalleCompra(id) &rarr;</text>
  </g>

  <!-- UI a Controller -->
  <g transform="translate(420, 320)">
    <text x="0" y="0" class="flow-1">1.1: index(Request $request) &rarr;</text>
    <text x="0" y="18" class="flow-2">2.1: proveedores(), productos() &rarr;</text>
    <text x="0" y="36" class="flow-3">3.1: store(Request $request) &rarr;</text>
    <text x="0" y="54" class="flow-4">4.1: show(int $id) &rarr;</text>
  </g>

  <!-- Controller a Proveedor -->
  <g transform="translate(470, 250)">
    <text x="0" y="0" class="flow-2">2.2: where('estado', true)->get() &rarr;</text>
    <text x="0" y="16" class="flow-3">3.2: exists:Proveedor,idProveedor &rarr;</text>
  </g>

  <!-- Controller a ProductoEquipo -->
  <g transform="translate(860, 250)">
    <text x="0" y="0" class="flow-2">2.3: with('inventarios')->get() &rarr;</text>
  </g>

  <!-- Controller a Compra -->
  <g transform="translate(770, 345)">
    <text x="0" y="0" class="flow-1">1.2: with(['proveedor','detalles'])->get() &rarr;</text>
    <text x="0" y="18" class="flow-3">3.3: DB::transaction() { Compra::create() } &rarr;</text>
    <text x="0" y="36" class="flow-3">3.7: update(['montoTotal' => $total]) &rarr;</text>
    <text x="0" y="54" class="flow-4">4.2: find($id) con relaciones &rarr;</text>
  </g>

  <!-- Controller a DetalleCompra -->
  <g transform="translate(400, 580)">
    <text x="0" y="0" class="flow-3">3.4: create([idCompra, idProducto, cant, pUnit]) &rarr;</text>
  </g>

  <!-- Controller a Inventario -->
  <g transform="translate(740, 580)">
    <text x="0" y="0" class="flow-3">3.5: increment('stockActual', cant) &rarr;</text>
    <text x="0" y="18" class="flow-3">3.6: syncEstadoDisponibilidad() &rarr;</text>
  </g>

  <!-- Controller a Bitacora -->
  <g transform="translate(880, 580)">
    <text x="0" y="0" class="flow-3">3.8: log('CU25', 'REGISTRAR_COMPRA', detalle) &rarr;</text>
  </g>

  <!-- LEYENDA INFERIOR -->
  <g transform="translate(50, 870)">
    <rect x="0" y="0" width="1580" height="42" fill="#f8fafc" stroke="#cbd5e1" rx="4" />
    <text x="20" y="26" font-size="11" font-weight="bold" fill="#0f172a">Convención de Flujos:</text>
    <text x="170" y="26" class="flow-1">&bull; Flujo 1: Consulta y filtrado de compras</text>
    <text x="460" y="26" class="flow-2">&bull; Flujo 2: Precarga de proveedores activos y catálogo de productos</text>
    <text x="960" y="26" class="flow-3">&bull; Flujo 3: Registro atómico con DB::transaction, detalle e incremento de stock</text>
    <text x="1440" y="26" class="flow-4">&bull; Flujo 4: Consulta detallada</text>
  </g>
</svg>`;
}

function buildCU25ClassAnalysis() {
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
  <text x="30" y="38" class="tab-title">class CU25 Registrar compra de equipos y actualización de stock</text>

  <rect x="20" y="45" width="${width - 40}" height="${height - 65}" fill="#ffffff" stroke="#606060" stroke-width="1" />

  <g opacity="0.45">
    ${generateWatermarks(width, height)}
  </g>

  <!-- ASOCIACIONES -->
  <!-- Actor a UI -->
  <line x1="85" y1="300" x2="130" y2="300" class="ea-line" />

  <!-- UI a Controller -->
  <line x1="390" y1="300" x2="460" y2="300" class="ea-line" />
  <text x="405" y="292" class="assoc-text">invoca</text>

  <!-- Controller a Compra -->
  <line x1="770" y1="300" x2="850" y2="300" class="ea-line" />
  <text x="790" y="292" class="assoc-text">registra</text>
  <text x="780" y="315" class="mult-text">1</text>
  <text x="830" y="315" class="mult-text">0..*</text>

  <!-- Compra a Proveedor -->
  <line x1="980" y1="200" x2="980" y2="120" class="ea-line" />
  <text x="990" y="160" class="assoc-text">facturado por</text>
  <text x="960" y="190" class="mult-text">0..*</text>
  <text x="960" y="135" class="mult-text">1</text>

  <!-- Compra a DetalleCompra -->
  <line x1="980" y1="440" x2="980" y2="520" class="ea-line" />
  <text x="990" y="480" class="assoc-text">contiene</text>
  <text x="960" y="455" class="mult-text">1</text>
  <text x="960" y="505" class="mult-text">1..*</text>

  <!-- DetalleCompra a ProductoEquipo -->
  <line x1="1130" y1="620" x2="1220" y2="620" class="ea-line" />
  <text x="1145" y="612" class="assoc-text">referencia</text>
  <text x="1140" y="635" class="mult-text">0..*</text>
  <text x="1200" y="635" class="mult-text">1</text>

  <!-- DetalleCompra a Inventario -->
  <line x1="840" y1="620" x2="740" y2="620" class="ea-line" />
  <text x="755" y="612" class="assoc-text">actualiza stock</text>
  <text x="825" y="635" class="mult-text">0..*</text>
  <text x="750" y="635" class="mult-text">1</text>

  <!-- Controller a Bitacora -->
  <line x1="615" y1="410" x2="615" y2="520" class="ea-line" />
  <line x1="615" y1="520" x2="380" y2="520" class="ea-line" />
  <line x1="380" y1="520" x2="380" y2="560" class="ea-line" />
  <text x="440" y="512" class="assoc-text">auditoría</text>

  <!-- CAJAS EA -->
  <!-- Actor -->
  <g transform="translate(60, 300)">
    ${actorIcon(0, 0)}
    <text x="0" y="45" class="class-title">Administrador / Almacén</text>
  </g>

  <!-- Boundary: UI_CompraRegistro -->
  <g transform="translate(130, 190)">
    <rect x="0" y="0" width="260" height="220" class="class-box" />
    <text x="130" y="20" class="class-title">UI_CompraRegistro</text>
    <line x1="0" y1="28" x2="260" y2="28" class="divider" />
    <text x="10" y="48" class="method-text">+ listarCompras(): void</text>
    <text x="10" y="70" class="method-text">+ cargarFormulario(): void</text>
    <text x="10" y="92" class="method-text">+ agregarFilaDetalle(): void</text>
    <text x="10" y="114" class="method-text">+ calcularSubtotales(): void</text>
    <text x="10" y="136" class="method-text">+ calcularMontoTotal(): void</text>
    <text x="10" y="158" class="method-text">+ submitRegistrarCompra(): void</text>
    <text x="10" y="180" class="method-text">+ verModalDetalle(id): void</text>
    <text x="10" y="202" class="method-text">+ imprimirComprobante(): void</text>
  </g>

  <!-- Controller: CompraEquipoRegistroController -->
  <g transform="translate(460, 180)">
    <rect x="0" y="0" width="310" height="230" class="class-box" />
    <text x="155" y="20" class="class-title">CompraEquipoRegistroController</text>
    <line x1="0" y1="28" x2="310" y2="28" class="divider" />
    <text x="10" y="48" class="method-text">+ index(Request $request): JsonResponse</text>
    <text x="10" y="70" class="method-text">+ show(int $id): JsonResponse</text>
    <text x="10" y="92" class="method-text">+ proveedores(): JsonResponse</text>
    <text x="10" y="114" class="method-text">+ productos(): JsonResponse</text>
    <text x="10" y="136" class="method-text">+ store(Request $request): JsonResponse</text>
    <text x="10" y="158" class="method-text">- validarCompra(Request $req): array</text>
    <text x="10" y="180" class="method-text">- registrarDetalles(compra, items): void</text>
    <text x="10" y="202" class="method-text">- incrementarStock(idProd, cant): void</text>
  </g>

  <!-- Entity: Compra -->
  <g transform="translate(850, 200)">
    <rect x="0" y="0" width="260" height="240" class="class-box" />
    <text x="130" y="20" class="class-title">Compra</text>
    <line x1="0" y1="28" x2="260" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idCompra: int</text>
    <text x="10" y="64" class="attr-text">- nroComprobante: string</text>
    <text x="10" y="82" class="attr-text">- fechaCompra: date</text>
    <text x="10" y="100" class="attr-text">- montoTotal: decimal</text>
    <text x="10" y="118" class="attr-text">- idProveedor: int</text>
    <text x="10" y="136" class="attr-text">- idEstadoCompra: int</text>
    <text x="10" y="154" class="attr-text">- observacion: text</text>
    <line x1="0" y1="162" x2="260" y2="162" class="divider" />
    <text x="10" y="180" class="method-text">+ proveedor(): BelongsTo</text>
    <text x="10" y="198" class="method-text">+ detalles(): HasMany</text>
    <text x="10" y="216" class="method-text">+ estadoCompra(): BelongsTo</text>
  </g>

  <!-- Entity: Proveedor -->
  <g transform="translate(860, 10)">
    <rect x="0" y="0" width="240" height="110" class="class-box" />
    <text x="120" y="18" class="class-title">Proveedor</text>
    <line x1="0" y1="24" x2="240" y2="24" class="divider" />
    <text x="10" y="40" class="attr-text">- idProveedor: int</text>
    <text x="10" y="56" class="attr-text">- razonSocial: string</text>
    <text x="10" y="72" class="attr-text">- nit: string</text>
    <line x1="0" y1="78" x2="240" y2="78" class="divider" />
    <text x="10" y="96" class="method-text">+ compras(): HasMany</text>
  </g>

  <!-- Entity: DetalleCompra -->
  <g transform="translate(840, 520)">
    <rect x="0" y="0" width="290" height="200" class="class-box" />
    <text x="145" y="20" class="class-title">DetalleCompra</text>
    <line x1="0" y1="28" x2="290" y2="28" class="divider" />
    <text x="10" y="46" class="attr-text">- idDetalleCompra: int</text>
    <text x="10" y="64" class="attr-text">- idCompra: int</text>
    <text x="10" y="82" class="attr-text">- idProducto: int</text>
    <text x="10" y="100" class="attr-text">- idInventario: int</text>
    <text x="10" y="118" class="attr-text">- cantidad: int</text>
    <text x="10" y="136" class="attr-text">- precioUnitario: decimal</text>
    <text x="10" y="154" class="attr-text">- subtotal: decimal</text>
    <line x1="0" y1="162" x2="290" y2="162" class="divider" />
    <text x="10" y="180" class="method-text">+ compra(): BelongsTo</text>
    <text x="10" y="196" class="method-text">+ inventario(): BelongsTo</text>
  </g>

  <!-- Entity: Inventario -->
  <g transform="translate(520, 550)">
    <rect x="0" y="0" width="220" height="170" class="class-box" />
    <text x="110" y="18" class="class-title">Inventario</text>
    <line x1="0" y1="24" x2="220" y2="24" class="divider" />
    <text x="10" y="40" class="attr-text">- idInventario: int</text>
    <text x="10" y="56" class="attr-text">- idProducto: int</text>
    <text x="10" y="72" class="attr-text">- stockActual: int</text>
    <text x="10" y="88" class="attr-text">- stockMinimo: int</text>
    <text x="10" y="104" class="attr-text">- ubicacion: string</text>
    <line x1="0" y1="112" x2="220" y2="112" class="divider" />
    <text x="10" y="132" class="method-text">+ increment(col, cant): void</text>
    <text x="10" y="150" class="method-text">+ producto(): BelongsTo</text>
  </g>

  <!-- Entity: ProductoEquipo -->
  <g transform="translate(1220, 540)">
    <rect x="0" y="0" width="240" height="170" class="class-box" />
    <text x="120" y="18" class="class-title">ProductoEquipo</text>
    <line x1="0" y1="24" x2="240" y2="24" class="divider" />
    <text x="10" y="40" class="attr-text">- idProducto: int</text>
    <text x="10" y="56" class="attr-text">- codigoProducto: string</text>
    <text x="10" y="72" class="attr-text">- nombreProducto: string</text>
    <text x="10" y="88" class="attr-text">- marca: string</text>
    <text x="10" y="104" class="attr-text">- modelo: string</text>
    <line x1="0" y1="112" x2="240" y2="112" class="divider" />
    <text x="10" y="132" class="method-text">+ inventarios(): HasMany</text>
    <text x="10" y="150" class="method-text">+ detallesCompra(): HasMany</text>
  </g>

  <!-- Entity: Bitacora -->
  <g transform="translate(260, 560)">
    <rect x="0" y="0" width="220" height="160" class="class-box" />
    <text x="110" y="18" class="class-title">Bitacora</text>
    <line x1="0" y1="24" x2="220" y2="24" class="divider" />
    <text x="10" y="40" class="attr-text">- idBitacora: int</text>
    <text x="10" y="56" class="attr-text">- casoUso: string = 'CU25'</text>
    <text x="10" y="72" class="attr-text">- accion: string</text>
    <text x="10" y="88" class="attr-text">- detalles: text</text>
    <line x1="0" y1="96" x2="220" y2="96" class="divider" />
    <text x="10" y="116" class="method-text">+ create(array $datos): void</text>
  </g>
</svg>`;
}

function buildCU25Sequence() {
  const width = 1680;
  const height = 1180;
  const tabW = 460;

  const xAdmin = 90;
  const xUI = 320;
  const xCtrl = 640;
  const xComp = 980;
  const xDet = 1240;
  const xInv = 1440;
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
  <text x="30" y="38" class="tab-title">sd CU25 Registrar compra de equipos y actualización de stock</text>

  <rect x="20" y="45" width="${width - 40}" height="${height - 65}" fill="#ffffff" stroke="#64748b" stroke-width="1" />

  <g opacity="0.4">
    ${generateWatermarks(width, height)}
  </g>

  <!-- LÍNEAS DE VIDA -->
  <line x1="${xAdmin}" y1="130" x2="${xAdmin}" y2="${height - 50}" class="life-line" />
  <line x1="${xUI}" y1="130" x2="${xUI}" y2="${height - 50}" class="life-line" />
  <line x1="${xCtrl}" y1="130" x2="${xCtrl}" y2="${height - 50}" class="life-line" />
  <line x1="${xComp}" y1="130" x2="${xComp}" y2="${height - 50}" class="life-line" />
  <line x1="${xDet}" y1="130" x2="${xDet}" y2="${height - 50}" class="life-line" />
  <line x1="${xInv}" y1="130" x2="${xInv}" y2="${height - 50}" class="life-line" />
  <line x1="${xBit}" y1="130" x2="${xBit}" y2="${height - 50}" class="life-line" />

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
  <g transform="translate(${xBit}, 90)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="36" class="life-title">Bitacora</text>
  </g>

  <!-- BLOQUE 1: CARGA DE FORMULARIO -->
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

  <line x1="${xCtrl + 5}" y1="215" x2="${xComp - 5}" y2="215" class="msg-call" />
  <polygon points="${xComp - 5},215 ${xComp - 11},212 ${xComp - 11},218" fill="#1e293b" />
  <text x="690" y="210" class="call-text">1.2: Proveedor::where('estado', true)->get(), ProductoEquipo::all()</text>

  <line x1="${xComp - 5}" y1="240" x2="${xCtrl + 5}" y2="240" class="msg-ret" />
  <text x="730" y="235" class="ret-text">($proveedoresActivos, $productos)</text>

  <line x1="${xCtrl - 5}" y1="265" x2="${xUI + 5}" y2="265" class="msg-ret" />
  <text x="390" y="260" class="ret-text">success({proveedores, productos})</text>

  <line x1="${xUI - 5}" y1="290" x2="${xAdmin + 5}" y2="290" class="msg-ret" />
  <text x="130" y="285" class="ret-text">renderizarFormularioConSelectores()</text>

  <!-- BLOQUE 2: REGISTRO DE COMPRA ATÓMICO -->
  <rect x="35" y="360" width="${width - 70}" height="420" class="frame-box" />
  <path d="M 35,380 L 35,360 L 400,360 L 412,380 Z" class="frame-tab" />
  <text x="45" y="374" class="frame-title">alt Flujo 2: Registrar compra y actualizar stock (Transacción DB)</text>

  <rect x="${xAdmin - 5}" y="385" width="10" height="375" class="act-bar" />
  <rect x="${xUI - 5}" y="385" width="10" height="370" class="act-bar" />
  <rect x="${xCtrl - 5}" y="395" width="10" height="345" class="act-bar" />

  <line x1="${xAdmin + 5}" y1="390" x2="${xUI - 5}" y2="390" class="msg-call" />
  <polygon points="${xUI - 5},390 ${xUI - 11},387 ${xUI - 11},393" fill="#1e293b" />
  <text x="130" y="385" class="call-text">2: submitCompra(idProveedor, nroComprobante, items[idProducto, cant, precio])</text>

  <line x1="${xUI + 5}" y1="410" x2="${xCtrl - 5}" y2="410" class="msg-call" />
  <polygon points="${xCtrl - 5},410 ${xCtrl - 11},407 ${xCtrl - 11},413" fill="#1e293b" />
  <text x="360" y="405" class="call-text">2.1: store(Request $request)</text>

  <line x1="${xCtrl + 5}" y1="430" x2="${xCtrl + 35}" y2="430" class="msg-call" />
  <line x1="${xCtrl + 35}" y1="430" x2="${xCtrl + 35}" y2="445" class="msg-call" />
  <line x1="${xCtrl + 35}" y1="445" x2="${xCtrl + 5}" y2="445" class="msg-call" />
  <polygon points="${xCtrl + 5},445 ${xCtrl + 11},442 ${xCtrl + 11},448" fill="#1e293b" />
  <text x="${xCtrl + 40}" y="440" class="call-text">DB::beginTransaction() & validate()</text>

  <!-- Crear Cabecera Compra -->
  <line x1="${xCtrl + 5}" y1="470" x2="${xComp - 5}" y2="470" class="msg-call" />
  <polygon points="${xComp - 5},470 ${xComp - 11},467 ${xComp - 11},473" fill="#1e293b" />
  <text x="690" y="465" class="call-text">2.2: create([nroComprobante, fecha, idProveedor, montoTotal: 0])</text>

  <line x1="${xComp - 5}" y1="490" x2="${xCtrl + 5}" y2="490" class="msg-ret" />
  <text x="730" y="485" class="ret-text">($compraId)</text>

  <!-- Loop en Detalles e Incremento en Inventario -->
  <line x1="${xCtrl + 5}" y1="520" x2="${xDet - 5}" y2="520" class="msg-call" />
  <polygon points="${xDet - 5},520 ${xDet - 11},517 ${xDet - 11},523" fill="#1e293b" />
  <text x="690" y="515" class="call-text">2.3: foreach items: DetalleCompra::create([idCompra, idProducto, cant, pUnit])</text>

  <line x1="${xDet - 5}" y1="545" x2="${xCtrl + 5}" y2="545" class="msg-ret" />
  <text x="890" y="540" class="ret-text">($detalleInsertado)</text>

  <line x1="${xCtrl + 5}" y1="570" x2="${xInv - 5}" y2="570" class="msg-call" />
  <polygon points="${xInv - 5},570 ${xInv - 11},567 ${xInv - 11},573" fill="#1e293b" />
  <text x="890" y="565" class="call-text">2.4: Inventario::where('idProducto', $idProd)->increment('stockActual', $cant)</text>

  <line x1="${xInv - 5}" y1="595" x2="${xCtrl + 5}" y2="595" class="msg-ret" />
  <text x="1080" y="590" class="ret-text">(nuevoStockConfirmado)</text>

  <!-- Actualizar Monto Total Cabecera -->
  <line x1="${xCtrl + 5}" y1="625" x2="${xComp - 5}" y2="625" class="msg-call" />
  <polygon points="${xComp - 5},625 ${xComp - 11},622 ${xComp - 11},628" fill="#1e293b" />
  <text x="690" y="620" class="call-text">2.5: Compra::where('idCompra', $id)->update(['montoTotal' => $sumTotal])</text>

  <!-- Bitacora y Commit -->
  <line x1="${xCtrl + 5}" y1="655" x2="${xBit - 5}" y2="655" class="msg-call" />
  <polygon points="${xBit - 5},655 ${xBit - 11},652 ${xBit - 11},658" fill="#1e293b" />
  <text x="890" y="650" class="call-text">2.6: AuditLogger::log('CU25', 'REGISTRAR_COMPRA', detalle)</text>

  <line x1="${xCtrl + 5}" y1="685" x2="${xCtrl + 35}" y2="685" class="msg-call" />
  <line x1="${xCtrl + 35}" y1="685" x2="${xCtrl + 35}" y2="700" class="msg-call" />
  <line x1="${xCtrl + 35}" y1="700" x2="${xCtrl + 5}" y2="700" class="msg-call" />
  <polygon points="${xCtrl + 5},700 ${xCtrl + 11},697 ${xCtrl + 11},703" fill="#1e293b" />
  <text x="${xCtrl + 40}" y="695" class="call-text">DB::commit()</text>

  <line x1="${xCtrl - 5}" y1="725" x2="${xUI + 5}" y2="725" class="msg-ret" />
  <text x="390" y="720" class="ret-text">success({compra: $compraFresh}, 'Compra registrada y stock actualizado')</text>

  <line x1="${xUI - 5}" y1="750" x2="${xAdmin + 5}" y2="750" class="msg-ret" />
  <text x="130" y="745" class="ret-text">notificarExitoYActualizarTabla()</text>
</svg>`;
}

module.exports = {
  buildCU25Communication,
  buildCU25ClassAnalysis,
  buildCU25Sequence,
};

