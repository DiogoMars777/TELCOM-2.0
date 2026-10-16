<?php

namespace Tests\Feature;

use App\Models\Paquetes\SeguridadAdministracion\CU03_UsuariosRolesPermisos\Rol;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * CU01 - Cambio de contraseña del propio usuario autenticado.
 *
 * Se ejecuta contra la BD en memoria (SQLite) con la matriz REAL del
 * DatabaseSeeder. Comprueba que:
 *  - Administrador, Secretaría y Soporte Técnico cambian su contraseña y
 *    pueden iniciar sesión con la nueva;
 *  - se rechazan las contraseñas que no cumplen la política (longitud,
 *    mayúscula, minúscula, número y carácter especial);
 *  - se rechaza una contraseña actual incorrecta sin modificar nada;
 *  - se rechaza una confirmación que no coincide;
 *  - un usuario NO puede cambiar la contraseña de otro enviando su id/email;
 *  - sin token la operación es 401;
 *  - ni la respuesta ni la bitácora exponen la contraseña.
 */
class CambiarPasswordTest extends TestCase
{
    use RefreshDatabase;

    private const PASSWORD_ACTUAL = 'ActualClave123!';
    private const PASSWORD_NUEVA  = 'NuevaClave456@';

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DatabaseSeeder::class);
    }

    private function rolId(string $slug): int
    {
        return Rol::where('slug', $slug)->firstOrFail()->id;
    }

    private function usuarioConRol(string $slug, string $email, string $password = self::PASSWORD_ACTUAL): User
    {
        return User::factory()->create([
            'email'    => $email,
            'password' => Hash::make($password),
            'rol_id'   => $this->rolId($slug),
            'activo'   => true,
        ]);
    }

    /**
     * Autentica por token Bearer y limpia el guard para no arrastrar el actor
     * de una petición previa en el mismo test.
     */
    private function autenticadoComo(User $user): static
    {
        $this->app['auth']->forgetGuards();

        return $this->withHeaders([
            'Authorization' => 'Bearer '.$user->createToken('pwd-change')->plainTextToken,
        ]);
    }

    private function payload(array $override = []): array
    {
        return array_merge([
            'current_password'          => self::PASSWORD_ACTUAL,
            'new_password'              => self::PASSWORD_NUEVA,
            'new_password_confirmation' => self::PASSWORD_NUEVA,
        ], $override);
    }

    // ---------------------------------------------------------------
    // 1. Los tres roles cambian su contraseña y pueden iniciar sesión
    // ---------------------------------------------------------------

    public function test_los_tres_roles_cambian_su_contrasena_y_pueden_iniciar_sesion(): void
    {
        foreach (['admin', 'secretaria', 'tecnico'] as $slug) {
            $email = "cambio.{$slug}@telcom.local";
            $user = $this->usuarioConRol($slug, $email);

            $this->autenticadoComo($user)
                ->postJson('/api/cu01/cambiar-password', $this->payload())
                ->assertStatus(200)
                ->assertJsonPath('success', true);

            // La contraseña quedó hasheada, no en texto plano.
            $user->refresh();
            $this->assertTrue(Hash::check(self::PASSWORD_NUEVA, $user->password));
            $this->assertNotSame(self::PASSWORD_NUEVA, $user->password);

            // Inicia sesión con la nueva contraseña...
            $this->postJson('/api/cu01/login', [
                'email'    => $email,
                'password' => self::PASSWORD_NUEVA,
            ])->assertStatus(200)->assertJsonPath('data.user.rol.slug', $slug);

            // ...y la anterior deja de servir.
            $this->postJson('/api/cu01/login', [
                'email'    => $email,
                'password' => self::PASSWORD_ACTUAL,
            ])->assertStatus(401);
        }
    }

    // ---------------------------------------------------------------
    // 2. Política de contraseñas: se rechazan las que no cumplen
    // ---------------------------------------------------------------

    public function test_rechaza_contrasenas_que_no_cumplen_la_politica(): void
    {
        $casos = [
            ['Ab1!xy',            '8 caracteres'],   // demasiado corta
            ['clavesegura123!',   'mayúscula'],      // sin mayúscula
            ['CLAVESEGURA123!',   'minúscula'],      // sin minúscula
            ['ClaveSegura!',      'número'],         // sin número
            ['ClaveSegura123',    'carácter especial'], // sin símbolo
        ];

        foreach ($casos as $i => [$password, $mensajeEsperado]) {
            $user = $this->usuarioConRol('secretaria', "politica{$i}@telcom.local");

            $res = $this->autenticadoComo($user)
                ->postJson('/api/cu01/cambiar-password', $this->payload([
                    'new_password'              => $password,
                    'new_password_confirmation' => $password,
                ]));

            $res->assertStatus(422)->assertJsonValidationErrors('new_password');
            $this->assertStringContainsString($mensajeEsperado, $res->json('errors.new_password.0'));
            $this->assertStringNotContainsString($password, $res->json('errors.new_password.0'));

            // La contraseña original no se modificó.
            $user->refresh();
            $this->assertTrue(Hash::check(self::PASSWORD_ACTUAL, $user->password));
        }
    }

    // ---------------------------------------------------------------
    // 3. Contraseña actual incorrecta: se rechaza y no cambia nada
    // ---------------------------------------------------------------

    public function test_rechaza_contrasena_actual_incorrecta(): void
    {
        $user = $this->usuarioConRol('admin', 'actual.mala@telcom.local');

        $res = $this->autenticadoComo($user)
            ->postJson('/api/cu01/cambiar-password', $this->payload([
                'current_password' => 'Incorrecta123!',
            ]));

        $res->assertStatus(422)->assertJsonValidationErrors('current_password');
        $this->assertStringContainsString('incorrecta', $res->json('errors.current_password.0'));

        $user->refresh();
        $this->assertTrue(Hash::check(self::PASSWORD_ACTUAL, $user->password));
        $this->assertFalse(Hash::check(self::PASSWORD_NUEVA, $user->password));
    }

    // ---------------------------------------------------------------
    // 4. Confirmación distinta: se rechaza
    // ---------------------------------------------------------------

    public function test_rechaza_confirmacion_diferente(): void
    {
        $user = $this->usuarioConRol('admin', 'confirmacion@telcom.local');

        $res = $this->autenticadoComo($user)
            ->postJson('/api/cu01/cambiar-password', $this->payload([
                'new_password_confirmation' => 'OtraClave789@',
            ]));

        $res->assertStatus(422)->assertJsonValidationErrors('new_password');

        $user->refresh();
        $this->assertTrue(Hash::check(self::PASSWORD_ACTUAL, $user->password));
    }

    // ---------------------------------------------------------------
    // 5. No se puede cambiar la contraseña de OTRO usuario
    // ---------------------------------------------------------------

    public function test_no_puede_cambiar_la_contrasena_de_otro_usuario(): void
    {
        $victima = $this->usuarioConRol('secretaria', 'victima@telcom.local');
        $intruso = $this->usuarioConRol('admin', 'intruso@telcom.local');
        $hashVictima = $victima->password;

        // Intenta cambiar la contraseña de la víctima enviando su id, user_id y email.
        $this->autenticadoComo($intruso)
            ->postJson('/api/cu01/cambiar-password', $this->payload([
                'id'      => $victima->id,
                'user_id' => $victima->id,
                'email'   => $victima->email,
            ]))
            ->assertStatus(200);

        // La víctima conserva EXACTAMENTE su contraseña anterior...
        $victima->refresh();
        $this->assertSame($hashVictima, $victima->password);
        $this->assertTrue(Hash::check(self::PASSWORD_ACTUAL, $victima->password));
        $this->assertFalse(Hash::check(self::PASSWORD_NUEVA, $victima->password));

        // ...y el intruso solo cambió la suya.
        $intruso->refresh();
        $this->assertTrue(Hash::check(self::PASSWORD_NUEVA, $intruso->password));
    }

    // ---------------------------------------------------------------
    // 6. Sin token: 401
    // ---------------------------------------------------------------

    public function test_sin_token_es_rechazado(): void
    {
        $this->postJson('/api/cu01/cambiar-password', $this->payload())
            ->assertStatus(401);
    }

    // ---------------------------------------------------------------
    // 7. Ni la respuesta ni la bitácora exponen la contraseña
    // ---------------------------------------------------------------

    public function test_la_respuesta_y_la_bitacora_no_exponen_la_contrasena(): void
    {
        $user = $this->usuarioConRol('admin', 'sin.exposicion@telcom.local');

        $res = $this->autenticadoComo($user)
            ->postJson('/api/cu01/cambiar-password', $this->payload());

        $res->assertStatus(200);

        // La contraseña (nueva o actual) no aparece en el cuerpo de la respuesta.
        $contenido = $res->getContent();
        $this->assertStringNotContainsString(self::PASSWORD_NUEVA, $contenido);
        $this->assertStringNotContainsString(self::PASSWORD_ACTUAL, $contenido);
        $this->assertArrayNotHasKey('password', $res->json('data') ?? []);

        // La bitácora registra el hecho, sin contraseñas.
        $this->assertDatabaseHas('bitacora_auditorias', [
            'user_id' => $user->id,
            'modulo'  => 'CU01',
            'accion'  => 'CAMBIAR_PASSWORD',
        ]);

        $detalles = (string) \App\Models\Paquetes\SeguridadAdministracion\CU02_BitacoraAuditoria\BitacoraAuditoria::query()
            ->where('user_id', $user->id)
            ->where('accion', 'CAMBIAR_PASSWORD')
            ->value('detalles');

        $this->assertStringNotContainsString(self::PASSWORD_NUEVA, $detalles);
        $this->assertStringNotContainsString(self::PASSWORD_ACTUAL, $detalles);
    }
}
