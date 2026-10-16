<?php

namespace Tests\Feature;

use App\Models\Paquetes\SeguridadAdministracion\CU03_UsuariosRolesPermisos\Rol;
use App\Models\Paquetes\GestionClientesZonas\CU04_ZonasCobertura\ZonaCobertura;
use App\Models\Paquetes\GestionClientesZonas\CU05_RegistrarCliente\Cliente;
use App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio\EstadoServicio;
use App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio\ServicioInternet;
use App\Models\Paquetes\FacturacionCobranza\CU09_GenerarMensualidades\MensualidadFacturacion;
use App\Models\Paquetes\ServiciosPlanes\CU15_ListaRegistroReactivaciones\ReactivacionServicio;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Flujos funcionales de los Ciclos 1 y 2 (CU02-CU15).
 *
 * Se ejecuta contra la BD en memoria (SQLite) con las migraciones y la matriz
 * RBAC REAL del DatabaseSeeder. Verifica, llamando directamente a la API:
 *   - reglas de negocio (monto de pago exacto, mora para corte, estados),
 *   - sincronización de la relación de estado (estado_servicio_id),
 *   - registro y consulta de la bitácora de auditoría,
 *   - autorización por rol.
 */
class CiclosUnoDosTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

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

    /** @return array<string, string> */
    private function bearer(User $user): array
    {
        return ['Authorization' => 'Bearer ' . $user->createToken('ciclos-test')->plainTextToken];
    }

    private function servicioSembrado(): ServicioInternet
    {
        return ServicioInternet::where('codigo_servicio', 'SRV-88201')->firstOrFail();
    }

    private function crearMensualidad(ServicioInternet $servicio, array $attributes = []): MensualidadFacturacion
    {
        return MensualidadFacturacion::create(array_merge([
            'codigo_factura'    => 'FAC-T-' . strtoupper(Str::random(6)),
            'cliente_id'        => $servicio->cliente_id,
            'servicio_id'       => $servicio->id,
            'periodo'           => '2026-08',
            'monto'             => $servicio->precio_mensual,
            'fecha_emision'     => now()->toDateString(),
            'fecha_vencimiento' => now()->subDays(10)->toDateString(),
            'estado_pago'       => 'PENDIENTE',
        ], $attributes));
    }

    // ------------------------------------------------------------------
    // CU01 - Iniciar/cerrar sesión
    // ------------------------------------------------------------------

    public function test_cu01_login_registra_bitacora(): void
    {
        $activo = $this->usuarioConRol('tecnico');

        $this->postJson('/api/cu01/login', [
            'email'    => $activo->email,
            'password' => 'password',
        ])->assertStatus(200);

        $this->assertDatabaseHas('bitacora_auditorias', [
            'modulo' => 'CU01',
            'accion' => 'INICIAR_SESION',
        ]);
    }

    public function test_cu01_usuario_inactivo_no_puede_iniciar_sesion(): void
    {
        $inactivo = $this->usuarioConRol('tecnico', ['activo' => false]);

        $this->postJson('/api/cu01/login', [
            'email'    => $inactivo->email,
            'password' => 'password',
        ])->assertStatus(403);
    }

    // ------------------------------------------------------------------
    // CU04 - Zonas de cobertura
    // ------------------------------------------------------------------

    public function test_cu04_admin_crea_zona_y_registra_bitacora(): void
    {
        $admin = $this->usuarioConRol('admin');

        $this->withHeaders($this->bearer($admin))->postJson('/api/cu04/zonas', [
            'codigo'          => 'ZON-TEST-1',
            'nombre'          => 'Zona Test',
            'ciudad'          => 'La Paz',
            'tecnologia'      => 'FTTH',
            'capacidad_nodos' => 10,
        ])->assertStatus(201)->assertJsonPath('success', true);

        $this->assertDatabaseHas('bitacora_auditorias', [
            'modulo' => 'CU04',
            'accion' => 'CREAR_ZONA',
        ]);
    }

    public function test_cu04_secretaria_no_gestiona_zonas(): void
    {
        $secretaria = $this->usuarioConRol('secretaria');

        $this->withHeaders($this->bearer($secretaria))
            ->postJson('/api/cu04/zonas', [])
            ->assertStatus(403);
    }

    // ------------------------------------------------------------------
    // CU05 - Registrar cliente
    // ------------------------------------------------------------------

    public function test_cu05_registra_cliente_con_zona_real(): void
    {
        $secretaria = $this->usuarioConRol('secretaria');
        $zona = ZonaCobertura::firstOrFail();

        $res = $this->withHeaders($this->bearer($secretaria))->postJson('/api/cu05/clientes', [
            'documento_identidad' => '9199001',
            'tipo_documento'      => 'CI',
            'nombres'             => 'Luisa',
            'apellidos'           => 'Fernandez',
            'telefono'            => '+591 70000009',
            'email'               => 'luisa.f@example.com',
            'direccion'           => 'Calle 1',
            'zona_id'             => $zona->id,
        ]);

        $res->assertStatus(201)->assertJsonPath('success', true);
        $this->assertNotEmpty($res->json('data.codigo_cliente'));
    }

    public function test_cu05_rechaza_zona_inexistente_con_422(): void
    {
        $secretaria = $this->usuarioConRol('secretaria');

        $this->withHeaders($this->bearer($secretaria))->postJson('/api/cu05/clientes', [
            'documento_identidad' => '9199002',
            'tipo_documento'      => 'CI',
            'nombres'             => 'X',
            'apellidos'           => 'Y',
            'telefono'            => '1',
            'email'               => 'x@example.com',
            'direccion'           => 'd',
            'zona_id'             => 999999,
        ])->assertStatus(422)->assertJsonValidationErrors('zona_id');
    }

    public function test_cu05_catalogo_de_zonas_para_registrar(): void
    {
        $secretaria = $this->usuarioConRol('secretaria');
        $this->withHeaders($this->bearer($secretaria))
            ->getJson('/api/cu05/zonas')
            ->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    public function test_cu05_tecnico_no_accede_al_catalogo_de_zonas(): void
    {
        $tecnico = $this->usuarioConRol('tecnico');
        $this->withHeaders($this->bearer($tecnico))
            ->getJson('/api/cu05/zonas')
            ->assertStatus(403);
    }

    // ------------------------------------------------------------------
    // CU06 - Consultar y buscar clientes
    // ------------------------------------------------------------------

    public function test_cu06_busqueda_encuentra_cliente(): void
    {
        $admin = $this->usuarioConRol('admin');

        $res = $this->withHeaders($this->bearer($admin))
            ->getJson('/api/cu06/clientes?buscar=mendoza');

        $res->assertStatus(200);
        $this->assertGreaterThanOrEqual(1, count($res->json('data.data')));
    }

    // ------------------------------------------------------------------
    // CU07 - Actualizar y baja lógica de cliente
    // ------------------------------------------------------------------

    public function test_cu07_actualiza_y_da_baja_logica(): void
    {
        $admin = $this->usuarioConRol('admin');
        $cliente = Cliente::firstOrFail();

        $this->withHeaders($this->bearer($admin))
            ->putJson("/api/cu07/clientes/{$cliente->id}", ['telefono' => '+591 71111111'])
            ->assertStatus(200)
            ->assertJsonPath('data.telefono', '+591 71111111');

        $this->withHeaders($this->bearer($admin))
            ->deleteJson("/api/cu07/clientes/{$cliente->id}/baja", ['motivo_baja' => 'Mudanza'])
            ->assertStatus(200)
            ->assertJsonPath('data.estado', 'INACTIVO');

        $this->assertSoftDeleted('clientes', ['id' => $cliente->id]);
    }

    // ------------------------------------------------------------------
    // CU08 - Registrar y activar servicio
    // ------------------------------------------------------------------

    public function test_cu08_registra_y_activa_servicio_sincronizando_estado(): void
    {
        $admin = $this->usuarioConRol('admin');
        $headers = $this->bearer($admin);
        $cliente = Cliente::firstOrFail();

        $crear = $this->withHeaders($headers)->postJson('/api/cu08/servicios', [
            'cliente_id'            => $cliente->id,
            'plan_nombre'           => 'Plan Test 60',
            'velocidad_mbps'        => 60,
            'precio_mensual'        => 180.00,
            'direccion_instalacion' => 'Calle 1',
            'dia_corte'             => 10,
        ]);

        $crear->assertStatus(201);
        $id = $crear->json('data.id');

        $this->assertDatabaseHas('servicios_internet', [
            'id'              => $id,
            'estado_servicio' => 'PENDIENTE_INSTALACION',
        ]);

        $this->withHeaders($headers)
            ->putJson("/api/cu08/servicios/{$id}/activar", [
                'ip_asignada' => '10.0.0.9',
                'mac_router'  => 'E4:8D:8C:1A:2B:3C',
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.estado_servicio', 'ACTIVO');

        $servicio = ServicioInternet::findOrFail($id);
        $this->assertSame(
            EstadoServicio::where('nombre_estado', 'ACTIVO')->value('id'),
            $servicio->estado_servicio_id
        );
    }

    // ------------------------------------------------------------------
    // CU09 - Generar mensualidades
    // ------------------------------------------------------------------

    public function test_cu09_genera_mensualidades_sin_duplicar(): void
    {
        $admin = $this->usuarioConRol('admin');
        $headers = $this->bearer($admin);
        $periodo = '2026-09';

        $r1 = $this->withHeaders($headers)->postJson('/api/cu09/mensualidades/generar', ['periodo' => $periodo]);
        $r1->assertStatus(200);
        $this->assertSame(1, $r1->json('data.generadas'));

        $r2 = $this->withHeaders($headers)->postJson('/api/cu09/mensualidades/generar', ['periodo' => $periodo]);
        $r2->assertStatus(200)->assertJsonPath('data.generadas', 0);

        $this->assertSame(1, MensualidadFacturacion::where('periodo', $periodo)->count());
    }

    // ------------------------------------------------------------------
    // CU10 - Gestionar pago de mensualidad
    // ------------------------------------------------------------------

    public function test_cu10_exige_monto_exacto_y_no_repite_pago(): void
    {
        $secretaria = $this->usuarioConRol('secretaria');
        $headers = $this->bearer($secretaria);
        $servicio = $this->servicioSembrado();
        $plan = $servicio->asignacionPlanActual?->plan;
        $this->assertNotNull($plan);
        $mensualidad = $this->crearMensualidad($servicio, ['monto' => 250.00]);

        // Monto incorrecto (parcial) -> 422
        $this->withHeaders($headers)->postJson('/api/cu10/pagos', [
            'mensualidad_id' => $mensualidad->id,
            'monto_pagado'   => 0.01,
            'metodo_pago'    => 'EFECTIVO',
        ])->assertStatus(422);

        // Monto exacto -> 201 y mensualidad pagada
        $this->withHeaders($headers)->postJson('/api/cu10/pagos', [
            'mensualidad_id' => $mensualidad->id,
            'monto_pagado'   => 250.00,
            'metodo_pago'    => 'EFECTIVO',
        ])->assertStatus(201)->assertJsonPath('data.mensualidad.estado_pago', 'PAGADO');

        // Repetir el pago -> 422
        $this->withHeaders($headers)->postJson('/api/cu10/pagos', [
            'mensualidad_id' => $mensualidad->id,
            'monto_pagado'   => 250.00,
            'metodo_pago'    => 'EFECTIVO',
        ])->assertStatus(422);
    }

    public function test_cu10_portal_cliente_consulta_ci_no_registrado_retorna_404(): void
    {
        $res = $this->getJson('/api/cu10/portal-cliente/consultar/9999999999');
        $res->assertStatus(404);
        $res->assertJsonFragment(['success' => false]);
    }

    public function test_cu10_portal_cliente_consulta_con_deuda_y_pago_en_linea(): void
    {
        $servicio = $this->servicioSembrado();
        $cliente = $servicio->cliente;
        $ci = $cliente->ci;

        // Crear una factura pendiente
        $mensualidad = $this->crearMensualidad($servicio, ['monto' => 180.00]);

        // Consulta pública por CI
        $resConsulta = $this->getJson('/api/cu10/portal-cliente/consultar/' . $ci);
        $resConsulta->assertStatus(200);
        $resConsulta->assertJsonPath('data.tiene_deuda', true);
        $resConsulta->assertJsonPath('data.factura.id', $mensualidad->id);
        $this->assertNotEmpty($resConsulta->json('data.fecha_corte'));
        $this->assertNotNull($resConsulta->json('data.dias_habiles_restantes'));

        // Pago en línea mediante QR
        $resPago = $this->postJson('/api/cu10/portal-cliente/pagar', [
            'mensualidad_id' => $mensualidad->id,
            'monto_pagado'   => 180.00,
            'metodo_pago'    => 'QR',
        ]);
        $resPago->assertStatus(201);
        $this->assertNotEmpty($resPago->json('data.recibo.codigo_recibo'));

        // Comprobar que en la base de datos la mensualidad ahora está pagada
        $this->assertEquals('PAGADO', $mensualidad->fresh()->estado_pago);

        // Volver a consultar por CI: si no hay más facturas pendientes, tiene_deuda debe ser false
        $resPostPago = $this->getJson('/api/cu10/portal-cliente/consultar/' . $ci);
        $resPostPago->assertStatus(200);
        // Si no quedan otras facturas pendientes de este cliente
        $facturasRestantes = MensualidadFacturacion::where('idCliente', $cliente->id)
            ->where('estado_pago', 'PENDIENTE')->count();
        $this->assertEquals($facturasRestantes > 0, $resPostPago->json('data.tiene_deuda'));
    }

    // ------------------------------------------------------------------
    // CU11 - Historial de pagos
    // ------------------------------------------------------------------


    public function test_cu11_historial_filtra_por_metodo(): void
    {
        $secretaria = $this->usuarioConRol('secretaria');
        $headers = $this->bearer($secretaria);
        $servicio = $this->servicioSembrado();
        $plan = $servicio->asignacionPlanActual?->plan ?? \App\Models\Paquetes\ServiciosPlanes\Planes\PlanInternet::first();
        $mensualidad = $this->crearMensualidad($servicio, ['monto' => 250.00]);

        $this->withHeaders($headers)->postJson('/api/cu10/pagos', [
            'mensualidad_id' => $mensualidad->id,
            'monto_pagado'   => 250.00,
            'metodo_pago'    => 'QR',
        ])->assertStatus(201);

        $res = $this->withHeaders($headers)->getJson('/api/cu11/historial?metodo_pago=QR');
        $res->assertStatus(200);
        $this->assertGreaterThanOrEqual(1, count($res->json('data.data')));

        $pagoId = $res->json('data.data.0.id');
        $res->assertJsonPath('data.data.0.detalles.0.mensualidad.periodo', '2026-08');
        $res->assertJsonPath('data.data.0.detalles.0.mensualidad.servicio.codigo_servicio', 'SRV-88201');

        // Búsqueda por código de servicio y consulta inmutable del comprobante.
        $this->withHeaders($headers)
            ->getJson('/api/cu11/historial?buscar=SRV-88201&periodo=2026-08')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data.data');

        $this->withHeaders($headers)
            ->getJson("/api/cu11/historial?plan_id={$plan->idPlan}")
            ->assertStatus(200)
            ->assertJsonCount(1, 'data.data');

        $this->withHeaders($headers)
            ->getJson("/api/cu11/historial/{$pagoId}")
            ->assertStatus(200)
            ->assertJsonPath('data.id', $pagoId)
            ->assertJsonPath('data.detalles.0.mensualidad.cliente.id', $servicio->cliente_id);

        $this->withHeaders($headers)
            ->getJson('/api/cu11/historial/filtros')
            ->assertStatus(200)
            ->assertJsonFragment([
                'id' => $plan->idPlan,
                'nombre' => $plan->nombrePlan,
                'velocidad_mbps' => $plan->velocidadMbps,
            ]);
    }

    // ------------------------------------------------------------------
    // CU12 - Alertas de vencimiento
    // ------------------------------------------------------------------

    public function test_cu12_alertas_incluye_vencidas(): void
    {
        $admin = $this->usuarioConRol('admin');
        $servicio = $this->servicioSembrado();

        $this->crearMensualidad($servicio, [
            'fecha_vencimiento' => now()->subDays(20)->toDateString(),
            'monto'             => 250.00,
        ]);

        $res = $this->withHeaders($this->bearer($admin))->getJson('/api/cu12/alertas');
        $res->assertStatus(200);
        $this->assertGreaterThanOrEqual(1, $res->json('data.total_alertas'));
    }

    // ------------------------------------------------------------------
    // CU13 - Listado de servicios para corte
    // ------------------------------------------------------------------

    public function test_cu13_lista_solo_servicios_con_mora(): void
    {
        $admin = $this->usuarioConRol('admin');
        $headers = $this->bearer($admin);
        $servicio = $this->servicioSembrado();

        // Sin mora -> no aparece.
        $sin = $this->withHeaders($headers)->getJson('/api/cu13/servicios-corte');
        $sin->assertStatus(200);
        $this->assertSame(0, count($sin->json('data.data')));

        // Con mensualidad vencida hace 20 días -> aparece con datos calculados.
        $this->crearMensualidad($servicio, [
            'fecha_vencimiento' => now()->subDays(20)->toDateString(),
            'monto'             => 250.00,
        ]);

        $con = $this->withHeaders($headers)->getJson('/api/cu13/servicios-corte');
        $con->assertStatus(200);
        $this->assertSame(1, count($con->json('data.data')));

        $fila = $con->json('data.data.0');
        $this->assertSame(250.0, (float) $fila['monto_deuda']);
        $this->assertGreaterThanOrEqual(20, (int) $fila['dias_mora']);
    }

    // ------------------------------------------------------------------
    // CU14 - Registrar corte
    // ------------------------------------------------------------------

    public function test_cu14_corta_servicio_activo_y_rechaza_estado_invalido(): void
    {
        $admin = $this->usuarioConRol('admin');
        $headers = $this->bearer($admin);
        $servicio = $this->servicioSembrado();

        $r = $this->withHeaders($headers)->postJson('/api/cu14/cortes', [
            'servicio_id' => $servicio->id,
            'tipo_corte'  => 'LOGICO',
            'motivo'      => 'Mora',
        ]);
        $r->assertStatus(201)->assertJsonPath('data.servicio.estado_servicio', 'CORTADO');

        $servicio->refresh();
        $this->assertSame('CORTADO', $servicio->estado_servicio);
        $this->assertSame(
            EstadoServicio::where('nombre_estado', 'CORTADO')->value('id'),
            $servicio->estado_servicio_id
        );

        // Cortar un servicio ya CORTADO -> 422.
        $this->withHeaders($headers)->postJson('/api/cu14/cortes', [
            'servicio_id' => $servicio->id,
            'tipo_corte'  => 'LOGICO',
            'motivo'      => 'Otra',
        ])->assertStatus(422);
    }

    // ------------------------------------------------------------------
    // CU15 - Reactivaciones
    // ------------------------------------------------------------------

    public function test_cu15_reactiva_servicio_cortado(): void
    {
        $admin = $this->usuarioConRol('admin');
        $headers = $this->bearer($admin);
        $servicio = $this->servicioSembrado();

        // Reactivar un servicio ACTIVO -> 422.
        $this->withHeaders($headers)->postJson('/api/cu15/reactivaciones', [
            'servicio_id' => $servicio->id,
        ])->assertStatus(422);

        // Cortar y luego reactivar.
        $this->withHeaders($headers)->postJson('/api/cu14/cortes', [
            'servicio_id' => $servicio->id,
            'tipo_corte'  => 'LOGICO',
            'motivo'      => 'Mora',
        ])->assertStatus(201);

        $r = $this->withHeaders($headers)->postJson('/api/cu15/reactivaciones', [
            'servicio_id'        => $servicio->id,
            'costo_reactivacion' => 20.00,
            'observaciones'      => 'Pago de reconexión',
        ]);
        $r->assertStatus(201)->assertJsonPath('data.servicio.estado_servicio', 'ACTIVO');

        $servicio->refresh();
        $this->assertSame('ACTIVO', $servicio->estado_servicio);
        $this->assertSame(
            EstadoServicio::where('nombre_estado', 'ACTIVO')->value('id'),
            $servicio->estado_servicio_id
        );
        $this->assertSame(1, ReactivacionServicio::where('servicio_id', $servicio->id)->count());
    }

    // ------------------------------------------------------------------
    // CU02 - Bitácora de auditoría
    // ------------------------------------------------------------------

    public function test_cu02_bitacora_registra_y_consulta(): void
    {
        $admin = $this->usuarioConRol('admin');
        $headers = $this->bearer($admin);

        $this->withHeaders($headers)->postJson('/api/cu04/zonas', [
            'codigo'          => 'ZON-AUD',
            'nombre'          => 'Zona Auditoría',
            'ciudad'          => 'La Paz',
            'tecnologia'      => 'FTTH',
            'capacidad_nodos' => 10,
        ])->assertStatus(201);

        $this->assertDatabaseHas('bitacora_auditorias', [
            'modulo' => 'CU04',
            'accion' => 'CREAR_ZONA',
        ]);

        $res = $this->withHeaders($headers)->getJson('/api/cu02/auditoria?modulo=CU04');
        $res->assertStatus(200);
        $this->assertGreaterThanOrEqual(1, count($res->json('data.data')));
    }

    public function test_cu02_filtra_por_usuario_y_lista_usuarios_de_bitacora(): void
    {
        $admin = $this->usuarioConRol('admin');
        $sinActividad = $this->usuarioConRol('admin', ['email' => 'sin.actividad@telcom.com']);
        $headers = $this->bearer($admin);

        // Una operación del administrador deja registro en la bitácora.
        $this->withHeaders($headers)->postJson('/api/cu04/zonas', [
            'codigo'          => 'ZON-AUD2',
            'nombre'          => 'Zona Usuario',
            'ciudad'          => 'La Paz',
            'tecnologia'      => 'FTTH',
            'capacidad_nodos' => 10,
        ])->assertStatus(201);

        // El filtro por usuario devuelve solo los registros de ese usuario.
        $res = $this->withHeaders($headers)
            ->getJson('/api/cu02/auditoria?user_id=' . $admin->id);
        $res->assertStatus(200);
        $filas = $res->json('data.data');
        $this->assertNotEmpty($filas);
        foreach ($filas as $fila) {
            $this->assertSame($admin->id, $fila['user_id']);
        }

        // Un usuario sin actividad no devuelve registros.
        $resVacio = $this->withHeaders($headers)
            ->getJson('/api/cu02/auditoria?user_id=' . $sinActividad->id);
        $this->assertCount(0, $resVacio->json('data.data'));

        // El listado de usuarios ofrece al usuario con actividad y no al resto.
        $resUsuarios = $this->withHeaders($headers)->getJson('/api/cu02/auditoria/usuarios');
        $resUsuarios->assertStatus(200);
        $ids = collect($resUsuarios->json('data'))->pluck('id')->all();
        $this->assertContains($admin->id, $ids);
        $this->assertNotContains($sinActividad->id, $ids);
    }

    // ------------------------------------------------------------------
    // CU03 - Activar/desactivar usuario interno
    // ------------------------------------------------------------------

    public function test_cu03_activa_y_desactiva_usuario(): void
    {
        $admin = $this->usuarioConRol('admin');
        $objetivo = $this->usuarioConRol('tecnico');

        $this->withHeaders($this->bearer($admin))
            ->putJson("/api/cu03/usuarios/{$objetivo->id}", ['activo' => false])
            ->assertStatus(200)
            ->assertJsonPath('data.activo', false);

        $this->assertFalse($objetivo->fresh()->activo);
    }
}
