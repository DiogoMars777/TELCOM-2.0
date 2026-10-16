<?php

namespace App\Http\Controllers\Paquetes\SeguridadAdministracion\CU01_IniciarCerrarSesion;

use App\Http\Controllers\Controller;
use App\Mail\PasswordResetCodeMail;
use App\Models\Paquetes\SeguridadAdministracion\CU01_IniciarCerrarSesion\UserSession;
use App\Models\User;
use App\Support\AuditLogger;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    use ApiResponse;

    /**
     * CU01 - Iniciar sesión de usuario
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return $this->error('Credenciales incorrectas.', 401);
        }

        if (! $user->activo) {
            return $this->error('Tu cuenta está desactivada. Contacta al administrador.', 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        // Registrar sesión activa
        UserSession::create([
            'user_id'    => $user->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'login_at'   => now(),
            'is_active'  => true,
        ]);

        AuditLogger::log(
            'CU01',
            'INICIAR_SESION',
            "El usuario {$user->email} inició sesión.",
            null,
            ['user_id' => $user->id],
            $user->id
        );

        return $this->success([
            'user'  => $this->presentUser($user),
            'token' => $token,
        ], 'Inicio de sesión exitoso.');
    }

    /**
     * CU01 - Cerrar sesión de usuario
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user) {
            // Revocar tokens
            $user->currentAccessToken()->delete();

            // Cerrar registro de sesión
            UserSession::where('user_id', $user->id)
                ->where('is_active', true)
                ->latest()
                ->first()
                ?->update([
                    'logout_at' => now(),
                    'is_active' => false,
                ]);

            AuditLogger::log(
                'CU01',
                'CERRAR_SESION',
                "El usuario {$user->email} cerró sesión.",
                null,
                ['user_id' => $user->id],
                $user->id
            );
        }

        return $this->success(null, 'Sesión finalizada exitosamente.');
    }

    /**
     * CU01 - Obtener usuario autenticado actual
     */
    public function me(Request $request): JsonResponse
    {
        return $this->success($this->presentUser($request->user()), 'Datos de usuario actual.');
    }

    /**
     * CU01 - Cambiar la contraseña del usuario AUTENTICADO.
     *
     * Reglas:
     *  - Exige la contraseña actual correcta (`Hash::check`).
     *  - La nueva contraseña cumple EXACTAMENTE la misma política que el alta de
     *    usuarios (`UsuarioController::store`) y que el frontend
     *    (`config/passwordPolicy.js`): mínimo 8 caracteres, una mayúscula, una
     *    minúscula, un número y un carácter especial (! @ # $ % & *).
     *  - La confirmación (`new_password_confirmation`) debe coincidir.
     *  - La operación afecta SOLO a `$request->user()`. Cualquier `id`, `user_id`
     *    o `email` que venga en el cuerpo se ignora: un usuario no puede cambiar
     *    la contraseña de otro.
     *  - Nunca se registra la contraseña (ni la actual ni la nueva) en la
     *    bitácora ni se devuelve en la respuesta.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password'     => [
                'required',
                'string',
                'min:8',
                'regex:/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%&*]).+$/',
                'confirmed',
            ],
        ], [
            'current_password.required' => 'Debes ingresar tu contraseña actual.',
            'new_password.required'     => 'La nueva contraseña es obligatoria.',
            'new_password.min'          => 'La nueva contraseña debe tener al menos 8 caracteres.',
            'new_password.regex'        => 'La nueva contraseña debe incluir al menos una letra mayúscula, una minúscula, un número y un carácter especial (! @ # $ % & *).',
            'new_password.confirmed'    => 'La confirmación no coincide con la nueva contraseña.',
        ]);

        $user = $request->user();

        if (! Hash::check($validated['current_password'], $user->password)) {
            // No se modifica nada si la contraseña actual es incorrecta.
            throw ValidationException::withMessages([
                'current_password' => 'La contraseña actual es incorrecta.',
            ]);
        }

        // Solo el usuario de la sesión cambia su propia contraseña.
        $user->password = Hash::make($validated['new_password']);
        $user->save();

        // Bitácora SIN contraseñas: solo el hecho del cambio.
        AuditLogger::log(
            'CU01',
            'CAMBIAR_PASSWORD',
            "El usuario {$user->email} cambió su contraseña.",
            null,
            null,
            $user->id
        );

        return $this->success(null, 'Contraseña actualizada correctamente.');
    }

    /**
     * Solicitar código de verificación para recuperar contraseña.
     * Respuesta genérica para no revelar si el correo existe.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
        ]);

        $email = strtolower(trim($validated['email']));

        // Limpiar códigos caducados y usados
        DB::table('password_verification_codes')
            ->where('expires_at', '<', now())
            ->orWhereNotNull('used_at')
            ->delete();

        // Intentos de reenvío limitados (máx 3 en 10 min por correo)
        $recentCount = DB::table('password_verification_codes')
            ->where('email', $email)
            ->where('created_at', '>=', now()->subMinutes(10))
            ->count();
        if ($recentCount >= 3) {
            return $this->success(null, 'Si el correo existe, recibirás un código de verificación.');
        }

        if (User::where('email', $email)->exists()) {
            $code = str_pad((string) random_int(100000, 999999), 6, '0');
            DB::table('password_verification_codes')->insert([
                'email' => $email,
                'code_hash' => Hash::make($code),
                'expires_at' => now()->addMinutes(10),
                'attempts' => 0,
                'used_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            try {
                Mail::to($email)->send(new PasswordResetCodeMail($code));
            } catch (\Exception $e) {
                // No exponer error al cliente
            }
        }

        return $this->success(null, 'Si el correo existe, recibirás un código de verificación.');
    }

    /**
     * Verificar código y permitir cambio de contraseña.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
            'new_password' => [
                'required',
                'string',
                'min:8',
                'regex:/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%&*]).+$/',
                'confirmed',
            ],
        ], [
            'new_password.min' => 'La nueva contraseña debe tener al menos 8 caracteres.',
            'new_password.regex' => 'La nueva contraseña debe incluir al menos una letra mayúscula, una minúscula, un número y un carácter especial (! @ # $ % & *).',
            'new_password.confirmed' => 'La confirmación no coincide con la nueva contraseña.',
        ]);

        $email = strtolower(trim($validated['email']));
        $code = $validated['code'];

        $record = DB::table('password_verification_codes')
            ->where('email', $email)
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->orderByDesc('created_at')
            ->first();

        if (!$record) {
            return $this->error('Código inválido o vencido.', 422);
        }

        if ($record->attempts >= 3) {
            return $this->error('Demasiados intentos. Solicita un nuevo código.', 429);
        }

        if (!Hash::check($code, $record->code_hash)) {
            DB::table('password_verification_codes')
                ->where('id', $record->id)
                ->increment('attempts');
            return $this->error('Código incorrecto.', 422);
        }

        $user = User::where('email', $email)->first();
        if (!$user || !$user->activo) {
            return $this->success(null, 'Contraseña restablecida correctamente.');
        }

        $user->password = Hash::make($validated['new_password']);
        $user->save();

        DB::table('password_verification_codes')
            ->where('id', $record->id)
            ->update(['used_at' => now()]);

        // Revocar tokens previos si es posible
        if (method_exists($user, 'tokens')) {
            try {
                $user->tokens()->delete();
            } catch (\Exception $e) {
                //
            }
        }

        AuditLogger::log(
            'CU01',
            'RESTAURAR_PASSWORD',
            "El usuario {$user->email} restableció su contraseña mediante código de verificación.",
            null,
            null,
            $user->id
        );

        return $this->success(null, 'Contraseña restablecida correctamente.');
    }

    /**
     * Representación pública del usuario para el frontend.
     *
     * Incluye el rol y los slugs de permisos EFECTIVOS (resueltos por el
     * backend desde `roles` + `rol_permiso`), de modo que el cliente pueda
     * filtrar menús sin adivinar permisos. Nunca expone la contraseña ni
     * atributos ocultos del modelo.
     */
    private function presentUser(User $user): array
    {
        $user->loadMissing('rol');

        return [
            'id'             => $user->id,
            'name'           => $user->name,
            'nombre_usuario' => $user->nombre_usuario,
            'email'          => $user->email,
            'telefono'       => $user->telefono,
            'activo'         => (bool) $user->activo,
            'rol_id'         => $user->rol_id,
            'rol'            => $user->rol ? [
                'id'     => $user->rol->id,
                'slug'   => $user->rol->slug,
                'nombre' => $user->rol->nombre,
                'activo' => (bool) $user->rol->activo,
            ] : null,
            'permisos'       => $user->permisosSlugs(),
        ];
    }
}
