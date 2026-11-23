<?php

namespace App\Services\Paquetes\P7_DashboardReportesInteligenciaVoz\CU31_GenerarReporteInteligenteVoz;

use RuntimeException;

/** Solo contiene mensajes públicos; nunca conserva respuestas o credenciales HTTP. */
class ReporteInteligenteException extends RuntimeException
{
    public function __construct(public readonly string $codigo, string $mensaje, public readonly int $estadoHttp)
    {
        parent::__construct($mensaje);
    }
}
