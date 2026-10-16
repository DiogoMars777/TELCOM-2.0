<?php

namespace Database\Seeders;

use App\Models\Paquetes\SeguridadAdministracion\CU03_UsuariosRolesPermisos\Permiso;
use App\Models\Paquetes\SeguridadAdministracion\CU03_UsuariosRolesPermisos\Rol;
use App\Models\Paquetes\GestionClientesZonas\CU04_ZonasCobertura\ZonaCobertura;
use App\Models\Paquetes\GestionClientesZonas\CU05_RegistrarCliente\Cliente;
use App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio\EstadoServicio;
use App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio\ServicioInternet;
use App\Models\Paquetes\ServiciosPlanes\CU16_GestionarCatalogoPlanes\PlanInternet;
use App\Models\Paquetes\ServiciosPlanes\CU17_AsignarCambiarPlanInternet\AsignacionPlan;
use App\Models\Paquetes\FacturacionCobranza\CU09_GenerarMensualidades\MensualidadFacturacion;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Roles internos oficiales: admin, secretaria, tecnico.
     * El Cliente, el Sistema, el Servicio IA y la Pasarela de Pago NO son
     * cuentas de empleados y no se crean como roles de esta tabla.
     */
    public function run(): void
    {
        // 1. Roles internos (CU03)
        $rolAdmin = Rol::firstOrCreate(
            ['slug' => 'admin'],
            ['nombre' => 'Administrador', 'descripcion' => 'Acceso total: usuarios, roles, zonas, proveedores, compras y reportes']
        );
        $rolSecretaria = Rol::firstOrCreate(
            ['slug' => 'secretaria'],
            ['nombre' => 'Secretaría', 'descripcion' => 'Registro de clientes, servicios, mensualidades, cobros, cortes y reactivaciones']
        );
        $rolTecnico = Rol::firstOrCreate(
            ['slug' => 'tecnico'],
            ['nombre' => 'Técnico', 'descripcion' => 'Equipos en comodato e instalaciones']
        );

        // 2. Usuario Administrador Principal - con rol válido asignado
        $admin = User::firstOrCreate(
            ['correo' => 'admin@telcom.com'],
            [
                'nombreUsuario'  => 'admin',
                'nombreCompleto' => 'Administrador Senior TELCOM',
                'passwordHash'   => Hash::make('password123'),
                'idRol'          => $rolAdmin->idRol,
                'activo'         => true,
            ]
        );

        // Garantiza el rol aunque el usuario ya existiera de una ejecución previa
        if ($admin->idRol === null) {
            $admin->idRol = $rolAdmin->idRol;
            $admin->save();
        }

        // 3. Catálogo de permisos internos (CU03)
        //    - Los permisos de CU01-CU15 ya tienen rutas.
        //    - Los de PLANES/EQUIPOS/INSTALACIONES/PROVEEDORES/COMPRAS/REPORTES
        //      se definen ahora para los módulos previstos; se aplicarán a sus
        //      rutas cuando existan (no se crean endpoints ficticios aquí).
        $permisos = [
            // CU01 - Sesión
            ['slug' => 'auth.login', 'nombre' => 'Iniciar Sesión', 'modulo' => 'CU01'],
            // CU02 - Auditoría
            ['slug' => 'auditoria.view', 'nombre' => 'Consultar Bitácora', 'modulo' => 'CU02'],
            // CU03 - Usuarios / roles / permisos
            ['slug' => 'usuarios.manage', 'nombre' => 'Gestionar Usuarios, Roles y Permisos', 'modulo' => 'CU03'],
            // CU04 - Zonas
            ['slug' => 'zonas.manage', 'nombre' => 'Gestionar Zonas de Cobertura', 'modulo' => 'CU04'],
            // CU05-CU07 - Clientes
            ['slug' => 'clientes.create', 'nombre' => 'Registrar Cliente', 'modulo' => 'CU05'],
            ['slug' => 'clientes.view', 'nombre' => 'Consultar Clientes', 'modulo' => 'CU06'],
            ['slug' => 'clientes.update', 'nombre' => 'Actualizar y Baja de Cliente', 'modulo' => 'CU07'],
            // CU08 - Servicios (lectura y escritura separadas)
            ['slug' => 'servicios.view', 'nombre' => 'Consultar Servicios', 'modulo' => 'CU08'],
            ['slug' => 'servicios.manage', 'nombre' => 'Registrar / Activar Servicio', 'modulo' => 'CU08'],
            // CU09 - Mensualidades (lectura y generación separadas)
            ['slug' => 'mensualidades.view', 'nombre' => 'Consultar Mensualidades', 'modulo' => 'CU09'],
            ['slug' => 'mensualidades.generate', 'nombre' => 'Generar Mensualidades', 'modulo' => 'CU09'],
            // CU10-CU11 - Pagos
            ['slug' => 'pagos.register', 'nombre' => 'Registrar Pago Presencial', 'modulo' => 'CU10'],
            ['slug' => 'pagos.history', 'nombre' => 'Consultar Historial de Pagos', 'modulo' => 'CU11'],
            // CU12 - Alertas
            ['slug' => 'alertas.view', 'nombre' => 'Consultar Alertas de Vencimiento', 'modulo' => 'CU12'],
            // CU13-CU14 - Cortes
            ['slug' => 'cortes.list', 'nombre' => 'Consultar Servicios para Corte', 'modulo' => 'CU13'],
            ['slug' => 'cortes.register', 'nombre' => 'Registrar Corte Realizado', 'modulo' => 'CU14'],
            // CU15 - Reactivaciones
            ['slug' => 'reactivaciones.manage', 'nombre' => 'Gestionar Reactivaciones', 'modulo' => 'CU15'],
            // Planes (CU16 catálogo, CU17 asignación)
            //   - planes.view   -> consultar/buscar planes (admin y secretaría).
            //   - planes.manage -> crear/editar/activar/desactivar (solo admin).
            //   - planes.assign -> asignar/cambiar el plan de un servicio (admin y secretaría).
            ['slug' => 'planes.view', 'nombre' => 'Consultar Planes', 'modulo' => 'PLANES'],
            ['slug' => 'planes.manage', 'nombre' => 'Gestionar Catálogo de Planes', 'modulo' => 'PLANES'],
            ['slug' => 'planes.assign', 'nombre' => 'Asignar Planes', 'modulo' => 'PLANES'],
            // Equipos / comodato (módulo previsto)
            ['slug' => 'equipos.view', 'nombre' => 'Consultar Equipos', 'modulo' => 'EQUIPOS'],
            ['slug' => 'equipos.manage', 'nombre' => 'Gestionar Catálogo de Equipos', 'modulo' => 'EQUIPOS'],
            ['slug' => 'equipos.assign', 'nombre' => 'Asignar / Reemplazar / Retirar Equipos en Comodato', 'modulo' => 'EQUIPOS'],
            // Instalaciones (módulo previsto)
            ['slug' => 'instalaciones.view', 'nombre' => 'Consultar Instalaciones', 'modulo' => 'INSTALACIONES'],
            ['slug' => 'instalaciones.schedule', 'nombre' => 'Programar Instalaciones', 'modulo' => 'INSTALACIONES'],
            ['slug' => 'instalaciones.execute', 'nombre' => 'Registrar Ejecución de Instalaciones', 'modulo' => 'INSTALACIONES'],
            // Proveedores y compras (solo administrador)
            ['slug' => 'proveedores.manage', 'nombre' => 'Gestionar Proveedores', 'modulo' => 'PROVEEDORES'],
            ['slug' => 'compras.manage', 'nombre' => 'Gestionar Compras', 'modulo' => 'COMPRAS'],
            // Reportes (dashboard gerencial / reportes inteligentes)
            ['slug' => 'reportes.view', 'nombre' => 'Ver Reportes Gerenciales', 'modulo' => 'REPORTES'],
        ];

        $ids = [];
        foreach ($permisos as $p) {
            $ids[$p['slug']] = Permiso::firstOrCreate(['slug' => $p['slug']], $p)->id;
        }

        // 4. Asignación rol -> permisos (matriz aprobada)
        $slugsSecretaria = [
            'auth.login',
            'clientes.create', 'clientes.view', 'clientes.update',
            'servicios.view', 'servicios.manage',
            'mensualidades.view', 'mensualidades.generate',
            'pagos.register', 'pagos.history',
            'alertas.view',
            'cortes.list', 'cortes.register',
            'reactivaciones.manage',
            'planes.view', 'planes.assign',
            'equipos.view', 'equipos.assign',
            'instalaciones.view', 'instalaciones.schedule',
        ];

        $slugsTecnico = [
            'auth.login',
            'clientes.view', 'servicios.view',
            'equipos.view', 'equipos.manage', 'equipos.assign',
            'instalaciones.view', 'instalaciones.execute',
        ];

        // El administrador conserva TODOS los permisos del catálogo.
        $rolAdmin->permisos()->sync(array_values($ids));

        // Secretaría y Técnico se ajustan exactamente a la matriz.
        $rolSecretaria->permisos()->sync(
            array_values(array_intersect_key($ids, array_flip($slugsSecretaria)))
        );
        $rolTecnico->permisos()->sync(
            array_values(array_intersect_key($ids, array_flip($slugsTecnico)))
        );

        // 5. Zonas de Cobertura iniciales (CU04)
        $zonaNorte = ZonaCobertura::firstOrCreate(
            ['codigo' => 'ZON-NORTE'],
            [
                'nombre'          => 'Zona Norte - Fibra Óptica Troncal',
                'ciudad'          => 'La Paz / El Alto',
                'tecnologia'      => 'FTTH GPON',
                'capacidad_nodos' => 500,
                'activo'          => true,
            ]
        );
        ZonaCobertura::firstOrCreate(
            ['codigo' => 'ZON-SUR'],
            [
                'nombre'          => 'Zona Sur - Anillo Metropolitano',
                'ciudad'          => 'Santa Cruz de la Sierra',
                'tecnologia'      => 'FTTH GPON',
                'capacidad_nodos' => 800,
                'activo'          => true,
            ]
        );

        // 6. Clientes iniciales (CU05)
        $cliente1 = Cliente::firstOrCreate(
            ['ci' => '8492019'],
            [
                'codigoCliente'       => 'CLI-10001',
                'nombreCompleto'      => 'Carlos Andrés Mendoza Paredes',
                'telefonoPrincipal'   => '+591 76543210',
                'correo'              => 'carlos.mendoza@email.com',
                'direccion'           => 'Av. Siempre Viva #742',
                'idZona'              => $zonaNorte->idZona,
                'estadoCliente'       => 'ACTIVO',
            ]
        );

        // 7. Catálogo de estados de servicio (UML EstadoServicio)
        $estadosServicio = [
            'PENDIENTE_INSTALACION' => 'Servicio registrado, pendiente de instalación/verificación técnica.',
            'ACTIVO'                => 'Servicio habilitado y en funcionamiento.',
            'SUSPENDIDO'            => 'Servicio suspendido temporalmente.',
            'CORTADO'               => 'Servicio cortado por falta de pago u otra causa.',
        ];
        $estadosCreados = [];
        foreach ($estadosServicio as $nombre => $descripcion) {
            $estadosCreados[$nombre] = EstadoServicio::firstOrCreate(
                ['nombreEstado' => $nombre],
                ['descripcion' => $descripcion]
            );
        }

        // 8. Planes de Internet (UML)
        $planesCatalogo = [
            ['nombrePlan' => 'Plan Básico 30 Mbps', 'velocidadMbps' => 30, 'precioMensual' => 130.00, 'descripcion' => 'Plan residencial esencial.'],
            ['nombrePlan' => 'Plan Hogar Plus 50 Mbps', 'velocidadMbps' => 50, 'precioMensual' => 160.00, 'descripcion' => 'Plan ideal para el hogar.'],
            ['nombrePlan' => 'Plan Fibra Ultra 100 Mbps', 'velocidadMbps' => 100, 'precioMensual' => 200.00, 'descripcion' => 'Alta velocidad para streaming y trabajo.'],
            ['nombrePlan' => 'Fibra 200 Mbps', 'velocidadMbps' => 200, 'precioMensual' => 250.00, 'descripcion' => 'Plan corporativo y gamer.'],
        ];

        $plan = null;
        foreach ($planesCatalogo as $pData) {
            $createdPlan = PlanInternet::firstOrCreate(
                ['nombrePlan' => $pData['nombrePlan']],
                [
                    'velocidadMbps' => $pData['velocidadMbps'],
                    'precioMensual' => $pData['precioMensual'],
                    'descripcion'   => $pData['descripcion'],
                    'activo'        => true,
                ]
            );
            if ($pData['nombrePlan'] === 'Fibra 200 Mbps') {
                $plan = $createdPlan;
            }
        }

        // 9. Servicio de Internet inicial (CU08)
        $servicio = ServicioInternet::firstOrCreate(
            ['codigoServicio' => 'SRV-88201'],
            [
                'idCliente'         => $cliente1->idCliente,
                'idEstadoServicio'  => $estadosCreados['ACTIVO']->idEstadoServicio,
                'idZona'            => $zonaNorte->idZona,
                'ipAsignada'        => '10.10.0.15',
                'macRouter'         => 'AA:BB:CC:DD:EE:01',
                'direccion'         => 'Av. Siempre Viva #742',
                'fechaActivacion'   => now()->subMonths(3)->toDateString(),
                'diaCorte'          => 10,
            ]
        );

        if ($servicio->asignacionesPlan()->doesntExist()) {
            AsignacionPlan::create([
                'idServicio'     => $servicio->idServicio,
                'idPlan'         => $plan->idPlan,
                'idUsuario'      => null, // No se inventa el autor de datos de ejemplo.
                'fechaInicio'    => $servicio->fechaActivacion ?? now()->toDateString(),
                'fechaFin'       => null,
                'precioAplicado' => $plan->precioMensual,
                'motivoCambio'   => 'Carga inicial de datos de ejemplo.',
            ]);
        }

        // 10. Datos de prueba para moras y cortes (CU13) - para entorno de desarrollo y pruebas manuales
        if (!app()->runningUnitTests()) {
            $cliente2 = Cliente::firstOrCreate(
                ['ci' => '5928103'],
                [
                    'codigoCliente'     => 'CLI-10002',
                    'nombreCompleto'    => 'Juan Pablo Camacho Ortiz',
                    'telefonoPrincipal' => '+591 71234567',
                    'correo'            => 'juanpablo.camacho@email.com',
                    'direccion'         => 'Av. Cristo Redentor #450, Edif. Torre Duo',
                    'idZona'            => ZonaCobertura::where('codigo', 'ZON-SUR')->value('idZona'),
                    'estadoCliente'     => 'ACTIVO',
                ]
            );

            $servicioCorte1 = ServicioInternet::firstOrCreate(
                ['codigoServicio' => 'SRV-88204'],
                [
                    'idCliente'        => $cliente2->idCliente,
                    'idEstadoServicio' => $estadosCreados['ACTIVO']->idEstadoServicio,
                    'idZona'           => $cliente2->idZona,
                    'ipAsignada'       => '192.168.10.92',
                    'macRouter'        => 'BC:5F:F4:11:22:33',
                    'direccion'        => $cliente2->direccion,
                    'fechaActivacion'  => now()->subMonths(4)->toDateString(),
                    'diaCorte'         => 10,
                ]
            );

            if ($servicioCorte1->asignacionesPlan()->doesntExist()) {
                AsignacionPlan::create([
                    'idServicio'     => $servicioCorte1->idServicio,
                    'idPlan'         => $plan->idPlan,
                    'idUsuario'      => null,
                    'fechaInicio'    => $servicioCorte1->fechaActivacion,
                    'precioAplicado' => $plan->precioMensual,
                    'motivoCambio'   => 'Alta de servicio.',
                ]);
            }

            // Mensualidades en mora para SRV-88204 (elegible para CU13)
            if (MensualidadFacturacion::where('idServicio', $servicioCorte1->idServicio)->doesntExist()) {
                MensualidadFacturacion::create([
                    'idServicio'       => $servicioCorte1->idServicio,
                    'idCliente'        => $cliente2->idCliente,
                    'periodo'          => now()->subMonths(1)->format('Y-m'),
                    'fechaEmision'     => now()->subMonths(1)->startOfMonth()->toDateString(),
                    'fechaVencimiento' => now()->subDays(15)->toDateString(),
                    'monto'            => 250.00,
                    'montoPagado'      => 0.00,
                    'estado'           => 'PENDIENTE',
                    'codigoFactura'    => 'FAC-88204-01',
                ]);
            }
        }
    }
}
