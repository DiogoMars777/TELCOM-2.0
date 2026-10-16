<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class LoginThrottle
{
    /**
     * Bloquea intentos fallidos: 3 intentos, 3 minutos por cuenta.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $email = $request->input('email');
        if ($email) {
            $key = 'login:fail:' . sha1(strtolower(trim($email)));
            $failures = Cache::get($key, 0);
            if ($failures >= 3) {
                $expires = Cache::get($key . ':until');
                if ($expires && $expires > now()->timestamp) {
                    $remaining = max(0, $expires - now()->timestamp);
                    return response()->json([
                        'success' => false,
                        'message' => "Demasiados intentos fallidos. Vuelve a intentarlo en {$remaining} segundos.",
                    ], 429);
                } else {
                    Cache::forget($key);
                    Cache::forget($key . ':until');
                }
            }
        }
        $response = $next($request);
        if ($response->getStatusCode() === 401) {
            if ($email) {
                $key = 'login:fail:' . sha1(strtolower(trim($email)));
                $failures = Cache::get($key, 0) + 1;
                Cache::put($key, $failures, now()->addMinutes(3));
                if ($failures >= 3) {
                    Cache::put($key . ':until', now()->addMinutes(3)->timestamp, now()->addMinutes(3));
                }
            }
        } elseif ($response->getStatusCode() === 200) {
            if ($email) {
                $key = 'login:fail:' . sha1(strtolower(trim($email)));
                Cache::forget($key);
                Cache::forget($key . ':until');
            }
        }
        return $response;
    }
}
