<?php

namespace Tests\Feature;

use App\Models\Paquetes\SeguridadAdministracion\CU03_UsuariosRolesPermisos\Rol;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\DemoUsersSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Verifica el seeder de usuarios de demostración (solo entorno local):
 * crea una cuenta por rol, es idempotente, no sobrescribe contraseñas
 * existentes y se omite en producción.
 */
class DemoUsersSeederTest extends TestCase
{
    use RefreshDatabase;

    private const CUENTAS = [
        'admin'      => 'admin.demo@telcom.local',
        'secretaria' => 'secretaria.demo@telcom.local',
        'tecnico'    => 'tecnico.demo@telcom.local',
    ];

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_crea_una_cuenta_por_rol_interno(): void
    {
        $this->seed(DemoUsersSeeder::class);

        foreach (self::CUENTAS as $slug => $email) {
            $user = User::where('email', $email)->first();

            $this->assertNotNull($user, "Falta la cuenta demo {$email}");
            $this->assertEquals($slug, $user->rol?->slug);
            $this->assertTrue((bool) $user->activo);
        }
    }

    public function test_es_idempotente_y_no_duplica_cuentas(): void
    {
        $this->seed(DemoUsersSeeder::class);
        $this->seed(DemoUsersSeeder::class);

        $this->assertSame(
            3,
            User::whereIn('email', array_values(self::CUENTAS))->count()
        );
    }

    public function test_no_sobrescribe_la_contrasena_de_una_cuenta_existente(): void
    {
        $rol = Rol::where('slug', 'tecnico')->firstOrFail();
        $user = User::factory()->create([
            'email'    => self::CUENTAS['tecnico'],
            'password' => 'miPropiaClave123',
            'rol_id'   => $rol->id,
            'activo'   => false,
        ]);

        $this->seed(DemoUsersSeeder::class);

        $user->refresh();
        $this->assertTrue(
            Hash::check('miPropiaClave123', $user->password),
            'La contraseña existente NO debe sobrescribirse.'
        );
        $this->assertTrue((bool) $user->activo);
    }

    public function test_no_se_ejecuta_en_produccion(): void
    {
        $this->app['env'] = 'production';

        // Se invoca el seeder directamente para no pasar por `db:seed`,
        // que en producción solicita confirmación interactiva.
        (new DemoUsersSeeder())->run();

        $this->assertSame(
            0,
            User::whereIn('email', array_values(self::CUENTAS))->count()
        );
    }
}
