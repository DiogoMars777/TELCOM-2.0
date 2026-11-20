<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * CU28: Generar y restaurar copias de seguridad (Backup / Restore)
     */
    public function up(): void
    {
        if (! Schema::hasTable('CopiaSeguridad')) {
            Schema::create('CopiaSeguridad', function (Blueprint $table) {
                $table->id('idCopiaSeguridad');
                $table->string('nombreArchivo', 255);
                $table->string('ruta', 500);
                $table->bigInteger('tamanoBytes')->default(0);
                $table->string('tamanoLegible', 50)->nullable();
                $table->foreignId('idUsuario')->nullable()->constrained('Usuario', 'idUsuario')->nullOnDelete();
                $table->text('descripcion')->nullable();
                $table->string('tipo', 50)->default('MANUAL'); // 'MANUAL', 'AUTOMATICA', 'SUBIDA'
                $table->string('estado', 50)->default('COMPLETADO'); // 'COMPLETADO', 'FALLIDO', 'RESTAURADO'
                $table->timestamp('fechaHora')->useCurrent();
            });
        }

        // Permiso RBAC para CU28: backups.manage
        $permisoId = DB::table('Permiso')->where('slug', 'backups.manage')->value('idPermiso');

        if ($permisoId === null) {
            $permisoId = DB::table('Permiso')->insertGetId([
                'slug'        => 'backups.manage',
                'nombre'      => 'Gestionar Copias de Seguridad',
                'modulo'      => 'CU28',
                'descripcion' => 'Generar, descargar y restaurar copias de seguridad de la base de datos.',
            ], 'idPermiso');
        }

        $adminId = DB::table('Rol')->where('slug', 'admin')->value('idRol');

        if ($adminId !== null && $permisoId !== null) {
            $yaAsignado = DB::table('RolPermiso')
                ->where('idRol', $adminId)
                ->where('idPermiso', $permisoId)
                ->exists();

            if (! $yaAsignado) {
                DB::table('RolPermiso')->insert([
                    'idRol'     => $adminId,
                    'idPermiso' => $permisoId,
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $permisoId = DB::table('Permiso')->where('slug', 'backups.manage')->value('idPermiso');

        if ($permisoId !== null) {
            DB::table('RolPermiso')->where('idPermiso', $permisoId)->delete();
            DB::table('Permiso')->where('idPermiso', $permisoId)->delete();
        }

        Schema::dropIfExists('CopiaSeguridad');
    }
};
