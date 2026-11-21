<?php

namespace Tests\Feature;

use App\Models\Paquetes\P1_SeguridadAdministracion\CU03_UsuariosRolesPermisos\Rol;
use App\Models\Paquetes\P3_ServiciosPlanes\CU08_RegistrarActivarServicio\EstadoServicio;
use App\Models\Paquetes\P3_ServiciosPlanes\CU08_RegistrarActivarServicio\ServicioInternet;
use App\Models\Paquetes\P3_ServiciosPlanes\CU14_RegistrarCorteRealizado\RegistroCorte;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CorteRegistroTest extends TestCase
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
        return ['Authorization' => 'Bearer ' . $user->createToken('corte-test')->plainTextToken];
    }

    public function test_admin_puede_listar_cortes_con_metricas_y_paginacion(): void
    {
        $admin = $this->usuarioConRol('admin');
        $headers = $this->bearer($admin);

        $res = $this->withHeaders($headers)->getJson('/api/cu14/cortes');

        $res->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'cortes' => [
                        'data',
                        'current_page',
                        'total',
                    ],
                    'metricas' => [
                        'total_cortes',
                        'cortes_logicos',
                        'cortes_fisicos',
                        'cortes_mes',
                    ],
                ],
            ]);
    }

    public function test_secretaria_puede_obtener_servicios_activos_para_corte(): void
    {
        $secretaria = $this->usuarioConRol('secretaria');
        $headers = $this->bearer($secretaria);

        $res = $this->withHeaders($headers)->getJson('/api/cu14/cortes/servicios-activos');

        $res->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'codigo_servicio',
                        'cliente_nombre',
                        'estado_servicio',
                    ],
                ],
            ]);
    }

    public function test_ejecutar_corte_logico_actualiza_servicio_y_crea_accion_corte(): void
    {
        $admin = $this->usuarioConRol('admin');
        $headers = $this->bearer($admin);
        $servicio = ServicioInternet::where('codigo_servicio', 'SRV-88201')->firstOrFail();

        $payload = [
            'servicio_id'   => $servicio->id,
            'tipo_corte'    => 'LOGICO',
            'motivo'        => 'Mora superior a 30 días',
            'observaciones' => 'Bloqueo ejecutado en interfaz VLAN 100',
        ];

        $res = $this->withHeaders($headers)->postJson('/api/cu14/cortes', $payload);

        $res->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.servicio.estado_servicio', 'CORTADO')
            ->assertJsonPath('data.corte.tipo_corte', 'LOGICO');

        $servicio->refresh();
        $this->assertSame('CORTADO', $servicio->estado_servicio);

        // Comprobar que show(id) devuelve los datos para el comprobante
        $corteId = $res->json('data.corte.id');
        $resShow = $this->withHeaders($headers)->getJson("/api/cu14/cortes/{$corteId}");
        $resShow->assertStatus(200)
            ->assertJsonPath('data.id', $corteId)
            ->assertJsonPath('data.codigo_servicio', $servicio->codigoServicio);
    }

    public function test_rechaza_cortar_servicio_ya_cortado(): void
    {
        $admin = $this->usuarioConRol('admin');
        $headers = $this->bearer($admin);
        $servicio = ServicioInternet::where('codigo_servicio', 'SRV-88201')->firstOrFail();

        // Primer corte exitoso
        $this->withHeaders($headers)->postJson('/api/cu14/cortes', [
            'servicio_id' => $servicio->id,
            'tipo_corte'  => 'FISICO',
            'motivo'      => 'Corte definitivo',
        ])->assertStatus(201);

        // Segundo intento sobre el mismo servicio ya cortado -> debe rechazar con 422
        $res = $this->withHeaders($headers)->postJson('/api/cu14/cortes', [
            'servicio_id' => $servicio->id,
            'tipo_corte'  => 'LOGICO',
            'motivo'      => 'Intento duplicado',
        ]);

        $res->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_tecnico_sin_permiso_recibe_403(): void
    {
        $tecnico = $this->usuarioConRol('tecnico');
        $headers = $this->bearer($tecnico);

        $this->withHeaders($headers)->getJson('/api/cu14/cortes')->assertStatus(403);
        $this->withHeaders($headers)->postJson('/api/cu14/cortes', [
            'servicio_id' => 1,
            'tipo_corte'  => 'LOGICO',
            'motivo'      => 'Sin permiso',
        ])->assertStatus(403);
    }
}
