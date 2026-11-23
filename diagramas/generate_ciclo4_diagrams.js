/**
 * TELCOM 2.0 - Generador Maestro de Diagramas del Ciclo 4 (CU24 - CU31)
 *
 * Genera:
 *   1. Diagramas de Comunicación (BCE / UML) -> SVG, HTML, PNG
 *   2. Diagramas de Secuencia (BCE / UML)    -> SVG, HTML, PNG
 *   3. Diagramas de Análisis de Clases (BCE) -> SVG, HTML, PNG
 *
 * Estilo visual: Enterprise Architect 17.2 / Robusto BCE Canónico
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const {
  wrapHtml,
  browserExe,
  dirComunicacion,
  dirSecuencia,
  dirAnalisis,
  dirDocs,
} = require('./diagram_helpers');

// Importar generadores modulares de CU24 a CU31
const cu24 = require('./generators/cu24_generator');
const cu25 = require('./generators/cu25_generator');
const cu26 = require('./generators/cu26_generator');
const cu27 = require('./generators/cu27_generator');
const cu28 = require('./generators/cu28_generator');
const cu29 = require('./generators/cu29_generator');
const cu30 = require('./generators/cu30_generator');
const cu31 = require('./generators/cu31_generator');

const diagramsConfig = [
  // CU24
  {
    cu: 'CU24',
    type: 'comunicacion',
    title: 'CU24 Diagrama de Comunicación - Gestionar Proveedores',
    builder: cu24.buildCU24Communication,
    canonicalName: 'cu24_gestionar_proveedores',
    docsName: 'CU24_Diagrama_Comunicacion',
    targetDir: dirComunicacion,
  },
  {
    cu: 'CU24',
    type: 'secuencia',
    title: 'CU24 Diagrama de Secuencia - Gestionar Proveedores',
    builder: cu24.buildCU24Sequence,
    canonicalName: 'cu24_secuencia_gestionar_proveedores',
    docsName: 'CU24_Diagrama_Secuencia',
    targetDir: dirSecuencia,
  },
  {
    cu: 'CU24',
    type: 'analisis_clases',
    title: 'CU24 Análisis de Clases - Gestionar Proveedores',
    builder: cu24.buildCU24ClassAnalysis,
    canonicalName: 'cu24_analisis_gestionar_proveedores',
    docsName: 'CU24_Analisis_Clases',
    targetDir: dirAnalisis,
  },

  // CU25
  {
    cu: 'CU25',
    type: 'comunicacion',
    title: 'CU25 Diagrama de Comunicación - Registrar Compra de Equipos y Stock',
    builder: cu25.buildCU25Communication,
    canonicalName: 'cu25_registrar_compra_equipos_stock',
    docsName: 'CU25_Diagrama_Comunicacion',
    targetDir: dirComunicacion,
  },
  {
    cu: 'CU25',
    type: 'secuencia',
    title: 'CU25 Diagrama de Secuencia - Registrar Compra de Equipos y Stock',
    builder: cu25.buildCU25Sequence,
    canonicalName: 'cu25_secuencia_registrar_compra_equipos_stock',
    docsName: 'CU25_Diagrama_Secuencia',
    targetDir: dirSecuencia,
  },
  {
    cu: 'CU25',
    type: 'analisis_clases',
    title: 'CU25 Análisis de Clases - Registrar Compra de Equipos y Stock',
    builder: cu25.buildCU25ClassAnalysis,
    canonicalName: 'cu25_analisis_registrar_compra_equipos_stock',
    docsName: 'CU25_Analisis_Clases',
    targetDir: dirAnalisis,
  },

  // CU26
  {
    cu: 'CU26',
    type: 'comunicacion',
    title: 'CU26 Diagrama de Comunicación - Visualizar Dashboard Administrativo y Financiero',
    builder: cu26.buildCU26Communication,
    canonicalName: 'cu26_visualizar_dashboard_admin_financiero',
    docsName: 'CU26_Diagrama_Comunicacion',
    targetDir: dirComunicacion,
  },
  {
    cu: 'CU26',
    type: 'secuencia',
    title: 'CU26 Diagrama de Secuencia - Visualizar Dashboard Administrativo y Financiero',
    builder: cu26.buildCU26Sequence,
    canonicalName: 'cu26_secuencia_visualizar_dashboard_admin_financiero',
    docsName: 'CU26_Diagrama_Secuencia',
    targetDir: dirSecuencia,
  },
  {
    cu: 'CU26',
    type: 'analisis_clases',
    title: 'CU26 Análisis de Clases - Visualizar Dashboard Administrativo y Financiero',
    builder: cu26.buildCU26ClassAnalysis,
    canonicalName: 'cu26_analisis_visualizar_dashboard_admin_financiero',
    docsName: 'CU26_Analisis_Clases',
    targetDir: dirAnalisis,
  },

  // CU27
  {
    cu: 'CU27',
    type: 'comunicacion',
    title: 'CU27 Diagrama de Comunicación - Generar y Exportar Reportes Tradicionales',
    builder: cu27.buildCU27Communication,
    canonicalName: 'cu27_generar_exportar_reportes_tradicionales',
    docsName: 'CU27_Diagrama_Comunicacion',
    targetDir: dirComunicacion,
  },
  {
    cu: 'CU27',
    type: 'secuencia',
    title: 'CU27 Diagrama de Secuencia - Generar y Exportar Reportes Tradicionales',
    builder: cu27.buildCU27Sequence,
    canonicalName: 'cu27_secuencia_generar_exportar_reportes_tradicionales',
    docsName: 'CU27_Diagrama_Secuencia',
    targetDir: dirSecuencia,
  },
  {
    cu: 'CU27',
    type: 'analisis_clases',
    title: 'CU27 Análisis de Clases - Generar y Exportar Reportes Tradicionales',
    builder: cu27.buildCU27ClassAnalysis,
    canonicalName: 'cu27_analisis_generar_exportar_reportes_tradicionales',
    docsName: 'CU27_Analisis_Clases',
    targetDir: dirAnalisis,
  },

  // CU28
  {
    cu: 'CU28',
    type: 'comunicacion',
    title: 'CU28 Diagrama de Comunicación - Generar y Restaurar Copias de Seguridad',
    builder: cu28.buildCU28Communication,
    canonicalName: 'cu28_generar_restaurar_copias_seguridad',
    docsName: 'CU28_Diagrama_Comunicacion',
    targetDir: dirComunicacion,
  },
  {
    cu: 'CU28',
    type: 'secuencia',
    title: 'CU28 Diagrama de Secuencia - Generar y Restaurar Copias de Seguridad',
    builder: cu28.buildCU28Sequence,
    canonicalName: 'cu28_secuencia_generar_restaurar_copias_seguridad',
    docsName: 'CU28_Diagrama_Secuencia',
    targetDir: dirSecuencia,
  },
  {
    cu: 'CU28',
    type: 'analisis_clases',
    title: 'CU28 Análisis de Clases - Generar y Restaurar Copias de Seguridad',
    builder: cu28.buildCU28ClassAnalysis,
    canonicalName: 'cu28_analisis_generar_restaurar_copias_seguridad',
    docsName: 'CU28_Analisis_Clases',
    targetDir: dirAnalisis,
  },

  // CU29
  {
    cu: 'CU29',
    type: 'comunicacion',
    title: 'CU29 Diagrama de Comunicación - Capturar y Transcribir Comandos de Voz',
    builder: cu29.buildCU29Communication,
    canonicalName: 'cu29_capturar_transcribir_comandos_voz',
    docsName: 'CU29_Diagrama_Comunicacion',
    targetDir: dirComunicacion,
  },
  {
    cu: 'CU29',
    type: 'secuencia',
    title: 'CU29 Diagrama de Secuencia - Capturar y Transcribir Comandos de Voz',
    builder: cu29.buildCU29Sequence,
    canonicalName: 'cu29_secuencia_capturar_transcribir_comandos_voz',
    docsName: 'CU29_Diagrama_Secuencia',
    targetDir: dirSecuencia,
  },
  {
    cu: 'CU29',
    type: 'analisis_clases',
    title: 'CU29 Análisis de Clases - Capturar y Transcribir Comandos de Voz',
    builder: cu29.buildCU29ClassAnalysis,
    canonicalName: 'cu29_analisis_capturar_transcribir_comandos_voz',
    docsName: 'CU29_Analisis_Clases',
    targetDir: dirAnalisis,
  },

  // CU30
  {
    cu: 'CU30',
    type: 'comunicacion',
    title: 'CU30 Diagrama de Comunicación - Procesar Intención de Voz con IA (NLP)',
    builder: cu30.buildCU30Communication,
    canonicalName: 'cu30_procesar_intencion_voz_ia',
    docsName: 'CU30_Diagrama_Comunicacion',
    targetDir: dirComunicacion,
  },
  {
    cu: 'CU30',
    type: 'secuencia',
    title: 'CU30 Diagrama de Secuencia - Procesar Intención de Voz con IA (NLP)',
    builder: cu30.buildCU30Sequence,
    canonicalName: 'cu30_secuencia_procesar_intencion_voz_ia',
    docsName: 'CU30_Diagrama_Secuencia',
    targetDir: dirSecuencia,
  },
  {
    cu: 'CU30',
    type: 'analisis_clases',
    title: 'CU30 Análisis de Clases - Procesar Intención de Voz con IA (NLP)',
    builder: cu30.buildCU30ClassAnalysis,
    canonicalName: 'cu30_analisis_procesar_intencion_voz_ia',
    docsName: 'CU30_Analisis_Clases',
    targetDir: dirAnalisis,
  },

  // CU31
  {
    cu: 'CU31',
    type: 'comunicacion',
    title: 'CU31 Diagrama de Comunicación - Generar Reporte Inteligente vía Comando de Voz',
    builder: cu31.buildCU31Communication,
    canonicalName: 'cu31_generar_reporte_inteligente_voz',
    docsName: 'CU31_Diagrama_Comunicacion',
    targetDir: dirComunicacion,
  },
  {
    cu: 'CU31',
    type: 'secuencia',
    title: 'CU31 Diagrama de Secuencia - Generar Reporte Inteligente vía Comando de Voz',
    builder: cu31.buildCU31Sequence,
    canonicalName: 'cu31_secuencia_generar_reporte_inteligente_voz',
    docsName: 'CU31_Diagrama_Secuencia',
    targetDir: dirSecuencia,
  },
  {
    cu: 'CU31',
    type: 'analisis_clases',
    title: 'CU31 Análisis de Clases - Generar Reporte Inteligente vía Comando de Voz',
    builder: cu31.buildCU31ClassAnalysis,
    canonicalName: 'cu31_analisis_generar_reporte_inteligente_voz',
    docsName: 'CU31_Analisis_Clases',
    targetDir: dirAnalisis,
  },
];

async function main() {
  console.log(`Iniciando generación de los 24 diagramas de Ciclo 4 (CU24 - CU31)...`);
  console.log(`Navegador para renderizado: ${browserExe || 'No encontrado (solo SVG/HTML)'}`);

  let generados = 0;

  for (const cfg of diagramsConfig) {
    const svg = cfg.builder();
    const html = wrapHtml(cfg.title, svg);

    // Rutas canónicas
    const canonSvgPath = path.join(cfg.targetDir, `${cfg.canonicalName}.svg`);
    const canonHtmlPath = path.join(cfg.targetDir, `${cfg.canonicalName}.html`);
    const canonPngPath = path.join(cfg.targetDir, `${cfg.canonicalName}.png`);

    // Rutas de documentación
    const docsSvgPath = path.join(dirDocs, `${cfg.docsName}.svg`);
    const docsHtmlPath = path.join(dirDocs, `${cfg.docsName}.html`);
    const docsPngPath = path.join(dirDocs, `${cfg.docsName}.png`);

    // Guardar SVG y HTML
    fs.writeFileSync(canonSvgPath, svg.trim(), 'utf8');
    fs.writeFileSync(canonHtmlPath, html, 'utf8');
    fs.writeFileSync(docsSvgPath, svg.trim(), 'utf8');
    fs.writeFileSync(docsHtmlPath, html, 'utf8');

    // Renderizar PNG si browserExe está disponible
    if (browserExe) {
      try {
        const fileUrl = 'file:///' + canonHtmlPath.replace(/\\/g, '/');
        execFileSync(
          browserExe,
          [
            '--headless=new',
            '--disable-gpu',
            '--force-device-scale-factor=1.5',
            '--window-size=1920,1200',
            `--screenshot=${canonPngPath}`,
            fileUrl,
          ],
          { timeout: 25000, stdio: 'ignore' }
        );

        // Copiar también a docs
        if (fs.existsSync(canonPngPath)) {
          fs.copyFileSync(canonPngPath, docsPngPath);
        }
      } catch (err) {
        console.error(`Error al renderizar PNG para ${cfg.canonicalName}:`, err.message);
      }
    }

    generados++;
    console.log(`[${generados}/24] ${cfg.cu} ${cfg.type} OK -> ${cfg.canonicalName}.png`);
  }

  console.log(`\n¡Generación completada exitosamente! ${generados} diagramas procesados.`);
}

main().catch((err) => {
  console.error('Error fatal durante la generación:', err);
  process.exit(1);
});
