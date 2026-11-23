<?php

namespace App\Models\Paquetes\P7_DashboardReportesInteligenciaVoz\CU27_GenerarExportarReportesTradicionales;

use App\Models\Paquetes\P5_EquiposProveedoresInventario\CU19_AsignarEquipoComodato\AsignacionEquipo;
use App\Models\Paquetes\P5_EquiposProveedoresInventario\CU19_AsignarEquipoComodato\Equipo;
use App\Models\Paquetes\P4_FacturacionCobranza\CU09_GenerarMensualidades\Mensualidad;
use App\Models\Paquetes\P4_FacturacionCobranza\CU10_GestionarPagoMensualidad\MetodoPago;
use App\Models\Paquetes\P4_FacturacionCobranza\CU10_GestionarPagoMensualidad\Pago;
use App\Models\Paquetes\P2_GestionClientesZonas\CU04_ZonasCobertura\Zona;
use App\Models\Paquetes\P2_GestionClientesZonas\CU05_RegistrarCliente\Cliente;
use App\Models\Paquetes\P3_ServiciosPlanes\CU08_RegistrarActivarServicio\ServicioInternet;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ReporteTradicional
{
    private static function likeOp(): string
    {
        return DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
    }

    public const TIPO_CLIENTES_ZONA = 'clientes_zona';
    public const TIPO_INGRESOS_PAGOS = 'ingresos_pagos';
    public const TIPO_MOROSIDAD_CORTES = 'morosidad_cortes';
    public const TIPO_EQUIPOS_INSTALACIONES = 'equipos_instalaciones';

    /**
     * Catálogo descriptivo de los reportes tradicionales disponibles en TELCOM.
     */
    public static function catalogo(): array
    {
        return [
            [
                'id'          => self::TIPO_CLIENTES_ZONA,
                'nombre'      => 'Clientes por Zona de Cobertura',
                'categoria'   => 'Comercial y Abonados',
                'descripcion' => 'Consolidado de clientes registrados agrupados por nodo y zona de cobertura, con detalle de servicios contratados y estado operativo.',
                'icono'       => 'Users',
                'filtros'     => ['zona_id', 'estado_cliente', 'fecha_desde', 'fecha_hasta', 'buscar'],
            ],
            [
                'id'          => self::TIPO_INGRESOS_PAGOS,
                'nombre'      => 'Ingresos y Recaudación de Pagos',
                'categoria'   => 'Financiero y Cobranzas',
                'descripcion' => 'Informe detallado de pagos cobrados en ventanilla, transferencias y QR con desglose por período, método de pago y cajero.',
                'icono'       => 'CreditCard',
                'filtros'     => ['zona_id', 'metodo_pago', 'fecha_desde', 'fecha_hasta', 'buscar'],
            ],
            [
                'id'          => self::TIPO_MOROSIDAD_CORTES,
                'nombre'      => 'Morosidad y Servicios para Corte',
                'categoria'   => 'Cobranzas y Operaciones',
                'descripcion' => 'Reporte de abonados con facturas vencidas, meses acumulados de deuda y servicios en riesgo de corte preventivo.',
                'icono'       => 'AlertTriangle',
                'filtros'     => ['zona_id', 'fecha_desde', 'fecha_hasta', 'buscar'],
            ],
            [
                'id'          => self::TIPO_EQUIPOS_INSTALACIONES,
                'nombre'      => 'Equipos en Comodato e Instalaciones Técnicas',
                'categoria'   => 'Infraestructura e Inventario',
                'descripcion' => 'Control de equipamiento físico entregado a clientes (ONUs/Routers) y balance de órdenes técnicas finalizadas en campo.',
                'icono'       => 'HardDrive',
                'filtros'     => ['tipo_subreporte', 'buscar'],
            ],
        ];
    }

    /**
     * Consulta y genera el reporte solicitado con sus KPIs consolidados.
     */
    public static function generar(string $tipo, array $filtros): array
    {
        return match ($tipo) {
            self::TIPO_CLIENTES_ZONA       => self::generarClientesZona($filtros),
            self::TIPO_INGRESOS_PAGOS      => self::generarIngresosPagos($filtros),
            self::TIPO_MOROSIDAD_CORTES    => self::generarMorosidadCortes($filtros),
            self::TIPO_EQUIPOS_INSTALACIONES => self::generarEquiposInstalaciones($filtros),
            default                        => throw new \InvalidArgumentException("Tipo de reporte '{$tipo}' no reconocido."),
        };
    }

    /**
     * 1. REPORTE: Clientes por Zona
     */
    private static function generarClientesZona(array $filtros): array
    {
        $query = DB::table('Cliente as c')
            ->leftJoin('Zona as z', 'c.idZona', '=', 'z.idZona')
            ->leftJoin('ServicioInternet as s', 'c.idCliente', '=', 's.idCliente')
            ->select([
                'c.idCliente',
                'c.codigoCliente',
                'c.ci',
                'c.nombreCompleto',
                'c.telefonoPrincipal',
                'c.correo',
                'c.direccion',
                'c.estadoCliente',
                'c.fechaRegistro',
                'z.nombreZona',
                'z.codigo as codigoZona',
                'z.barrio as barrioZona',
                DB::raw('COUNT("s"."idServicio") as "totalServicios"'),
            ])
            ->groupBy([
                'c.idCliente', 'c.codigoCliente', 'c.ci', 'c.nombreCompleto',
                'c.telefonoPrincipal', 'c.correo', 'c.direccion',
                'c.estadoCliente', 'c.fechaRegistro', 'z.nombreZona',
                'z.codigo', 'z.barrio'
            ]);

        if (! empty($filtros['zona_id'])) {
            $query->where('c.idZona', (int) $filtros['zona_id']);
        }
        if (! empty($filtros['estado_cliente'])) {
            $query->where('c.estadoCliente', strtoupper($filtros['estado_cliente']));
        }
        if (! empty($filtros['fecha_desde'])) {
            $query->whereDate('c.fechaRegistro', '>=', $filtros['fecha_desde']);
        }
        if (! empty($filtros['fecha_hasta'])) {
            $query->whereDate('c.fechaRegistro', '<=', $filtros['fecha_hasta']);
        }
        if (! empty($filtros['buscar'])) {
            $term = '%' . trim($filtros['buscar']) . '%';
            $like = self::likeOp();
            $query->where(function ($q) use ($term, $like) {
                $q->where('c.nombreCompleto', $like, $term)
                    ->orWhere('c.ci', $like, $term)
                    ->orWhere('c.codigoCliente', $like, $term)
                    ->orWhere('z.nombreZona', $like, $term);
            });
        }

        $registros = $query->orderBy('c.nombreCompleto', 'asc')->get();

        $kpis = [
            'total_registros'   => $registros->count(),
            'clientes_activos'  => $registros->where('estadoCliente', 'ACTIVO')->count(),
            'clientes_inactivos'=> $registros->where('estadoCliente', '!=', 'ACTIVO')->count(),
            'servicios_activos' => (int) $registros->sum('totalServicios'),
        ];

        return [
            'tipo'        => self::TIPO_CLIENTES_ZONA,
            'titulo'      => 'Reporte de Clientes por Zona de Cobertura',
            'kpis'        => $kpis,
            'registros'   => $registros,
            'fechaCorte'  => Carbon::now()->toDateTimeString(),
        ];
    }

    /**
     * 2. REPORTE: Ingresos y Recaudación de Pagos
     */
    private static function generarIngresosPagos(array $filtros): array
    {
        $query = DB::table('Pago as p')
            ->join('MetodoPago as mp', 'p.idMetodoPago', '=', 'mp.idMetodoPago')
            ->leftJoin('Usuario as u', 'p.idUsuario', '=', 'u.idUsuario')
            ->leftJoin('DetallePago as dp', 'p.idPago', '=', 'dp.idPago')
            ->leftJoin('Mensualidad as m', 'dp.idMensualidad', '=', 'm.idMensualidad')
            ->leftJoin('Cliente as c', 'm.idCliente', '=', 'c.idCliente')
            ->leftJoin('Zona as z', 'c.idZona', '=', 'z.idZona')
            ->select([
                'p.idPago',
                'p.numeroComprobante',
                'p.montoTotal',
                'p.fechaHora',
                'p.observacion',
                'mp.nombreMetodo',
                'u.nombreCompleto as nombreCajero',
                'c.nombreCompleto as clienteNombre',
                'c.codigoCliente',
                'z.nombreZona',
                'm.periodo',
                'm.codigoFactura',
            ]);

        if (! empty($filtros['zona_id'])) {
            $query->where('c.idZona', (int) $filtros['zona_id']);
        }
        if (! empty($filtros['metodo_pago'])) {
            $query->where('mp.nombreMetodo', strtoupper($filtros['metodo_pago']));
        }
        if (! empty($filtros['fecha_desde'])) {
            $query->whereDate('p.fechaHora', '>=', $filtros['fecha_desde']);
        }
        if (! empty($filtros['fecha_hasta'])) {
            $query->whereDate('p.fechaHora', '<=', $filtros['fecha_hasta']);
        }
        if (! empty($filtros['buscar'])) {
            $term = '%' . trim($filtros['buscar']) . '%';
            $like = self::likeOp();
            $query->where(function ($q) use ($term, $like) {
                $q->where('p.numeroComprobante', $like, $term)
                    ->orWhere('c.nombreCompleto', $like, $term)
                    ->orWhere('c.codigoCliente', $like, $term)
                    ->orWhere('m.codigoFactura', $like, $term);
            });
        }

        $registros = $query->orderBy('p.fechaHora', 'desc')->get();

        $totalRecaudado = (float) $registros->sum('montoTotal');
        $totalTransacciones = $registros->count();
        $promedio = $totalTransacciones > 0 ? round($totalRecaudado / $totalTransacciones, 2) : 0;

        $desgloseMetodos = $registros->groupBy('nombreMetodo')->map(function ($items, $metodo) {
            return [
                'metodo' => $metodo,
                'total'  => (float) $items->sum('montoTotal'),
                'cant'   => $items->count(),
            ];
        })->values();

        $kpis = [
            'total_recaudado'     => $totalRecaudado,
            'total_transacciones' => $totalTransacciones,
            'ticket_promedio'     => $promedio,
            'desglose_metodos'    => $desgloseMetodos,
        ];

        return [
            'tipo'        => self::TIPO_INGRESOS_PAGOS,
            'titulo'      => 'Reporte Financiero de Ingresos y Recaudaciones',
            'kpis'        => $kpis,
            'registros'   => $registros,
            'fechaCorte'  => Carbon::now()->toDateTimeString(),
        ];
    }

    /**
     * 3. REPORTE: Morosidad y Servicios para Corte
     */
    private static function generarMorosidadCortes(array $filtros): array
    {
        $query = DB::table('Mensualidad as m')
            ->join('Cliente as c', 'm.idCliente', '=', 'c.idCliente')
            ->leftJoin('Zona as z', 'c.idZona', '=', 'z.idZona')
            ->join('ServicioInternet as s', 'm.idServicio', '=', 's.idServicio')
            ->leftJoin('EstadoServicio as es', 's.idEstadoServicio', '=', 'es.idEstadoServicio')
            ->leftJoin('AsignacionPlan as ap', function ($j) {
                $j->on('s.idServicio', '=', 'ap.idServicio')->whereNull('ap.fechaFin');
            })
            ->leftJoin('PlanInternet as p', 'ap.idPlan', '=', 'p.idPlan')
            ->whereIn('m.estado', ['PENDIENTE', 'VENCIDA'])
            ->select([
                'm.idMensualidad',
                'm.codigoFactura',
                'm.periodo',
                'm.monto',
                'm.fechaEmision',
                'm.fechaVencimiento',
                'm.estado as estadoMensualidad',
                'c.idCliente',
                'c.codigoCliente',
                'c.nombreCompleto as clienteNombre',
                'c.ci as clienteCi',
                'c.telefonoPrincipal',
                's.codigoServicio',
                's.direccion as servicioDireccion',
                'es.nombreEstado as estadoServicio',
                'p.nombrePlan',
                'z.nombreZona',
            ]);

        if (! empty($filtros['zona_id'])) {
            $query->where('c.idZona', (int) $filtros['zona_id']);
        }
        if (! empty($filtros['fecha_desde'])) {
            $query->whereDate('m.fechaVencimiento', '>=', $filtros['fecha_desde']);
        }
        if (! empty($filtros['fecha_hasta'])) {
            $query->whereDate('m.fechaVencimiento', '<=', $filtros['fecha_hasta']);
        }
        if (! empty($filtros['buscar'])) {
            $term = '%' . trim($filtros['buscar']) . '%';
            $like = self::likeOp();
            $query->where(function ($q) use ($term, $like) {
                $q->where('c.nombreCompleto', $like, $term)
                    ->orWhere('c.ci', $like, $term)
                    ->orWhere('s.codigoServicio', $like, $term)
                    ->orWhere('m.codigoFactura', $like, $term);
            });
        }

        $registros = $query->orderBy('m.fechaVencimiento', 'asc')->get();

        $totalDeuda = (float) $registros->sum('monto');
        $clientesUnicosMora = $registros->pluck('idCliente')->unique()->count();

        $kpis = [
            'total_deuda'          => $totalDeuda,
            'facturas_en_mora'     => $registros->count(),
            'clientes_con_deuda'   => $clientesUnicosMora,
            'servicios_en_riesgo'  => $registros->pluck('codigoServicio')->unique()->count(),
        ];

        return [
            'tipo'        => self::TIPO_MOROSIDAD_CORTES,
            'titulo'      => 'Reporte de Morosidad y Cartera Vencida',
            'kpis'        => $kpis,
            'registros'   => $registros,
            'fechaCorte'  => Carbon::now()->toDateTimeString(),
        ];
    }

    /**
     * 4. REPORTE: Equipos en Comodato e Instalaciones
     */
    private static function generarEquiposInstalaciones(array $filtros): array
    {
        $subtipo = $filtros['tipo_subreporte'] ?? 'comodatos';

        if ($subtipo === 'instalaciones') {
            $query = DB::table('Instalacion as i')
                ->leftJoin('SolicitudInstalacion as si', 'i.idSolicitud', '=', 'si.idSolicitud')
                ->leftJoin('Cliente as c', 'si.idCliente', '=', 'c.idCliente')
                ->leftJoin('ServicioInternet as s', 'i.idServicio', '=', 's.idServicio')
                ->leftJoin('Tecnico as t', 'i.idTecnico', '=', 't.idTecnico')
                ->select([
                    'i.idInstalacion',
                    'i.fechaProgramada',
                    'i.fechaRealizada',
                    'i.costoInstalacion',
                    'i.estadoInstalacion',
                    'i.observacion',
                    'c.nombreCompleto as clienteNombre',
                    'c.codigoCliente',
                    's.codigoServicio',
                    't.nombreCompleto as tecnicoNombre',
                ]);

            if (! empty($filtros['buscar'])) {
                $term = '%' . trim($filtros['buscar']) . '%';
                $like = self::likeOp();
                $query->where(function ($q) use ($term, $like) {
                    $q->where('c.nombreCompleto', $like, $term)
                        ->orWhere('s.codigoServicio', $like, $term)
                        ->orWhere('t.nombreCompleto', $like, $term)
                        ->orWhere('i.estadoInstalacion', $like, $term);
                });
            }

            $registros = $query->orderBy('i.fechaRealizada', 'desc')->get();

            $kpis = [
                'total_instalaciones'  => $registros->count(),
                'finalizadas'          => $registros->where('estadoInstalacion', 'FINALIZADO')->count(),
                'costo_total_invertido'=> (float) $registros->sum('costoInstalacion'),
            ];

            return [
                'tipo'        => self::TIPO_EQUIPOS_INSTALACIONES,
                'subtipo'     => 'instalaciones',
                'titulo'      => 'Reporte de Instalaciones Técnicas en Campo',
                'kpis'        => $kpis,
                'registros'   => $registros,
                'fechaCorte'  => Carbon::now()->toDateTimeString(),
            ];
        }

        // Por defecto: Equipos en Comodato
        $query = DB::table('AsignacionEquipo as ae')
            ->join('Equipo as e', 'ae.idEquipo', '=', 'e.idEquipo')
            ->leftJoin('ProductoEquipo as pe', 'e.idProducto', '=', 'pe.idProducto')
            ->join('ServicioInternet as s', 'ae.idServicio', '=', 's.idServicio')
            ->join('Cliente as c', 's.idCliente', '=', 'c.idCliente')
            ->select([
                'ae.idAsignacionEquipo',
                'ae.fechaAsignacion',
                'ae.fechaRetiro',
                'ae.motivoRetiro',
                'e.numeroSerie',
                'e.mac',
                'e.ip',
                'e.estadoEquipo',
                'pe.marca',
                'pe.modelo',
                'pe.tipoEquipo',
                's.codigoServicio',
                'c.nombreCompleto as clienteNombre',
                'c.codigoCliente',
            ]);

        if (! empty($filtros['buscar'])) {
            $term = '%' . trim($filtros['buscar']) . '%';
            $like = self::likeOp();
            $query->where(function ($q) use ($term, $like) {
                $q->where('e.numeroSerie', $like, $term)
                    ->orWhere('e.mac', $like, $term)
                    ->orWhere('c.nombreCompleto', $like, $term)
                    ->orWhere('s.codigoServicio', $like, $term)
                    ->orWhere('pe.modelo', $like, $term);
            });
        }

        $registros = $query->orderBy('ae.fechaAsignacion', 'desc')->get();

        $stockDisponible = DB::table('Equipo')->where('asignada', false)->count();

        $kpis = [
            'total_asignaciones'    => $registros->count(),
            'comodatos_vigentes'    => $registros->whereNull('fechaRetiro')->count(),
            'comodatos_retirados'   => $registros->whereNotNull('fechaRetiro')->count(),
            'equipos_stock_almacen' => $stockDisponible,
        ];

        return [
            'tipo'        => self::TIPO_EQUIPOS_INSTALACIONES,
            'subtipo'     => 'comodatos',
            'titulo'      => 'Reporte de Equipos ONT/Router Asignados en Comodato',
            'kpis'        => $kpis,
            'registros'   => $registros,
            'fechaCorte'  => Carbon::now()->toDateTimeString(),
        ];
    }
}
