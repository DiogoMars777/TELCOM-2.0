<?php

namespace App\Http\Controllers\Paquetes\SeguridadAdministracion\CU02_BitacoraAuditoria;

use App\Http\Controllers\Controller;
use App\Models\Paquetes\SeguridadAdministracion\CU02_BitacoraAuditoria\BitacoraAuditoria;
use App\Models\User;
use App\Support\AuditLogger;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditoriaController extends Controller
{
    use ApiResponse;

    /**
     * CU02 - Consultar bitácora de auditoría con filtros
     */
    public function index(Request $request): JsonResponse
    {
        $query = BitacoraAuditoria::with('user:id,name,email');

        // Filtro por usuario: permite consultar la bitácora de un usuario
        // concreto usando su id real (los ofrecidos por `usuarios()`).
        if ($request->filled('user_id')) {
            $query->where('user_id', (int) $request->input('user_id'));
        }

        if ($request->filled('modulo')) {
            $query->where('modulo', $request->input('modulo'));
        }

        if ($request->filled('accion')) {
            $query->where('accion', $request->input('accion'));
        }

        if ($request->filled('fecha_desde')) {
            $query->whereDate('created_at', '>=', $request->input('fecha_desde'));
        }

        if ($request->filled('fecha_hasta')) {
            $query->whereDate('created_at', '<=', $request->input('fecha_hasta'));
        }

        $logs = $query->latest()->paginate(20);

        return $this->success($logs, 'Bitácora de auditoría consultada correctamente.');
    }

    /**
     * CU02 - Usuarios reales que aparecen en la bitácora.
     *
     * Alimenta el filtro por usuario del frontend con las cuentas que
     * realmente registran operaciones (id, nombre y correo), evitando
     * ofrecer usuarios sin actividad.
     */
    public function usuarios(): JsonResponse
    {
        $ids = BitacoraAuditoria::query()
            ->whereNotNull('user_id')
            ->distinct()
            ->pluck('user_id');

        $usuarios = User::query()
            ->whereIn('idUsuario', $ids)
            ->orderBy('nombreCompleto')
            ->get();

        return $this->success($usuarios, 'Usuarios de la bitácora consultados correctamente.');
    }

    /**
     * Registrar entrada en bitácora (método estático auxiliar).
     *
     * Delegado en {@see AuditLogger} para que exista una única vía de
     * escritura en todos los casos de uso.
     */
    public static function registrar(string $modulo, string $accion, string $detalles, ?array $previos = null, ?array $nuevos = null): void
    {
        AuditLogger::log($modulo, $accion, $detalles, $previos, $nuevos);
    }
}
