<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * En PostgreSQL, evitar transacciones para que los cambios se confirmen directamente.
     */
    public $withinTransaction = false;

    /**
     * Migración para CU22 - Programar Instalación y Asignar Técnico.
     * Asegura las tablas canónicas Tecnico, SolicitudInstalacion e Instalacion,
     * agrega la columna horaProgramada para agenda fina y crea vistas SQL de compatibilidad.
     */
    public function up(): void
    {
        // 1. Tabla Tecnico
        if (!Schema::hasTable('Tecnico')) {
            Schema::create('Tecnico', function (Blueprint $table) {
                $table->id('idTecnico');
                $table->string('nombreCompleto', 100)->nullable();
                $table->string('telefono', 20)->nullable();
                $table->string('especialidad', 100)->nullable();
                $table->boolean('activo')->default(true);
            });
        }

        // 2. Tabla SolicitudInstalacion
        if (!Schema::hasTable('SolicitudInstalacion')) {
            Schema::create('SolicitudInstalacion', function (Blueprint $table) {
                $table->id('idSolicitud');
                $table->string('numeroOrden', 50)->nullable();
                $table->date('fechaSolicitud')->nullable();
                $table->text('direccion')->nullable();
                $table->text('referencia')->nullable();
                $table->decimal('latitud', 10, 7)->nullable();
                $table->decimal('longitud', 10, 7)->nullable();
                $table->string('estadoSolicitud', 50)->default('PENDIENTE');
                $table->text('observacion')->nullable();
                $table->foreignId('idCliente')->nullable()->constrained('Cliente', 'idCliente')->cascadeOnDelete();
            });
        }

        // 3. Tabla Instalacion
        if (!Schema::hasTable('Instalacion')) {
            Schema::create('Instalacion', function (Blueprint $table) {
                $table->id('idInstalacion');
                $table->date('fechaProgramada')->nullable();
                $table->time('horaProgramada')->nullable();
                $table->date('fechaRealizada')->nullable();
                $table->decimal('costoInstalacion', 10, 2)->default(150.00);
                $table->string('estadoInstalacion', 50)->default('PROGRAMADA');
                $table->text('observacion')->nullable();
                $table->foreignId('idSolicitud')->nullable()->constrained('SolicitudInstalacion', 'idSolicitud')->nullOnDelete();
                $table->foreignId('idServicio')->nullable()->constrained('ServicioInternet', 'idServicio')->nullOnDelete();
                $table->foreignId('idTecnico')->nullable()->constrained('Tecnico', 'idTecnico')->nullOnDelete();
            });
        } else {
            // Asegurar columna horaProgramada si ya existía la tabla Instalacion
            Schema::table('Instalacion', function (Blueprint $table) {
                if (!Schema::hasColumn('Instalacion', 'horaProgramada')) {
                    $table->time('horaProgramada')->nullable();
                }
            });
        }

        // 4. Vistas de compatibilidad en snake_case
        $views = [
            'tecnicos' => 'CREATE OR REPLACE VIEW tecnicos AS SELECT idTecnico as id, idTecnico, nombreCompleto as nombre_completo, nombreCompleto, telefono, especialidad, activo FROM "Tecnico"',
            'solicitudes_instalacion' => 'CREATE OR REPLACE VIEW solicitudes_instalacion AS SELECT idSolicitud as id, idSolicitud, numeroOrden as numero_orden, numeroOrden, fechaSolicitud as fecha_solicitud, fechaSolicitud, direccion, referencia, latitud, longitud, estadoSolicitud as estado_solicitud, estadoSolicitud, observacion, idCliente as cliente_id, idCliente FROM "SolicitudInstalacion"',
            'instalaciones' => 'CREATE OR REPLACE VIEW instalaciones AS SELECT idInstalacion as id, idInstalacion, fechaProgramada as fecha_programada, fechaProgramada, horaProgramada as hora_programada, horaProgramada, fechaRealizada as fecha_realizada, fechaRealizada, costoInstalacion as costo_instalacion, costoInstalacion, estadoInstalacion as estado_instalacion, estadoInstalacion, observacion, idSolicitud as solicitud_id, idSolicitud, idServicio as servicio_id, idServicio, idTecnico as tecnico_id, idTecnico FROM "Instalacion"',
        ];

        foreach ($views as $sql) {
            try {
                DB::statement($sql);
            } catch (\Throwable) {
                // Silencioso si no admite CREATE OR REPLACE VIEW
            }
        }

        // 5. Poblar solicitudes pendientes si no hay ninguna
        $pendientesCount = DB::table('SolicitudInstalacion')->where('estadoSolicitud', 'PENDIENTE')->count();
        if ($pendientesCount === 0) {
            $clientes = DB::table('Cliente')->limit(3)->get();
            $idx = 1;
            foreach ($clientes as $cliente) {
                DB::table('SolicitudInstalacion')->insert([
                    'numeroOrden'     => 'ORD-2026-P0' . $idx,
                    'fechaSolicitud'  => now()->toDateString(),
                    'direccion'       => $cliente->direccion ?? 'Av. Principal #100',
                    'referencia'      => $cliente->referenciaUbicacion ?? 'Frente a plaza central',
                    'latitud'         => -17.7833,
                    'longitud'        => -63.1821,
                    'estadoSolicitud' => 'PENDIENTE',
                    'observacion'     => 'Solicitud pendiente de instalación de fibra óptica monomodo.',
                    'idCliente'       => $cliente->idCliente,
                ]);
                $idx++;
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        foreach (['instalaciones', 'solicitudes_instalacion', 'tecnicos'] as $v) {
            try {
                DB::statement("DROP VIEW IF EXISTS {$v}");
            } catch (\Throwable) {}
        }

        if (Schema::hasColumn('Instalacion', 'horaProgramada')) {
            Schema::table('Instalacion', function (Blueprint $table) {
                $table->dropColumn('horaProgramada');
            });
        }
    }
};
