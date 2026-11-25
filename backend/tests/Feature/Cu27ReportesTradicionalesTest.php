<?php

namespace Tests\Feature;

use App\Models\Paquetes\P1_SeguridadAdministracion\CU03_UsuariosRolesPermisos\Rol;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Cu27ReportesTradicionalesTest extends TestCase
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
            'Authorization' => 'Bearer ' . $user->createToken('cu27-test')->plainTextToken,
        ];
    }

    public function test_sin_token_no_puede_acceder(): void
    {
        $this->getJson('/api/cu27/catalogo')->assertStatus(401);
        $this->getJson('/api/cu27/generar?tipo_reporte=clientes_zona')->assertStatus(401);
    }

    public function test_usuario_sin_permiso_recibe_403(): void
    {
        $rolSinPermisos = Rol::create([
            'nombre' => 'Invitado',
            'slug'   => 'invitado',
            'activo' => true,
        ]);
        $usuario = User::factory()->create(['rol_id' => $rolSinPermisos->id, 'activo' => true]);

        $this->withHeaders($this->bearer($usuario))
            ->getJson('/api/cu27/catalogo')
            ->assertStatus(403);
    }

    public function test_administrador_consulta_catalogo_y_parametros(): void
    {
        $admin = $this->usuarioConRol('admin');

        $resCat = $this->withHeaders($this->bearer($admin))
            ->getJson('/api/cu27/catalogo')
            ->assertStatus(200);

        $this->assertCount(4, $resCat->json('data'));

        $resParams = $this->withHeaders($this->bearer($admin))
            ->getJson('/api/cu27/parametros')
            ->assertStatus(200);

        $this->assertNotEmpty($resParams->json('data.zonas'));
        $this->assertNotEmpty($resParams->json('data.metodos'));
    }

    public function test_generar_reporte_clientes_zona_con_kpis(): void
    {
        $admin = $this->usuarioConRol('admin');

        $res = $this->withHeaders($this->bearer($admin))
            ->getJson('/api/cu27/generar?tipo_reporte=clientes_zona')
            ->assertStatus(200);

        $this->assertEquals('clientes_zona', $res->json('data.tipo'));
        $this->assertArrayHasKey('kpis', $res->json('data'));
        $this->assertArrayHasKey('total_registros', $res->json('data.kpis'));
    }

    public function test_rango_fechas_invalido_devuelve_422(): void
    {
        $admin = $this->usuarioConRol('admin');

        $this->withHeaders($this->bearer($admin))
            ->getJson('/api/cu27/generar?tipo_reporte=ingresos_pagos&fecha_desde=2026-10-31&fecha_hasta=2026-10-01')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['fecha_hasta']);
    }

    public function test_exportar_excel_devuelve_stream_csv(): void
    {
        $admin = $this->usuarioConRol('admin');

        $res = $this->withHeaders($this->bearer($admin))
            ->get('/api/cu27/exportar-excel?tipo_reporte=ingresos_pagos');

        $res->assertStatus(200);
        $this->assertStringContainsString('text/csv', $res->headers->get('content-type'));
    }

    public function test_consultar_columnas_exportables(): void
    {
        $admin = $this->usuarioConRol('admin');

        $res = $this->withHeaders($this->bearer($admin))
            ->getJson('/api/cu27/columnas')
            ->assertStatus(200);

        $this->assertNotNull($res->json('data.clientes_zona'));
        $this->assertNotNull($res->json('data.ingresos_pagos'));
    }

    public function test_exportar_excel_con_columnas_dinamicas(): void
    {
        $admin = $this->usuarioConRol('admin');

        $res = $this->withHeaders($this->bearer($admin))
            ->get('/api/cu27/exportar-excel?tipo_reporte=clientes_zona&columnas=codigoCliente,nombreCompleto');

        $res->assertStatus(200);
        $this->assertStringContainsString('text/csv', $res->headers->get('content-type'));
    }

    public function test_analisis_ejecutivo_ia(): void
    {
        $admin = $this->usuarioConRol('admin');

        $res = $this->withHeaders($this->bearer($admin))
            ->postJson('/api/cu27/analisis-ia', [
                'tipo_reporte' => 'clientes_zona',
            ])
            ->assertStatus(200);

        $this->assertTrue($res->json('success'));
        $this->assertNotNull($res->json('data.resumen_ejecutivo'));
        $this->assertNotEmpty($res->json('data.puntos_clave'));
        $this->assertNotNull($res->json('data.narrativa_tts'));
    }
}
