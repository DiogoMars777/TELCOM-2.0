<?php

namespace Tests\Feature;

use App\Models\Paquetes\SeguridadAdministracion\CU03_UsuariosRolesPermisos\Permiso;
use App\Models\Paquetes\SeguridadAdministracion\CU03_UsuariosRolesPermisos\Rol;
use App\Models\Paquetes\GestionClientesZonas\CU05_RegistrarCliente\Cliente;
use App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio\ServicioInternet;
use App\Models\Paquetes\FacturacionCobranza\CU09_GenerarMensualidades\MensualidadFacturacion;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * RBAC por actores internos (admin / secretaria / tecnico).
 *
 * Se ejecuta contra la BD en memoria (SQLite) con la matriz REAL del
 * DatabaseSeeder. Verifica autenticación (401), autorización (403) y acceso
 * permitido, llamando directamente a la API (sin React).
 */
class AuthorizationRbacTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Carga los roles y permisos reales del proyecto.
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
        return [
            'Authorization' => 'Bearer '.$user->createToken('rbac-test')->plainTextToken,
        ];
    }

    private function crearMensualidadPendiente(): MensualidadFacturacion
    {
        $cliente = Cliente::firstOrFail();
        $servicio = ServicioInternet::firstOrFail();

        return MensualidadFacturacion::create([
            'codigo_factura'    => 'FAC-TEST-'.Str::upper(Str::random(5)),
            'cliente_id'        => $cliente->id,
            'servicio_id'       => $servicio->id,
            'periodo'           => '2026-10',
            'monto'             => 250.00,
            'fecha_emision'     => now()->toDateString(),
            'fecha_vencimiento' => now()->addDays(10)->toDateString(),
            'estado_pago'       => 'PENDIENTE',
        ]);
    }

    // ---------------------------------------------------------------
    // Matriz
    // ---------------------------------------------------------------

    public function test_matriz_de_permisos_por_rol(): void
    {
        $admin = Rol::where('slug', 'admin')->firstOrFail();
        $secretaria = Rol::where('slug', 'secretaria')->firstOrFail();
        $tecnico = Rol::where('slug', 'tecnico')->firstOrFail();

        $this->assertSame(29, $admin->permisos()->count(), 'El administrador debe tener todos los permisos.');
        $this->assertSame(20, $secretaria->permisos()->count());
        $this->assertSame(8, $tecnico->permisos()->count());

        // El rol antiguo ya no existe.
        $this->assertFalse(Rol::where('slug', 'cajero')->exists());

        // CU16 (gestionar catálogo de planes) es EXCLUSIVO del administrador.
        $this->assertTrue($admin->permisos()->where('permisos.slug', 'planes.manage')->exists());
        $this->assertFalse($secretaria->permisos()->where('permisos.slug', 'planes.manage')->exists());
        $this->assertFalse($tecnico->permisos()->where('permisos.slug', 'planes.manage')->exists());

        // CU17 (asignar plan) y la consulta de planes los comparte secretaría.
        foreach (['planes.view', 'planes.assign'] as $slug) {
            $this->assertTrue($secretaria->permisos()->where('permisos.slug', $slug)->exists());
        }

        // Secretaría no tiene permisos administrativos.
        foreach (['usuarios.manage', 'auditoria.view', 'zonas.manage', 'planes.manage', 'proveedores.manage', 'compras.manage', 'reportes.view'] as $slug) {
            $this->assertFalse(
                $secretaria->permisos()->where('permisos.slug', $slug)->exists(),
                "Secretaría no debe tener $slug"
            );
        }

        // El técnico no registra pagos, mensualidades, cortes ni reactivaciones.
        foreach (['pagos.register', 'pagos.history', 'mensualidades.view', 'mensualidades.generate', 'cortes.list', 'cortes.register', 'reactivaciones.manage', 'usuarios.manage'] as $slug) {
            $this->assertFalse(
                $tecnico->permisos()->where('permisos.slug', $slug)->exists(),
                "El técnico no debe tener $slug"
            );
        }
    }

    // ---------------------------------------------------------------
    // Autenticación (401) y autorización (403)
    // ---------------------------------------------------------------

    public function test_sin_token_devuelve_401(): void
    {
        $this->getJson('/api/cu03/usuarios')->assertStatus(401);
        $this->postJson('/api/cu10/pagos', [])->assertStatus(401);
    }

    public function test_sin_token_sin_accept_json_tambien_devuelve_401_json(): void
    {
        // Un cliente directo (sin React) que no envía `Accept: application/json`
        // debe recibir igualmente 401 en JSON, nunca un 500/redirección.
        $response = $this->get('/api/cu03/usuarios');

        $response->assertStatus(401);
        $this->assertStringContainsString('application/json', (string) $response->headers->get('content-type'));
    }

    public function test_autenticado_sin_permiso_devuelve_403(): void
    {
        $tecnico = $this->usuarioConRol('tecnico');

        $this->withHeaders($this->bearer($tecnico))
            ->getJson('/api/cu03/usuarios')
            ->assertStatus(403);
    }

    public function test_admin_puede_gestionar_usuarios(): void
    {
        $admin = $this->usuarioConRol('admin');

        $this->withHeaders($this->bearer($admin))
            ->getJson('/api/cu03/usuarios')
            ->assertStatus(200);
    }

    public function test_secretaria_no_puede_gestionar_usuarios(): void
    {
        $secretaria = $this->usuarioConRol('secretaria');
        $headers = $this->bearer($secretaria);

        $this->withHeaders($headers)->getJson('/api/cu03/usuarios')->assertStatus(403);
        $this->withHeaders($headers)->postJson('/api/cu03/usuarios', [])->assertStatus(403);
    }

    public function test_secretaria_no_ve_auditoria_ni_zonas(): void
    {
        $secretaria = $this->usuarioConRol('secretaria');
        $headers = $this->bearer($secretaria);

        $this->withHeaders($headers)->getJson('/api/cu02/auditoria')->assertStatus(403);
        $this->withHeaders($headers)->getJson('/api/cu04/zonas')->assertStatus(403);
    }

    // ---------------------------------------------------------------
    // Secretaría: operaciones permitidas
    // ---------------------------------------------------------------

    public function test_secretaria_puede_registrar_cliente(): void
    {
        $secretaria = $this->usuarioConRol('secretaria');
        $zona = \App\Models\Paquetes\GestionClientesZonas\CU04_ZonasCobertura\ZonaCobertura::firstOrFail();

        $this->withHeaders($this->bearer($secretaria))
            ->postJson('/api/cu05/clientes', [
                'documento_identidad' => '9001001',
                'tipo_documento'      => 'CI',
                'nombres'             => 'Ana',
                'apellidos'           => 'Quispe',
                'telefono'            => '+591 70000001',
                'email'               => 'ana.quispe@example.com',
                'direccion'           => 'Calle Falsa 123',
                'zona_id'             => $zona->id,
            ])
            ->assertStatus(201)
            ->assertJsonPath('success', true);
    }

    public function test_secretaria_puede_registrar_pago(): void
    {
        $secretaria = $this->usuarioConRol('secretaria');
        $mensualidad = $this->crearMensualidadPendiente();

        $this->withHeaders($this->bearer($secretaria))
            ->postJson('/api/cu10/pagos', [
                'mensualidad_id' => $mensualidad->id,
                'monto_pagado'   => 250.00,
                'metodo_pago'    => 'EFECTIVO',
            ])
            ->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.pago.cajero_user_id', $secretaria->id);
    }

    // ---------------------------------------------------------------
    // Técnico
    // ---------------------------------------------------------------

    public function test_tecnico_puede_consultar_servicios_y_clientes(): void
    {
        $tecnico = $this->usuarioConRol('tecnico');
        $headers = $this->bearer($tecnico);

        $this->withHeaders($headers)->getJson('/api/cu08/servicios')->assertStatus(200);
        $this->withHeaders($headers)->getJson('/api/cu06/clientes')->assertStatus(200);
    }

    public function test_tecnico_no_activa_servicios_ni_registra_pagos(): void
    {
        $tecnico = $this->usuarioConRol('tecnico');
        $headers = $this->bearer($tecnico);

        $this->withHeaders($headers)->postJson('/api/cu08/servicios', [])->assertStatus(403);
        $this->withHeaders($headers)->postJson('/api/cu10/pagos', [])->assertStatus(403);
    }

    // ---------------------------------------------------------------
    // Actor externo (Cliente) y estados inválidos
    // ---------------------------------------------------------------

    public function test_cliente_sin_rol_no_accede_a_operaciones_administrativas(): void
    {
        $cliente = User::factory()->create(['rol_id' => null, 'activo' => true]);
        $headers = $this->bearer($cliente);

        $this->withHeaders($headers)->getJson('/api/cu03/usuarios')->assertStatus(403);
        $this->withHeaders($headers)->postJson('/api/cu10/pagos', [])->assertStatus(403);
        $this->withHeaders($headers)->getJson('/api/cu02/auditoria')->assertStatus(403);
    }

    public function test_usuario_inactivo_recibe_403(): void
    {
        $admin = $this->usuarioConRol('admin', ['activo' => false]);

        $this->withHeaders($this->bearer($admin))
            ->getJson('/api/cu03/usuarios')
            ->assertStatus(403);
    }

    public function test_rol_inactivo_recibe_403(): void
    {
        $rol = Rol::create([
            'nombre' => 'Rol inactivo',
            'slug'   => 'rol-inactivo-'.Str::random(6),
            'activo' => false,
        ]);
        $permiso = Permiso::firstOrCreate(
            ['slug' => 'zonas.manage'],
            ['nombre' => 'Gestionar Zonas de Cobertura', 'modulo' => 'CU04']
        );
        $rol->permisos()->attach($permiso->id);

        $usuario = User::factory()->create(['rol_id' => $rol->id, 'activo' => true]);

        $this->withHeaders($this->bearer($usuario))
            ->getJson('/api/cu04/zonas')
            ->assertStatus(403);
    }

    public function test_no_existe_endpoint_publico_para_confirmar_pagos(): void
    {
        // Un tercero no puede falsificar un pago: el endpoint exige autenticación.
        $this->postJson('/api/cu10/pagos', [
            'mensualidad_id' => 1,
            'monto_pagado'   => 999.99,
            'metodo_pago'    => 'QR',
        ])->assertStatus(401);
    }

    // ---------------------------------------------------------------
    // CU01 sigue funcionando
    // ---------------------------------------------------------------

    public function test_login_y_logout_siguen_funcionando(): void
    {
        $secretaria = Rol::where('slug', 'secretaria')->firstOrFail();
        $user = User::factory()->create([
            'password' => 'secreto123',
            'rol_id'   => $secretaria->id,
            'activo'   => true,
        ]);

        $login = $this->postJson('/api/cu01/login', [
            'email'    => $user->email,
            'password' => 'secreto123',
        ]);

        $login->assertStatus(200)->assertJsonPath('success', true);
        $token = $login->json('data.token');
        $this->assertNotEmpty($token);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/cu01/logout')
            ->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    // ---------------------------------------------------------------
    // Contrato del frontend: /me y login exponen rol + permisos reales
    // ---------------------------------------------------------------

    public function test_me_devuelve_rol_y_permisos_efectivos(): void
    {
        $secretaria = $this->usuarioConRol('secretaria');

        $res = $this->withHeaders($this->bearer($secretaria))->getJson('/api/cu01/me');

        $res->assertStatus(200)->assertJsonPath('data.rol.slug', 'secretaria');

        $permisos = $res->json('data.permisos');
        $this->assertContains('pagos.register', $permisos);
        $this->assertContains('clientes.view', $permisos);
        $this->assertNotContains('usuarios.manage', $permisos);
        $this->assertNotContains('zonas.manage', $permisos);
    }

    public function test_me_sin_rol_no_devuelve_permisos(): void
    {
        $user = User::factory()->create(['rol_id' => null, 'activo' => true]);

        $res = $this->withHeaders($this->bearer($user))->getJson('/api/cu01/me');

        $res->assertStatus(200);
        $this->assertNull($res->json('data.rol'));
        $this->assertSame([], $res->json('data.permisos'));
    }

    public function test_login_devuelve_rol_y_permisos_y_no_expone_password(): void
    {
        $secretaria = Rol::where('slug', 'secretaria')->firstOrFail();
        $user = User::factory()->create([
            'password' => 'secreto123',
            'rol_id'   => $secretaria->id,
            'activo'   => true,
        ]);

        $res = $this->postJson('/api/cu01/login', [
            'email'    => $user->email,
            'password' => 'secreto123',
        ]);

        $res->assertStatus(200)
            ->assertJsonPath('data.user.rol.slug', 'secretaria');

        $this->assertContains('mensualidades.generate', $res->json('data.user.permisos'));
        $this->assertArrayNotHasKey('password', $res->json('data.user'));
    }
}
