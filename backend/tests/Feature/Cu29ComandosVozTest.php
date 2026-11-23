<?php

namespace Tests\Feature;

use App\Models\Paquetes\DashboardReportesInteligenciaVoz\CU29_CapturarTranscribirComandosVoz\ComandoVoz;
use App\Models\Paquetes\P1_SeguridadAdministracion\CU03_UsuariosRolesPermisos\Rol;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Cu29ComandosVozTest extends TestCase
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
            'Authorization' => 'Bearer ' . $user->createToken('cu29-test')->plainTextToken,
        ];
    }

    public function test_sin_token_no_puede_transcribir_ni_consultar(): void
    {
        $this->postJson('/api/cu29/transcribir', ['texto_dictado' => 'Ver clientes'])->assertStatus(401);
        $this->getJson('/api/cu29/historial')->assertStatus(401);
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
            ->postJson('/api/cu29/transcribir', ['texto_dictado' => 'Ver clientes'])
            ->assertStatus(403);
    }

    public function test_transcribir_comando_interpreta_intencion_y_registra_en_bd(): void
    {
        $admin = $this->usuarioConRol('admin');

        $res = $this->withHeaders($this->bearer($admin))
            ->postJson('/api/cu29/transcribir', [
                'texto_dictado'     => 'Mostrar ingresos de la Zona Norte del último mes',
                'duracion_segundos' => 3.2,
                'confianza'         => 0.98,
            ])
            ->assertStatus(200);

        $this->assertEquals('REPORTE_INGRESOS', $res->json('data.intencion'));
        $this->assertEquals('ingresos_pagos', $res->json('data.reporteSugerido'));
        $this->assertEquals('TRANSCRITO', $res->json('data.estado'));

        $this->assertDatabaseHas('ComandoVoz', [
            'textoDictado' => 'Mostrar ingresos de la Zona Norte del último mes',
            'intencion'    => 'REPORTE_INGRESOS',
        ]);
    }

    public function test_transcripcion_vacia_devuelve_422(): void
    {
        $admin = $this->usuarioConRol('admin');

        $this->withHeaders($this->bearer($admin))
            ->postJson('/api/cu29/transcribir', [
                'texto_dictado' => '',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['texto_dictado']);
    }

    public function test_historial_y_ejemplos_retornan_datos(): void
    {
        $admin = $this->usuarioConRol('admin');

        // Insertar un comando
        ComandoVoz::create([
            'idUsuario'    => $admin->idUsuario,
            'textoDictado' => 'Reporte de clientes morosos',
            'intencion'    => 'REPORTE_MOROSIDAD',
            'estado'       => 'CONFIRMADO',
        ]);

        $resHist = $this->withHeaders($this->bearer($admin))
            ->getJson('/api/cu29/historial')
            ->assertStatus(200);

        $this->assertNotEmpty($resHist->json('data'));

        $resEj = $this->withHeaders($this->bearer($admin))
            ->getJson('/api/cu29/ejemplos')
            ->assertStatus(200);

        $this->assertNotEmpty($resEj->json('data'));
    }
}
