<?php

namespace Tests\Feature;

use App\Models\Paquetes\GestionClientesZonas\CU05_RegistrarCliente\Cliente;
use App\Models\Paquetes\SeguridadAdministracion\CU03_UsuariosRolesPermisos\Rol;
use App\Models\Paquetes\ServiciosPlanes\CU22_ProgramacionInstalaciones\Instalacion;
use App\Models\Paquetes\ServiciosPlanes\CU22_ProgramacionInstalaciones\SolicitudInstalacion;
use App\Models\Paquetes\ServiciosPlanes\CU22_ProgramacionInstalaciones\Tecnico;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CU22_ProgramacionInstalacionesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);

        Tecnico::firstOrCreate(['idTecnico' => 1], [
            'nombreCompleto' => 'Téc. Marco Antonio Vaca',
            'telefono'       => '70011223',
            'especialidad'   => 'Fibra Óptica FTTH',
            'activo'         => true,
        ]);
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
            'Authorization' => 'Bearer '.$user->createToken('test-token')->plainTextToken,
        ];
    }

    private function crearCliente(string $ci = '1234567'): Cliente
    {
        return Cliente::create([
            'codigoCliente'     => 'CLI-TEST-' . uniqid(),
            'ci'                => $ci,
            'nombreCompleto'    => 'Juan Perez Prueba',
            'telefonoPrincipal' => '70012345',
            'correo'            => 'cliente_' . uniqid() . '@test.com',
            'direccion'         => 'Av. Test 100',
        ]);
    }

    public function test_cu22_index_retorna_solicitudes_y_tecnicos(): void
    {
        $admin = $this->usuarioConRol('admin');

        $response = $this->getJson('/api/cu22/instalaciones', $this->bearer($admin));

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'solicitudes',
                    'tecnicos',
                    'agenda',
                ],
            ]);
    }

    public function test_cu22_store_programa_instalacion_exitosamente(): void
    {
        $admin = $this->usuarioConRol('admin');
        $tecnico = Tecnico::firstOrFail();
        $cliente = $this->crearCliente('5588991');

        // Crear una solicitud pendiente
        $solicitud = SolicitudInstalacion::create([
            'numeroOrden'     => 'ORD-TEST-001',
            'fechaSolicitud'  => now()->toDateString(),
            'direccion'       => 'Calle Prueba 123',
            'referencia'      => 'Portón Blanco',
            'estadoSolicitud' => 'PENDIENTE',
            'observacion'     => 'Conexión nueva',
            'idCliente'       => $cliente->idCliente,
        ]);

        $payload = [
            'solicitud_id'      => $solicitud->id,
            'tecnico_id'        => $tecnico->id,
            'fecha_programada'  => now()->addDays(2)->toDateString(),
            'hora_programada'   => '10:30',
            'costo_instalacion' => 150.00,
            'observaciones'     => 'Llevar ONT Huawei',
        ];

        $response = $this->postJson('/api/cu22/instalaciones', $payload, $this->bearer($admin));

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'solicitud' => [
                        'estado_solicitud' => 'PROGRAMADA',
                    ],
                    'instalacion' => [
                        'estado_instalacion' => 'PROGRAMADA',
                    ],
                ],
            ]);

        $this->assertDatabaseHas('SolicitudInstalacion', [
            'idSolicitud'     => $solicitud->id,
            'estadoSolicitud' => 'PROGRAMADA',
        ]);

        $this->assertDatabaseHas('Instalacion', [
            'idSolicitud'       => $solicitud->id,
            'idTecnico'         => $tecnico->id,
            'estadoInstalacion' => 'PROGRAMADA',
        ]);
    }

    public function test_cu22_rechaza_cruce_de_horario_para_mismo_tecnico(): void
    {
        $admin = $this->usuarioConRol('admin');
        $tecnico = Tecnico::firstOrFail();
        $cliente1 = $this->crearCliente('1122334');
        $cliente2 = $this->crearCliente('9988776');
        $fecha = now()->addDays(3)->toDateString();

        $sol1 = SolicitudInstalacion::create([
            'numeroOrden'     => 'ORD-TEST-002',
            'fechaSolicitud'  => now()->toDateString(),
            'estadoSolicitud' => 'PENDIENTE',
            'idCliente'       => $cliente1->idCliente,
        ]);

        $sol2 = SolicitudInstalacion::create([
            'numeroOrden'     => 'ORD-TEST-003',
            'fechaSolicitud'  => now()->toDateString(),
            'estadoSolicitud' => 'PENDIENTE',
            'idCliente'       => $cliente2->idCliente,
        ]);

        // Programar primera instalación
        Instalacion::create([
            'idSolicitud'       => $sol1->id,
            'idTecnico'         => $tecnico->id,
            'fechaProgramada'   => $fecha,
            'horaProgramada'    => '14:00',
            'estadoInstalacion' => 'PROGRAMADA',
        ]);

        // Intentar programar segunda instalación con el mismo técnico, fecha y hora
        $payloadConflicto = [
            'solicitud_id'     => $sol2->id,
            'tecnico_id'       => $tecnico->id,
            'fecha_programada' => $fecha,
            'hora_programada'  => '14:00',
        ];

        $response = $this->postJson('/api/cu22/instalaciones', $payloadConflicto, $this->bearer($admin));

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);
    }
}
