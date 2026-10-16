<?php

namespace App\Http\Middleware;

use App\Traits\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware RBAC de TELCOM.
 *
 * Exige que el usuario autenticado tenga el permiso indicado a través de su
 * rol (`rol_permiso`). Se aplica SIEMPRE después de `auth:sanctum`, de modo
 * que:
 *   - sin token válido       -> 401 (lo resuelve auth:sanctum),
 *   - autenticado sin permiso -> 403 (este middleware).
 *
 * No revela información sensible: la respuesta de 403 usa el envelope
 * estándar de la API y un mensaje genérico.
 */
class EnsurePermission
{
    use ApiResponse;

    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if (! $user || ! $user->hasPermission($permission)) {
            return $this->error('No tienes autorización para realizar esta operación.', 403);
        }

        return $next($request);
    }
}
