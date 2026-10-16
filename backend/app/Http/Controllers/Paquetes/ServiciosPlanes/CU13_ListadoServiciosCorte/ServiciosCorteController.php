<?php

namespace App\Http\Controllers\Paquetes\ServiciosPlanes\CU13_ListadoServiciosCorte;

use App\Http\Controllers\Controller;
use App\Models\Paquetes\ServiciosPlanes\CU13_ListadoServiciosCorte\ServicioParaCorte;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiciosCorteController extends Controller
{
    use ApiResponse;

    /**
     * CU13 - Consultar listado de servicios elegibles para corte.
     *
     * Un servicio es elegible si está ACTIVO y tiene al menos una
     * mensualidad impaga vencida hace `dias_mora` días o más (tolerancia).
     * Se calculan en el backend `monto_deuda`, `dias_mora` y el número de
     * mensualidades pendientes, que el frontend muestra.
     */
    public function index(Request $request): JsonResponse
    {
        $diasMora = max(0, $request->integer('dias_mora', 5));
        $zonaId   = $request->input('zona_id');
        $buscar   = trim((string) $request->input('buscar', ''));

        $query = ServicioParaCorte::query()
            ->with(['cliente', 'zona', 'asignacionPlanActual.plan'])
            ->with(['mensualidades' => function ($q) {
                $q->where('estado_pago', '!=', 'PAGADO')->orderBy('fecha_vencimiento');
            }])
            ->elegiblesParaCorte($diasMora)
            ->when($zonaId, function ($q) use ($zonaId) {
                $q->where('idZona', $zonaId);
            })
            ->when($buscar !== '', function ($q) use ($buscar) {
                $q->where(function ($sub) use ($buscar) {
                    $sub->where('codigoServicio', 'like', "%{$buscar}%")
                        ->orWhere('ipAsignada', 'like', "%{$buscar}%")
                        ->orWhereHas('cliente', function ($c) use ($buscar) {
                            $c->where('nombreCompleto', 'like', "%{$buscar}%")
                              ->orWhere('ci', 'like', "%{$buscar}%")
                              ->orWhere('codigoCliente', 'like', "%{$buscar}%");
                        });
                });
            })
            ->latest('id');

        $exportAll = $request->boolean('todos');
        $perPage   = max(1, min(100, $request->integer('per_page', 15)));
        $servicios = $exportAll ? $query->get() : $query->paginate($perPage);
        $coleccion = $exportAll ? $servicios : $servicios->getCollection();

        $coleccion->transform(function (ServicioParaCorte $servicio) {
            $cliente = $servicio->cliente;
            $zona = $servicio->zona;
            $planActual = $servicio->asignacionPlanActual?->plan;
            $impagas = $servicio->mensualidades;
            $hoy = now()->startOfDay();

            // Calcular días de mora considerando facturas vencidas
            $vencidas = $impagas->filter(fn ($m) => $m->fecha_vencimiento && $m->fecha_vencimiento->startOfDay()->lte($hoy));
            $maxMora = $vencidas->isEmpty()
                ? (int) $impagas->map(fn ($m) => $m->fecha_vencimiento ? max(0, (int) $m->fecha_vencimiento->startOfDay()->diffInDays($hoy)) : 0)->max()
                : (int) $vencidas->map(fn ($m) => (int) $m->fecha_vencimiento->startOfDay()->diffInDays($hoy))->max();

            $servicio->setAttribute('zona_id', $servicio->idZona);
            $servicio->setAttribute('zona_nombre', $zona?->nombreZona ?? $zona?->nombre ?? 'Sin zona asignada');
            $servicio->setAttribute('plan_nombre', $planActual?->nombrePlan ?? $servicio->plan_nombre ?? 'Plan estándar');
            $servicio->setAttribute('velocidad_mbps', $planActual?->velocidadMbps ?? $servicio->velocidad_mbps ?? null);
            $servicio->setAttribute('cliente_nombre', $cliente?->nombreCompleto ?? trim(($cliente?->nombres ?? '') . ' ' . ($cliente?->apellidos ?? '')));
            $servicio->setAttribute('cliente_ci', $cliente?->ci ?? $cliente?->documento_identidad ?? '—');
            $servicio->setAttribute('cliente_telefono', $cliente?->telefonoPrincipal ?? $cliente?->telefono ?? '—');
            $servicio->setAttribute('cliente_direccion', $servicio->direccion ?? $cliente?->direccion ?? '—');
            $servicio->setAttribute('mensualidades_pendientes', $impagas->count());
            $servicio->setAttribute('monto_deuda', round((float) $impagas->sum('monto'), 2));
            $servicio->setAttribute('dias_mora', max(0, (int) $maxMora));

            return $servicio->makeHidden('mensualidades');
        });

        return $this->success($servicios, 'Listado de servicios pendientes de corte obtenido.');
    }
}
