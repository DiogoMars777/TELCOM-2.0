<?php

namespace Tests\Feature;

use App\Models\Paquetes\SeguridadAdministracion\CU03_UsuariosRolesPermisos\Rol;
use App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio\EstadoServicio;
use App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio\ServicioInternet;
use App\Models\Paquetes\ServiciosPlanes\CU16_GestionarCatalogoPlanes\PlanInternet;
use App\Models\Paquetes\ServiciosPlanes\CU17_AsignarCambiarPlanInternet\AsignacionPlan;
use App\Models\Paquetes\FacturacionCobranza\CU09_GenerarMensualidades\MensualidadFacturacion;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Fase "Planes de Internet y Estados de Servicio".
 *
 * Se ejecuta contra SQLite en memoria con las migraciones y la matriz RBAC
 * REAL del proyecto. Verifica catálogo de planes, asignación a servicios,
 * conservación del historial, rechazo de planes inválidos, relaciones
 * Eloquent y autorización por rol (admin / secretaría / técnico).
 */
class PlanesApiTest extends TestCase
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

    private function usuarioConRol(string $slug, array $attributes = []): User
    {
        $rol = Rol::where('slug', $slug)->firstOrFail();

        return User::factory()->create(array_merge([
            'rol_id' => $rol->id,
            'activo' => true,
        ], $attributes));
    }

    private function bearer(User $user): array
    {
        return [
            'Authorization' => 'Bearer '.$user->createToken('planes-test')->plainTextToken,
        ];
    }

    private function servicioSembrado(): ServicioInternet
    {
        return ServicioInternet::where('codigo_servicio', 'SRV-88201')->firstOrFail();
    }

    private function crearPlan(array $attributes = []): PlanInternet
    {
        return PlanInternet::create(array_merge([
            'nombre_plan'    => 'Plan Test '.Str::upper(Str::random(5)),
            'velocidad_mbps' => 50,
            'precio_mensual' => 120.00,
            'descripcion'    => 'Plan de prueba.',
            'activo'         => true,
        ], $attributes));
    }

    // ---------------------------------------------------------------
    // Autenticación (401)
    // ---------------------------------------------------------------

    public function test_sin_token_devuelve_401(): void
    {
        $this->getJson('/api/planes')->assertStatus(401);
        $this->postJson('/api/cu08/servicios/1/planes', [])->assertStatus(401);
    }

    // ---------------------------------------------------------------
    // Consulta del catálogo (planes.view)
    // ---------------------------------------------------------------

    public function test_admin_puede_listar_planes(): void
    {
        $admin = $this->usuarioConRol('admin');

        $this->withHeaders($this->bearer($admin))
            ->getJson('/api/planes')
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['planes']]);
    }

    public function test_secretaria_puede_listar_planes(): void
    {
        $secretaria = $this->usuarioConRol('secretaria');

        $this->withHeaders($this->bearer($secretaria))
            ->getJson('/api/planes')
            ->assertStatus(200);
    }

    public function test_tecnico_no_puede_listar_planes(): void
    {
        $tecnico = $this->usuarioConRol('tecnico');

        $this->withHeaders($this->bearer($tecnico))
            ->getJson('/api/planes')
            ->assertStatus(403);
    }

    // ---------------------------------------------------------------
    // Asignación de plan (planes.assign)
    // ---------------------------------------------------------------

    public function test_admin_puede_asignar_plan_y_se_registra_el_usuario(): void
    {
        $admin = $this->usuarioConRol('admin');
        $servicio = $this->servicioSembrado();
        $plan = $this->crearPlan(['precio_mensual' => 199.90]);

        $this->withHeaders($this->bearer($admin))
            ->postJson("/api/cu08/servicios/{$servicio->id}/planes", [
                'plan_id'       => $plan->id,
                'motivo_cambio' => 'Cambio solicitado por el cliente',
            ])
            ->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.asignacion.plan_id', $plan->id)
            ->assertJsonPath('data.asignacion.user_id', $admin->id)
            ->assertJsonPath('data.asignacion.plan.nombre_plan', $plan->nombre_plan);

        $this->assertDatabaseHas('asignaciones_plan', [
            'servicio_id' => $servicio->id,
            'plan_id'     => $plan->id,
            'user_id'     => $admin->id,
            'fecha_fin'   => null,
        ]);

        // El "snapshot" legado que consume CU08 queda coherente.
        $servicio->refresh();
        $this->assertSame($plan->nombre_plan, $servicio->plan_nombre);
        $this->assertSame($plan->velocidad_mbps, $servicio->velocidad_mbps);
        $this->assertSame('199.90', (string) $servicio->precio_mensual);
    }

    public function test_secretaria_puede_asignar_plan(): void
    {
        $secretaria = $this->usuarioConRol('secretaria');
        $servicio = $this->servicioSembrado();
        $plan = $this->crearPlan();

        $this->withHeaders($this->bearer($secretaria))
            ->postJson("/api/cu08/servicios/{$servicio->id}/planes", ['plan_id' => $plan->id])
            ->assertStatus(201)
            ->assertJsonPath('data.asignacion.user_id', $secretaria->id);
    }

    public function test_tecnico_no_puede_asignar_plan(): void
    {
        $tecnico = $this->usuarioConRol('tecnico');
        $servicio = $this->servicioSembrado();
        $plan = $this->crearPlan();

        $this->withHeaders($this->bearer($tecnico))
            ->postJson("/api/cu08/servicios/{$servicio->id}/planes", ['plan_id' => $plan->id])
            ->assertStatus(403);

        $this->assertDatabaseMissing('asignaciones_plan', [
            'servicio_id' => $servicio->id,
            'plan_id'     => $plan->id,
        ]);
    }

    // ---------------------------------------------------------------
    // Historial: cambiar de plan NO sobrescribe la asignación anterior
    // ---------------------------------------------------------------

    public function test_cambiar_de_plan_conserva_el_historial_anterior(): void
    {
        $admin = $this->usuarioConRol('admin');
        $headers = $this->bearer($admin);
        $servicio = $this->servicioSembrado();

        $planA = $this->crearPlan(['nombre_plan' => 'Plan A', 'velocidad_mbps' => 30, 'precio_mensual' => 100.00]);
        $planB = $this->crearPlan(['nombre_plan' => 'Plan B', 'velocidad_mbps' => 80, 'precio_mensual' => 300.00]);

        $this->withHeaders($headers)
            ->postJson("/api/cu08/servicios/{$servicio->id}/planes", ['plan_id' => $planA->id])
            ->assertStatus(201);

        $this->withHeaders($headers)
            ->postJson("/api/cu08/servicios/{$servicio->id}/planes", ['plan_id' => $planB->id])
            ->assertStatus(201);

        // Existe exactamente una asignación vigente (fecha_fin null) y el plan
        // anterior quedó cerrado, no borrado.
        $this->assertSame(
            1,
            AsignacionPlan::where('servicio_id', $servicio->id)->whereNull('fecha_fin')->count()
        );
        $this->assertSame(3, AsignacionPlan::where('servicio_id', $servicio->id)->count());

        $planACerrado = AsignacionPlan::where('servicio_id', $servicio->id)
            ->where('plan_id', $planA->id)
            ->firstOrFail();
        $this->assertNotNull($planACerrado->fecha_fin, 'La asignación anterior debe quedar cerrada con fecha_fin.');
        $this->assertSame('100.00', (string) $planACerrado->precio_aplicado);

        // Y el servicio muestra el plan vigente (B).
        $servicio->refresh();
        $this->assertSame('Plan B', $servicio->plan_nombre);
        $this->assertSame(300.00, (float) $servicio->precio_mensual);

        // El historial consultable incluye todos los cambios.
        $this->withHeaders($headers)
            ->getJson("/api/cu08/servicios/{$servicio->id}/planes")
            ->assertStatus(200)
            ->assertJsonCount(3, 'data.asignaciones');
    }

    // ---------------------------------------------------------------
    // Validación: plan inexistente o inactivo
    // ---------------------------------------------------------------

    public function test_rechaza_plan_inexistente(): void
    {
        $admin = $this->usuarioConRol('admin');
        $servicio = $this->servicioSembrado();

        $this->withHeaders($this->bearer($admin))
            ->postJson("/api/cu08/servicios/{$servicio->id}/planes", ['plan_id' => 999999])
            ->assertStatus(422)
            ->assertJsonValidationErrors('plan_id');
    }

    public function test_rechaza_plan_inactivo(): void
    {
        $admin = $this->usuarioConRol('admin');
        $servicio = $this->servicioSembrado();
        $inactivo = $this->crearPlan(['activo' => false]);

        $this->withHeaders($this->bearer($admin))
            ->postJson("/api/cu08/servicios/{$servicio->id}/planes", ['plan_id' => $inactivo->id])
            ->assertStatus(422)
            ->assertJsonValidationErrors('plan_id');

        $this->assertDatabaseMissing('asignaciones_plan', [
            'servicio_id' => $servicio->id,
            'plan_id'     => $inactivo->id,
        ]);
    }

    // ---------------------------------------------------------------
    // Relaciones Eloquent (UML)
    // ---------------------------------------------------------------

    public function test_relaciones_eloquent_del_modelo(): void
    {
        $servicio = $this->servicioSembrado();

        // EstadoServicio [1] -> ServicioInternet [0..*]
        $this->assertNotNull($servicio->estado_servicio_id);
        $this->assertInstanceOf(EstadoServicio::class, $servicio->estado);
        $this->assertSame('ACTIVO', $servicio->estado->nombre_estado);
        $this->assertTrue($servicio->estado->servicios()->whereKey($servicio->id)->exists());

        // ServicioInternet [1] -> AsignacionPlan [1..*]
        $this->assertGreaterThanOrEqual(1, $servicio->asignacionesPlan()->count());
        $this->assertInstanceOf(AsignacionPlan::class, $servicio->asignacionPlanActual);

        $asignacion = $servicio->asignacionPlanActual;

        // AsignacionPlan -> ServicioInternet / PlanInternet
        $this->assertTrue($asignacion->servicio->is($servicio));
        $this->assertInstanceOf(PlanInternet::class, $asignacion->plan);

        // PlanInternet [1] -> AsignacionPlan [0..*]
        $this->assertTrue($asignacion->plan->asignaciones()->whereKey($asignacion->id)->exists());
    }

    // ---------------------------------------------------------------
    // Catálogo de estados
    // ---------------------------------------------------------------

    public function test_catalogo_de_estados_sembrado(): void
    {
        foreach (['PENDIENTE_INSTALACION', 'ACTIVO', 'SUSPENDIDO', 'CORTADO'] as $nombre) {
            $this->assertDatabaseHas('estados_servicio', ['nombre_estado' => $nombre]);
        }
    }

    // ===============================================================
    // CU16 - Gestionar catálogo de planes (planes.manage: solo admin)
    // ===============================================================

    public function test_admin_crea_plan_y_registra_auditoria(): void
    {
        $admin = $this->usuarioConRol('admin');

        $res = $this->withHeaders($this->bearer($admin))
            ->postJson('/api/planes', [
                'nombre_plan'    => 'Plan Fibra 150',
                'velocidad_mbps' => 150,
                'precio_mensual' => 210.50,
                'descripcion'    => 'Plan de fibra simétrica.',
                'activo'         => true,
            ]);

        $res->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.plan.nombre_plan', 'Plan Fibra 150')
            ->assertJsonPath('data.plan.activo', true);

        $this->assertDatabaseHas('planes_internet', [
            'nombre_plan'    => 'Plan Fibra 150',
            'velocidad_mbps' => 150,
        ]);

        $this->assertDatabaseHas('bitacora_auditorias', [
            'modulo' => 'PLANES',
            'accion' => 'CREAR_PLAN',
        ]);
    }

    public function test_secretaria_puede_crear_y_consultar_plan(): void
    {
        $secretaria = $this->usuarioConRol('secretaria');
        $headers = $this->bearer($secretaria);

        // Sí puede consultar (lo necesita para CU17).
        $this->withHeaders($headers)->getJson('/api/planes')->assertStatus(200);

        // También puede gestionar el catálogo con planes.assign.
        $this->withHeaders($headers)->postJson('/api/planes', [
            'nombre_plan'    => 'Plan Secretaria Test',
            'velocidad_mbps' => 40,
            'precio_mensual' => 100,
        ])->assertStatus(201);
    }

    public function test_tecnico_no_puede_crear_plan(): void
    {
        $tecnico = $this->usuarioConRol('tecnico');

        $this->withHeaders($this->bearer($tecnico))
            ->postJson('/api/planes', [
                'nombre_plan'    => 'Plan Técnico',
                'velocidad_mbps' => 40,
                'precio_mensual' => 100,
            ])->assertStatus(403);
    }

    public function test_rechaza_precio_negativo_y_velocidad_invalida(): void
    {
        $admin = $this->usuarioConRol('admin');
        $headers = $this->bearer($admin);

        $this->withHeaders($headers)->postJson('/api/planes', [
            'nombre_plan'    => 'Plan Precio Negativo',
            'velocidad_mbps' => 50,
            'precio_mensual' => -1,
        ])->assertStatus(422)->assertJsonValidationErrors('precio_mensual');

        foreach ([0, -5] as $velocidad) {
            $this->withHeaders($headers)->postJson('/api/planes', [
                'nombre_plan'    => 'Plan Velocidad '.$velocidad,
                'velocidad_mbps' => $velocidad,
                'precio_mensual' => 100,
            ])->assertStatus(422)->assertJsonValidationErrors('velocidad_mbps');
        }

        // Velocidad no entera.
        $this->withHeaders($headers)->postJson('/api/planes', [
            'nombre_plan'    => 'Plan Velocidad Decimal',
            'velocidad_mbps' => 12.5,
            'precio_mensual' => 100,
        ])->assertStatus(422)->assertJsonValidationErrors('velocidad_mbps');
    }

    public function test_rechaza_plan_duplicado_mismo_nombre_y_velocidad(): void
    {
        $admin = $this->usuarioConRol('admin');
        $headers = $this->bearer($admin);

        $this->crearPlan(['nombre_plan' => 'Plan Repetido', 'velocidad_mbps' => 60]);

        $this->withHeaders($headers)->postJson('/api/planes', [
            'nombre_plan'    => 'Plan Repetido',
            'velocidad_mbps' => 60,
            'precio_mensual' => 120,
        ])->assertStatus(422)->assertJsonValidationErrors('nombre_plan');

        // La misma denominación con OTRA velocidad sí se admite (convención
        // del índice único del esquema).
        $this->withHeaders($headers)->postJson('/api/planes', [
            'nombre_plan'    => 'Plan Repetido',
            'velocidad_mbps' => 90,
            'precio_mensual' => 200,
        ])->assertStatus(201);
    }

    public function test_admin_edita_plan(): void
    {
        $admin = $this->usuarioConRol('admin');
        $plan = $this->crearPlan(['nombre_plan' => 'Plan Editable', 'velocidad_mbps' => 70, 'precio_mensual' => 150]);

        $this->withHeaders($this->bearer($admin))
            ->putJson("/api/planes/{$plan->id}", [
                'nombre_plan'    => 'Plan Editado',
                'velocidad_mbps' => 70,
                'precio_mensual' => 175.25,
                'descripcion'    => 'Actualizado',
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.plan.nombre_plan', 'Plan Editado')
            ->assertJsonPath('data.plan.precio_mensual', '175.25');

        $this->assertDatabaseHas('planes_internet', [
            'id'          => $plan->id,
            'nombre_plan' => 'Plan Editado',
        ]);
    }

    public function test_desactivar_plan_impide_nuevas_asignaciones_y_conserva_historial(): void
    {
        $admin = $this->usuarioConRol('admin');
        $headers = $this->bearer($admin);
        $servicio = $this->servicioSembrado();

        $plan = $this->crearPlan(['nombre_plan' => 'Plan A Desactivar', 'velocidad_mbps' => 45, 'precio_mensual' => 140]);

        // Se asigna mientras está activo.
        $this->withHeaders($headers)
            ->postJson("/api/cu08/servicios/{$servicio->id}/planes", ['plan_id' => $plan->id])
            ->assertStatus(201);

        // Se desactiva (no se borra).
        $this->withHeaders($headers)
            ->putJson("/api/planes/{$plan->id}/desactivar")
            ->assertStatus(200)
            ->assertJsonPath('data.plan.activo', false);

        // El plan sigue existiendo con todo su historial.
        $this->assertDatabaseHas('planes_internet', ['id' => $plan->id, 'activo' => false]);
        $this->assertDatabaseHas('asignaciones_plan', [
            'servicio_id' => $servicio->id,
            'plan_id'     => $plan->id,
            'fecha_fin'   => null,
        ]);

        // Ya no se puede asignar a otro servicio.
        $this->withHeaders($headers)
            ->postJson("/api/cu08/servicios/{$servicio->id}/planes", ['plan_id' => $plan->id])
            ->assertStatus(422)
            ->assertJsonValidationErrors('plan_id');

        // Se puede reactivar y volver a asignar.
        $this->withHeaders($headers)->putJson("/api/planes/{$plan->id}/activar")->assertStatus(200)
            ->assertJsonPath('data.plan.activo', true);
    }

    // ===============================================================
    // CU17 - Asignar/cambiar plan: seguridad e integridad
    // ===============================================================

    public function test_cu17_ignora_el_user_id_enviado_por_el_frontend(): void
    {
        $admin = $this->usuarioConRol('admin');
        $otro = $this->usuarioConRol('tecnico');
        $servicio = $this->servicioSembrado();
        $plan = $this->crearPlan();

        $this->withHeaders($this->bearer($admin))
            ->postJson("/api/cu08/servicios/{$servicio->id}/planes", [
                'plan_id'       => $plan->id,
                // Intento de suplantación: debe ignorarse.
                'user_id'       => $otro->id,
                'motivo_cambio' => 'Prueba de suplantación',
            ])
            ->assertStatus(201)
            ->assertJsonPath('data.asignacion.user_id', $admin->id);

        $this->assertDatabaseHas('asignaciones_plan', [
            'servicio_id' => $servicio->id,
            'plan_id'     => $plan->id,
            'user_id'     => $admin->id,
        ]);

        $this->assertDatabaseMissing('asignaciones_plan', [
            'servicio_id' => $servicio->id,
            'plan_id'     => $plan->id,
            'user_id'     => $otro->id,
        ]);
    }

    public function test_cu17_no_modifica_mensualidades_historicas_al_cambiar_plan(): void
    {
        $admin = $this->usuarioConRol('admin');
        $servicio = $this->servicioSembrado();

        $mensualidad = MensualidadFacturacion::create([
            'codigo_factura'    => 'FAC-PLAN-'.strtoupper(Str::random(5)),
            'cliente_id'        => $servicio->cliente_id,
            'servicio_id'       => $servicio->id,
            'periodo'           => '2026-07',
            'monto'             => 250.00,
            'fecha_emision'     => now()->toDateString(),
            'fecha_vencimiento' => now()->addDays(10)->toDateString(),
            'estado_pago'       => 'PENDIENTE',
        ]);

        $planNuevo = $this->crearPlan(['precio_mensual' => 999.99, 'velocidad_mbps' => 500]);

        $this->withHeaders($this->bearer($admin))
            ->postJson("/api/cu08/servicios/{$servicio->id}/planes", ['plan_id' => $planNuevo->id])
            ->assertStatus(201);

        // La mensualidad histórica conserva su monto original.
        $mensualidad->refresh();
        $this->assertSame('250.00', (string) $mensualidad->monto);
    }

    public function test_cu17_busca_servicios_por_codigo(): void
    {
        $admin = $this->usuarioConRol('admin');

        $res = $this->withHeaders($this->bearer($admin))
            ->getJson('/api/cu08/servicios?buscar=SRV-88201');

        $res->assertStatus(200);
        $this->assertGreaterThanOrEqual(1, count($res->json('data.data')));
    }

    public function test_cu16_busca_planes_por_nombre(): void
    {
        $admin = $this->usuarioConRol('admin');
        $this->crearPlan(['nombre_plan' => 'Plan Especial ZZTEST', 'velocidad_mbps' => 33]);

        $res = $this->withHeaders($this->bearer($admin))
            ->getJson('/api/planes?buscar=zztest');

        $res->assertStatus(200);
        $nombres = collect($res->json('data.planes'))->pluck('nombre_plan')->all();
        $this->assertContains('Plan Especial ZZTEST', $nombres);
    }
}
