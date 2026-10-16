<?php

namespace App\Http\Controllers\Paquetes\ServiciosPlanes\CU15_ListaRegistroReactivaciones;

use App\Http\Controllers\Controller;
use App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio\EstadoServicio;
use App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio\ServicioInternet;
use App\Models\Paquetes\ServiciosPlanes\CU15_ListaRegistroReactivaciones\ReactivacionServicio;
use App\Support\AuditLogger;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ReactivacionesController extends Controller
{
    use ApiResponse;

    /**
     * CU15 - Gestionar lista de reactivaciones
     */
    public function index(): JsonResponse
    {
        $reactivaciones = ReactivacionServicio::with(['servicio.cliente', 'pago', 'operador:id,name'])
            ->latest()
            ->paginate(15);

        return $this->success($reactivaciones, 'Lista de reactivaciones obtenida exitosamente.');
    }

    /**
     * CU15 - Registrar reactivación de un servicio cortado
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'servicio_id'        => 'required|exists:ServicioInternet,idServicio',
            'pago_id'            => 'nullable|exists:Pago,idPago',
            'costo_reactivacion' => 'nullable|numeric|min:0',
            'observaciones'      => 'nullable|string|max:500',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $servicio = ServicioInternet::lockForUpdate()->findOrFail($validated['servicio_id']);

            if ($servicio->estado_servicio !== 'CORTADO') {
                return $this->error(
                    'Solo se puede reactivar un servicio CORTADO. Estado actual: '.$servicio->estado_servicio.'.',
                    422
                );
            }

            $reactivacion = ReactivacionServicio::create([
                'codigo_reactivacion' => 'REA-' . date('Ymd') . '-' . strtoupper(Str::random(4)),
                'servicio_id'         => $servicio->id,
                'pago_id'             => $validated['pago_id'] ?? null,
                'user_id'             => $request->user()->id,
                'fecha_reactivacion'  => now(),
                'costo_reactivacion'  => $validated['costo_reactivacion'] ?? 0.00,
                'observaciones'       => $validated['observaciones'] ?? null,
            ]);

            // Reactivar servicio (columna heredada + relación UML).
            $servicio->update([
                'estado_servicio'    => 'ACTIVO',
                'estado_servicio_id' => EstadoServicio::where('nombre_estado', 'ACTIVO')->value('id'),
            ]);
            $servicio->refresh();

            AuditLogger::log(
                'CU15',
                'REACTIVAR_SERVICIO',
                "Servicio {$servicio->codigo_servicio} reactivado ({$reactivacion->codigo_reactivacion}).",
                ['estado_servicio' => 'CORTADO'],
                ['estado_servicio' => 'ACTIVO', 'costo_reactivacion' => $reactivacion->costo_reactivacion]
            );

            return $this->success([
                'reactivacion' => $reactivacion,
                'servicio'     => $servicio,
            ], 'Servicio reactivado exitosamente.', 201);
        });
    }
}
