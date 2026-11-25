<?php

namespace Tests\Feature;

use App\Models\Paquetes\P1_SeguridadAdministracion\CU03_UsuariosRolesPermisos\Permiso;
use App\Models\Paquetes\P1_SeguridadAdministracion\CU03_UsuariosRolesPermisos\Rol;
use App\Models\Paquetes\P1_SeguridadAdministracion\CU28_GenerarRestaurarCopiasSeguridad\ConfiguracionBackup;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Cu28CopiasSeguridadTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    private function usuarioConRol(string $slug): User
    {
        $rol = Rol::where('slug', $slug)->firstOrFail();

        return User::factory()->create([
            'rol_id' => $rol->id,
            'activo' => true,
        ]);
    }

    private function bearer(User $user): array
    {
        return [
            'Authorization' => 'Bearer ' . $user->createToken('cu28-test')->plainTextToken,
        ];
    }

    public function test_sin_token_no_puede_consultar_configuracion(): void
    {
        $this->getJson('/api/cu28/configuracion')->assertStatus(401);
    }

    public function test_usuario_sin_permiso_recibe_403_en_configuracion(): void
    {
        $rolSinPermisos = Rol::create([
            'nombre' => 'Invitado',
            'slug'   => 'invitado',
            'activo' => true,
        ]);
        $usuario = User::factory()->create(['rol_id' => $rolSinPermisos->id, 'activo' => true]);

        $this->withHeaders($this->bearer($usuario))
            ->getJson('/api/cu28/configuracion')
            ->assertStatus(403);
    }

    public function test_administrador_obtiene_configuracion_backup(): void
    {
        $admin = $this->usuarioConRol('admin');

        $res = $this->withHeaders($this->bearer($admin))
            ->getJson('/api/cu28/configuracion')
            ->assertStatus(200);

        $this->assertTrue($res->json('success'));
        $this->assertNotNull($res->json('data.configuracion'));
        $this->assertEquals('DIARIO', $res->json('data.configuracion.frecuencia'));
    }

    public function test_administrador_actualiza_configuracion_backup(): void
    {
        $admin = $this->usuarioConRol('admin');

        $payload = [
            'activo'           => true,
            'frecuencia'       => 'SEMANAL',
            'hora_ejecucion'   => '03:30',
            'dias_semana'      => ['1', '3', '5'],
            'dia_mes'          => 15,
            'retencion_copias' => 10,
        ];

        $res = $this->withHeaders($this->bearer($admin))
            ->putJson('/api/cu28/configuracion', $payload)
            ->assertStatus(200);

        $this->assertTrue($res->json('success'));
        $this->assertEquals('SEMANAL', $res->json('data.configuracion.frecuencia'));
        $this->assertEquals('03:30', $res->json('data.configuracion.hora_ejecucion'));
        $this->assertEquals(10, $res->json('data.configuracion.retencion_copias'));

        $this->assertDatabaseHas('ConfiguracionBackup', [
            'frecuencia'    => 'SEMANAL',
            'horaEjecucion' => '03:30',
        ]);
    }

    public function test_validacion_frecuencia_invalida_retorna_422(): void
    {
        $admin = $this->usuarioConRol('admin');

        $payload = [
            'activo'           => true,
            'frecuencia'       => 'HORA_INVALIDA',
            'hora_ejecucion'   => '99:99',
            'retencion_copias' => 0,
        ];

        $this->withHeaders($this->bearer($admin))
            ->putJson('/api/cu28/configuracion', $payload)
            ->assertStatus(422);
    }
}
