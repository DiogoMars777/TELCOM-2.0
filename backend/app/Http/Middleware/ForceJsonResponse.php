<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Fuerza respuestas JSON en todas las rutas de la API.
 *
 * Sin esto, una petición no autenticada que no envíe `Accept: application/json`
 * haría que Laravel intentara redirigir a la ruta nombrada `login` (que no
 * existe en este backend API-only), devolviendo un 500 en lugar del 401
 * correcto. Forzando `Accept: application/json` se garantiza:
 *   - 401 JSON cuando no hay token válido,
 *   - 403 JSON cuando falta el permiso,
 *   - errores de validación en JSON.
 */
class ForceJsonResponse
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->headers->set('Accept', 'application/json');

        return $next($request);
    }
}
