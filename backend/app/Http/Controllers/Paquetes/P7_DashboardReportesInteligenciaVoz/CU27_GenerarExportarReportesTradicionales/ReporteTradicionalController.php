<?php

namespace App\Http\Controllers\Paquetes\P7_DashboardReportesInteligenciaVoz\CU27_GenerarExportarReportesTradicionales;

use App\Http\Controllers\Controller;
use App\Models\Paquetes\P7_DashboardReportesInteligenciaVoz\CU27_GenerarExportarReportesTradicionales\ReporteTradicional;
use App\Models\Paquetes\P4_FacturacionCobranza\CU10_GestionarPagoMensualidad\MetodoPago;
use App\Models\Paquetes\P2_GestionClientesZonas\CU04_ZonasCobertura\Zona;
use App\Support\AuditLogger;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class ReporteTradicionalController extends Controller
{
    use ApiResponse;

    /**
     * Diccionario canónico de columnas disponibles por tipo de reporte para exportación dinámica.
     */
    public const DICCIONARIO_COLUMNAS = [
        'clientes_zona' => [
            'codigoCliente'     => 'Código Cliente',
            'ci'                => 'C.I.',
            'nombreCompleto'    => 'Nombre Completo',
            'telefonoPrincipal' => 'Teléfono',
            'correo'            => 'Correo',
            'nombreZona'        => 'Zona',
            'barrioZona'        => 'Barrio',
            'estadoCliente'     => 'Estado',
            'totalServicios'    => 'Servicios Activos',
        ],
        'ingresos_pagos' => [
            'numeroComprobante' => 'N° Comprobante',
            'fechaHora'         => 'Fecha y Hora',
            'clienteNombre'     => 'Cliente',
            'codigoCliente'     => 'Código Abonado',
            'periodo'           => 'Período',
            'nombreMetodo'      => 'Método Pago',
            'montoTotal'        => 'Monto (Bs.)',
            'nombreCajero'      => 'Cajero',
        ],
        'morosidad_cortes' => [
            'codigoFactura'     => 'Factura N°',
            'clienteNombre'     => 'Abonado',
            'clienteCi'         => 'C.I.',
            'codigoServicio'    => 'Código Servicio',
            'nombreZona'        => 'Zona',
            'nombrePlan'        => 'Plan',
            'periodo'           => 'Período',
            'fechaVencimiento'  => 'Vencimiento',
            'monto'             => 'Monto Mora (Bs.)',
            'estadoServicio'    => 'Estado Servicio',
        ],
        'equipos_instalaciones' => [
            'codigo'            => 'Identificador / Serie',
            'cliente'           => 'Abonado',
            'servicio'          => 'Código Servicio',
            'detalle'           => 'Detalle / Modelo',
            'tipo'              => 'Tipo',
            'fecha'             => 'Fecha',
            'responsable'       => 'Técnico / Responsable',
            'estado'            => 'Estado',
            'costo'             => 'Costo (Bs.)',
        ],
    ];

    /**
     * CU27 - Catálogo de reportes tradicionales disponibles.
     */
    public function catalogo(): JsonResponse
    {
        $catalogo = ReporteTradicional::catalogo();

        return $this->success($catalogo, 'Catálogo de reportes consultado correctamente.');
    }

    /**
     * CU27 - Diccionario de columnas configurables para selección dinámica por voz/escritura.
     */
    public function columnas(): JsonResponse
    {
        return $this->success(
            self::DICCIONARIO_COLUMNAS,
            'Diccionario de columnas exportables consultado correctamente.'
        );
    }

    /**
     * CU27 - Parámetros auxiliares para filtros (zonas, métodos de pago, etc.).
     */
    public function parametros(): JsonResponse
    {
        $zonas = Zona::query()->select(['idZona as id', 'nombreZona as nombre', 'codigo'])->get();
        $metodos = MetodoPago::query()->select(['idMetodoPago as id', 'nombreMetodo as nombre'])->get();

        return $this->success([
            'zonas'          => $zonas,
            'metodos'        => $metodos,
            'estadosCliente' => ['ACTIVO', 'INACTIVO', 'SUSPENDIDO'],
            'columnas'       => self::DICCIONARIO_COLUMNAS,
        ], 'Parámetros de filtrado obtenidos.');
    }

    /**
     * CU27 - Generar reporte tradicional consolidado con filtros y auditoría.
     */
    public function generar(Request $request): JsonResponse
    {
        $filtros = $request->validate([
            'tipo_reporte'     => ['required', 'string', 'in:clientes_zona,ingresos_pagos,morosidad_cortes,equipos_instalaciones'],
            'fecha_desde'      => ['nullable', 'date'],
            'fecha_hasta'      => ['nullable', 'date', 'after_or_equal:fecha_desde'],
            'zona_id'          => ['nullable', 'integer'],
            'estado_cliente'   => ['nullable', 'string', 'max:30'],
            'metodo_pago'      => ['nullable', 'string', 'max:50'],
            'tipo_subreporte'  => ['nullable', 'string', 'in:comodatos,instalaciones'],
            'buscar'           => ['nullable', 'string', 'max:120'],
        ], [
            'fecha_hasta.after_or_equal' => 'El rango de fechas es inválido: la fecha final no puede ser anterior a la inicial.',
            'tipo_reporte.in'            => 'El tipo de reporte solicitado no es válido.',
        ]);

        $tipo = $filtros['tipo_reporte'];
        $reporte = ReporteTradicional::generar($tipo, $filtros);

        AuditLogger::log(
            'CU27',
            'GENERAR_REPORTE',
            "Generación de reporte tradicional: '{$reporte['titulo']}' con " . count($reporte['registros']) . " registros.",
            null,
            [
                'tipo_reporte' => $tipo,
                'filtros'      => array_filter($filtros),
                'total'        => count($reporte['registros']),
            ]
        );

        $mensaje = count($reporte['registros']) > 0
            ? 'Reporte generado exitosamente.'
            : 'No se encontraron registros para los filtros seleccionados.';

        return $this->success($reporte, $mensaje);
    }

    /**
     * CU27 - Exportar reporte a formato Excel (.csv compatible) con SELECCIÓN DINÁMICA DE COLUMNAS.
     */
    public function exportarExcel(Request $request): StreamedResponse|JsonResponse
    {
        $filtros = $request->validate([
            'tipo_reporte'     => ['required', 'string', 'in:clientes_zona,ingresos_pagos,morosidad_cortes,equipos_instalaciones'],
            'fecha_desde'      => ['nullable', 'date'],
            'fecha_hasta'      => ['nullable', 'date'],
            'zona_id'          => ['nullable', 'integer'],
            'estado_cliente'   => ['nullable', 'string'],
            'metodo_pago'      => ['nullable', 'string'],
            'tipo_subreporte'  => ['nullable', 'string'],
            'buscar'           => ['nullable', 'string'],
            'columnas'         => ['nullable'],
        ]);

        $tipo = $filtros['tipo_reporte'];
        $reporte = ReporteTradicional::generar($tipo, $filtros);
        $registros = $reporte['registros'];

        // Procesar columnas dinámicas seleccionadas
        $columnasSeleccionadas = $this->procesarColumnasDeseadas($request->input('columnas'), $tipo);

        AuditLogger::log(
            'CU27',
            'EXPORTAR_EXCEL',
            "Exportación a Excel del reporte '{$reporte['titulo']}' (" . count($registros) . " registros). Columnas: " . implode(',', array_keys($columnasSeleccionadas)),
            null,
            ['tipo' => $tipo, 'formato' => 'EXCEL', 'columnas' => array_keys($columnasSeleccionadas)]
        );

        $filename = "TELCOM_Reporte_{$tipo}_" . date('Ymd_His') . ".csv";

        return response()->streamDownload(function () use ($reporte, $registros, $tipo, $columnasSeleccionadas) {
            $handle = fopen('php://output', 'w');
            // BOM UTF-8 para visualización correcta de tildes y caracteres en Excel en español
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));

            fputcsv($handle, ['SISTEMA DE TELECOMUNICACIONES TELCOM - REPORTE OFICIAL DINÁMICO'], ';');
            fputcsv($handle, [$reporte['titulo']], ';');
            fputcsv($handle, ['Fecha de emisión:', date('d/m/Y H:i:s')], ';');
            fputcsv($handle, ['Columnas exportadas:', implode(', ', array_values($columnasSeleccionadas))], ';');
            fputcsv($handle, []);

            // Encabezados dinámicos
            fputcsv($handle, array_values($columnasSeleccionadas), ';');

            // Filas con mapeo dinámico
            foreach ($registros as $r) {
                $fila = [];
                foreach (array_keys($columnasSeleccionadas) as $colKey) {
                    $fila[] = $this->obtenerValorColumna($r, $colKey, $tipo);
                }
                fputcsv($handle, $fila, ';');
            }

            // Pie de totales si aplica
            fputcsv($handle, []);
            if ($tipo === ReporteTradicional::TIPO_INGRESOS_PAGOS && isset($reporte['kpis']['total_recaudado'])) {
                fputcsv($handle, ['TOTAL RECAUDADO (Bs.):', number_format($reporte['kpis']['total_recaudado'], 2, '.', '')], ';');
            } elseif ($tipo === ReporteTradicional::TIPO_MOROSIDAD_CORTES && isset($reporte['kpis']['total_deuda'])) {
                fputcsv($handle, ['DEUDA TOTAL ACUMULADA (Bs.):', number_format($reporte['kpis']['total_deuda'], 2, '.', '')], ';');
            }

            fclose($handle);
        }, $filename, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * CU27 - Exportar reporte a formato PDF con columnas seleccionadas.
     */
    public function exportarPdf(Request $request): JsonResponse
    {
        $filtros = $request->validate([
            'tipo_reporte'     => ['required', 'string', 'in:clientes_zona,ingresos_pagos,morosidad_cortes,equipos_instalaciones'],
            'fecha_desde'      => ['nullable', 'date'],
            'fecha_hasta'      => ['nullable', 'date'],
            'zona_id'          => ['nullable', 'integer'],
            'estado_cliente'   => ['nullable', 'string'],
            'metodo_pago'      => ['nullable', 'string'],
            'tipo_subreporte'  => ['nullable', 'string'],
            'buscar'           => ['nullable', 'string'],
            'columnas'         => ['nullable'],
        ]);

        $tipo = $filtros['tipo_reporte'];
        $reporte = ReporteTradicional::generar($tipo, $filtros);

        $columnasSeleccionadas = $this->procesarColumnasDeseadas($request->input('columnas'), $tipo);

        AuditLogger::log(
            'CU27',
            'EXPORTAR_PDF',
            "Generación de documento PDF imprimible para '{$reporte['titulo']}'.",
            null,
            ['tipo' => $tipo, 'formato' => 'PDF', 'columnas' => array_keys($columnasSeleccionadas)]
        );

        return $this->success([
            'reporte'               => $reporte,
            'titulo'                => $reporte['titulo'],
            'empresa'               => 'TELCOM ISP Bolivia',
            'nit'                   => '1029384756',
            'direccion'             => 'Av. San Martín #450, Equipetrol, Santa Cruz de la Sierra',
            'fechaGeneracion'       => date('d/m/Y H:i:s'),
            'usuarioGenerador'      => auth()->user()?->nombreCompleto ?? 'Administrador TELCOM',
            'columnas_seleccionadas'=> $columnasSeleccionadas,
        ], 'Estructura lista para exportación a PDF.');
    }

    /**
     * CU27 / CU31 - Generar análisis ejecutivo con Inteligencia Artificial (Gemini) y síntesis auditiva TTS.
     */
    public function analisisIa(Request $request): JsonResponse
    {
        $filtros = $request->validate([
            'tipo_reporte'     => ['required', 'string', 'in:clientes_zona,ingresos_pagos,morosidad_cortes,equipos_instalaciones'],
            'fecha_desde'      => ['nullable', 'date'],
            'fecha_hasta'      => ['nullable', 'date'],
            'zona_id'          => ['nullable', 'integer'],
            'estado_cliente'   => ['nullable', 'string'],
            'metodo_pago'      => ['nullable', 'string'],
            'tipo_subreporte'  => ['nullable', 'string'],
            'buscar'           => ['nullable', 'string'],
        ]);

        $tipo = $filtros['tipo_reporte'];
        $reporte = ReporteTradicional::generar($tipo, $filtros);
        $kpis = $reporte['kpis'] ?? [];
        $total = count($reporte['registros'] ?? []);

        // Intento con Gemini si la API key está disponible
        $analisis = $this->generarAnalisisConGemini($reporte, $tipo, $filtros);

        if (! $analisis) {
            // Heurística ejecutiva de alta fidelidad cuando no hay conexión o no hay API key
            $analisis = $this->generarAnalisisHeuristico($reporte, $tipo);
        }

        return $this->success($analisis, 'Análisis ejecutivo generado exitosamente.');
    }

    /**
     * Resolución de columnas para exportación dinámica.
     */
    private function procesarColumnasDeseadas($columnasInput, string $tipo): array
    {
        $diccionario = self::DICCIONARIO_COLUMNAS[$tipo] ?? [];

        if (empty($columnasInput)) {
            return $diccionario;
        }

        $deseadas = is_array($columnasInput)
            ? $columnasInput
            : array_filter(array_map('trim', explode(',', (string) $columnasInput)));

        if (empty($deseadas)) {
            return $diccionario;
        }

        $filtradas = [];
        foreach ($deseadas as $key) {
            if (isset($diccionario[$key])) {
                $filtradas[$key] = $diccionario[$key];
            }
        }

        return ! empty($filtradas) ? $filtradas : $diccionario;
    }

    /**
     * Mapeo de valores de celda según clave de columna.
     */
    private function obtenerValorColumna(object $row, string $colKey, string $tipo): string
    {
        // Casos unificados para equipos e instalaciones
        if ($tipo === ReporteTradicional::TIPO_EQUIPOS_INSTALACIONES) {
            return match ($colKey) {
                'codigo'      => (string) ($row->numeroSerie ?? $row->idInstalacion ?? '-'),
                'cliente'     => (string) ($row->clienteNombre ?? '-'),
                'servicio'    => (string) ($row->codigoServicio ?? '-'),
                'detalle'     => (string) (($row->marca ?? '') . ' ' . ($row->modelo ?? '') ?: ($row->observacion ?? '-')),
                'tipo'        => (string) ($row->tipoEquipo ?? 'Instalación'),
                'fecha'       => (string) ($row->fechaAsignacion ?? $row->fechaRealizada ?? '-'),
                'responsable' => (string) ($row->tecnicoNombre ?? 'Almacén'),
                'estado'      => (string) ($row->estadoEquipo ?? $row->estadoInstalacion ?? '-'),
                'costo'       => isset($row->costoInstalacion) ? number_format((float) $row->costoInstalacion, 2, '.', '') : '0.00',
                default       => (string) ($row->{$colKey} ?? '-'),
            };
        }

        // Formateo de montos numéricos
        if (in_array($colKey, ['montoTotal', 'monto'], true)) {
            return number_format((float) ($row->{$colKey} ?? 0), 2, '.', '');
        }

        return (string) ($row->{$colKey} ?? '-');
    }

    /**
     * Generación de análisis ejecutivo mediante Google Gemini API.
     */
    private function generarAnalisisConGemini(array $reporte, string $tipo, array $filtros): ?array
    {
        $key = trim((string) config('services.gemini.key'));
        $model = trim((string) config('services.gemini.model', 'gemini-1.5-flash'));

        if (empty($key)) {
            return null;
        }

        $resumenKpis = json_encode($reporte['kpis'] ?? [], JSON_UNESCAPED_UNICODE);
        $registrosCol = collect($reporte['registros'] ?? []);
        $totalFilas = $registrosCol->count();
        $muestra = json_encode($registrosCol->take(5)->values()->toArray(), JSON_UNESCAPED_UNICODE);

        $prompt = <<<PROMPT
Eres el Asesor Senior de Inteligencia Financiera y Operativa de TELCOM (Proveedor de Internet ISP en Bolivia).
Analiza el siguiente reporte del sistema:
- Tipo: {$tipo}
- Título: {$reporte['titulo']}
- Registros totales: {$totalFilas}
- Métricas KPIs: {$resumenKpis}
- Muestra de datos: {$muestra}

Devuelve ÚNICAMENTE un JSON válido con este formato:
{
  "resumen_ejecutivo": "Diagnóstico de 1 o 2 oraciones clave sobre la salud comercial u operativa.",
  "puntos_clave": [
    "Punto clave 1 con cifras",
    "Punto clave 2 con cifras",
    "Punto clave 3 con cifras"
  ],
  "alerta_riesgo": "Alerta crítica o prevención inmediata (morosidad, bajas, o retrasos)",
  "recomendacion": "Recomendación accionable inmediata para el Administrador",
  "narrativa_tts": "Párrafo breve, fluido y elocuente en español latino (máximo 60 palabras) optimizado para ser leído por voz alta con síntesis de voz."
}
PROMPT;

        try {
            $response = Http::acceptJson()
                ->withHeaders(['x-goog-api-key' => $key])
                ->timeout(12)
                ->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent", [
                    'contents' => [['parts' => [['text' => $prompt]]]],
                    'generationConfig' => [
                        'responseMimeType' => 'application/json',
                        'maxOutputTokens'  => 1024,
                    ],
                ]);

            if ($response->successful()) {
                $candidates = $response->json('candidates.0.content.parts.0.text');
                if ($candidates) {
                    $parsed = json_decode($candidates, true);
                    if (is_array($parsed) && isset($parsed['resumen_ejecutivo'])) {
                        return $parsed;
                    }
                }
            }
        } catch (Throwable) {
            // Silenciar fallo y usar fallback heurístico
        }

        return null;
    }

    /**
     * Fallback heurístico de análisis gerencial cuando Gemini no está configurado o no responde.
     */
    private function generarAnalisisHeuristico(array $reporte, string $tipo): array
    {
        $kpis = $reporte['kpis'] ?? [];
        $total = count($reporte['registros'] ?? []);

        switch ($tipo) {
            case ReporteTradicional::TIPO_CLIENTES_ZONA:
                $activos = $kpis['clientes_activos'] ?? 0;
                $inactivos = $kpis['clientes_inactivos'] ?? 0;
                $pct = $total > 0 ? round(($activos / $total) * 100, 1) : 0;
                return [
                    'resumen_ejecutivo' => "La cartera comercial cuenta con {$total} abonados registrados, con una tasa de retención activa del {$pct}%.",
                    'puntos_clave'      => [
                        "{$activos} clientes mantienen servicios vigentes y en operación regular.",
                        "{$inactivos} abonados se encuentran en estado inactivo o con baja lógica registrada.",
                        "Se identifican {$kpis['servicios_activos']} conexiones activas distribuidas en los nodos.",
                    ],
                    'alerta_riesgo'     => $inactivos > 0 ? "Existen {$inactivos} clientes inactivos con potencial de reactivación o recuperación de comodatos." : 'No se observan riesgos inmediatos en la cartera de abonados.',
                    'recomendacion'     => 'Focalizar campañas de fidelización en zonas con mayor densidad de servicios para consolidar el ARPU.',
                    'narrativa_tts'     => "Señor Administrador, el reporte de clientes registra {$total} abonados con un {$pct}% de retención activa. Le sugerimos revisar los clientes inactivos para reactivación comercial.",
                ];

            case ReporteTradicional::TIPO_INGRESOS_PAGOS:
                $recaudado = number_format((float) ($kpis['total_recaudado'] ?? 0), 2);
                $transacciones = $kpis['total_transacciones'] ?? $total;
                $promedio = number_format((float) ($kpis['promedio_pago'] ?? 0), 2);
                return [
                    'resumen_ejecutivo' => "La recaudación acumulada alcanza Bs. {$recaudado} a través de {$transacciones} transacciones efectivas.",
                    'puntos_clave'      => [
                        "Total recaudado efectivamente: Bs. {$recaudado}.",
                        "Ticket promedio por cobranza registrado: Bs. {$promedio}.",
                        "Total de recibos y facturas canceladas: {$transacciones} operaciones.",
                    ],
                    'alerta_riesgo'     => 'Monitorear la concentración de pagos en ventanilla e incentivar canales digitales como QR para agilizar la cobranza.',
                    'recomendacion'     => 'Mantener el flujo de conciliación diaria con los cajeros y validar comprobantes de transferencias bancarias.',
                    'narrativa_tts'     => "Señor Administrador, la recaudación auditada totaliza {$recaudado} Bolivianos mediante {$transacciones} pagos registrados. El ticket promedio de cobranza es de {$promedio} Bolivianos.",
                ];

            case ReporteTradicional::TIPO_MOROSIDAD_CORTES:
                $deuda = number_format((float) ($kpis['total_deuda'] ?? 0), 2);
                $enMora = $kpis['clientes_en_mora'] ?? $total;
                return [
                    'resumen_ejecutivo' => "Se registran {$enMora} servicios en mora acumulada que representan una cartera por cobrar de Bs. {$deuda}.",
                    'puntos_clave'      => [
                        "Cartera vencida total acumulada: Bs. {$deuda}.",
                        "Abonados afectados por mora de pago: {$enMora} clientes.",
                        "Total de facturas emitidas sin conciliar: {$kpis['total_facturas_mora']}.",
                    ],
                    'alerta_riesgo'     => "Cartera en riesgo crítico de Bs. {$deuda}. Se recomienda programar cuadrillas de corte preventivo.",
                    'recomendacion'     => 'Notificar a los abonados con más de dos facturas pendientes vía WhatsApp y programar cortes en caso de incumplimiento.',
                    'narrativa_tts'     => "Atención: Se detectó una morosidad de {$deuda} Bolivianos distribuida en {$enMora} abonados. Se recomienda ejecutar notificaciones y cortes preventivos inmediatos.",
                ];

            case ReporteTradicional::TIPO_EQUIPOS_INSTALACIONES:
            default:
                return [
                    'resumen_ejecutivo' => "Se auditaron {$total} registros entre asignaciones de equipamiento técnico y órdenes ejecutadas en campo.",
                    'puntos_clave'      => [
                        "Volumen total de movimientos de hardware y campo: {$total} registros.",
                        "Trazabilidad de equipos e instalaciones registrada con firma técnica.",
                        "Equipamiento en comodato vinculado directamente al código de abonado.",
                    ],
                    'alerta_riesgo'     => 'Verificar que las órdenes técnicas finalizadas cuenten con el serial del equipo actualizado en inventario.',
                    'recomendacion'     => 'Realizar auditorías periódicas de stock en almacén para asegurar disponibilidad ante nuevas instalaciones.',
                    'narrativa_tts'     => "El informe de infraestructura registra {$total} operaciones técnicas. El inventario y las órdenes técnicas se encuentran sincronizadas.",
                ];
        }
    }
}
