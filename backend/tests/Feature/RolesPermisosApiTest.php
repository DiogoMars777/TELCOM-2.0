<?php

namespace Tests\Feature;

use App\Models\Paquetes\SeguridadAdministracion\CU03_UsuariosRolesPermisos\Permiso;
use App\Models\Paquetes\SeguridadAdministracion\CU03_UsuariosRolesPermisos\Rol;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * CU03 - Administración de la matriz de permisos por rol.
 *
 * Se ejecuta contra la BD en memoria (SQLite) con la matriz REAL del
 * DatabaseSeeder. Comprueba:
 *  - lectura y actualización por parte del administrador,
 *  - persistencia real en `rol_permiso`,
 *  - rechazo a usuarios sin autorización (incluso llamando directo a la API),
 *  - rechazo de permisos inexistentes,
 *  - efecto real sobre la autorización (403 tras quitar un permiso),
 *  - protección del permiso de administración (no dejar el sistema sin admin),
 *  - que Secretaría y Soporte Técnico conservan sus accesos vigentes,
 *  - que la bitácora registra el cambio,
 *  - que las funciones existentes de usuarios y login siguen funcionando.
 */
class RolesPermisosApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DatabaseSeeder::class);
    }

    private function usuarioConRol(string $slug, array $attributes = []): User
    {
        $rol = Rol::where('slug', $slug)->firstOrFail();

        return User::factory()->create(array_merge([
            'rol_id' => $rol->id,
            'activo' => true,
        ], $attributes));
    }

    /**
     * Autentica por token Bearer al usuario indicado.
     * `forgetGuards()` evita que el guard de Sanctum conserve en caché al
     * usuario de la petición anterior cuando un test cambia de actor.
     */
    private function asUser(User $user): static
    {
        $this->app['auth']->forgetGuards();

        return $this->withHeaders([
            'Authorization' => 'Bearer '.$user->createToken('roles-test')->plainTextToken,
        ]);
    }

    private function rolId(string $slug): int
    {
        return Rol::where('slug', $slug)->firstOrFail()->id;
    }

    // ---------------------------------------------------------------
    // 1. El administrador puede consultar roles y permisos
    // ---------------------------------------------------------------

    public function test_administrador_puede_consultar_roles_y_permisos(): void
    {
        $admin = $this->usuarioConRol('admin');

        $res = $this->asUser($admin)->getJson('/api/cu03/roles');

        $res->assertStatus(200)->assertJsonPath('success', true);

        $slugsRoles = array_column($res->json('data.roles'), 'slug');
        $this->assertContains('admin', $slugsRoles);
        $this->assertContains('secretaria', $slugsRoles);
        $this->assertContains('tecnico', $slugsRoles);

        $slugsPermisos = array_column($res->json('data.permisos'), 'slug');
        $this->assertContains('usuarios.manage', $slugsPermisos);
        $this->assertContains('clientes.view', $slugsPermisos);
        $this->assertContains('reportes.view', $slugsPermisos);
    }

    // ---------------------------------------------------------------
    // 2. El administrador puede cambiar los permisos de un rol
    // ---------------------------------------------------------------

    public function test_administrador_puede_cambiar_los_permisos_de_un_rol(): void
    {
        $admin = $this->usuarioConRol('admin');

        $res = $this->asUser($admin)
            ->putJson('/api/cu03/roles/'.$this->rolId('secretaria').'/permisos', [
                'permisos' => ['auth.login', 'clientes.view'],
            ]);

        $res->assertStatus(200)->assertJsonPath('success', true);
        $this->assertEqualsCanonicalizing(
            ['auth.login', 'clientes.view'],
            array_column($res->json('data.permisos'), 'slug')
        );
    }

    // ---------------------------------------------------------------
    // 3. Los permisos guardados persisten en la base de datos
    // ---------------------------------------------------------------

    public function test_los_permisos_guardados_persisten_en_rol_permiso(): void
    {
        $admin = $this->usuarioConRol('admin');
        $rolSecretaria = $this->rolId('secretaria');

        $this->asUser($admin)
            ->putJson("/api/cu03/roles/{$rolSecretaria}/permisos", [
                'permisos' => ['auth.login', 'clientes.view', 'clientes.create'],
            ])
            ->assertStatus(200);

        $secretaria = Rol::findOrFail($rolSecretaria);

        $this->assertEqualsCanonicalizing(
            ['auth.login', 'clientes.create', 'clientes.view'],
            $secretaria->permisos()->pluck('permisos.slug')->all()
        );

        // Exactamente 3 filas en la pivote para el rol y sin duplicados.
        $this->assertSame(3, $secretaria->permisos()->count());

        foreach (['auth.login', 'clientes.create', 'clientes.view'] as $slug) {
            $this->assertDatabaseHas('rol_permiso', [
                'rol_id'     => $secretaria->id,
                'permiso_id' => Permiso::where('slug', $slug)->value('id'),
            ]);
        }
    }

    // ---------------------------------------------------------------
    // 4. Un usuario sin autorización no puede consultar ni modificar
    // ---------------------------------------------------------------

    public function test_sin_token_no_puede_consultar_ni_modificar_permisos(): void
    {
        $this->getJson('/api/cu03/roles')->assertStatus(401);
        $this->putJson('/api/cu03/roles/2/permisos', ['permisos' => []])->assertStatus(401);
    }

    public function test_secretaria_no_puede_consultar_ni_modificar_permisos(): void
    {
        $secretaria = $this->usuarioConRol('secretaria');
        $rolSecretaria = $this->rolId('secretaria');

        $this->asUser($secretaria)->getJson('/api/cu03/roles')->assertStatus(403);
        $this->asUser($secretaria)
            ->putJson("/api/cu03/roles/{$rolSecretaria}/permisos", ['permisos' => ['auth.login']])
            ->assertStatus(403);
    }

    public function test_tecnico_no_puede_modificar_permisos(): void
    {
        $tecnico = $this->usuarioConRol('tecnico');

        $this->asUser($tecnico)
            ->putJson('/api/cu03/roles/'.$this->rolId('tecnico').'/permisos', ['permisos' => ['auth.login']])
            ->assertStatus(403);
    }

    // ---------------------------------------------------------------
    // 5. Un permiso inexistente es rechazado por el backend
    // ---------------------------------------------------------------

    public function test_permiso_inexistente_es_rechazado(): void
    {
        $admin = $this->usuarioConRol('admin');

        $this->asUser($admin)
            ->putJson('/api/cu03/roles/'.$this->rolId('secretaria').'/permisos', [
                'permisos' => ['clientes.view', 'permiso.que.no.existe'],
            ])
            ->assertStatus(422);
    }

    // ---------------------------------------------------------------
    // 6. Operación prohibida rechazada aunque se llame directo a la API
    // ---------------------------------------------------------------

    public function test_operacion_prohibida_se_rechaza_directo_contra_la_api(): void
    {
        // Sin token: la propia ruta lo bloquea antes del controlador.
        $this->putJson('/api/cu03/roles/1/permisos', ['permisos' => ['auth.login']])
            ->assertStatus(401);

        // Usuario externo (sin rol): autenticado pero sin permiso -> 403.
        $cliente = User::factory()->create(['rol_id' => null, 'activo' => true]);
        $this->asUser($cliente)
            ->putJson('/api/cu03/roles/1/permisos', ['permisos' => ['auth.login']])
            ->assertStatus(403);
    }

    // ---------------------------------------------------------------
    // 7. Eliminar un permiso afecta realmente a la autorización
    // ---------------------------------------------------------------

    public function test_quitar_permiso_afecta_la_autorizacion_real(): void
    {
        $admin = $this->usuarioConRol('admin');
        $secretaria = $this->usuarioConRol('secretaria');
        $rolSecretaria = $this->rolId('secretaria');

        // Antes: Secretaría puede consultar clientes.
        $this->asUser($secretaria)
            ->getJson('/api/cu06/clientes')->assertStatus(200);

        // El administrador quita `clientes.view` conservando el resto.
        $restantes = Rol::findOrFail($rolSecretaria)->permisos()->pluck('permisos.slug')
            ->reject(fn ($slug) => $slug === 'clientes.view')
            ->values()->all();

        $this->asUser($admin)
            ->putJson("/api/cu03/roles/{$rolSecretaria}/permisos", ['permisos' => $restantes])
            ->assertStatus(200);

        // Después: la API rechaza la operación con 403.
        $this->asUser($secretaria)
            ->getJson('/api/cu06/clientes')->assertStatus(403);

        // Y /me ya no expone el permiso eliminado.
        $permisos = $this->asUser($secretaria)
            ->getJson('/api/cu01/me')->json('data.permisos');
        $this->assertNotContains('clientes.view', $permisos);
    }

    // ---------------------------------------------------------------
    // 7b. Protección: no dejar el sistema sin administración
    // ---------------------------------------------------------------

    public function test_no_se_puede_dejar_el_sistema_sin_administrador(): void
    {
        $admin = $this->usuarioConRol('admin');
        $adminRol = Rol::where('slug', 'admin')->firstOrFail();

        // El rol admin es el único con `usuarios.manage` en la matriz real.
        $this->asUser($admin)
            ->putJson("/api/cu03/roles/{$adminRol->id}/permisos", [
                'permisos' => ['auth.login', 'clientes.view'],
            ])
            ->assertStatus(422);

        // El permiso crítico permanece intacto.
        $this->assertTrue(
            $adminRol->permisos()->where('permisos.slug', 'usuarios.manage')->exists()
        );
    }

    // ---------------------------------------------------------------
    // 8. Secretaría y Soporte Técnico conservan sus accesos vigentes
    // ---------------------------------------------------------------

    public function test_secretaria_y_tecnico_conservan_sus_accesos(): void
    {
        $admin = $this->usuarioConRol('admin');
        $secretaria = $this->usuarioConRol('secretaria');

        // Antes de tocar nada, Secretaría ve alertas.
        $this->asUser($secretaria)
            ->getJson('/api/cu12/alertas')->assertStatus(200);

        // El admin quita solo `alertas.view` a Secretaría.
        $nuevos = Rol::where('slug', 'secretaria')->firstOrFail()
            ->permisos()->pluck('permisos.slug')
            ->reject(fn ($slug) => $slug === 'alertas.view')
            ->values()->all();

        $this->asUser($admin)
            ->putJson('/api/cu03/roles/'.$this->rolId('secretaria').'/permisos', ['permisos' => $nuevos])
            ->assertStatus(200);

        $tecnico = $this->usuarioConRol('tecnico');

        // Secretaría conserva sus operaciones permitidas...
        $this->asUser($secretaria)->getJson('/api/cu06/clientes')->assertStatus(200);
        $this->asUser($secretaria)->getJson('/api/cu08/servicios')->assertStatus(200);
        // ...y pierde únicamente lo que se le quitó.
        $this->asUser($secretaria)->getJson('/api/cu12/alertas')->assertStatus(403);

        // El técnico no se tocó: conserva lo suyo y sigue sin acceso a pagos.
        $this->asUser($tecnico)->getJson('/api/cu06/clientes')->assertStatus(200);
        $this->asUser($tecnico)->getJson('/api/cu08/servicios')->assertStatus(200);
        $this->asUser($tecnico)->postJson('/api/cu10/pagos', [])->assertStatus(403);
    }

    // ---------------------------------------------------------------
    // 9. La bitácora registra las modificaciones
    // ---------------------------------------------------------------

    public function test_la_bitacora_registra_la_modificacion_de_permisos(): void
    {
        $admin = $this->usuarioConRol('admin');

        $this->asUser($admin)
            ->putJson('/api/cu03/roles/'.$this->rolId('secretaria').'/permisos', [
                'permisos' => ['auth.login', 'clientes.view'],
            ])
            ->assertStatus(200);

        $this->assertDatabaseHas('bitacora_auditorias', [
            'user_id' => $admin->id,
            'modulo'  => 'CU03',
            'accion'  => 'ACTUALIZAR_PERMISOS_ROL',
        ]);
    }

    // ---------------------------------------------------------------
    // 10. Las funciones existentes de usuarios e inicio de sesión siguen
    // ---------------------------------------------------------------

    public function test_crear_usuario_y_login_siguen_funcionando(): void
    {
        $admin = $this->usuarioConRol('admin');
        $rolSecretaria = $this->rolId('secretaria');

        $this->asUser($admin)
            ->postJson('/api/cu03/usuarios', [
                'name'     => 'Nueva Operadora',
                'email'    => 'nueva.operadora@telcom.local',
                'password' => 'ClaveSegura123!',
                'rol_id'   => $rolSecretaria,
            ])
            ->assertStatus(201)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('users', ['email' => 'nueva.operadora@telcom.local']);

        // El login del usuario recién creado funciona y expone su rol.
        $this->postJson('/api/cu01/login', [
            'email'    => 'nueva.operadora@telcom.local',
            'password' => 'ClaveSegura123!',
        ])
            ->assertStatus(200)
            ->assertJsonPath('data.user.rol.slug', 'secretaria');
    }
}
