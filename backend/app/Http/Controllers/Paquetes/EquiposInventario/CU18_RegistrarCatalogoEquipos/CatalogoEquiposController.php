<?php

namespace App\Http\Controllers\Paquetes\EquiposInventario\CU18_RegistrarCatalogoEquipos;

use App\Http\Controllers\Controller;
use App\Models\Paquetes\EquiposInventario\CU18_RegistrarCatalogoEquipos\Equipo;
use App\Models\Paquetes\EquiposInventario\CU18_RegistrarCatalogoEquipos\Inventario;
use App\Models\Paquetes\EquiposInventario\CU18_RegistrarCatalogoEquipos\ProductoEquipo;
use App\Support\AuditLogger;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * CU18 - Registrar y Gestionar Catálogo de Equipos e Inventario.
 * Paquete: EquiposInventario
 */
class CatalogoEquiposController extends Controller
{
    use ApiResponse;

    /**
     * Listar los productos y modelos de equipos del catálogo.
     * Filtros opcionales: ?tipo_equipo=...&estado=ACTIVO|INACTIVO
     */
    public function index(Request $request): JsonResponse
    {
        $query = ProductoEquipo::with('inventario');

        if ($request->filled('tipo_equipo')) {
            $query->where('tipoEquipo', $request->string('tipo_equipo'));
        }

        if ($request->filled('estado')) {
            $query->where('estado', $request->string('estado'));
        }

        return $this->success(
            ['productos' => $query->get()],
            'Catálogo de equipos obtenido exitosamente.'
        );
    }

    /**
     * Registrar un nuevo producto en el catálogo e inicializar su registro de inventario.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre'       => 'required|string|max:100',
            'tipo_equipo'  => 'required|string|max:50',
            'marca'        => 'required|string|max:50',
            'modelo'       => 'required|string|max:50',
            'descripcion'  => 'nullable|string',
            'estado'       => 'nullable|string|in:ACTIVO,INACTIVO',
            'stock_inicial'=> 'nullable|integer|min:0',
        ]);

        $producto = DB::transaction(function () use ($validated) {
            $prod = ProductoEquipo::create([
                'nombre'      => $validated['nombre'],
                'tipoEquipo'  => $validated['tipo_equipo'],
                'marca'       => $validated['marca'],
                'modelo'      => $validated['modelo'],
                'descripcion' => $validated['descripcion'] ?? null,
                'estado'      => $validated['estado'] ?? 'ACTIVO',
            ]);

            Inventario::create([
                'idProducto'         => $prod->idProducto,
                'stockActual'        => $validated['stock_inicial'] ?? 0,
                'fechaActualizacion' => now(),
            ]);

            return $prod->load('inventario');
        });

        AuditLogger::log(
            'EQUIPOS_INVENTARIO',
            'REGISTRAR_PRODUCTO_CATALOGO',
            "Se registró el equipo {$producto->nombre} ({$producto->marca} {$producto->modelo})",
            null,
            $producto->toArray()
        );

        return $this->success(
            ['producto' => $producto],
            'Equipo registrado en el catálogo exitosamente.',
            201
        );
    }

    /**
     * Consultar detalle de un producto del catálogo con sus unidades físicas.
     */
    public function show(int $id): JsonResponse
    {
        $producto = ProductoEquipo::with(['inventario', 'equipos'])->find($id);

        if (!$producto) {
            return $this->error('El producto o equipo solicitado no existe.', 404);
        }

        return $this->success(['producto' => $producto]);
    }

    /**
     * Actualizar especificaciones de un producto existente.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $producto = ProductoEquipo::find($id);

        if (!$producto) {
            return $this->error('El producto solicitado no existe.', 404);
        }

        $validated = $request->validate([
            'nombre'      => 'sometimes|required|string|max:100',
            'tipo_equipo' => 'sometimes|required|string|max:50',
            'marca'       => 'sometimes|required|string|max:50',
            'modelo'      => 'sometimes|required|string|max:50',
            'descripcion' => 'nullable|string',
            'estado'      => 'nullable|string|in:ACTIVO,INACTIVO',
        ]);

        $previos = $producto->toArray();
        $producto->update([
            'nombre'      => $validated['nombre'] ?? $producto->nombre,
            'tipoEquipo'  => $validated['tipo_equipo'] ?? $producto->tipoEquipo,
            'marca'       => $validated['marca'] ?? $producto->marca,
            'modelo'      => $validated['modelo'] ?? $producto->modelo,
            'descripcion' => array_key_exists('descripcion', $validated) ? $validated['descripcion'] : $producto->descripcion,
            'estado'      => $validated['estado'] ?? $producto->estado,
        ]);

        AuditLogger::log(
            'EQUIPOS_INVENTARIO',
            'ACTUALIZAR_PRODUCTO_CATALOGO',
            "Se actualizaron los datos del equipo ID {$producto->idProducto}",
            $previos,
            $producto->toArray()
        );

        return $this->success(
            ['producto' => $producto->fresh(['inventario'])],
            'Producto del catálogo actualizado correctamente.'
        );
    }

    /**
     * Registrar una unidad física serializada para un producto del catálogo.
     */
    public function registrarUnidadFisica(Request $request, int $id): JsonResponse
    {
        $producto = ProductoEquipo::find($id);

        if (!$producto) {
            return $this->error('El producto base no existe en el catálogo.', 404);
        }

        $validated = $request->validate([
            'numero_serie' => 'required|string|max:100|unique:Equipo,numeroSerie',
            'mac'          => 'nullable|string|max:50',
            'ip'           => 'nullable|ip',
            'propiedad'    => 'required|string|in:COMODATO,VENTA,EMPRESA',
        ]);

        $equipo = DB::transaction(function () use ($producto, $validated) {
            $nuevoEquipo = Equipo::create([
                'idProducto'   => $producto->idProducto,
                'numeroSerie'  => $validated['numero_serie'],
                'mac'          => $validated['mac'] ?? null,
                'ip'           => $validated['ip'] ?? null,
                'propiedad'    => $validated['propiedad'],
                'estadoEquipo' => 'DISPONIBLE',
                'asignada'     => false,
            ]);

            // Incrementar stock en inventario
            Inventario::where('idProducto', $producto->idProducto)
                ->increment('stockActual', 1, ['fechaActualizacion' => now()]);

            return $nuevoEquipo;
        });

        AuditLogger::log(
            'EQUIPOS_INVENTARIO',
            'REGISTRAR_UNIDAD_FISICA',
            "Se registró unidad física con S/N: {$equipo->numeroSerie} para {$producto->nombre}",
            null,
            $equipo->toArray()
        );

        return $this->success(
            ['equipo' => $equipo],
            'Unidad física registrada en el inventario exitosamente.',
            201
        );
    }
}

