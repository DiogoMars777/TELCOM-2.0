<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    /**
     * Población Integral Senior de la Base de Datos TELCOM 2.0 (28 Tablas Canónicas).
     *
     * Cumplimiento estricto:
     *  - Super Admin: correo admin@telcom.com, password Admin123*
     *  - 5 usuarios administrativos con roles (admin, secretaria, tecnico)
     *  - 3 zonas de internet en Santa Cruz de la Sierra con polígonos GeoJSON
     *  - Catálogo de 4 planes de internet (30, 50, 100, 200 Mbps)
     *  - 20 clientes de Santa Cruz con direcciones, CIs, teléfonos y datos completos
     *  - 20 servicios de internet asignados con IPs, MACs y planes vigentes
     *  - Mensualidades desde Enero 2026 hasta Octubre 2026 (200 facturas en total):
     *      * Enero a Septiembre: 100% PAGADAS con comprobantes y registros en Pago/DetallePago
     *      * Octubre (Mes actual): Exactamente 10 PAGADAS y 10 PENDIENTES
     *  - Población de las 28 tablas canónicas (cero tablas vacías):
     *      Proveedores, compras, inventario, equipos, comodatos, técnicos,
     *      instalaciones, bitácora de auditoría, métodos de pago y cortes/reactivaciones.
     */
    public function run(): void
    {
        if (app()->runningUnitTests()) {
            $this->runUnitTestsFixture();
            return;
        }

        $this->runSeniorProductionDataset();
    }

    /**
     * Fixture base optimizado para suite de pruebas automatizadas (PHPUnit).
     */
    private function runUnitTestsFixture(): void
    {
        $tablasLimpieza = [
            'DetallePago', 'Pago', 'Mensualidad', 'AsignacionEquipo', 'Instalacion',
            'SolicitudInstalacion', 'HistorialEstadoServicio', 'AccionServicio',
            'AsignacionPlan', 'ServicioInternet', 'Cliente', 'Zona', 'DetalleCompra',
            'Compra', 'EstadoCompra', 'Proveedor', 'Equipo', 'Inventario',
            'ProductoEquipo', 'Tecnico', 'Bitacora', 'user_sessions', 'RolPermiso',
            'Usuario', 'Rol', 'Permiso', 'PlanInternet', 'EstadoServicio', 'MetodoPago',
        ];

        foreach ($tablasLimpieza as $tabla) {
            try {
                DB::table($tabla)->delete();
            } catch (\Throwable) {}
        }

        $idRolAdmin = DB::table('Rol')->insertGetId([
            'nombre'      => 'Administrador',
            'slug'        => 'admin',
            'descripcion' => 'Acceso total al sistema.',
            'activo'      => true,
        ], 'idRol');

        $idRolSecretaria = DB::table('Rol')->insertGetId([
            'nombre'      => 'Secretaría',
            'slug'        => 'secretaria',
            'descripcion' => 'Gestión operativa.',
            'activo'      => true,
        ], 'idRol');

        $idRolTecnico = DB::table('Rol')->insertGetId([
            'nombre'      => 'Técnico',
            'slug'        => 'tecnico',
            'descripcion' => 'Operaciones de campo.',
            'activo'      => true,
        ], 'idRol');

        $catalogoPermisos = [
            ['slug' => 'auth.login', 'nombre' => 'Iniciar Sesión', 'modulo' => 'CU01', 'descripcion' => 'Acceso autenticado.'],
            ['slug' => 'auditoria.view', 'nombre' => 'Consultar Bitácora', 'modulo' => 'CU02', 'descripcion' => 'Ver registros de auditoría.'],
            ['slug' => 'usuarios.manage', 'nombre' => 'Gestionar Usuarios, Roles y Permisos', 'modulo' => 'CU03', 'descripcion' => 'Administración integral.'],
            ['slug' => 'zonas.manage', 'nombre' => 'Gestionar Zonas de Cobertura', 'modulo' => 'CU04', 'descripcion' => 'Nodos y mapas de cobertura.'],
            ['slug' => 'clientes.create', 'nombre' => 'Registrar Cliente', 'modulo' => 'CU05', 'descripcion' => 'Alta de nuevos abonados.'],
            ['slug' => 'clientes.view', 'nombre' => 'Consultar Clientes', 'modulo' => 'CU06', 'descripcion' => 'Búsqueda y listado.'],
            ['slug' => 'clientes.update', 'nombre' => 'Actualizar y Baja de Cliente', 'modulo' => 'CU07', 'descripcion' => 'Edición y baja lógica.'],
            ['slug' => 'servicios.view', 'nombre' => 'Consultar Servicios', 'modulo' => 'CU08', 'descripcion' => 'Listado e inspección.'],
            ['slug' => 'servicios.manage', 'nombre' => 'Registrar / Activar Servicio', 'modulo' => 'CU08', 'descripcion' => 'Activación de servicios.'],
            ['slug' => 'mensualidades.view', 'nombre' => 'Consultar Mensualidades', 'modulo' => 'CU09', 'descripcion' => 'Ver facturas por período.'],
            ['slug' => 'mensualidades.generate', 'nombre' => 'Generar Mensualidades', 'modulo' => 'CU09', 'descripcion' => 'Facturación masiva.'],
            ['slug' => 'pagos.register', 'nombre' => 'Registrar Pago Presencial', 'modulo' => 'CU10', 'descripcion' => 'Cobranza en ventanilla.'],
            ['slug' => 'pagos.history', 'nombre' => 'Consultar Historial de Pagos', 'modulo' => 'CU11', 'descripcion' => 'Historial de pagos.'],
            ['slug' => 'alertas.view', 'nombre' => 'Consultar Alertas de Vencimiento', 'modulo' => 'CU12', 'descripcion' => 'Monitoreo de mora.'],
            ['slug' => 'cortes.list', 'nombre' => 'Consultar Servicios para Corte', 'modulo' => 'CU13', 'descripcion' => 'Hoja de ruta para cortes.'],
            ['slug' => 'cortes.register', 'nombre' => 'Registrar Corte Realizado', 'modulo' => 'CU14', 'descripcion' => 'Confirmar corte realizado.'],
            ['slug' => 'reactivaciones.manage', 'nombre' => 'Gestionar Reactivaciones', 'modulo' => 'CU15', 'descripcion' => 'Reactivar servicio suspendido.'],
            ['slug' => 'planes.view', 'nombre' => 'Consultar Planes', 'modulo' => 'PLANES', 'descripcion' => 'Lectura de planes.'],
            ['slug' => 'planes.manage', 'nombre' => 'Gestionar Catálogo de Planes', 'modulo' => 'PLANES', 'descripcion' => 'Gestionar planes.'],
            ['slug' => 'planes.assign', 'nombre' => 'Asignar Planes', 'modulo' => 'PLANES', 'descripcion' => 'Asignar planes.'],
            ['slug' => 'equipos.view', 'nombre' => 'Consultar Equipos', 'modulo' => 'EQUIPOS', 'descripcion' => 'Inventario de ONUs.'],
            ['slug' => 'equipos.manage', 'nombre' => 'Gestionar Catálogo de Equipos', 'modulo' => 'EQUIPOS', 'descripcion' => 'Catálogo de equipos.'],
            ['slug' => 'equipos.assign', 'nombre' => 'Asignar Equipos en Comodato', 'modulo' => 'EQUIPOS', 'descripcion' => 'Asignar equipos.'],
            ['slug' => 'instalaciones.view', 'nombre' => 'Consultar Instalaciones', 'modulo' => 'INSTALACIONES', 'descripcion' => 'Agenda de cuadrillas.'],
            ['slug' => 'instalaciones.schedule', 'nombre' => 'Programar Instalaciones', 'modulo' => 'INSTALACIONES', 'descripcion' => 'Programar órdenes.'],
            ['slug' => 'instalaciones.execute', 'nombre' => 'Registrar Ejecución de Instalaciones', 'modulo' => 'INSTALACIONES', 'descripcion' => 'Cierre técnico.'],
            ['slug' => 'proveedores.manage', 'nombre' => 'Gestionar Proveedores', 'modulo' => 'PROVEEDORES', 'descripcion' => 'Gestión de proveedores.'],
            ['slug' => 'compras.manage', 'nombre' => 'Gestionar Compras', 'modulo' => 'COMPRAS', 'descripcion' => 'Gestión de compras.'],
            ['slug' => 'reportes.view', 'nombre' => 'Ver Reportes Gerenciales', 'modulo' => 'REPORTES', 'descripcion' => 'Reportes e indicadores.'],
        ];

        $permisosIds = [];
        foreach ($catalogoPermisos as $perm) {
            $id = DB::table('Permiso')->insertGetId($perm, 'idPermiso');
            $permisosIds[$perm['slug']] = $id;
        }

        foreach ($permisosIds as $pId) {
            DB::table('RolPermiso')->insert([
                'idRol'     => $idRolAdmin,
                'idPermiso' => $pId,
            ]);
        }

        $slugsSecretaria = [
            'auth.login', 'clientes.create', 'clientes.view', 'clientes.update',
            'servicios.view', 'servicios.manage', 'mensualidades.view', 'mensualidades.generate',
            'pagos.register', 'pagos.history', 'alertas.view', 'cortes.list', 'cortes.register',
            'reactivaciones.manage', 'planes.view', 'planes.assign', 'equipos.view',
            'equipos.assign', 'instalaciones.view', 'instalaciones.schedule',
        ];
        foreach ($slugsSecretaria as $slug) {
            if (isset($permisosIds[$slug])) {
                DB::table('RolPermiso')->insert([
                    'idRol'     => $idRolSecretaria,
                    'idPermiso' => $permisosIds[$slug],
                ]);
            }
        }

        $slugsTecnico = [
            'auth.login', 'clientes.view', 'servicios.view', 'equipos.view',
            'equipos.manage', 'equipos.assign', 'instalaciones.view', 'instalaciones.execute',
        ];
        foreach ($slugsTecnico as $slug) {
            if (isset($permisosIds[$slug])) {
                DB::table('RolPermiso')->insert([
                    'idRol'     => $idRolTecnico,
                    'idPermiso' => $permisosIds[$slug],
                ]);
            }
        }

        $passwordHash = Hash::make('Admin123*');
        DB::table('Usuario')->insert([
            'nombreUsuario'  => 'admin',
            'nombreCompleto' => 'Super Administrador Principal',
            'correo'         => 'admin@telcom.com',
            'telefono'       => '+591 70011223',
            'passwordHash'   => $passwordHash,
            'idRol'          => $idRolAdmin,
            'activo'         => true,
            'fechaCreacion'  => '2026-01-01 08:00:00',
        ]);

        $idZonaNorte = DB::table('Zona')->insertGetId([
            'codigo'          => 'ZON-NORTE',
            'nombreZona'      => 'Zona Norte - Fibra Óptica Troncal',
            'ciudad'          => 'La Paz / El Alto',
            'tecnologia'      => 'FTTH GPON',
            'capacidadNodos'  => 500,
            'estado'          => true,
            'barrio'          => null,
            'estadoCobertura' => null,
            'areaMapa'        => null,
        ], 'idZona');

        DB::table('Zona')->insert([
            'codigo'          => 'ZON-SUR',
            'nombreZona'      => 'Zona Sur - Anillo Metropolitano',
            'ciudad'          => 'Santa Cruz de la Sierra',
            'tecnologia'      => 'FTTH GPON',
            'capacidadNodos'  => 800,
            'estado'          => true,
            'barrio'          => null,
            'estadoCobertura' => null,
            'areaMapa'        => null,
        ]);

        $idCliente = DB::table('Cliente')->insertGetId([
            'codigoCliente'       => 'CLI-10001',
            'ci'                  => '8492019',
            'nombreCompleto'      => 'Carlos Andrés Mendoza Paredes',
            'telefonoPrincipal'   => '+591 76543210',
            'correo'              => 'carlos.mendoza@email.com',
            'direccion'           => 'Av. Siempre Viva #742',
            'idZona'              => $idZonaNorte,
            'estadoCliente'       => 'ACTIVO',
            'fechaRegistro'       => '2026-01-02 09:00:00',
        ], 'idCliente');

        $idEstadoActivo = DB::table('EstadoServicio')->insertGetId([
            'nombreEstado' => 'ACTIVO',
            'descripcion'  => 'Servicio operando con tráfico de datos habilitado.',
        ], 'idEstadoServicio');

        DB::table('EstadoServicio')->insert([
            'nombreEstado' => 'PENDIENTE_INSTALACION',
            'descripcion'  => 'Servicio registrado pendiente de tendido.',
        ]);
        DB::table('EstadoServicio')->insert([
            'nombreEstado' => 'SUSPENDIDO',
            'descripcion'  => 'Servicio suspendido temporalmente.',
        ]);
        DB::table('EstadoServicio')->insert([
            'nombreEstado' => 'CORTADO',
            'descripcion'  => 'Servicio cortado por mora.',
        ]);

        DB::table('PlanInternet')->insert([
            'nombrePlan'    => 'Plan Básico 30 Mbps',
            'velocidadMbps' => 30,
            'precioMensual' => 130.00,
            'descripcion'   => 'Plan residencial esencial.',
            'activo'        => true,
        ]);
        DB::table('PlanInternet')->insert([
            'nombrePlan'    => 'Plan Hogar Plus 50 Mbps',
            'velocidadMbps' => 50,
            'precioMensual' => 160.00,
            'descripcion'   => 'Plan ideal para el hogar.',
            'activo'        => true,
        ]);
        DB::table('PlanInternet')->insert([
            'nombrePlan'    => 'Plan Fibra Ultra 100 Mbps',
            'velocidadMbps' => 100,
            'precioMensual' => 200.00,
            'descripcion'   => 'Alta velocidad.',
            'activo'        => true,
        ]);
        $idPlan200 = DB::table('PlanInternet')->insertGetId([
            'nombrePlan'    => 'Fibra 200 Mbps',
            'velocidadMbps' => 200,
            'precioMensual' => 250.00,
            'descripcion'   => 'Plan corporativo y gamer.',
            'activo'        => true,
        ], 'idPlan');

        $idServicio = DB::table('ServicioInternet')->insertGetId([
            'codigoServicio'   => 'SRV-88201',
            'idCliente'        => $idCliente,
            'idEstadoServicio' => $idEstadoActivo,
            'idZona'           => $idZonaNorte,
            'ipAsignada'       => '10.10.0.15',
            'macRouter'        => 'AA:BB:CC:DD:EE:01',
            'direccion'        => 'Av. Siempre Viva #742',
            'fechaActivacion'  => '2026-01-05',
            'diaCorte'         => 10,
        ], 'idServicio');

        DB::table('AsignacionPlan')->insert([
            'idServicio'     => $idServicio,
            'idPlan'         => $idPlan200,
            'idUsuario'      => null,
            'fechaInicio'    => '2026-01-05',
            'fechaFin'       => null,
            'precioAplicado' => 250.00,
            'motivoCambio'   => 'Carga inicial de datos de ejemplo.',
        ]);

        DB::table('MetodoPago')->insert(['nombreMetodo' => 'EFECTIVO', 'descripcion' => 'Efectivo', 'estado' => true]);
        DB::table('MetodoPago')->insert(['nombreMetodo' => 'QR', 'descripcion' => 'QR Simple', 'estado' => true]);
        DB::table('MetodoPago')->insert(['nombreMetodo' => 'TRANSFERENCIA', 'descripcion' => 'Transferencia', 'estado' => true]);
        DB::table('MetodoPago')->insert(['nombreMetodo' => 'PAYPAL', 'descripcion' => 'PayPal', 'estado' => true]);
    }

    /**
     * Población Integral Senior de la Base de Datos TELCOM 2.0 (28 Tablas Canónicas).
     */
    public function runSeniorProductionDataset(): void
    {
        // 1. Limpieza en orden inverso de claves foráneas para evitar conflictos
        $tablasLimpieza = [
            'DetallePago',
            'Pago',
            'Mensualidad',
            'AsignacionEquipo',
            'Instalacion',
            'SolicitudInstalacion',
            'HistorialEstadoServicio',
            'AccionServicio',
            'AsignacionPlan',
            'ServicioInternet',
            'Cliente',
            'Zona',
            'DetalleCompra',
            'Compra',
            'EstadoCompra',
            'Proveedor',
            'Equipo',
            'Inventario',
            'ProductoEquipo',
            'Tecnico',
            'Bitacora',
            'user_sessions',
            'RolPermiso',
            'Usuario',
            'Rol',
            'Permiso',
            'PlanInternet',
            'EstadoServicio',
            'MetodoPago',
        ];

        foreach ($tablasLimpieza as $tabla) {
            try {
                DB::table($tabla)->delete();
            } catch (\Throwable) {
                // Silencioso en caso de pruebas o tablas no creadas aún
            }
        }

        // =========================================================================
        // 2. ROLES Y PERMISOS (CU03 - SEGURIDAD RBAC)
        // =========================================================================
        $idRolAdmin = DB::table('Rol')->insertGetId([
            'nombre'      => 'Administrador',
            'slug'        => 'admin',
            'descripcion' => 'Acceso total al sistema: usuarios, roles, zonas, auditoría, compras y catálogo.',
            'activo'      => true,
        ], 'idRol');

        $idRolSecretaria = DB::table('Rol')->insertGetId([
            'nombre'      => 'Secretaría',
            'slug'        => 'secretaria',
            'descripcion' => 'Gestión operativa: clientes, servicios, mensualidades, cobranzas, cortes y reactivaciones.',
            'activo'      => true,
        ], 'idRol');

        $idRolTecnico = DB::table('Rol')->insertGetId([
            'nombre'      => 'Técnico',
            'slug'        => 'tecnico',
            'descripcion' => 'Operaciones de campo: comodatos, equipos, instalaciones e inspección técnica.',
            'activo'      => true,
        ], 'idRol');

        $catalogoPermisos = [
            ['slug' => 'auth.login', 'nombre' => 'Iniciar Sesión', 'modulo' => 'CU01', 'descripcion' => 'Acceso autenticado al panel.'],
            ['slug' => 'auditoria.view', 'nombre' => 'Consultar Bitácora', 'modulo' => 'CU02', 'descripcion' => 'Ver registros de auditoría y trazas.'],
            ['slug' => 'usuarios.manage', 'nombre' => 'Gestionar Usuarios, Roles y Permisos', 'modulo' => 'CU03', 'descripcion' => 'Administración integral de cuentas y permisos.'],
            ['slug' => 'zonas.manage', 'nombre' => 'Gestionar Zonas de Cobertura', 'modulo' => 'CU04', 'descripcion' => 'Definir y editar nodos y mapas de cobertura.'],
            ['slug' => 'clientes.create', 'nombre' => 'Registrar Cliente', 'modulo' => 'CU05', 'descripcion' => 'Alta de nuevos abonados.'],
            ['slug' => 'clientes.view', 'nombre' => 'Consultar Clientes', 'modulo' => 'CU06', 'descripcion' => 'Búsqueda y listado de abonados.'],
            ['slug' => 'clientes.update', 'nombre' => 'Actualizar y Baja de Cliente', 'modulo' => 'CU07', 'descripcion' => 'Edición de abonados y baja lógica.'],
            ['slug' => 'servicios.view', 'nombre' => 'Consultar Servicios', 'modulo' => 'CU08', 'descripcion' => 'Listado e inspección de servicios activos.'],
            ['slug' => 'servicios.manage', 'nombre' => 'Registrar / Activar Servicio', 'modulo' => 'CU08', 'descripcion' => 'Creación y activación de servicios de fibra.'],
            ['slug' => 'mensualidades.view', 'nombre' => 'Consultar Mensualidades', 'modulo' => 'CU09', 'descripcion' => 'Ver facturas generadas por período.'],
            ['slug' => 'mensualidades.generate', 'nombre' => 'Generar Mensualidades', 'modulo' => 'CU09', 'descripcion' => 'Facturación masiva del ciclo mensual.'],
            ['slug' => 'pagos.register', 'nombre' => 'Registrar Pago Presencial', 'modulo' => 'CU10', 'descripcion' => 'Cobranza en ventanilla y registro de recibos.'],
            ['slug' => 'pagos.history', 'nombre' => 'Consultar Historial de Pagos', 'modulo' => 'CU11', 'descripcion' => 'Reportes y recibos de pagos emitidos.'],
            ['slug' => 'alertas.view', 'nombre' => 'Consultar Alertas de Vencimiento', 'modulo' => 'CU12', 'descripcion' => 'Monitoreo preventivo de mora.'],
            ['slug' => 'cortes.list', 'nombre' => 'Consultar Servicios para Corte', 'modulo' => 'CU13', 'descripcion' => 'Generar hoja de ruta de corte por morosidad.'],
            ['slug' => 'cortes.register', 'nombre' => 'Registrar Corte Realizado', 'modulo' => 'CU14', 'descripcion' => 'Confirmar corte técnico en poste o nodo.'],
            ['slug' => 'reactivaciones.manage', 'nombre' => 'Gestionar Reactivaciones', 'modulo' => 'CU15', 'descripcion' => 'Reactivar servicio suspendido tras pago.'],
            ['slug' => 'planes.view', 'nombre' => 'Consultar Planes', 'modulo' => 'PLANES', 'descripcion' => 'Lectura del catálogo de planes de internet.'],
            ['slug' => 'planes.manage', 'nombre' => 'Gestionar Catálogo de Planes', 'modulo' => 'PLANES', 'descripcion' => 'Exclusivo Administrador: crear, editar o dar baja a planes.'],
            ['slug' => 'planes.assign', 'nombre' => 'Asignar Planes', 'modulo' => 'PLANES', 'descripcion' => 'Asignar o migrar el plan de un abonado.'],
            ['slug' => 'equipos.view', 'nombre' => 'Consultar Equipos', 'modulo' => 'EQUIPOS', 'descripcion' => 'Listar inventario de ONUs y routers.'],
            ['slug' => 'equipos.manage', 'nombre' => 'Gestionar Catálogo de Equipos', 'modulo' => 'EQUIPOS', 'descripcion' => 'Alta y mantenimiento de equipos.'],
            ['slug' => 'equipos.assign', 'nombre' => 'Asignar Equipos en Comodato', 'modulo' => 'EQUIPOS', 'descripcion' => 'Vincular ONU/Router a un servicio.'],
            ['slug' => 'instalaciones.view', 'nombre' => 'Consultar Instalaciones', 'modulo' => 'INSTALACIONES', 'descripcion' => 'Ver agenda de cuadrillas de instalación.'],
            ['slug' => 'instalaciones.schedule', 'nombre' => 'Programar Instalaciones', 'modulo' => 'INSTALACIONES', 'descripcion' => 'Asignar órdenes a técnicos.'],
            ['slug' => 'instalaciones.execute', 'nombre' => 'Registrar Ejecución de Instalaciones', 'modulo' => 'INSTALACIONES', 'descripcion' => 'Cierre técnico de orden de instalación.'],
            ['slug' => 'proveedores.manage', 'nombre' => 'Gestionar Proveedores', 'modulo' => 'PROVEEDORES', 'descripcion' => 'Catálogo de importadores y proveedores.'],
            ['slug' => 'compras.manage', 'nombre' => 'Gestionar Compras', 'modulo' => 'COMPRAS', 'descripcion' => 'Órdenes de compra e ingreso de insumos.'],
            ['slug' => 'reportes.view', 'nombre' => 'Ver Reportes Gerenciales', 'modulo' => 'REPORTES', 'descripcion' => 'Métricas e inteligencia de negocio.'],
        ];

        $permisosIds = [];
        foreach ($catalogoPermisos as $perm) {
            $id = DB::table('Permiso')->insertGetId($perm, 'idPermiso');
            $permisosIds[$perm['slug']] = $id;
        }

        // El Administrador tiene el 100% de los permisos
        foreach ($permisosIds as $pId) {
            DB::table('RolPermiso')->insert([
                'idRol'     => $idRolAdmin,
                'idPermiso' => $pId,
            ]);
        }

        // Secretaría: operaciones de clientes, facturación, cobros, cortes, reactivaciones y asignación
        $slugsSecretaria = [
            'auth.login', 'clientes.create', 'clientes.view', 'clientes.update',
            'servicios.view', 'servicios.manage', 'mensualidades.view', 'mensualidades.generate',
            'pagos.register', 'pagos.history', 'alertas.view', 'cortes.list', 'cortes.register',
            'reactivaciones.manage', 'planes.view', 'planes.assign', 'equipos.view',
            'equipos.assign', 'instalaciones.view', 'instalaciones.schedule',
        ];
        foreach ($slugsSecretaria as $slug) {
            if (isset($permisosIds[$slug])) {
                DB::table('RolPermiso')->insert([
                    'idRol'     => $idRolSecretaria,
                    'idPermiso' => $permisosIds[$slug],
                ]);
            }
        }

        // Técnico: inspección, comodatos e instalaciones
        $slugsTecnico = [
            'auth.login', 'clientes.view', 'servicios.view', 'equipos.view',
            'equipos.manage', 'equipos.assign', 'instalaciones.view', 'instalaciones.execute',
        ];
        foreach ($slugsTecnico as $slug) {
            if (isset($permisosIds[$slug])) {
                DB::table('RolPermiso')->insert([
                    'idRol'     => $idRolTecnico,
                    'idPermiso' => $permisosIds[$slug],
                ]);
            }
        }

        // =========================================================================
        // 3. 5 USUARIOS ADMINISTRATIVOS (SUPER ADMIN: admin@telcom.com / Admin123*)
        // =========================================================================
        $passwordHash = Hash::make('Admin123*');

        $idAdmin = DB::table('Usuario')->insertGetId([
            'nombreUsuario'  => 'admin',
            'nombreCompleto' => 'Super Administrador Principal',
            'correo'         => 'admin@telcom.com',
            'telefono'       => '+591 70011223',
            'passwordHash'   => $passwordHash,
            'idRol'          => $idRolAdmin,
            'activo'         => true,
            'fechaCreacion'  => '2026-01-01 08:00:00',
        ], 'idUsuario');

        $idAdmin2 = DB::table('Usuario')->insertGetId([
            'nombreUsuario'  => 'alejandro.morales',
            'nombreCompleto' => 'Ing. Alejandro Morales Soliz',
            'correo'         => 'soporte.admin@telcom.com',
            'telefono'       => '+591 71022334',
            'passwordHash'   => $passwordHash,
            'idRol'          => $idRolAdmin,
            'activo'         => true,
            'fechaCreacion'  => '2026-01-02 08:30:00',
        ], 'idUsuario');

        $idSec1 = DB::table('Usuario')->insertGetId([
            'nombreUsuario'  => 'mariana.rios',
            'nombreCompleto' => 'Lic. Mariana Ríos Méndez',
            'correo'         => 'secretaria.ventas@telcom.com',
            'telefono'       => '+591 72033445',
            'passwordHash'   => $passwordHash,
            'idRol'          => $idRolSecretaria,
            'activo'         => true,
            'fechaCreacion'  => '2026-01-03 09:00:00',
        ], 'idUsuario');

        $idSec2 = DB::table('Usuario')->insertGetId([
            'nombreUsuario'  => 'valeria.cespedes',
            'nombreCompleto' => 'Valeria Céspedes Arteaga',
            'correo'         => 'secretaria.caja@telcom.com',
            'telefono'       => '+591 73044556',
            'passwordHash'   => $passwordHash,
            'idRol'          => $idRolSecretaria,
            'activo'         => true,
            'fechaCreacion'  => '2026-01-04 09:00:00',
        ], 'idUsuario');

        $idTec1 = DB::table('Usuario')->insertGetId([
            'nombreUsuario'  => 'roberto.justiniano',
            'nombreCompleto' => 'Ing. Roberto Justiniano Suárez',
            'correo'         => 'tecnico.red@telcom.com',
            'telefono'       => '+591 74055667',
            'passwordHash'   => $passwordHash,
            'idRol'          => $idRolTecnico,
            'activo'         => true,
            'fechaCreacion'  => '2026-01-05 08:00:00',
        ], 'idUsuario');

        // =========================================================================
        // 4. MÉTODOS DE PAGO (CU10 / CU11)
        // =========================================================================
        $idMetodoEfectivo = DB::table('MetodoPago')->insertGetId([
            'nombreMetodo' => 'EFECTIVO',
            'descripcion'  => 'Cobro directo en caja y ventanilla institucional.',
            'estado'       => true,
        ], 'idMetodoPago');

        $idMetodoQr = DB::table('MetodoPago')->insertGetId([
            'nombreMetodo' => 'QR',
            'descripcion'  => 'Pago interoperable Simple QR (ASOBAN / Red Enlace).',
            'estado'       => true,
        ], 'idMetodoPago');

        $idMetodoTransf = DB::table('MetodoPago')->insertGetId([
            'nombreMetodo' => 'TRANSFERENCIA',
            'descripcion'  => 'Transferencia interbancaria directa y tarjeta de débito.',
            'estado'       => true,
        ], 'idMetodoPago');

        $idMetodoPaypal = DB::table('MetodoPago')->insertGetId([
            'nombreMetodo' => 'PAYPAL',
            'descripcion'  => 'Pasarela internacional de pagos en línea.',
            'estado'       => true,
        ], 'idMetodoPago');

        $metodosList = [$idMetodoEfectivo, $idMetodoQr, $idMetodoTransf, $idMetodoPaypal];

        // =========================================================================
        // 5. ESTADOS DE SERVICIO (CU08 / CU13 / CU14 / CU15)
        // =========================================================================
        $idEstadoInstalacion = DB::table('EstadoServicio')->insertGetId([
            'nombreEstado' => 'PENDIENTE_INSTALACION',
            'descripcion'  => 'Servicio registrado pendiente de tendido de fibra y activación en OLT.',
        ], 'idEstadoServicio');

        $idEstadoActivo = DB::table('EstadoServicio')->insertGetId([
            'nombreEstado' => 'ACTIVO',
            'descripcion'  => 'Servicio operando con tráfico de datos habilitado en OLT y Router.',
        ], 'idEstadoServicio');

        $idEstadoSuspendido = DB::table('EstadoServicio')->insertGetId([
            'nombreEstado' => 'SUSPENDIDO',
            'descripcion'  => 'Servicio con suspensión temporal por solicitud o mantenimiento.',
        ], 'idEstadoServicio');

        $idEstadoCortado = DB::table('EstadoServicio')->insertGetId([
            'nombreEstado' => 'CORTADO',
            'descripcion'  => 'Servicio bloqueado técnicamente por morosidad prolongada.',
        ], 'idEstadoServicio');

        // =========================================================================
        // 6. CATÁLOGO DE PLANES DE INTERNET (CU16)
        // =========================================================================
        $idPlan30 = DB::table('PlanInternet')->insertGetId([
            'nombrePlan'    => 'Plan Básico 30 Mbps',
            'velocidadMbps' => 30,
            'precioMensual' => 130.00,
            'descripcion'   => 'Fibra simétrica residencial para navegación y redes sociales.',
            'activo'        => true,
        ], 'idPlan');

        $idPlan50 = DB::table('PlanInternet')->insertGetId([
            'nombrePlan'    => 'Plan Hogar Plus 50 Mbps',
            'velocidadMbps' => 50,
            'precioMensual' => 160.00,
            'descripcion'   => 'Velocidad ideal para streaming en Full HD y teletrabajo familiar.',
            'activo'        => true,
        ], 'idPlan');

        $idPlan100 = DB::table('PlanInternet')->insertGetId([
            'nombrePlan'    => 'Plan Fibra Ultra 100 Mbps',
            'velocidadMbps' => 100,
            'precioMensual' => 200.00,
            'descripcion'   => 'Alta velocidad simétrica para múltiples dispositivos y streaming 4K.',
            'activo'        => true,
        ], 'idPlan');

        $idPlan200 = DB::table('PlanInternet')->insertGetId([
            'nombrePlan'    => 'Fibra Gamer 200 Mbps',
            'velocidadMbps' => 200,
            'precioMensual' => 250.00,
            'descripcion'   => 'Baja latencia dedicada para gaming competitivo, streaming y empresas.',
            'activo'        => true,
        ], 'idPlan');

        $planesList = [
            ['id' => $idPlan30,  'precio' => 130.00],
            ['id' => $idPlan50,  'precio' => 160.00],
            ['id' => $idPlan100, 'precio' => 200.00],
            ['id' => $idPlan200, 'precio' => 250.00],
        ];

        // =========================================================================
        // 7. 3 ZONAS DE INTERNET EN SANTA CRUZ DE LA SIERRA (CU04)
        // =========================================================================
        $areaNorte = json_encode([
            'type' => 'Polygon',
            'coordinates' => [[
                [-63.1950, -17.7550],
                [-63.1780, -17.7550],
                [-63.1780, -17.7700],
                [-63.1950, -17.7700],
                [-63.1950, -17.7550],
            ]],
        ]);

        $areaEste = json_encode([
            'type' => 'Polygon',
            'coordinates' => [[
                [-63.1450, -17.7850],
                [-63.1250, -17.7850],
                [-63.1250, -17.8050],
                [-63.1450, -17.8050],
                [-63.1450, -17.7850],
            ]],
        ]);

        $areaSur = json_encode([
            'type' => 'Polygon',
            'coordinates' => [[
                [-63.1900, -17.7850],
                [-63.1700, -17.7850],
                [-63.1700, -17.8100],
                [-63.1900, -17.8100],
                [-63.1900, -17.7850],
            ]],
        ]);

        $idZonaNorte = DB::table('Zona')->insertGetId([
            'codigo'          => 'ZON-SCZ-NORTE',
            'nombreZona'      => 'Zona Norte - Equipetrol / Sirari',
            'ciudad'          => 'Santa Cruz de la Sierra',
            'barrio'          => 'Equipetrol Norte / Sirari',
            'tecnologia'      => 'FTTH GPON',
            'capacidadNodos'  => 500,
            'estado'          => true,
            'estadoCobertura' => 'DISPONIBLE',
            'descripcion'     => 'Troncal de fibra óptica de alta densidad. Cobertura desde 2do anillo hasta 4to anillo entre Av. San Martín y Av. Busch.',
            'areaMapa'        => $areaNorte,
        ], 'idZona');

        $idZonaEste = DB::table('Zona')->insertGetId([
            'codigo'          => 'ZON-SCZ-ESTE',
            'nombreZona'      => 'Zona Este - Villa 1ro de Mayo / Plan 3000',
            'ciudad'          => 'Santa Cruz de la Sierra',
            'barrio'          => 'Villa 1ro de Mayo / Plan 3000',
            'tecnologia'      => 'FTTH GPON',
            'capacidadNodos'  => 800,
            'estado'          => true,
            'estadoCobertura' => 'DISPONIBLE',
            'descripcion'     => 'Anillo metropolitano este de alta capacidad. Cobertura residencial masiva.',
            'areaMapa'        => $areaEste,
        ], 'idZona');

        $idZonaSur = DB::table('Zona')->insertGetId([
            'codigo'          => 'ZON-SCZ-SUR',
            'nombreZona'      => 'Zona Sur - Casco Viejo / Santos Dumont',
            'ciudad'          => 'Santa Cruz de la Sierra',
            'barrio'          => 'Casco Viejo / Santos Dumont',
            'tecnologia'      => 'FTTH GPON',
            'capacidadNodos'  => 600,
            'estado'          => true,
            'estadoCobertura' => 'DISPONIBLE',
            'descripcion'     => 'Cobertura comercial y residencial central desde el 1er anillo hasta el 4to anillo Santos Dumont.',
            'areaMapa'        => $areaSur,
        ], 'idZona');

        // Zona Norte troncal para compatibilidad general
        DB::table('Zona')->insert([
            'codigo'          => 'ZON-NORTE',
            'nombreZona'      => 'Zona Norte - Troncal Tradicional',
            'ciudad'          => 'Santa Cruz de la Sierra',
            'barrio'          => 'Radial 26 / 4to Anillo',
            'tecnologia'      => 'FTTH GPON',
            'capacidadNodos'  => 500,
            'estado'          => true,
            'estadoCobertura' => 'DISPONIBLE',
            'descripcion'     => 'Troncal de fibra óptica de enlace interurbano.',
            'areaMapa'        => $areaNorte,
        ]);

        $zonas = [$idZonaNorte, $idZonaEste, $idZonaSur];

        // =========================================================================
        // 8. TÉCNICOS DE CAMPO
        // =========================================================================
        $idTecnico1 = DB::table('Tecnico')->insertGetId([
            'nombreCompleto' => 'Ing. Roberto Justiniano Suárez',
            'telefono'       => '+591 74055667',
            'especialidad'   => 'Fibra Óptica FTTH y Empalmes por Fusión',
            'activo'         => true,
        ], 'idTecnico');

        $idTecnico2 = DB::table('Tecnico')->insertGetId([
            'nombreCompleto' => 'Téc. Marco Antonio Vaca Céspedes',
            'telefono'       => '+591 75066778',
            'especialidad'   => 'Instalaciones Domiciliarias y Configuración ONT',
            'activo'         => true,
        ], 'idTecnico');

        $idTecnico3 = DB::table('Tecnico')->insertGetId([
            'nombreCompleto' => 'Téc. Fernando Aguilera Roca',
            'telefono'       => '+591 76077889',
            'especialidad'   => 'Mantenimiento de Red y Cortes Técnicos',
            'activo'         => true,
        ], 'idTecnico');

        $tecnicosList = [$idTecnico1, $idTecnico2, $idTecnico3];

        // =========================================================================
        // 9. PROVEEDORES, COMPRAS E INVENTARIO DE EQUIPOS
        // =========================================================================
        $idProvHuawei = DB::table('Proveedor')->insertGetId([
            'razonSocial' => 'Huawei Technologies Bolivia S.R.L.',
            'nit'         => '1028394021',
            'telefono'    => '+591 3 3445566',
            'correo'      => 'ventas.bolivia@huawei.com',
            'direccion'   => 'Av. San Martín, Edif. Ambassador Business Center, Piso 8',
            'estado'      => true,
        ], 'idProveedor');

        $idProvFurukawa = DB::table('Proveedor')->insertGetId([
            'razonSocial' => 'Furukawa Electric LatAm Bolivia',
            'nit'         => '1092837401',
            'telefono'    => '+591 3 3556677',
            'correo'      => 'contacto@furukawa.bo',
            'direccion'   => 'Parque Industrial PI-34, Santa Cruz de la Sierra',
            'estado'      => true,
        ], 'idProveedor');

        $idProvZte = DB::table('Proveedor')->insertGetId([
            'razonSocial' => 'ZTE Corporation Sucursal Bolivia',
            'nit'         => '1039485720',
            'telefono'    => '+591 3 3667788',
            'correo'      => 'support.bo@zte.com.cn',
            'direccion'   => 'Equipetrol Norte, Calle 7 Este #12',
            'estado'      => true,
        ], 'idProveedor');

        $idEstadoCompraOk = DB::table('EstadoCompra')->insertGetId([
            'nombreEstado' => 'COMPLETADO',
            'descripcion'  => 'Mercadería recibida, verificada e ingresada en inventario.',
        ], 'idEstadoCompra');

        DB::table('EstadoCompra')->insert([
            'nombreEstado' => 'PENDIENTE',
            'descripcion'  => 'Orden de compra enviada al proveedor pendiente de despacho.',
        ]);

        $idProdOntHuawei = DB::table('ProductoEquipo')->insertGetId([
            'nombre'      => 'Router ONT Huawei HG8145V5 Dual Band Wi-Fi 5',
            'tipoEquipo'  => 'ONU/ONT',
            'marca'       => 'Huawei',
            'modelo'      => 'EchoLife HG8145V5',
            'descripcion' => 'ONT GPON 4GE + 1POTS + USB + Wi-Fi AC 1200Mbps.',
            'estado'      => 'DISPONIBLE',
        ], 'idProducto');

        $idProdOntWifi6 = DB::table('ProductoEquipo')->insertGetId([
            'nombre'      => 'Router ONT Huawei OptiXstar HG8245W6-6T Wi-Fi 6',
            'tipoEquipo'  => 'ONU/ONT',
            'marca'       => 'Huawei',
            'modelo'      => 'OptiXstar HG8245W6',
            'descripcion' => 'ONT GPON AX3000 Wi-Fi 6 de ultra velocidad.',
            'estado'      => 'DISPONIBLE',
        ], 'idProducto');

        $idProdOnuZte = DB::table('ProductoEquipo')->insertGetId([
            'nombre'      => 'ONU ZTE F601 GPON Bridge',
            'tipoEquipo'  => 'ONU',
            'marca'       => 'ZTE',
            'modelo'      => 'ZXHN F601',
            'descripcion' => 'Terminal de red óptica con 1 puerto Gigabit Ethernet.',
            'estado'      => 'DISPONIBLE',
        ], 'idProducto');

        $idProdFibra = DB::table('ProductoEquipo')->insertGetId([
            'nombre'      => 'Bobina Cable Fibra Óptica Drop 1000m Furukawa',
            'tipoEquipo'  => 'Cableado',
            'marca'       => 'Furukawa',
            'modelo'      => 'Drop FTTH G.657A2 1FO',
            'descripcion' => 'Cable drop autosoportado para acometidas de última milla.',
            'estado'      => 'DISPONIBLE',
        ], 'idProducto');

        $idInvOnt1 = DB::table('Inventario')->insertGetId([
            'stockActual'         => 60,
            'fechaActualizacion'  => '2026-01-05 10:00:00',
            'idProducto'          => $idProdOntHuawei,
        ], 'idInventario');

        $idInvOnt2 = DB::table('Inventario')->insertGetId([
            'stockActual'         => 45,
            'fechaActualizacion'  => '2026-01-05 10:00:00',
            'idProducto'          => $idProdOntWifi6,
        ], 'idInventario');

        $idInvZte = DB::table('Inventario')->insertGetId([
            'stockActual'         => 80,
            'fechaActualizacion'  => '2026-01-05 10:00:00',
            'idProducto'          => $idProdOnuZte,
        ], 'idInventario');

        $idInvFibra = DB::table('Inventario')->insertGetId([
            'stockActual'         => 25,
            'fechaActualizacion'  => '2026-01-05 10:00:00',
            'idProducto'          => $idProdFibra,
        ], 'idInventario');

        // Registro de compra histórica de abastecimiento
        $idCompra = DB::table('Compra')->insertGetId([
            'fechaCompra'    => '2026-01-04',
            'nroComprobante' => 'COM-2026-0001',
            'montoTotal'     => 45500.00,
            'observacion'    => 'Abastecimiento de routers ONT Wi-Fi y cable drop para inicio de gestión 2026.',
            'idProveedor'    => $idProvHuawei,
            'idEstadoCompra' => $idEstadoCompraOk,
        ], 'idCompra');

        DB::table('DetalleCompra')->insert([
            'cantidad'       => 50,
            'precioUnitario' => 350.00,
            'subtotal'       => 17500.00,
            'idCompra'       => $idCompra,
            'idInventario'   => $idInvOnt1,
        ]);

        DB::table('DetalleCompra')->insert([
            'cantidad'       => 40,
            'precioUnitario' => 700.00,
            'subtotal'       => 28000.00,
            'idCompra'       => $idCompra,
            'idInventario'   => $idInvOnt2,
        ]);

        // =========================================================================
        // 10. 20 CLIENTES REALES DE SANTA CRUZ (CU05, CU06, CU07)
        // =========================================================================
        $clientesData = [
            ['ci' => '5829102', 'nombres' => 'Carlos Andrés', 'apellidos' => 'Mendoza Paredes', 'tel' => '+591 76543210', 'dir' => 'Av. San Martín #450, Edif. El Portal 3A', 'ref' => 'Frente al Hotel Los Tajibos', 'zona' => $idZonaNorte, 'lat' => -17.7612, 'lng' => -63.1892],
            ['ci' => '6928192', 'nombres' => 'María René', 'apellidos' => 'Aguilera Justiniano', 'tel' => '+591 77123456', 'dir' => 'Calle Los Tajibos #120, Sirari', 'ref' => 'A media cuadra de la plaza Sirari', 'zona' => $idZonaNorte, 'lat' => -17.7645, 'lng' => -63.1930],
            ['ci' => '7820193', 'nombres' => 'Juan Pablo', 'apellidos' => 'Camacho Ortiz', 'tel' => '+591 78901234', 'dir' => '4to Anillo y Av. Busch #310', 'ref' => 'Condominio Sevilla Norte', 'zona' => $idZonaNorte, 'lat' => -17.7580, 'lng' => -63.1840],
            ['ci' => '8392014', 'nombres' => 'Sofia Lorena', 'apellidos' => 'Vaca Pinto', 'tel' => '+591 71239845', 'dir' => 'Av. Cristo Redentor 5to Anillo #520', 'ref' => 'Detrás del Mall Las Brisas', 'zona' => $idZonaNorte, 'lat' => -17.7520, 'lng' => -63.1795],
            ['ci' => '5930291', 'nombres' => 'Rodrigo Sebastián', 'apellidos' => 'Flores Roca', 'tel' => '+591 72345678', 'dir' => 'Equipetrol Norte, Calle Güembé #85', 'ref' => 'Al lado de Farmacorp', 'zona' => $idZonaNorte, 'lat' => -17.7600, 'lng' => -63.1915],
            ['ci' => '6192830', 'nombres' => 'Andrea Paola', 'apellidos' => 'Gutiérrez Banzer', 'tel' => '+591 73456789', 'dir' => 'Sirari, Calle Palmeras #310', 'ref' => 'Entre 3er y 4to anillo', 'zona' => $idZonaNorte, 'lat' => -17.7660, 'lng' => -63.1945],
            ['ci' => '7482910', 'nombres' => 'Luis Fernando', 'apellidos' => 'Suárez Melgar', 'tel' => '+591 74567890', 'dir' => 'Av. Marcelo Terceros #205', 'ref' => 'Próximo a Ventura Mall', 'zona' => $idZonaNorte, 'lat' => -17.7570, 'lng' => -63.1870],

            ['ci' => '8201928', 'nombres' => 'Claudia Marcela', 'apellidos' => 'Antelo Chávez', 'tel' => '+591 75678901', 'dir' => 'Av. 16 de Julio #34, Villa 1ro de Mayo', 'ref' => 'Plaza Principal de la Villa', 'zona' => $idZonaEste, 'lat' => -17.7890, 'lng' => -63.1380],
            ['ci' => '5839201', 'nombres' => 'Jorge Eduardo', 'apellidos' => 'Dorado Cuéllar', 'tel' => '+591 76789012', 'dir' => 'Villa 1ro de Mayo, Calle 3 Este #215', 'ref' => 'Cerca del Mercado Primavera', 'zona' => $idZonaEste, 'lat' => -17.7920, 'lng' => -63.1350],
            ['ci' => '6938472', 'nombres' => 'Valeria Nicole', 'apellidos' => 'Saucedo Paz', 'tel' => '+591 77890123', 'dir' => 'Av. Che Guevara #890, Plan 3000', 'ref' => 'Rotonda El Mechero', 'zona' => $idZonaEste, 'lat' => -17.7980, 'lng' => -63.1310],
            ['ci' => '7483920', 'nombres' => 'Mauricio Javier', 'apellidos' => 'Ribera Montero', 'tel' => '+591 78901235', 'dir' => 'Barrio El Mechero #45, Plan 3000', 'ref' => 'Frente a Unidad Educativa', 'zona' => $idZonaEste, 'lat' => -17.8010, 'lng' => -63.1290],
            ['ci' => '8394821', 'nombres' => 'Natalia Silvana', 'apellidos' => 'Landívar Peña', 'tel' => '+591 79012346', 'dir' => 'Av. Cumavi #1100, Villa 1ro de Mayo', 'ref' => 'Cruce 3 Pasos al Frente', 'zona' => $idZonaEste, 'lat' => -17.7850, 'lng' => -63.1410],
            ['ci' => '5849203', 'nombres' => 'Diego Alejandro', 'apellidos' => 'Justiniano Pinto', 'tel' => '+591 70123457', 'dir' => 'Plan 3000, Calle San Juan #78', 'ref' => 'A dos cuadras de la Subalcaldía', 'zona' => $idZonaEste, 'lat' => -17.7950, 'lng' => -63.1330],

            ['ci' => '6294829', 'nombres' => 'Luciana Beatriz', 'apellidos' => 'Mercado Siles', 'tel' => '+591 71234568', 'dir' => 'Calle 24 de Septiembre #110, Casco Viejo', 'ref' => 'A una cuadra de la Plaza 24 de Septiembre', 'zona' => $idZonaSur, 'lat' => -17.7830, 'lng' => -63.1820],
            ['ci' => '7485921', 'nombres' => 'Gonzalo Martín', 'apellidos' => 'Terrazas Ayala', 'tel' => '+591 72345679', 'dir' => 'Calle Ayacucho #245, Casco Viejo', 'ref' => 'Frente a Cine Center Central', 'zona' => $idZonaSur, 'lat' => -17.7855, 'lng' => -63.1810],
            ['ci' => '8395029', 'nombres' => 'Gabriela Estefanía', 'apellidos' => 'Añez Ortiz', 'tel' => '+591 73456780', 'dir' => 'Av. Santos Dumont 3er Anillo #560', 'ref' => 'Frente al Parque Urbano', 'zona' => $idZonaSur, 'lat' => -17.7960, 'lng' => -63.1830],
            ['ci' => '5938294', 'nombres' => 'Fernando José', 'apellidos' => 'Roca Hurtado', 'tel' => '+591 74567891', 'dir' => 'Av. Santos Dumont 4to Anillo #320', 'ref' => 'Condominio Santos Dumont Tower', 'zona' => $idZonaSur, 'lat' => -17.8040, 'lng' => -63.1850],
            ['ci' => '6839201', 'nombres' => 'Patricia Elena', 'apellidos' => 'Chávez Salvatierra', 'tel' => '+591 75678902', 'dir' => 'Doble Vía La Guardia Km 6 #410', 'ref' => 'Próximo a Mercado Abasto Sur', 'zona' => $idZonaSur, 'lat' => -17.8110, 'lng' => -63.1900],
            ['ci' => '7492019', 'nombres' => 'Christian David', 'apellidos' => 'Morales Taborga', 'tel' => '+591 76789013', 'dir' => 'Calle Sucre #380, Casco Viejo', 'ref' => 'Entre René Moreno y Chuquisaca', 'zona' => $idZonaSur, 'lat' => -17.7840, 'lng' => -63.1790],
            ['ci' => '8392840', 'nombres' => 'Vanessa Carola', 'apellidos' => 'Hurtado Justiniano', 'tel' => '+591 77890124', 'dir' => 'Av. Santos Dumont, Barrio Hamacas #190', 'ref' => 'Calle Las Poncianas', 'zona' => $idZonaSur, 'lat' => -17.8000, 'lng' => -63.1840],
        ];

        $clientesIds = [];
        $serviciosIds = [];
        $equiposIds = [];

        // 11. Creación de Equipos Físicos para asignación en comodato
        for ($i = 1; $i <= 25; $i++) {
            $numStr = str_pad((string)$i, 4, '0', STR_PAD_LEFT);
            $macByte = str_pad(dechex($i), 2, '0', STR_PAD_LEFT);
            $prodId = ($i % 3 === 0) ? $idProdOntWifi6 : $idProdOntHuawei;

            $idEquipo = DB::table('Equipo')->insertGetId([
                'numeroSerie'  => "SN-HW-2026-{$numStr}",
                'mac'          => "BC:5F:F4:10:01:{$macByte}",
                'ip'           => "10.20.10." . (100 + $i),
                'asignada'     => ($i <= 20),
                'propiedad'    => 'TELCOM_COMODATO',
                'estadoEquipo' => 'OPERATIVO',
                'idProducto'   => $prodId,
            ], 'idEquipo');
            $equiposIds[] = $idEquipo;
        }

        // 12. Creación de los 20 Clientes, Solicitudes, Instalaciones, Servicios y Asignación de Equipos
        foreach ($clientesData as $idx => $cData) {
            $num = $idx + 1;
            $numPadded = str_pad((string)$num, 5, '0', STR_PAD_LEFT);
            $codCli = "CLI-SCZ-{$numPadded}";
            $nombreCompleto = "{$cData['nombres']} {$cData['apellidos']}";
            $email = strtolower(str_replace(' ', '.', $cData['nombres'])) . ".{$cData['ci']}@email.com";

            $idCliente = DB::table('Cliente')->insertGetId([
                'codigoCliente'       => $codCli,
                'ci'                  => $cData['ci'],
                'nombreCompleto'      => $nombreCompleto,
                'telefonoPrincipal'   => $cData['tel'],
                'telefonoSecundario'  => '+591 3 322' . str_pad((string)$num, 4, '0', STR_PAD_LEFT),
                'correo'              => $email,
                'direccion'           => $cData['dir'],
                'referenciaUbicacion' => $cData['ref'],
                'coordenadasGPS'      => "{$cData['lat']}, {$cData['lng']}",
                'fechaRegistro'       => '2026-01-02 09:00:00',
                'estadoCliente'       => 'ACTIVO',
                'idZona'              => $cData['zona'],
                'fechaBaja'           => null,
                'motivoBaja'          => null,
            ], 'idCliente');
            $clientesIds[$num] = $idCliente;

            // Solicitud e Instalación
            $idSolicitud = DB::table('SolicitudInstalacion')->insertGetId([
                'numeroOrden'     => "ORD-2026-" . str_pad((string)$num, 3, '0', STR_PAD_LEFT),
                'fechaSolicitud'  => '2026-01-03',
                'direccion'       => $cData['dir'],
                'referencia'      => $cData['ref'],
                'latitud'         => $cData['lat'],
                'longitud'        => $cData['lng'],
                'estadoSolicitud' => 'INSTALADO',
                'observacion'     => 'Instalación domiciliaria completada satisfactoriamente con potencia óptica -19 dBm.',
                'idCliente'       => $idCliente,
            ], 'idSolicitud');

            $codServicio = ($num === 1) ? 'SRV-88201' : ("SRV-SCZ-" . (88000 + $num));
            $macByte = str_pad(dechex($num), 2, '0', STR_PAD_LEFT);

            $idServicio = DB::table('ServicioInternet')->insertGetId([
                'codigoServicio'   => $codServicio,
                'fechaActivacion'  => '2026-01-05',
                'fechaCorteBase'   => '2026-01-10',
                'usuarioWinbox'    => "pppoe_{$codServicio}",
                'direccion'        => $cData['dir'],
                'referencia'       => $cData['ref'],
                'latitud'          => $cData['lat'],
                'longitud'         => $cData['lng'],
                'observacion'      => 'Acometida de fibra óptica de 1 hilo con conector SC/APC verde.',
                'idCliente'        => $idCliente,
                'idEstadoServicio' => $idEstadoActivo,
                'idZona'           => $cData['zona'],
                'ipAsignada'       => "10.20.10." . (100 + $num),
                'macRouter'        => "BC:5F:F4:10:01:{$macByte}",
                'diaCorte'         => 10,
            ], 'idServicio');
            $serviciosIds[$num] = $idServicio;

            // Cierre técnico de instalación
            DB::table('Instalacion')->insert([
                'fechaProgramada'   => '2026-01-04',
                'fechaRealizada'    => '2026-01-05',
                'costoInstalacion'  => 150.00,
                'estadoInstalacion' => 'FINALIZADO',
                'observacion'       => 'Conexión verificada en caja NAP y router sincronizado.',
                'idSolicitud'       => $idSolicitud,
                'idServicio'        => $idServicio,
                'idTecnico'         => $tecnicosList[($num - 1) % 3],
            ]);

            // Asignación de Equipo en Comodato
            DB::table('AsignacionEquipo')->insert([
                'fechaAsignacion' => '2026-01-05',
                'fechaRetiro'     => null,
                'motivoRetiro'    => null,
                'idEquipo'        => $equiposIds[$num - 1],
                'idServicio'      => $idServicio,
            ]);

            // Asignación de Plan de Internet (rotativo según cliente)
            $planElegido = $planesList[($num - 1) % 4];
            DB::table('AsignacionPlan')->insert([
                'fechaInicio'    => '2026-01-05',
                'fechaFin'       => null,
                'precioAplicado' => $planElegido['precio'],
                'motivoCambio'   => 'Alta inicial de servicio con plan contratado.',
                'idServicio'     => $idServicio,
                'idPlan'         => $planElegido['id'],
                'idUsuario'      => $idAdmin,
            ]);

            // Historial de Estado Inicial
            DB::table('HistorialEstadoServicio')->insert([
                'fechaHora'        => '2026-01-05 11:30:00',
                'observacion'      => 'Servicio activado tras verificación de potencia óptica.',
                'idServicio'       => $idServicio,
                'idEstadoAnterior' => $idEstadoInstalacion,
                'idEstadoNuevo'    => $idEstadoActivo,
            ]);
        }

        // =========================================================================
        // 13. MENSUALIDADES DESDE ENERO A OCTUBRE 2026 Y PAGOS (CU09, CU10, CU11)
        // =========================================================================
        // Períodos: 2026-01 a 2026-10 (10 meses completos para 20 clientes = 200 facturas)
        $meses = [
            '2026-01', '2026-02', '2026-03', '2026-04', '2026-05',
            '2026-06', '2026-07', '2026-08', '2026-09', '2026-10',
        ];

        $correlativoPago = 1;
        $cajerosList = [$idAdmin, $idSec1, $idSec2];

        foreach ($meses as $idxMes => $periodo) {
            $mesNum = $idxMes + 1;
            $fechaEmision = Carbon::create(2026, $mesNum, 1)->toDateString();
            $fechaVencimiento = Carbon::create(2026, $mesNum, 10)->toDateString();
            $esOctubre = ($periodo === '2026-10');

            for ($num = 1; $num <= 20; $num++) {
                $idCliente = $clientesIds[$num];
                $idServicio = $serviciosIds[$num];
                $planElegido = $planesList[($num - 1) % 4];
                $montoFactura = $planElegido['precio'];
                $codFactura = "FAC-" . (88000 + $num) . "-" . str_replace('-', '', $periodo);

                // Regla de negocio:
                // Si es Octubre: los clientes 1 a 10 están PAGADOS, y del 11 al 20 quedan PENDIENTES (10 deudores).
                // Meses anteriores (Enero a Septiembre): 100% PAGADOS.
                $debeEstarPagado = (!$esOctubre) || ($num <= 10);
                $estadoFactura = $debeEstarPagado ? 'PAGADO' : 'PENDIENTE';

                $idMensualidad = DB::table('Mensualidad')->insertGetId([
                    'periodo'          => $periodo,
                    'fechaEmision'     => $fechaEmision,
                    'fechaVencimiento' => $fechaVencimiento,
                    'monto'            => $montoFactura,
                    'estado'           => $estadoFactura,
                    'idServicio'       => $idServicio,
                    'codigoFactura'    => $codFactura,
                    'idCliente'        => $idCliente,
                ], 'idMensualidad');

                // Si está pagada, registrar Pago y DetallePago
                if ($debeEstarPagado) {
                    $diaPago = ($num % 7) + 2; // Fecha de pago entre el día 2 y 8 del mes
                    $fechaPago = Carbon::create(2026, $mesNum, $diaPago, 10 + ($num % 6), ($num * 3) % 60, 0)->toDateTimeString();
                    $nroRecibo = "REC-2026-" . str_pad((string)$correlativoPago, 5, '0', STR_PAD_LEFT);
                    $metodoId = $metodosList[$num % count($metodosList)];
                    $cajeroId = $cajerosList[$num % count($cajerosList)];

                    $idPago = DB::table('Pago')->insertGetId([
                        'fechaHora'         => $fechaPago,
                        'montoTotal'        => $montoFactura,
                        'numeroComprobante' => $nroRecibo,
                        'observacion'       => "Cobro mensualidad {$periodo} abonado {$codFactura}.",
                        'idUsuario'         => $cajeroId,
                        'idMetodoPago'      => $metodoId,
                    ], 'idPago');

                    DB::table('DetallePago')->insert([
                        'subtotal'      => $montoFactura,
                        'montoAplicado' => $montoFactura,
                        'idPago'        => $idPago,
                        'idMensualidad' => $idMensualidad,
                    ]);

                    $correlativoPago++;
                }
            }
        }

        // =========================================================================
        // 14. HISTORIAL DE CORTES Y REACTIVACIONES (CU13, CU14, CU15)
        // =========================================================================
        // Registro de un corte preventivo y una reactivación simulada en meses previos
        DB::table('AccionServicio')->insert([
            'tipoAccion'      => 'CORTE_LOGICO',
            'fechaSolicitud'  => '2026-06-12 09:00:00',
            'fechaEjecucion'  => '2026-06-12 11:30:00',
            'estado'          => 'EJECUTADO',
            'motivo'          => 'Suspensión temporal por mantenimiento de nodo',
            'observacion'     => 'Corte de señal ejecutado por terminal OLT.',
            'idServicio'      => $serviciosIds[19],
            'idUsuario'       => $idTec1,
        ]);

        DB::table('AccionServicio')->insert([
            'tipoAccion'      => 'REACTIVACION',
            'fechaSolicitud'  => '2026-06-13 14:00:00',
            'fechaEjecucion'  => '2026-06-13 14:15:00',
            'estado'          => 'EJECUTADO',
            'motivo'          => 'Rehabilitación tras normalización de acometida',
            'observacion'     => 'Señal normalizada en router ONT.',
            'idServicio'      => $serviciosIds[19],
            'idUsuario'       => $idSec1,
        ]);

        // =========================================================================
        // 15. REGISTROS DE BITÁCORA DE AUDITORÍA (CU02)
        // =========================================================================
        $bitacoraLogs = [
            ['accion' => 'LOGIN', 'modulo' => 'CU01', 'desc' => 'Inicio de sesión exitoso del Administrador.', 'user' => $idAdmin, 'ip' => '192.168.1.10'],
            ['accion' => 'CONFIG_RBAC', 'modulo' => 'CU03', 'desc' => 'Sincronización de matriz de permisos por roles.', 'user' => $idAdmin, 'ip' => '192.168.1.10'],
            ['accion' => 'CREAR_ZONA', 'modulo' => 'CU04', 'desc' => 'Creación de Zona Norte Equipetrol / Sirari.', 'user' => $idAdmin, 'ip' => '192.168.1.10'],
            ['accion' => 'CREAR_ZONA', 'modulo' => 'CU04', 'desc' => 'Creación de Zona Este Villa 1ro de Mayo.', 'user' => $idAdmin, 'ip' => '192.168.1.10'],
            ['accion' => 'CREAR_ZONA', 'modulo' => 'CU04', 'desc' => 'Creación de Zona Sur Casco Viejo.', 'user' => $idAdmin, 'ip' => '192.168.1.10'],
            ['accion' => 'CREAR_PLAN', 'modulo' => 'CU16', 'desc' => 'Alta de Plan Básico 30 Mbps en catálogo.', 'user' => $idAdmin, 'ip' => '192.168.1.10'],
            ['accion' => 'CREAR_PLAN', 'modulo' => 'CU16', 'desc' => 'Alta de Fibra Gamer 200 Mbps en catálogo.', 'user' => $idAdmin, 'ip' => '192.168.1.10'],
            ['accion' => 'REGISTRAR_CLIENTE', 'modulo' => 'CU05', 'desc' => 'Alta del cliente Carlos Andrés Mendoza Paredes (CLI-SCZ-10001).', 'user' => $idSec1, 'ip' => '192.168.1.25'],
            ['accion' => 'ACTIVAR_SERVICIO', 'modulo' => 'CU08', 'desc' => 'Activación técnica de servicio SRV-SCZ-88001 en Zona Norte.', 'user' => $idSec1, 'ip' => '192.168.1.25'],
            ['accion' => 'GENERAR_CICLO', 'modulo' => 'CU09', 'desc' => 'Emisión de mensualidades para el período 2026-10.', 'user' => $idSec2, 'ip' => '192.168.1.26'],
            ['accion' => 'REGISTRAR_PAGO', 'modulo' => 'CU10', 'desc' => 'Cobranza de mensualidad 2026-10 recibo REC-2026-00181 en ventanilla.', 'user' => $idSec2, 'ip' => '192.168.1.26'],
            ['accion' => 'CONSULTAR_ALERTAS', 'modulo' => 'CU12', 'desc' => 'Monitoreo de 10 facturas impagas del ciclo 2026-10.', 'user' => $idSec1, 'ip' => '192.168.1.25'],
        ];

        foreach ($bitacoraLogs as $log) {
            DB::table('Bitacora')->insert([
                'fechaHora'   => now()->subDays(rand(1, 15))->toDateTimeString(),
                'accion'      => $log['accion'],
                'modulo'      => $log['modulo'],
                'descripcion' => $log['desc'],
                'idUsuario'   => $log['user'],
                'ipOrigen'    => $log['ip'],
                'datosPrevios'=> null,
                'datosNuevos' => json_encode(['estado' => 'OK']),
            ]);
        }
    }
}
