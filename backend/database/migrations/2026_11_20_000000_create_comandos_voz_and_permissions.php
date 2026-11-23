<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tabla ComandoVoz para persistir dictados, transcripciones e intenciones
        if (! Schema::hasTable('ComandoVoz')) {
            Schema::create('ComandoVoz', function (Blueprint $table) {
                $table->id('idComandoVoz');
                $table->foreignId('idUsuario')->nullable()->constrained('Usuario', 'idUsuario')->nullOnDelete();
                $table->text('textoDictado');
                $table->string('intencion', 80)->nullable();
                $table->json('parametros')->nullable();
                $table->decimal('confianza', 4, 2)->default(0.95);
                $table->string('estado', 30)->default('TRANSCRITO'); // TRANSCRITO, CONFIRMADO, CORREGIDO, EJECUTADO
                $table->decimal('duracionSegundos', 5, 2)->default(0);
                $table->timestamps();
            });
        }

        // 2. Permisos para CU27 y CU29
        $permisosNuevos = [
            [
                'slug'        => 'reportes.traditional',
                'nombre'      => 'Generar Reportes Tradicionales',
                'modulo'      => 'REPORTES',
                'descripcion' => 'Permite consultar y exportar reportes en PDF y Excel (CU27).',
            ],
            [
                'slug'        => 'voz.commands',
                'nombre'      => 'Capturar Comandos de Voz',
                'modulo'      => 'ASISTENTE_VOZ',
                'descripcion' => 'Permite dictar y transcribir consultas por voz (CU29).',
            ],
        ];

        foreach ($permisosNuevos as $pData) {
            $permisoId = DB::table('Permiso')->where('slug', $pData['slug'])->value('idPermiso');
            if ($permisoId === null) {
                $permisoId = DB::table('Permiso')->insertGetId($pData, 'idPermiso');
            }

            // Asignar al Administrador
            $adminId = DB::table('Rol')->where('slug', 'admin')->value('idRol');
            if ($adminId !== null && $permisoId !== null) {
                $existe = DB::table('RolPermiso')
                    ->where('idRol', $adminId)
                    ->where('idPermiso', $permisoId)
                    ->exists();

                if (! $existe) {
                    DB::table('RolPermiso')->insert([
                        'idRol'     => $adminId,
                        'idPermiso' => $permisoId,
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('ComandoVoz');
    }
};
