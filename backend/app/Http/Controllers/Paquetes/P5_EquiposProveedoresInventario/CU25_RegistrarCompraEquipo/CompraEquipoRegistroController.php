<?php

namespace App\Http\Controllers\Paquetes\P5_EquiposProveedoresInventario\CU25_RegistrarCompraEquipo;

use App\Http\Controllers\Controller;
use App\Models\Paquetes\P5_EquiposProveedoresInventario\CU25_RegistrarCompraEquipo\Compra;
use App\Models\Paquetes\P5_EquiposProveedoresInventario\CU25_RegistrarCompraEquipo\DetalleCompra;
use App\Models\Paquetes\P5_EquiposProveedoresInventario\CU25_RegistrarCompraEquipo\Equipo;
use App\Models\Paquetes\P5_EquiposProveedoresInventario\CU25_RegistrarCompraEquipo\EstadoCompra;
use App\Models\Paquetes\P5_EquiposProveedoresInventario\CU25_RegistrarCompraEquipo\Inventario;
use App\Models\Paquetes\P5_EquiposProveedoresInventario\CU25_RegistrarCompraEquipo\ProductoEquipo;
use App\Models\Paquetes\P5_EquiposProveedoresInventario\CU25_RegistrarCompraEquipo\Proveedor;
use App\Support\AuditLogger;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Controlador BCE para el Caso de Uso 25:
 * Registrar Compra de Equipo y Actualizar Stock.
 */
class CompraEquipoRegistroController extends Controller
{
    use ApiResponse;

    /**
     * Listar compras registradas con filtros.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Compra::with([
            'proveedor',
            'estadoCompra',
            'detalles.inventario.producto',
        ]);

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('nroComprobante', 'ILIKE', "%{$search}%")
                  ->orWhere('observacion', 'ILIKE', "%{$search}%")
                  ->orWhereHas('proveedor', function ($pq) use ($search) {
                      $pq->where('razonSocial', 'ILIKE', "%{$search}%")
                         ->orWhere('nit', 'ILIKE', "%{$search}%");
                  });
            });
        }

        if ($request->filled('proveedor_id')) {
            $query->where('idProveedor', (int) $request->input('proveedor_id'));
        }

        if ($request->filled('estado_compra_id')) {
            $query->where('idEstadoCompra', (int) $request->input('estado_compra_id'));
        }

        if ($request->filled('fecha_desde')) {
            $query->where('fechaCompra', '>=', $request->input('fecha_desde'));
        }

        if ($request->filled('fecha_hasta')) {
            $query->where('fechaCompra', '<=', $request->input('fecha_hasta'));
        }

        $compras = $query->orderBy('idCompra', 'desc')->get();

        $totalInversion = $compras->sum(function ($c) {
            return (float) $c->montoTotal;
        });

        return $this->success([
            'compras'        => $compras,
            'total_compras'  => $compras->count(),
            'total_inversion' => round($totalInversion, 2),
        ], 'Listado de compras de equipos obtenido exitosamente.');
    }

    /**
     * Consultar detalle de una compra específica.
     */
    public function show(int $id): JsonResponse
    {
        $compra = Compra::with([
            'proveedor',
            'estadoCompra',
            'detalles.inventario.producto',
        ])->find($id);

        if (!$compra) {
            return $this->error('La orden de compra solicitada no existe.', 404);
        }

        return $this->success($compra, 'Detalle de orden de compra obtenido.');
    }

    /**
     * Proveedores habilitados para el formulario de compra.
     */
    public function proveedores(): JsonResponse
    {
        $proveedores = Proveedor::where('estado', true)
            ->orderBy('razonSocial')
            ->get();

        return $this->success($proveedores, 'Proveedores obtenidos exitosamente.');
    }

    /**
     * Catálogo de productos con inventario actual.
     */
    public function productos(): JsonResponse
    {
        $productos = ProductoEquipo::with('inventario')
            ->where('estado', '!=', 'INACTIVO')
            ->orderBy('nombre')
            ->get();

        return $this->success($productos, 'Productos y stock de inventario obtenidos.');
    }

    /**
     * Catálogo de estados de compra.
     */
    public function estados(): JsonResponse
    {
        $estados = EstadoCompra::orderBy('idEstadoCompra')->get();
        return $this->success($estados, 'Estados de compra obtenidos.');
    }

    /**
     * Registrar compra de equipo y actualizar stock de inventario atómicamente.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nroComprobante'   => 'nullable|string|max:50',
            'nro_comprobante'  => 'nullable|string|max:50',
            'fechaCompra'      => 'nullable|date',
            'fecha_compra'     => 'nullable|date',
            'idProveedor'      => 'nullable|integer|exists:Proveedor,idProveedor',
            'proveedor_id'     => 'nullable|integer|exists:Proveedor,idProveedor',
            'idEstadoCompra'   => 'nullable|integer|exists:EstadoCompra,idEstadoCompra',
            'estado_compra_id' => 'nullable|integer|exists:EstadoCompra,idEstadoCompra',
            'observacion'      => 'nullable|string|max:500',
            'detalles'         => 'required|array|min:1',
            'detalles.*.idProducto'      => 'nullable|integer|exists:ProductoEquipo,idProducto',
            'detalles.*.producto_id'     => 'nullable|integer|exists:ProductoEquipo,idProducto',
            'detalles.*.idInventario'    => 'nullable|integer|exists:Inventario,idInventario',
            'detalles.*.inventario_id'   => 'nullable|integer|exists:Inventario,idInventario',
            'detalles.*.cantidad'        => 'required|integer|min:1',
            'detalles.*.precioUnitario'  => 'nullable|numeric|min:0',
            'detalles.*.precio_unitario' => 'nullable|numeric|min:0',
            'detalles.*.series'          => 'nullable|array',
            'detalles.*.series.*.numero_serie' => 'nullable|string|max:100',
            'detalles.*.series.*.mac'          => 'nullable|string|max:50',
        ]);

        $idProveedor = $validated['idProveedor'] ?? $validated['proveedor_id'] ?? null;
        if (!$idProveedor) {
            return $this->error('Debe seleccionar un proveedor válido.', 422);
        }

        $fechaCompra = $validated['fechaCompra'] ?? $validated['fecha_compra'] ?? now()->toDateString();
        $nroComprobante = $validated['nroComprobante'] ?? $validated['nro_comprobante'] ?? null;
        if (empty($nroComprobante)) {
            $nroComprobante = 'FAC-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -4));
        }

        $idEstadoCompra = $validated['idEstadoCompra'] ?? $validated['estado_compra_id'] ?? null;
        if (!$idEstadoCompra) {
            $estadoDefecto = EstadoCompra::where('nombreEstado', 'COMPLETADO')->first();
            $idEstadoCompra = $estadoDefecto ? $estadoDefecto->idEstadoCompra : EstadoCompra::value('idEstadoCompra');
        }

        try {
            $compra = DB::transaction(function () use ($validated, $idProveedor, $fechaCompra, $nroComprobante, $idEstadoCompra) {
                // 1. Crear cabecera de la compra
                $compra = Compra::create([
                    'fechaCompra'    => $fechaCompra,
                    'nroComprobante' => $nroComprobante,
                    'montoTotal'     => 0,
                    'observacion'    => $validated['observacion'] ?? null,
                    'idProveedor'    => $idProveedor,
                    'idEstadoCompra' => $idEstadoCompra,
                ]);

                $montoTotal = 0;
                $resumenItems = [];

                // 2. Procesar líneas de detalle y actualización de stock
                foreach ($validated['detalles'] as $item) {
                    $cantidad = (int) $item['cantidad'];
                    $precioUnitario = (float) ($item['precioUnitario'] ?? $item['precio_unitario'] ?? 0);
                    $subtotal = round($cantidad * $precioUnitario, 2);
                    $montoTotal += $subtotal;

                    // Resolver o vincular Inventario
                    $idInventario = $item['idInventario'] ?? $item['inventario_id'] ?? null;
                    $idProducto   = $item['idProducto'] ?? $item['producto_id'] ?? null;

                    if ($idInventario) {
                        $inventario = Inventario::findOrFail($idInventario);
                        $idProducto = $inventario->idProducto;
                    } elseif ($idProducto) {
                        $inventario = Inventario::firstOrCreate(
                            ['idProducto' => $idProducto],
                            ['stockActual' => 0, 'fechaActualizacion' => now()]
                        );
                        $idInventario = $inventario->idInventario;
                    } else {
                        throw new \InvalidArgumentException('Cada ítem debe indicar idProducto o idInventario.');
                    }

                    // 2.1 Crear registro en DetalleCompra
                    DetalleCompra::create([
                        'cantidad'       => $cantidad,
                        'precioUnitario' => $precioUnitario,
                        'subtotal'       => $subtotal,
                        'idCompra'       => $compra->idCompra,
                        'idInventario'   => $idInventario,
                    ]);

                    // 2.2 Actualizar stock en Inventario
                    $stockAnterior = $inventario->stockActual;
                    $inventario->stockActual = $stockAnterior + $cantidad;
                    $inventario->fechaActualizacion = now();
                    $inventario->save();

                    // 2.3 Si se proporcionaron números de serie físicos, crear registros en Equipo
                    if (!empty($item['series']) && is_array($item['series'])) {
                        foreach ($item['series'] as $serieInfo) {
                            $numSerie = trim($serieInfo['numero_serie'] ?? '');
                            $mac      = trim($serieInfo['mac'] ?? '');
                            if ($numSerie !== '' || $mac !== '') {
                                Equipo::create([
                                    'idProducto'   => $idProducto,
                                    'numeroSerie'  => $numSerie !== '' ? $numSerie : null,
                                    'mac'          => $mac !== '' ? $mac : null,
                                    'asignada'     => false,
                                    'propiedad'    => 'EMPRESA',
                                    'estadoEquipo' => 'DISPONIBLE',
                                ]);
                            }
                        }
                    }

                    $resumenItems[] = [
                        'producto_id'    => $idProducto,
                        'cantidad'       => $cantidad,
                        'precio_unit'    => $precioUnitario,
                        'subtotal'       => $subtotal,
                        'stock_anterior' => $stockAnterior,
                        'stock_nuevo'    => $inventario->stockActual,
                    ];
                }

                // 3. Actualizar monto total en Compra
                $compra->montoTotal = $montoTotal;
                $compra->save();

                // 4. Registro en Bitácora de Auditoría
                AuditLogger::log(
                    'CU25',
                    'REGISTRAR_COMPRA_EQUIPO',
                    "Compra {$compra->nroComprobante} registrada por Bs. {$compra->montoTotal} con ingreso a stock.",
                    null,
                    [
                        'idCompra'       => $compra->idCompra,
                        'nroComprobante' => $compra->nroComprobante,
                        'proveedor_id'   => $idProveedor,
                        'montoTotal'     => $montoTotal,
                        'items'          => $resumenItems,
                    ]
                );

                return $compra->load(['proveedor', 'estadoCompra', 'detalles.inventario.producto']);
            });

            return $this->success(
                $compra,
                "Compra {$compra->nroComprobante} registrada y stock de inventario actualizado exitosamente.",
                201
            );
        } catch (\Throwable $e) {
            return $this->error('Error al registrar compra de equipo: ' . $e->getMessage(), 500);
        }
    }
}
