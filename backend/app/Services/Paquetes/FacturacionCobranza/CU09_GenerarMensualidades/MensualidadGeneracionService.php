<?php

namespace App\Services\Paquetes\FacturacionCobranza\CU09_GenerarMensualidades;

use App\Models\Paquetes\FacturacionCobranza\CU09_GenerarMensualidades\MensualidadFacturacion;
use App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio\ServicioInternet;
use App\Support\AuditLogger;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MensualidadGeneracionService
{
    public function generar(string $periodo, string $origen = 'MANUAL'): array
    {
        $resultado = DB::transaction(function () use ($periodo) {
            $generadas = 0;
            $omitidas = [];
            // Bloquear los servicios también protege la primera emisión, cuando
            // todavía no existe una mensualidad que se pueda bloquear.
            $serviciosActivos = ServicioInternet::with(['asignacionPlanActual.plan'])
                ->where('estado_servicio', 'ACTIVO')
                ->orderBy('idServicio')
                ->lockForUpdate()
                ->get();

            foreach ($serviciosActivos as $servicio) {
                $tarifa = $servicio->precio_mensual
                    ?? $servicio->asignacionPlanActual?->precioAplicado
                    ?? $servicio->asignacionPlanActual?->plan?->precioMensual;

                // El monto debe ser real y caber en el decimal(10, 2) existente.
                if (! is_numeric($tarifa) || ! is_finite((float) $tarifa)
                    || (float) $tarifa <= 0 || (float) $tarifa > 99999999.99) {
                    $omitidas[] = ['servicio_id' => $servicio->id, 'motivo' => 'SIN_TARIFA_VALIDA'];
                    continue;
                }

                $existente = MensualidadFacturacion::where('servicio_id', $servicio->id)
                    ->where('periodo', $periodo)
                    ->lockForUpdate()
                    ->first();

                if ($existente) {
                    // Conservar la reparación existente, únicamente con tarifa real.
                    if ($existente->monto === null || (float) $existente->monto <= 0) {
                        $existente->update(['monto' => $tarifa]);
                        $generadas++;
                    }
                    continue;
                }

                if ($servicio->cliente_id === null || $servicio->dia_corte < 1) {
                    $omitidas[] = ['servicio_id' => $servicio->id, 'motivo' => 'DATOS_SERVICIO_INCOMPLETOS'];
                    continue;
                }

                $fechaEmision = now()->startOfDay();
                // Conservar el corte, limitado al último día real de cada mes.
                $fechaVencimiento = Carbon::createFromFormat('!Y-m', $periodo);
                $fechaVencimiento->setDay(min($servicio->dia_corte, $fechaVencimiento->daysInMonth));
                // También cubre períodos atrasados sin emitir deudas ya vencidas.
                while ($fechaVencimiento->lt($fechaEmision)) {
                    $fechaVencimiento->startOfMonth()->addMonth();
                    $fechaVencimiento->setDay(min($servicio->dia_corte, $fechaVencimiento->daysInMonth));
                }

                MensualidadFacturacion::create([
                    'codigo_factura'    => 'FAC-' . $periodo . '-' . strtoupper(Str::random(4)),
                    'cliente_id'        => $servicio->cliente_id,
                    'servicio_id'       => $servicio->id,
                    'periodo'           => $periodo,
                    'monto'             => $tarifa,
                    'fecha_emision'     => $fechaEmision,
                    'fecha_vencimiento' => $fechaVencimiento,
                    'estado_pago'       => 'PENDIENTE',
                ]);
                $generadas++;
            }

            return [
                'periodo' => $periodo,
                'generadas' => $generadas,
                'omitidas' => count($omitidas),
                'detalle_omitidas' => $omitidas,
            ];
        });

        AuditLogger::log('CU09', 'GENERAR_MENSUALIDADES',
            "Se generaron {$resultado['generadas']} mensualidades para el período {$periodo}. Se omitieron {$resultado['omitidas']} servicios.",
            null, array_merge($resultado, ['origen' => $origen]));

        return $resultado;
    }
}
