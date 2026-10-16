<?php

namespace App\Http\Controllers\Paquetes\ServiciosPlanes\CU16_GestionarCatalogoPlanes;

use App\Http\Controllers\Controller;
use App\Models\Paquetes\ServiciosPlanes\CU16_GestionarCatalogoPlanes\PlanInternet;
use App\Support\AuditLogger;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CU16 - Gestionar Planes de Internet.
 *
 * CRUD del catálogo de planes (entidad UML PlanInternet). Se reutiliza el
 * modelo compartido App\Models\...\Planes\PlanInternet.
 *
 * Reglas de negocio:
 *  - Un plan NO se borra físicamente: se DESACTIVA (`activo = false`) para
 *    conservar el historial de asignaciones que lo referencian y no romper la
 *    restricción de clave foránea (`AsignacionPlan.idPlan` -> `restrictOnDelete`).
 *  - Solo los planes activos pueden asignarse a un servicio (ver CU17).
 *
 * Permisos REALES ya existentes en la matriz RBAC (no se inventan permisos):
 *  - planes.view   -> consultar el catálogo (admin y secretaría).
 *  - planes.assign -> crear/editar/activar/desactivar (admin y secretaría).
 * El técnico no posee ninguno de los dos: el middleware devuelve HTTP 403.
 */
class PlanInternetController extends Controller
{
    use ApiResponse;

    /**
     * Listar el catálogo de planes.
     * Filtro opcional: ?activo=1|0
     */
    public function index(Request $request): JsonResponse
    {
        $query = PlanInternet::query()->orderBy('velocidad_mbps');

        if ($request->has('activo')) {
            $query->where('activo', $request->boolean('activo'));
        }

        return $this->success(
            ['planes' => $query->get()],
            'Planes de Internet obtenidos exitosamente.'
        );
    }

    /**
     * Registrar un nuevo plan de Internet en el catálogo.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $this->validarPlan($request);

        $plan = PlanInternet::create($validated);

        AuditLogger::log(
            'PLANES',
            'CREAR_PLAN',
            "Plan de Internet {$plan->nombre_plan} creado.",
            null,
            $plan->only(['nombrePlan', 'velocidadMbps', 'precioMensual', 'descripcion', 'activo'])
        );

        return $this->success(
            ['plan' => $plan],
            'Plan de Internet registrado exitosamente.',
            201
        );
    }

    /**
     * Ver un plan y sus asignaciones (historial).
     */
    public function show(int $id): JsonResponse
    {
        $plan = PlanInternet::with([
            'asignaciones' => fn ($q) => $q->orderByDesc('fecha_inicio')->orderByDesc('id'),
        ])->findOrFail($id);

        return $this->success(
            ['plan' => $plan],
            'Plan de Internet obtenido exitosamente.'
        );
    }

    /**
     * Actualizar los datos de un plan (incluye activar/desactivar).
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $plan = PlanInternet::findOrFail($id);

        $validated = $this->validarPlan($request, $plan);

        $previos = $plan->only(['nombrePlan', 'velocidadMbps', 'precioMensual', 'descripcion', 'activo']);

        $plan->update($validated);

        AuditLogger::log(
            'PLANES',
            'ACTUALIZAR_PLAN',
            "Plan de Internet {$plan->nombre_plan} actualizado.",
            $previos,
            $plan->only(['nombrePlan', 'velocidadMbps', 'precioMensual', 'descripcion', 'activo'])
        );

        return $this->success(
            ['plan' => $plan->fresh()],
            'Plan de Internet actualizado exitosamente.'
        );
    }

    /**
     * Dar de baja lógica un plan: se DESACTIVA, nunca se borra.
     */
    public function destroy(int $id): JsonResponse
    {
        $plan = PlanInternet::findOrFail($id);

        $plan->update(['activo' => false]);

        AuditLogger::log(
            'PLANES',
            'DESACTIVAR_PLAN',
            "Plan de Internet {$plan->nombre_plan} desactivado.",
            ['activo' => true],
            ['activo' => false]
        );

        return $this->success(
            ['plan' => $plan->fresh()],
            'Plan de Internet desactivado exitosamente.'
        );
    }

    /**
     * Activar un plan en el catálogo.
     */
    public function activar(int $id): JsonResponse
    {
        $plan = PlanInternet::findOrFail($id);
        $previos = $plan->only(['nombrePlan', 'velocidadMbps', 'precioMensual', 'descripcion', 'activo']);
        $plan->update(['activo' => true]);

        AuditLogger::log(
            'PLANES',
            'ACTIVAR_PLAN',
            "Plan de Internet {$plan->nombre_plan} activado.",
            $previos,
            $plan->only(['nombrePlan', 'velocidadMbps', 'precioMensual', 'descripcion', 'activo'])
        );

        return $this->success(
            ['plan' => $plan->fresh()],
            'Plan de Internet activado exitosamente.'
        );
    }

    /**
     * Desactivar un plan en el catálogo (alias de destroy).
     */
    public function desactivar(int $id): JsonResponse
    {
        return $this->destroy($id);
    }

    /**
     * Reglas de validación compartidas por crear y actualizar.
     * En creación los campos base son obligatorios; en actualización son
     * opcionales (`sometimes`) para permitir ediciones parciales (p. ej.
     * activar/desactivar sin reenviar todo el plan).
     */
    private function validarPlan(Request $request, ?PlanInternet $plan = null): array
    {
        $esCreacion = $plan === null;
        $req = $esCreacion ? 'required' : 'sometimes';
        $velocidad = $request->input('velocidad_mbps', $plan?->velocidad_mbps);

        return $request->validate([
            'nombre_plan'    => [
                $req,
                'string',
                'max:100',
                \Illuminate\Validation\Rule::unique('PlanInternet', 'nombrePlan')
                    ->where(fn ($q) => $q->where('velocidadMbps', (int) $velocidad))
                    ->ignore($plan?->idPlan, 'idPlan'),
            ],
            'velocidad_mbps' => $req . '|integer|min:1',
            'precio_mensual' => $req . '|numeric|min:0',
            'descripcion'    => 'nullable|string|max:1000',
            'activo'         => 'sometimes|boolean',
        ]);
    }
}
