<?php

namespace Tests\Feature;

use App\Models\Paquetes\P1_SeguridadAdministracion\CU03_UsuariosRolesPermisos\Permiso;
use App\Models\Paquetes\P1_SeguridadAdministracion\CU03_UsuariosRolesPermisos\Rol;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class Cu31ReporteInteligenteApiTest extends TestCase
{
    use RefreshDatabase;

    private const URL = '/api/cu31/reportes/generar';

    private int $zona;
    private int $producto;

    protected function beforeRefreshingDatabase(): void
    {
        $this->assertSame('sqlite', config('database.default'));
        $this->assertSame(':memory:', config('database.connections.sqlite.database'));
    }

    protected function migrateDatabases(): void
    {
        // Esquema vacío en memoria: nunca se ejecuta migrate:fresh ni se toca PostgreSQL.
        $this->artisan('migrate', ['--force' => true])->assertExitCode(0);
    }

    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
        config(['services.gemini.key' => null, 'services.gemini.model' => 'modelo-cu31-test']);
        $this->travelTo(Carbon::parse('2026-11-20 10:00:00', config('app.timezone')));
    }

    private function autenticar(bool $permiso = true): User
    {
        $rol = Rol::create(['nombre' => 'Administrador CU31', 'slug' => 'cu31-test', 'activo' => true]);
        if ($permiso) {
            $p = Permiso::create(['nombre' => 'Ver reportes', 'slug' => 'reportes.view', 'modulo' => 'REPORTES']);
            $rol->permisos()->attach($p->id);
        }
        $usuario = User::factory()->create(['rol_id' => $rol->id, 'activo' => true]);
        $this->withToken($usuario->createToken('cu31-test')->plainTextToken);

        return $usuario;
    }

    private function generar(string $tipo, array $filtros = [])
    {
        return $this->postJson(self::URL, ['intencion' => ['tipo' => $tipo, 'filtros' => $filtros]]);
    }

    private function fixtures(): void
    {
        $this->zona = DB::table('Zona')->insertGetId(['nombreZona' => 'Norte'], 'idZona');
        $sur = DB::table('Zona')->insertGetId(['nombreZona' => 'Sur'], 'idZona');
        $clientes = [];
        foreach ([[$this->zona, 'ACTIVO', null], [$sur, 'ACTIVO', null], [$sur, 'INACTIVO', '2026-10-15'], [null, 'ACTIVO', null]] as $i => [$zona, $estado, $baja]) {
            $clientes[] = DB::table('Cliente')->insertGetId([
                'codigoCliente' => 'CU31-'.$i, 'nombreCompleto' => 'Cliente '.$i, 'estadoCliente' => $estado,
                'idZona' => $zona, 'fechaBaja' => $baja,
            ], 'idCliente');
        }
        $servicios = [];
        foreach (['ACTIVO', 'SUSPENDIDO', 'ACTIVO'] as $i => $estado) {
            $estadoId = DB::table('EstadoServicio')->insertGetId(['nombreEstado' => $estado], 'idEstadoServicio');
            $servicios[] = DB::table('ServicioInternet')->insertGetId([
                'idCliente' => $clientes[$i], 'idZona' => $i === 0 ? $this->zona : $sur, 'idEstadoServicio' => $estadoId,
            ], 'idServicio');
        }
        $mensualidades = [];
        foreach ([['2026-11', 'PENDIENTE', '100.25'], ['2026-11', 'PENDIENTE', '200.10'], ['2026-10', 'PAGADO', '90.00']] as $i => [$periodo, $estado, $monto]) {
            $mensualidades[] = DB::table('Mensualidad')->insertGetId([
                'periodo' => $periodo, 'estado' => $estado, 'monto' => $monto, 'idServicio' => $servicios[$i], 'idCliente' => $clientes[$i],
            ], 'idMensualidad');
        }
        foreach ([['2026-11-01 00:00:00', '100.10'], ['2026-11-30 23:59:59.999', '150.25'], ['2026-10-31 23:59:59', '70.00'], ['2026-12-01 00:00:00', '999.00']] as $i => [$fecha, $monto]) {
            $pago = DB::table('Pago')->insertGetId(['fechaHora' => $fecha, 'montoTotal' => $monto], 'idPago');
            if ($i === 0) {
                // Un pago distribuido a dos facturas no puede duplicar los ingresos.
                foreach ($mensualidades as $mensualidad) {
                    DB::table('DetallePago')->insert(['idPago' => $pago, 'idMensualidad' => $mensualidad, 'montoAplicado' => 10]);
                }
            }
        }
        foreach ([['ONT', 5], ['Cable', 12], ['Router agotado', 0], ['Stock inconsistente', -1]] as [$nombre, $stock]) {
            $producto = DB::table('ProductoEquipo')->insertGetId(['nombre' => $nombre, 'tipoEquipo' => 'EQUIPO'], 'idProducto');
            DB::table('Inventario')->insert(['idProducto' => $producto, 'stockActual' => $stock]);
            if ($nombre === 'ONT') {
                $this->producto = $producto;
            }
        }
        foreach ([['FINALIZADO', '2026-10-10', '2026-11-02'], ['FINALIZADA', '2026-12-10', '2026-11-30'], ['PROGRAMADA', '2026-11-10', null], ['ASIGNADA', '2026-10-20', null]] as [$estado, $programada, $realizada]) {
            DB::table('Instalacion')->insert(['estadoInstalacion' => $estado, 'fechaProgramada' => $programada, 'fechaRealizada' => $realizada]);
        }
        DB::table('Proveedor')->insert([
            ['razonSocial' => 'Proveedor A', 'estado' => true],
            ['razonSocial' => 'Proveedor B', 'estado' => true],
            ['razonSocial' => 'Proveedor C', 'estado' => false],
        ]);
    }

    public function test_exige_autenticacion(): void
    {
        $this->generar('clientes_por_zona')->assertUnauthorized();
        Http::assertNothingSent();
    }

    public function test_usuario_sin_permiso_no_consulta_ni_invoca_gemini(): void
    {
        $this->autenticar(false);
        $this->postJson(self::URL, ['comando' => 'Clientes activos'])->assertForbidden();
        $this->generar('clientes_por_zona')->assertForbidden();
        Http::assertNothingSent();
    }

    public static function reportes(): array
    {
        return [
            ['clientes_por_zona', 'clientes', 4],
            ['servicios_por_estado', 'servicios', 3],
            ['ingresos_por_periodo', 'pagos', 2],
            ['mensualidades_por_estado', 'mensualidades', 3],
            ['inventario_disponible', 'productos', 2],
            ['instalaciones_por_estado_o_periodo', 'instalaciones', 4],
            ['proveedores_por_estado', 'proveedores', 3],
        ];
    }

    #[DataProvider('reportes')]
    public function test_autorizado_genera_cada_reporte_con_datos_reales_sin_key(string $tipo, string $total, int $cantidad): void
    {
        $this->autenticar();
        $this->fixtures();
        $res = $this->generar($tipo)->assertOk()->assertJsonPath('success', true)
            ->assertJsonPath('data.interpretacion.origen', 'estructurada')
            ->assertJsonPath('data.reporte.tipo', $tipo)
            ->assertJsonPath('data.reporte.totales.0.clave', $total)
            ->assertJsonPath('data.reporte.totales.0.valor', $cantidad)
            ->assertJsonStructure(['data' => ['interpretacion', 'reporte' => ['tipo', 'titulo', 'resumen', 'filtros', 'columnas', 'filas', 'totales', 'generado_en', 'truncado']]]);
        $this->assertNotEmpty($res->json('data.reporte.filas'));
        Http::assertNothingSent();
    }

    public function test_filtros_de_clientes_servicios_proveedores_e_inventario(): void
    {
        $this->autenticar();
        $this->fixtures();
        $this->generar('clientes_por_zona', ['estado' => 'ACTIVO', 'zona_id' => $this->zona])
            ->assertOk()->assertJsonPath('data.reporte.totales.0.valor', 1)->assertJsonPath('data.reporte.filas.0.zona', 'Norte');
        $this->generar('clientes_por_zona', ['estado' => 'INACTIVO'])
            ->assertOk()->assertJsonPath('data.reporte.totales.0.valor', 1);
        $this->generar('servicios_por_estado', ['estado' => 'ACTIVO'])
            ->assertOk()->assertJsonCount(1, 'data.reporte.filas')->assertJsonPath('data.reporte.totales.0.valor', 2);
        $this->generar('servicios_por_estado', ['zona_id' => $this->zona])->assertOk()->assertJsonPath('data.reporte.totales.0.valor', 1);
        $this->generar('inventario_disponible', ['producto_id' => $this->producto])
            ->assertOk()->assertJsonPath('data.reporte.totales.1.valor', 5);
        $this->generar('inventario_disponible')->assertOk()->assertJsonPath('data.reporte.totales.1.valor', 17);
        $this->generar('proveedores_por_estado', ['estado' => 'INACTIVO'])
            ->assertOk()->assertJsonPath('data.reporte.totales.0.valor', 1)->assertJsonPath('data.reporte.filas.0.razon_social', 'Proveedor C');
    }

    public function test_reporte_detallado_clientes_con_planes_y_filtro_por_zona_nombre(): void
    {
        $this->autenticar();
        $this->fixtures();
        $villa = DB::table('Zona')->insertGetId(['nombreZona' => 'Villa Primero de Mayo', 'barrio' => '1ro de Mayo'], 'idZona');
        $clienteVilla = DB::table('Cliente')->insertGetId([
            'codigoCliente' => 'CLI-VILLA', 'nombreCompleto' => 'Ana Villa', 'estadoCliente' => 'ACTIVO', 'idZona' => $villa,
        ], 'idCliente');
        $estadoActivo = DB::table('EstadoServicio')->where('nombreEstado', 'ACTIVO')->value('idEstadoServicio');
        $serv = DB::table('ServicioInternet')->insertGetId([
            'idCliente' => $clienteVilla, 'idZona' => $villa, 'idEstadoServicio' => $estadoActivo, 'codigoServicio' => 'SRV-VILLA-1',
        ], 'idServicio');
        $plan = DB::table('PlanInternet')->insertGetId([
            'nombrePlan' => 'Fibra Hogar 100', 'velocidadMbps' => 100, 'precioMensual' => '180.00', 'activo' => true,
        ], 'idPlan');
        DB::table('AsignacionPlan')->insert([
            'idServicio' => $serv, 'idPlan' => $plan, 'precioAplicado' => '180.00', 'fechaInicio' => '2026-11-01',
        ]);

        $this->generar('clientes_detalle_planes', ['zona_nombre' => 'Villa Primero de Mayo'])
            ->assertOk()
            ->assertJsonPath('data.reporte.totales.0.valor', 1)
            ->assertJsonPath('data.reporte.filas.0.cliente', 'Ana Villa')
            ->assertJsonPath('data.reporte.filas.0.plan', 'Fibra Hogar 100')
            ->assertJsonPath('data.reporte.filas.0.zona', 'Villa Primero de Mayo');

        $this->generar('planes_internet')->assertOk()->assertJsonPath('data.reporte.totales.0.valor', 1);
        $this->generar('zonas_cobertura', ['zona_nombre' => 'Villa'])->assertOk()->assertJsonPath('data.reporte.totales.0.valor', 1);
        $this->generar('cortes_y_mora')->assertOk()->assertJsonPath('data.reporte.totales.0.valor', 2);
    }

    public function test_ingresos_suma_pagos_una_vez_e_incluye_el_ultimo_dia(): void
    {
        $this->autenticar();
        $this->fixtures();
        $this->generar('ingresos_por_periodo', ['periodo' => 'este_mes'])->assertOk()
            ->assertJsonPath('data.reporte.filtros.fecha_desde', '2026-11-01')
            ->assertJsonPath('data.reporte.filtros.fecha_hasta', '2026-11-30')
            ->assertJsonPath('data.reporte.totales.1.valor', '250.35')
            ->assertJsonPath('data.reporte.filas.0.importe', '250.35');
        $this->generar('ingresos_por_periodo', ['periodo' => 'mes_anterior'])->assertOk()->assertJsonPath('data.reporte.totales.1.valor', '70.00');
        $this->generar('ingresos_por_periodo', ['fecha_desde' => '2026-11-30', 'fecha_hasta' => '2026-11-30'])
            ->assertOk()->assertJsonPath('data.reporte.totales.1.valor', '150.25');
        $this->generar('ingresos_por_periodo', ['periodo' => 'este_anio'])->assertOk()->assertJsonPath('data.reporte.totales.0.valor', 4);
    }

    public function test_mensualidades_usa_periodo_y_estado_sin_columnas_virtuales(): void
    {
        $this->autenticar();
        $this->fixtures();
        $this->generar('mensualidades_por_estado', ['estado' => 'PENDIENTE', 'periodo' => 'este_mes'])->assertOk()
            ->assertJsonPath('data.reporte.filtros.periodo', '2026-11')->assertJsonCount(1, 'data.reporte.filas')
            ->assertJsonPath('data.reporte.totales.0.valor', 2)->assertJsonPath('data.reporte.totales.1.valor', '300.35');
    }

    public function test_instalaciones_normaliza_estados_y_distingue_fecha_real_de_programada(): void
    {
        $this->autenticar();
        $this->fixtures();
        $this->generar('instalaciones_por_estado_o_periodo', ['estado' => 'FINALIZADO', 'periodo' => 'este_mes'])
            ->assertOk()->assertJsonPath('data.reporte.filtros.fecha_campo', 'realizada')
            ->assertJsonCount(1, 'data.reporte.filas')->assertJsonPath('data.reporte.filas.0.estado', 'FINALIZADA')
            ->assertJsonPath('data.reporte.totales.0.valor', 2);
        $this->generar('instalaciones_por_estado_o_periodo', ['periodo' => 'este_mes', 'fecha_campo' => 'programada'])
            ->assertOk()->assertJsonPath('data.reporte.totales.0.valor', 1);
    }

    public static function entradasInvalidas(): array
    {
        return [
            ['desconocido', []], ['DROP TABLE "Cliente"', []],
            ['clientes_por_zona', ['estado' => 'ACTIVO OR 1=1']],
            ['clientes_por_zona', ['zona_id' => '1; DROP TABLE "Cliente"']],
            ['clientes_por_zona', ['zona_id' => 999999]],
            ['clientes_por_zona', ['sql' => 'DELETE FROM "Cliente"']],
            ['proveedores_por_estado', ['estado' => true]],
            ['inventario_disponible', ['producto_id' => 999999]],
            ['ingresos_por_periodo', ['periodo' => '2026-13']],
            ['ingresos_por_periodo', ['periodo' => '0000-01']],
            ['ingresos_por_periodo', ['fecha_desde' => '2026-02-30', 'fecha_hasta' => '2026-03-01']],
            ['ingresos_por_periodo', ['fecha_desde' => '2026-12-01', 'fecha_hasta' => '2026-11-01']],
            ['ingresos_por_periodo', ['fecha_desde' => '2024-01-01', 'fecha_hasta' => '2026-11-01']],
            ['ingresos_por_periodo', ['fecha_desde' => '2026-11-01']],
            ['ingresos_por_periodo', ['periodo' => 'este_mes', 'fecha_desde' => '2026-11-01', 'fecha_hasta' => '2026-11-30']],
            ['mensualidades_por_estado', ['periodo' => 'este_anio']],
            ['instalaciones_por_estado_o_periodo', ['fecha_campo' => 'fechaHora; DELETE FROM "Pago"']],
        ];
    }

    #[DataProvider('entradasInvalidas')]
    public function test_rechaza_intenciones_y_filtros_fuera_del_contrato(string $tipo, array $filtros): void
    {
        $this->autenticar();
        $this->generar($tipo, $filtros)->assertUnprocessable();
        Http::assertNothingSent();
        $this->assertDatabaseCount('Bitacora', 0);
    }

    public function test_valida_el_cuerpo_y_da_prioridad_a_intencion_sin_reinterpretar(): void
    {
        $this->autenticar();
        foreach ([[], ['comando' => '  '], ['comando' => str_repeat('a', 1001)], ['comando' => []], ['intencion' => []], ['intencion' => ['tipo' => 'clientes_por_zona', 'sql' => 'SELECT 1']], ['comando' => 'Clientes', 'sql' => 'SELECT 1']] as $cuerpo) {
            $this->postJson(self::URL, $cuerpo)->assertUnprocessable();
        }
        $this->postJson(self::URL, ['comando' => 'texto que no debe interpretarse', 'intencion' => ['tipo' => 'inventario_disponible']])
            ->assertOk()->assertJsonPath('data.interpretacion.origen', 'estructurada');
        $this->postJson(self::URL, ['comando' => 'Clientes', 'intencion' => ['tipo' => 'desconocida']])->assertUnprocessable();
        Http::assertNothingSent();
    }

    private function simularGemini(mixed $intencion, string $fin = 'STOP'): void
    {
        config(['services.gemini.key' => 'clave-ficticia-cu31']);
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response([
            'candidates' => [['finishReason' => $fin, 'content' => ['parts' => [['text' => is_string($intencion) ? $intencion : json_encode($intencion)]]]]],
        ])]);
    }

    public function test_gemini_mockeado_solo_interpreta_y_no_recibe_datos_de_negocio(): void
    {
        $usuario = $this->autenticar();
        $this->fixtures();
        $this->simularGemini(['tipo' => 'clientes_por_zona', 'filtros' => ['estado' => 'ACTIVO']]);
        $this->postJson(self::URL, ['comando' => 'Muéstrame los clientes activos por zona.'])->assertOk()
            ->assertJsonPath('data.interpretacion.origen', 'gemini')->assertJsonPath('data.reporte.totales.0.valor', 3);
        Http::assertSent(function ($r) {
            $this->assertSame('https://generativelanguage.googleapis.com/v1beta/models/modelo-cu31-test:generateContent', $r->url());
            $this->assertTrue($r->hasHeader('x-goog-api-key', 'clave-ficticia-cu31'));
            $this->assertSame('application/json', $r['generationConfig']['responseMimeType']);
            $this->assertSame('Muéstrame los clientes activos por zona.', $r['contents'][0]['parts'][0]['text']);
            $this->assertStringNotContainsString('Cliente 0', $r->body());
            $this->assertStringContainsString('2026-11-20', $r['systemInstruction']['parts'][0]['text']);

            return true;
        });
        Http::assertSentCount(1);
        $auditoria = DB::table('Bitacora')->where('modulo', 'CU31')->first();
        $this->assertSame($usuario->id, $auditoria->idUsuario);
        $this->assertSame('GENERAR_REPORTE_INTELIGENTE', $auditoria->accion);
        $this->assertStringNotContainsString('clave-ficticia-cu31', json_encode($auditoria));
        $this->assertStringNotContainsString('Muéstrame', json_encode($auditoria));
        $this->assertStringNotContainsString('Cliente 0', json_encode($auditoria));
    }

    public function test_key_ausente_y_modelo_ausente_tienen_errores_claros(): void
    {
        $this->autenticar();
        $this->postJson(self::URL, ['comando' => 'Clientes activos'])->assertStatus(503)->assertJsonPath('errors.codigo', 'GEMINI_NO_CONFIGURADO');
        config(['services.gemini.key' => 'ficticia', 'services.gemini.model' => '']);
        $this->postJson(self::URL, ['comando' => 'Clientes activos'])->assertStatus(503)->assertJsonPath('errors.codigo', 'GEMINI_MODELO_NO_CONFIGURADO');
        Http::assertNothingSent();
    }

    public function test_error_http_gemini_no_expone_su_cuerpo(): void
    {
        $this->autenticar();
        config(['services.gemini.key' => 'clave-ficticia-cu31']);
        Http::fake(['*' => Http::response(['error' => 'clave-ficticia-cu31 datos privados'], 429)]);
        $res = $this->postJson(self::URL, ['comando' => 'Clientes activos'])->assertStatus(502)->assertJsonPath('errors.codigo', 'GEMINI_HTTP');
        $this->assertStringNotContainsString('clave-ficticia-cu31', $res->getContent());
    }

    public function test_timeout_gemini(): void
    {
        $this->autenticar();
        config(['services.gemini.key' => 'ficticia']);
        Http::fake(fn () => throw new ConnectionException('Tiempo agotado con información interna'));
        $this->postJson(self::URL, ['comando' => 'Clientes activos'])->assertStatus(504)->assertJsonPath('errors.codigo', 'GEMINI_TIMEOUT');
    }

    public static function respuestasInvalidas(): array
    {
        return [['no es JSON', 'STOP'], ['[]', 'STOP'], ['null', 'STOP'], ['{"tipo":', 'MAX_TOKENS'], ['{}', 'SAFETY']];
    }

    #[DataProvider('respuestasInvalidas')]
    public function test_respuesta_gemini_invalida(string $texto, string $fin): void
    {
        $this->autenticar();
        $this->simularGemini($texto, $fin);
        $this->postJson(self::URL, ['comando' => 'Clientes activos'])->assertStatus(502)->assertJsonPath('errors.codigo', 'GEMINI_RESPUESTA_INVALIDA');
    }

    public function test_no_ejecuta_sql_arbitrario_de_gemini_y_no_modifica_datos_de_negocio(): void
    {
        $this->autenticar();
        $this->fixtures();
        $antes = $this->snapshotNegocio();
        $consultas = [];
        DB::listen(function ($evento) use (&$consultas) { $consultas[] = $evento->sql; });
        foreach ([
            ['sql' => 'DROP TABLE "Cliente"'],
            ['tipo' => 'clientes_por_zona', 'filtros' => [], 'sql' => 'DELETE FROM "Pago"'],
            ['tipo' => 'clientes_por_zona', 'filtros' => ['sql' => 'UPDATE "Cliente" SET "estadoCliente" = \'INACTIVO\'']],
            ['tipo' => 'no_reconocida', 'filtros' => []],
        ] as $intencion) {
            $this->simularGemini($intencion);
            $this->postJson(self::URL, ['comando' => 'Generar reporte'])->assertUnprocessable();
        }
        foreach (array_keys(\App\Services\Paquetes\P7_DashboardReportesInteligenciaVoz\CU31_GenerarReporteInteligenteVoz\IntencionReporte::CATALOGO) as $tipo) {
            $this->generar($tipo)->assertOk();
        }
        $this->assertSame($antes, $this->snapshotNegocio());
        foreach ($consultas as $sql) {
            if ($sql === 'update "personal_access_tokens" set "last_used_at" = ?, "updated_at" = ? where "id" = ?') {
                // Sanctum actualiza el uso del token al autenticar; no es un dato de negocio.
                continue;
            }
            $this->assertDoesNotMatchRegularExpression('/^\s*(drop|delete|update|alter|truncate)\b/i', $sql);
            if (preg_match('/^\s*insert\b/i', $sql)) {
                $this->assertStringContainsString('Bitacora', $sql);
            }
        }
    }

    private function snapshotNegocio(): array
    {
        $datos = [];
        foreach (['Cliente', 'Zona', 'ServicioInternet', 'EstadoServicio', 'Mensualidad', 'Pago', 'DetallePago', 'Inventario', 'ProductoEquipo', 'Instalacion', 'Proveedor'] as $tabla) {
            $datos[$tabla] = json_encode(DB::table($tabla)->get());
        }

        return $datos;
    }

    public function test_resultado_vacio_y_limite_de_filas_con_totales_completos(): void
    {
        $this->autenticar();
        $this->generar('proveedores_por_estado')->assertOk()->assertJsonCount(0, 'data.reporte.filas')->assertJsonPath('data.reporte.totales.0.valor', 0);
        for ($i = 0; $i < 205; $i++) {
            DB::table('Proveedor')->insert(['razonSocial' => 'Proveedor '.str_pad((string) $i, 3, '0', STR_PAD_LEFT)]);
        }
        $this->generar('proveedores_por_estado')->assertOk()->assertJsonCount(200, 'data.reporte.filas')
            ->assertJsonPath('data.reporte.truncado', true)->assertJsonPath('data.reporte.totales.0.valor', 205);
    }
}
