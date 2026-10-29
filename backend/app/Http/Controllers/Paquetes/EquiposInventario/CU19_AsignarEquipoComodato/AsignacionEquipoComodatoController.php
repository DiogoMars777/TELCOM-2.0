<?php

namespace App\Http\Controllers\Paquetes\EquiposInventario\CU19_AsignarEquipoComodato;

use App\Http\Controllers\Controller;
use App\Models\Paquetes\EquiposInventario\CU19_AsignarEquipoComodato\AsignacionEquipo;
use App\Models\Paquetes\EquiposInventario\CU19_AsignarEquipoComodato\Equipo;
use App\Models\Paquetes\EquiposInventario\CU19_AsignarEquipoComodato\Inventario;
use App\Models\Paquetes\EquiposInventario\CU19_AsignarEquipoComodato\ProductoEquipo;
use App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio\ServicioInternet;
use App\Support\AuditLogger;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * CU19 - Asignar equipo en comodato a un servicio de Internet.
 *
 * Propósito:
 * Registrar la entrega y asignación formal de un equipo (ONU, Router o Modem)
 * en calidad de comodato a un servicio de Internet ACTIVO del cliente.
 *
 * Actores:
 * Administrador, Secretaría, Técnico (según permisos RBAC: equipos.view y equipos.assign).
 */
class AsignacionEquipoComodatoController extends Controller
{
    use ApiResponse;

    /**
     * Listado general de asignaciones de equipos en comodato.
     */
    public function index(Request $request): JsonResponse
    {
        $query = AsignacionEquipo::with([
            'equipo.producto',
            'servicio.cliente',
            'servicio.estado',
        ]);

        if ($request->filled('vigente')) {
            $esVigente = filter_var($request->query('vigente'), FILTER_VALIDATE_BOOLEAN);
            if ($esVigente) {
                $query->whereNull('fechaRetiro');
            } else {
                $query->whereNotNull('fechaRetiro');
            }
        }

        if ($request->filled('servicio_id')) {
            $query->where('idServicio', $request->query('servicio_id'));
        }

        if ($request->filled('buscar')) {
            $term = '%' . trim($request->query('buscar')) . '%';
            $query->where(function ($q) use ($term) {
                $q->whereHas('equipo', function ($sub) use ($term) {
                    $sub->where('numeroSerie', 'like', $term)
                        ->orWhere('mac', 'like', $term);
                })->orWhereHas('servicio', function ($sub) use ($term) {
                    $sub->where('codigoServicio', 'like', $term)
                        ->orWhereHas('cliente', function ($cli) use ($term) {
                            $cli->where('nombreCompleto', 'like', $term)
                                ->orWhere('ci', 'like', $term)
                                ->orWhere('codigoCliente', 'like', $term);
                        });
                });
            });
        }

        $asignaciones = $query->orderByDesc('idAsignacionEquipo')->paginate(20);

        return $this->success($asignaciones, 'Listado de equipos en comodato obtenido exitosamente.');
    }

    /**
     * Listado de servicios de Internet disponibles para asignación en comodato.
     * Precondición: el cliente debe contar con un servicio de Internet ACTIVO.
     */
    public function serviciosActivos(Request $request): JsonResponse
    {
        $query = ServicioInternet::with([
            'cliente',
            'estado',
            'zona',
            'asignacionPlanActual.plan',
            'equipoComodatoActual.equipo.producto',
        ]);

        // Filtro por término de búsqueda (código de servicio, nombre cliente, CI)
        if ($request->filled('buscar')) {
            $term = '%' . trim($request->query('buscar')) . '%';
            $query->where(function ($q) use ($term) {
                $q->where('codigoServicio', 'like', $term)
                  ->orWhere('direccion', 'like', $term)
                  ->orWhere('ipAsignada', 'like', $term)
                  ->orWhere('macRouter', 'like', $term)
                  ->orWhereHas('cliente', function ($c) use ($term) {
                      $c->where('nombreCompleto', 'like', $term)
                        ->orWhere('ci', 'like', $term)
                        ->orWhere('codigoCliente', 'like', $term);
                  });
            });
        }

        // Filtro de solo activos si se especifica (por defecto muestra todos para que el usuario
        // pueda intentar seleccionar y el sistema aplique la validación de negocio).
        if ($request->boolean('solo_activos', false)) {
            $query->where('estado_servicio', 'ACTIVO');
        }

        $servicios = $query->orderBy('idServicio', 'desc')->paginate(25);

        return $this->success($servicios, 'Servicios consultados exitosamente.');
    }

    /**
     * Listado de equipos disponibles en stock (filtrados por tipo de dispositivo o búsqueda por serie/MAC).
     */
    public function equiposDisponibles(Request $request): JsonResponse
    {
        $query = Equipo::with(['producto.inventario'])
            ->disponibles();

        // Filtro por tipo de dispositivo (ej: ONU, Router, Modem)
        if ($request->filled('tipo_equipo')) {
            $tipo = trim($request->query('tipo_equipo'));
            $query->whereHas('producto', function ($q) use ($tipo) {
                $q->whereRaw('LOWER("tipoEquipo") = ?', [strtolower($tipo)]);
            });
        }

        // Filtro por producto específico
        if ($request->filled('producto_id')) {
            $query->where('idProducto', $request->query('producto_id'));
        }

        // Búsqueda por número de serie o MAC (soporte para escáner de código de barras)
        if ($request->filled('buscar')) {
            $term = '%' . trim($request->query('buscar')) . '%';
            $query->where(function ($q) use ($term) {
                $q->where('numeroSerie', 'like', $term)
                  ->orWhere('mac', 'like', $term)
                  ->orWhere('ip', 'like', $term);
            });
        }

        $equipos = $query->orderBy('idEquipo', 'desc')->get();

        // Tipos de equipos disponibles en catálogo
        $tiposDisponibles = ProductoEquipo::select('tipoEquipo')
            ->whereNotNull('tipoEquipo')
            ->distinct()
            ->pluck('tipoEquipo');

        // Resumen de stock por producto
        $productosStock = ProductoEquipo::with('inventario')
            ->where('estado', 'DISPONIBLE')
            ->orWhereNull('estado')
            ->get();

        return $this->success([
            'equipos'          => $equipos,
            'total_disponibles' => $equipos->count(),
            'tipos_disponibles' => $tiposDisponibles,
            'productos_stock'  => $productosStock,
        ], 'Equipos disponibles en stock obtenidos exitosamente.');
    }

    /**
     * Historial y equipos en comodato vinculados a un servicio específico.
     */
    public function showServicioEquipos(int $servicioId): JsonResponse
    {
        $servicio = ServicioInternet::with([
            'cliente',
            'estado',
            'zona',
            'asignacionPlanActual.plan',
            'asignacionesEquipo.equipo.producto',
        ])->findOrFail($servicioId);

        $comodatoVigente = $servicio->asignacionesEquipo->firstWhere('es_vigente', true);
        $historial = $servicio->asignacionesEquipo->sortByDesc('idAsignacionEquipo')->values();

        return $this->success([
            'servicio'         => $servicio,
            'comodato_vigente' => $comodatoVigente,
            'historial'        => $historial,
        ], 'Equipos en comodato del servicio obtenidos exitosamente.');
    }

    /**
     * Asignar un equipo en comodato a un servicio de Internet.
     *
     * Validaciones y reglas de negocio:
     * 1. El cliente debe contar con un servicio de Internet activo (Precondición).
     *    Si el servicio no está activo -> rechaza con error de servicio suspendido/inactivo.
     * 2. El equipo debe estar disponible y no asignado a otro servicio (Precondición).
     *    Si el equipo ya está asignado o inactivo -> rechaza con alerta de stock.
     * 3. Registra el comodato en AsignacionEquipo, actualiza el estado del equipo a 'ASIGNADO',
     *    decrementa el inventario y audita la acción en Bitacora.
     */
    public function asignar(Request $request, int $servicioId): JsonResponse
    {
        $validated = $request->validate([
            'equipo_id'          => 'nullable|integer',
            'numero_serie'       => 'nullable|string|max:100',
            'mac'                => 'nullable|string|max:50',
            'fecha_asignacion'   => 'nullable|date',
            'reemplazar_vigente' => 'nullable|boolean',
            'motivo_reemplazo'   => 'nullable|string|max:255',
            'observaciones'      => 'nullable|string|max:500',
        ]);

        try {
            // 1. Validar existencia del servicio
            $servicio = ServicioInternet::with(['cliente', 'estado'])->find($servicioId);
            if (! $servicio) {
                return $this->error('Servicio inexistente o suspendido: el servicio no existe en la base de datos.', 422);
            }

            // Excepción de negocio CU19: Servicio inexistente o suspendido -> impide la asociación
            $estadoServicio = strtoupper(trim($servicio->estado_servicio ?? ''));
            if ($estadoServicio !== 'ACTIVO') {
                return $this->error(
                    "Servicio inexistente o suspendido. El servicio {$servicio->codigo_servicio} se encuentra en estado '{$estadoServicio}'. Solo es posible asociar equipos en comodato a servicios con estado ACTIVO.",
                    422
                );
            }

            // 2. Buscar y validar el equipo
            $equipoQuery = Equipo::with('producto.inventario');
            if (! empty($validated['equipo_id'])) {
                $equipoQuery->where('idEquipo', $validated['equipo_id']);
            } elseif (! empty($validated['numero_serie'])) {
                $equipoQuery->where('numeroSerie', trim($validated['numero_serie']));
            } elseif (! empty($validated['mac'])) {
                $equipoQuery->where('mac', trim($validated['mac']));
            } else {
                return $this->error('Debe especificar un equipo mediante su identificador, número de serie o dirección MAC.', 422);
            }

            $equipo = $equipoQuery->first();
            if (! $equipo) {
                return $this->error('El equipo especificado no se encuentra registrado en el sistema.', 422);
            }

            // Excepción de negocio CU19: Equipo ya asignado o inactivo -> alerta de stock
            $asignacionActivaOtro = AsignacionEquipo::where('idEquipo', $equipo->idEquipo)
                ->whereNull('fechaRetiro')
                ->first();

            if ($equipo->asignada || $asignacionActivaOtro) {
                $servicioAsignadoId = $asignacionActivaOtro?->idServicio ?? 'otro servicio';
                return $this->error(
                    "Alerta de stock: El equipo con número de serie '{$equipo->numeroSerie}' (MAC: {$equipo->mac}) ya se encuentra asignado a un servicio (ID: {$servicioAsignadoId}). No está disponible para comodato.",
                    422
                );
            }

            $estadoEquipo = strtoupper(trim($equipo->estadoEquipo ?? 'OPERATIVO'));
            if (in_array($estadoEquipo, ['INACTIVO', 'BAJA', 'DANADO', 'AVERIADO'])) {
                return $this->error(
                    "Alerta de stock: El equipo '{$equipo->numeroSerie}' se encuentra en estado '{$estadoEquipo}' y no puede ser entregado en comodato.",
                    422
                );
            }

            $fechaAsignacion = $validated['fecha_asignacion'] ?? now()->toDateString();
            $reemplazar = filter_var($validated['reemplazar_vigente'] ?? false, FILTER_VALIDATE_BOOLEAN);

            // 3. Ejecutar transacción atómica de asignación
            $resultado = DB::transaction(function () use ($servicio, $equipo, $fechaAsignacion, $reemplazar, $validated, $request) {
                // Verificar si el servicio ya tiene un equipo en comodato vigente
                $comodatoVigentePrevio = AsignacionEquipo::with('equipo')
                    ->where('idServicio', $servicio->idServicio)
                    ->whereNull('fechaRetiro')
                    ->first();

                $datosPreviosAuditoria = null;
                if ($comodatoVigentePrevio) {
                    $datosPreviosAuditoria = [
                        'asignacion_id' => $comodatoVigentePrevio->idAsignacionEquipo,
                        'equipo_id'     => $comodatoVigentePrevio->idEquipo,
                        'numero_serie'  => $comodatoVigentePrevio->equipo?->numeroSerie,
                        'mac'           => $comodatoVigentePrevio->equipo?->mac,
                    ];

                    if ($reemplazar) {
                        // Cierre formal del equipo comodato anterior
                        $comodatoVigentePrevio->update([
                            'fechaRetiro'  => $fechaAsignacion,
                            'motivoRetiro' => $validated['motivo_reemplazo'] ?? 'Reemplazo de equipo por nueva asignación en comodato.',
                        ]);

                        // Liberar el equipo anterior en el inventario
                        if ($comodatoVigentePrevio->equipo) {
                            $comodatoVigentePrevio->equipo->update([
                                'asignada'     => false,
                                'estadoEquipo' => 'DISPONIBLE',
                            ]);
                        }
                    }
                }

                // Crear el nuevo registro de comodato
                $nuevaAsignacion = AsignacionEquipo::create([
                    'fechaAsignacion' => $fechaAsignacion,
                    'fechaRetiro'     => null,
                    'motivoRetiro'    => null,
                    'idEquipo'        => $equipo->idEquipo,
                    'idServicio'      => $servicio->idServicio,
                ]);

                // Actualizar estado del equipo a Asignado / En comodato
                $equipo->update([
                    'asignada'     => true,
                    'estadoEquipo' => 'ASIGNADO',
                    'propiedad'    => 'TELCOM_COMODATO',
                ]);

                // Actualizar stock en Inventario si existe registro para el producto
                if ($equipo->idProducto) {
                    $inventario = Inventario::where('idProducto', $equipo->idProducto)->first();
                    if ($inventario && $inventario->stockActual > 0) {
                        $inventario->update([
                            'stockActual'        => max(0, $inventario->stockActual - 1),
                            'fechaActualizacion' => now(),
                        ]);
                    }
                }

                // Sincronizar datos técnicos con el Servicio de Internet si aplica
                $cambiosServicio = [];
                if (! empty($equipo->mac) && empty($servicio->macRouter)) {
                    $cambiosServicio['macRouter'] = $equipo->mac;
                }
                if (! empty($equipo->ip) && empty($servicio->ipAsignada)) {
                    $cambiosServicio['ipAsignada'] = $equipo->ip;
                }
                if (! empty($cambiosServicio)) {
                    $servicio->update($cambiosServicio);
                }

                // 4. Registro en la Bitácora de Auditoría
                $nombreCliente = $servicio->cliente?->nombreCompleto ?? 'Cliente';
                $prodDesc = $equipo->producto ? " ({$equipo->producto->marca} {$equipo->producto->modelo})" : '';
                AuditLogger::log(
                    'CU19',
                    'ASIGNAR_EQUIPO_COMODATO',
                    "Equipo {$equipo->numeroSerie}{$prodDesc} [MAC: {$equipo->mac}] asignado formalmente en comodato al servicio {$servicio->codigo_servicio} del cliente {$nombreCliente}.",
                    $datosPreviosAuditoria,
                    [
                        'idAsignacionEquipo' => $nuevaAsignacion->idAsignacionEquipo,
                        'idServicio'         => $servicio->idServicio,
                        'codigoServicio'     => $servicio->codigo_servicio,
                        'idEquipo'           => $equipo->idEquipo,
                        'numeroSerie'        => $equipo->numeroSerie,
                        'mac'                => $equipo->mac,
                        'fechaAsignacion'    => $fechaAsignacion,
                    ],
                    $request->user()?->id
                );

                return $nuevaAsignacion->load(['equipo.producto', 'servicio.cliente']);
            });

            return $this->success(
                $resultado,
                "Equipo con serie '{$equipo->numeroSerie}' asignado exitosamente en comodato al servicio {$servicio->codigo_servicio}.",
                201
            );
        } catch (Throwable $e) {
            report($e);
            // Excepción de negocio CU19: Error de almacenamiento -> notifica que la operación no pudo completarse
            return $this->error('Error de almacenamiento: la operación no pudo completarse. ' . $e->getMessage(), 500);
        }
    }

    /**
     * Registrar la devolución o retiro de un equipo en comodato.
     */
    public function desvincular(Request $request, int $asignacionId): JsonResponse
    {
        $validated = $request->validate([
            'motivo_retiro' => 'required|string|max:255',
            'fecha_retiro'  => 'nullable|date',
            'estado_equipo' => 'nullable|string|in:DISPONIBLE,OPERATIVO,DANADO,BAJA,REVISION',
        ]);

        try {
            $asignacion = AsignacionEquipo::with(['equipo.producto', 'servicio.cliente'])
                ->findOrFail($asignacionId);

            if ($asignacion->fechaRetiro) {
                return $this->error('Este equipo ya fue retirado previamente del servicio.', 422);
            }

            $fechaRetiro = $validated['fecha_retiro'] ?? now()->toDateString();
            $motivo = $validated['motivo_retiro'];
            $nuevoEstadoEquipo = $validated['estado_equipo'] ?? 'DISPONIBLE';

            DB::transaction(function () use ($asignacion, $fechaRetiro, $motivo, $nuevoEstadoEquipo, $request) {
                $asignacion->update([
                    'fechaRetiro'  => $fechaRetiro,
                    'motivoRetiro' => $motivo,
                ]);

                if ($asignacion->equipo) {
                    $asignacion->equipo->update([
                        'asignada'     => false,
                        'estadoEquipo' => $nuevoEstadoEquipo,
                    ]);

                    // Si regresa en buen estado, reponer inventario
                    if (in_array($nuevoEstadoEquipo, ['DISPONIBLE', 'OPERATIVO']) && $asignacion->equipo->idProducto) {
                        $inventario = Inventario::where('idProducto', $asignacion->equipo->idProducto)->first();
                        if ($inventario) {
                            $inventario->increment('stockActual');
                            $inventario->update(['fechaActualizacion' => now()]);
                        }
                    }
                }

                $equipoSerie = $asignacion->equipo?->numeroSerie ?? 'SN-Desconocido';
                $codServicio = $asignacion->servicio?->codigo_servicio ?? 'Servicio';

                AuditLogger::log(
                    'CU19',
                    'RETIRAR_EQUIPO_COMODATO',
                    "Equipo {$equipoSerie} retirado del comodato del servicio {$codServicio}. Motivo: {$motivo}.",
                    ['asignacion_id' => $asignacion->idAsignacionEquipo, 'estado_previo' => 'ASIGNADO'],
                    ['fecha_retiro' => $fechaRetiro, 'motivo_retiro' => $motivo, 'nuevo_estado_equipo' => $nuevoEstadoEquipo],
                    $request->user()?->id
                );
            });

            return $this->success(
                $asignacion->fresh(['equipo', 'servicio']),
                'Devolución/retiro del equipo en comodato registrado exitosamente.'
            );
        } catch (Throwable $e) {
            report($e);
            return $this->error('Error de almacenamiento: no se pudo registrar el retiro del equipo. ' . $e->getMessage(), 500);
        }
    }
}
