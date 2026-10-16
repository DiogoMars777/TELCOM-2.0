<?php

namespace App\Http\Controllers\Paquetes\SeguridadAdministracion\CU01_IniciarCerrarSesion;

use App\Http\Controllers\Controller;
use App\Mail\RecuperarPasswordMail;
use App\Models\User;
use App\Support\AuditLogger;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class RecuperarPasswordController extends Controller
{
    use ApiResponse;

    /**
     * Minutos de validez del código de recuperación.
     */
    private const EXPIRATION_MINUTES = 60;

    /**
     * CU01 - Solicitar código de recuperación de contraseña.
     *
     * Genera un código seguro de 6 dígitos, lo almacena con hash SHA-256 en
     * `password_reset_tokens` y envía el correo con el código y un enlace directo.
     */
    public function solicitar(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
        ], [
            'email.required' => 'Debes ingresar tu correo electrónico.',
            'email.email'    => 'El formato del correo electrónico no es válido.',
        ]);

        $email = strtolower(trim($validated['email']));
        $user = User::where('email', $email)->first();

        // Si el usuario existe y está activo, enviamos el código
        if ($user && $user->activo) {
            $codigo = sprintf('%06d', random_int(100000, 999999));
            $tokenHash = hash('sha256', $codigo);

            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $user->email],
                [
                    'token'      => $tokenHash,
                    'created_at' => now(),
                ]
            );

            $frontendUrl = rtrim((string) env('FRONTEND_URL', 'http://localhost:5173'), '/');
            $resetUrl = "{$frontendUrl}/?view=recuperar&email=" . urlencode($user->email) . "&codigo=" . urlencode($codigo);

            try {
                Mail::to($user->email)->send(
                    new RecuperarPasswordMail($user, $codigo, $resetUrl, self::EXPIRATION_MINUTES)
                );
            } catch (Throwable $e) {
                Log::error("Error al enviar correo de recuperación a {$user->email}: " . $e->getMessage());
                return $this->error('No se pudo enviar el correo de recuperación. Por favor verifica la configuración de correo o intenta más tarde.', 500);
            }

            AuditLogger::log(
                'CU01',
                'RECUPERAR_PASSWORD_SOLICITUD',
                "Solicitud de recuperación de contraseña para {$user->email}.",
                null,
                null,
                $user->id
            );
        }

        // Siempre respondemos éxito para mitigar enumeración de correos
        return $this->success(
            null,
            'Si el correo ingresado se encuentra registrado en el sistema, recibirás un código de recuperación en unos instantes.'
        );
    }

    /**
     * CU01 - Verificar si el código ingresado es válido y vigente.
     */
    public function verificarCodigo(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email'  => 'required|email',
            'codigo' => 'required|string',
        ], [
            'email.required'  => 'El correo electrónico es obligatorio.',
            'email.email'     => 'El formato del correo electrónico no es válido.',
            'codigo.required' => 'El código de verificación es obligatorio.',
        ]);

        $email = strtolower(trim($validated['email']));
        $codigo = trim($validated['codigo']);

        $record = DB::table('password_reset_tokens')->where('email', $email)->first();

        if (! $record) {
            return $this->error('El código es incorrecto o no ha sido solicitado.', 422);
        }

        if (Carbon::parse($record->created_at)->addMinutes(self::EXPIRATION_MINUTES)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $email)->delete();
            return $this->error('El código ha expirado. Por favor solicita uno nuevo.', 422);
        }

        if (! hash_equals($record->token, hash('sha256', $codigo))) {
            return $this->error('El código de verificación ingresado es incorrecto.', 422);
        }

        return $this->success(null, 'Código de verificación válido.');
    }

    /**
     * CU01 - Restablecer contraseña con código verificado.
     *
     * Aplica la misma política de contraseñas estricta del sistema,
     * actualiza la contraseña del usuario, revoca sesiones activas y elimina el token.
     */
    public function restablecer(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email'    => 'required|email',
            'codigo'   => 'required|string',
            'password' => [
                'required',
                'string',
                'min:8',
                'regex:/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%&*]).+$/',
                'confirmed',
            ],
        ], [
            'email.required'     => 'El correo electrónico es obligatorio.',
            'email.email'        => 'El formato del correo electrónico no es válido.',
            'codigo.required'    => 'El código de verificación es obligatorio.',
            'password.required'  => 'La nueva contraseña es obligatoria.',
            'password.min'       => 'La nueva contraseña debe tener al menos 8 caracteres.',
            'password.regex'     => 'La nueva contraseña debe incluir al menos una mayúscula, una minúscula, un número y un carácter especial (! @ # $ % & *).',
            'password.confirmed' => 'La confirmación no coincide con la nueva contraseña.',
        ]);

        $email = strtolower(trim($validated['email']));
        $codigo = trim($validated['codigo']);

        $record = DB::table('password_reset_tokens')->where('email', $email)->first();

        if (! $record || ! hash_equals($record->token, hash('sha256', $codigo))) {
            return $this->error('El código de verificación es incorrecto o ha expirado.', 422);
        }

        if (Carbon::parse($record->created_at)->addMinutes(self::EXPIRATION_MINUTES)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $email)->delete();
            return $this->error('El código ha expirado. Por favor solicita uno nuevo.', 422);
        }

        $user = User::where('email', $email)->first();

        if (! $user) {
            return $this->error('No se encontró una cuenta asociada a este correo electrónico.', 404);
        }

        // Actualizar contraseña
        $user->password = Hash::make($validated['password']);
        $user->save();

        // Revocar todos los tokens de acceso activos (seguridad ante robo/olvido)
        $user->tokens()->delete();

        // Consumir el token (de un solo uso)
        DB::table('password_reset_tokens')->where('email', $email)->delete();

        AuditLogger::log(
            'CU01',
            'RESTABLECER_PASSWORD',
            "El usuario {$user->email} restableció su contraseña exitosamente.",
            null,
            null,
            $user->id
        );

        return $this->success(
            null,
            'Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.'
        );
    }
}
