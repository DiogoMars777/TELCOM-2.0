<?php

namespace Tests\Feature;

use App\Models\Paquetes\P2_GestionClientesZonas\CU04_ZonasCobertura\Zona;
use App\Models\Paquetes\P2_GestionClientesZonas\CU05_RegistrarCliente\Cliente;
use App\Models\Paquetes\P6_InstalacionesTecnicas\CU21_RegistrarSolicitudInstalacion\SolicitudInstalacion;
use App\Models\Paquetes\P1_SeguridadAdministracion\CU03_UsuariosRolesPermisos\Rol;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CU21_RegistroSolicitudInstalacionTest extends TestCase
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
            'Authorization' => 'Bearer ' . $user->createToken('test-token')->plainTextToken,
        ];
    }

    private function crearCliente(string $ci = '9876543'): Cliente
    {
        $zona = Zona::first() ?? Zona::create([
            'nombreZona'      => 'Zona Central',
            'estado'          => true,
            'estadoCobertura' => 'Disponible',
        ]);

        return Cliente::create([
            'codigoCliente'       => 'CLI-T-' . uniqid(),
            'ci'                  => $ci,
            'nombreCompleto'      => 'Cliente Test Solicitud',
            'telefonoPrincipal'   => '71234567',
            'correo'              => 'test_' . uniqid() . '@telcom.com.bo',
            'direccion'           => 'Av. Santos Dumont #450',
            'referenciaUbicacion' => 'Portón azul dos cuadras antes del 4to anillo',
            'estadoCliente'       => 'ACTIVO',
            'idZona'              => $zona->idZona,
        ]);
    }

    public function test_cu21_index_requiere_autenticacion(): void
    {
        $response = $this->getJson('/api/cu21/solicitudes');
        $response->assertStatus(401);
    }

    public function test_cu21_index_retorna_solicitudes_con_permiso(): void
    {
        $admin = $this->usuarioConRol('admin');

        $response = $this->getJson('/api/cu21/solicitudes', $this->bearer($admin));

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'data',
                    'total',
                ],
            ]);
    }

    public function test_cu21_bloquea_usuario_sin_permiso(): void
    {
        // Crear un usuario sin el permiso de instalaciones
        $usuarioSinPermiso = User::factory()->create(['activo' => true]);

        $response = $this->getJson('/api/cu21/solicitudes', $this->bearer($usuarioSinPermiso));
        $response->assertStatus(403);
    }

    public function test_cu21_store_interno_registra_solicitud_correctamente(): void
    {
        $admin = $this->usuarioConRol('admin');
        $cliente = $this->crearCliente('77112233');

        $payload = [
            'cliente_id'    => $cliente->idCliente,
            'direccion'     => 'Barrio Luján, Calle 3 #120',
            'referencia'    => 'Casa de dos pisos, frente a la farmacia',
            'latitud'       => -17.7833000,
            'longitud'      => -63.1821000,
            'plan_sugerido' => 'Plan Fibra 50 Mbps',
            'observacion'   => 'Requiere acometida de 80 metros de fibra drop.',
        ];

        $response = $this->postJson('/api/cu21/solicitudes', $payload, $this->bearer($admin));

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data'    => [
                    'estado_solicitud' => 'PENDIENTE',
                    'direccion'        => 'Barrio Luján, Calle 3 #120',
                ],
            ]);

        $this->assertDatabaseHas('SolicitudInstalacion', [
            'idCliente'       => $cliente->idCliente,
            'direccion'       => 'Barrio Luján, Calle 3 #120',
            'estadoSolicitud' => 'PENDIENTE',
        ]);

        $this->assertDatabaseHas('Bitacora', [
            'modulo' => 'CU21',
            'accion' => 'REGISTRAR_SOLICITUD_INSTALACION',
        ]);
    }

    public function test_cu21_store_valida_campos_obligatorios(): void
    {
        $admin = $this->usuarioConRol('admin');

        $response = $this->postJson('/api/cu21/solicitudes', [], $this->bearer($admin));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['cliente_id', 'direccion']);
    }

    public function test_cu21_store_rechaza_zona_saturada(): void
    {
        $admin = $this->usuarioConRol('admin');
        $cliente = $this->crearCliente('33445566');

        // Crear zona saturada
        $zonaSaturada = Zona::create([
            'nombreZona'      => 'Zona Saturada Test',
            'estado'          => true,
            'estadoCobertura' => 'Saturada',
        ]);

        $payload = [
            'cliente_id' => $cliente->idCliente,
            'direccion'  => 'Calle Sin Salida #99',
            'zona_id'    => $zonaSaturada->idZona,
        ];

        $response = $this->postJson('/api/cu21/solicitudes', $payload, $this->bearer($admin));

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);
    }

    public function test_cu21_store_publica_desde_portal_web_crea_cliente_y_solicitud(): void
    {
        $zona = Zona::firstOrCreate(
            ['nombreZona' => 'Paitití Test'],
            ['estado' => true, 'estadoCobertura' => 'Disponible']
        );

        $payloadWeb = [
            'nombres'       => 'Valeria Montaño Roca',
            'ci'            => '88990011',
            'telefono'      => '77099881',
            'email'         => 'valeria.montano@gmail.com',
            'direccion'     => 'Condominio Sevilla Real, Manzano 4, Casa 12',
            'referencia'    => 'Entrando por la garita principal',
            'zona_id'       => $zona->idZona,
            'latitud'       => -17.7500000,
            'longitud'      => -63.1500000,
            'plan_sugerido' => 'Plan Hogar Gamer 100 Mbps',
            'observacion'   => 'Trabajo desde casa, requiero instalación rápida.',
        ];

        $response = $this->postJson('/api/cu21/solicitudes/publica', $payloadWeb);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseHas('Cliente', [
            'ci'             => '88990011',
            'nombreCompleto' => 'Valeria Montaño Roca',
        ]);

        $this->assertDatabaseHas('SolicitudInstalacion', [
            'estadoSolicitud' => 'PENDIENTE',
            'direccion'       => 'Condominio Sevilla Real, Manzano 4, Casa 12',
        ]);
    }

    public function test_cu21_cancelar_solicitud_pendiente(): void
    {
        $admin = $this->usuarioConRol('admin');
        $cliente = $this->crearCliente('66554433');

        $solicitud = SolicitudInstalacion::create([
            'numeroOrden'     => 'ORD-2026-99999',
            'fechaSolicitud'  => now()->toDateString(),
            'direccion'       => 'Calle de Prueba #55',
            'estadoSolicitud' => 'PENDIENTE',
            'idCliente'       => $cliente->idCliente,
        ]);

        $response = $this->putJson("/api/cu21/solicitudes/{$solicitud->idSolicitud}/cancelar", [
            'motivo' => 'Cliente desiste por traslado de domicilio.',
        ], $this->bearer($admin));

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseHas('SolicitudInstalacion', [
            'idSolicitud'     => $solicitud->idSolicitud,
            'estadoSolicitud' => 'CANCELADA',
        ]);
    }
}
