<?php

namespace App\Http\Controllers\Paquetes\P7_DashboardReportesInteligenciaVoz\CU26_VisualizarDashboardAdminFinanciero;

use App\Http\Controllers\Controller;
use App\Services\Paquetes\P7_DashboardReportesInteligenciaVoz\CU26_VisualizarDashboardAdminFinanciero\DashboardMetricasService;
use App\Support\AuditLogger;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardAdminFinancieroController extends Controller
{
    use ApiResponse;

    protected DashboardMetricasService $service;

    public function __construct(DashboardMetricasService $service)
    {
        $this->service = $service;
    }

    /**
     * CU26 - Obtener el consolidado general del Dashboard Administrativo y Financiero.
     */
    public function index(Request $request): JsonResponse
    {
        $periodo = $request->query('periodo', 'mes_actual');
        $datos = $this->service->obtenerResumenCompleto($periodo);

        // Registro de auditoría (CU02)
        AuditLogger::log(
            'CU26',
            'CONSULTAR_DASHBOARD',
            'Consulta del Dashboard administrativo y financiero (' . ($datos['periodo_seleccionado'] ?? 'General') . ').',
            null,
            ['periodo' => $periodo, 'total_recaudado' => $datos['financiero']['total_recaudado'] ?? 0]
        );

        return $this->success($datos, 'Dashboard administrativo y financiero obtenido con éxito.');
    }

    /**
     * CU26 - Métricas financieras específicas y evolución temporal.
     */
    public function financiero(Request $request): JsonResponse
    {
        $periodo = $request->query('periodo', 'mes_actual');
        $datos = $this->service->obtenerResumenCompleto($periodo);

        return $this->success([
            'periodo'           => $datos['periodo_seleccionado'],
            'kpis_financieros'  => $datos['financiero'],
            'evolucion_mensual' => $datos['evolucion_mensual'],
            'metodos_pago'      => $datos['metodos_pago'],
            'ingresos_por_plan' => $datos['planes_distribucion'],
        ], 'Métricas financieras obtenidas exitosamente.');
    }

    /**
     * CU26 - Métricas operativas, distribución de zonas y cuadrillas técnicas.
     */
    public function operativo(Request $request): JsonResponse
    {
        $periodo = $request->query('periodo', 'mes_actual');
        $datos = $this->service->obtenerResumenCompleto($periodo);

        return $this->success([
            'periodo'          => $datos['periodo_seleccionado'],
            'kpis_operativos'  => $datos['operativo'],
            'zonas_cobertura'  => $datos['zonas_cobertura'],
            'planes_abonados'  => $datos['planes_distribucion'],
        ], 'Métricas operativas obtenidas exitosamente.');
    }

    /**
     * CU26 - Alertas de morosidad crítica y saturación de nodos.
     */
    public function alertas(Request $request): JsonResponse
    {
        $alertas = $this->service->obtenerAlertasMorosidadCritica();

        return $this->success($alertas, 'Alertas críticas de morosidad recuperadas con éxito.');
    }
}
