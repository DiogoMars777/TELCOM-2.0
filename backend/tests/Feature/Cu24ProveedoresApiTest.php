<?php

namespace Tests\Feature;

use App\Models\Paquetes\P1_SeguridadAdministracion\CU03_UsuariosRolesPermisos\Rol;
use App\Models\Paquetes\P5_EquiposProveedoresInventario\CU24_GestionarProveedores\Proveedor;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/** API real y RBAC del CU24, sobre la base SQLite en memoria de phpunit.xml. */
class Cu24ProveedoresApiTest extends TestCase
{
    use RefreshDatabase;

    protected function beforeRefreshingDatabase(): void
    {
        // Estas pruebas nunca deben apuntar a la BD de trabajo.
        $this->assertSame('sqlite', config('database.default'));
        $this->assertSame(':memory:', config('database.connections.sqlite.database'));
    }

    protected function migrateDatabases(): void
    {
        // La BD en memoria está vacía; basta migrate, sin migrate:fresh.
        $this->artisan('migrate', ['--force' => true]);
    }

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    private function autenticar(string $rol = 'admin'): User
    {
        $usuario = User::factory()->create([
            'rol_id' => Rol::where('slug', $rol)->firstOrFail()->id,
            'activo' => true,
        ]);
        $this->withToken($usuario->createToken('cu24-test')->plainTextToken);

        return $usuario;
    }

    private function datos(array $cambios = []): array
    {
        return array_replace([
            'razonSocial' => 'Proveedor CU24',
            'nit' => '00123456789',
            'telefono' => '+591 70000001',
            'correo' => 'contacto@proveedor.test',
            'direccion' => 'Av. Principal 123',
        ], $cambios);
    }

    private function proveedor(array $cambios = []): Proveedor
    {
        return Proveedor::create([...$this->datos(), 'estado' => true, ...$cambios]);
    }

    public function test_lista_consulta_y_busca_proveedores_activos_e_inactivos(): void
    {
        $this->autenticar();
        $activo = $this->proveedor(['razonSocial' => 'CU24 Fibra Norte']);
        $inactivo = $this->proveedor(['nit' => '00999', 'razonSocial' => 'CU24 Redes Sur', 'estado' => false]);

        $this->getJson('/api/cu24/proveedores?buscar=cu24')
            ->assertOk()->assertJsonPath('success', true)->assertJsonCount(2, 'data.proveedores');
        $this->getJson('/api/cu24/proveedores?buscar=fibra')
            ->assertOk()->assertJsonCount(1, 'data.proveedores')
            ->assertJsonPath('data.proveedores.0.idProveedor', $activo->idProveedor);
        $this->getJson('/api/cu24/proveedores?buscar=00999&estado=0')
            ->assertOk()->assertJsonCount(1, 'data.proveedores')
            ->assertJsonPath('data.proveedores.0.estado', false);
        $this->getJson('/api/cu24/proveedores?buscar=CU24&estado=1')
            ->assertOk()->assertJsonCount(1, 'data.proveedores')
            ->assertJsonPath('data.proveedores.0.estado', true);
        $this->getJson('/api/cu24/proveedores?buscar=sin-coincidencias')
            ->assertOk()->assertJsonCount(0, 'data.proveedores');
        $this->getJson("/api/cu24/proveedores/{$inactivo->idProveedor}")
            ->assertOk()->assertJsonPath('data.proveedor.razonSocial', 'CU24 Redes Sur')
            ->assertJsonPath('data.proveedor.estado', false);
    }

    public function test_busca_por_contacto_direccion_y_cero(): void
    {
        $this->autenticar();
        $p = $this->proveedor(['nit' => 'ABC0', 'telefono' => '777CU24', 'direccion' => 'Calle CU24']);
        foreach (['777CU24', 'contacto@proveedor.test', 'Calle CU24', '0'] as $buscar) {
            $this->getJson('/api/cu24/proveedores?'.http_build_query(['buscar' => $buscar]))
                ->assertOk()->assertJsonFragment(['idProveedor' => $p->idProveedor]);
        }
    }

    public function test_admin_registra_proveedor_con_campos_canonicos_y_bitacora(): void
    {
        $usuario = $this->autenticar();
        $id = $this->postJson('/api/cu24/proveedores', $this->datos())
            ->assertCreated()->assertJsonPath('data.proveedor.nit', '00123456789')
            ->assertJsonPath('data.proveedor.estado', true)->json('data.proveedor.idProveedor');

        $this->assertDatabaseHas('Proveedor', ['idProveedor' => $id, ...$this->datos(), 'estado' => true]);
        $this->assertDatabaseHas('Bitacora', [
            'idUsuario' => $usuario->id, 'modulo' => 'PROVEEDORES', 'accion' => 'CREAR_PROVEEDOR',
        ]);
        $this->getJson("/api/cu24/proveedores/{$id}")->assertOk()
            ->assertJsonPath('data.proveedor.correo', 'contacto@proveedor.test');
    }

    public function test_campos_opcionales_pueden_omitirse_y_estado_inicial_es_activo(): void
    {
        $this->autenticar();
        $id = $this->postJson('/api/cu24/proveedores', [
            'razonSocial' => 'Solo obligatorios', 'nit' => '10001', 'estado' => false,
        ])->assertCreated()->assertJsonPath('data.proveedor.estado', true)->json('data.proveedor.idProveedor');

        $this->assertDatabaseHas('Proveedor', ['idProveedor' => $id, 'telefono' => null, 'correo' => null, 'direccion' => null]);
    }

    public function test_rechaza_nit_duplicado_incluso_de_proveedor_inactivo(): void
    {
        $this->autenticar();
        $this->proveedor(['estado' => false]);
        $this->postJson('/api/cu24/proveedores', $this->datos(['razonSocial' => 'Duplicado']))
            ->assertUnprocessable()->assertJsonValidationErrors('nit');
        $this->assertSame(1, Proveedor::where('nit', '00123456789')->count());
    }

    public function test_actualiza_datos_manteniendo_nit_propio_y_estado(): void
    {
        $this->autenticar();
        $p = $this->proveedor(['estado' => false]);
        $datos = $this->datos(['razonSocial' => 'Proveedor editado', 'telefono' => null, 'correo' => null, 'direccion' => 'Otra dirección']);

        $this->putJson("/api/cu24/proveedores/{$p->idProveedor}", [...$datos, 'estado' => true])
            ->assertOk()->assertJsonPath('data.proveedor.razonSocial', 'Proveedor editado')
            ->assertJsonPath('data.proveedor.estado', false);
        $this->assertDatabaseHas('Proveedor', ['idProveedor' => $p->idProveedor, ...$datos, 'estado' => false]);
        $this->assertDatabaseHas('Bitacora', ['modulo' => 'PROVEEDORES', 'accion' => 'ACTUALIZAR_PROVEEDOR']);
        $this->getJson("/api/cu24/proveedores/{$p->idProveedor}")
            ->assertOk()->assertJsonPath('data.proveedor.direccion', 'Otra dirección');
    }

    public function test_no_puede_actualizar_con_nit_de_otro_proveedor(): void
    {
        $this->autenticar();
        $this->proveedor();
        $p = $this->proveedor(['nit' => '99999']);
        $this->putJson("/api/cu24/proveedores/{$p->idProveedor}", $this->datos())
            ->assertUnprocessable()->assertJsonValidationErrors('nit');
        $this->assertSame('99999', $p->fresh()->nit);
    }

    public function test_desactiva_y_reactiva_conservando_proveedor_y_compra(): void
    {
        $this->autenticar();
        $p = $this->proveedor();
        // Solo fixture para comprobar integridad referencial; no implementa CU25.
        $idCompra = DB::table('Compra')->insertGetId(['idProveedor' => $p->idProveedor], 'idCompra');
        $count = Proveedor::count();

        $this->putJson("/api/cu24/proveedores/{$p->idProveedor}/desactivar")
            ->assertOk()->assertJsonPath('data.proveedor.estado', false);
        $this->assertDatabaseHas('Proveedor', ['idProveedor' => $p->idProveedor, 'estado' => false]);
        $this->getJson("/api/cu24/proveedores/{$p->idProveedor}")
            ->assertOk()->assertJsonPath('data.proveedor.estado', false);
        $this->putJson("/api/cu24/proveedores/{$p->idProveedor}/activar")
            ->assertOk()->assertJsonPath('data.proveedor.estado', true);
        $this->getJson("/api/cu24/proveedores/{$p->idProveedor}")
            ->assertOk()->assertJsonPath('data.proveedor.estado', true);

        $this->assertSame($count, Proveedor::count());
        $this->assertDatabaseHas('Compra', ['idCompra' => $idCompra, 'idProveedor' => $p->idProveedor]);
        foreach (['DESACTIVAR_PROVEEDOR' => [true, false], 'ACTIVAR_PROVEEDOR' => [false, true]] as $accion => [$antes, $despues]) {
            $auditoria = DB::table('Bitacora')->where('accion', $accion)->first();
            $this->assertNotNull($auditoria);
            $this->assertSame($antes, json_decode($auditoria->datosPrevios, true)['estado']);
            $this->assertSame($despues, json_decode($auditoria->datosNuevos, true)['estado']);
        }
    }

    public function test_cambios_de_estado_repetidos_son_idempotentes_y_delete_no_existe(): void
    {
        $this->autenticar();
        $p = $this->proveedor();
        foreach (['desactivar' => false, 'activar' => true] as $accion => $estado) {
            for ($i = 0; $i < 2; $i++) {
                $this->putJson("/api/cu24/proveedores/{$p->idProveedor}/{$accion}")
                    ->assertOk()->assertJsonPath('data.proveedor.estado', $estado);
            }
        }
        $this->deleteJson("/api/cu24/proveedores/{$p->idProveedor}")->assertStatus(405);
        $this->assertDatabaseHas('Proveedor', ['idProveedor' => $p->idProveedor]);
    }

    public static function datosInvalidos(): array
    {
        return [
            'razón obligatoria' => ['razonSocial', '   '],
            'nit obligatorio' => ['nit', ''],
            'razón larga' => ['razonSocial', str_repeat('a', 101)],
            'nit largo' => ['nit', str_repeat('1', 31)],
            'teléfono largo' => ['telefono', str_repeat('1', 21)],
            'correo inválido' => ['correo', 'sin-arroba'],
            'correo largo' => ['correo', str_repeat('a', 90).'@correo.test'],
            'dirección inválida' => ['direccion', ['calle']],
        ];
    }

    #[DataProvider('datosInvalidos')]
    public function test_valida_registro_y_actualizacion(string $campo, mixed $valor): void
    {
        $this->autenticar();
        $datos = $this->datos([$campo => $valor]);
        $this->postJson('/api/cu24/proveedores', $datos)->assertUnprocessable()->assertJsonValidationErrors($campo);
        $p = $this->proveedor();
        $this->putJson("/api/cu24/proveedores/{$p->idProveedor}", $datos)
            ->assertUnprocessable()->assertJsonValidationErrors($campo);
    }

    public function test_acepta_limites_de_bd_y_direccion_de_tipo_text(): void
    {
        $this->autenticar();
        $this->postJson('/api/cu24/proveedores', $this->datos([
            'razonSocial' => str_repeat('á', 100), 'nit' => str_repeat('1', 30),
            'telefono' => str_repeat('7', 20), 'direccion' => str_repeat('Dirección ', 200),
        ]))->assertCreated();
    }

    public static function rutasProtegidas(): array
    {
        return [
            'listado' => ['GET', ''],
            'consulta' => ['GET', '/1'],
            'registro' => ['POST', ''],
            'actualización' => ['PUT', '/1'],
            'activación' => ['PUT', '/1/activar'],
            'desactivación' => ['PUT', '/1/desactivar'],
        ];
    }

    #[DataProvider('rutasProtegidas')]
    public function test_todas_las_operaciones_exigen_token_y_permiso(string $metodo, string $ruta): void
    {
        $url = '/api/cu24/proveedores'.$ruta;
        $this->json($metodo, $url, $this->datos())->assertUnauthorized();
        foreach (['secretaria', 'tecnico'] as $rol) {
            $this->autenticar($rol);
            $this->json($metodo, $url, $this->datos())->assertForbidden();
        }
        $this->assertDatabaseMissing('Bitacora', ['modulo' => 'PROVEEDORES']);
    }

    public function test_proveedor_inexistente_devuelve_404(): void
    {
        $this->autenticar();
        foreach (['GET' => '', 'PUT' => '', 'activar' => '/activar', 'desactivar' => '/desactivar'] as $metodo => $ruta) {
            $this->json($metodo === 'GET' ? 'GET' : 'PUT', '/api/cu24/proveedores/999999'.$ruta, $this->datos())->assertNotFound();
        }
    }
}
