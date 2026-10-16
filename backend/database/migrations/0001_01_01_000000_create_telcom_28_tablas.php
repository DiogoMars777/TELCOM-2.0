<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * En PostgreSQL, evitar transacciones para que cada CREATE TABLE se confirme de inmediato.
     */
    public $withinTransaction = false;

    /**
     * Esquema Canónico TELCOM (28 Tablas Relacionales).
     */
    public function up(): void
    {
        // 1. Permiso
        Schema::create('Permiso', function (Blueprint $table) {
            $table->id('idPermiso');
            $table->string('nombre', 50);
            $table->text('descripcion')->nullable();
            $table->string('slug', 100)->nullable()->index();
            $table->string('modulo', 50)->nullable();
        });

        // 2. Rol
        Schema::create('Rol', function (Blueprint $table) {
            $table->id('idRol');
            $table->string('nombre', 50);
            $table->text('descripcion')->nullable();
            $table->string('slug', 50)->nullable()->index();
            $table->boolean('activo')->default(true);
        });

        // 3. RolPermiso
        Schema::create('RolPermiso', function (Blueprint $table) {
            $table->id('idRolPermiso');
            $table->foreignId('idRol')->constrained('Rol', 'idRol')->cascadeOnDelete();
            $table->foreignId('idPermiso')->constrained('Permiso', 'idPermiso')->cascadeOnDelete();
        });

        // 4. Usuario
        Schema::create('Usuario', function (Blueprint $table) {
            $table->id('idUsuario');
            $table->string('nombreUsuario', 50)->unique();
            $table->text('passwordHash');
            $table->string('nombreCompleto', 100)->nullable();
            $table->string('telefono', 20)->nullable();
            $table->string('correo', 100)->nullable()->unique();
            $table->boolean('activo')->default(true);
            $table->timestamp('fechaCreacion')->useCurrent();
            $table->foreignId('idRol')->nullable()->constrained('Rol', 'idRol')->nullOnDelete();
            $table->rememberToken();
        });

        // 5. Bitacora
        Schema::create('Bitacora', function (Blueprint $table) {
            $table->id('idBitacora');
            $table->timestamp('fechaHora')->useCurrent();
            $table->string('accion', 100)->nullable();
            $table->string('modulo', 100)->nullable();
            $table->text('descripcion')->nullable();
            $table->foreignId('idUsuario')->nullable()->constrained('Usuario', 'idUsuario')->nullOnDelete();
            $table->string('ipOrigen', 45)->nullable();
            $table->json('datosPrevios')->nullable();
            $table->json('datosNuevos')->nullable();
        });

        // 6. Zona
        Schema::create('Zona', function (Blueprint $table) {
            $table->id('idZona');
            $table->string('nombreZona', 50);
            $table->text('descripcion')->nullable();
            $table->boolean('estado')->default(true);
            $table->string('codigo', 50)->nullable();
            $table->string('ciudad', 100)->nullable();
            $table->string('tecnologia', 100)->nullable();
            $table->integer('capacidadNodos')->default(100);
            $table->string('barrio', 150)->nullable();
            $table->string('estadoCobertura', 30)->nullable();
            $table->json('areaMapa')->nullable();
        });

        // 7. Cliente
        Schema::create('Cliente', function (Blueprint $table) {
            $table->id('idCliente');
            $table->string('codigoCliente', 30)->unique();
            $table->string('ci', 20)->nullable();
            $table->string('nombreCompleto', 100);
            $table->string('telefonoPrincipal', 20)->nullable();
            $table->string('telefonoSecundario', 20)->nullable();
            $table->string('correo', 100)->nullable();
            $table->text('direccion')->nullable();
            $table->text('referenciaUbicacion')->nullable();
            $table->string('coordenadasGPS', 50)->nullable();
            $table->timestamp('fechaRegistro')->useCurrent();
            $table->string('estadoCliente', 50)->default('ACTIVO');
            $table->foreignId('idZona')->nullable()->constrained('Zona', 'idZona')->nullOnDelete();
            $table->timestamp('fechaBaja')->nullable();
            $table->string('motivoBaja', 255)->nullable();
        });

        // 8. PlanInternet
        Schema::create('PlanInternet', function (Blueprint $table) {
            $table->id('idPlan');
            $table->string('nombrePlan', 50)->nullable();
            $table->integer('velocidadMbps')->nullable();
            $table->decimal('precioMensual', 10, 2)->nullable();
            $table->text('descripcion')->nullable();
            $table->boolean('activo')->default(true);
        });

        // 9. EstadoServicio
        Schema::create('EstadoServicio', function (Blueprint $table) {
            $table->id('idEstadoServicio');
            $table->string('nombreEstado', 50)->nullable();
            $table->text('descripcion')->nullable();
        });

        // 10. ServicioInternet
        Schema::create('ServicioInternet', function (Blueprint $table) {
            $table->id('idServicio');
            $table->date('fechaActivacion')->nullable();
            $table->date('fechaCorteBase')->nullable();
            $table->string('usuarioWinbox', 100)->nullable();
            $table->text('direccion')->nullable();
            $table->text('referencia')->nullable();
            $table->decimal('latitud', 10, 7)->nullable();
            $table->decimal('longitud', 10, 7)->nullable();
            $table->text('observacion')->nullable();
            $table->foreignId('idCliente')->nullable()->constrained('Cliente', 'idCliente')->cascadeOnDelete();
            $table->foreignId('idEstadoServicio')->nullable()->constrained('EstadoServicio', 'idEstadoServicio')->nullOnDelete();
            $table->foreignId('idZona')->nullable()->constrained('Zona', 'idZona')->nullOnDelete();
            $table->string('codigoServicio', 50)->nullable();
            $table->string('ipAsignada', 50)->nullable();
            $table->string('macRouter', 50)->nullable();
            $table->integer('diaCorte')->default(10);
        });

        // 11. AsignacionPlan
        Schema::create('AsignacionPlan', function (Blueprint $table) {
            $table->id('idAsignacionPlan');
            $table->date('fechaInicio')->nullable();
            $table->date('fechaFin')->nullable();
            $table->decimal('precioAplicado', 10, 2)->nullable();
            $table->text('motivoCambio')->nullable();
            $table->foreignId('idServicio')->constrained('ServicioInternet', 'idServicio')->cascadeOnDelete();
            $table->foreignId('idPlan')->constrained('PlanInternet', 'idPlan')->restrictOnDelete();
            $table->foreignId('idUsuario')->nullable()->constrained('Usuario', 'idUsuario')->nullOnDelete();
        });

        // 12. HistorialEstadoServicio
        Schema::create('HistorialEstadoServicio', function (Blueprint $table) {
            $table->id('idHistorialEstado');
            $table->timestamp('fechaHora')->useCurrent();
            $table->text('observacion')->nullable();
            $table->foreignId('idServicio')->constrained('ServicioInternet', 'idServicio')->cascadeOnDelete();
            $table->foreignId('idEstadoAnterior')->nullable()->constrained('EstadoServicio', 'idEstadoServicio')->nullOnDelete();
            $table->foreignId('idEstadoNuevo')->nullable()->constrained('EstadoServicio', 'idEstadoServicio')->nullOnDelete();
        });

        // 13. AccionServicio
        Schema::create('AccionServicio', function (Blueprint $table) {
            $table->id('idAccion');
            $table->string('tipoAccion', 50)->nullable();
            $table->timestamp('fechaSolicitud')->nullable();
            $table->timestamp('fechaEjecucion')->nullable();
            $table->string('estado', 50)->nullable();
            $table->text('motivo')->nullable();
            $table->text('observacion')->nullable();
            $table->foreignId('idServicio')->constrained('ServicioInternet', 'idServicio')->cascadeOnDelete();
            $table->foreignId('idUsuario')->nullable()->constrained('Usuario', 'idUsuario')->nullOnDelete();
        });

        // 14. MetodoPago
        Schema::create('MetodoPago', function (Blueprint $table) {
            $table->id('idMetodoPago');
            $table->string('nombreMetodo', 50);
            $table->text('descripcion')->nullable();
            $table->boolean('estado')->default(true);
        });

        // 15. Pago
        Schema::create('Pago', function (Blueprint $table) {
            $table->id('idPago');
            $table->timestamp('fechaHora')->useCurrent();
            $table->decimal('montoTotal', 10, 2)->nullable();
            $table->string('numeroComprobante', 50)->nullable();
            $table->text('observacion')->nullable();
            $table->foreignId('idUsuario')->nullable()->constrained('Usuario', 'idUsuario')->nullOnDelete();
            $table->foreignId('idMetodoPago')->nullable()->constrained('MetodoPago', 'idMetodoPago')->restrictOnDelete();
        });

        // 16. Mensualidad
        Schema::create('Mensualidad', function (Blueprint $table) {
            $table->id('idMensualidad');
            $table->string('periodo', 20)->nullable();
            $table->date('fechaVencimiento')->nullable();
            $table->decimal('monto', 10, 2)->nullable();
            $table->string('estado', 30)->nullable();
            $table->foreignId('idServicio')->constrained('ServicioInternet', 'idServicio')->cascadeOnDelete();
            $table->string('codigoFactura', 50)->nullable();
            $table->date('fechaEmision')->nullable();
            $table->foreignId('idCliente')->nullable()->constrained('Cliente', 'idCliente')->cascadeOnDelete();
        });

        // 17. DetallePago
        Schema::create('DetallePago', function (Blueprint $table) {
            $table->id('idDetallePago');
            $table->decimal('subtotal', 10, 2)->nullable();
            $table->decimal('montoAplicado', 10, 2)->nullable();
            $table->foreignId('idPago')->constrained('Pago', 'idPago')->cascadeOnDelete();
            $table->foreignId('idMensualidad')->constrained('Mensualidad', 'idMensualidad')->restrictOnDelete();
        });

        // 18. ProductoEquipo
        Schema::create('ProductoEquipo', function (Blueprint $table) {
            $table->id('idProducto');
            $table->string('nombre', 100)->nullable();
            $table->string('tipoEquipo', 50)->nullable();
            $table->string('marca', 50)->nullable();
            $table->string('modelo', 50)->nullable();
            $table->text('descripcion')->nullable();
            $table->string('estado', 30)->nullable();
        });

        // 19. Inventario
        Schema::create('Inventario', function (Blueprint $table) {
            $table->id('idInventario');
            $table->integer('stockActual')->default(0);
            $table->timestamp('fechaActualizacion')->useCurrent();
            $table->foreignId('idProducto')->unique()->constrained('ProductoEquipo', 'idProducto')->cascadeOnDelete();
        });

        // 20. Equipo
        Schema::create('Equipo', function (Blueprint $table) {
            $table->id('idEquipo');
            $table->string('numeroSerie', 100)->unique()->nullable();
            $table->string('mac', 50)->nullable();
            $table->string('ip', 50)->nullable();
            $table->boolean('asignada')->default(false);
            $table->string('propiedad', 50)->nullable();
            $table->string('estadoEquipo', 50)->nullable();
            $table->foreignId('idProducto')->nullable()->constrained('ProductoEquipo', 'idProducto')->restrictOnDelete();
        });

        // 21. AsignacionEquipo
        Schema::create('AsignacionEquipo', function (Blueprint $table) {
            $table->id('idAsignacionEquipo');
            $table->date('fechaAsignacion')->nullable();
            $table->date('fechaRetiro')->nullable();
            $table->text('motivoRetiro')->nullable();
            $table->foreignId('idEquipo')->constrained('Equipo', 'idEquipo')->restrictOnDelete();
            $table->foreignId('idServicio')->constrained('ServicioInternet', 'idServicio')->cascadeOnDelete();
        });

        // 22. Proveedor
        Schema::create('Proveedor', function (Blueprint $table) {
            $table->id('idProveedor');
            $table->string('razonSocial', 100)->nullable();
            $table->string('nit', 30)->nullable();
            $table->string('telefono', 20)->nullable();
            $table->string('correo', 100)->nullable();
            $table->text('direccion')->nullable();
            $table->boolean('estado')->default(true);
        });

        // 23. EstadoCompra
        Schema::create('EstadoCompra', function (Blueprint $table) {
            $table->id('idEstadoCompra');
            $table->string('nombreEstado', 50)->nullable();
            $table->text('descripcion')->nullable();
        });

        // 24. Compra
        Schema::create('Compra', function (Blueprint $table) {
            $table->id('idCompra');
            $table->date('fechaCompra')->nullable();
            $table->string('nroComprobante', 50)->nullable();
            $table->decimal('montoTotal', 10, 2)->nullable();
            $table->text('observacion')->nullable();
            $table->foreignId('idProveedor')->nullable()->constrained('Proveedor', 'idProveedor')->restrictOnDelete();
            $table->foreignId('idEstadoCompra')->nullable()->constrained('EstadoCompra', 'idEstadoCompra')->restrictOnDelete();
        });

        // 25. DetalleCompra
        Schema::create('DetalleCompra', function (Blueprint $table) {
            $table->id('idDetalleCompra');
            $table->integer('cantidad')->nullable();
            $table->decimal('precioUnitario', 10, 2)->nullable();
            $table->decimal('subtotal', 10, 2)->nullable();
            $table->foreignId('idCompra')->constrained('Compra', 'idCompra')->cascadeOnDelete();
            $table->foreignId('idInventario')->constrained('Inventario', 'idInventario')->restrictOnDelete();
        });

        // 26. Tecnico
        Schema::create('Tecnico', function (Blueprint $table) {
            $table->id('idTecnico');
            $table->string('nombreCompleto', 100)->nullable();
            $table->string('telefono', 20)->nullable();
            $table->string('especialidad', 100)->nullable();
            $table->boolean('activo')->default(true);
        });

        // 27. SolicitudInstalacion
        Schema::create('SolicitudInstalacion', function (Blueprint $table) {
            $table->id('idSolicitud');
            $table->string('numeroOrden', 50)->nullable();
            $table->date('fechaSolicitud')->nullable();
            $table->text('direccion')->nullable();
            $table->text('referencia')->nullable();
            $table->decimal('latitud', 10, 7)->nullable();
            $table->decimal('longitud', 10, 7)->nullable();
            $table->string('estadoSolicitud', 50)->nullable();
            $table->text('observacion')->nullable();
            $table->foreignId('idCliente')->nullable()->constrained('Cliente', 'idCliente')->cascadeOnDelete();
        });

        // 28. Instalacion
        Schema::create('Instalacion', function (Blueprint $table) {
            $table->id('idInstalacion');
            $table->date('fechaProgramada')->nullable();
            $table->date('fechaRealizada')->nullable();
            $table->decimal('costoInstalacion', 10, 2)->nullable();
            $table->string('estadoInstalacion', 50)->nullable();
            $table->text('observacion')->nullable();
            $table->foreignId('idSolicitud')->nullable()->constrained('SolicitudInstalacion', 'idSolicitud')->nullOnDelete();
            $table->foreignId('idServicio')->nullable()->constrained('ServicioInternet', 'idServicio')->nullOnDelete();
            $table->foreignId('idTecnico')->nullable()->constrained('Tecnico', 'idTecnico')->nullOnDelete();
        });

        // Tablas auxiliares del sistema
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        Schema::create('user_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('Usuario', 'idUsuario')->cascadeOnDelete();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('login_at')->nullable();
            $table->timestamp('logout_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Vistas de compatibilidad para consultas directas y pruebas
        $views = [
            'bitacora_auditorias' => 'CREATE VIEW bitacora_auditorias AS SELECT idBitacora as id, idBitacora, fechaHora, accion, modulo, descripcion, idUsuario as user_id, idUsuario, ipOrigen as ip_origen, datosPrevios as datos_previos, datosNuevos as datos_nuevos FROM "Bitacora"',
            'zonas_cobertura' => 'CREATE VIEW zonas_cobertura AS SELECT idZona as id, idZona, nombreZona as nombre, nombreZona, descripcion, estado as activo, estado, codigo, ciudad, tecnologia, capacidadNodos as capacidad_nodos, capacidadNodos, barrio, estadoCobertura as estado_cobertura, estadoCobertura, areaMapa as area_mapa, areaMapa FROM "Zona"',
            'estados_servicio' => 'CREATE VIEW estados_servicio AS SELECT idEstadoServicio as id, idEstadoServicio, nombreEstado as nombre_estado, nombreEstado, descripcion FROM "EstadoServicio"',
            'asignaciones_plan' => 'CREATE VIEW asignaciones_plan AS SELECT idAsignacionPlan as id, idAsignacionPlan, fechaInicio as fecha_inicio, fechaInicio, fechaFin as fecha_fin, fechaFin, precioAplicado as precio_aplicado, precioAplicado, motivoCambio as motivo_cambio, motivoCambio, idServicio as servicio_id, idServicio, idPlan as plan_id, idPlan, idUsuario as user_id, idUsuario FROM "AsignacionPlan"',
            'servicios_internet' => 'CREATE VIEW servicios_internet AS SELECT si.idServicio as id, si.idServicio, si.fechaActivacion as fecha_activacion, si.fechaActivacion, si.fechaCorteBase as dia_corte, si.fechaCorteBase, si.direccion as direccion_instalacion, si.direccion, si.referencia, si.latitud, si.longitud, si.observacion, si.idCliente as cliente_id, si.idCliente, si.idEstadoServicio as estado_servicio_id, si.idEstadoServicio, si.idZona as zona_id, si.idZona, si.codigoServicio as codigo_servicio, si.codigoServicio, si.ipAsignada as ip_asignada, si.ipAsignada, si.macRouter as mac_router, si.macRouter, es.nombreEstado as estado_servicio FROM "ServicioInternet" si LEFT JOIN "EstadoServicio" es ON si.idEstadoServicio = es.idEstadoServicio',
            'users' => 'CREATE VIEW users AS SELECT idUsuario as id, idUsuario, nombreUsuario, passwordHash as password, passwordHash, nombreCompleto as name, nombreCompleto, telefono, correo as email, correo, activo, fechaCreacion, idRol as rol_id, idRol FROM "Usuario"',
            'rol_permiso' => 'CREATE VIEW rol_permiso AS SELECT idRolPermiso as id, idRolPermiso, idRol as rol_id, idRol, idPermiso as permiso_id, idPermiso FROM "RolPermiso"',
            'roles' => 'CREATE VIEW roles AS SELECT idRol as id, idRol, nombre, slug, descripcion, activo FROM "Rol"',
            'permisos' => 'CREATE VIEW permisos AS SELECT idPermiso as id, idPermiso, nombre, slug, modulo, descripcion FROM "Permiso"',
            'clientes' => 'CREATE VIEW clientes AS SELECT idCliente as id, idCliente, codigoCliente as codigo_cliente, codigoCliente, ci as documento_identidad, ci, nombreCompleto as nombre_completo, nombreCompleto, telefonoPrincipal as telefono, telefonoPrincipal, correo as email, correo, direccion, estadoCliente as estado, estadoCliente, idZona as zona_id, idZona, fechaBaja as deleted_at, fechaBaja, motivoBaja as motivo_baja, motivoBaja FROM "Cliente"',
            'planes_internet' => 'CREATE VIEW planes_internet AS SELECT idPlan as id, idPlan, nombrePlan as nombre_plan, nombrePlan, velocidadMbps as velocidad_mbps, velocidadMbps, precioMensual as precio_mensual, precioMensual, descripcion, activo, activo as estado FROM "PlanInternet"',
            'mensualidades' => 'CREATE VIEW mensualidades AS SELECT idMensualidad as id, idMensualidad, periodo, monto, fechaEmision as fecha_emision, fechaEmision, fechaVencimiento as fecha_vencimiento, fechaVencimiento, estado, idServicio as servicio_id, idServicio FROM "Mensualidad"',
            'pagos' => 'CREATE VIEW pagos AS SELECT idPago as id, idPago, fechaHora as fecha_pago, fechaHora, montoTotal as monto_total, montoTotal, numeroComprobante as nro_comprobante, numeroComprobante as codigo_recibo, numeroComprobante, idUsuario as user_id, idUsuario, idMetodoPago as metodo_pago_id, idMetodoPago FROM "Pago"',
            'metodos_pago' => 'CREATE VIEW metodos_pago AS SELECT idMetodoPago as id, idMetodoPago, nombreMetodo as nombre, nombreMetodo, descripcion, estado FROM "MetodoPago"',
            'detalles_pago' => 'CREATE VIEW detalles_pago AS SELECT idDetallePago as id, idDetallePago, montoAplicado as monto_pagado, montoAplicado, idPago as pago_id, idPago, idMensualidad as mensualidad_id, idMensualidad FROM "DetallePago"',
            'cortes_servicio' => 'CREATE VIEW cortes_servicio AS SELECT idAccion as id, idAccion, tipoAccion as tipo_corte, tipoAccion, fechaEjecucion as fecha_corte, fechaEjecucion, motivo, observacion as observaciones, observacion, idServicio as servicio_id, idServicio, idUsuario as tecnico_user_id, idUsuario FROM "AccionServicio"',
            'reactivaciones_servicio' => 'CREATE VIEW reactivaciones_servicio AS SELECT idAccion as id, idAccion, tipoAccion, fechaEjecucion as fecha_reactivacion, fechaEjecucion, motivo, observacion as observaciones, observacion, idServicio as servicio_id, idServicio, idUsuario as user_id, idUsuario FROM "AccionServicio"',
        ];

        foreach ($views as $viewSql) {
            try {
                DB::statement($viewSql);
            } catch (\Throwable) {
                // Silencioso si el motor no admite CREATE VIEW
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        foreach (['reactivaciones_servicio', 'cortes_servicio', 'detalles_pago', 'metodos_pago', 'pagos', 'mensualidades', 'planes_internet', 'clientes', 'permisos', 'roles', 'rol_permiso', 'users', 'servicios_internet', 'asignaciones_plan', 'estados_servicio', 'zonas_cobertura', 'bitacora_auditorias'] as $v) {
            try { DB::statement("DROP VIEW IF EXISTS {$v}"); } catch (\Throwable) {}
        }

        Schema::dropIfExists('user_sessions');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('Instalacion');
        Schema::dropIfExists('SolicitudInstalacion');
        Schema::dropIfExists('Tecnico');
        Schema::dropIfExists('DetalleCompra');
        Schema::dropIfExists('Compra');
        Schema::dropIfExists('EstadoCompra');
        Schema::dropIfExists('Proveedor');
        Schema::dropIfExists('AsignacionEquipo');
        Schema::dropIfExists('Equipo');
        Schema::dropIfExists('Inventario');
        Schema::dropIfExists('ProductoEquipo');
        Schema::dropIfExists('DetallePago');
        Schema::dropIfExists('Mensualidad');
        Schema::dropIfExists('Pago');
        Schema::dropIfExists('MetodoPago');
        Schema::dropIfExists('AccionServicio');
        Schema::dropIfExists('HistorialEstadoServicio');
        Schema::dropIfExists('AsignacionPlan');
        Schema::dropIfExists('ServicioInternet');
        Schema::dropIfExists('EstadoServicio');
        Schema::dropIfExists('PlanInternet');
        Schema::dropIfExists('Cliente');
        Schema::dropIfExists('Zona');
        Schema::dropIfExists('Bitacora');
        Schema::dropIfExists('Usuario');
        Schema::dropIfExists('RolPermiso');
        Schema::dropIfExists('Rol');
        Schema::dropIfExists('Permiso');
    }
};
