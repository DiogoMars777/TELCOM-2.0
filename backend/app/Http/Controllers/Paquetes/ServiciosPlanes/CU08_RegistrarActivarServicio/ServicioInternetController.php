<?php

namespace App\Http\Controllers\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio;

use App\Http\Controllers\Controller;
use App\Models\Paquetes\GestionClientesZonas\CU04_ZonasCobertura\ZonaCobertura;
use App\Models\Paquetes\GestionClientesZonas\CU05_RegistrarCliente\Cliente;
use App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio\EstadoServicio;
use App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio\ServicioInternet;
use App\Models\Paquetes\ServiciosPlanes\CU16_GestionarCatalogoPlanes\PlanInternet;
use App\Models\Paquetes\ServiciosPlanes\CU17_AsignarCambiarPlanInternet\AsignacionPlan;
use App\Support\AuditLogger;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ServicioInternetController extends Controller
{
    use ApiResponse;

    /**
     * CU08 - Listar servicios de Internet (con soporte para búsqueda y paginación)
     */
    public function index(Request $request = null): JsonResponse
    {
        $request = $request ?? request();
        $query = ServicioInternet::with(['cliente', 'zona', 'estado', 'asignacionPlanActual.plan']);

        if ($request->filled('buscar')) {
            $patron = '%' . $request->input('buscar') . '%';
            $query->where(function ($q) use ($patron) {
                $q->where('codigo_servicio', 'like', $patron)
                    ->orWhere('codigoServicio', 'like', $patron)
                    ->orWhereHas('cliente', function ($c) use ($patron) {
                        $c->where('nombreCompleto', 'like', $patron)
                            ->orWhere('ci', 'like', $patron);
                    });
            });
        }

        $servicios = $query->latest('idServicio')->paginate(15);

        return $this->success($servicios, 'Servicios de Internet obtenidos exitosamente.');
    }

    public function listar(): JsonResponse
    {
        return $this->index(request());
    }

    /**
     * CU08 - Registrar solicitud y activación de servicio
     * Soporta tanto los payloads de formulario web como los de API / pruebas
     */
    public function store(Request $request): JsonResponse
    {
        $clienteId = $request->input('cliente_id') ?? $request->input('idCliente');
        if (!$clienteId) {
            return $this->error('Debe seleccionar un cliente.', 422, ['idCliente' => ['Debe seleccionar un cliente.']]);
        }

        $cliente = Cliente::find($clienteId);
        if (!$cliente) {
            return $this->error('El cliente seleccionado no existe.', 422, ['idCliente' => ['El cliente seleccionado no existe.']]);
        }

        // Determinar Plan
        $planId = $request->input('plan_id') ?? $request->input('idPlan');
        $plan = null;
        if ($planId) {
            $plan = PlanInternet::find($planId);
        }

        $planNombre = $request->input('plan_nombre') ?? $plan?->nombrePlan ?? 'Plan Estándar';
        $velocidadMbps = (int) ($request->input('velocidad_mbps') ?? $plan?->velocidadMbps ?? 30);
        $precioMensual = (float) ($request->input('precio_mensual') ?? $plan?->precioMensual ?? 130.00);

        if (!$plan) {
            $plan = PlanInternet::firstOrCreate(
                ['nombrePlan' => $planNombre],
                [
                    'velocidadMbps' => $velocidadMbps,
                    'precioMensual' => $precioMensual,
                    'descripcion'   => 'Plan asignado en contratación.',
                    'activo'        => true,
                ]
            );
            $planId = $plan->idPlan;
        }

        // Zona
        $zonaId = $request->input('idZona') ?? $request->input('zona_id') ?? $cliente->idZona;
        if (!$zonaId) {
            $zonaId = ZonaCobertura::first()?->idZona;
        }

        // Datos técnicos y red
        $ipAsignada = $request->input('ip_asignada') ?? $request->input('ipAsignada');
        $macRouter = $request->input('mac_router') ?? $request->input('macRouter');
        $tieneRed = !empty($ipAsignada) && !empty($macRouter);
        $estadoInicial = $tieneRed ? 'ACTIVO' : 'PENDIENTE_INSTALACION';

        $estadoActivo = EstadoServicio::where('nombreEstado', $estadoInicial)->first()
            ?? EstadoServicio::where('nombre_estado', $estadoInicial)->first()
            ?? EstadoServicio::first();
        $idEstado = $estadoActivo?->idEstadoServicio ?? $estadoActivo?->id ?? 2;

        $direccion = $request->input('direccion_instalacion') ?? $request->input('direccion') ?? $cliente->direccion ?? 'Domicilio del cliente';
        $diaCorte = (int) ($request->input('dia_corte') ?? $request->input('diaCorte') ?? 10);
        $codigoServicio = 'SRV-' . strtoupper(Str::random(6));

        $servicio = ServicioInternet::create([
            'codigoServicio'   => $codigoServicio,
            'idCliente'        => $cliente->idCliente,
            'idZona'           => $zonaId,
            'idEstadoServicio' => $idEstado,
            'estado_servicio'  => $estadoInicial,
            'fechaActivacion'  => $tieneRed ? now()->toDateString() : null,
            'fechaCorteBase'   => now()->toDateString(),
            'direccion'        => $direccion,
            'referencia'       => $request->input('referencia'),
            'latitud'          => is_numeric($request->input('latitud')) ? (float) $request->input('latitud') : null,
            'longitud'         => is_numeric($request->input('longitud')) ? (float) $request->input('longitud') : null,
            'usuarioWinbox'    => $request->input('usuarioWinbox'),
            'observacion'      => $request->input('observacion'),
            'diaCorte'         => $diaCorte,
            'ipAsignada'       => $ipAsignada,
            'macRouter'        => $macRouter,
            'plan_nombre'      => $planNombre,
            'velocidad_mbps'   => $velocidadMbps,
            'precio_mensual'   => $precioMensual,
            'fecha_instalacion'=> now(),
        ]);

        // Registrar asignación inicial de plan
        if ($planId) {
            AsignacionPlan::create([
                'idServicio'     => $servicio->idServicio,
                'idPlan'         => $planId,
                'fechaInicio'    => now()->toDateString(),
                'precioAplicado' => $precioMensual,
                'motivoCambio'   => 'Contratación inicial del servicio.',
                'idUsuario'      => auth()->id(),
            ]);
        }

        $servicio->load(['cliente', 'zona', 'estado', 'asignacionPlanActual.plan']);

        AuditLogger::log(
            'CU08',
            'REGISTRAR_SERVICIO',
            "Servicio {$servicio->codigo_servicio} registrado para el cliente {$cliente->nombreCompleto}.",
            null,
            ['id' => $servicio->id, 'codigo_servicio' => $servicio->codigo_servicio, 'estado_servicio' => $estadoInicial]
        );

        return $this->success($servicio, 'Servicio de Internet registrado exitosamente.', 201);
    }

    public function registrar(Request $request): JsonResponse
    {
        return $this->store($request);
    }

    /**
     * CU08 - Mostrar detalle de un servicio
     */
    public function show(int $id): JsonResponse
    {
        $servicio = ServicioInternet::with([
            'cliente',
            'zona',
            'estado',
            'asignacionPlanActual.plan',
            'asignacionesPlan.plan',
        ])->findOrFail($id);

        return $this->success($servicio, 'Servicio obtenido exitosamente.');
    }

    public function mostrar(int $id): JsonResponse
    {
        return $this->show($id);
    }

    /**
     * CU08 - Actualizar servicio existente
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $servicio = ServicioInternet::findOrFail($id);

        $validated = $request->validate([
            'idZona'          => 'nullable',
            'idPlan'          => 'nullable',
            'fechaActivacion' => 'nullable',
            'fechaCorteBase'  => 'nullable',
            'direccion'       => 'nullable|string|max:255',
            'referencia'      => 'nullable|string|max:255',
            'latitud'         => 'nullable',
            'longitud'        => 'nullable',
            'usuarioWinbox'   => 'nullable|string|max:100',
            'observacion'     => 'nullable|string|max:500',
            'diaCorte'        => 'nullable|integer',
            'ipAsignada'      => 'nullable|string|max:50',
            'macRouter'       => 'nullable|string|max:50',
        ]);

        $camposActualizar = array_filter($validated, fn($v) => !is_null($v));
        $servicio->update($camposActualizar);

        // Si se cambia el plan, registrar en AsignacionPlan
        if (!empty($validated['idPlan']) && $validated['idPlan'] != $servicio->asignacionPlanActual?->idPlan) {
            $plan = PlanInternet::findOrFail($validated['idPlan']);
            $servicio->asignacionPlanActual?->update(['fechaFin' => now()->toDateString()]);
            AsignacionPlan::create([
                'idServicio'     => $servicio->idServicio,
                'idPlan'         => $plan->idPlan,
                'fechaInicio'    => now()->toDateString(),
                'precioAplicado' => $plan->precioMensual,
                'motivoCambio'   => 'Cambio de plan por actualización administrativa.',
                'idUsuario'      => auth()->id(),
            ]);
        }

        $servicio->load(['cliente', 'zona', 'estado', 'asignacionPlanActual.plan']);

        AuditLogger::log(
            'CU08',
            'ACTUALIZAR_SERVICIO',
            "Servicio {$servicio->codigo_servicio} actualizado.",
            null,
            ['id' => $servicio->id, 'cambios' => $camposActualizar]
        );

        return $this->success($servicio, 'Servicio actualizado exitosamente.');
    }

    public function actualizar(Request $request, int $id): JsonResponse
    {
        return $this->update($request, $id);
    }

    /**
     * CU08 - Activar el servicio de Internet tras verificación técnica
     */
    public function activar(Request $request, int $id): JsonResponse
    {
        $servicio = ServicioInternet::findOrFail($id);

        $validated = $request->validate([
            'ip_asignada' => 'nullable|ip',
            'mac_router'  => 'nullable|string',
            'ipAsignada'  => 'nullable|string',
            'macRouter'   => 'nullable|string',
        ]);

        $ip = $validated['ip_asignada'] ?? $validated['ipAsignada'] ?? $servicio->ipAsignada;
        $mac = $validated['mac_router'] ?? $validated['macRouter'] ?? $servicio->macRouter;

        $estadoActivo = EstadoServicio::where('nombreEstado', 'ACTIVO')->first()
            ?? EstadoServicio::where('nombre_estado', 'ACTIVO')->first()
            ?? EstadoServicio::first();
        $idEstadoActivo = $estadoActivo?->idEstadoServicio ?? $estadoActivo?->id ?? 2;

        $servicio->update([
            'ipAsignada'       => $ip,
            'macRouter'        => $mac,
            'ip_asignada'      => $ip,
            'mac_router'       => $mac,
            'fechaActivacion'  => now()->toDateString(),
            'fecha_activacion' => now(),
            'idEstadoServicio' => $idEstadoActivo,
            'estado_servicio'  => 'ACTIVO',
        ]);

        $servicio->load(['cliente', 'zona', 'estado', 'asignacionPlanActual.plan']);

        AuditLogger::log(
            'CU08',
            'ACTIVAR_SERVICIO',
            "Servicio {$servicio->codigo_servicio} activado.",
            null,
            ['id' => $servicio->id, 'estado_servicio' => 'ACTIVO', 'ip_asignada' => $ip]
        );

        return $this->success($servicio, 'Servicio de Internet activado exitosamente.');
    }
}
