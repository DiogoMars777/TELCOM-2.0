<?php

use App\Console\Commands\Paquetes\FacturacionCobranza\CU09_GenerarMensualidades\GenerarMensualidadesCommand;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// CU09: día 1 a las 00:00, en la zona horaria configurada de la aplicación.
Schedule::command(GenerarMensualidadesCommand::class)->monthly()->withoutOverlapping();
