<?php

namespace App\Services\Paquetes\P7_DashboardReportesInteligenciaVoz\CU31_GenerarReporteInteligenteVoz;

use App\Models\Paquetes\P2_GestionClientesZonas\CU05_RegistrarCliente\Cliente;
use App\Models\Paquetes\P3_ServiciosPlanes\CU08_RegistrarActivarServicio\ServicioInternet;
use App\Models\Paquetes\P4_FacturacionCobranza\CU09_GenerarMensualidades\Mensualidad;
use App\Models\Paquetes\P4_FacturacionCobranza\CU10_GestionarPagoMensualidad\Pago;
use App\Models\Paquetes\P5_EquiposProveedoresInventario\CU18_RegistrarCatalogoEquipos\Inventario;
use App\Models\Paquetes\P5_EquiposProveedoresInventario\CU24_GestionarProveedores\Proveedor;
use App\Models\Paquetes\P6_InstalacionesTecnicas\CU23_RegistrarInstalacion\Instalacion;
use Carbon\CarbonImmutable;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

/** Consultas propias sobre las tablas canónicas. Ninguna expresión procede del usuario o de IA. */
class CatalogoReportesService
{
    public const LIMITE_FILAS = 200;

    public function __construct(private readonly IntencionReporte $intenciones) {}

    public function generar(array $entrada): array
    {
        $intencion = $this->intenciones->validar($entrada);

        return DB::connection()->transaction(function () use ($intencion) {
            if (DB::connection()->getDriverName() === 'pgsql') {
                // Expresión constante: lectura consistente de filas/totales y protección ante escrituras accidentales.
                DB::statement('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY');
            }
            $f = $intencion['filtros'];
            $reporte = match ($intencion['tipo']) {
                'clientes_por_zona' => $this->clientes($f),
                'servicios_por_estado' => $this->servicios($f),
                'ingresos_por_periodo' => $this->ingresos($f),
                'mensualidades_por_estado' => $this->mensualidades($f),
                'inventario_disponible' => $this->inventario($f),
                'instalaciones_por_estado_o_periodo' => $this->instalaciones($f),
                'proveedores_por_estado' => $this->proveedores($f),
            };

            return [
                'tipo' => $intencion['tipo'],
                'titulo' => IntencionReporte::CATALOGO[$intencion['tipo']]['titulo'],
                'filtros' => (object) $f,
                'generado_en' => now()->toIso8601String(),
                ...$reporte,
            ];
        });
    }

    private function clientes(array $f): array
    {
        // Las bajas lógicas se conservan para poder consultar INACTIVO y el total histórico.
        $q = Cliente::withTrashed()->toBase()
            ->leftJoin('Zona', 'Cliente.idZona', '=', 'Zona.idZona');
        if (isset($f['estado'])) {
            $q->where('Cliente.estadoCliente', $f['estado']);
            if ($f['estado'] === 'ACTIVO') {
                $q->whereNull('Cliente.fechaBaja');
            }
        }
        if (isset($f['zona_id'])) {
            $q->where('Cliente.idZona', $f['zona_id']);
        }
        $total = (clone $q)->count();
        $q->select('Cliente.idZona as zona_id', 'Zona.nombreZona as zona')
            ->selectRaw('COUNT(*) as cantidad')->groupBy('Cliente.idZona', 'Zona.nombreZona')
            ->orderBy('Zona.nombreZona')->orderBy('Cliente.idZona');

        return $this->resultado($q, [
            $this->columna('zona_id', 'ID de zona', 'entero'), $this->columna('zona', 'Zona'), $this->columna('cantidad', 'Clientes', 'entero'),
        ], [$this->total('clientes', 'Clientes', $total)], "Se encontraron {$total} clientes. Las bajas lógicas se incluyen al consultar inactivos o todos los estados.");
    }

    private function servicios(array $f): array
    {
        $q = ServicioInternet::query()->toBase()
            ->leftJoin('EstadoServicio', 'ServicioInternet.idEstadoServicio', '=', 'EstadoServicio.idEstadoServicio');
        if (isset($f['estado'])) {
            $q->where('EstadoServicio.nombreEstado', $f['estado']);
        }
        if (isset($f['zona_id'])) {
            $q->where('ServicioInternet.idZona', $f['zona_id']);
        }
        $total = (clone $q)->count();
        $q->select('EstadoServicio.nombreEstado as estado')->selectRaw('COUNT(*) as cantidad')
            ->groupBy('EstadoServicio.nombreEstado')->orderBy('EstadoServicio.nombreEstado');

        return $this->resultado($q, [
            $this->columna('estado', 'Estado'), $this->columna('cantidad', 'Servicios', 'entero'),
        ], [$this->total('servicios', 'Servicios', $total)], "Se encontraron {$total} servicios con los filtros aplicados.");
    }

    private function ingresos(array $f): array
    {
        $q = Pago::query()->toBase();
        // Límite superior exclusivo: incluye todo el último día, también fracciones de segundo.
        $q->where('Pago.fechaHora', '>=', $f['fecha_desde'].' 00:00:00')
            ->where('Pago.fechaHora', '<', CarbonImmutable::parse($f['fecha_hasta'])->addDay()->toDateString().' 00:00:00');
        $cantidad = (clone $q)->count();
        $importe = $this->dinero((clone $q)->sum('Pago.montoTotal'));
        // SUBSTR/CAST son constantes compatibles con PostgreSQL y con SQLite de pruebas.
        $periodo = 'SUBSTR(CAST("Pago"."fechaHora" AS VARCHAR), 1, 7)';
        $q->selectRaw($periodo.' as periodo, COUNT(*) as cantidad, COALESCE(SUM("Pago"."montoTotal"), 0) as importe')
            ->groupByRaw($periodo)->orderBy('periodo');

        return $this->resultado($q, [
            $this->columna('periodo', 'Mes de cobro'), $this->columna('cantidad', 'Pagos', 'entero'), $this->columna('importe', 'Ingreso (Bs)', 'moneda'),
        ], [$this->total('pagos', 'Pagos registrados', $cantidad), $this->total('ingresos', 'Ingresos (Bs)', $importe, 'moneda')],
            "Se registraron {$cantidad} pagos por Bs {$importe}. Se suma Pago.montoTotal una sola vez por pago, según su fecha de cobro; no incluye importes por cobrar.");
    }

    private function mensualidades(array $f): array
    {
        $q = Mensualidad::query()->toBase();
        if (isset($f['estado'])) {
            $q->where('Mensualidad.estado', $f['estado']);
        }
        if (isset($f['periodo'])) {
            $q->where('Mensualidad.periodo', $f['periodo']);
        }
        $cantidad = (clone $q)->count();
        $importe = $this->dinero((clone $q)->sum('Mensualidad.monto'));
        $q->select('Mensualidad.periodo', 'Mensualidad.estado')
            ->selectRaw('COUNT(*) as cantidad, COALESCE(SUM("Mensualidad"."monto"), 0) as importe')
            ->groupBy('Mensualidad.periodo', 'Mensualidad.estado')->orderBy('Mensualidad.periodo')->orderBy('Mensualidad.estado');

        return $this->resultado($q, [
            $this->columna('periodo', 'Período'), $this->columna('estado', 'Estado'), $this->columna('cantidad', 'Mensualidades', 'entero'), $this->columna('importe', 'Facturado (Bs)', 'moneda'),
        ], [$this->total('mensualidades', 'Mensualidades', $cantidad), $this->total('facturado', 'Facturado (Bs)', $importe, 'moneda')],
            "Se encontraron {$cantidad} mensualidades por Bs {$importe}. El importe corresponde al monto facturado del estado solicitado; no calcula saldos parciales ni ingresos cobrados.");
    }

    private function inventario(array $f): array
    {
        $q = Inventario::query()->toBase()->join('ProductoEquipo', 'Inventario.idProducto', '=', 'ProductoEquipo.idProducto')
            ->where('Inventario.stockActual', '>', 0);
        if (isset($f['producto_id'])) {
            $q->where('Inventario.idProducto', $f['producto_id']);
        }
        $productos = (clone $q)->count();
        $unidades = (int) (clone $q)->sum('Inventario.stockActual');
        $q->select('ProductoEquipo.idProducto as producto_id', 'ProductoEquipo.nombre as producto', 'ProductoEquipo.tipoEquipo as tipo_equipo', 'ProductoEquipo.marca', 'ProductoEquipo.modelo', 'Inventario.stockActual as cantidad')
            ->orderBy('ProductoEquipo.nombre')->orderBy('ProductoEquipo.idProducto');

        return $this->resultado($q, [
            $this->columna('producto_id', 'ID producto', 'entero'), $this->columna('producto', 'Producto'), $this->columna('tipo_equipo', 'Tipo'), $this->columna('marca', 'Marca'), $this->columna('modelo', 'Modelo'), $this->columna('cantidad', 'Stock disponible', 'entero'),
        ], [$this->total('productos', 'Productos con stock', $productos), $this->total('unidades', 'Unidades en stock', $unidades)],
            "Hay {$unidades} unidades registradas en {$productos} productos con stock positivo. Se usa Inventario.stockActual sin descontar nuevamente los comodatos.");
    }

    private function instalaciones(array $f): array
    {
        $q = Instalacion::query()->toBase();
        if (($f['estado'] ?? null) === 'FINALIZADA') {
            $q->whereIn('Instalacion.estadoInstalacion', ['FINALIZADA', 'FINALIZADO']);
        } elseif (isset($f['estado'])) {
            $q->where('Instalacion.estadoInstalacion', $f['estado']);
        }
        // Solo este mapeo local puede elegir la columna de fecha.
        $campo = $f['fecha_campo'] === 'realizada' ? 'Instalacion.fechaRealizada' : 'Instalacion.fechaProgramada';
        if (isset($f['fecha_desde'])) {
            $q->where($campo, '>=', $f['fecha_desde'])->where($campo, '<=', $f['fecha_hasta']);
        }
        $cantidad = (clone $q)->count();
        $estado = 'CASE WHEN "Instalacion"."estadoInstalacion" = \'FINALIZADO\' THEN \'FINALIZADA\' ELSE "Instalacion"."estadoInstalacion" END';
        $q->selectRaw($estado.' as estado, COUNT(*) as cantidad')->groupByRaw($estado)->orderBy('estado');

        return $this->resultado($q, [
            $this->columna('estado', 'Estado'), $this->columna('cantidad', 'Instalaciones', 'entero'),
        ], [$this->total('instalaciones', 'Instalaciones', $cantidad)],
            "Se encontraron {$cantidad} instalaciones. El período, cuando se indica, se aplica a la fecha ".($f['fecha_campo'] === 'realizada' ? 'realizada' : 'programada').'. FINALIZADO y FINALIZADA se agrupan como FINALIZADA.');
    }

    private function proveedores(array $f): array
    {
        $q = Proveedor::query()->toBase();
        if (isset($f['estado'])) {
            $q->where('Proveedor.estado', $f['estado'] === 'ACTIVO');
        }
        $cantidad = (clone $q)->count();
        $q->select('Proveedor.idProveedor as proveedor_id', 'Proveedor.razonSocial as razon_social')
            ->selectRaw('CASE WHEN "Proveedor"."estado" THEN \'ACTIVO\' ELSE \'INACTIVO\' END as estado')
            ->orderBy('Proveedor.razonSocial')->orderBy('Proveedor.idProveedor');

        return $this->resultado($q, [
            $this->columna('proveedor_id', 'ID proveedor', 'entero'), $this->columna('razon_social', 'Razón social'), $this->columna('estado', 'Estado'),
        ], [$this->total('proveedores', 'Proveedores', $cantidad)], "Se encontraron {$cantidad} proveedores con los filtros aplicados.");
    }

    private function columna(string $clave, string $etiqueta, string $formato = 'texto'): array
    {
        return compact('clave', 'etiqueta', 'formato');
    }

    private function total(string $clave, string $etiqueta, int|string $valor, string $formato = 'entero'): array
    {
        return compact('clave', 'etiqueta', 'valor', 'formato');
    }

    private function dinero(mixed $valor): string
    {
        return number_format((float) $valor, 2, '.', '');
    }

    private function resultado(Builder $query, array $columnas, array $totales, string $resumen): array
    {
        $datos = $query->limit(self::LIMITE_FILAS + 1)->get();
        $filas = $datos->take(self::LIMITE_FILAS)->map(function ($fila) use ($columnas) {
            $fila = (array) $fila;
            foreach ($columnas as $columna) {
                $valor = $fila[$columna['clave']];
                $fila[$columna['clave']] = $valor === null ? null : match ($columna['formato']) {
                    'entero' => (int) $valor,
                    'moneda' => $this->dinero($valor),
                    default => $valor,
                };
            }

            return $fila;
        })->values()->all();

        return [
            'resumen' => $resumen,
            'columnas' => $columnas,
            'filas' => $filas,
            'totales' => $totales,
            'limite_filas' => self::LIMITE_FILAS,
            'truncado' => $datos->count() > self::LIMITE_FILAS,
        ];
    }
}
