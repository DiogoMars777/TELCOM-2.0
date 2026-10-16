<?php

namespace App\Models\Paquetes\ServiciosPlanes\CU13_ListadoServiciosCorte;

use App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio\ServicioInternet;

class ServicioParaCorte extends ServicioInternet
{
    /**
     * Scope para identificar servicios elegibles para corte por mora
     */
    public function scopeElegiblesParaCorte($query, int $diasTolerancia = 5)
    {
        return $query->where('estado_servicio', 'ACTIVO')
            ->whereHas('mensualidades', function ($q) use ($diasTolerancia) {
                $q->where('estado_pago', '!=', 'PAGADO')
                  ->whereDate('fecha_vencimiento', '<=', now()->subDays($diasTolerancia)->toDateString());
            });
    }
}
