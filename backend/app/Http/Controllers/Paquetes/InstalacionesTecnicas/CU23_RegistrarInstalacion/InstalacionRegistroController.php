<?php

namespace App\Http\Controllers\Paquetes\InstalacionesTecnicas\CU23_RegistrarInstalacion;

use App\Http\Controllers\Controller;
use App\Models\Paquetes\InstalacionesTecnicas\CU23_RegistrarInstalacion\Instalacion;
use App\Models\Paquetes\InstalacionesTecnicas\CU23_RegistrarInstalacion\SolicitudInstalacion;
use App\Models\Paquetes\InstalacionesTecnicas\CU23_RegistrarInstalacion\Tecnico;
use App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio\ServicioInternet;
use App\Support\AuditLogger;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * CU23 - Registrar y Gestionar Órdenes de Instalación Técnica.
 * Paquete: InstalacionesTecnicas
 */
class InstalacionRegistroController extends Controller
{
    use ApiResponse;

    /**
     * Listar instalaciones técnicas programadas y en curso.
     * Filtros opcionales: ?estado=PROGRAMADA|FINALIZADA&tecnico_id=...
     */
    public function index(Request $request): JsonResponse
    {
        $query = Instalacion::with(['solicitud.cliente', 'tecnico', 'servicio']);

        if ($request->filled('estado')) {
            $query->where('estadoInstalacion', $request->string('estado'));
        }

        if ($request->filled('tecnico_id')) {
            $query->where('idTecnico', $request->integer('tecnico_id'));
        }

        return $this->success(
            ['instalaciones' => $query->orderByDesc('fechaProgramada')->get()],
            'Listado de instalaciones obtenido exitosamente.'
        );
    }

    /**
     * Registrar una nueva solicitud técnica y generar su orden de instalación.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'cliente_id'        => 'required|integer|exists:Cliente,idCliente',
            'servicio_id'       => 'nullable|integer|exists:ServicioInternet,idServicio',
            'direccion'         => 'required|string',
            'referencia'        => 'nullable|string',
            'latitud'           => 'nullable|numeric',
            'longitud'          => 'nullable|numeric',
            'fecha_programada'  => 'required|date|after_or_equal:today',
            'costo_instalacion' => 'nullable|numeric|min:0',
            'tecnico_id'        => 'nullable|integer|exists:Tecnico,idTecnico',
            'observacion'       => 'nullable|string',
        ]);

        $instalacion = DB::transaction(function () use ($validated) {
            $numeroOrden = 'ORD-' . date('Ym') . '-' . str_pad((string) (SolicitudInstalacion::count() + 1), 4, '0', STR_PAD_LEFT);

            $solicitud = SolicitudInstalacion::create([
                'idCliente'       => $validated['cliente_id'],
                'numeroOrden'     => $numeroOrden,
                'fechaSolicitud'  => now()->toDateString(),
                'direccion'       => $validated['direccion'],
                'referencia'      => $validated['referencia'] ?? null,
                'latitud'         => $validated['latitud'] ?? null,
                'longitud'        => $validated['longitud'] ?? null,
                'estadoSolicitud' => 'PROGRAMADA',
                'observacion'     => $validated['observacion'] ?? null,
            ]);

            return Instalacion::create([
                'idSolicitud'       => $solicitud->idSolicitud,
                'idServicio'        => $validated['servicio_id'] ?? null,
                'idTecnico'         => $validated['tecnico_id'] ?? null,
                'fechaProgramada'   => $validated['fecha_programada'],
                'costoInstalacion'  => $validated['costo_instalacion'] ?? 0.00,
                'estadoInstalacion' => 'PROGRAMADA',
                'observacion'       => $validated['observacion'] ?? null,
            ]);
        });

        $instalacion->load(['solicitud.cliente', 'tecnico', 'servicio']);

        AuditLogger::log(
            'INSTALACIONES_TECNICAS',
            'REGISTRAR_INSTALACION',
            "Orden de instalación {$instalacion->solicitud->numeroOrden} agendada para el cliente ID {$validated['cliente_id']}",
            null,
            $instalacion->toArray()
        );

        return $this->success(
            ['instalacion' => $instalacion],
            'Orden de instalación registrada y programada exitosamente.',
            201
        );
    }

    /**
     * Consultar detalle de una orden de instalación técnica.
     */
    public function show(int $id): JsonResponse
    {
        $instalacion = Instalacion::with(['solicitud.cliente', 'tecnico', 'servicio'])->find($id);

        if (!$instalacion) {
            return $this->error('La orden de instalación solicitada no existe.', 404);
        }

        return $this->success(['instalacion' => $instalacion]);
    }

    /**
     * Asignar o reasignar técnico responsable de la instalación.
     */
    public function asignarTecnico(Request $request, int $id): JsonResponse
    {
        $instalacion = Instalacion::with('solicitud')->find($id);

        if (!$instalacion) {
            return $this->error('La instalación no existe.', 404);
        }

        $validated = $request->validate([
            'tecnico_id' => 'required|integer|exists:Tecnico,idTecnico',
        ]);

        $previos = $instalacion->toArray();
        $instalacion->update([
            'idTecnico'         => $validated['tecnico_id'],
            'estadoInstalacion' => 'ASIGNADA',
        ]);

        AuditLogger::log(
            'INSTALACIONES_TECNICAS',
            'ASIGNAR_TECNICO',
            "Se asignó el técnico ID {$validated['tecnico_id']} a la instalación ID {$id}",
            $previos,
            $instalacion->toArray()
        );

        return $this->success(
            ['instalacion' => $instalacion->fresh(['tecnico', 'solicitud.cliente'])],
            'Técnico asignado a la cuadrilla de instalación correctamente.'
        );
    }

    /**
     * Registrar la finalización técnica de la instalación.
     */
    public function finalizar(Request $request, int $id): JsonResponse
    {
        $instalacion = Instalacion::with(['solicitud', 'servicio'])->find($id);

        if (!$instalacion) {
            return $this->error('La instalación no existe.', 404);
        }

        $validated = $request->validate([
            'fecha_realizada' => 'required|date',
            'observacion'     => 'nullable|string',
        ]);

        $previos = $instalacion->toArray();

        DB::transaction(function () use ($instalacion, $validated) {
            $instalacion->update([
                'fechaRealizada'    => $validated['fecha_realizada'],
                'estadoInstalacion' => 'FINALIZADA',
                'observacion'       => $validated['observacion'] ?? $instalacion->observacion,
            ]);

            if ($instalacion->solicitud) {
                $instalacion->solicitud->update(['estadoSolicitud' => 'COMPLETADA']);
            }
        });

        AuditLogger::log(
            'INSTALACIONES_TECNICAS',
            'FINALIZAR_INSTALACION',
            "Instalación ID {$id} marcada como FINALIZADA el {$validated['fecha_realizada']}",
            $previos,
            $instalacion->toArray()
        );

        return $this->success(
            ['instalacion' => $instalacion->fresh(['solicitud.cliente', 'tecnico', 'servicio'])],
            'Instalación técnica finalizada exitosamente.'
        );
    }

    /**
     * Listar técnicos habilitados.
     */
    public function tecnicos(): JsonResponse
    {
        $tecnicos = Tecnico::where('activo', true)->orderBy('nombreCompleto')->get();

        return $this->success(
            ['tecnicos' => $tecnicos],
            'Técnicos obtenidos exitosamente.'
        );
    }
}

