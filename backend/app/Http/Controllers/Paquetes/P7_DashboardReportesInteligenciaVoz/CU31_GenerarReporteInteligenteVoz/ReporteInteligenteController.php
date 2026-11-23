<?php

namespace App\Http\Controllers\Paquetes\P7_DashboardReportesInteligenciaVoz\CU31_GenerarReporteInteligenteVoz;

use App\Http\Controllers\Controller;
use App\Services\Paquetes\P7_DashboardReportesInteligenciaVoz\CU31_GenerarReporteInteligenteVoz\CatalogoReportesService;
use App\Services\Paquetes\P7_DashboardReportesInteligenciaVoz\CU31_GenerarReporteInteligenteVoz\GeminiIntencionService;
use App\Services\Paquetes\P7_DashboardReportesInteligenciaVoz\CU31_GenerarReporteInteligenteVoz\ReporteInteligenteException;
use App\Support\AuditLogger;
use App\Traits\ApiResponse;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ReporteInteligenteController extends Controller
{
    use ApiResponse;

    public function generar(Request $request, GeminiIntencionService $gemini, CatalogoReportesService $catalogo): JsonResponse
    {
        if (array_diff(array_keys($request->all()), ['comando', 'intencion'])) {
            throw ValidationException::withMessages(['solicitud' => 'Solo se aceptan comando e intencion.']);
        }
        $datos = $request->validate([
            'comando' => ['required_without:intencion', 'nullable', 'string', 'min:3', 'max:1000'],
            'intencion' => ['required_without:comando', 'nullable', 'array'],
        ], [
            'comando.required_without' => 'Introduce un comando o envía una intención estructurada.',
            'intencion.required_without' => 'Introduce un comando o envía una intención estructurada.',
            'comando.string' => 'El comando debe ser texto ya transcrito.',
            'comando.min' => 'El comando debe tener al menos 3 caracteres.',
            'comando.max' => 'El comando no puede superar 1000 caracteres.',
            'intencion.array' => 'La intención debe ser un objeto con tipo y filtros.',
        ]);

        try {
            // CU30 puede omitir comando y la key: una intención suministrada nunca se reinterpreta.
            $origen = isset($datos['intencion']) ? 'estructurada' : 'gemini';
            $intencion = $datos['intencion'] ?? $gemini->interpretar(trim($datos['comando']));
            $reporte = $catalogo->generar($intencion);
        } catch (ReporteInteligenteException $e) {
            return $this->error($e->getMessage(), $e->estadoHttp, ['codigo' => $e->codigo]);
        } catch (QueryException) {
            // Evita que APP_DEBUG exponga consultas, bindings o información de conexión.
            return $this->error('No se pudieron consultar los datos del reporte. Inténtalo más tarde.', 503, ['codigo' => 'REPORTE_DATOS_NO_DISPONIBLES']);
        }

        // Fuera de la transacción de lectura: solo metadatos, sin comando, filas o credenciales.
        AuditLogger::log('CU31', 'GENERAR_REPORTE_INTELIGENTE', 'Reporte generado: '.$reporte['tipo'], null, [
            'tipo' => $reporte['tipo'],
            'origen' => $origen,
            'filtros' => (array) $reporte['filtros'],
            'filas_devueltas' => count($reporte['filas']),
            'truncado' => $reporte['truncado'],
        ]);

        return $this->success([
            'interpretacion' => ['origen' => $origen, 'tipo' => $reporte['tipo'], 'filtros' => $reporte['filtros']],
            'reporte' => $reporte,
        ], 'Reporte generado correctamente.');
    }
}
