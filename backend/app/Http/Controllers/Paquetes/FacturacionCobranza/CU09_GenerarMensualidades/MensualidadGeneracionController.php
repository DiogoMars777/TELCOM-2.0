<?php

namespace App\Http\Controllers\Paquetes\FacturacionCobranza\CU09_GenerarMensualidades;

use App\Http\Controllers\Controller;
use App\Models\Paquetes\FacturacionCobranza\CU09_GenerarMensualidades\MensualidadFacturacion;
use App\Services\Paquetes\FacturacionCobranza\CU09_GenerarMensualidades\MensualidadGeneracionService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MensualidadGeneracionController extends Controller
{
    use ApiResponse;

    /**
     * CU09 - Listar mensualidades generadas
     */
    public function index(Request $request): JsonResponse
    {
        $periodo = $request->input('periodo', now()->format('Y-m'));

        $mensualidades = MensualidadFacturacion::with(['cliente', 'servicio.asignacionPlanActual.plan'])
            ->where('periodo', $periodo)
            ->latest('idMensualidad')
            ->paginate(20);

        return $this->success($mensualidades, "Mensualidades del período {$periodo} obtenidas.");
    }

    /**
     * CU09 - Generación masiva o individual de mensualidades del período
     */
    public function generar(Request $request, MensualidadGeneracionService $generador): JsonResponse
    {
        $validated = $request->validate([
            'periodo' => 'required|date_format:Y-m',
        ]);

        $periodo = $validated['periodo'];
        $resultado = $generador->generar($periodo);
        $mensaje = "Se generaron exitosamente {$resultado['generadas']} mensualidades para el período {$periodo}.";
        if ($resultado['omitidas'] > 0) {
            $mensaje .= " Servicios omitidos: {$resultado['omitidas']} por tarifa inválida o datos incompletos.";
        }

        return $this->success($resultado, $mensaje);
    }
}
