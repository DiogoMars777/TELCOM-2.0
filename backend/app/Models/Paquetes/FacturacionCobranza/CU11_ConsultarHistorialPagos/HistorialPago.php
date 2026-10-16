<?php

namespace App\Models\Paquetes\FacturacionCobranza\CU11_ConsultarHistorialPagos;

use App\Models\Paquetes\FacturacionCobranza\CU10_GestionarPagoMensualidad\PagoMensualidad;
use Illuminate\Database\Eloquent\Builder;

/** Proyección de solo lectura para el historial generado por CU10. */
class HistorialPago extends PagoMensualidad
{
    public function scopePorCliente(Builder $query, int $clienteId): Builder
    {
        return $query->whereHas('detalles.mensualidad', fn (Builder $mensualidad) =>
            $mensualidad->where('idCliente', $clienteId));
    }

    public function scopePorServicio(Builder $query, int $servicioId): Builder
    {
        return $query->whereHas('detalles.mensualidad', fn (Builder $mensualidad) =>
            $mensualidad->where('idServicio', $servicioId));
    }

    public function scopePorPlan(Builder $query, int $planId): Builder
    {
        return $query->whereHas(
            'detalles.mensualidad.servicio.asignacionPlanActual',
            fn (Builder $asignacion) => $asignacion->where('idPlan', $planId)
        );
    }
}
