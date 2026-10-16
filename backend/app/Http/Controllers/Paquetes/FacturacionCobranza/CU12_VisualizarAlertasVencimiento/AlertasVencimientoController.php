<?php

namespace App\Http\Controllers\Paquetes\FacturacionCobranza\CU12_VisualizarAlertasVencimiento;

use App\Http\Controllers\Controller;
use App\Models\Paquetes\FacturacionCobranza\CU09_GenerarMensualidades\MensualidadFacturacion;
use App\Models\Paquetes\FacturacionCobranza\CU12_VisualizarAlertasVencimiento\AlertaVencimiento;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AlertasVencimientoController extends Controller
{
    use ApiResponse;

    /**
     * CU12 - Visualizar alertas de vencimiento (calculadas en tiempo real o almacenadas)
     */
    public function index(Request $request): JsonResponse
    {
        $hoy = Carbon::today();

        // Facturas vencidas no pagadas
        $vencidas = MensualidadFacturacion::with(['cliente', 'servicio'])
            ->where('estado_pago', '!=', 'PAGADO')
            ->where('fecha_vencimiento', '<=', $hoy)
            ->orderBy('fecha_vencimiento', 'asc')
            ->get()
            ->map(function ($fac) use ($hoy) {
                $dias = (int) $hoy->diffInDays(Carbon::parse($fac->fecha_vencimiento));
                return [
                    'mensualidad_id'    => $fac->id,
                    'codigo_factura'    => $fac->codigo_factura,
                    'cliente'           => $fac->cliente->nombres . ' ' . $fac->cliente->apellidos,
                    'servicio'          => $fac->servicio->plan_nombre,
                    'monto'             => $fac->monto,
                    'fecha_vencimiento' => $fac->fecha_vencimiento->format('Y-m-d'),
                    'dias_retraso'      => $dias,
                    'severidad'         => $dias > 15 ? 'CRITICA' : ($dias > 5 ? 'ALTA' : 'MEDIA'),
                ];
            });

        return $this->success([
            'total_alertas' => $vencidas->count(),
            'alertas'       => $vencidas,
        ], 'Alertas de vencimiento obtenidas exitosamente.');
    }
}
