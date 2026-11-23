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
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReporteTradicionalController extends Controller
{
    use ApiResponse;

    /**
     * CU27 - Catálogo de reportes tradicionales disponibles.
     */
    public function catalogo(): JsonResponse
    {
        $catalogo = ReporteTradicional::catalogo();

        return $this->success($catalogo, 'Catálogo de reportes consultado correctamente.');
    }

    /**
     * CU27 - Parámetros auxiliares para filtros (zonas, métodos de pago, etc.).
     */
    public function parametros(): JsonResponse
    {
        $zonas = Zona::query()->select(['idZona as id', 'nombreZona as nombre', 'codigo'])->get();
        $metodos = MetodoPago::query()->select(['idMetodoPago as id', 'nombreMetodo as nombre'])->get();

        return $this->success([
            'zonas'   => $zonas,
            'metodos' => $metodos,
            'estadosCliente' => ['ACTIVO', 'INACTIVO', 'SUSPENDIDO'],
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

        // Registro obligatorio en la bitácora de auditoría (Paso 10 del CU27)
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
     * CU27 - Exportar reporte a formato Excel (.csv compatible con formato tabular MS Excel).
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
        ]);

        $tipo = $filtros['tipo_reporte'];
        $reporte = ReporteTradicional::generar($tipo, $filtros);
        $registros = $reporte['registros'];

        // Bitácora de exportación
        AuditLogger::log(
            'CU27',
            'EXPORTAR_EXCEL',
            "Exportación a Excel del reporte '{$reporte['titulo']}' (" . count($registros) . " registros).",
            null,
            ['tipo' => $tipo, 'formato' => 'EXCEL']
        );

        $filename = "TELCOM_Reporte_{$tipo}_" . date('Ymd_His') . ".csv";

        return response()->streamDownload(function () use ($reporte, $registros, $tipo) {
            $handle = fopen('php://output', 'w');
            // BOM UTF-8 para visualización correcta de tildes y caracteres en Excel en español
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));

            fputcsv($handle, ['SISTEMA DE TELECOMUNICACIONES TELCOM - REPORTE OFICIAL'], ';');
            fputcsv($handle, [$reporte['titulo']], ';');
            fputcsv($handle, ['Fecha de emisión:', date('d/m/Y H:i:s')], ';');
            fputcsv($handle, []);

            if ($tipo === ReporteTradicional::TIPO_CLIENTES_ZONA) {
                fputcsv($handle, ['Código Cliente', 'C.I.', 'Nombre Completo', 'Teléfono', 'Correo', 'Zona', 'Barrio', 'Estado', 'Servicios Activos'], ';');
                foreach ($registros as $r) {
                    fputcsv($handle, [
                        $r->codigoCliente,
                        $r->ci ?? '-',
                        $r->nombreCompleto,
                        $r->telefonoPrincipal ?? '-',
                        $r->correo ?? '-',
                        $r->nombreZona ?? '-',
                        $r->barrioZona ?? '-',
                        $r->estadoCliente,
                        $r->totalServicios,
                    ], ';');
                }
            } elseif ($tipo === ReporteTradicional::TIPO_INGRESOS_PAGOS) {
                fputcsv($handle, ['N° Comprobante', 'Fecha y Hora', 'Cliente', 'Código Abonado', 'Período', 'Método Pago', 'Monto (Bs.)', 'Cajero'], ';');
                foreach ($registros as $r) {
                    fputcsv($handle, [
                        $r->numeroComprobante,
                        $r->fechaHora,
                        $r->clienteNombre ?? '-',
                        $r->codigoCliente ?? '-',
                        $r->periodo ?? '-',
                        $r->nombreMetodo,
                        number_format((float)$r->montoTotal, 2, '.', ''),
                        $r->nombreCajero ?? '-',
                    ], ';');
                }
                fputcsv($handle, []);
                fputcsv($handle, ['TOTAL RECAUDADO (Bs.):', '', '', '', '', '', number_format($reporte['kpis']['total_recaudado'], 2, '.', '')], ';');
            } elseif ($tipo === ReporteTradicional::TIPO_MOROSIDAD_CORTES) {
                fputcsv($handle, ['Factura N°', 'Abonado', 'C.I.', 'Código Servicio', 'Zona', 'Plan', 'Período', 'Vencimiento', 'Monto Mora (Bs.)', 'Estado Servicio'], ';');
                foreach ($registros as $r) {
                    fputcsv($handle, [
                        $r->codigoFactura,
                        $r->clienteNombre,
                        $r->clienteCi ?? '-',
                        $r->codigoServicio,
                        $r->nombreZona ?? '-',
                        $r->nombrePlan ?? '-',
                        $r->periodo,
                        $r->fechaVencimiento,
                        number_format((float)$r->monto, 2, '.', ''),
                        $r->estadoServicio ?? '-',
                    ], ';');
                }
                fputcsv($handle, []);
                fputcsv($handle, ['DEUDA TOTAL ACUMULADA (Bs.):', '', '', '', '', '', '', '', number_format($reporte['kpis']['total_deuda'], 2, '.', '')], ';');
            } else {
                if (($reporte['subtipo'] ?? '') === 'instalaciones') {
                    fputcsv($handle, ['N° Instalación', 'Abonado', 'Código Servicio', 'Técnico Responsable', 'Fecha Realizada', 'Estado', 'Costo (Bs.)', 'Observación'], ';');
                    foreach ($registros as $r) {
                        fputcsv($handle, [
                            $r->idInstalacion,
                            $r->clienteNombre ?? '-',
                            $r->codigoServicio ?? '-',
                            $r->tecnicoNombre ?? '-',
                            $r->fechaRealizada ?? '-',
                            $r->estadoInstalacion ?? '-',
                            number_format((float)($r->costoInstalacion ?? 0), 2, '.', ''),
                            $r->observacion ?? '-',
                        ], ';');
                    }
                } else {
                    fputcsv($handle, ['Serie Equipo', 'MAC', 'Modelo / Marca', 'Tipo', 'Abonado', 'Código Servicio', 'Fecha Asignación', 'Estado Equipo'], ';');
                    foreach ($registros as $r) {
                        fputcsv($handle, [
                            $r->numeroSerie,
                            $r->mac ?? '-',
                            ($r->marca ?? '') . ' ' . ($r->modelo ?? ''),
                            $r->tipoEquipo ?? '-',
                            $r->clienteNombre ?? '-',
                            $r->codigoServicio ?? '-',
                            $r->fechaAsignacion ?? '-',
                            $r->estadoEquipo ?? '-',
                        ], ';');
                    }
                }
            }

            fclose($handle);
        }, $filename, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * CU27 - Exportar reporte a formato PDF / Imprimible Oficial TELCOM.
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
        ]);

        $tipo = $filtros['tipo_reporte'];
        $reporte = ReporteTradicional::generar($tipo, $filtros);

        AuditLogger::log(
            'CU27',
            'EXPORTAR_PDF',
            "Generación de documento PDF imprimible para '{$reporte['titulo']}'.",
            null,
            ['tipo' => $tipo, 'formato' => 'PDF']
        );

        return $this->success([
            'reporte'          => $reporte,
            'titulo'           => $reporte['titulo'],
            'empresa'          => 'TELCOM ISP Bolivia',
            'nit'              => '1029384756',
            'direccion'        => 'Av. San Martín #450, Equipetrol, Santa Cruz de la Sierra',
            'fechaGeneracion'  => date('d/m/Y H:i:s'),
            'usuarioGenerador' => auth()->user()?->nombreCompleto ?? 'Administrador TELCOM',
        ], 'Estructura lista para exportación a PDF.');
    }
}
