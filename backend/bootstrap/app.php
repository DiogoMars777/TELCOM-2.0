<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Toda la API responde JSON (garantiza 401/403/422 en JSON aunque el
        // cliente no envíe el encabezado Accept).
        $middleware->api(prepend: [
            \App\Http\Middleware\ForceJsonResponse::class,
        ]);

        // Middleware RBAC: exige que el usuario autenticado tenga el permiso
        // indicado (p. ej. `permission:zonas.manage`). Devuelve HTTP 403 si no.
        $middleware->alias([
            'permission' => \App\Http\Middleware\EnsurePermission::class,
            'login.throttle' => \App\Http\Middleware\LoginThrottle::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // La API responde siempre JSON.
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // Respuesta 401 con el envelope estándar de la API (igual que
        // ApiResponse). No revela información sensible.
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'No autenticado. Debe iniciar sesión.',
                    'errors'  => null,
                ], 401);
            }
        });
    })->create();
