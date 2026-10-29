<?php

namespace Tests\Feature;

use App\Models\Paquetes\EquiposInventario\CU19_AsignarEquipoComodato\AsignacionEquipo;
use App\Models\Paquetes\EquiposInventario\CU19_AsignarEquipoComodato\Equipo;
use App\Models\Paquetes\EquiposInventario\CU19_AsignarEquipoComodato\Inventario;
use App\Models\Paquetes\EquiposInventario\CU19_AsignarEquipoComodato\ProductoEquipo;
use App\Models\Paquetes\SeguridadAdministracion\CU02_BitacoraAuditoria\Bitacora;
use App\Models\Paquetes\SeguridadAdministracion\CU03_UsuariosRolesPermisos\Rol;
use App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio\ServicioInternet;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature Test para CU19 - Asignar equipo en comodato a un servicio.
 */
class Cu19AsignarEquipoComodatoTest extends TestCase
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
            'Authorization' => 'Bearer ' . $user->createToken('cu19-test')->plainTextToken,
        ];
    }

    public function test_sin_token_no_puede_consultar_ni_asignar(): void
    {
        $this->getJson('/api/cu19/equipos-disponibles')->assertStatus(401);
        $this->postJson('/api/cu19/servicios/1/asignar-equipo', [])->assertStatus(401);
    }

    public function test_usuario_sin_permiso_recibe_403(): void
    {
        // Crear un rol sin permisos
        $rolSinPermisos = Rol::create([
            'nombre' => 'Invitado',
            'slug'   => 'invitado',
            'activo' => true,
        ]);
        $usuario = User::factory()->create(['rol_id' => $rolSinPermisos->id, 'activo' => true]);

        $this->withHeaders($this->bearer($usuario))
            ->getJson('/api/cu19/equipos-disponibles')
            ->assertStatus(403);

        $this->withHeaders($this->bearer($usuario))
            ->postJson('/api/cu19/servicios/1/asignar-equipo', ['equipo_id' => 1])
            ->assertStatus(403);
    }

    public function test_consulta_equipos_disponibles_filtra_por_tipo(): void
    {
        $admin = $this->usuarioConRol('admin');

        $response = $this->withHeaders($this->bearer($admin))
            ->getJson('/api/cu19/equipos-disponibles?tipo_equipo=ONU')
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $equipos = $response->json('data.equipos');
        $this->assertIsArray($equipos);
    }

    public function test_rechaza_asignacion_si_servicio_no_existe_o_esta_suspendido(): void
    {
        $admin = $this->usuarioConRol('admin');

        // Servicio inexistente
        $this->withHeaders($this->bearer($admin))
            ->postJson('/api/cu19/servicios/999999/asignar-equipo', ['numero_serie' => 'SN-HW-2026-0021'])
            ->assertStatus(422)
            ->assertJsonFragment(['success' => false]);

        // Crear o modificar un servicio a estado suspendido
        $servicio = ServicioInternet::first();
        if ($servicio) {
            $servicio->estado_servicio = 'SUSPENDIDO';
            $servicio->save();

            $this->withHeaders($this->bearer($admin))
                ->postJson("/api/cu19/servicios/{$servicio->idServicio}/asignar-equipo", ['numero_serie' => 'SN-HW-2026-0021'])
                ->assertStatus(422)
                ->assertJsonPath('success', false);
        }
    }

    public function test_rechaza_asignacion_si_equipo_ya_esta_asignado_o_inactivo(): void
    {
        $admin = $this->usuarioConRol('admin');
        $servicioActivo = ServicioInternet::first();
        $servicioActivo->estado_servicio = 'ACTIVO';
        $servicioActivo->save();

        // Equipo 1 ya fue asignado en el Seeder
        $equipoAsignado = Equipo::where('asignada', true)->first();

        $this->withHeaders($this->bearer($admin))
            ->postJson("/api/cu19/servicios/{$servicioActivo->idServicio}/asignar-equipo", [
                'equipo_id' => $equipoAsignado->idEquipo,
            ])
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_asignacion_exitosa_en_comodato_con_transaccion_e_inventario(): void
    {
        $admin = $this->usuarioConRol('admin');

        // Buscar o crear un equipo disponible
        $producto = ProductoEquipo::firstOrCreate(
            ['nombre' => 'ONT Huawei EchoLife HG8145V5'],
            ['tipoEquipo' => 'ONU', 'marca' => 'Huawei', 'modelo' => 'HG8145V5', 'estado' => 'DISPONIBLE']
        );

        $inventario = Inventario::firstOrCreate(
            ['idProducto' => $producto->idProducto],
            ['stockActual' => 10, 'fechaActualizacion' => now()]
        );
        $stockInicial = $inventario->stockActual;

        $equipoDisponible = Equipo::create([
            'numeroSerie'  => 'SN-TEST-CU19-001',
            'mac'          => 'BC:5F:F4:99:99:01',
            'ip'           => '10.20.10.250',
            'asignada'     => false,
            'propiedad'    => 'TELCOM_COMODATO',
            'estadoEquipo' => 'DISPONIBLE',
            'idProducto'   => $producto->idProducto,
        ]);

        $servicioActivo = ServicioInternet::first();
        $servicioActivo->estado_servicio = 'ACTIVO';
        $servicioActivo->save();

        $response = $this->withHeaders($this->bearer($admin))
            ->postJson("/api/cu19/servicios/{$servicioActivo->idServicio}/asignar-equipo", [
                'equipo_id'          => $equipoDisponible->idEquipo,
                'fecha_asignacion'   => now()->toDateString(),
                'reemplazar_vigente' => true,
            ])
            ->assertStatus(201)
            ->assertJsonPath('success', true);

        // Verificar cambio en Equipo
        $equipoDisponible->refresh();
        $this->assertTrue($equipoDisponible->asignada);
        $this->assertEquals('ASIGNADO', $equipoDisponible->estadoEquipo);

        // Verificar creación en AsignacionEquipo
        $this->assertDatabaseHas('AsignacionEquipo', [
            'idEquipo'   => $equipoDisponible->idEquipo,
            'idServicio' => $servicioActivo->idServicio,
            'fechaRetiro' => null,
        ]);

        // Verificar decremento en inventario
        $inventario->refresh();
        $this->assertEquals($stockInicial - 1, $inventario->stockActual);

        // Verificar registro en Bitácora
        $this->assertDatabaseHas('Bitacora', [
            'modulo' => 'CU19',
            'accion' => 'ASIGNAR_EQUIPO_COMODATO',
        ]);
    }

    public function test_secretaria_y_tecnico_pueden_asignar_equipos_en_comodato(): void
    {
        $secretaria = $this->usuarioConRol('secretaria');
        $tecnico = $this->usuarioConRol('tecnico');

        // Ambos pueden consultar equipos disponibles
        $this->withHeaders($this->bearer($secretaria))
            ->getJson('/api/cu19/equipos-disponibles')
            ->assertStatus(200);

        $this->withHeaders($this->bearer($tecnico))
            ->getJson('/api/cu19/equipos-disponibles')
            ->assertStatus(200);
    }
}
