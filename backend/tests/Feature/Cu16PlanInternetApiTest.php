<?php

namespace Tests\Feature;

use App\Models\Paquetes\SeguridadAdministracion\CU03_UsuariosRolesPermisos\Rol;
use App\Models\Paquetes\ServiciosPlanes\CU16_GestionarCatalogoPlanes\PlanInternet;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * CU16 - Gestionar Planes de Internet (catálogo).
 *
 * Se ejecuta contra SQLite en memoria con las migraciones y la matriz RBAC
 * REAL del proyecto. Verifica el CRUD por rol (admin / secretaría / técnico),
 * la validación y la baja LÓGICA (activo = false), que nunca borra el plan.
 */
class Cu16PlanInternetApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DatabaseSeeder::class);
    }

    // ---------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------

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
            'Authorization' => 'Bearer '.$user->createToken('cu16-test')->plainTextToken,
        ];
    }

    private function crearPlan(array $attributes = []): PlanInternet
    {
        return PlanInternet::create(array_merge([
            'nombre_plan'    => 'Plan CU16 '.Str::upper(Str::random(5)),
            'velocidad_mbps' => 50,
            'precio_mensual' => 120.00,
            'descripcion'    => 'Plan de prueba.',
            'activo'         => true,
        ], $attributes));
    }

    // ---------------------------------------------------------------
    // Autenticación (401)
    // ---------------------------------------------------------------

    public function test_sin_token_no_puede_crear_plan(): void
    {
        $this->postJson('/api/planes', [])->assertStatus(401);
    }

    // ---------------------------------------------------------------
    // Creación (planes.assign)
    // ---------------------------------------------------------------

    public function test_admin_puede_crear_plan(): void
    {
        $admin = $this->usuarioConRol('admin');

        $this->withHeaders($this->bearer($admin))
            ->postJson('/api/planes', [
                'nombre_plan'    => 'Plan Fibra Ultra 200 Mbps',
                'velocidad_mbps' => 200,
                'precio_mensual' => 350.00,
                'descripcion'    => 'Plan de alta velocidad.',
                'activo'         => true,
            ])
            ->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.plan.nombre_plan', 'Plan Fibra Ultra 200 Mbps')
            ->assertJsonPath('data.plan.velocidad_mbps', 200);

        $this->assertDatabaseHas('PlanInternet', [
            'nombrePlan' => 'Plan Fibra Ultra 200 Mbps',
            'activo'     => true,
        ]);
    }

    public function test_secretaria_puede_crear_plan(): void
    {
        $secretaria = $this->usuarioConRol('secretaria');

        $this->withHeaders($this->bearer($secretaria))
            ->postJson('/api/planes', [
                'nombre_plan'    => 'Plan Hogar 60 Mbps',
                'velocidad_mbps' => 60,
                'precio_mensual' => 180.00,
            ])
            ->assertStatus(201);
    }

    public function test_tecnico_no_puede_crear_plan(): void
    {
        $tecnico = $this->usuarioConRol('tecnico');

        $this->withHeaders($this->bearer($tecnico))
            ->postJson('/api/planes', [
                'nombre_plan'    => 'Plan No Autorizado',
                'velocidad_mbps' => 10,
                'precio_mensual' => 50.00,
            ])
            ->assertStatus(403);
    }

    public function test_crear_plan_invalido_devuelve_422(): void
    {
        $admin = $this->usuarioConRol('admin');

        $this->withHeaders($this->bearer($admin))
            ->postJson('/api/planes', [
                'nombre_plan'    => '',
                'velocidad_mbps' => 0,
                'precio_mensual' => -5,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['nombre_plan', 'velocidad_mbps', 'precio_mensual']);
    }

    // ---------------------------------------------------------------
    // Actualización y baja lógica
    // ---------------------------------------------------------------

    public function test_admin_puede_actualizar_plan(): void
    {
        $admin = $this->usuarioConRol('admin');
        $plan = $this->crearPlan(['nombre_plan' => 'Plan Antiguo']);

        $this->withHeaders($this->bearer($admin))
            ->putJson("/api/planes/{$plan->id}", [
                'nombre_plan'    => 'Plan Renovado',
                'precio_mensual' => 210.50,
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.plan.nombre_plan', 'Plan Renovado');

        $this->assertDatabaseHas('PlanInternet', [
            'idPlan'     => $plan->id,
            'nombrePlan' => 'Plan Renovado',
        ]);
    }

    public function test_eliminar_plan_es_baja_logica_no_fisica(): void
    {
        $admin = $this->usuarioConRol('admin');
        $plan = $this->crearPlan(['activo' => true]);

        $this->withHeaders($this->bearer($admin))
            ->deleteJson("/api/planes/{$plan->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.plan.activo', false);

        // El registro sigue existiendo; solo cambió `activo`.
        $this->assertDatabaseHas('PlanInternet', [
            'idPlan' => $plan->id,
            'activo' => false,
        ]);
    }

    public function test_admin_puede_reactivar_un_plan(): void
    {
        $admin = $this->usuarioConRol('admin');
        $plan = $this->crearPlan(['activo' => false]);

        $this->withHeaders($this->bearer($admin))
            ->putJson("/api/planes/{$plan->id}", ['activo' => true])
            ->assertStatus(200)
            ->assertJsonPath('data.plan.activo', true);

        $this->assertDatabaseHas('PlanInternet', [
            'idPlan' => $plan->id,
            'activo' => true,
        ]);
    }

    public function test_tecnico_no_puede_desactivar_plan(): void
    {
        $tecnico = $this->usuarioConRol('tecnico');
        $plan = $this->crearPlan(['activo' => true]);

        $this->withHeaders($this->bearer($tecnico))
            ->deleteJson("/api/planes/{$plan->id}")
            ->assertStatus(403);

        $this->assertDatabaseHas('PlanInternet', [
            'idPlan' => $plan->id,
            'activo' => true,
        ]);
    }
}
