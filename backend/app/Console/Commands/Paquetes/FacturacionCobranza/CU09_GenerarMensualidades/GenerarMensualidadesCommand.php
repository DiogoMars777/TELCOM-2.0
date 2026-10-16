<?php

namespace App\Console\Commands\Paquetes\FacturacionCobranza\CU09_GenerarMensualidades;

use App\Services\Paquetes\FacturacionCobranza\CU09_GenerarMensualidades\MensualidadGeneracionService;
use Illuminate\Console\Command;

class GenerarMensualidadesCommand extends Command
{
    protected $signature = 'cu09:generar-mensualidades';

    protected $description = 'CU09: generar mensualidades de servicios activos para el mes actual';

    public function handle(MensualidadGeneracionService $generador): int
    {
        $periodo = now()->format('Y-m');
        $resultado = $generador->generar($periodo, 'SISTEMA');

        $this->info("Período {$periodo}: {$resultado['generadas']} mensualidades generadas.");
        foreach ($resultado['detalle_omitidas'] as $omitida) {
            $this->warn("Servicio {$omitida['servicio_id']} omitido: {$omitida['motivo']}.");
        }

        return self::SUCCESS;
    }
}
