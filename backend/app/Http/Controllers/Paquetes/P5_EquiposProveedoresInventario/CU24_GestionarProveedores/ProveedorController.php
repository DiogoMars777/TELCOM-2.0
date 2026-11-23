<?php

namespace App\Http\Controllers\Paquetes\P5_EquiposProveedoresInventario\CU24_GestionarProveedores;

use App\Http\Controllers\Controller;
use App\Models\Paquetes\P5_EquiposProveedoresInventario\CU24_GestionarProveedores\Proveedor;
use App\Support\AuditLogger;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** CU24: catálogo de proveedores. La baja solo cambia estado; conserva las compras. */
class ProveedorController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $filtros = $request->validate([
            'buscar' => 'nullable|string|max:100',
            'estado' => 'nullable|boolean',
        ]);
        $query = Proveedor::query()->orderBy('razonSocial')->orderBy('idProveedor');

        $buscar = trim($filtros['buscar'] ?? '');
        if ($buscar !== '') {
            // whereLike utiliza ILIKE en PostgreSQL y preserva los nombres camelCase.
            $query->where(function ($q) use ($buscar) {
                $q->whereLike('razonSocial', "%{$buscar}%")
                    ->orWhereLike('nit', "%{$buscar}%")
                    ->orWhereLike('telefono', "%{$buscar}%")
                    ->orWhereLike('correo', "%{$buscar}%")
                    ->orWhereLike('direccion', "%{$buscar}%");
            });
        }

        if (isset($filtros['estado'])) {
            $query->where('estado', $request->boolean('estado'));
        }

        return $this->success(['proveedores' => $query->get()], 'Proveedores obtenidos exitosamente.');
    }

    public function show(int $proveedor): JsonResponse
    {
        return $this->success(
            ['proveedor' => Proveedor::findOrFail($proveedor)],
            'Proveedor obtenido exitosamente.'
        );
    }

    public function store(Request $request): JsonResponse
    {
        $datos = $this->validarProveedor($request);
        $proveedor = Proveedor::create([...$datos, 'estado' => true]);

        $this->auditar($proveedor, 'CREAR_PROVEEDOR', 'creado');

        return $this->success(['proveedor' => $proveedor], 'Proveedor registrado exitosamente.', 201);
    }

    public function update(Request $request, int $proveedor): JsonResponse
    {
        $proveedor = Proveedor::findOrFail($proveedor);
        $datos = $this->validarProveedor($request, $proveedor);
        $previos = $proveedor->toArray();
        $proveedor->update($datos);

        $this->auditar($proveedor, 'ACTUALIZAR_PROVEEDOR', 'actualizado', $previos);

        return $this->success(['proveedor' => $proveedor->fresh()], 'Proveedor actualizado exitosamente.');
    }

    public function activar(int $proveedor): JsonResponse
    {
        return $this->cambiarEstado($proveedor, true);
    }

    public function desactivar(int $proveedor): JsonResponse
    {
        return $this->cambiarEstado($proveedor, false);
    }

    private function cambiarEstado(int $id, bool $estado): JsonResponse
    {
        $proveedor = Proveedor::findOrFail($id);
        $previos = $proveedor->toArray();
        $proveedor->update(['estado' => $estado]);
        $accion = $estado ? 'ACTIVAR_PROVEEDOR' : 'DESACTIVAR_PROVEEDOR';
        $resultado = $estado ? 'activado' : 'desactivado';

        $this->auditar($proveedor, $accion, $resultado, $previos);

        return $this->success(['proveedor' => $proveedor->fresh()], "Proveedor {$resultado} exitosamente.");
    }

    private function validarProveedor(Request $request, ?Proveedor $proveedor = null): array
    {
        return $request->validate([
            'razonSocial' => 'required|string|max:100',
            'nit' => [
                'required', 'string', 'max:30',
                Rule::unique('Proveedor', 'nit')->ignore($proveedor?->idProveedor, 'idProveedor'),
            ],
            'telefono' => 'nullable|string|max:20',
            'correo' => 'nullable|email|max:100',
            'direccion' => 'nullable|string',
        ], [
            'razonSocial.required' => 'La razón social es obligatoria.',
            'nit.required' => 'El NIT es obligatorio.',
            'nit.unique' => 'Ya existe un proveedor con este NIT.',
            'correo.email' => 'Ingresa un correo electrónico válido.',
        ]);
    }

    private function auditar(Proveedor $proveedor, string $accion, string $resultado, ?array $previos = null): void
    {
        AuditLogger::log(
            'PROVEEDORES',
            $accion,
            "Proveedor #{$proveedor->idProveedor} {$proveedor->razonSocial} {$resultado}.",
            $previos,
            $proveedor->toArray()
        );
    }
}
