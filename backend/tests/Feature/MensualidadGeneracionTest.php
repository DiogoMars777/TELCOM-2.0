<?php

namespace Tests\Feature;

use App\Models\Paquetes\FacturacionCobranza\CU09_GenerarMensualidades\MensualidadFacturacion;
use App\Models\Paquetes\SeguridadAdministracion\CU02_BitacoraAuditoria\BitacoraAuditoria;
use App\Models\Paquetes\SeguridadAdministracion\CU03_UsuariosRolesPermisos\Rol;
use App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio\EstadoServicio;
use App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio\ServicioInternet;
use App\Models\User;
use App\Services\Paquetes\FacturacionCobranza\CU09_GenerarMensualidades\MensualidadGeneracionService;
use Carbon\Carbon;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class MensualidadGeneracionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    private function servicio(): ServicioInternet
    {
        return ServicioInternet::where('codigo_servicio', 'SRV-88201')->firstOrFail();
    }

    private function autorizar(): User
    {
        $usuario = User::factory()->create([
            'rol_id' => Rol::where('slug', 'admin')->firstOrFail()->id,
            'activo' => true,
        ]);
        $this->actingAs($usuario, 'sanctum');

        return $usuario;
    }

    public function test_generacion_manual_conserva_tarifa_estado_periodo_fechas_y_auditoria(): void
    {
        $this->travelTo(Carbon::parse('2031-01-31 15:00:00'));
        $usuario = $this->autorizar();
        $servicio = $this->servicio();
        $servicio->asignacionPlanActual->update(['precioAplicado' => 237.50]);
        $servicio->update(['dia_corte' => 31]);

        $this->postJson('/api/cu09/mensualidades/generar', ['periodo' => '2031-02'])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.periodo', '2031-02')
            ->assertJsonPath('data.generadas', 1)
            ->assertJsonPath('data.omitidas', 0);

        $mensualidad = MensualidadFacturacion::sole();
        $this->assertSame('237.50', $mensualidad->monto);
        $this->assertSame('PENDIENTE', $mensualidad->estado_pago);
        $this->assertSame('2031-02', $mensualidad->periodo);
        $this->assertSame($servicio->id, $mensualidad->servicio_id);
        $this->assertSame($servicio->cliente_id, $mensualidad->cliente_id);
        $this->assertSame('2031-01-31', $mensualidad->fecha_emision->toDateString());
        $this->assertSame('2031-02-28', $mensualidad->fecha_vencimiento->toDateString());
        $this->assertMatchesRegularExpression('/^FAC-2031-02-[A-Z0-9]{4}$/', $mensualidad->codigo_factura);

        $auditoria = BitacoraAuditoria::where('modulo', 'CU09')->sole();
        $this->assertSame('GENERAR_MENSUALIDADES', $auditoria->accion);
        $this->assertSame($usuario->id, $auditoria->user_id);
        $this->assertSame('MANUAL', $auditoria->datosNuevos['origen']);
        $this->assertSame(1, $auditoria->datosNuevos['generadas']);

        $this->getJson('/api/cu09/mensualidades?periodo=2031-02')
            ->assertOk()->assertJsonPath('data.data.0.periodo', '2031-02');
        $this->getJson('/api/cu09/mensualidades?periodo=2031-03')
            ->assertOk()->assertJsonCount(0, 'data.data');
    }

    public static function fechasVencimiento(): array
    {
        return [
            'corte anterior a emisión' => ['2026-10-14 12:00:00', '2026-10', 10, '2026-11-10'],
            'corte posterior a emisión' => ['2026-10-09 12:00:00', '2026-10', 10, '2026-10-10'],
            'corte el mismo día de emisión' => ['2026-10-10 23:59:59', '2026-10', 10, '2026-10-10'],
            'período futuro' => ['2026-10-14 12:00:00', '2026-12', 10, '2026-12-10'],
            'período atrasado varios meses' => ['2026-10-14 12:00:00', '2026-07', 10, '2026-11-10'],
            'cambio de año' => ['2026-12-14 12:00:00', '2026-12', 10, '2027-01-10'],
            'conserva corte 31 si existe' => ['2026-10-14 12:00:00', '2026-10', 31, '2026-10-31'],
            'mes de 30 días' => ['2026-04-15 12:00:00', '2026-04', 31, '2026-04-30'],
            'febrero no bisiesto' => ['2027-02-14 12:00:00', '2027-02', 31, '2027-02-28'],
            'febrero bisiesto' => ['2028-02-14 12:00:00', '2028-02', 31, '2028-02-29'],
            'traslado a febrero sin desbordar' => ['2026-01-31 12:00:00', '2026-01', 30, '2026-02-28'],
            'recupera corte 31 después de febrero' => ['2026-03-01 12:00:00', '2026-02', 31, '2026-03-31'],
        ];
    }

    #[DataProvider('fechasVencimiento')]
    public function test_fecha_vencimiento_nunca_es_anterior_a_fecha_emision(
        string $emision, string $periodo, int $diaCorte, string $vencimientoEsperado
    ): void {
        $this->travelTo(Carbon::parse($emision, config('app.timezone')));
        $this->autorizar();
        $this->servicio()->update(['dia_corte' => $diaCorte]);

        $this->postJson('/api/cu09/mensualidades/generar', ['periodo' => $periodo])
            ->assertOk()->assertJsonPath('data.generadas', 1);

        $mensualidad = MensualidadFacturacion::sole();
        $this->assertSame(substr($emision, 0, 10), $mensualidad->fecha_emision->toDateString());
        $this->assertSame($vencimientoEsperado, $mensualidad->fecha_vencimiento->toDateString());
        $this->assertTrue($mensualidad->fecha_vencimiento->gte($mensualidad->fecha_emision),
            'El vencimiento guardado no debe ser anterior a la emisión.');
    }

    public function test_segunda_ejecucion_no_duplica_ni_cambia_una_mensualidad_valida(): void
    {
        $this->autorizar();
        $this->postJson('/api/cu09/mensualidades/generar', ['periodo' => '2031-03'])
            ->assertOk()->assertJsonPath('data.generadas', 1);
        $original = MensualidadFacturacion::sole()->getAttributes();
        $this->servicio()->asignacionPlanActual->update(['precioAplicado' => 999]);

        $this->postJson('/api/cu09/mensualidades/generar', ['periodo' => '2031-03'])
            ->assertOk()->assertJsonPath('data.generadas', 0);

        $this->assertSame($original, MensualidadFacturacion::sole()->getAttributes());
        $this->assertSame(2, BitacoraAuditoria::where('modulo', 'CU09')->count());
    }

    public static function tarifasInvalidas(): array
    {
        return [
            'sin plan asignado' => [null],
            'cero' => [0],
            'negativa' => [-10],
            'no numérica' => ['sin tarifa'],
        ];
    }

    #[DataProvider('tarifasInvalidas')]
    public function test_omite_tarifa_invalida_y_continua_con_otros_servicios($tarifa): void
    {
        $this->autorizar();
        $invalido = $this->servicio();
        $asignacion = $invalido->asignacionPlanActual;
        $valido = $invalido->replicate();
        $valido->codigo_servicio = 'SRV-CU09-VALIDO';
        $valido->save();
        $valido->asignacionesPlan()->create([
            'idPlan' => $asignacion->idPlan,
            'precioAplicado' => 345.67,
            'fechaInicio' => now()->toDateString(),
        ]);
        if ($tarifa === null) {
            $asignacion->delete();
        } else {
            $asignacion->update(['precioAplicado' => $tarifa]);
        }

        $this->postJson('/api/cu09/mensualidades/generar', ['periodo' => '2031-04'])
            ->assertOk()
            ->assertJsonPath('data.generadas', 1)
            ->assertJsonPath('data.omitidas', 1)
            ->assertJsonPath('data.detalle_omitidas.0.servicio_id', $invalido->id)
            ->assertJsonPath('data.detalle_omitidas.0.motivo', 'SIN_TARIFA_VALIDA');

        $this->assertSame($valido->id, MensualidadFacturacion::sole()->servicio_id);
        $this->assertSame('345.67', MensualidadFacturacion::sole()->monto);
        $this->assertSame(1, BitacoraAuditoria::where('modulo', 'CU09')->sole()->datosNuevos['omitidas']);
    }

    public function test_servicio_reutilizable_usa_precio_del_plan_si_no_hay_precio_aplicado(): void
    {
        $servicio = $this->servicio();
        $asignacion = $servicio->asignacionPlanActual;
        $asignacion->update(['precioAplicado' => null]);
        $asignacion->plan->update(['precioMensual' => 315.25]);

        $resultado = app(MensualidadGeneracionService::class)->generar('2031-05');

        $this->assertSame(1, $resultado['generadas']);
        $this->assertSame('315.25', MensualidadFacturacion::sole()->monto);
    }

    public function test_no_genera_para_servicios_inactivos_o_incompletos(): void
    {
        $servicio = $this->servicio();
        $servicio->update(['estado_servicio_id' => EstadoServicio::where('nombreEstado', 'CORTADO')->value('idEstadoServicio')]);
        $generador = app(MensualidadGeneracionService::class);
        $this->assertSame(0, $generador->generar('2031-06')['generadas']);

        $servicio->update([
            'estado_servicio_id' => EstadoServicio::where('nombreEstado', 'ACTIVO')->value('idEstadoServicio'),
            'cliente_id' => null,
        ]);
        $resultado = $generador->generar('2031-06');
        $this->assertSame(0, $resultado['generadas']);
        $this->assertSame('DATOS_SERVICIO_INCOMPLETOS', $resultado['detalle_omitidas'][0]['motivo']);
        $this->assertDatabaseCount('Mensualidad', 0);
    }

    public function test_conserva_reparacion_de_monto_incompleto_solo_con_tarifa_real(): void
    {
        $servicio = $this->servicio();
        $mensualidad = MensualidadFacturacion::create([
            'servicio_id' => $servicio->id,
            'cliente_id' => $servicio->cliente_id,
            'periodo' => '2031-07',
            'monto' => null,
            'estado_pago' => 'PENDIENTE',
        ]);
        $generador = app(MensualidadGeneracionService::class);
        $asignacion = $servicio->asignacionPlanActual;
        $asignacion->update(['precioAplicado' => 0]);
        $this->assertSame(0, $generador->generar('2031-07')['generadas']);
        $this->assertNull($mensualidad->fresh()->monto);

        $asignacion->update(['precioAplicado' => 190.75]);
        $this->assertSame(1, $generador->generar('2031-07')['generadas']);
        $this->assertSame('190.75', $mensualidad->fresh()->monto);
        $this->assertDatabaseCount('Mensualidad', 1);
    }

    public function test_comando_genera_mes_actual_audita_como_sistema_y_comparte_idempotencia_con_http(): void
    {
        $this->travelTo(Carbon::parse('2032-01-01 00:01:00', config('app.timezone')));
        $this->artisan('cu09:generar-mensualidades')
            ->expectsOutput('Período 2032-01: 1 mensualidades generadas.')
            ->assertSuccessful();

        $mensualidad = MensualidadFacturacion::sole();
        $this->assertSame('2032-01', $mensualidad->periodo);
        $this->assertSame('PENDIENTE', $mensualidad->estado_pago);
        $this->assertSame('2032-01-10', $mensualidad->fecha_vencimiento->toDateString());
        $auditoria = BitacoraAuditoria::where('modulo', 'CU09')->sole();
        $this->assertNull($auditoria->user_id);
        $this->assertSame('SISTEMA', $auditoria->datosNuevos['origen']);

        $this->artisan('cu09:generar-mensualidades')
            ->expectsOutput('Período 2032-01: 0 mensualidades generadas.')
            ->assertSuccessful();
        $this->autorizar();
        $this->postJson('/api/cu09/mensualidades/generar', ['periodo' => '2032-01'])
            ->assertOk()->assertJsonPath('data.generadas', 0);
        $this->assertDatabaseCount('Mensualidad', 1);
        $this->assertSame(3, BitacoraAuditoria::where('modulo', 'CU09')->count());
    }

    public function test_comando_reutiliza_el_servicio_y_muestra_las_omisiones(): void
    {
        $periodo = now()->format('Y-m');
        $this->mock(MensualidadGeneracionService::class, function ($mock) use ($periodo) {
            $mock->shouldReceive('generar')->once()->with($periodo, 'SISTEMA')->andReturn([
                'periodo' => $periodo,
                'generadas' => 0,
                'omitidas' => 1,
                'detalle_omitidas' => [['servicio_id' => 99, 'motivo' => 'SIN_TARIFA_VALIDA']],
            ]);
        });

        $this->artisan('cu09:generar-mensualidades')
            ->expectsOutput('Servicio 99 omitido: SIN_TARIFA_VALIDA.')
            ->assertSuccessful();
    }

    public function test_scheduler_registra_una_ejecucion_mensual_de_cu09(): void
    {
        $eventos = array_values(array_filter(app(Schedule::class)->events(),
            fn ($evento) => str_contains($evento->command ?? '', 'cu09:generar-mensualidades')));

        $this->assertCount(1, $eventos);
        $this->assertSame('0 0 1 * *', $eventos[0]->expression);
        $this->assertSame(config('app.timezone'), $eventos[0]->timezone);
        $this->assertTrue($eventos[0]->withoutOverlapping);
    }

    public function test_generacion_manual_rechaza_periodos_invalidos(): void
    {
        $this->autorizar();
        $this->postJson('/api/cu09/mensualidades/generar', ['periodo' => '2031-13'])
            ->assertUnprocessable()->assertJsonValidationErrors('periodo');
        $this->assertDatabaseCount('Mensualidad', 0);
        $this->assertSame(0, BitacoraAuditoria::where('modulo', 'CU09')->count());
    }
}
