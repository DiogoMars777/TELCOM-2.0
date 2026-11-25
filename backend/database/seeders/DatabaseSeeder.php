<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    /**
     * Población Integral de la Base de Datos TELCOM 2.0 (Todas las Tablas Canónicas).
     *
     * Dataset de Producción/Demo de 6 Meses Completos (Junio 2026 - Noviembre 2026):
     *  - Super Admin: admin@telcom.com / Admin123*
     *  - 6 usuarios administrativos/operativos (admin, secretaria, tecnico)
     *  - 6 zonas de cobertura en Santa Cruz (incluyendo Villa Primero de Mayo, Equipetrol, Plan 3000, etc.)
     *  - 6 planes de internet (5 activos + 1 legado inactivo)
     *  - 36 clientes con crecimiento escalonado de Junio a Noviembre 2026 (activos + 2 bajas lógicas)
     *  - 36 servicios con estados reales (ACTIVO, CORTADO, SUSPENDIDO, PENDIENTE_INSTALACION)
     *  - Upgrades de plan históricos, reemplazos de routers ONT, cortes y reactivaciones
     *  - 6 meses completos de facturación y cobranzas (2026-06 a 2026-11)
     *  - Población garantizada de todas las tablas de negocio (cero tablas vacías).
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
            'CopiaSeguridad',
            'ConfiguracionBackup',
            'ComandoVoz',
            'IntencionVozIA',
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

        $catalogoPermisos = $this->catalogoPermisos();

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

    private function catalogoPermisos(bool $incluirExtraVoz = false): array
    {
        $lista = [
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
            ['slug' => 'voz.nlp', 'nombre' => 'Procesar Intenciones de Voz con IA (NLP)', 'modulo' => 'INTELIGENCIA_VOZ', 'descripcion' => 'Procesar comandos con Gemini AI (CU30).'],
            ['slug' => 'backups.manage', 'nombre' => 'Gestionar Copias de Seguridad', 'modulo' => 'CU28', 'descripcion' => 'Generar, descargar y restaurar copias de seguridad.'],
        ];

        if ($incluirExtraVoz) {
            $lista[] = ['slug' => 'reportes.traditional', 'nombre' => 'Generar Reportes Tradicionales', 'modulo' => 'REPORTES', 'descripcion' => 'Exportar reportes estáticos en PDF y Excel (CU27).'];
            $lista[] = ['slug' => 'voz.commands', 'nombre' => 'Capturar Comandos de Voz', 'modulo' => 'ASISTENTE_VOZ', 'descripcion' => 'Dictar y transcribir consultas por voz (CU29).'];
        }

        return $lista;
    }

    /**
     * Población Integral de 6 Meses Completos (Junio 2026 - Noviembre 2026).
     */
    public function runSeniorProductionDataset(): void
    {
        // 1. Limpieza ordenada de todas las tablas de negocio
        $tablasLimpieza = [
            'CopiaSeguridad',
            'ConfiguracionBackup',
            'ComandoVoz',
            'IntencionVozIA',
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

        $existentes = array_values(array_filter($tablasLimpieza, fn ($t) => Schema::hasTable($t)));
        if (DB::connection()->getDriverName() === 'pgsql' && count($existentes) > 0) {
            $quoted = implode(', ', array_map(fn ($t) => '"' . $t . '"', $existentes));
            DB::statement("TRUNCATE TABLE {$quoted} RESTART IDENTITY CASCADE");
        } else {
            foreach ($existentes as $tabla) {
                try {
                    DB::table($tabla)->delete();
                } catch (\Throwable) {}
            }
        }

        // =========================================================================
        // 2. ROLES Y PERMISOS (CU03)
        // =========================================================================
        $idRolAdmin = DB::table('Rol')->insertGetId([
            'nombre'      => 'Administrador',
            'slug'        => 'admin',
            'descripcion' => 'Acceso total al sistema: usuarios, roles, zonas, auditoría, compras, backups y reportes IA.',
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

        $permisosIds = [];
        foreach ($this->catalogoPermisos(true) as $perm) {
            $permisosIds[$perm['slug']] = DB::table('Permiso')->insertGetId($perm, 'idPermiso');
        }

        foreach ($permisosIds as $pId) {
            DB::table('RolPermiso')->insert(['idRol' => $idRolAdmin, 'idPermiso' => $pId]);
        }

        $slugsSecretaria = [
            'auth.login', 'clientes.create', 'clientes.view', 'clientes.update',
            'servicios.view', 'servicios.manage', 'mensualidades.view', 'mensualidades.generate',
            'pagos.register', 'pagos.history', 'alertas.view', 'cortes.list', 'cortes.register',
            'reactivaciones.manage', 'planes.view', 'planes.assign', 'equipos.view',
            'equipos.assign', 'instalaciones.view', 'instalaciones.schedule',
            'reportes.view', 'reportes.traditional', 'voz.nlp',
        ];
        foreach ($slugsSecretaria as $slug) {
            if (isset($permisosIds[$slug])) {
                DB::table('RolPermiso')->insert(['idRol' => $idRolSecretaria, 'idPermiso' => $permisosIds[$slug]]);
            }
        }

        $slugsTecnico = [
            'auth.login', 'clientes.view', 'servicios.view', 'equipos.view',
            'equipos.manage', 'equipos.assign', 'instalaciones.view', 'instalaciones.execute',
        ];
        foreach ($slugsTecnico as $slug) {
            if (isset($permisosIds[$slug])) {
                DB::table('RolPermiso')->insert(['idRol' => $idRolTecnico, 'idPermiso' => $permisosIds[$slug]]);
            }
        }

        // =========================================================================
        // 3. USUARIOS Y SESIONES (CU01, CU03)
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
            'fechaCreacion'  => '2026-05-15 08:00:00',
        ], 'idUsuario');

        $idAdmin2 = DB::table('Usuario')->insertGetId([
            'nombreUsuario'  => 'alejandro.morales',
            'nombreCompleto' => 'Ing. Alejandro Morales Soliz',
            'correo'         => 'soporte.admin@telcom.com',
            'telefono'       => '+591 71022334',
            'passwordHash'   => $passwordHash,
            'idRol'          => $idRolAdmin,
            'activo'         => true,
            'fechaCreacion'  => '2026-05-18 08:30:00',
        ], 'idUsuario');

        $idSec1 = DB::table('Usuario')->insertGetId([
            'nombreUsuario'  => 'mariana.rios',
            'nombreCompleto' => 'Lic. Mariana Ríos Méndez',
            'correo'         => 'secretaria.ventas@telcom.com',
            'telefono'       => '+591 72033445',
            'passwordHash'   => $passwordHash,
            'idRol'          => $idRolSecretaria,
            'activo'         => true,
            'fechaCreacion'  => '2026-05-20 09:00:00',
        ], 'idUsuario');

        $idSec2 = DB::table('Usuario')->insertGetId([
            'nombreUsuario'  => 'valeria.cespedes',
            'nombreCompleto' => 'Valeria Céspedes Arteaga',
            'correo'         => 'secretaria.caja@telcom.com',
            'telefono'       => '+591 73044556',
            'passwordHash'   => $passwordHash,
            'idRol'          => $idRolSecretaria,
            'activo'         => true,
            'fechaCreacion'  => '2026-05-22 09:00:00',
        ], 'idUsuario');

        $idTec1 = DB::table('Usuario')->insertGetId([
            'nombreUsuario'  => 'roberto.justiniano',
            'nombreCompleto' => 'Ing. Roberto Justiniano Suárez',
            'correo'         => 'tecnico.red@telcom.com',
            'telefono'       => '+591 74055667',
            'passwordHash'   => $passwordHash,
            'idRol'          => $idRolTecnico,
            'activo'         => true,
            'fechaCreacion'  => '2026-05-25 08:00:00',
        ], 'idUsuario');

        $idTec2 = DB::table('Usuario')->insertGetId([
            'nombreUsuario'  => 'marco.vaca',
            'nombreCompleto' => 'Téc. Marco Antonio Vaca Céspedes',
            'correo'         => 'tecnico.campo@telcom.com',
            'telefono'       => '+591 75066778',
            'passwordHash'   => $passwordHash,
            'idRol'          => $idRolTecnico,
            'activo'         => true,
            'fechaCreacion'  => '2026-06-01 08:00:00',
        ], 'idUsuario');

        $usuariosAll = [$idAdmin, $idAdmin2, $idSec1, $idSec2, $idTec1, $idTec2];

        // Sesiones de usuario a lo largo de los 6 meses
        for ($s = 1; $s <= 18; $s++) {
            $loginAt = Carbon::create(2026, 6 + (($s - 1) % 6), min(25, 2 + $s), 8 + ($s % 4), 15, 0);
            $activa = ($s > 15);
            DB::table('user_sessions')->insert([
                'user_id'    => $usuariosAll[$s % count($usuariosAll)],
                'ip_address' => '192.168.10.' . (10 + $s),
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TELCOM-Portal/2.0',
                'login_at'   => $loginAt->toDateTimeString(),
                'logout_at'  => $activa ? null : $loginAt->copy()->addHours(6)->toDateTimeString(),
                'is_active'  => $activa,
                'created_at' => $loginAt->toDateTimeString(),
                'updated_at' => $loginAt->toDateTimeString(),
            ]);
        }

        // =========================================================================
        // 4. MÉTODOS DE PAGO Y ESTADOS DE SERVICIO
        // =========================================================================
        $idMetodoEfectivo = DB::table('MetodoPago')->insertGetId(['nombreMetodo' => 'EFECTIVO', 'descripcion' => 'Cobro en ventanilla institucional.', 'estado' => true], 'idMetodoPago');
        $idMetodoQr       = DB::table('MetodoPago')->insertGetId(['nombreMetodo' => 'QR', 'descripcion' => 'Pago interoperable Simple QR.', 'estado' => true], 'idMetodoPago');
        $idMetodoTransf   = DB::table('MetodoPago')->insertGetId(['nombreMetodo' => 'TRANSFERENCIA', 'descripcion' => 'Transferencia bancaria / Tarjeta.', 'estado' => true], 'idMetodoPago');
        $idMetodoPaypal   = DB::table('MetodoPago')->insertGetId(['nombreMetodo' => 'PAYPAL', 'descripcion' => 'Pasarela internacional en línea.', 'estado' => true], 'idMetodoPago');
        $metodosList      = [$idMetodoEfectivo, $idMetodoQr, $idMetodoTransf, $idMetodoPaypal];

        $idEstadoInstalacion = DB::table('EstadoServicio')->insertGetId(['nombreEstado' => 'PENDIENTE_INSTALACION', 'descripcion' => 'Pendiente de tendido de fibra óptica en domicilio.'], 'idEstadoServicio');
        $idEstadoActivo      = DB::table('EstadoServicio')->insertGetId(['nombreEstado' => 'ACTIVO', 'descripcion' => 'Operando normalmente con enlace GPON activo.'], 'idEstadoServicio');
        $idEstadoSuspendido  = DB::table('EstadoServicio')->insertGetId(['nombreEstado' => 'SUSPENDIDO', 'descripcion' => 'Suspensión temporal administrativa o por mantenimiento.'], 'idEstadoServicio');
        $idEstadoCortado     = DB::table('EstadoServicio')->insertGetId(['nombreEstado' => 'CORTADO', 'descripcion' => 'Cortado por morosidad en mensualidades vencidas.'], 'idEstadoServicio');

        // =========================================================================
        // 5. CATÁLOGO DE PLANES DE INTERNET (CU16)
        // =========================================================================
        $idPlan30  = DB::table('PlanInternet')->insertGetId(['nombrePlan' => 'Plan Básico 30 Mbps', 'velocidadMbps' => 30, 'precioMensual' => 130.00, 'descripcion' => 'Fibra simétrica residencial esencial.', 'activo' => true], 'idPlan');
        $idPlan50  = DB::table('PlanInternet')->insertGetId(['nombrePlan' => 'Plan Hogar Plus 50 Mbps', 'velocidadMbps' => 50, 'precioMensual' => 160.00, 'descripcion' => 'Streaming Full HD y teletrabajo familiar.', 'activo' => true], 'idPlan');
        $idPlan100 = DB::table('PlanInternet')->insertGetId(['nombrePlan' => 'Plan Fibra Ultra 100 Mbps', 'velocidadMbps' => 100, 'precioMensual' => 200.00, 'descripcion' => 'Alta velocidad para múltiples dispositivos 4K.', 'activo' => true], 'idPlan');
        $idPlan200 = DB::table('PlanInternet')->insertGetId(['nombrePlan' => 'Fibra Gamer 200 Mbps', 'velocidadMbps' => 200, 'precioMensual' => 250.00, 'descripcion' => 'Baja latencia dedicada para gaming y streaming.', 'activo' => true], 'idPlan');
        $idPlan300 = DB::table('PlanInternet')->insertGetId(['nombrePlan' => 'Plan Empresarial 300 Mbps', 'velocidadMbps' => 300, 'precioMensual' => 380.00, 'descripcion' => 'Enlace simétrico prioritario para oficinas y comercios.', 'activo' => true], 'idPlan');
        DB::table('PlanInternet')->insert(['nombrePlan' => 'Plan Legado 15 Mbps', 'velocidadMbps' => 15, 'precioMensual' => 95.00, 'descripcion' => 'Plan descontinuado migrado a fibra óptica.', 'activo' => false]);

        $planesList = [
            ['id' => $idPlan30,  'precio' => 130.00],
            ['id' => $idPlan50,  'precio' => 160.00],
            ['id' => $idPlan100, 'precio' => 200.00],
            ['id' => $idPlan200, 'precio' => 250.00],
            ['id' => $idPlan300, 'precio' => 380.00],
        ];

        // =========================================================================
        // 6. 6 ZONAS DE COBERTURA EN SANTA CRUZ DE LA SIERRA (CU04)
        // =========================================================================
        $idZonaNorte = DB::table('Zona')->insertGetId([
            'codigo'          => 'ZON-SCZ-NORTE',
            'nombreZona'      => 'Zona Norte - Equipetrol / Sirari',
            'ciudad'          => 'Santa Cruz de la Sierra',
            'barrio'          => 'Equipetrol Norte / Sirari',
            'sector'          => 'Sector Empresarial Norte',
            'tecnologia'      => 'FTTH GPON',
            'capacidadNodos'  => 500,
            'estado'          => true,
            'estadoCobertura' => 'Disponible',
            'descripcion'     => 'Troncal óptica desde 2do hasta 4to anillo entre Av. San Martín y Av. Busch.',
            'areaMapa'        => json_encode(['type' => 'Polygon', 'coordinates' => [[[-63.1965, -17.7520], [-63.1840, -17.7490], [-63.1755, -17.7565], [-63.1780, -17.7685], [-63.1895, -17.7720], [-63.1965, -17.7520]]]]),
        ], 'idZona');

        $idZonaVilla = DB::table('Zona')->insertGetId([
            'codigo'          => 'ZON-SCZ-VILLA',
            'nombreZona'      => 'Villa Primero de Mayo',
            'ciudad'          => 'Santa Cruz de la Sierra',
            'barrio'          => 'Villa Primero de Mayo / Villa 1ro de Mayo',
            'sector'          => 'Distrito 7 - Este',
            'tecnologia'      => 'FTTH GPON',
            'capacidadNodos'  => 900,
            'estado'          => true,
            'estadoCobertura' => 'Disponible',
            'descripcion'     => 'Cobertura residencial de alta demanda en Villa Primero de Mayo, Av. 16 de Julio y Av. Cumavi.',
            'areaMapa'        => json_encode(['type' => 'Polygon', 'coordinates' => [[[-63.1460, -17.7830], [-63.1310, -17.7810], [-63.1225, -17.7915], [-63.1260, -17.8045], [-63.1395, -17.8070], [-63.1460, -17.7830]]]]),
        ], 'idZona');

        $idZonaPlan3k = DB::table('Zona')->insertGetId([
            'codigo'          => 'ZON-SCZ-P3000',
            'nombreZona'      => 'Plan 3000 - Andrés Ibáñez',
            'ciudad'          => 'Santa Cruz de la Sierra',
            'barrio'          => 'Plan 3000 / El Mechero',
            'sector'          => 'Distrito 8 - Sudeste',
            'tecnologia'      => 'FTTH GPON',
            'capacidadNodos'  => 750,
            'estado'          => true,
            'estadoCobertura' => 'Disponible',
            'descripcion'     => 'Anillo óptico principal alrededor de la Rotonda El Mechero y Av. Che Guevara.',
            'areaMapa'        => json_encode(['type' => 'Polygon', 'coordinates' => [[[-63.1420, -17.8100], [-63.1250, -17.8080], [-63.1180, -17.8220], [-63.1330, -17.8260], [-63.1420, -17.8100]]]]),
        ], 'idZona');

        $idZonaSur = DB::table('Zona')->insertGetId([
            'codigo'          => 'ZON-SCZ-SUR',
            'nombreZona'      => 'Zona Sur - Santos Dumont',
            'ciudad'          => 'Santa Cruz de la Sierra',
            'barrio'          => 'Santos Dumont / El Pari',
            'sector'          => 'Distrito 9 - Sur',
            'tecnologia'      => 'FTTH GPON',
            'capacidadNodos'  => 600,
            'estado'          => true,
            'estadoCobertura' => 'Disponible',
            'descripcion'     => 'Cobertura desde el 2do hasta el 6to anillo Av. Santos Dumont y Doble Vía La Guardia.',
            'areaMapa'        => json_encode(['type' => 'Polygon', 'coordinates' => [[[-63.1910, -17.7845], [-63.1765, -17.7825], [-63.1685, -17.7930], [-63.1715, -17.8090], [-63.1845, -17.8115], [-63.1910, -17.7845]]]]),
        ], 'idZona');

        $idZonaCentro = DB::table('Zona')->insertGetId([
            'codigo'          => 'ZON-SCZ-CENTRO',
            'nombreZona'      => 'Casco Viejo - Centro Histórico',
            'ciudad'          => 'Santa Cruz de la Sierra',
            'barrio'          => 'Casco Viejo / 1er Anillo',
            'sector'          => 'Distrito 11 - Centro',
            'tecnologia'      => 'FTTH GPON',
            'capacidadNodos'  => 450,
            'estado'          => true,
            'estadoCobertura' => 'Disponible',
            'descripcion'     => 'Red subterránea y aérea para comercios y residencias del centro.',
            'areaMapa'        => json_encode(['type' => 'Polygon', 'coordinates' => [[[-63.1880, -17.7780], [-63.1760, -17.7780], [-63.1760, -17.7900], [-63.1880, -17.7900], [-63.1880, -17.7780]]]]),
        ], 'idZona');

        $idZonaOeste = DB::table('Zona')->insertGetId([
            'codigo'          => 'ZON-SCZ-OESTE',
            'nombreZona'      => 'Zona Oeste - Radial 26 / Pampa de la Isla',
            'ciudad'          => 'Santa Cruz de la Sierra',
            'barrio'          => 'Pampa de la Isla / Radial 26',
            'sector'          => 'Distrito 6 - Noreste',
            'tecnologia'      => 'FTTH GPON',
            'capacidadNodos'  => 550,
            'estado'          => true,
            'estadoCobertura' => 'Disponible',
            'descripcion'     => 'Expansión de fibra óptica troncal Av. Virgen de Cotoca y Pampa de la Isla.',
            'areaMapa'        => json_encode(['type' => 'Polygon', 'coordinates' => [[[-63.2080, -17.7420], [-63.1960, -17.7395], [-63.1885, -17.7465], [-63.1920, -17.7560], [-63.2080, -17.7420]]]]),
        ], 'idZona');

        // =========================================================================
        // 7. TÉCNICOS DE CAMPO
        // =========================================================================
        $idTecnico1 = DB::table('Tecnico')->insertGetId(['nombreCompleto' => 'Ing. Roberto Justiniano Suárez', 'telefono' => '+591 74055667', 'especialidad' => 'Fibra Óptica FTTH y Empalmes por Fusión', 'domicilio' => 'Av. San Martín #450, Equipetrol', 'activo' => true], 'idTecnico');
        $idTecnico2 = DB::table('Tecnico')->insertGetId(['nombreCompleto' => 'Téc. Marco Antonio Vaca Céspedes', 'telefono' => '+591 75066778', 'especialidad' => 'Instalaciones Domiciliarias y Configuración ONT', 'domicilio' => 'Calle René Moreno #230, Casco Viejo', 'activo' => true], 'idTecnico');
        $idTecnico3 = DB::table('Tecnico')->insertGetId(['nombreCompleto' => 'Téc. Fernando Aguilera Roca', 'telefono' => '+591 76077889', 'especialidad' => 'Mantenimiento de Red y Cortes Técnicos', 'domicilio' => 'Av. Santos Dumont 4to Anillo #120', 'activo' => true], 'idTecnico');
        $idTecnico4 = DB::table('Tecnico')->insertGetId(['nombreCompleto' => 'Téc. Diego Armando Soliz Peña', 'telefono' => '+591 77088990', 'especialidad' => 'Tendido Troncal y Cajas NAP', 'domicilio' => 'Av. 16 de Julio #90, Villa Primero de Mayo', 'activo' => true], 'idTecnico');
        $tecnicosList = [$idTecnico1, $idTecnico2, $idTecnico3, $idTecnico4];

        // =========================================================================
        // 8. PROVEEDORES, PRODUCTOS, INVENTARIO Y 6 MESES DE COMPRAS
        // =========================================================================
        $idProvHuawei   = DB::table('Proveedor')->insertGetId(['razonSocial' => 'Huawei Technologies Bolivia S.R.L.', 'nit' => '1028394021', 'telefono' => '+591 3 3445566', 'correo' => 'ventas.bo@huawei.com', 'direccion' => 'Av. San Martín, Edif. Ambassador Piso 8', 'estado' => true], 'idProveedor');
        $idProvFurukawa = DB::table('Proveedor')->insertGetId(['razonSocial' => 'Furukawa Electric LatAm Bolivia', 'nit' => '1092837401', 'telefono' => '+591 3 3556677', 'correo' => 'contacto@furukawa.bo', 'direccion' => 'Parque Industrial PI-34, Santa Cruz', 'estado' => true], 'idProveedor');
        $idProvZte      = DB::table('Proveedor')->insertGetId(['razonSocial' => 'ZTE Corporation Sucursal Bolivia', 'nit' => '1039485720', 'telefono' => '+591 3 3667788', 'correo' => 'support.bo@zte.com.cn', 'direccion' => 'Equipetrol Norte, Calle 7 Este #12', 'estado' => true], 'idProveedor');
        $idProvTpLink   = DB::table('Proveedor')->insertGetId(['razonSocial' => 'TP-Link Omada Enterprise Bolivia', 'nit' => '1056782301', 'telefono' => '+591 3 3778899', 'correo' => 'empresas@tplink.bo', 'direccion' => 'Av. Cristo Redentor 4to Anillo #850', 'estado' => true], 'idProveedor');
        DB::table('Proveedor')->insert(['razonSocial' => 'Importadora MikroRed Antigua S.A.', 'nit' => '1009988771', 'telefono' => '+591 3 3112233', 'correo' => 'archivo@mikrored.bo', 'direccion' => 'Calle Sucre #190', 'estado' => false]);

        $idEstadoCompraOk   = DB::table('EstadoCompra')->insertGetId(['nombreEstado' => 'COMPLETADO', 'descripcion' => 'Mercadería ingresada a almacén central.'], 'idEstadoCompra');
        $idEstadoCompraPend = DB::table('EstadoCompra')->insertGetId(['nombreEstado' => 'PENDIENTE', 'descripcion' => 'Orden emitida en tránsito aduanero.'], 'idEstadoCompra');

        $idProdOntHuawei = DB::table('ProductoEquipo')->insertGetId(['nombre' => 'Router ONT Huawei HG8145V5 Dual Band Wi-Fi 5', 'tipoEquipo' => 'ONU/ONT', 'marca' => 'Huawei', 'modelo' => 'EchoLife HG8145V5', 'descripcion' => 'ONT GPON 4GE + Wi-Fi AC 1200Mbps.', 'estado' => 'DISPONIBLE'], 'idProducto');
        $idProdOntWifi6  = DB::table('ProductoEquipo')->insertGetId(['nombre' => 'Router ONT Huawei OptiXstar HG8245W6 Wi-Fi 6', 'tipoEquipo' => 'ONU/ONT', 'marca' => 'Huawei', 'modelo' => 'OptiXstar HG8245W6', 'descripcion' => 'ONT GPON AX3000 Wi-Fi 6 empresarial.', 'estado' => 'DISPONIBLE'], 'idProducto');
        $idProdOnuZte    = DB::table('ProductoEquipo')->insertGetId(['nombre' => 'ONU ZTE F601 GPON Bridge Gigabit', 'tipoEquipo' => 'ONU', 'marca' => 'ZTE', 'modelo' => 'ZXHN F601', 'descripcion' => 'Terminal óptica bridge 1GE.', 'estado' => 'DISPONIBLE'], 'idProducto');
        $idProdRouterTp  = DB::table('ProductoEquipo')->insertGetId(['nombre' => 'Router TP-Link Archer AX53 Dual Band Wi-Fi 6', 'tipoEquipo' => 'ROUTER', 'marca' => 'TP-Link', 'modelo' => 'Archer AX53', 'descripcion' => 'Router AX3000 de alto alcance para viviendas.', 'estado' => 'DISPONIBLE'], 'idProducto');
        $idProdFibra     = DB::table('ProductoEquipo')->insertGetId(['nombre' => 'Bobina Cable Fibra Óptica Drop 1000m', 'tipoEquipo' => 'Cableado', 'marca' => 'Furukawa', 'modelo' => 'Drop FTTH G.657A2', 'descripcion' => 'Cable drop autosoportado para acometidas.', 'estado' => 'DISPONIBLE'], 'idProducto');
        $idProdNap       = DB::table('ProductoEquipo')->insertGetId(['nombre' => 'Caja NAP Preconectorizada 16 Puertos IP65', 'tipoEquipo' => 'NAP/Caja', 'marca' => 'Furukawa', 'modelo' => 'NAP-16SC-APC', 'descripcion' => 'Caja de distribución óptica en poste.', 'estado' => 'DISPONIBLE'], 'idProducto');

        $idInvOnt1  = DB::table('Inventario')->insertGetId(['stockActual' => 42, 'fechaActualizacion' => '2026-11-20 10:00:00', 'idProducto' => $idProdOntHuawei], 'idInventario');
        $idInvOnt2  = DB::table('Inventario')->insertGetId(['stockActual' => 28, 'fechaActualizacion' => '2026-11-20 10:00:00', 'idProducto' => $idProdOntWifi6], 'idInventario');
        $idInvZte   = DB::table('Inventario')->insertGetId(['stockActual' => 55, 'fechaActualizacion' => '2026-11-20 10:00:00', 'idProducto' => $idProdOnuZte], 'idInventario');
        $idInvTp    = DB::table('Inventario')->insertGetId(['stockActual' => 22, 'fechaActualizacion' => '2026-11-20 10:00:00', 'idProducto' => $idProdRouterTp], 'idInventario');
        $idInvFibra = DB::table('Inventario')->insertGetId(['stockActual' => 18, 'fechaActualizacion' => '2026-11-20 10:00:00', 'idProducto' => $idProdFibra], 'idInventario');
        $idInvNap   = DB::table('Inventario')->insertGetId(['stockActual' => 30, 'fechaActualizacion' => '2026-11-20 10:00:00', 'idProducto' => $idProdNap], 'idInventario');

        // 6 compras mensuales (Junio a Noviembre 2026)
        $comprasConfig = [
            ['fecha' => '2026-06-05', 'prov' => $idProvHuawei,   'est' => $idEstadoCompraOk,   'inv1' => $idInvOnt1, 'c1' => 30, 'p1' => 340, 'inv2' => $idInvOnt2,  'c2' => 15, 'p2' => 680, 'obs' => 'Lote inicial de equipos GPON Junio 2026.'],
            ['fecha' => '2026-07-08', 'prov' => $idProvFurukawa, 'est' => $idEstadoCompraOk,   'inv1' => $idInvFibra,'c1' => 15, 'p1' => 620, 'inv2' => $idInvNap,   'c2' => 20, 'p2' => 280, 'obs' => 'Bobinas drop y cajas NAP para expansión Villa Primero de Mayo.'],
            ['fecha' => '2026-08-10', 'prov' => $idProvZte,      'est' => $idEstadoCompraOk,   'inv1' => $idInvZte,  'c1' => 40, 'p1' => 210, 'inv2' => $idInvOnt1,  'c2' => 20, 'p2' => 340, 'obs' => 'Reposición de ONUs bridge y terminales ZTE Agosto 2026.'],
            ['fecha' => '2026-09-12', 'prov' => $idProvTpLink,   'est' => $idEstadoCompraOk,   'inv1' => $idInvTp,   'c1' => 25, 'p1' => 450, 'inv2' => $idInvOnt2,  'c2' => 10, 'p2' => 690, 'obs' => 'Routers Wi-Fi 6 Archer AX53 para migración Gamer 200M.'],
            ['fecha' => '2026-10-09', 'prov' => $idProvFurukawa, 'est' => $idEstadoCompraOk,   'inv1' => $idInvFibra,'c1' => 12, 'p1' => 630, 'inv2' => $idInvNap,   'c2' => 15, 'p2' => 285, 'obs' => 'Insumos de planta externa Plan 3000 y Zona Sur.'],
            ['fecha' => '2026-11-18', 'prov' => $idProvHuawei,   'est' => $idEstadoCompraPend, 'inv1' => $idInvOnt2, 'c1' => 25, 'p1' => 685, 'inv2' => $idInvOnt1,  'c2' => 25, 'p2' => 345, 'obs' => 'Pedido de fin de año en tránsito para nuevas instalaciones.'],
        ];

        foreach ($comprasConfig as $i => $cc) {
            $sub1 = $cc['c1'] * $cc['p1'];
            $sub2 = $cc['c2'] * $cc['p2'];
            $idCompra = DB::table('Compra')->insertGetId([
                'fechaCompra'    => $cc['fecha'],
                'nroComprobante' => 'COM-2026-' . str_pad((string) ($i + 1), 4, '0', STR_PAD_LEFT),
                'montoTotal'     => $sub1 + $sub2,
                'observacion'    => $cc['obs'],
                'idProveedor'    => $cc['prov'],
                'idEstadoCompra' => $cc['est'],
            ], 'idCompra');

            DB::table('DetalleCompra')->insert([
                ['cantidad' => $cc['c1'], 'precioUnitario' => $cc['p1'], 'subtotal' => $sub1, 'idCompra' => $idCompra, 'idInventario' => $cc['inv1']],
                ['cantidad' => $cc['c2'], 'precioUnitario' => $cc['p2'], 'subtotal' => $sub2, 'idCompra' => $idCompra, 'idInventario' => $cc['inv2']],
            ]);
        }

        // =========================================================================
        // 9. 55 EQUIPOS SERIALIZADOS
        // =========================================================================
        $equiposIds = [];
        for ($i = 1; $i <= 55; $i++) {
            $numStr  = str_pad((string) $i, 4, '0', STR_PAD_LEFT);
            $macByte = str_pad(dechex($i), 2, '0', STR_PAD_LEFT);
            $prodId  = match ($i % 4) {
                0 => $idProdOntWifi6,
                1 => $idProdOntHuawei,
                2 => $idProdOnuZte,
                default => $idProdRouterTp,
            };
            $estadoEq = ($i > 52) ? 'EN_REVISION' : 'OPERATIVO';
            $equiposIds[$i] = DB::table('Equipo')->insertGetId([
                'numeroSerie'  => "SN-TELCOM-2026-{$numStr}",
                'mac'          => "BC:5F:F4:20:06:{$macByte}",
                'ip'           => '10.20.' . (10 + intdiv($i, 25)) . '.' . (100 + ($i % 25)),
                'asignada'     => ($i <= 34),
                'propiedad'    => 'TELCOM_COMODATO',
                'estadoEquipo' => $estadoEq,
                'idProducto'   => $prodId,
            ], 'idEquipo');
        }

        // =========================================================================
        // 10. 36 CLIENTES DISTRIBUIDOS EN 6 MESES (JUNIO A NOVIEMBRE 2026)
        // =========================================================================
        $clientesData = [
            // Cohort Junio 2026 (Clientes 1..14)
            ['mesInicio' => 6,  'dia' => 3,  'zona' => $idZonaNorte,  'planIdx' => 2, 'ci' => '5829102', 'nombres' => 'Carlos Andrés',     'apellidos' => 'Mendoza Paredes',     'tel' => '+591 76543210', 'dir' => 'Av. San Martín #450, Equipetrol',                  'ref' => 'Frente al Hotel Los Tajibos',      'lat' => -17.7612, 'lng' => -63.1892],
            ['mesInicio' => 6,  'dia' => 4,  'zona' => $idZonaNorte,  'planIdx' => 3, 'ci' => '6928192', 'nombres' => 'María René',        'apellidos' => 'Aguilera Justiniano', 'tel' => '+591 77123456', 'dir' => 'Calle Los Tajibos #120, Sirari',                  'ref' => 'A media cuadra de la plaza Sirari','lat' => -17.7645, 'lng' => -63.1930],
            ['mesInicio' => 6,  'dia' => 5,  'zona' => $idZonaVilla,  'planIdx' => 1, 'ci' => '8201928', 'nombres' => 'Claudia Marcela',   'apellidos' => 'Antelo Chávez',       'tel' => '+591 75678901', 'dir' => 'Av. 16 de Julio #34, Villa Primero de Mayo',      'ref' => 'Plaza Principal de la Villa',      'lat' => -17.7890, 'lng' => -63.1380],
            ['mesInicio' => 6,  'dia' => 6,  'zona' => $idZonaVilla,  'planIdx' => 2, 'ci' => '5839201', 'nombres' => 'Jorge Eduardo',     'apellidos' => 'Dorado Cuéllar',      'tel' => '+591 76789012', 'dir' => 'Villa Primero de Mayo, Calle 3 Este #215',        'ref' => 'Cerca del Mercado Primavera',      'lat' => -17.7920, 'lng' => -63.1350],
            ['mesInicio' => 6,  'dia' => 8,  'zona' => $idZonaVilla,  'planIdx' => 0, 'ci' => '8394821', 'nombres' => 'Natalia Silvana',   'apellidos' => 'Landívar Peña',       'tel' => '+591 79012346', 'dir' => 'Av. Cumavi #1100, Villa Primero de Mayo',         'ref' => 'Cruce 3 Pasos al Frente',          'lat' => -17.7850, 'lng' => -63.1410],
            ['mesInicio' => 6,  'dia' => 10, 'zona' => $idZonaPlan3k, 'planIdx' => 1, 'ci' => '6938472', 'nombres' => 'Valeria Nicole',    'apellidos' => 'Saucedo Paz',         'tel' => '+591 77890123', 'dir' => 'Av. Che Guevara #890, Plan 3000',                 'ref' => 'Rotonda El Mechero',               'lat' => -17.7980, 'lng' => -63.1310],
            ['mesInicio' => 6,  'dia' => 11, 'zona' => $idZonaPlan3k, 'planIdx' => 0, 'ci' => '7483920', 'nombres' => 'Mauricio Javier',   'apellidos' => 'Ribera Montero',      'tel' => '+591 78901235', 'dir' => 'Barrio El Mechero #45, Plan 3000',                'ref' => 'Frente a Unidad Educativa',        'lat' => -17.8010, 'lng' => -63.1290],
            ['mesInicio' => 6,  'dia' => 12, 'zona' => $idZonaCentro, 'planIdx' => 4, 'ci' => '6294829', 'nombres' => 'Luciana Beatriz',   'apellidos' => 'Mercado Siles',       'tel' => '+591 71234568', 'dir' => 'Calle 24 de Septiembre #110, Casco Viejo',        'ref' => 'Plaza 24 de Septiembre',           'lat' => -17.7830, 'lng' => -63.1820],
            ['mesInicio' => 6,  'dia' => 14, 'zona' => $idZonaCentro, 'planIdx' => 2, 'ci' => '7485921', 'nombres' => 'Gonzalo Martín',    'apellidos' => 'Terrazas Ayala',      'tel' => '+591 72345679', 'dir' => 'Calle Ayacucho #245, Casco Viejo',                'ref' => 'Frente a Cine Center Central',     'lat' => -17.7855, 'lng' => -63.1810],
            ['mesInicio' => 6,  'dia' => 15, 'zona' => $idZonaSur,    'planIdx' => 1, 'ci' => '8395029', 'nombres' => 'Gabriela Estefanía','apellidos' => 'Añez Ortiz',          'tel' => '+591 73456780', 'dir' => 'Av. Santos Dumont 3er Anillo #560',               'ref' => 'Frente al Parque Urbano Sur',      'lat' => -17.7960, 'lng' => -63.1830],
            ['mesInicio' => 6,  'dia' => 17, 'zona' => $idZonaSur,    'planIdx' => 2, 'ci' => '5938294', 'nombres' => 'Fernando José',     'apellidos' => 'Roca Hurtado',        'tel' => '+591 74567891', 'dir' => 'Av. Santos Dumont 4to Anillo #320',               'ref' => 'Condominio Santos Dumont Tower',   'lat' => -17.8040, 'lng' => -63.1850],
            ['mesInicio' => 6,  'dia' => 18, 'zona' => $idZonaOeste,  'planIdx' => 0, 'ci' => '6839201', 'nombres' => 'Patricia Elena',    'apellidos' => 'Chávez Salvatierra',  'tel' => '+591 75678902', 'dir' => 'Radial 26 y 4to Anillo #410',                     'ref' => 'Próximo a Mercado Abasto',         'lat' => -17.7510, 'lng' => -63.2010],
            ['mesInicio' => 6,  'dia' => 20, 'zona' => $idZonaNorte,  'planIdx' => 3, 'ci' => '7820193', 'nombres' => 'Juan Pablo',        'apellidos' => 'Camacho Ortiz',       'tel' => '+591 78901234', 'dir' => '4to Anillo y Av. Busch #310',                     'ref' => 'Condominio Sevilla Norte',         'lat' => -17.7580, 'lng' => -63.1840],
            ['mesInicio' => 6,  'dia' => 22, 'zona' => $idZonaVilla,  'planIdx' => 1, 'ci' => '5910293', 'nombres' => 'Héctor Rolando',    'apellidos' => 'Banegas Suárez',      'tel' => '+591 76112233', 'dir' => 'Villa Primero de Mayo, Calle 7 Oeste #104',       'ref' => 'A 2 cuadras del Hospital Villa',   'lat' => -17.7885, 'lng' => -63.1395],

            // Cohort Julio 2026 (Clientes 15..19)
            ['mesInicio' => 7,  'dia' => 4,  'zona' => $idZonaNorte,  'planIdx' => 2, 'ci' => '8392014', 'nombres' => 'Sofia Lorena',      'apellidos' => 'Vaca Pinto',          'tel' => '+591 71239845', 'dir' => 'Av. Cristo Redentor 5to Anillo #520',             'ref' => 'Detrás del Mall Las Brisas',       'lat' => -17.7520, 'lng' => -63.1795],
            ['mesInicio' => 7,  'dia' => 9,  'zona' => $idZonaVilla,  'planIdx' => 3, 'ci' => '6192831', 'nombres' => 'Ernesto Fabián',    'apellidos' => 'Salazar Méndez',      'tel' => '+591 77223344', 'dir' => 'Villa Primero de Mayo, Av. Tres Pasos al Frente #89','ref' => 'Surtidor Los Álamos',             'lat' => -17.7910, 'lng' => -63.1360],
            ['mesInicio' => 7,  'dia' => 14, 'zona' => $idZonaPlan3k, 'planIdx' => 1, 'ci' => '5849203', 'nombres' => 'Diego Alejandro',   'apellidos' => 'Justiniano Pinto',    'tel' => '+591 70123457', 'dir' => 'Plan 3000, Calle San Juan #78',                   'ref' => 'Subalcaldía Distrito 8',           'lat' => -17.7950, 'lng' => -63.1330],
            ['mesInicio' => 7,  'dia' => 19, 'zona' => $idZonaSur,    'planIdx' => 0, 'ci' => '8392840', 'nombres' => 'Vanessa Carola',    'apellidos' => 'Hurtado Justiniano',  'tel' => '+591 77890124', 'dir' => 'Av. Santos Dumont, Barrio Hamacas #190',          'ref' => 'Calle Las Poncianas',              'lat' => -17.8000, 'lng' => -63.1840],
            ['mesInicio' => 7,  'dia' => 24, 'zona' => $idZonaCentro, 'planIdx' => 4, 'ci' => '7492019', 'nombres' => 'Christian David',   'apellidos' => 'Morales Taborga',     'tel' => '+591 76789013', 'dir' => 'Calle Sucre #380, Casco Viejo',                   'ref' => 'Entre René Moreno y Chuquisaca',   'lat' => -17.7840, 'lng' => -63.1790],

            // Cohort Agosto 2026 (Clientes 20..24)
            ['mesInicio' => 8,  'dia' => 5,  'zona' => $idZonaNorte,  'planIdx' => 4, 'ci' => '5930291', 'nombres' => 'Rodrigo Sebastián', 'apellidos' => 'Flores Roca',         'tel' => '+591 72345678', 'dir' => 'Equipetrol Norte, Calle Güembé #85',              'ref' => 'Al lado de Farmacorp',             'lat' => -17.7600, 'lng' => -63.1915],
            ['mesInicio' => 8,  'dia' => 10, 'zona' => $idZonaVilla,  'planIdx' => 2, 'ci' => '6482910', 'nombres' => 'Paola Andrea',      'apellidos' => 'Ribera Gómez',        'tel' => '+591 78334455', 'dir' => 'Villa Primero de Mayo, Calle 12 Este #450',       'ref' => 'Frente al Colegio Nacional',       'lat' => -17.7935, 'lng' => -63.1335],
            ['mesInicio' => 8,  'dia' => 15, 'zona' => $idZonaOeste,  'planIdx' => 1, 'ci' => '7593012', 'nombres' => 'Marco Antonio',     'apellidos' => 'Quiroga Arce',        'tel' => '+591 79445566', 'dir' => 'Pampa de la Isla, Calle 6 #212',                  'ref' => 'Cerca de la Iglesia Fátima',       'lat' => -17.7460, 'lng' => -63.1940],
            ['mesInicio' => 8,  'dia' => 20, 'zona' => $idZonaPlan3k, 'planIdx' => 2, 'ci' => '8120394', 'nombres' => 'Raquel Verónica',   'apellidos' => 'Zeballos Torrico',    'tel' => '+591 71556677', 'dir' => 'Plan 3000, Av. Principal #640',                   'ref' => 'Parada Línea 5',                   'lat' => -17.8130, 'lng' => -63.1320],
            ['mesInicio' => 8,  'dia' => 25, 'zona' => $idZonaSur,    'planIdx' => 1, 'ci' => '6301928', 'nombres' => 'Luis Enrique',      'apellidos' => 'Vargas Paniagua',     'tel' => '+591 72667788', 'dir' => 'Doble Vía La Guardia Km 5 #110',                  'ref' => 'Condominio Los Mangales',          'lat' => -17.8075, 'lng' => -63.1890],

            // Cohort Septiembre 2026 (Clientes 25..28)
            ['mesInicio' => 9,  'dia' => 6,  'zona' => $idZonaNorte,  'planIdx' => 1, 'ci' => '6192830', 'nombres' => 'Andrea Paola',      'apellidos' => 'Gutiérrez Banzer',    'tel' => '+591 73456789', 'dir' => 'Sirari, Calle Palmeras #310',                     'ref' => 'Entre 3er y 4to anillo',           'lat' => -17.7660, 'lng' => -63.1945],
            ['mesInicio' => 9,  'dia' => 12, 'zona' => $idZonaVilla,  'planIdx' => 3, 'ci' => '7281904', 'nombres' => 'Álvaro Mauricio',   'apellidos' => 'Pedraza Siles',       'tel' => '+591 73778899', 'dir' => 'Villa Primero de Mayo, Av. Cumavi #1450',         'ref' => 'A media cuadra del Banco Unión',   'lat' => -17.7870, 'lng' => -63.1370],
            ['mesInicio' => 9,  'dia' => 18, 'zona' => $idZonaCentro, 'planIdx' => 2, 'ci' => '5491028', 'nombres' => 'Daniela Alejandra', 'apellidos' => 'Cortez Montero',      'tel' => '+591 74889900', 'dir' => 'Calle Libertad #515, Casco Viejo',                'ref' => 'Edificio Libertad Of. 2B',         'lat' => -17.7810, 'lng' => -63.1835],
            ['mesInicio' => 9,  'dia' => 24, 'zona' => $idZonaOeste,  'planIdx' => 0, 'ci' => '8401923', 'nombres' => 'Oscar Benjamín',    'apellidos' => 'Paz Hurtado',         'tel' => '+591 75990011', 'dir' => 'Radial 26, Barrio Los Pinos #77',                 'ref' => 'Esquina Cancha Polifuncional',     'lat' => -17.7490, 'lng' => -63.1985],

            // Cohort Octubre 2026 (Clientes 29..32)
            ['mesInicio' => 10, 'dia' => 4,  'zona' => $idZonaNorte,  'planIdx' => 2, 'ci' => '7482910', 'nombres' => 'Luis Fernando',     'apellidos' => 'Suárez Melgar',       'tel' => '+591 74567890', 'dir' => 'Av. Marcelo Terceros #205',                       'ref' => 'Próximo a Ventura Mall',           'lat' => -17.7570, 'lng' => -63.1870],
            ['mesInicio' => 10, 'dia' => 10, 'zona' => $idZonaVilla,  'planIdx' => 1, 'ci' => '6729103', 'nombres' => 'Mariela Carmen',    'apellidos' => 'Subirana Cuéllar',    'tel' => '+591 76223344', 'dir' => 'Villa Primero de Mayo, Calle 9 Este #320',        'ref' => 'Frente a Farmacia Chávez',         'lat' => -17.7905, 'lng' => -63.1345],
            ['mesInicio' => 10, 'dia' => 16, 'zona' => $idZonaPlan3k, 'planIdx' => 0, 'ci' => '7910283', 'nombres' => 'Kevin Josué',       'apellidos' => 'Flores Vaca',         'tel' => '+591 77334455', 'dir' => 'Plan 3000, Barrio Guapurú #180',                  'ref' => 'Detrás del Mercado Guapurú',       'lat' => -17.8180, 'lng' => -63.1280],
            ['mesInicio' => 10, 'dia' => 22, 'zona' => $idZonaSur,    'planIdx' => 3, 'ci' => '8830192', 'nombres' => 'Camila Fernanda',   'apellidos' => 'Rivero Áñez',         'tel' => '+591 78445566', 'dir' => 'Av. Santos Dumont 5to Anillo #910',               'ref' => 'Urbanización Las Palmas Sur',      'lat' => -17.8095, 'lng' => -63.1865],

            // Cohort Noviembre 2026 (Clientes 33..36)
            ['mesInicio' => 11, 'dia' => 3,  'zona' => $idZonaVilla,  'planIdx' => 2, 'ci' => '6019283', 'nombres' => 'Sebastián Ignacio', 'apellidos' => 'Araúz Ortiz',         'tel' => '+591 79556677', 'dir' => 'Villa Primero de Mayo, Calle 15 #210',            'ref' => 'Cerca de Unidad Educativa 16',     'lat' => -17.7945, 'lng' => -63.1365],
            ['mesInicio' => 11, 'dia' => 8,  'zona' => $idZonaCentro, 'planIdx' => 4, 'ci' => '7102938', 'nombres' => 'Mónica Patricia',   'apellidos' => 'Serrano Velasco',     'tel' => '+591 71667788', 'dir' => 'Calle Junín #412, Casco Viejo',                   'ref' => 'Edificio Empresarial Junín',       'lat' => -17.7825, 'lng' => -63.1805],
            ['mesInicio' => 11, 'dia' => 22, 'zona' => $idZonaPlan3k, 'planIdx' => 1, 'ci' => '8291034', 'nombres' => 'Brayan Andrés',     'apellidos' => 'Choque Mamani',       'tel' => '+591 72778899', 'dir' => 'Plan 3000, Av. Paurito #125',                     'ref' => 'Esquina Mercado Modelo',           'lat' => -17.8160, 'lng' => -63.1240],
            ['mesInicio' => 11, 'dia' => 24, 'zona' => $idZonaOeste,  'planIdx' => 2, 'ci' => '5592014', 'nombres' => 'Lorena Beatriz',    'apellidos' => 'Arce Sandoval',       'tel' => '+591 73889900', 'dir' => 'Pampa de la Isla, Av. Virgen de Luján Km 6 #44',  'ref' => 'A 100m del 6to Anillo',            'lat' => -17.7440, 'lng' => -63.1920],
        ];

        $clientesMeta = [];
        $correlativoPago = 1;
        $cajerosList = [$idAdmin, $idSec1, $idSec2];

        foreach ($clientesData as $idx => $cData) {
            $num = $idx + 1;
            $numPadded = str_pad((string) $num, 5, '0', STR_PAD_LEFT);
            $codCli = "CLI-SCZ-{$numPadded}";
            $nombreCompleto = "{$cData['nombres']} {$cData['apellidos']}";
            $email = strtolower(preg_replace('/[^a-z]/i', '', explode(' ', $cData['nombres'])[0])) . ".{$cData['ci']}@email.com";
            $fechaReg = Carbon::create(2026, $cData['mesInicio'], $cData['dia'], 9, 0, 0);

            // Clientes 12 y 22 dados de baja lógica en meses posteriores para realismo
            $esBaja = ($num === 12 || $num === 22);
            $fechaBaja = $esBaja ? $fechaReg->copy()->addMonths(2)->toDateTimeString() : null;

            $idCliente = DB::table('Cliente')->insertGetId([
                'codigoCliente'       => $codCli,
                'ci'                  => $cData['ci'],
                'nombreCompleto'      => $nombreCompleto,
                'telefonoPrincipal'   => $cData['tel'],
                'telefonoSecundario'  => '+591 3 322' . str_pad((string) $num, 4, '0', STR_PAD_LEFT),
                'correo'              => $email,
                'direccion'           => $cData['dir'],
                'referenciaUbicacion' => $cData['ref'],
                'coordenadasGPS'      => "{$cData['lat']}, {$cData['lng']}",
                'fechaRegistro'       => $fechaReg->toDateTimeString(),
                'estadoCliente'       => $esBaja ? 'INACTIVO' : 'ACTIVO',
                'idZona'              => $cData['zona'],
                'fechaBaja'           => $fechaBaja,
                'motivoBaja'          => $esBaja ? 'Cambio de domicilio fuera de cobertura.' : null,
            ], 'idCliente');

            // Clientes 35 y 36 aún pendientes de instalación para agenda técnica de fines de noviembre
            $esPendienteInstalacion = ($num >= 35);
            // Clientes 11, 23 y 31 cortados por mora; 18 y 28 suspendidos temporalmente
            $estadoServicioId = match (true) {
                $esPendienteInstalacion      => $idEstadoInstalacion,
                in_array($num, [11, 23, 31]) => $idEstadoCortado,
                in_array($num, [18, 28])     => $idEstadoSuspendido,
                default                      => $idEstadoActivo,
            };

            $idSolicitud = DB::table('SolicitudInstalacion')->insertGetId([
                'numeroOrden'     => 'ORD-2026-' . str_pad((string) $num, 3, '0', STR_PAD_LEFT),
                'fechaSolicitud'  => $fechaReg->toDateString(),
                'direccion'       => $cData['dir'],
                'referencia'      => $cData['ref'],
                'latitud'         => $cData['lat'],
                'longitud'        => $cData['lng'],
                'estadoSolicitud' => $esPendienteInstalacion ? ($num === 35 ? 'PROGRAMADA' : 'PENDIENTE') : 'INSTALADO',
                'observacion'     => $esPendienteInstalacion ? 'Solicitud reciente agendada para cuadrilla de campo.' : 'Instalación completada con potencia óptica -18.5 dBm.',
                'idCliente'       => $idCliente,
            ], 'idSolicitud');

            $codServicio = ($num === 1) ? 'SRV-88201' : ('SRV-SCZ-' . (88000 + $num));
            $macByte = str_pad(dechex($num), 2, '0', STR_PAD_LEFT);
            $fechaActivacion = $esPendienteInstalacion ? null : $fechaReg->copy()->addDays(2)->toDateString();

            $idServicio = DB::table('ServicioInternet')->insertGetId([
                'codigoServicio'   => $codServicio,
                'fechaActivacion'  => $fechaActivacion,
                'fechaCorteBase'   => $fechaReg->copy()->addDays(7)->toDateString(),
                'usuarioWinbox'    => "pppoe_{$codServicio}",
                'direccion'        => $cData['dir'],
                'referencia'       => $cData['ref'],
                'latitud'          => $cData['lat'],
                'longitud'         => $cData['lng'],
                'observacion'      => 'Acometida fibra óptica 1 hilo SC/APC.',
                'idCliente'        => $idCliente,
                'idEstadoServicio' => $estadoServicioId,
                'idZona'           => $cData['zona'],
                'ipAsignada'       => '10.20.' . (10 + intdiv($num, 25)) . '.' . (100 + ($num % 25)),
                'macRouter'        => "BC:5F:F4:20:06:{$macByte}",
                'diaCorte'         => 10,
            ], 'idServicio');

            // Orden de Instalación (Completadas + Programada para fin de mes)
            if ($num !== 36) {
                DB::table('Instalacion')->insert([
                    'fechaProgramada'   => $esPendienteInstalacion ? '2026-11-27' : $fechaReg->copy()->addDay()->toDateString(),
                    'horaProgramada'    => sprintf('%02d:00:00', 9 + ($num % 7)),
                    'fechaRealizada'    => $esPendienteInstalacion ? null : $fechaActivacion,
                    'costoInstalacion'  => 150.00,
                    'estadoInstalacion' => $esPendienteInstalacion ? 'PROGRAMADA' : 'FINALIZADA',
                    'observacion'       => $esPendienteInstalacion ? 'Visita técnica programada en ruta.' : 'Instalación finalizada y router verificado.',
                    'idSolicitud'       => $idSolicitud,
                    'idServicio'        => $idServicio,
                    'idTecnico'         => $tecnicosList[($num - 1) % count($tecnicosList)],
                ]);
            }

            // Equipos en comodato (para los 34 servicios instalados, con 3 reemplazos históricos)
            if (! $esPendienteInstalacion) {
                if (in_array($num, [4, 15, 20])) {
                    $idxEquipoViejo = 34 + array_search($num, [4, 15, 20]) + 1;
                    DB::table('AsignacionEquipo')->insert([
                        'fechaAsignacion' => $fechaActivacion,
                        'fechaRetiro'     => Carbon::parse($fechaActivacion)->addDays(35)->toDateString(),
                        'motivoRetiro'    => 'Actualización tecnológica a equipo Wi-Fi 6 por mejora de plan.',
                        'idEquipo'        => $equiposIds[$idxEquipoViejo],
                        'idServicio'      => $idServicio,
                    ]);
                }

                DB::table('AsignacionEquipo')->insert([
                    'fechaAsignacion' => $fechaActivacion,
                    'fechaRetiro'     => null,
                    'motivoRetiro'    => null,
                    'idEquipo'        => $equiposIds[$num],
                    'idServicio'      => $idServicio,
                ]);
            }

            // Asignación de plan (con 5 upgrades históricos de plan)
            $planActual = $planesList[$cData['planIdx']];
            $fechaPlanInicio = $fechaActivacion ?? $fechaReg->toDateString();

            if (in_array($num, [1, 3, 6, 13, 16]) && $cData['planIdx'] > 0) {
                $planAnterior = $planesList[$cData['planIdx'] - 1];
                $fechaUpgrade = Carbon::parse($fechaPlanInicio)->addMonths(2)->toDateString();

                DB::table('AsignacionPlan')->insert([
                    'fechaInicio'    => $fechaPlanInicio,
                    'fechaFin'       => $fechaUpgrade,
                    'precioAplicado' => $planAnterior['precio'],
                    'motivoCambio'   => 'Plan inicial contratado en apertura de servicio.',
                    'idServicio'     => $idServicio,
                    'idPlan'         => $planAnterior['id'],
                    'idUsuario'      => $idSec1,
                ]);

                DB::table('AsignacionPlan')->insert([
                    'fechaInicio'    => $fechaUpgrade,
                    'fechaFin'       => null,
                    'precioAplicado' => $planActual['precio'],
                    'motivoCambio'   => 'Upgrade de ancho de banda solicitado por el abonado.',
                    'idServicio'     => $idServicio,
                    'idPlan'         => $planActual['id'],
                    'idUsuario'      => $idAdmin,
                ]);
            } else {
                DB::table('AsignacionPlan')->insert([
                    'fechaInicio'    => $fechaPlanInicio,
                    'fechaFin'       => null,
                    'precioAplicado' => $planActual['precio'],
                    'motivoCambio'   => 'Asignación de plan vigente.',
                    'idServicio'     => $idServicio,
                    'idPlan'         => $planActual['id'],
                    'idUsuario'      => $idSec1,
                ]);
            }

            // Historial de estado inicial + cambios para cortados/suspendidos/reactivados
            if (! $esPendienteInstalacion) {
                DB::table('HistorialEstadoServicio')->insert([
                    'fechaHora'        => $fechaActivacion . ' 11:30:00',
                    'observacion'      => 'Servicio activado tras cierre de instalación técnica.',
                    'idServicio'       => $idServicio,
                    'idEstadoAnterior' => $idEstadoInstalacion,
                    'idEstadoNuevo'    => $idEstadoActivo,
                ]);
            }

            if (in_array($num, [11, 23, 31])) {
                DB::table('HistorialEstadoServicio')->insert([
                    'fechaHora'        => '2026-11-12 10:15:00',
                    'observacion'      => 'Corte lógico aplicado por mora superior a 2 períodos.',
                    'idServicio'       => $idServicio,
                    'idEstadoAnterior' => $idEstadoActivo,
                    'idEstadoNuevo'    => $idEstadoCortado,
                ]);

                DB::table('AccionServicio')->insert([
                    'tipoAccion'     => 'CORTE_LOGICO',
                    'fechaSolicitud' => '2026-11-11 16:00:00',
                    'fechaEjecucion' => '2026-11-12 10:15:00',
                    'estado'         => 'EJECUTADO',
                    'motivo'         => 'Mensualidades vencidas impagas.',
                    'observacion'    => 'Perfil bloqueado en OLT GPON.',
                    'idServicio'     => $idServicio,
                    'idUsuario'      => $idTec1,
                ]);
            } elseif (in_array($num, [18, 28])) {
                DB::table('HistorialEstadoServicio')->insert([
                    'fechaHora'        => '2026-11-05 09:40:00',
                    'observacion'      => 'Suspensión temporal por viaje del abonado.',
                    'idServicio'       => $idServicio,
                    'idEstadoAnterior' => $idEstadoActivo,
                    'idEstadoNuevo'    => $idEstadoSuspendido,
                ]);

                DB::table('AccionServicio')->insert([
                    'tipoAccion'     => 'CORTE_FISICO',
                    'fechaSolicitud' => '2026-11-04 14:30:00',
                    'fechaEjecucion' => '2026-11-05 09:40:00',
                    'estado'         => 'EJECUTADO',
                    'motivo'         => 'Solicitud de suspensión temporal por 30 días.',
                    'observacion'    => 'Desconexión temporal en caja NAP.',
                    'idServicio'     => $idServicio,
                    'idUsuario'      => $idTec2,
                ]);
            } elseif (in_array($num, [5, 19])) {
                // Clientes cortados en meses previos y luego reactivados
                DB::table('AccionServicio')->insert([
                    'tipoAccion'     => 'CORTE_LOGICO',
                    'fechaSolicitud' => '2026-09-12 08:30:00',
                    'fechaEjecucion' => '2026-09-12 11:00:00',
                    'estado'         => 'EJECUTADO',
                    'motivo'         => 'Atraso de factura Septiembre 2026.',
                    'observacion'    => 'Corte aplicado desde consola OLT.',
                    'idServicio'     => $idServicio,
                    'idUsuario'      => $idTec1,
                ]);
                DB::table('AccionServicio')->insert([
                    'tipoAccion'     => 'REACTIVACION',
                    'fechaSolicitud' => '2026-09-14 15:00:00',
                    'fechaEjecucion' => '2026-09-14 15:20:00',
                    'estado'         => 'EJECUTADO',
                    'motivo'         => 'Regularización total de deuda en caja.',
                    'observacion'    => 'Servicio rehabilitado correctamente.',
                    'idServicio'     => $idServicio,
                    'idUsuario'      => $idSec2,
                ]);
            }

            $clientesMeta[] = [
                'num'            => $num,
                'idCliente'      => $idCliente,
                'idServicio'     => $idServicio,
                'mesInicio'      => $cData['mesInicio'],
                'precioMensual'  => $planActual['precio'],
                'pendienteInst'  => $esPendienteInstalacion,
                'esBaja'         => $esBaja,
                'esCortado'      => in_array($num, [11, 23, 31]),
            ];
        }

        // =========================================================================
        // 11. MENSUALIDADES Y PAGOS DE LOS 6 MESES (2026-06 A 2026-11)
        // =========================================================================
        $meses = [
            ['anio' => 2026, 'mes' => 6,  'periodo' => '2026-06'],
            ['anio' => 2026, 'mes' => 7,  'periodo' => '2026-07'],
            ['anio' => 2026, 'mes' => 8,  'periodo' => '2026-08'],
            ['anio' => 2026, 'mes' => 9,  'periodo' => '2026-09'],
            ['anio' => 2026, 'mes' => 10, 'periodo' => '2026-10'],
            ['anio' => 2026, 'mes' => 11, 'periodo' => '2026-11'],
        ];

        foreach ($meses as $m) {
            $fechaEmision     = Carbon::create($m['anio'], $m['mes'], 1)->toDateString();
            $fechaVencimiento = Carbon::create($m['anio'], $m['mes'], 10)->toDateString();

            foreach ($clientesMeta as $cm) {
                if ($cm['pendienteInst'] || $m['mes'] < $cm['mesInicio']) {
                    continue;
                }
                // Si el cliente fue dado de baja 2 meses después de su alta, no facturar meses posteriores a su baja
                if ($cm['esBaja'] && $m['mes'] > ($cm['mesInicio'] + 2)) {
                    continue;
                }

                $num = $cm['num'];
                $monto = $cm['precioMensual'];
                $codFactura = 'FAC-' . (88000 + $num) . '-' . str_replace('-', '', $m['periodo']);

                // Lógica realista de cobranza y mora:
                // - Clientes cortados (11, 23, 31): deben Octubre y Noviembre (y 11 también Septiembre).
                // - En Noviembre (mes actual 2026-11): ~65% pagado y ~35% pendiente de cobro.
                // - Meses Junio..Agosto: pagados.
                $pendiente = false;
                if ($cm['esCortado'] && $m['mes'] >= 10) {
                    $pendiente = true;
                } elseif ($num === 11 && $m['mes'] === 9) {
                    $pendiente = true;
                } elseif ($m['mes'] === 10 && in_array($num, [7, 24])) {
                    $pendiente = true;
                } elseif ($m['mes'] === 11 && ($num % 3 === 0 || $num >= 29)) {
                    $pendiente = true;
                }

                $estadoFactura = $pendiente ? 'PENDIENTE' : 'PAGADO';

                $idMensualidad = DB::table('Mensualidad')->insertGetId([
                    'periodo'          => $m['periodo'],
                    'fechaEmision'     => $fechaEmision,
                    'fechaVencimiento' => $fechaVencimiento,
                    'monto'            => $monto,
                    'estado'           => $estadoFactura,
                    'idServicio'       => $cm['idServicio'],
                    'codigoFactura'    => $codFactura,
                    'idCliente'        => $cm['idCliente'],
                ], 'idMensualidad');

                if (! $pendiente) {
                    $diaPago   = min(24, 2 + ($num % 14));
                    $fechaPago = Carbon::create($m['anio'], $m['mes'], $diaPago, 9 + ($num % 8), ($num * 7) % 60, 0)->toDateTimeString();
                    $nroRecibo = 'REC-2026-' . str_pad((string) $correlativoPago, 5, '0', STR_PAD_LEFT);
                    $metodoId  = $metodosList[($num + $m['mes']) % count($metodosList)];
                    $cajeroId  = $cajerosList[$num % count($cajerosList)];

                    $idPago = DB::table('Pago')->insertGetId([
                        'fechaHora'         => $fechaPago,
                        'montoTotal'        => $monto,
                        'numeroComprobante' => $nroRecibo,
                        'observacion'       => "Pago mensualidad {$m['periodo']} factura {$codFactura}.",
                        'idUsuario'         => $cajeroId,
                        'idMetodoPago'      => $metodoId,
                    ], 'idPago');

                    DB::table('DetallePago')->insert([
                        'subtotal'      => $monto,
                        'montoAplicado' => $monto,
                        'idPago'        => $idPago,
                        'idMensualidad' => $idMensualidad,
                    ]);

                    $correlativoPago++;
                }
            }
        }

        // =========================================================================
        // 12. BITÁCORA DE AUDITORÍA (CU02) — HISTORIAL DE 6 MESES
        // =========================================================================
        $eventosAuditoria = [
            ['2026-06-01 08:30:00', 'LOGIN', 'CU01', 'Inicio de sesión inicial del Super Administrador.', $idAdmin],
            ['2026-06-02 09:15:00', 'CREAR_ZONA', 'CU04', 'Registro de zona Villa Primero de Mayo (ZON-SCZ-VILLA).', $idAdmin],
            ['2026-06-05 10:40:00', 'REGISTRAR_COMPRA', 'CU25', 'Ingreso de compra COM-2026-0001 de Huawei Technologies.', $idAdmin],
            ['2026-07-08 11:20:00', 'REGISTRAR_COMPRA', 'CU25', 'Ingreso de compra COM-2026-0002 de Furukawa Electric.', $idAdmin2],
            ['2026-07-14 15:05:00', 'ASIGNAR_EQUIPO', 'CU19', 'Asignación masiva de equipos ONT GPON en Villa Primero de Mayo.', $idTec1],
            ['2026-08-10 09:45:00', 'UPGRADE_PLAN', 'CU17', 'Migración de abonados pioneros a Fibra Ultra 100M y Gamer 200M.', $idSec1],
            ['2026-09-12 11:05:00', 'REGISTRAR_CORTE', 'CU14', 'Ejecución de cortes preventivos en servicios morosos.', $idTec1],
            ['2026-09-14 15:25:00', 'REACTIVAR_SERVICIO', 'CU15', 'Reactivación de servicios tras cobranza en caja.', $idSec2],
            ['2026-10-01 08:05:00', 'GENERAR_MENSUALIDAD', 'CU09', 'Emisión automática del ciclo de facturación 2026-10.', $idSec2],
            ['2026-10-18 16:30:00', 'REEMPLAZO_EQUIPO', 'CU20', 'Cambio preventivo de router a estándar Wi-Fi 6.', $idTec2],
            ['2026-11-01 08:02:00', 'GENERAR_MENSUALIDAD', 'CU09', 'Emisión masiva de mensualidades del ciclo 2026-11.', $idSec1],
            ['2026-11-12 10:20:00', 'REGISTRAR_CORTE', 'CU14', 'Corte lógico aplicado a clientes con mora superior a 60 días.', $idTec1],
            ['2026-11-18 14:15:00', 'REGISTRAR_COMPRA', 'CU25', 'Emisión de orden COM-2026-0006 para stock de fin de año.', $idAdmin],
            ['2026-11-24 18:10:00', 'GENERAR_REPORTE', 'CU27', 'Exportación oficial de cartera morosa y recaudación mensual.', $idAdmin],
        ];

        foreach ($eventosAuditoria as [$fecha, $accion, $modulo, $desc, $userId]) {
            DB::table('Bitacora')->insert([
                'fechaHora'   => $fecha,
                'accion'      => $accion,
                'modulo'      => $modulo,
                'descripcion' => $desc,
                'idUsuario'   => $userId,
                'ipOrigen'    => '192.168.10.10',
                'datosPrevios'=> null,
                'datosNuevos' => json_encode(['estado' => 'OK']),
            ]);
        }

        // =========================================================================
        // 13. VOZ, IA (CU29 / CU30) Y COPIAS DE SEGURIDAD (CU28)
        // =========================================================================
        $comandosVoz = [
            ['texto' => 'Muéstrame los clientes de Villa Primero de Mayo y sus planes', 'intencion' => 'CONSULTA_CLIENTES_PLANES', 'params' => ['zona' => 'Villa Primero de Mayo']],
            ['texto' => 'Cuántos ingresos recaudamos en noviembre de 2026', 'intencion' => 'REPORTE_INGRESOS', 'params' => ['periodo' => '2026-11']],
            ['texto' => 'Ver mensualidades pendientes de cobro', 'intencion' => 'REPORTE_MOROSIDAD', 'params' => ['estado' => 'PENDIENTE']],
            ['texto' => 'Cuánto inventario disponible de routers tenemos', 'intencion' => 'INVENTARIO_EQUIPOS', 'params' => ['equipo' => 'Router']],
        ];
        foreach ($comandosVoz as $idx => $cv) {
            DB::table('ComandoVoz')->insert([
                'idUsuario'        => $idAdmin,
                'textoDictado'     => $cv['texto'],
                'intencion'        => $cv['intencion'],
                'parametros'       => json_encode($cv['params']),
                'confianza'        => 0.98,
                'estado'           => 'EJECUTADO',
                'duracionSegundos' => 2.5 + ($idx * 0.4),
                'created_at'       => now()->subDays(4 - $idx),
                'updated_at'       => now()->subDays(4 - $idx),
            ]);
        }

        $intencionesNlp = [
            ['texto' => 'Mostrar servicios para corte en mora', 'canon' => 'SERVICIOS_CORTE', 'cat' => 'Cobranza y Cortes', 'dest' => 'CU13', 'resp' => 'Se detectaron 3 servicios cortados y cuentas pendientes listas para gestión.'],
            ['texto' => 'Consultar routers Wi-Fi 6 en inventario', 'canon' => 'EQUIPOS_INVENTARIO', 'cat' => 'Equipos e Inventario', 'dest' => 'CU18', 'resp' => 'Hay unidades disponibles en almacén central para asignación inmediata.'],
            ['texto' => 'Historial de pagos recaudados en el mes', 'canon' => 'HISTORIAL_PAGOS', 'cat' => 'Facturación y Cobranzas', 'dest' => 'CU11', 'resp' => 'Mostrando los comprobantes de cobro emitidos en Noviembre 2026.'],
            ['texto' => 'Solicitudes de instalación pendientes de agendar', 'canon' => 'SOLICITUD_INSTALACION', 'cat' => 'Instalaciones Técnicas', 'dest' => 'CU21', 'resp' => 'Tienes 2 solicitudes nuevas listas para atención técnica en campo.'],
        ];
        foreach ($intencionesNlp as $idx => $nlp) {
            DB::table('IntencionVozIA')->insert([
                'idUsuario'             => $idAdmin,
                'textoEntrada'          => $nlp['texto'],
                'intencionCanonica'     => $nlp['canon'],
                'categoria'             => $nlp['cat'],
                'confianza'             => 0.97,
                'motor'                 => 'GEMINI_AI',
                'entidadesExtraidas'    => json_encode(['periodo' => '2026-11']),
                'accionSugerida'        => json_encode(['tipo' => 'navigate_to', 'destino' => $nlp['dest']]),
                'respuestaAsistente'    => $nlp['resp'],
                'datosEnVivo'           => json_encode(['mensaje' => $nlp['resp']]),
                'estado'                => 'PROCESADO',
                'tiempoProcesamientoMs' => 420 + ($idx * 35),
                'created_at'            => now()->subDays(3 - $idx),
                'updated_at'            => now()->subDays(3 - $idx),
            ]);
        }

        DB::table('ConfiguracionBackup')->insert([
            'activo'          => true,
            'frecuencia'      => 'DIARIO',
            'horaEjecucion'   => '02:00',
            'diasSemana'      => json_encode(['1', '2', '3', '4', '5', '6', '0']),
            'diaMes'          => 1,
            'retencionCopias' => 7,
            'ultimoBackupAt'  => '2026-11-25 02:00:00',
            'proximoBackupAt' => '2026-11-26 02:00:00',
            'ultimoEstado'    => 'COMPLETADO',
            'ultimoMensaje'   => 'Copia automática nocturna ejecutada sin errores.',
            'created_at'      => '2026-06-01 08:00:00',
            'updated_at'      => '2026-11-25 02:00:00',
        ]);

        DB::table('CopiaSeguridad')->insert([
            [
                'nombreArchivo' => 'backup_telcom_auto_2026-11-24_020000.sql',
                'ruta'          => 'backups/backup_telcom_auto_2026-11-24_020000.sql',
                'tamanoBytes'   => 248320,
                'tamanoLegible' => '242.50 KB',
                'idUsuario'     => $idAdmin,
                'descripcion'   => 'Copia automática programada (DIARIO) — Respaldo integral.',
                'tipo'          => 'AUTOMATICA',
                'estado'        => 'COMPLETADO',
                'fechaHora'     => '2026-11-24 02:00:00',
            ],
            [
                'nombreArchivo' => 'backup_telcom_manual_2026-11-25_070000.sql',
                'ruta'          => 'backups/backup_telcom_manual_2026-11-25_070000.sql',
                'tamanoBytes'   => 264192,
                'tamanoLegible' => '258.00 KB',
                'idUsuario'     => $idAdmin,
                'descripcion'   => 'Respaldo manual tras cierre de población de 6 meses.',
                'tipo'          => 'MANUAL',
                'estado'        => 'COMPLETADO',
                'fechaHora'     => '2026-11-25 07:00:00',
            ],
        ]);
    }
}
