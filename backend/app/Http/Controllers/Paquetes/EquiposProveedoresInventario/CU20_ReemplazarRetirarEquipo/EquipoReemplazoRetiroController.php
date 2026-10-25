<?php

namespace App\Http\Controllers\Paquetes\EquiposProveedoresInventario\CU20_ReemplazarRetirarEquipo;

use App\Http\Controllers\Controller;
use App\Models\Paquetes\EquiposProveedoresInventario\CU18_RegistrarCatalogoUnidadesEquipos\Equipo;
use App\Models\Paquetes\EquiposProveedoresInventario\CU19_AsignarEquipoComodato\AsignacionEquipo;
use App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio\ServicioInternet;
use App\Support\AuditLogger;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EquipoReemplazoRetiroController extends Controller
{
    use ApiResponse;

    public function consultar(ServicioInternet $servicio): JsonResponse
    {
        $activa = AsignacionEquipo::with('equipo.producto')
            ->where('idServicio', $servicio->idServicio)
            ->whereNull('fechaRetiro')
            ->first();

        $historial = AsignacionEquipo::with('equipo.producto')
            ->where('idServicio', $servicio->idServicio)
            ->whereNotNull('fechaRetiro')
            ->orderByDesc('fechaAsignacion')
            ->orderByDesc('idAsignacionEquipo')
            ->get();

        return $this->success([
            'servicio' => $servicio,
            'asignacion_activa' => $activa,
            'equipo_actual' => $activa?->equipo,
            'historial' => $historial,
        ], 'Equipo actual e historial del servicio obtenidos exitosamente.');
    }

    public function disponibles(): JsonResponse
    {
        $equipos = Equipo::with('producto')
            ->where('asignada', false)
            ->where('estadoEquipo', 'OPERATIVO')
            ->orderBy('idEquipo')
            ->get();

        return $this->success(['equipos' => $equipos], 'Equipos disponibles obtenidos exitosamente.');
    }

    public function reemplazar(Request $request, ServicioInternet $servicio): JsonResponse
    {
        $validated = $request->validate([
            'equipo_nuevo_id' => 'required|integer',
            'motivo' => 'required|string|max:1000',
        ]);

        return DB::transaction(function () use ($validated, $servicio) {
            // Serializar cambios sobre el servicio y leer su snapshot actualizado.
            $servicio = ServicioInternet::lockForUpdate()->findOrFail($servicio->idServicio);
            $anterior = AsignacionEquipo::where('idServicio', $servicio->idServicio)
                ->whereNull('fechaRetiro')
                ->lockForUpdate()
                ->first();

            if (! $anterior) {
                return $this->error('El servicio no posee un equipo activo asignado.', 422);
            }

            $nuevo = Equipo::lockForUpdate()->find($validated['equipo_nuevo_id']);

            if (! $nuevo) {
                return $this->error('El equipo de reemplazo indicado no existe.', 422);
            }

            if ((int) $nuevo->idEquipo === (int) $anterior->idEquipo) {
                return $this->error('El equipo de reemplazo debe ser distinto del equipo actual.', 422);
            }

            if ($nuevo->asignada || $nuevo->estadoEquipo !== 'OPERATIVO') {
                return $this->error('El equipo de reemplazo no está disponible: debe estar libre y OPERATIVO.', 422);
            }

            $equipoAnterior = Equipo::lockForUpdate()->findOrFail($anterior->idEquipo);
            $previos = [
                'servicio' => $servicio->getAttributes(),
                'asignacion_anterior' => $anterior->getAttributes(),
                'equipo_anterior' => $equipoAnterior->getAttributes(),
            ];

            // Las columnas son DATE: ambas fechas provienen del mismo día del servidor.
            $fecha = now()->toDateString();
            $anterior->update(['fechaRetiro' => $fecha, 'motivoRetiro' => $validated['motivo']]);
            $equipoAnterior->update(['asignada' => false]);
            $nuevo->update(['asignada' => true]);

            $nueva = AsignacionEquipo::create([
                'fechaAsignacion' => $fecha,
                'fechaRetiro' => null,
                'motivoRetiro' => null,
                'idEquipo' => $nuevo->idEquipo,
                'idServicio' => $servicio->idServicio,
            ]);

            $servicio->update(['ipAsignada' => $nuevo->ip, 'macRouter' => $nuevo->mac]);

            AuditLogger::log(
                'CU20',
                'REEMPLAZAR_EQUIPO',
                "Equipo {$equipoAnterior->idEquipo} reemplazado por {$nuevo->idEquipo} en el servicio {$servicio->idServicio}.",
                $previos,
                [
                    'servicio' => $servicio->getAttributes(),
                    'asignacion_nueva' => $nueva->getAttributes(),
                    'equipo_nuevo' => $nuevo->getAttributes(),
                ]
            );

            return $this->success([
                'servicio' => $servicio,
                'asignacion_anterior' => $anterior,
                'asignacion_nueva' => $nueva->load('equipo.producto'),
                'equipo_anterior' => $equipoAnterior->load('producto'),
                'equipo_nuevo' => $nuevo->load('producto'),
            ], 'Equipo reemplazado exitosamente.');
        });
    }

    public function retirar(Request $request, ServicioInternet $servicio): JsonResponse
    {
        $validated = $request->validate([
            'motivo' => 'required|string|max:1000',
        ]);

        return DB::transaction(function () use ($validated, $servicio) {
            $servicio = ServicioInternet::lockForUpdate()->findOrFail($servicio->idServicio);
            $asignacion = AsignacionEquipo::where('idServicio', $servicio->idServicio)
                ->whereNull('fechaRetiro')
                ->lockForUpdate()
                ->first();

            if (! $asignacion) {
                return $this->error('El servicio no posee un equipo activo asignado.', 422);
            }

            $equipo = Equipo::lockForUpdate()->findOrFail($asignacion->idEquipo);
            $previos = [
                'servicio' => $servicio->getAttributes(),
                'asignacion' => $asignacion->getAttributes(),
                'equipo' => $equipo->getAttributes(),
            ];

            $asignacion->update([
                'fechaRetiro' => now()->toDateString(),
                'motivoRetiro' => $validated['motivo'],
            ]);
            $equipo->update(['asignada' => false]);
            $servicio->update(['ipAsignada' => null, 'macRouter' => null]);

            AuditLogger::log(
                'CU20',
                'RETIRAR_EQUIPO',
                "Equipo {$equipo->idEquipo} retirado del servicio {$servicio->idServicio}.",
                $previos,
                [
                    'servicio' => $servicio->getAttributes(),
                    'asignacion' => $asignacion->getAttributes(),
                    'equipo' => $equipo->getAttributes(),
                ]
            );

            return $this->success([
                'servicio' => $servicio,
                'asignacion_retirada' => $asignacion->load('equipo.producto'),
                'equipo_retirado' => $equipo->load('producto'),
            ], 'Equipo retirado exitosamente.');
        });
    }
}
