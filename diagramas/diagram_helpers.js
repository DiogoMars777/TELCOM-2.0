const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const dirComunicacion = path.resolve(__dirname, 'comunicacion');
const dirSecuencia = path.resolve(__dirname, 'secuencia');
const dirAnalisis = path.resolve(__dirname, 'analisis_clases');
const dirDocs = path.resolve(rootDir, 'docs', 'diagramas');

[dirComunicacion, dirSecuencia, dirAnalisis, dirDocs].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const edgePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
];
const browserExe = edgePaths.find((p) => fs.existsSync(p));

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

function wrapHtml(title, svgContent) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #ffffff;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 10px;
    }
    svg {
      width: 100%;
      height: auto;
      max-width: 1920px;
    }
  </style>
</head>
<body>
  ${svgContent}
</body>
</html>`;
}

// Exportar helpers
module.exports = {
  generateWatermarks,
  boundaryIcon,
  controlIcon,
  entityIcon,
  actorIcon,
  wrapHtml,
  browserExe,
  dirComunicacion,
  dirSecuencia,
  dirAnalisis,
  dirDocs,
};

