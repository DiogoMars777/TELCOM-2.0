<?php

namespace Tests\Feature;

use App\Models\Paquetes\SeguridadAdministracion\CU03_UsuariosRolesPermisos\Rol;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * CU03 - Registro de usuarios internos: política de contraseñas y rol.
 *
 * Se ejecuta contra la BD en memoria (SQLite) con la matriz REAL del
 * DatabaseSeeder. Comprueba que el endpoint real `POST /api/cu03/usuarios`:
 *  - crea el usuario con el rol correcto (Secretaría) cuando la contraseña es
 *    válida y el login posterior funciona;
 *  - rechaza contraseñas sin mayúscula, sin minúscula, sin número, sin
 *    carácter especial o demasiado cortas, incluso llamando directo a la API;
 *  - devuelve mensajes de validación claros sin exponer datos sensibles.
 */
class UsuarioRegistroPasswordTest extends TestCase
{
    use RefreshDatabase;

    private const PASSWORD_VALIDA = 'ClaveSegura123!';

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DatabaseSeeder::class);
    }

    private function rolId(string $slug): int
    {
        return Rol::where('slug', $slug)->firstOrFail()->id;
    }

    private function administrador(): User
    {
        return User::factory()->create([
            'rol_id' => $this->rolId('admin'),
            'activo' => true,
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
            'Authorization' => 'Bearer '.$user->createToken('pwd-test')->plainTextToken,
        ]);
    }

    // ---------------------------------------------------------------
    // 1. Contraseña válida y rol correcto
    // ---------------------------------------------------------------

    public function test_registra_usuario_con_contrasena_valida_y_rol_secretaria(): void
    {
        $admin = $this->administrador();
        $idSecretaria = $this->rolId('secretaria');

        $email = 'operadora.secretaria@telcom.local';

        $this->autenticadoComo($admin)
            ->postJson('/api/cu03/usuarios', [
                'name'     => 'Operadora de Secretaría',
                'email'    => $email,
                'password' => self::PASSWORD_VALIDA,
                'rol_id'   => $idSecretaria,
            ])
            ->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.rol.slug', 'secretaria');

        // Se persistió con el rol real de Secretaría (mismo id existente).
        $this->assertDatabaseHas('users', [
            'email'  => $email,
            'rol_id' => $idSecretaria,
        ]);

        // El login del usuario recién creado funciona y expone su rol.
        $this->postJson('/api/cu01/login', [
            'email'    => $email,
            'password' => self::PASSWORD_VALIDA,
        ])
            ->assertStatus(200)
            ->assertJsonPath('data.user.rol.slug', 'secretaria');
    }

    // ---------------------------------------------------------------
    // 2. Contraseñas inválidas rechazadas directo contra la API
    // ---------------------------------------------------------------

    /**
     * Envía un intento de registro y comprueba que el backend lo rechaza por
     * la contraseña, con mensaje claro, sin exponer la clave y sin crear el
     * usuario. Ejercita el endpoint real directamente (sin pasar por la UI).
     */
    private function assertContrasenaRechazada(string $password, string $mensajeEsperado): void
    {
        $admin = $this->administrador();
        $email = 'invalida'.md5($password).'@telcom.local';

        $res = $this->autenticadoComo($admin)
            ->postJson('/api/cu03/usuarios', [
                'name'     => 'Usuario Inválido',
                'email'    => $email,
                'password' => $password,
                'rol_id'   => $this->rolId('secretaria'),
            ]);

        $res->assertStatus(422)->assertJsonValidationErrors('password');

        // El mensaje es claro y no repite la contraseña enviada.
        $this->assertStringContainsString($mensajeEsperado, $res->json('errors.password.0'));
        $this->assertStringNotContainsString($password, $res->json('errors.password.0'));

        // Nunca se crea el usuario con una contraseña inválida.
        $this->assertDatabaseMissing('users', ['email' => $email]);
    }

    public function test_rechaza_contrasena_sin_mayuscula(): void
    {
        $this->assertContrasenaRechazada('clavesegura123!', 'mayúscula');
    }

    public function test_rechaza_contrasena_sin_minuscula(): void
    {
        $this->assertContrasenaRechazada('CLAVESEGURA123!', 'minúscula');
    }

    public function test_rechaza_contrasena_sin_numero(): void
    {
        $this->assertContrasenaRechazada('ClaveSegura!', 'número');
    }

    public function test_rechaza_contrasena_sin_caracter_especial(): void
    {
        $this->assertContrasenaRechazada('ClaveSegura123', 'carácter especial');
    }

    public function test_rechaza_contrasena_demasiado_corta(): void
    {
        // Cumple mayúscula/minúscula/número/símbolo pero no la longitud mínima.
        $this->assertContrasenaRechazada('Ab1!xy', '8 caracteres');
    }

    // ---------------------------------------------------------------
    // 3. La regla se aplica igual aunque el rol venga por nombre (compat.)
    // ---------------------------------------------------------------

    public function test_rechaza_contrasena_invalida_aunque_el_resto_sea_correcto(): void
    {
        $admin = $this->administrador();

        $res = $this->autenticadoComo($admin)
            ->postJson('/api/cu03/usuarios', [
                'name'     => 'Usuario Compat',
                'email'    => 'compat@telcom.local',
                'password' => 'sinespecial123',
                'role'     => 'Secretaría',
            ]);

        $res->assertStatus(422)->assertJsonValidationErrors('password');

        $this->assertDatabaseMissing('users', ['email' => 'compat@telcom.local']);
    }
}
