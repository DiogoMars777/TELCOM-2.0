<?php

namespace App\Http\Controllers\Paquetes\ServiciosPlanes\CU17_AsignarCambiarPlanInternet;

use App\Http\Controllers\Controller;
use App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio\ServicioInternet;
use App\Models\Paquetes\ServiciosPlanes\CU16_GestionarCatalogoPlanes\PlanInternet;
use App\Models\Paquetes\ServiciosPlanes\CU17_AsignarCambiarPlanInternet\AsignacionPlan;
use App\Support\AuditLogger;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * CU17 - Asignar o cambiar el plan de un servicio de Internet.
 *
 * El historial de planes NO se sobrescribe: cada cambio cierra la asignación
 * vigente (`fechaFin`) y crea una nueva dentro de una transacción. Se
 * reutilizan los modelos compartidos AsignacionPlan y PlanInternet.
 *
 * Permisos REALES (matriz RBAC existente):
 *  - planes.view   -> consultar el historial.
 *  - planes.assign -> asignar/cambiar plan (admin y secretaría).
 * El técnico no posee ninguno -> HTTP 403 (lo aplica el middleware).
 *
 * El contrato de la API lo consume el frontend (CU17 y CU08):
 *   GET  /api/cu08/servicios/{servicio}/planes  -> { data: { servicio, asignaciones } }
 *   POST /api/cu08/servicios/{servicio}/planes  -> { data: { asignacion } }
 */
class AsignacionPlanController extends Controller
{
    use ApiResponse;

    /**
     * Historial de planes de un servicio (más reciente primero).
     */
    public function index(ServicioInternet $servicio): JsonResponse
    {
        $asignaciones = AsignacionPlan::with(['plan', 'usuario:id,name,email'])
            ->where('servicio_id', $servicio->id)
            ->orderByDesc('fecha_inicio')
            ->orderByDesc('id')
            ->get();

        return $this->success([
            'servicio'     => $servicio->only([
                'id', 'codigo_servicio', 'plan_nombre', 'velocidad_mbps',
                'precio_mensual', 'estado_servicio', 'estado_servicio_id',
            ]),
            'asignaciones' => $asignaciones,
        ], 'Historial de planes del servicio obtenido exitosamente.');
    }

    /**
     * Asignar (o cambiar) el plan de un servicio.
     *
     * Reglas:
     *  - El plan debe existir y estar ACTIVO.
     *  - Se cierra la asignación vigente (fecha_fin) SIN borrarla.
     *  - Se crea una nueva asignación con el usuario autenticado (UML "registra").
     */
    public function store(Request $request, ServicioInternet $servicio): JsonResponse
    {
        $validated = $request->validate([
            'plan_id' => [
                'required',
                'integer',
                Rule::exists('PlanInternet', 'idPlan')->where('activo', true),
            ],
            'motivo_cambio' => 'nullable|string|max:255',
        ], [
            'plan_id.exists' => 'El plan indicado no existe o está inactivo.',
        ]);

        $plan = PlanInternet::findOrFail($validated['plan_id']);
        // La fecha de inicio y el autor son SIEMPRE datos del servidor. El
        // `user_id` que pudiera enviar el frontend se ignora por completo.
        $fecha = now()->toDateString();
        $userId = $request->user()->id;

        $asignacion = DB::transaction(function () use ($servicio, $plan, $validated, $fecha, $userId) {
            // Asignación vigente anterior (si existe) para la auditoría.
            $anterior = AsignacionPlan::where('idServicio', $servicio->idServicio)
                ->whereNull('fechaFin')
                ->first();

            // Cerrar la asignación vigente conservando el historial.
            AsignacionPlan::where('idServicio', $servicio->idServicio)
                ->whereNull('fechaFin')
                ->update(['fechaFin' => $fecha]);


            $nueva = AsignacionPlan::create([
                'servicio_id'     => $servicio->id,
                'plan_id'         => $plan->id,
                'user_id'         => $userId,
                'fecha_inicio'    => $fecha,
                'fecha_fin'       => null,
                'precio_aplicado' => $plan->precio_mensual,
                'motivo_cambio'   => $validated['motivo_cambio'] ?? 'Asignación de plan',
            ]);

            // Mantener coherente el "snapshot" legado que ya consume CU08.
            // Los valores y precios históricos quedan preservados en
            // `asignaciones_plan`; NO se tocan mensualidades ni pagos ya emitidos.
            $servicio->update([
                'plan_nombre'    => $plan->nombre_plan,
                'velocidad_mbps' => $plan->velocidad_mbps,
                'precio_mensual' => $plan->precio_mensual,
            ]);

            AuditLogger::log(
                'CU17',
                'ASIGNAR_PLAN',
                "Plan {$plan->nombre_plan} asignado al servicio {$servicio->codigo_servicio}.",
                $anterior ? [
                    'asignacion_id'   => $anterior->id,
                    'plan_id'         => $anterior->plan_id,
                    'precio_aplicado' => $anterior->precio_aplicado,
                    'fecha_inicio'    => is_string($anterior->fecha_inicio) ? $anterior->fecha_inicio : $anterior->fecha_inicio?->toDateString(),
                ] : null,
                ['servicio_id' => $servicio->id, 'plan_id' => $plan->id, 'precio_aplicado' => $plan->precio_mensual]
            );

            return $nueva;
        });

        return $this->success(
            ['asignacion' => $asignacion->load(['plan', 'usuario:id,name,email'])],
            'Plan asignado al servicio exitosamente.',
            201
        );
    }
}
