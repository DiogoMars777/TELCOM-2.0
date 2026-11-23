<?php

namespace App\Http\Controllers\Paquetes\P7_DashboardReportesInteligenciaVoz\CU26_VisualizarDashboardAdminFinanciero;

use App\Http\Controllers\Controller;
use App\Models\Paquetes\P4_FacturacionCobranza\CU10_GestionarPagoMensualidad\Pago;
use App\Models\Paquetes\P4_FacturacionCobranza\CU09_GenerarMensualidades\Mensualidad;
use App\Models\Paquetes\P2_GestionClientesZonas\CU05_RegistrarCliente\Cliente;
use App\Models\Paquetes\P3_ServiciosPlanes\CU08_RegistrarActivarServicio\ServicioInternet;
use App\Models\Paquetes\P3_ServiciosPlanes\Planes\PlanInternet;
use App\Models\Paquetes\P2_GestionClientesZonas\CU04_ZonasCobertura\Zona;
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
     * Utiliza las entidades del dominio: Pago, Mensualidad, Cliente, ServicioInternet, PlanInternet y Zona.
     */
    public function index(Request $request): JsonResponse
    {
        $periodo = $request->query('periodo', 'mes_actual');
        $datos = $this->service->obtenerResumenCompleto($periodo);

        // Agregación de control verificando entidades principales en el sistema
        $datos['resumen_entidades'] = [
            'total_recaudacion'  => (float) Pago::query()->sum('montoTotal'),
            'mora_acumulada'     => (float) Mensualidad::query()->where('estado', 'PENDIENTE')->sum('monto'),
            'clientes_totales'   => (int) Cliente::query()->count(),
            'servicios_activos'  => (int) ServicioInternet::query()->count(),
            'planes_catalogo'    => (int) PlanInternet::query()->count(),
            'zonas_cobertura'    => (int) Zona::query()->count(),
        ];

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
     * Entidades utilizadas: Pago y Mensualidad.
     */
    public function financiero(Request $request): JsonResponse
    {
        $periodo = $request->query('periodo', 'mes_actual');
        $datos = $this->service->obtenerResumenCompleto($periodo);

        // Consultas directas a entidades financieras para verificación de flujo
        $recaudacionTotal = (float) Pago::query()->sum('montoTotal');
        $totalPendiente   = (float) Mensualidad::query()->where('estado', 'PENDIENTE')->sum('monto');

        return $this->success([
            'periodo'           => $datos['periodo_seleccionado'],
            'kpis_financieros'  => array_merge($datos['financiero'], [
                'recaudacion_pago_modelo' => $recaudacionTotal,
                'cartera_vencida_modelo'  => $totalPendiente,
            ]),
            'evolucion_mensual' => $datos['evolucion_mensual'],
            'metodos_pago'      => $datos['metodos_pago'],
            'ingresos_por_plan' => $datos['planes_distribucion'],
        ], 'Métricas financieras obtenidas exitosamente.');
    }

    /**
     * CU26 - Métricas operativas, distribución de zonas y cuadrillas técnicas.
     * Entidades utilizadas: Cliente, ServicioInternet, PlanInternet y Zona.
     */
    public function operativo(Request $request): JsonResponse
    {
        $periodo = $request->query('periodo', 'mes_actual');
        $datos = $this->service->obtenerResumenCompleto($periodo);

        // Consultas directas a entidades operativas para verificación de cobertura
        $clientesActivos = (int) Cliente::query()->where('estadoCliente', 'ACTIVO')->count();
        $totalServicios  = (int) ServicioInternet::query()->count();
        $totalPlanes     = (int) PlanInternet::query()->count();
        $totalZonas      = (int) Zona::query()->count();

        return $this->success([
            'periodo'          => $datos['periodo_seleccionado'],
            'kpis_operativos'  => array_merge($datos['operativo'], [
                'clientes_activos_modelo' => $clientesActivos,
                'servicios_totales_modelo' => $totalServicios,
                'planes_activos_modelo'   => $totalPlanes,
                'zonas_activas_modelo'    => $totalZonas,
            ]),
            'zonas_cobertura'  => $datos['zonas_cobertura'],
            'planes_abonados'  => $datos['planes_distribucion'],
        ], 'Métricas operativas obtenidas exitosamente.');
    }

    /**
     * CU26 - Alertas de morosidad crítica y saturación de nodos.
     * Entidades utilizadas: Mensualidad vinculada con Cliente y ServicioInternet.
     */
    public function alertas(Request $request): JsonResponse
    {
        // Validación de alertas sobre mora en Mensualidad y Cliente
        $alertas = $this->service->obtenerAlertasMorosidadCritica();

        return $this->success($alertas, 'Alertas críticas de morosidad recuperadas con éxito.');
    }
}
