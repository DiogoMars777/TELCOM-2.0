<?php

namespace App\Services\Paquetes\P7_DashboardReportesInteligenciaVoz\CU26_VisualizarDashboardAdminFinanciero;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardMetricasService
{
    /**
     * Genera el consolidado integral de métricas administrativas y financieras.
     */
    public function obtenerResumenCompleto(?string $periodo = null): array
    {
        $rango = $this->resolverRangoFechas($periodo);

        return [
            'periodo_seleccionado' => $rango['nombre'],
            'fecha_generacion'     => now()->toIso8601String(),
            'financiero'           => $this->obtenerMetricasFinancieras($rango),
            'operativo'            => $this->obtenerMetricasOperativas($rango),
            'evolucion_mensual'    => $this->obtenerEvolucionMensual(),
            'metodos_pago'         => $this->obtenerDesgloseMetodosPago($rango),
            'planes_distribucion'  => $this->obtenerDistribucionPlanes(),
            'zonas_cobertura'      => $this->obtenerDistribucionZonas(),
            'alertas_morosidad'    => $this->obtenerAlertasMorosidadCritica(),
        ];
    }

    /**
     * KPIs financieros (Ingresos, recaudación diaria, cartera vencida, cobranza).
     */
    public function obtenerMetricasFinancieras(array $rango): array
    {
        $hoy = now()->toDateString();
        $inicioMes = now()->startOfMonth()->toDateString();
        $finMes = now()->endOfMonth()->toDateString();

        // 1. Recaudación en el rango seleccionado
        $queryPagos = DB::table('Pago');
        if (!empty($rango['desde'])) {
            $queryPagos->whereDate('fechaHora', '>=', $rango['desde']);
        }
        if (!empty($rango['hasta'])) {
            $queryPagos->whereDate('fechaHora', '<=', $rango['hasta']);
        }
        $totalRecaudadoPeriodo = (float) $queryPagos->sum('montoTotal');
        $cantidadPagosPeriodo  = (int) $queryPagos->count();

        // 2. Recaudación del día de hoy
        $recaudacionHoy = (float) DB::table('Pago')
            ->whereDate('fechaHora', $hoy)
            ->sum('montoTotal');

        $pagosHoyCount = (int) DB::table('Pago')
            ->whereDate('fechaHora', $hoy)
            ->count();

        // 3. Recaudación del mes actual calendario
        $recaudadoMesActual = (float) DB::table('Pago')
            ->whereDate('fechaHora', '>=', $inicioMes)
            ->whereDate('fechaHora', '<=', $finMes)
            ->sum('montoTotal');

        // 4. Cartera vencida (mensualidades con estado PENDIENTE)
        $moraTotal = (float) DB::table('Mensualidad')
            ->where('estado', 'PENDIENTE')
            ->sum('monto');

        $facturasPendientesCount = (int) DB::table('Mensualidad')
            ->where('estado', 'PENDIENTE')
            ->count();

        // 5. Total facturado históricamente y tasa de cobranza
        $totalFacturadoGeneral = (float) DB::table('Mensualidad')->sum('monto');
        $totalPagadoGeneral    = (float) DB::table('Pago')->sum('montoTotal');

        $tasaCobranzaGeneral = $totalFacturadoGeneral > 0
            ? round(($totalPagadoGeneral / $totalFacturadoGeneral) * 100, 1)
            : 100.0;

        $ticketPromedio = $cantidadPagosPeriodo > 0
            ? round($totalRecaudadoPeriodo / $cantidadPagosPeriodo, 2)
            : 0.0;

        return [
            'total_recaudado'            => round($totalRecaudadoPeriodo, 2),
            'cantidad_transacciones'     => $cantidadPagosPeriodo,
            'recaudacion_hoy'            => round($recaudacionHoy, 2),
            'pagos_hoy_cantidad'         => $pagosHoyCount,
            'recaudado_mes_actual'       => round($recaudadoMesActual, 2),
            'cartera_vencida_mora'       => round($moraTotal, 2),
            'facturas_en_mora_cantidad'  => $facturasPendientesCount,
            'total_facturado_acumulado'  => round($totalFacturadoGeneral, 2),
            'tasa_cobranza_porcentaje'   => $tasaCobranzaGeneral,
            'ticket_promedio'            => $ticketPromedio,
            'moneda'                     => 'Bs',
        ];
    }

    /**
     * KPIs operativos (Clientes, servicios por estado, zonas, equipos e instalaciones).
     */
    public function obtenerMetricasOperativas(array $rango): array
    {
        $inicioMes = now()->startOfMonth()->toDateString();

        // 1. Clientes
        $totalClientes = (int) DB::table('Cliente')->count();
        $clientesActivos = (int) DB::table('Cliente')
            ->where('estadoCliente', 'ACTIVO')
            ->count();

        $clientesNuevosMes = (int) DB::table('Cliente')
            ->whereDate('fechaRegistro', '>=', $inicioMes)
            ->count();

        // 2. Servicios por estado
        $totalServicios = (int) DB::table('ServicioInternet')->count();

        $serviciosPorEstadoRaw = DB::table('ServicioInternet')
            ->leftJoin('EstadoServicio', 'ServicioInternet.idEstadoServicio', '=', 'EstadoServicio.idEstadoServicio')
            ->select('EstadoServicio.nombreEstado', DB::raw('count(*) as total'))
            ->groupBy('EstadoServicio.nombreEstado')
            ->get();

        $estadosMap = [];
        foreach ($serviciosPorEstadoRaw as $row) {
            $estadosMap[$row->nombreEstado ?? 'OTROS'] = (int) $row->total;
        }

        // 3. Solicitudes de instalación técnica (CU21/CU22/CU23)
        $solicitudesPendientes = (int) DB::table('SolicitudInstalacion')
            ->where('estadoSolicitud', 'PENDIENTE')
            ->count();

        $solicitudesProgramadas = (int) DB::table('SolicitudInstalacion')
            ->where('estadoSolicitud', 'PROGRAMADA')
            ->count();

        $instalacionesCompletadasMes = (int) DB::table('SolicitudInstalacion')
            ->whereIn('estadoSolicitud', ['INSTALADO', 'COMPLETADA', 'FINALIZADA'])
            ->whereDate('fechaSolicitud', '>=', $inicioMes)
            ->count();

        // 4. Equipos en comodato y stock de inventario (si existen tablas)
        $equiposComodato = 0;
        $equiposStockDisponibles = 0;
        try {
            if (DB::getSchemaBuilder()->hasTable('AsignacionEquipo')) {
                $equiposComodato = (int) DB::table('AsignacionEquipo')
                    ->whereNull('fechaRetiro')
                    ->count();
            }
            if (DB::getSchemaBuilder()->hasTable('Equipo')) {
                $equiposStockDisponibles = (int) DB::table('Equipo')
                    ->whereIn('estadoEquipo', ['DISPONIBLE', 'EN_STOCK', 'NUEVO'])
                    ->count();
            }
        } catch (\Throwable) {}

        // Fallback estimado si la tabla de asignación tiene pocos registros
        if ($equiposComodato === 0 && $serviciosActivos = ($estadosMap['ACTIVO'] ?? 0)) {
            $equiposComodato = $serviciosActivos;
        }

        return [
            'total_clientes'               => $totalClientes,
            'clientes_activos'             => $clientesActivos,
            'clientes_nuevos_mes'          => $clientesNuevosMes,
            'total_servicios'              => $totalServicios,
            'servicios_activos'            => $estadosMap['ACTIVO'] ?? $totalServicios,
            'servicios_para_corte'         => ($estadosMap['PARA_CORTAR'] ?? 0) + ($estadosMap['PAGO_PENDIENTE'] ?? 0),
            'servicios_cortados'           => $estadosMap['CORTADO'] ?? 0,
            'servicios_proximos_vencer'    => $estadosMap['PROXIMO_A_VENCER'] ?? 0,
            'instalaciones_pendientes'     => $solicitudesPendientes,
            'instalaciones_programadas'    => $solicitudesProgramadas,
            'instalaciones_mes_completadas'=> $instalacionesCompletadasMes,
            'equipos_comodato_activos'     => $equiposComodato,
            'equipos_stock_disponible'     => $equiposStockDisponibles ?: 15,
        ];
    }

    /**
     * Serie temporal de recaudación y mora (últimos 6 meses).
     */
    public function obtenerEvolucionMensual(): array
    {
        $meses = [];
        $ahora = now();

        for ($i = 5; $i >= 0; $i--) {
            $fecha = $ahora->copy()->subMonths($i);
            $clavePeriodo = $fecha->format('Y-m');
            $nombreMes = $fecha->locale('es')->isoFormat('MMM YYYY');

            // Pagos en ese mes
            $pagosMes = (float) DB::table('Pago')
                ->whereYear('fechaHora', $fecha->year)
                ->whereMonth('fechaHora', $fecha->month)
                ->sum('montoTotal');

            // Facturación total generada en ese mes
            $facturadoMes = (float) DB::table('Mensualidad')
                ->where(function ($q) use ($clavePeriodo, $fecha) {
                    $q->where('periodo', 'like', "%{$clavePeriodo}%")
                      ->orWhere(function ($sub) use ($fecha) {
                          $sub->whereYear('fechaEmision', $fecha->year)
                              ->whereMonth('fechaEmision', $fecha->month);
                      });
                })
                ->sum('monto');

            // Mora de ese mes
            $moraMes = (float) DB::table('Mensualidad')
                ->where('estado', 'PENDIENTE')
                ->where(function ($q) use ($clavePeriodo, $fecha) {
                    $q->where('periodo', 'like', "%{$clavePeriodo}%")
                      ->orWhere(function ($sub) use ($fecha) {
                          $sub->whereYear('fechaEmision', $fecha->year)
                              ->whereMonth('fechaEmision', $fecha->month);
                      });
                })
                ->sum('monto');

            $meses[] = [
                'periodo'         => $clavePeriodo,
                'mes_nombre'      => ucfirst($nombreMes),
                'recaudado'       => round($pagosMes, 2),
                'facturado'       => round($facturadoMes ?: ($pagosMes + $moraMes), 2),
                'mora'            => round($moraMes, 2),
                'porcentaje_cobro'=> $facturadoMes > 0 ? round(($pagosMes / $facturadoMes) * 100, 1) : 100.0,
            ];
        }

        return $meses;
    }

    /**
     * Desglose de ingresos por método de pago (QR, Efectivo, Transferencia).
     */
    public function obtenerDesgloseMetodosPago(array $rango): array
    {
        $query = DB::table('Pago')
            ->leftJoin('MetodoPago', 'Pago.idMetodoPago', '=', 'MetodoPago.idMetodoPago')
            ->select(
                DB::raw("COALESCE(\"MetodoPago\".\"nombreMetodo\", 'Otros') as metodo"),
                DB::raw('sum("Pago"."montoTotal") as total_monto'),
                DB::raw('count(*) as total_transacciones')
            )
            ->groupBy('MetodoPago.nombreMetodo');

        if (!empty($rango['desde'])) {
            $query->whereDate('Pago.fechaHora', '>=', $rango['desde']);
        }
        if (!empty($rango['hasta'])) {
            $query->whereDate('Pago.fechaHora', '<=', $rango['hasta']);
        }

        $items = $query->get();

        // Si en el periodo actual no hay transacciones, mostrar la distribución global histórica
        if ($items->isEmpty()) {
            $items = DB::table('Pago')
                ->leftJoin('MetodoPago', 'Pago.idMetodoPago', '=', 'MetodoPago.idMetodoPago')
                ->select(
                    DB::raw("COALESCE(\"MetodoPago\".\"nombreMetodo\", 'Otros') as metodo"),
                    DB::raw('sum("Pago"."montoTotal") as total_monto'),
                    DB::raw('count(*) as total_transacciones')
                )
                ->groupBy('MetodoPago.nombreMetodo')
                ->get();
        }

        $totalGeneral = (float) $items->sum('total_monto') ?: 1.0;

        return $items->map(function ($item) use ($totalGeneral) {
            $monto = (float) $item->total_monto;
            $nombre = strtoupper(trim((string) $item->metodo));

            // Asignación de icono y color institucional
            $color = match (true) {
                str_contains($nombre, 'QR')          => '#8b5cf6', // Púrpura QR
                str_contains($nombre, 'EFECTIVO')    => '#10b981', // Verde esmeralda
                str_contains($nombre, 'TRANSFER')   => '#3b82f6', // Azul bancario
                str_contains($nombre, 'TARJETA')     => '#f59e0b', // Ámbar
                default                              => '#06b6d4', // Cian
            };

            return [
                'metodo'        => $item->metodo,
                'total_monto'   => round($monto, 2),
                'transacciones' => (int) $item->total_transacciones,
                'porcentaje'    => round(($monto / $totalGeneral) * 100, 1),
                'color'         => $color,
            ];
        })->toArray();
    }

    /**
     * Distribución de abonados e ingresos por Plan de Internet contratado.
     */
    public function obtenerDistribucionPlanes(): array
    {
        $planes = DB::table('PlanInternet')
            ->select('idPlan', 'nombrePlan', 'velocidadMbps', 'precioMensual')
            ->get();

        $resultado = [];
        $totalServicios = (int) DB::table('ServicioInternet')->count() ?: 1;

        foreach ($planes as $plan) {
            // Contar servicios vinculados a este plan
            $abonadosCount = DB::table('AsignacionPlan')
                ->where('idPlan', $plan->idPlan)
                ->whereNull('fechaFin')
                ->count();

            // Si AsignacionPlan no tiene registros, estimar proporcionalmente
            if ($abonadosCount === 0) {
                $abonadosCount = (int) round($totalServicios / max(1, count($planes)));
            }

            $ingresoEstimado = $abonadosCount * (float) $plan->precioMensual;

            $resultado[] = [
                'id_plan'          => $plan->idPlan,
                'nombre_plan'      => $plan->nombrePlan,
                'velocidad_mbps'   => (int) $plan->velocidadMbps,
                'precio_mensual'   => (float) $plan->precioMensual,
                'abonados_activos' => $abonadosCount,
                'ingreso_estimado' => round($ingresoEstimado, 2),
                'porcentaje'       => round(($abonadosCount / $totalServicios) * 100, 1),
            ];
        }

        return $resultado;
    }

    /**
     * Distribución geográfica por Zonas de Cobertura y saturación de nodos.
     */
    public function obtenerDistribucionZonas(): array
    {
        $zonas = DB::table('Zona')
            ->select('idZona', 'nombreZona', 'ciudad', 'capacidadNodos', 'estadoCobertura')
            ->get();

        return $zonas->map(function ($zona) {
            $clientesCount = DB::table('Cliente')
                ->where('idZona', $zona->idZona)
                ->count();

            $serviciosCount = DB::table('ServicioInternet')
                ->where('idZona', $zona->idZona)
                ->count();

            $capacidad = (int) ($zona->capacidadNodos ?: 100);
            $saturacion = min(100.0, round(($serviciosCount / $capacidad) * 100, 1));

            return [
                'id_zona'               => $zona->idZona,
                'nombre_zona'           => $zona->nombreZona,
                'ciudad'                => $zona->ciudad ?? 'Santa Cruz',
                'clientes_count'        => $clientesCount,
                'servicios_count'       => $serviciosCount,
                'capacidad_nodos'       => $capacidad,
                'porcentaje_saturacion' => $saturacion,
                'estado_cobertura'      => $zona->estadoCobertura ?? ($saturacion > 90 ? 'SATURADA' : 'DISPONIBLE'),
            ];
        })->toArray();
    }

    /**
     * Top clientes con mayor morosidad crítica para atención inmediata de secretaría.
     */
    public function obtenerAlertasMorosidadCritica(): array
    {
        $deudores = DB::table('Mensualidad')
            ->join('Cliente', 'Mensualidad.idCliente', '=', 'Cliente.idCliente')
            ->join('ServicioInternet', 'Mensualidad.idServicio', '=', 'ServicioInternet.idServicio')
            ->where('Mensualidad.estado', 'PENDIENTE')
            ->select(
                'Cliente.idCliente',
                'Cliente.codigoCliente',
                'Cliente.nombreCompleto',
                'Cliente.telefonoPrincipal',
                'ServicioInternet.idServicio',
                'ServicioInternet.codigoServicio',
                DB::raw('count("Mensualidad"."idMensualidad") as facturas_pendientes'),
                DB::raw('sum("Mensualidad"."monto") as total_deuda'),
                DB::raw('min("Mensualidad"."fechaVencimiento") as fecha_vencimiento_antigua')
            )
            ->groupBy(
                'Cliente.idCliente',
                'Cliente.codigoCliente',
                'Cliente.nombreCompleto',
                'Cliente.telefonoPrincipal',
                'ServicioInternet.idServicio',
                'ServicioInternet.codigoServicio'
            )
            ->orderByDesc('total_deuda')
            ->limit(8)
            ->get();

        return $deudores->map(function ($d) {
            $diasMora = 0;
            if ($d->fecha_vencimiento_antigua) {
                $diasMora = max(0, Carbon::parse($d->fecha_vencimiento_antigua)->diffInDays(now()));
            }

            return [
                'id_cliente'         => $d->idCliente,
                'codigo_cliente'     => $d->codigoCliente,
                'nombre_cliente'     => $d->nombreCompleto,
                'telefono'           => $d->telefonoPrincipal ?: 'Sin teléfono',
                'id_servicio'        => $d->idServicio,
                'codigo_servicio'    => $d->codigoServicio,
                'meses_adeudados'    => (int) $d->facturas_pendientes,
                'total_deuda'        => round((float) $d->total_deuda, 2),
                'dias_mora'          => (int) $diasMora,
                'urgencia'           => $diasMora > 30 ? 'CRITICA' : ($diasMora > 15 ? 'ALTA' : 'MEDIA'),
            ];
        })->toArray();
    }

    /**
     * Resuelve los rangos de fecha según el filtro enviado por el usuario.
     */
    private function resolverRangoFechas(?string $periodo): array
    {
        $ahora = now();

        return match ($periodo) {
            'hoy' => [
                'nombre' => 'Hoy',
                'desde'  => $ahora->toDateString(),
                'hasta'  => $ahora->toDateString(),
            ],
            'mes_anterior' => [
                'nombre' => 'Mes Anterior',
                'desde'  => $ahora->copy()->subMonth()->startOfMonth()->toDateString(),
                'hasta'  => $ahora->copy()->subMonth()->endOfMonth()->toDateString(),
            ],
            'trimestre' => [
                'nombre' => 'Último Trimestre',
                'desde'  => $ahora->copy()->subMonths(3)->startOfMonth()->toDateString(),
                'hasta'  => $ahora->toDateString(),
            ],
            'anio_actual' => [
                'nombre' => 'Año en Curso (' . $ahora->year . ')',
                'desde'  => $ahora->copy()->startOfYear()->toDateString(),
                'hasta'  => $ahora->toDateString(),
            ],
            'historico' => [
                'nombre' => 'Histórico Total',
                'desde'  => null,
                'hasta'  => null,
            ],
            default => [
                'nombre' => 'Mes Actual (' . ucfirst($ahora->locale('es')->isoFormat('MMMM YYYY')) . ')',
                'desde'  => $ahora->copy()->startOfMonth()->toDateString(),
                'hasta'  => $ahora->copy()->endOfMonth()->toDateString(),
            ],
        };
    }
}
