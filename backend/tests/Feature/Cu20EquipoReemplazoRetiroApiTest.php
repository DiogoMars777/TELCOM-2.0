<?php

namespace Tests\Feature;

use App\Models\Paquetes\EquiposProveedoresInventario\CU18_RegistrarCatalogoUnidadesEquipos\Equipo;
use App\Models\Paquetes\EquiposProveedoresInventario\CU18_RegistrarCatalogoUnidadesEquipos\ProductoEquipo;
use App\Models\Paquetes\EquiposProveedoresInventario\CU19_AsignarEquipoComodato\AsignacionEquipo;
use App\Models\Paquetes\SeguridadAdministracion\CU02_BitacoraAuditoria\Bitacora;
use App\Models\Paquetes\SeguridadAdministracion\CU03_UsuariosRolesPermisos\Rol;
use App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio\ServicioInternet;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use PHPUnit\Framework\Attributes\DataProvider;
use RuntimeException;
use Tests\TestCase;

class Cu20EquipoReemplazoRetiroApiTest extends TestCase
{
    use RefreshDatabase;

    private ServicioInternet $servicio;
    private ProductoEquipo $producto;
    private Equipo $anterior;
    private Equipo $nuevo;
    private AsignacionEquipo $asignacion;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DatabaseSeeder::class);
        $this->travelTo(Carbon::parse('2026-10-25 14:30:00', config('app.timezone')));

        $this->servicio = ServicioInternet::firstOrFail();
        $this->producto = ProductoEquipo::create([
            'nombre' => 'ONT de prueba CU20',
            'tipoEquipo' => 'ONU/ONT',
            'marca' => 'Huawei',
            'modelo' => 'HG8145V5',
            'estado' => 'DISPONIBLE',
        ]);
        DB::table('Inventario')->insert([
            'idProducto' => $this->producto->idProducto,
            'stockActual' => 20,
            'fechaActualizacion' => '2026-01-01 10:00:00',
        ]);

        $this->anterior = $this->crearEquipo([
            'numeroSerie' => 'CU20-ANTERIOR',
            'ip' => '10.20.0.1',
            'mac' => 'AA:BB:CC:DD:EE:01',
            'asignada' => true,
        ]);
        $this->nuevo = $this->crearEquipo([
            'numeroSerie' => 'CU20-NUEVO',
            'ip' => '10.20.0.2',
            'mac' => 'AA:BB:CC:DD:EE:02',
        ]);
        $this->asignacion = AsignacionEquipo::create([
            'fechaAsignacion' => '2026-01-05',
            'fechaRetiro' => null,
            'motivoRetiro' => null,
            'idEquipo' => $this->anterior->idEquipo,
            'idServicio' => $this->servicio->idServicio,
        ]);
        $this->servicio->update([
            'ipAsignada' => $this->anterior->ip,
            'macRouter' => $this->anterior->mac,
        ]);
    }

    private function crearEquipo(array $attributes = []): Equipo
    {
        return Equipo::create(array_merge([
            'asignada' => false,
            'propiedad' => 'TELCOM_COMODATO',
            'estadoEquipo' => 'OPERATIVO',
            'idProducto' => $this->producto->idProducto,
        ], $attributes));
    }

    private function autenticar(string $slug = 'admin'): User
    {
        $rol = Rol::where('slug', $slug)->firstOrFail();
        $user = User::factory()->create(['rol_id' => $rol->id, 'activo' => true]);
        $this->withToken($user->createToken('cu20-test')->plainTextToken);

        return $user;
    }

    private function url(string $accion = ''): string
    {
        return "/api/cu20/servicios/{$this->servicio->idServicio}/equipo".($accion ? "/{$accion}" : '');
    }

    private function estadoPersistido(): array
    {
        $estado = [];
        foreach ([
            'ServicioInternet' => 'idServicio',
            'Equipo' => 'idEquipo',
            'AsignacionEquipo' => 'idAsignacionEquipo',
            'Inventario' => 'idInventario',
            'Bitacora' => 'idBitacora',
        ] as $tabla => $id) {
            $estado[$tabla] = DB::table($tabla)->orderBy($id)->get()
                ->map(fn ($row) => (array) $row)->all();
        }

        return $estado;
    }

    public function test_consulta_equipo_activo_producto_e_historial_solo_del_servicio(): void
    {
        $this->autenticar();
        $historico = $this->crearEquipo(['numeroSerie' => 'CU20-HISTORICO']);
        $asignacionHistorica = AsignacionEquipo::create([
            'fechaAsignacion' => '2025-06-01',
            'fechaRetiro' => '2026-01-05',
            'motivoRetiro' => 'Cambio anterior',
            'idEquipo' => $historico->idEquipo,
            'idServicio' => $this->servicio->idServicio,
        ]);
        $otroServicio = ServicioInternet::create(['codigoServicio' => 'CU20-OTRO']);
        AsignacionEquipo::create([
            'fechaAsignacion' => '2025-01-01',
            'fechaRetiro' => '2025-02-01',
            'idEquipo' => $historico->idEquipo,
            'idServicio' => $otroServicio->idServicio,
        ]);
        $estado = $this->estadoPersistido();

        $this->getJson($this->url())->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.servicio.idServicio', $this->servicio->idServicio)
            ->assertJsonPath('data.asignacion_activa.idAsignacionEquipo', $this->asignacion->idAsignacionEquipo)
            ->assertJsonPath('data.equipo_actual.idEquipo', $this->anterior->idEquipo)
            ->assertJsonPath('data.equipo_actual.producto.nombre', $this->producto->nombre)
            ->assertJsonCount(1, 'data.historial')
            ->assertJsonPath('data.historial.0.idAsignacionEquipo', $asignacionHistorica->idAsignacionEquipo)
            ->assertJsonPath('data.historial.0.equipo.producto.modelo', 'HG8145V5');

        $this->assertSame($estado, $this->estadoPersistido());
        $this->assertTrue($this->producto->equipos->contains($this->anterior));
        $this->assertTrue($this->anterior->asignaciones->contains($this->asignacion));
        $this->assertTrue($this->asignacion->servicio->is($this->servicio));
    }

    public function test_consulta_sin_equipo_activo_conserva_el_historial(): void
    {
        $this->autenticar();
        $this->asignacion->update(['fechaRetiro' => '2026-10-24', 'motivoRetiro' => 'Retiro previo']);
        $this->anterior->update(['asignada' => false]);

        $this->getJson($this->url())->assertOk()
            ->assertJsonPath('data.asignacion_activa', null)
            ->assertJsonPath('data.equipo_actual', null)
            ->assertJsonCount(1, 'data.historial');
    }

    public function test_disponibles_excluye_unidades_asignadas_y_no_operativas(): void
    {
        $this->autenticar();
        $this->crearEquipo(['numeroSerie' => 'CU20-SIN-ESTADO', 'estadoEquipo' => null]);
        $estado = $this->estadoPersistido();

        $this->getJson('/api/cu20/equipos/disponibles')->assertOk()
            ->assertJsonCount(1, 'data.equipos')
            ->assertJsonPath('data.equipos.0.idEquipo', $this->nuevo->idEquipo)
            ->assertJsonPath('data.equipos.0.asignada', false)
            ->assertJsonPath('data.equipos.0.producto.nombre', $this->producto->nombre)
            ->assertJsonPath('data.equipos.0.producto.marca', 'Huawei')
            ->assertJsonPath('data.equipos.0.producto.modelo', 'HG8145V5');

        $this->assertSame($estado, $this->estadoPersistido());
    }

    public static function actores(): array
    {
        return [['admin'], ['secretaria'], ['tecnico']];
    }

    #[DataProvider('actores')]
    public function test_reemplazo_exitoso_conserva_historial_y_audita_por_actor(string $actor): void
    {
        $usuario = $this->autenticar($actor);
        $inventario = DB::table('Inventario')->first();
        $planes = DB::table('AsignacionPlan')->get()->toArray();

        $response = $this->postJson($this->url('reemplazar'), [
            'equipo_nuevo_id' => $this->nuevo->idEquipo,
            'motivo' => 'Reemplazo solicitado por el cliente',
            'fechaRetiro' => '1999-01-01',
            'fechaAsignacion' => '2099-01-01',
            'fecha_retiro' => '1999-01-01',
            'fecha_asignacion' => '2099-01-01',
        ])->assertOk()->assertJsonPath('success', true)
            ->assertJsonPath('data.servicio.ipAsignada', $this->nuevo->ip)
            ->assertJsonPath('data.servicio.macRouter', $this->nuevo->mac)
            ->assertJsonPath('data.asignacion_anterior.fechaRetiro', '2026-10-25')
            ->assertJsonPath('data.asignacion_nueva.fechaAsignacion', '2026-10-25')
            ->assertJsonPath('data.asignacion_nueva.equipo.producto.marca', 'Huawei');

        $this->assertDatabaseCount('AsignacionEquipo', 2);
        $this->assertDatabaseHas('AsignacionEquipo', [
            'idAsignacionEquipo' => $this->asignacion->idAsignacionEquipo,
            'fechaAsignacion' => '2026-01-05',
            'fechaRetiro' => '2026-10-25',
            'motivoRetiro' => 'Reemplazo solicitado por el cliente',
            'idEquipo' => $this->anterior->idEquipo,
        ]);
        $this->assertDatabaseHas('AsignacionEquipo', [
            'idAsignacionEquipo' => $response->json('data.asignacion_nueva.idAsignacionEquipo'),
            'fechaAsignacion' => '2026-10-25',
            'fechaRetiro' => null,
            'motivoRetiro' => null,
            'idEquipo' => $this->nuevo->idEquipo,
            'idServicio' => $this->servicio->idServicio,
        ]);
        $this->assertFalse($this->anterior->fresh()->asignada);
        $this->assertTrue($this->nuevo->fresh()->asignada);
        $this->assertSame('OPERATIVO', $this->anterior->fresh()->estadoEquipo);
        $this->assertSame('TELCOM_COMODATO', $this->anterior->fresh()->propiedad);
        $this->assertSame(1, AsignacionEquipo::where('idServicio', $this->servicio->idServicio)->whereNull('fechaRetiro')->count());
        $this->assertEquals($inventario, DB::table('Inventario')->first());
        $this->assertEquals($planes, DB::table('AsignacionPlan')->get()->toArray());

        $auditoria = Bitacora::where('modulo', 'CU20')->sole();
        $this->assertSame('REEMPLAZAR_EQUIPO', $auditoria->accion);
        $this->assertSame($usuario->id, $auditoria->idUsuario);
        $this->assertSame($this->anterior->ip, $auditoria->datosPrevios['servicio']['ipAsignada']);
        $this->assertSame($this->asignacion->idAsignacionEquipo, $auditoria->datosPrevios['asignacion_anterior']['idAsignacionEquipo']);
        $this->assertNull($auditoria->datosPrevios['asignacion_anterior']['fechaRetiro']);
        $this->assertTrue((bool) $auditoria->datosPrevios['equipo_anterior']['asignada']);
        $this->assertSame($this->nuevo->idEquipo, $auditoria->datosNuevos['equipo_nuevo']['idEquipo']);
        $this->assertSame($response->json('data.asignacion_nueva.idAsignacionEquipo'), $auditoria->datosNuevos['asignacion_nueva']['idAsignacionEquipo']);
        $this->assertSame($this->nuevo->ip, $auditoria->datosNuevos['servicio']['ipAsignada']);
    }

    #[DataProvider('actores')]
    public function test_retiro_exitoso_conserva_historial_limpia_snapshot_y_audita_por_actor(string $actor): void
    {
        $usuario = $this->autenticar($actor);
        $inventario = DB::table('Inventario')->first();
        $planes = DB::table('AsignacionPlan')->get()->toArray();

        $this->postJson($this->url('retirar'), [
            'motivo' => 'Retiro solicitado por el cliente',
            'fechaRetiro' => '1999-01-01',
            'fecha_retiro' => '1999-01-01',
        ])->assertOk()->assertJsonPath('success', true)
            ->assertJsonPath('data.servicio.ipAsignada', null)
            ->assertJsonPath('data.servicio.macRouter', null)
            ->assertJsonPath('data.asignacion_retirada.fechaRetiro', '2026-10-25')
            ->assertJsonPath('data.equipo_retirado.asignada', false);

        $this->assertDatabaseCount('AsignacionEquipo', 1);
        $this->assertDatabaseCount('Equipo', 2);
        $this->assertDatabaseHas('AsignacionEquipo', [
            'idAsignacionEquipo' => $this->asignacion->idAsignacionEquipo,
            'fechaAsignacion' => '2026-01-05',
            'fechaRetiro' => '2026-10-25',
            'motivoRetiro' => 'Retiro solicitado por el cliente',
        ]);
        $this->assertDatabaseHas('ServicioInternet', [
            'idServicio' => $this->servicio->idServicio,
            'ipAsignada' => null,
            'macRouter' => null,
        ]);
        $this->assertFalse($this->anterior->fresh()->asignada);
        $this->assertSame('OPERATIVO', $this->anterior->fresh()->estadoEquipo);
        $this->assertSame('TELCOM_COMODATO', $this->anterior->fresh()->propiedad);
        $this->assertSame(0, AsignacionEquipo::where('idServicio', $this->servicio->idServicio)->whereNull('fechaRetiro')->count());
        $this->assertEquals($inventario, DB::table('Inventario')->first());
        $this->assertEquals($planes, DB::table('AsignacionPlan')->get()->toArray());

        $auditoria = Bitacora::where('modulo', 'CU20')->sole();
        $this->assertSame('RETIRAR_EQUIPO', $auditoria->accion);
        $this->assertSame($usuario->id, $auditoria->idUsuario);
        $this->assertSame($this->anterior->ip, $auditoria->datosPrevios['servicio']['ipAsignada']);
        $this->assertNull($auditoria->datosPrevios['asignacion']['fechaRetiro']);
        $this->assertTrue((bool) $auditoria->datosPrevios['equipo']['asignada']);
        $this->assertNull($auditoria->datosNuevos['servicio']['ipAsignada']);
        $this->assertNull($auditoria->datosNuevos['servicio']['macRouter']);
        $this->assertSame('2026-10-25', $auditoria->datosNuevos['asignacion']['fechaRetiro']);
        $this->assertFalse((bool) $auditoria->datosNuevos['equipo']['asignada']);

        $this->getJson($this->url())->assertOk()
            ->assertJsonPath('data.asignacion_activa', null)
            ->assertJsonPath('data.equipo_actual', null)
            ->assertJsonCount(1, 'data.historial');
    }

    public static function operaciones(): array
    {
        return [['reemplazar'], ['retirar']];
    }

    #[DataProvider('operaciones')]
    public function test_rechaza_operacion_sin_asignacion_activa_sin_alterar_historial(string $accion): void
    {
        $this->autenticar();
        $this->asignacion->update(['fechaRetiro' => '2026-10-24', 'motivoRetiro' => 'Retiro previo']);
        $this->anterior->update(['asignada' => false]);
        $estado = $this->estadoPersistido();

        $this->postJson($this->url($accion), [
            'equipo_nuevo_id' => $this->nuevo->idEquipo,
            'motivo' => 'Solicitud repetida',
        ])->assertUnprocessable()->assertJsonPath('success', false)
            ->assertJsonPath('message', 'El servicio no posee un equipo activo asignado.');

        $this->assertSame($estado, $this->estadoPersistido());
    }

    public function test_rechaza_equipo_ya_asignado(): void
    {
        $this->autenticar();
        $otroServicio = ServicioInternet::create(['codigoServicio' => 'CU20-OTRO']);
        $this->nuevo->update(['asignada' => true]);
        AsignacionEquipo::create([
            'idEquipo' => $this->nuevo->idEquipo,
            'idServicio' => $otroServicio->idServicio,
            'fechaAsignacion' => '2026-01-05',
        ]);
        $estado = $this->estadoPersistido();

        $this->postJson($this->url('reemplazar'), [
            'equipo_nuevo_id' => $this->nuevo->idEquipo,
            'motivo' => 'Intento con equipo ocupado',
        ])->assertUnprocessable()->assertJsonPath('success', false);

        $this->assertSame($estado, $this->estadoPersistido());
    }

    public function test_rechaza_equipo_no_operativo(): void
    {
        $this->autenticar();
        $this->nuevo->update(['estadoEquipo' => null]);
        $estado = $this->estadoPersistido();

        $this->postJson($this->url('reemplazar'), [
            'equipo_nuevo_id' => $this->nuevo->idEquipo,
            'motivo' => 'Intento con equipo sin condición operativa',
        ])->assertUnprocessable()->assertJsonPath('success', false);

        $this->assertSame($estado, $this->estadoPersistido());
    }

    public function test_rechaza_el_mismo_equipo_como_reemplazo(): void
    {
        $this->autenticar();
        $estado = $this->estadoPersistido();

        $this->postJson($this->url('reemplazar'), [
            'equipo_nuevo_id' => $this->anterior->idEquipo,
            'motivo' => 'Intento con el equipo actual',
        ])->assertUnprocessable()
            ->assertJsonPath('message', 'El equipo de reemplazo debe ser distinto del equipo actual.');

        $this->assertSame($estado, $this->estadoPersistido());
    }

    public function test_rechaza_equipo_inexistente(): void
    {
        $this->autenticar();
        $estado = $this->estadoPersistido();

        $this->postJson($this->url('reemplazar'), [
            'equipo_nuevo_id' => 999999,
            'motivo' => 'Intento con unidad inexistente',
        ])->assertUnprocessable()->assertJsonPath('success', false);

        $this->assertSame($estado, $this->estadoPersistido());
    }

    public static function motivosInvalidos(): array
    {
        return [
            'reemplazar sin motivo' => ['reemplazar', null],
            'retirar sin motivo' => ['retirar', null],
            'reemplazar motivo vacío' => ['reemplazar', '   '],
            'retirar motivo vacío' => ['retirar', '   '],
            'reemplazar motivo no textual' => ['reemplazar', 123],
            'retirar motivo no textual' => ['retirar', 123],
            'reemplazar motivo largo' => ['reemplazar', str_repeat('a', 1001)],
            'retirar motivo largo' => ['retirar', str_repeat('a', 1001)],
        ];
    }

    #[DataProvider('motivosInvalidos')]
    public function test_valida_motivo_sin_modificar_registros(string $accion, mixed $motivo): void
    {
        $this->autenticar();
        $estado = $this->estadoPersistido();
        $payload = ['equipo_nuevo_id' => $this->nuevo->idEquipo];
        if ($motivo !== null) {
            $payload['motivo'] = $motivo;
        }

        $this->postJson($this->url($accion), $payload)
            ->assertUnprocessable()->assertJsonValidationErrors('motivo');

        $this->assertSame($estado, $this->estadoPersistido());
    }

    public static function idsInvalidos(): array
    {
        return [[null], ['no-es-un-id'], [1.5]];
    }

    #[DataProvider('idsInvalidos')]
    public function test_valida_identificador_del_equipo(mixed $id): void
    {
        $this->autenticar();
        $estado = $this->estadoPersistido();

        $this->postJson($this->url('reemplazar'), ['equipo_nuevo_id' => $id, 'motivo' => 'Cambio'])
            ->assertUnprocessable()->assertJsonValidationErrors('equipo_nuevo_id');

        $this->assertSame($estado, $this->estadoPersistido());
    }

    public function test_todas_las_rutas_exigen_autenticacion(): void
    {
        $this->getJson($this->url())->assertUnauthorized();
        $this->getJson('/api/cu20/equipos/disponibles')->assertUnauthorized();
        $this->postJson($this->url('reemplazar'))->assertUnauthorized();
        $this->postJson($this->url('retirar'))->assertUnauthorized();
    }

    public function test_usuario_sin_rol_no_puede_consultar_ni_operar(): void
    {
        $user = User::factory()->create(['rol_id' => null, 'activo' => true]);
        $this->withToken($user->createToken('cu20-sin-permisos')->plainTextToken);
        $estado = $this->estadoPersistido();

        $this->getJson($this->url())->assertForbidden();
        $this->getJson('/api/cu20/equipos/disponibles')->assertForbidden();
        $this->postJson($this->url('reemplazar'))->assertForbidden();
        $this->postJson($this->url('retirar'))->assertForbidden();

        $this->assertSame($estado, $this->estadoPersistido());
    }

    public function test_permiso_de_consulta_no_autoriza_reemplazo_ni_retiro(): void
    {
        // Rol aislado de pruebas: reutiliza el permiso existente sin alterar los roles del seeder.
        $rol = Rol::create(['nombre' => 'Consulta CU20', 'slug' => 'consulta-cu20', 'activo' => true]);
        $permisoId = DB::table('Permiso')->where('slug', 'equipos.view')->value('idPermiso');
        $rol->permisos()->attach($permisoId);
        $this->autenticar('consulta-cu20');
        $estado = $this->estadoPersistido();

        $this->getJson($this->url())->assertOk();
        $this->getJson('/api/cu20/equipos/disponibles')->assertOk();
        $this->postJson($this->url('reemplazar'))->assertForbidden();
        $this->postJson($this->url('retirar'))->assertForbidden();

        $this->assertSame($estado, $this->estadoPersistido());
    }

    #[DataProvider('operaciones')]
    public function test_transaccion_revierte_todo_si_falla_el_guardado_del_servicio(string $accion): void
    {
        $this->autenticar();
        $estado = $this->estadoPersistido();
        $evento = 'eloquent.updated: '.ServicioInternet::class;
        Event::listen($evento, function () {
            throw new RuntimeException('Fallo simulado al guardar el snapshot');
        });
        $this->withoutExceptionHandling();

        try {
            $this->postJson($this->url($accion), [
                'equipo_nuevo_id' => $this->nuevo->idEquipo,
                'motivo' => 'Prueba de atomicidad',
            ]);
            $this->fail('La operación debía fallar y revertir la transacción.');
        } catch (RuntimeException $e) {
            $this->assertSame('Fallo simulado al guardar el snapshot', $e->getMessage());
        } finally {
            Event::forget($evento);
        }

        $this->assertSame($estado, $this->estadoPersistido());
    }

    public function test_un_equipo_reemplazado_no_puede_asignarse_a_otro_servicio(): void
    {
        $this->autenticar();
        $otroServicio = ServicioInternet::create(['codigoServicio' => 'CU20-OTRO']);
        $otroEquipo = $this->crearEquipo(['numeroSerie' => 'CU20-OTRO', 'asignada' => true]);
        AsignacionEquipo::create([
            'idServicio' => $otroServicio->idServicio,
            'idEquipo' => $otroEquipo->idEquipo,
            'fechaAsignacion' => '2026-01-05',
        ]);
        $payload = ['equipo_nuevo_id' => $this->nuevo->idEquipo, 'motivo' => 'Cambio de equipo'];

        $this->postJson($this->url('reemplazar'), $payload)->assertOk();
        $estado = $this->estadoPersistido();
        $this->postJson("/api/cu20/servicios/{$otroServicio->idServicio}/equipo/reemplazar", $payload)
            ->assertUnprocessable()->assertJsonPath('success', false);

        $this->assertSame($estado, $this->estadoPersistido());
        $this->assertSame(1, AsignacionEquipo::where('idEquipo', $this->nuevo->idEquipo)->whereNull('fechaRetiro')->count());
    }
}
