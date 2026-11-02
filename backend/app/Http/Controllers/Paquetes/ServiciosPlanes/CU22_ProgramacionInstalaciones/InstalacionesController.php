<?php

namespace App\Http\Controllers\Paquetes\ServiciosPlanes\CU22_ProgramacionInstalaciones;

use App\Http\Controllers\Controller;
use App\Models\Paquetes\ServiciosPlanes\CU22_ProgramacionInstalaciones\Instalacion;
use App\Models\Paquetes\ServiciosPlanes\CU22_ProgramacionInstalaciones\SolicitudInstalacion;
use App\Models\Paquetes\ServiciosPlanes\CU22_ProgramacionInstalaciones\Tecnico;
use App\Support\AuditLogger;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InstalacionesController extends Controller
{
    use ApiResponse;

    /**
     * CU22 - Listar solicitudes pendientes de instalación, técnicos activos y agenda.
     */
    public function index(): JsonResponse
    {
        // 1. Solicitudes que requieren programación o están en curso
        $solicitudes = SolicitudInstalacion::with(['cliente', 'instalacion.tecnico'])
            ->whereIn('estadoSolicitud', ['PENDIENTE', 'PROGRAMADA'])
            ->orderByRaw("CASE WHEN \"estadoSolicitud\" = 'PENDIENTE' THEN 1 ELSE 2 END")
            ->latest('idSolicitud')
            ->get();

        // 2. Cuadrillas técnicas activas disponibles para asignación
        $tecnicos = Tecnico::where('activo', true)
            ->orderBy('nombreCompleto', 'asc')
            ->get();

        // 3. Agenda de instalaciones ya programadas (para validación visual de cruce de horarios)
        $agenda = Instalacion::with(['tecnico', 'solicitud.cliente'])
            ->where('estadoInstalacion', 'PROGRAMADA')
            ->orderBy('fechaProgramada', 'asc')
            ->get();

        return $this->success([
            'solicitudes' => $solicitudes,
            'tecnicos'    => $tecnicos,
            'agenda'      => $agenda,
        ], 'Solicitudes de instalación obtenidas exitosamente.');
    }

    /**
     * CU22 - Programar orden de instalación y asignar cuadrilla técnica.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'solicitud_id'      => 'required|exists:SolicitudInstalacion,idSolicitud',
            'tecnico_id'        => 'required|exists:Tecnico,idTecnico',
            'fecha_programada'  => 'required|date|after_or_equal:today',
            'hora_programada'   => 'nullable|string|max:10',
            'costo_instalacion' => 'nullable|numeric|min:0',
            'observaciones'     => 'nullable|string|max:500',
        ]);

        $hora = !empty($validated['hora_programada']) ? $validated['hora_programada'] : '09:00';

        // Validación de no cruce de horarios para el mismo técnico
        $cruceHorario = Instalacion::where('idTecnico', $validated['tecnico_id'])
            ->where('fechaProgramada', $validated['fecha_programada'])
            ->where('horaProgramada', $hora)
            ->where('estadoInstalacion', 'PROGRAMADA')
            ->exists();

        if ($cruceHorario) {
            $tecnicoNombre = Tecnico::where('idTecnico', $validated['tecnico_id'])->value('nombreCompleto');
            return $this->error(
                "El técnico {$tecnicoNombre} ya tiene una instalación programada el {$validated['fecha_programada']} a las {$hora}. Elija otro horario o técnico.",
                422
            );
        }

        return DB::transaction(function () use ($validated, $hora) {
            $solicitud = SolicitudInstalacion::lockForUpdate()->findOrFail($validated['solicitud_id']);

            if (in_array($solicitud->estadoSolicitud, ['INSTALADO', 'FINALIZADO', 'CANCELADA'])) {
                return $this->error(
                    "La solicitud {$solicitud->numeroOrden} no puede ser programada porque su estado actual es {$solicitud->estadoSolicitud}.",
                    422
                );
            }

            $estadoAnterior = $solicitud->estadoSolicitud;

            // Actualizar o crear la orden de instalación
            $instalacion = Instalacion::updateOrCreate(
                ['idSolicitud' => $solicitud->idSolicitud],
                [
                    'idTecnico'         => $validated['tecnico_id'],
                    'fechaProgramada'   => $validated['fecha_programada'],
                    'horaProgramada'    => $hora,
                    'costoInstalacion'  => $validated['costo_instalacion'] ?? 150.00,
                    'estadoInstalacion' => 'PROGRAMADA',
                    'observacion'       => $validated['observaciones'] ?? 'Instalación programada para cuadrilla técnica.',
                ]
            );

            // Transicionar estado de la solicitud
            $solicitud->update([
                'estadoSolicitud' => 'PROGRAMADA',
            ]);
            $solicitud->refresh();

            $tecnico = Tecnico::find($validated['tecnico_id']);

            // Registro obligatorio en Bitácora de Auditoría
            AuditLogger::log(
                'CU22',
                'PROGRAMAR_INSTALACION',
                "Instalación programada para solicitud {$solicitud->numeroOrden} asignada a técnico {$tecnico->nombreCompleto} para el {$validated['fecha_programada']} a las {$hora}.",
                [
                    'estado_solicitud' => $estadoAnterior,
                    'solicitud_id'     => $solicitud->idSolicitud,
                ],
                [
                    'estado_solicitud' => 'PROGRAMADA',
                    'instalacion_id'   => $instalacion->idInstalacion,
                    'tecnico_id'       => $tecnico->idTecnico,
                    'tecnico_nombre'   => $tecnico->nombreCompleto,
                    'fecha_programada' => $validated['fecha_programada'],
                    'hora_programada'  => $hora,
                ]
            );

            // Cargar relaciones para respuesta completa
            $instalacion->load(['tecnico', 'solicitud.cliente']);

            return $this->success([
                'instalacion' => $instalacion,
                'solicitud'   => $solicitud,
            ], 'Instalación programada y técnico asignado exitosamente.', 201);
        });
    }
}
