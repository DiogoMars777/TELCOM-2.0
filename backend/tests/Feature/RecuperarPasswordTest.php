<?php

namespace Tests\Feature;

use App\Mail\RecuperarPasswordMail;
use App\Models\Paquetes\SeguridadAdministracion\CU02_BitacoraAuditoria\BitacoraAuditoria;
use App\Models\Paquetes\SeguridadAdministracion\CU03_UsuariosRolesPermisos\Rol;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * CU01 - Recuperación de contraseña por correo electrónico.
 */
class RecuperarPasswordTest extends TestCase
{
    use RefreshDatabase;

    private const PASSWORD_ORIGINAL = 'ClaveOriginal123!';
    private const PASSWORD_NUEVA    = 'ClaveNueva456@';

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
        Mail::fake();
    }

    private function usuarioDePrueba(string $email = 'tecnico@telcom.com', bool $activo = true): User
    {
        $rol = Rol::where('slug', 'tecnico')->firstOrFail();

        return User::factory()->create([
            'email'    => $email,
            'password' => Hash::make(self::PASSWORD_ORIGINAL),
            'rol_id'   => $rol->id,
            'activo'   => $activo,
        ]);
    }

    public function test_solicitar_codigo_exitoso_envia_correo_y_guarda_token(): void
    {
        $user = $this->usuarioDePrueba();

        $response = $this->postJson('/api/cu01/recuperar-password/solicitar', [
            'email' => $user->email,
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true);

        // Se envía correo a través de RecuperarPasswordMail
        Mail::assertSent(RecuperarPasswordMail::class, function ($mail) use ($user) {
            return $mail->hasTo($user->email)
                && strlen($mail->codigo) === 6
                && is_numeric($mail->codigo);
        });

        // Se almacena en la tabla password_reset_tokens
        $this->assertDatabaseHas('password_reset_tokens', [
            'email' => $user->email,
        ]);

        // Se audita la solicitud
        $this->assertTrue(
            BitacoraAuditoria::where('modulo', 'CU01')
                ->where('accion', 'RECUPERAR_PASSWORD_SOLICITUD')
                ->where('user_id', $user->id)
                ->exists()
        );
    }

    public function test_solicitar_con_correo_inexistente_no_falla_ni_envia_correo(): void
    {
        $response = $this->postJson('/api/cu01/recuperar-password/solicitar', [
            'email' => 'no_existe@telcom.com',
        ]);

        // Retorna éxito para mitigar enumeración de usuarios
        $response->assertOk()
            ->assertJsonPath('success', true);

        Mail::assertNothingSent();
    }

    public function test_solicitar_con_usuario_inactivo_no_envia_correo(): void
    {
        $user = $this->usuarioDePrueba('inactivo@telcom.com', activo: false);

        $response = $this->postJson('/api/cu01/recuperar-password/solicitar', [
            'email' => $user->email,
        ]);

        $response->assertOk();
        Mail::assertNothingSent();
    }

    public function test_verificar_codigo_correcto(): void
    {
        $user = $this->usuarioDePrueba();
        $codigo = '123456';

        DB::table('password_reset_tokens')->insert([
            'email'      => $user->email,
            'token'      => hash('sha256', $codigo),
            'created_at' => now(),
        ]);

        $response = $this->postJson('/api/cu01/recuperar-password/verificar-codigo', [
            'email'  => $user->email,
            'codigo' => $codigo,
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_verificar_codigo_incorrecto_devuelve_422(): void
    {
        $user = $this->usuarioDePrueba();
        $codigo = '123456';

        DB::table('password_reset_tokens')->insert([
            'email'      => $user->email,
            'token'      => hash('sha256', $codigo),
            'created_at' => now(),
        ]);

        $response = $this->postJson('/api/cu01/recuperar-password/verificar-codigo', [
            'email'  => $user->email,
            'codigo' => '999999',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_verificar_codigo_expirado_devuelve_422(): void
    {
        $user = $this->usuarioDePrueba();
        $codigo = '123456';

        DB::table('password_reset_tokens')->insert([
            'email'      => $user->email,
            'token'      => hash('sha256', $codigo),
            'created_at' => now()->subMinutes(61),
        ]);

        $response = $this->postJson('/api/cu01/recuperar-password/verificar-codigo', [
            'email'  => $user->email,
            'codigo' => $codigo,
        ]);

        $response->assertStatus(422);
    }

    public function test_restablecer_password_exitoso(): void
    {
        $user = $this->usuarioDePrueba();
        $codigo = '654321';

        DB::table('password_reset_tokens')->insert([
            'email'      => $user->email,
            'token'      => hash('sha256', $codigo),
            'created_at' => now(),
        ]);

        $response = $this->postJson('/api/cu01/recuperar-password/restablecer', [
            'email'                 => $user->email,
            'codigo'                => $codigo,
            'password'              => self::PASSWORD_NUEVA,
            'password_confirmation' => self::PASSWORD_NUEVA,
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true);

        // Se elimina el token (un solo uso)
        $this->assertDatabaseMissing('password_reset_tokens', [
            'email' => $user->email,
        ]);

        // La nueva contraseña permite el inicio de sesión
        $loginRes = $this->postJson('/api/cu01/login', [
            'email'    => $user->email,
            'password' => self::PASSWORD_NUEVA,
        ]);
        $loginRes->assertOk();

        // La contraseña anterior ya no es válida
        $oldLogin = $this->postJson('/api/cu01/login', [
            'email'    => $user->email,
            'password' => self::PASSWORD_ORIGINAL,
        ]);
        $oldLogin->assertStatus(401);

        // Se audita la acción
        $this->assertTrue(
            BitacoraAuditoria::where('modulo', 'CU01')
                ->where('accion', 'RESTABLECER_PASSWORD')
                ->where('user_id', $user->id)
                ->exists()
        );
    }

    public function test_restablecer_password_rechaza_politica_insegura(): void
    {
        $user = $this->usuarioDePrueba();
        $codigo = '654321';

        DB::table('password_reset_tokens')->insert([
            'email'      => $user->email,
            'token'      => hash('sha256', $codigo),
            'created_at' => now(),
        ]);

        // Contraseña sin caracter especial
        $response = $this->postJson('/api/cu01/recuperar-password/restablecer', [
            'email'                 => $user->email,
            'codigo'                => $codigo,
            'password'              => 'Insegura123',
            'password_confirmation' => 'Insegura123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }
}
