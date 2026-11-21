<?php

namespace App\Http\Controllers\Paquetes\P3_ServiciosPlanes\CU14_RegistrarCorteRealizado;

use App\Http\Controllers\Controller;
use App\Models\Paquetes\P3_ServiciosPlanes\CU08_RegistrarActivarServicio\EstadoServicio;
use App\Models\Paquetes\P3_ServiciosPlanes\CU08_RegistrarActivarServicio\ServicioInternet;
use App\Models\Paquetes\P3_ServiciosPlanes\CU14_RegistrarCorteRealizado\RegistroCorte;
use App\Support\AuditLogger;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CorteRegistroController extends Controller
{
    use ApiResponse;

    /**
     * CU14 - Consultar listado de cortes ejecutados
     */
    public function index(Request $request): JsonResponse
    {
        $buscar     = trim((string) $request->input('buscar', ''));
        $tipoCorte  = strtoupper(trim((string) $request->input('tipo_corte', '')));
        $fechaDesde = $request->input('fecha_desde');
        $fechaHasta = $request->input('fecha_hasta');
        $perPage    = max(1, min(100, $request->integer('per_page', 15)));

        $query = RegistroCorte::with([
            'servicio.cliente',
            'servicio.zona',
            'servicio.asignacionPlanActual.plan',
            'tecnico',
        ]);

        if ($buscar !== '') {
            $query->where(function ($q) use ($buscar) {
                $idLimpio = ltrim(str_ireplace('COR-', '', $buscar), '0');
                if (is_numeric($idLimpio) && (int) $idLimpio > 0) {
                    $q->orWhere('idAccion', (int) $idLimpio);
                }
                $q->orWhere('motivo', 'like', "%{$buscar}%")
                  ->orWhere('observacion', 'like', "%{$buscar}%")
                  ->orWhereHas('servicio', function ($s) use ($buscar) {
                      $s->where('codigoServicio', 'like', "%{$buscar}%")
                        ->orWhere('ipAsignada', 'like', "%{$buscar}%")
                        ->orWhereHas('cliente', function ($c) use ($buscar) {
                            $c->where('nombreCompleto', 'like', "%{$buscar}%")
                              ->orWhere('ci', 'like', "%{$buscar}%")
                              ->orWhere('telefonoPrincipal', 'like', "%{$buscar}%");
                        });
                  });
            });
        }

        if (in_array($tipoCorte, ['LOGICO', 'FISICO'])) {
            if ($tipoCorte === 'FISICO') {
                $query->where(function ($q) {
                    $q->where('tipoAccion', 'like', '%FISICO%')
                      ->orWhere('observacion', 'like', '%FISICO%');
                });
            } else {
                $query->where(function ($q) {
                    $q->where('tipoAccion', 'like', '%LOGICO%')
                      ->orWhere('observacion', 'like', '%LOGICO%')
                      ->orWhere(function ($sub) {
                          $sub->where('tipoAccion', 'CORTE')
                              ->where('observacion', 'not like', '%FISICO%');
                      });
                });
            }
        }

        if ($fechaDesde) {
            $query->whereDate('fechaEjecucion', '>=', $fechaDesde);
        }
        if ($fechaHasta) {
            $query->whereDate('fechaEjecucion', '<=', $fechaHasta);
        }

        $query->orderByDesc('idAccion');

        $paginator = $query->paginate($perPage);

        $coleccion = $paginator->getCollection()->map(function (RegistroCorte $c) {
            return $this->transformCorte($c);
        });
        $paginator->setCollection($coleccion);

        // Métricas para tarjetas de cabecera
        $totalCortes = RegistroCorte::count();
        $cortesFisicos = RegistroCorte::where(function ($q) {
            $q->where('tipoAccion', 'like', '%FISICO%')
              ->orWhere('observacion', 'like', '%FISICO%');
        })->count();
        $cortesLogicos = max(0, $totalCortes - $cortesFisicos);
        $cortesMes = RegistroCorte::whereMonth('fechaEjecucion', now()->month)
            ->whereYear('fechaEjecucion', now()->year)
            ->count();

        return $this->success([
            'cortes'   => $paginator,
            'metricas' => [
                'total_cortes'   => $totalCortes,
                'cortes_logicos' => $cortesLogicos,
                'cortes_fisicos' => $cortesFisicos,
                'cortes_mes'     => $cortesMes,
            ],
        ], 'Listado de cortes obtenido exitosamente.');
    }

    /**
     * CU14 - Obtener lista de servicios activos elegibles para corte
     */
    public function serviciosActivos(Request $request): JsonResponse
    {
        $buscar = trim((string) $request->input('buscar', ''));

        $query = ServicioInternet::query()
            ->with(['cliente', 'zona', 'asignacionPlanActual.plan'])
            ->where(function ($q) {
                $q->where('estado_servicio', 'ACTIVO')
                  ->orWhereHas('estado', function ($e) {
                      $e->where('nombreEstado', 'ACTIVO');
                  });
            })
            ->when($buscar !== '', function ($q) use ($buscar) {
                $q->where(function ($sub) use ($buscar) {
                    $sub->where('codigoServicio', 'like', "%{$buscar}%")
                        ->orWhere('ipAsignada', 'like', "%{$buscar}%")
                        ->orWhereHas('cliente', function ($c) use ($buscar) {
                            $c->where('nombreCompleto', 'like', "%{$buscar}%")
                              ->orWhere('ci', 'like', "%{$buscar}%");
                        });
                });
            })
            ->latest('idServicio')
            ->limit(100);

        $servicios = $query->get()->map(function ($s) {
            $cliente = $s->cliente;
            $plan = $s->asignacionPlanActual?->plan;
            return [
                'id'                => (int) $s->idServicio,
                'codigo_servicio'   => $s->codigoServicio,
                'cliente_id'        => $s->idCliente,
                'cliente_nombre'    => $cliente?->nombreCompleto ?? 'Cliente',
                'cliente_ci'        => $cliente?->ci ?? '—',
                'cliente_telefono'  => $cliente?->telefonoPrincipal ?? '—',
                'cliente_direccion' => $s->direccion ?? $cliente?->direccion ?? '—',
                'zona_nombre'       => $s->zona?->nombreZona ?? '—',
                'plan_nombre'       => $plan?->nombrePlan ?? 'Plan estándar',
                'velocidad_mbps'    => $plan?->velocidadMbps ?? null,
                'ip_asignada'       => $s->ipAsignada ?? '—',
                'estado_servicio'   => $s->estado_servicio,
            ];
        });

        return $this->success($servicios, 'Servicios activos para corte obtenidos.');
    }

    /**
     * CU14 - Obtener detalle de un corte para comprobante
     */
    public function show(int $id): JsonResponse
    {
        $corte = RegistroCorte::with([
            'servicio.cliente',
            'servicio.zona',
            'servicio.asignacionPlanActual.plan',
            'tecnico',
        ])->findOrFail($id);

        return $this->success($this->transformCorte($corte), 'Detalle del corte obtenido exitosamente.');
    }

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

            $userId = $request->user()?->idUsuario ?? $request->user()?->id;

            $obsTecnica = trim(
                "[Tipo: {$validated['tipo_corte']}] " . ($validated['observaciones'] ?? '')
            );

            $corte = RegistroCorte::create([
                'tipoAccion'     => 'CORTE',
                'fechaSolicitud' => now(),
                'fechaEjecucion' => now(),
                'estado'         => 'COMPLETADO',
                'motivo'         => $validated['motivo'],
                'observacion'    => $obsTecnica,
                'idServicio'     => $servicio->idServicio,
                'idUsuario'      => $userId,
            ]);

            // Actualizar estado del servicio (columna heredada + relación UML).
            $estadoCortadoId = EstadoServicio::where('nombreEstado', 'CORTADO')
                ->orWhere('nombre_estado', 'CORTADO')
                ->value('idEstadoServicio') 
                ?? EstadoServicio::where('nombre_estado', 'CORTADO')->value('id');

            $servicio->update([
                'estado_servicio'    => 'CORTADO',
                'estado_servicio_id' => $estadoCortadoId,
                'idEstadoServicio'   => $estadoCortadoId,
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
                'corte'    => $this->transformCorte($corte),
                'servicio' => $servicio,
            ], 'Corte de servicio registrado y ejecutado exitosamente.', 201);
        });
    }

    /**
     * Normalizar objeto de corte a formato estándar para la vista
     */
    protected function transformCorte(RegistroCorte $corte): array
    {
        $servicio = $corte->servicio;
        $cliente  = $servicio?->cliente;
        $plan     = $servicio?->asignacionPlanActual?->plan;
        $tecnico  = $corte->tecnico;

        return [
            'id'                 => (int) $corte->idAccion,
            'codigo_orden'       => 'COR-' . str_pad($corte->idAccion, 5, '0', STR_PAD_LEFT),
            'codigo_orden_corte' => 'COR-' . str_pad($corte->idAccion, 5, '0', STR_PAD_LEFT),
            'servicio_id'        => (int) $corte->idServicio,
            'codigo_servicio'    => $servicio?->codigoServicio ?? ('SRV-' . $corte->idServicio),
            'cliente_id'         => $cliente?->idCliente,
            'cliente_nombre'     => $cliente?->nombreCompleto ?? 'Cliente Desconocido',
            'cliente_ci'         => $cliente?->ci ?? '—',
            'cliente_telefono'   => $cliente?->telefonoPrincipal ?? '—',
            'cliente_direccion'  => $servicio?->direccion ?? $cliente?->direccion ?? '—',
            'zona_nombre'        => $servicio?->zona?->nombreZona ?? '—',
            'plan_nombre'        => $plan?->nombrePlan ?? 'Plan Estándar',
            'velocidad_mbps'     => $plan?->velocidadMbps ?? null,
            'ip_asignada'        => $servicio?->ipAsignada ?? '—',
            'tipo_corte'         => $corte->tipo_corte,
            'motivo'             => $corte->motivo ?? 'Mora prolongada',
            'observaciones'      => $corte->observacion ?? '—',
            'fecha_corte'        => $corte->fechaEjecucion ? date('Y-m-d H:i:s', strtotime($corte->fechaEjecucion)) : null,
            'tecnico_id'         => $corte->idUsuario,
            'tecnico_nombre'     => $tecnico?->nombreCompleto ?? $tecnico?->nombreUsuario ?? 'Técnico Responsable',
            'estado'             => $corte->estado ?? 'COMPLETADO',
            'estado_servicio'    => $servicio?->estado_servicio ?? 'CORTADO',
        ];
    }
}
