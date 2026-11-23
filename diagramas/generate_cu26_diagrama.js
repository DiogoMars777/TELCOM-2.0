const fs = require('fs');
const path = require('path');

const outputDir = path.resolve(__dirname, 'comunicacion');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function generateWatermarks(width, height) {
  let watermarks = '';
  for (let y = 95; y < height - 40; y += 45) {
    watermarks += `
    <text x="30" y="${y}" fill="#d5dae2" font-family="Arial, sans-serif" font-size="11.5" letter-spacing="1">
      EA 17.2 Unregistered Trial Version   EA 17.2 Unregistered Trial Version   EA 17.2 Unregistered Trial Version   EA 17.2 Unregistered Trial Version   EA 17.2 Unregistered Trial Version   EA 17.2 Unregistered Trial Version
    </text>`;
  }
  return watermarks;
}

const boundaryIcon = (cx, cy, r = 18) => `
  <line x1="${cx - r - 5}" y1="${cy - r}" x2="${cx - r - 5}" y2="${cy + r}" stroke="#475569" stroke-width="2.5" />
  <line x1="${cx - r - 5}" y1="${cy}" x2="${cx - r}" y2="${cy}" stroke="#475569" stroke-width="2" />
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffea" stroke="#475569" stroke-width="2" />
`;

const controlIcon = (cx, cy, r = 18) => `
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffea" stroke="#475569" stroke-width="2" />
  <path d="M ${cx - 5} ${cy - r} L ${cx + 4} ${cy - r - 4} L ${cx + 2} ${cy - r} C ${cx + 11} ${cy - r + 3} ${cx + r + 2} ${cy - 2} ${cx + r} ${cy + 6}" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round" />
  <polygon points="${cx - 7},${cy - r} ${cx + 4},${cy - r - 6} ${cx + 1},${cy - r + 5}" fill="#475569" />
`;

const entityIcon = (cx, cy, r = 18) => `
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffea" stroke="#475569" stroke-width="2" />
  <line x1="${cx - r}" y1="${cy + r + 4}" x2="${cx + r}" y2="${cy + r + 4}" stroke="#475569" stroke-width="2.5" />
`;

const actorIcon = (cx, cy) => `
  <circle cx="${cx}" cy="${cy - 26}" r="8.5" fill="#ffffea" stroke="#1e293b" stroke-width="1.8" />
  <line x1="${cx}" y1="${cy - 17.5}" x2="${cx}" y2="${cy + 5}" stroke="#1e293b" stroke-width="2" />
  <line x1="${cx - 15}" y1="${cy - 8}" x2="${cx + 15}" y2="${cy - 8}" stroke="#1e293b" stroke-width="2" />
  <line x1="${cx}" y1="${cy + 5}" x2="${cx - 12}" y2="${cy + 25}" stroke="#1e293b" stroke-width="2" />
  <line x1="${cx}" y1="${cy + 5}" x2="${cx + 12}" y2="${cy + 25}" stroke="#1e293b" stroke-width="2" />
`;

function generateCU26SVG() {
  const width = 1680;
  const height = 980;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background:#ffffff; font-family: 'Segoe UI', Arial, sans-serif;">
  <defs>
    <style>
      .tab-title { font-size: 11px; font-weight: bold; fill: #1e293b; }
      .node-title { font-size: 12px; font-weight: bold; fill: #0f172a; text-anchor: middle; }
      .link-line { stroke: #64748b; stroke-width: 1.3; fill: none; }
      .flow-1 { fill: #0f172a; font-size: 10.5px; font-weight: bold; }
      .flow-2 { fill: #b91c1c; font-size: 10.5px; font-weight: bold; }
      .flow-3 { fill: #15803d; font-size: 10.5px; font-weight: bold; }
      .sub-msg { font-size: 9.5px; font-weight: normal; fill: #475569; }
    </style>
  </defs>

  <!-- Pestaña de Diagrama EA -->
  <path d="M 20,45 L 20,24 L 460,24 L 476,45 Z" fill="#ffffff" stroke="#64748b" stroke-width="1" />
  <text x="30" y="38" class="tab-title">sd CU26 Visualizar Dashboard administrativo y financiero</text>

  <!-- Marco Exterior -->
  <rect x="20" y="45" width="${width - 40}" height="${height - 65}" fill="#ffffff" stroke="#64748b" stroke-width="1" />

  <!-- Marcas de agua EA Trial -->
  <g opacity="0.45">
    ${generateWatermarks(width, height)}
  </g>

  <!-- CONEXIONES (Líneas de comunicación) -->
  <!-- Actor -> Boundary -->
  <line x1="160" y1="460" x2="380" y2="460" class="link-line" />

  <!-- Boundary -> Control -->
  <line x1="430" y1="460" x2="720" y2="460" class="link-line" />

  <!-- Control -> Pago (Arriba Izq) -->
  <line x1="750" y1="430" x2="570" y2="200" class="link-line" />

  <!-- Control -> Mensualidad (Arriba Der) -->
  <line x1="770" y1="430" x2="940" y2="200" class="link-line" />

  <!-- Control -> Cliente (Derecha) -->
  <line x1="790" y1="460" x2="1160" y2="460" class="link-line" />

  <!-- Control -> ServicioInternet (Abajo Izq) -->
  <line x1="740" y1="490" x2="560" y2="730" class="link-line" />

  <!-- Control -> PlanInternet (Abajo Centro) -->
  <line x1="760" y1="490" x2="760" y2="730" class="link-line" />

  <!-- Control -> Zona (Abajo Der) -->
  <line x1="780" y1="490" x2="970" y2="730" class="link-line" />

  <!-- Control -> Bitacora (Auditoría CU02) -->
  <line x1="760" y1="420" x2="760" y2="330" x2="1160" y2="330" class="link-line" stroke-dasharray="3,3" />

  <!-- ================= ELEMENTOS BCE ================= -->
  <!-- 1. ACTOR -->
  <g transform="translate(130, 460)">
    ${actorIcon(0, 0)}
    <text x="0" y="45" class="node-title">Administrador / Secretaría</text>
  </g>

  <!-- 2. BOUNDARY -->
  <g transform="translate(400, 460)">
    ${boundaryIcon(0, 0, 22)}
    <text x="0" y="42" class="node-title">UI_DashboardAdminFinanciero</text>
  </g>

  <!-- 3. CONTROL -->
  <g transform="translate(760, 460)">
    ${controlIcon(0, 0, 24)}
    <text x="0" y="44" class="node-title">DashboardAdminFinancieroController</text>
    <text x="0" y="58" class="sub-msg">(DashboardMetricasService)</text>
  </g>

  <!-- 4. ENTITY: Pago -->
  <g transform="translate(550, 180)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="38" class="node-title">Pago</text>
  </g>

  <!-- 5. ENTITY: Mensualidad -->
  <g transform="translate(960, 180)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="38" class="node-title">Mensualidad</text>
  </g>

  <!-- 6. ENTITY: Cliente -->
  <g transform="translate(1200, 460)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="38" class="node-title">Cliente</text>
  </g>

  <!-- 7. ENTITY: ServicioInternet -->
  <g transform="translate(540, 760)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="38" class="node-title">ServicioInternet</text>
  </g>

  <!-- 8. ENTITY: PlanInternet -->
  <g transform="translate(760, 760)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="38" class="node-title">PlanInternet</text>
  </g>

  <!-- 9. ENTITY: Zona -->
  <g transform="translate(990, 760)">
    ${entityIcon(0, 0, 20)}
    <text x="0" y="38" class="node-title">Zona</text>
  </g>

  <!-- 10. ENTITY: Bitacora -->
  <g transform="translate(1200, 330)">
    ${entityIcon(0, 0, 18)}
    <text x="0" y="36" class="node-title">Bitacora (Auditoría)</text>
  </g>

  <!-- ================= MENSAJES Y LLAMADAS (NUMERADOS) ================= -->
  <!-- Mensajes Actor -> Boundary -->
  <g transform="translate(170, 420)">
    <rect x="-10" y="-12" width="195" height="42" fill="#ffffff" fill-opacity="0.9" rx="3" stroke="#cbd5e1" stroke-width="0.5" />
    <text x="0" y="0" class="flow-1">1: consultarDashboard(periodo) →</text>
    <text x="0" y="14" class="flow-2">2: filtrarFinanciero(periodo) →</text>
    <text x="0" y="28" class="flow-3">3: consultarAlertasMora() →</text>
  </g>

  <!-- Mensajes Boundary -> Control -->
  <g transform="translate(460, 420)">
    <rect x="-10" y="-12" width="220" height="42" fill="#ffffff" fill-opacity="0.9" rx="3" stroke="#cbd5e1" stroke-width="0.5" />
    <text x="0" y="0" class="flow-1">1.1: index(Request) →</text>
    <text x="0" y="14" class="flow-2">2.1: financiero(Request) →</text>
    <text x="0" y="28" class="flow-3">3.1: alertas() →</text>
  </g>

  <!-- Mensajes Control -> Pago -->
  <g transform="translate(560, 280)">
    <rect x="-10" y="-12" width="215" height="30" fill="#ffffff" fill-opacity="0.9" rx="3" stroke="#cbd5e1" stroke-width="0.5" />
    <text x="0" y="0" class="flow-1">1.3: sum('montoTotal'), count(*) →</text>
    <text x="0" y="14" class="flow-2">2.2: leftJoin('MetodoPago')->groupBy() →</text>
  </g>

  <!-- Mensajes Control -> Mensualidad -->
  <g transform="translate(860, 260)">
    <rect x="-10" y="-12" width="235" height="42" fill="#ffffff" fill-opacity="0.9" rx="3" stroke="#cbd5e1" stroke-width="0.5" />
    <text x="0" y="0" class="flow-1">1.4: where('estado','PENDIENTE')->sum() →</text>
    <text x="0" y="14" class="flow-2">2.3: selectRaw('sum(monto)')->groupBy() →</text>
    <text x="0" y="28" class="flow-3">3.2: join('Cliente')->orderByDesc('mora') →</text>
  </g>

  <!-- Mensajes Control -> Cliente -->
  <g transform="translate(860, 440)">
    <rect x="-10" y="-12" width="260" height="30" fill="#ffffff" fill-opacity="0.9" rx="3" stroke="#cbd5e1" stroke-width="0.5" />
    <text x="0" y="0" class="flow-1">1.5: where('estadoCliente','ACTIVO')->count() →</text>
    <text x="0" y="14" class="flow-3">3.3: findOrFail(idCliente) [deuda crítica] →</text>
  </g>

  <!-- Mensajes Control -> ServicioInternet -->
  <g transform="translate(480, 620)">
    <rect x="-10" y="-12" width="240" height="20" fill="#ffffff" fill-opacity="0.9" rx="3" stroke="#cbd5e1" stroke-width="0.5" />
    <text x="0" y="0" class="flow-1">1.6: leftJoin('EstadoServicio')->groupBy() →</text>
  </g>

  <!-- Mensajes Control -> PlanInternet -->
  <g transform="translate(680, 660)">
    <rect x="-10" y="-12" width="220" height="20" fill="#ffffff" fill-opacity="0.9" rx="3" stroke="#cbd5e1" stroke-width="0.5" />
    <text x="0" y="0" class="flow-1">1.7: withCount('asignacionesVigentes') →</text>
  </g>

  <!-- Mensajes Control -> Zona -->
  <g transform="translate(900, 620)">
    <rect x="-10" y="-12" width="230" height="20" fill="#ffffff" fill-opacity="0.9" rx="3" stroke="#cbd5e1" stroke-width="0.5" />
    <text x="0" y="0" class="flow-1">1.8: select('capacidad')->withCount() →</text>
  </g>

  <!-- Mensajes Control -> Bitacora -->
  <g transform="translate(860, 310)">
    <rect x="-10" y="-12" width="250" height="20" fill="#ffffff" fill-opacity="0.9" rx="3" stroke="#cbd5e1" stroke-width="0.5" />
    <text x="0" y="0" class="flow-1">1.9: log('CU26', 'CONSULTA_DASHBOARD') →</text>
  </g>

  <!-- Leyenda Técnica -->
  <g transform="translate(40, 890)">
    <rect x="0" y="0" width="1600" height="42" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" rx="4" />
    <circle cx="20" cy="21" r="5" fill="#0f172a" />
    <text x="32" y="25" font-size="11" font-weight="bold" fill="#0f172a">Flujo 1: Consolidado General (KPIs, Recaudación, Clientes, Servicios y Zonas)</text>
    
    <circle cx="560" cy="21" r="5" fill="#b91c1c" />
    <text x="572" y="25" font-size="11" font-weight="bold" fill="#b91c1c">Flujo 2: Módulo Financiero (Evolución 6 Meses y Canales QR/Efectivo)</text>
    
    <circle cx="1060" cy="21" r="5" fill="#15803d" />
    <text x="1072" y="25" font-size="11" font-weight="bold" fill="#15803d">Flujo 3: Monitoreo Predictivo de Alertas de Morosidad Crítica</text>
  </g>
</svg>`;
}

function generateHTML(svgContent) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Diagrama de Comunicación - CU26 Visualizar Dashboard Administrativo y Financiero</title>
  <style>
    body {
      margin: 0;
      padding: 24px;
      background-color: #0f172a;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .header {
      width: 100%;
      max-width: 1680px;
      margin-bottom: 20px;
    }
    h1 {
      margin: 0 0 6px 0;
      font-size: 20px;
      color: #38bdf8;
    }
    p {
      margin: 0;
      font-size: 13px;
      color: #94a3b8;
    }
    .diagram-container {
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
      padding: 16px;
      overflow-x: auto;
      max-width: 100%;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>TELCOM 2.0 &bull; Diagrama de Comunicación BCE (CU26)</h1>
    <p>Caso de Uso CU26: Visualizar Dashboard administrativo y financiero &bull; Modelado Enterprise Architect 17.2</p>
  </div>
  <div class="diagram-container">
    ${svgContent}
  </div>
</body>
</html>`;
}

const svg = generateCU26SVG();
const html = generateHTML(svg);

fs.writeFileSync(path.join(outputDir, 'cu26_comunicacion_dashboard_admin_financiero.svg'), svg, 'utf-8');
fs.writeFileSync(path.join(outputDir, 'cu26_comunicacion_dashboard_admin_financiero.html'), html, 'utf-8');

console.log('Archivos generados exitosamente en:', outputDir);
