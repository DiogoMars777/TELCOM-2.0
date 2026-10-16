<?php

namespace App\Support;

use App\Models\Paquetes\SeguridadAdministracion\CU02_BitacoraAuditoria\BitacoraAuditoria;
use Throwable;

/**
 * Registro centralizado de la bitácora de auditoría (CU02).
 */
class AuditLogger
{
    /**
     * @param  array<string, mixed>|null  $previos  Estado anterior (para updates).
     * @param  array<string, mixed>|null  $nuevos   Estado resultante.
     */
    public static function log(
        string $modulo,
        string $accion,
        string $detalles,
        ?array $previos = null,
        ?array $nuevos = null,
        ?int $userId = null
    ): void {
        try {
            $uid = $userId ?? auth()->id();
            BitacoraAuditoria::create([
                'idUsuario'    => $uid,
                'modulo'       => $modulo,
                'accion'       => $accion,
                'descripcion'  => $detalles,
                'ipOrigen'     => request()->ip(),
                'datosPrevios' => $previos,
                'datosNuevos'  => $nuevos,
                'fechaHora'    => now()->timezone('America/La_Paz'),
            ]);
        } catch (Throwable $e) {
            report($e);
        }
    }
}
