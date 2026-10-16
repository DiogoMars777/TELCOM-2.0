<?php

namespace App\Http\Controllers\Paquetes\ServiciosPlanes\CU14_RegistrarCorteRealizado;

use App\Http\Controllers\Controller;
use App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio\EstadoServicio;
use App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio\ServicioInternet;
use App\Models\Paquetes\ServiciosPlanes\CU14_RegistrarCorteRealizado\RegistroCorte;
use App\Support\AuditLogger;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CorteRegistroController extends Controller
{
    use ApiResponse;

    /**
     * CU14 - Registrar ejecución de corte de servicio
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'servicio_id'   => 'required|exists:ServicioInternet,idServicio',
            'tipo_corte'    => 'required|in:LOGICO,FISICO',
            'motivo'        => 'required|string|max:255',
            'observaciones' => 'nullable|string|max:500',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $servicio = ServicioInternet::lockForUpdate()->findOrFail($validated['servicio_id']);

            if ($servicio->estado_servicio !== 'ACTIVO') {
                return $this->error(
                    'Solo se puede cortar un servicio ACTIVO. Estado actual: '.$servicio->estado_servicio.'.',
                    422
                );
            }

            $corte = RegistroCorte::create([
                'codigo_orden_corte' => 'COR-' . date('Ymd') . '-' . strtoupper(Str::random(4)),
                'servicio_id'        => $servicio->id,
                'tecnico_user_id'    => $request->user()->id,
                'tipo_corte'         => $validated['tipo_corte'],
                'motivo'             => $validated['motivo'],
                'fecha_corte'        => now(),
                'observaciones'      => $validated['observaciones'] ?? null,
            ]);

            // Actualizar estado del servicio (columna heredada + relación UML).
            $servicio->update([
                'estado_servicio'    => 'CORTADO',
                'estado_servicio_id' => EstadoServicio::where('nombre_estado', 'CORTADO')->value('id'),
            ]);
            $servicio->refresh();

            AuditLogger::log(
                'CU14',
                'REGISTRAR_CORTE',
                "Corte {$corte->codigo_orden_corte} del servicio {$servicio->codigo_servicio} ({$validated['tipo_corte']}).",
                ['estado_servicio' => 'ACTIVO'],
                ['estado_servicio' => 'CORTADO', 'tipo_corte' => $validated['tipo_corte']]
            );

            return $this->success([
                'corte'    => $corte,
                'servicio' => $servicio,
            ], 'Corte de servicio registrado y ejecutado exitosamente.', 201);
        });
    }
}
