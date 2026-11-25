<?php

namespace Tests\Feature;

use App\Models\Paquetes\P1_SeguridadAdministracion\CU03_UsuariosRolesPermisos\Rol;
use App\Models\Paquetes\P7_DashboardReportesInteligenciaVoz\CU30_ProcesarIntencionVozIA\IntencionVozIA;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Cu30ProcesarIntencionVozTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.gemini.key' => '']);
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

    public function test_procesar_intencion_buscar_cliente_extrae_entidades_y_accion(): void
    {
        $admin = $this->usuarioConRol('admin');

        $response = $this->withHeaders($this->bearer($admin))
            ->postJson('/api/cu30/procesar', [
                'texto_dictado' => 'Buscar clientes activos en Zona Norte',
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.intencion_canonica', 'CONSULTAR_CLIENTES');
        $response->assertJsonPath('data.categoria', 'Clientes y Abonados');
        $response->assertJsonPath('data.accion_sugerida.destino', 'CU06');
        $response->assertJsonPath('data.entidades.estado', 'ACTIVO');
        $response->assertJsonPath('data.entidades.zona', 'Zona Norte');

        $this->assertDatabaseHas('IntencionVozIA', [
            'textoEntrada'      => 'Buscar clientes activos en Zona Norte',
            'intencionCanonica' => 'CONSULTAR_CLIENTES',
        ]);
    }

    public function test_procesar_intencion_servicios_corte_extrae_mora(): void
    {
        $admin = $this->usuarioConRol('admin');

        $response = $this->withHeaders($this->bearer($admin))
            ->postJson('/api/cu30/procesar', [
                'texto_dictado' => 'Mostrar servicios para corte con más de 15 días de mora',
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.intencion_canonica', 'SERVICIOS_CORTE');
        $response->assertJsonPath('data.accion_sugerida.destino', 'CU13');
        $response->assertJsonPath('data.entidades.dias_mora', 15);
    }

    public function test_procesar_intencion_deuda_extrae_ci(): void
    {
        $admin = $this->usuarioConRol('admin');

        $response = $this->withHeaders($this->bearer($admin))
            ->postJson('/api/cu30/procesar', [
                'texto_dictado' => 'Consultar saldo y deuda del cliente con CI 8492019',
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.intencion_canonica', 'CONSULTAR_DEUDA');
        $response->assertJsonPath('data.accion_sugerida.destino', 'CU10');
        $response->assertJsonPath('data.entidades.documento_identidad', '8492019');
    }

    public function test_procesar_intencion_inventario_equipos(): void
    {
        $admin = $this->usuarioConRol('admin');

        $response = $this->withHeaders($this->bearer($admin))
            ->postJson('/api/cu30/procesar', [
                'texto_dictado' => 'Cuántos routers tenemos en stock en el inventario',
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.intencion_canonica', 'EQUIPOS_INVENTARIO');
        $response->assertJsonPath('data.accion_sugerida.destino', 'CU18');
        $response->assertJsonPath('data.entidades.tipo_equipo', 'ROUTER');
    }

    public function test_procesar_valida_texto_minimo(): void
    {
        $admin = $this->usuarioConRol('admin');

        $response = $this->withHeaders($this->bearer($admin))
            ->postJson('/api/cu30/procesar', [
                'texto_dictado' => 'a',
            ]);

        $response->assertStatus(422);
    }

    public function test_historial_intenciones_retorna_paginado(): void
    {
        $admin = $this->usuarioConRol('admin');

        IntencionVozIA::create([
            'idUsuario'             => $admin->idUsuario,
            'textoEntrada'          => 'Prueba comando 1',
            'intencionCanonica'     => 'CONSULTAR_CLIENTES',
            'categoria'             => 'Clientes y Abonados',
            'confianza'             => 0.95,
            'motor'                 => 'LOCAL_NLP',
            'tiempoProcesamientoMs' => 12,
        ]);

        $response = $this->withHeaders($this->bearer($admin))
            ->getJson('/api/cu30/historial');

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $this->assertGreaterThanOrEqual(1, count($response->json('data.data')));
    }

    public function test_catalogo_intenciones_retorna_lista_completa(): void
    {
        $admin = $this->usuarioConRol('admin');

        $response = $this->withHeaders($this->bearer($admin))
            ->getJson('/api/cu30/catalogo');

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $this->assertGreaterThanOrEqual(10, count($response->json('data.intenciones')));
    }

    public function test_feedback_actualiza_estado(): void
    {
        $admin = $this->usuarioConRol('admin');

        $registro = IntencionVozIA::create([
            'idUsuario'             => $admin->idUsuario,
            'textoEntrada'          => 'Quiero pagar mensualidad',
            'intencionCanonica'     => 'REGISTRAR_PAGO',
            'categoria'             => 'Facturación y Cobranzas',
            'confianza'             => 0.90,
            'motor'                 => 'LOCAL_NLP',
            'tiempoProcesamientoMs' => 10,
        ]);

        $response = $this->withHeaders($this->bearer($admin))
            ->postJson('/api/cu30/feedback', [
                'id_intencion' => $registro->idIntencion,
                'es_correcto'  => true,
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('IntencionVozIA', [
            'idIntencion' => $registro->idIntencion,
            'estado'      => 'CONFIRMADO',
        ]);
    }

    public function test_ejecutar_accion_marca_intencion_ejecutada(): void
    {
        $admin = $this->usuarioConRol('admin');

        $registro = IntencionVozIA::create([
            'idUsuario'             => $admin->idUsuario,
            'textoEntrada'          => 'Ver cortes de servicio',
            'intencionCanonica'     => 'SERVICIOS_CORTE',
            'categoria'             => 'Servicios y Operaciones',
            'confianza'             => 0.92,
            'motor'                 => 'LOCAL_NLP',
            'accionSugerida'        => ['destino' => 'CU13'],
            'tiempoProcesamientoMs' => 15,
        ]);

        $response = $this->withHeaders($this->bearer($admin))
            ->postJson('/api/cu30/ejecutar', [
                'id_intencion' => $registro->idIntencion,
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('IntencionVozIA', [
            'idIntencion' => $registro->idIntencion,
            'estado'      => 'EJECUTADO',
        ]);
    }
}
