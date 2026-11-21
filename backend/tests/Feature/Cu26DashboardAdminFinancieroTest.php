<?php

namespace Tests\Feature;

use App\Models\Paquetes\P1_SeguridadAdministracion\CU03_UsuariosRolesPermisos\Rol;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Cu26DashboardAdminFinancieroTest extends TestCase
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

    private function bearer(User $user): array
    {
        $token = $user->createToken('test-token')->plainTextToken;
        return [
            'Authorization' => "Bearer {$token}",
            'Accept'        => 'application/json',
        ];
    }

    public function test_usuario_no_autenticado_no_puede_consultar_dashboard(): void
    {
        $response = $this->getJson('/api/cu26/dashboard');
        $response->assertStatus(401);
    }

    public function test_administrador_puede_obtener_resumen_general_dashboard(): void
    {
        $admin = $this->usuarioConRol('admin');

        $response = $this->withHeaders($this->bearer($admin))->getJson('/api/cu26/dashboard');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'periodo_seleccionado',
                    'fecha_generacion',
                    'financiero' => [
                        'total_recaudado',
                        'cantidad_transacciones',
                        'recaudacion_hoy',
                        'cartera_vencida_mora',
                        'tasa_cobranza_porcentaje',
                        'moneda',
                    ],
                    'operativo' => [
                        'total_clientes',
                        'clientes_activos',
                        'total_servicios',
                        'servicios_activos',
                        'instalaciones_pendientes',
                    ],
                    'evolucion_mensual',
                    'metodos_pago',
                    'planes_distribucion',
                    'zonas_cobertura',
                    'alertas_morosidad',
                ],
            ]);
    }

    public function test_filtro_por_periodo_funciona_correctamente(): void
    {
        $admin = $this->usuarioConRol('admin');

        $response = $this->withHeaders($this->bearer($admin))->getJson('/api/cu26/dashboard?periodo=mes_anterior');
        $response->assertStatus(200)
            ->assertJsonPath('data.periodo_seleccionado', 'Mes Anterior');
    }

    public function test_consulta_alertas_morosidad_retorna_exito(): void
    {
        $admin = $this->usuarioConRol('admin');

        $response = $this->withHeaders($this->bearer($admin))->getJson('/api/cu26/dashboard/alertas');
        $response->assertStatus(200)
            ->assertJsonPath('success', true);
    }
}
