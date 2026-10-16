<?php

namespace Tests\Feature;

use App\Models\Paquetes\FacturacionCobranza\CU09_GenerarMensualidades\Mensualidad;
use App\Models\Paquetes\FacturacionCobranza\CU09_GenerarMensualidades\MensualidadFacturacion;
use App\Models\Paquetes\FacturacionCobranza\CU10_GestionarPagoMensualidad\DetallePago;
use App\Models\Paquetes\FacturacionCobranza\CU10_GestionarPagoMensualidad\MetodoPago;
use App\Models\Paquetes\FacturacionCobranza\CU10_GestionarPagoMensualidad\Pago;
use App\Models\Paquetes\FacturacionCobranza\CU10_GestionarPagoMensualidad\PagoMensualidad;
use App\Models\Paquetes\GestionClientesZonas\CU04_ZonasCobertura\Zona;
use App\Models\Paquetes\GestionClientesZonas\CU04_ZonasCobertura\ZonaCobertura;
use App\Models\Paquetes\GestionClientesZonas\CU05_RegistrarCliente\Cliente;
use App\Models\Paquetes\SeguridadAdministracion\CU02_BitacoraAuditoria\Bitacora;
use App\Models\Paquetes\SeguridadAdministracion\CU02_BitacoraAuditoria\BitacoraAuditoria;
use App\Models\Paquetes\SeguridadAdministracion\CU03_UsuariosRolesPermisos\Permiso;
use App\Models\Paquetes\SeguridadAdministracion\CU03_UsuariosRolesPermisos\Rol;
use App\Models\Paquetes\SeguridadAdministracion\CU03_UsuariosRolesPermisos\RolPermiso;
use App\Models\Paquetes\SeguridadAdministracion\CU03_UsuariosRolesPermisos\Usuario;
use App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio\EstadoServicio;
use App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio\HistorialEstadoServicio;
use App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio\ServicioInternet;
use App\Models\Paquetes\ServiciosPlanes\CU14_RegistrarCorteRealizado\AccionServicio;
use App\Models\Paquetes\ServiciosPlanes\CU14_RegistrarCorteRealizado\RegistroCorte;
use App\Models\Paquetes\ServiciosPlanes\CU15_ListaRegistroReactivaciones\ReactivacionServicio;
use App\Models\Paquetes\ServiciosPlanes\CU16_GestionarCatalogoPlanes\PlanInternet;
use App\Models\Paquetes\ServiciosPlanes\CU17_AsignarCambiarPlanInternet\AsignacionPlan;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModelosNombresTablasTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_los_modelos_coinciden_con_los_nombres_exactos_de_las_tablas_en_la_base_de_datos(): void
    {
        $this->assertSame('Pago', (new Pago())->getTable());
        $this->assertSame('idPago', (new Pago())->getKeyName());

        $this->assertSame('Mensualidad', (new Mensualidad())->getTable());
        $this->assertSame('idMensualidad', (new Mensualidad())->getKeyName());

        $this->assertSame('Zona', (new Zona())->getTable());
        $this->assertSame('idZona', (new Zona())->getKeyName());

        $this->assertSame('Bitacora', (new Bitacora())->getTable());
        $this->assertSame('idBitacora', (new Bitacora())->getKeyName());

        $this->assertSame('AccionServicio', (new AccionServicio())->getTable());
        $this->assertSame('idAccion', (new AccionServicio())->getKeyName());

        $this->assertSame('Usuario', (new Usuario())->getTable());
        $this->assertSame('idUsuario', (new Usuario())->getKeyName());

        $this->assertSame('Cliente', (new Cliente())->getTable());
        $this->assertSame('idCliente', (new Cliente())->getKeyName());

        $this->assertSame('PlanInternet', (new PlanInternet())->getTable());
        $this->assertSame('idPlan', (new PlanInternet())->getKeyName());

        $this->assertSame('ServicioInternet', (new ServicioInternet())->getTable());
        $this->assertSame('idServicio', (new ServicioInternet())->getKeyName());

        $this->assertSame('EstadoServicio', (new EstadoServicio())->getTable());
        $this->assertSame('idEstadoServicio', (new EstadoServicio())->getKeyName());

        $this->assertSame('AsignacionPlan', (new AsignacionPlan())->getTable());
        $this->assertSame('idAsignacionPlan', (new AsignacionPlan())->getKeyName());

        $this->assertSame('MetodoPago', (new MetodoPago())->getTable());
        $this->assertSame('idMetodoPago', (new MetodoPago())->getKeyName());

        $this->assertSame('DetallePago', (new DetallePago())->getTable());
        $this->assertSame('idDetallePago', (new DetallePago())->getKeyName());

        $this->assertSame('Rol', (new Rol())->getTable());
        $this->assertSame('idRol', (new Rol())->getKeyName());

        $this->assertSame('Permiso', (new Permiso())->getTable());
        $this->assertSame('idPermiso', (new Permiso())->getKeyName());

        $this->assertSame('RolPermiso', (new RolPermiso())->getTable());
        $this->assertSame('idRolPermiso', (new RolPermiso())->getKeyName());

        $this->assertSame('HistorialEstadoServicio', (new HistorialEstadoServicio())->getTable());
        $this->assertSame('idHistorialEstado', (new HistorialEstadoServicio())->getKeyName());
    }

    public function test_retrocompatibilidad_total_con_los_nombres_anteriores_de_clases(): void
    {
        $this->assertInstanceOf(Pago::class, new PagoMensualidad());
        $this->assertInstanceOf(Mensualidad::class, new MensualidadFacturacion());
        $this->assertInstanceOf(Zona::class, new ZonaCobertura());
        $this->assertInstanceOf(Bitacora::class, new BitacoraAuditoria());
        $this->assertInstanceOf(AccionServicio::class, new RegistroCorte());
        $this->assertInstanceOf(AccionServicio::class, new ReactivacionServicio());
        $this->assertInstanceOf(User::class, new Usuario());
    }

    public function test_operaciones_con_los_modelos_canonicos_en_la_base_de_datos(): void
    {
        // 1. Zona
        $zona = Zona::create([
            'nombreZona' => 'Zona Central Empresarial',
            'codigo' => 'ZON-CENTRO-TEST',
            'ciudad' => 'Cochabamba',
            'tecnologia' => 'FTTH',
            'capacidadNodos' => 200,
            'estado' => true,
        ]);
        $this->assertDatabaseHas('Zona', ['codigo' => 'ZON-CENTRO-TEST']);

        // 2. Cliente y Servicio
        $cliente = Cliente::first();
        $servicio = ServicioInternet::first();

        // 3. Mensualidad
        $mensualidad = Mensualidad::create([
            'periodo' => '2026-11',
            'fechaVencimiento' => '2026-11-15',
            'monto' => 180.00,
            'estado' => 'PENDIENTE',
            'idServicio' => $servicio->idServicio,
            'idCliente' => $cliente->idCliente,
            'codigoFactura' => 'FAC-TEST-001',
            'fechaEmision' => '2026-11-01',
        ]);
        $this->assertDatabaseHas('Mensualidad', ['codigoFactura' => 'FAC-TEST-001']);

        // 4. Pago y DetallePago
        $metodo = MetodoPago::firstOrCreate(['nombreMetodo' => 'EFECTIVO']);
        $pago = Pago::create([
            'montoTotal' => 180.00,
            'numeroComprobante' => 'REC-TEST-999',
            'idMetodoPago' => $metodo->idMetodoPago,
            'fechaHora' => now(),
            'observacion' => 'Pago de prueba unitaria',
        ]);
        $this->assertDatabaseHas('Pago', ['numeroComprobante' => 'REC-TEST-999']);

        $detalle = DetallePago::create([
            'idPago' => $pago->idPago,
            'idMensualidad' => $mensualidad->idMensualidad,
            'subtotal' => 180.00,
            'montoAplicado' => 180.00,
        ]);
        $this->assertDatabaseHas('DetallePago', ['idPago' => $pago->idPago, 'idMensualidad' => $mensualidad->idMensualidad]);

        // Verificar relaciones
        $this->assertInstanceOf(Pago::class, $detalle->pago);
        $this->assertInstanceOf(Mensualidad::class, $detalle->mensualidad);
        $this->assertEquals($pago->idPago, $detalle->pago->idPago);

        // 5. Bitacora
        $bitacora = Bitacora::create([
            'accion' => 'TEST_ACCION',
            'modulo' => 'TEST_MODULO',
            'descripcion' => 'Prueba de bitácora canónica',
            'fechaHora' => now(),
        ]);
        $this->assertDatabaseHas('Bitacora', ['accion' => 'TEST_ACCION']);

        // 6. AccionServicio
        $accion = AccionServicio::create([
            'tipoAccion' => 'CORTE',
            'idServicio' => $servicio->idServicio,
            'estado' => 'COMPLETADO',
            'motivo' => 'Mora de prueba',
            'fechaEjecucion' => now(),
        ]);
        $this->assertDatabaseHas('AccionServicio', ['idAccion' => $accion->idAccion, 'tipoAccion' => 'CORTE']);
    }
}
