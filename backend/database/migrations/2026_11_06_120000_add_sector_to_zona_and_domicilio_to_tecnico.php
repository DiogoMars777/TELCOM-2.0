<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Agregar columna 'sector' a la tabla Zona si no existe
        if (Schema::hasTable('Zona') && !Schema::hasColumn('Zona', 'sector')) {
            Schema::table('Zona', function (Blueprint $table) {
                $table->string('sector', 150)->nullable();
            });
        }

        // 2. Agregar columna 'domicilio' a la tabla Tecnico si no existe
        if (Schema::hasTable('Tecnico') && !Schema::hasColumn('Tecnico', 'domicilio')) {
            Schema::table('Tecnico', function (Blueprint $table) {
                $table->string('domicilio', 255)->nullable();
            });
        }

        // 3. Recrear vista 'zonas_cobertura' incluyendo sector
        try {
            DB::statement('DROP VIEW IF EXISTS zonas_cobertura');
            DB::statement('CREATE VIEW zonas_cobertura AS SELECT "idZona" as id, "idZona", "nombreZona" as nombre, "nombreZona", descripcion, estado as activo, estado, codigo, ciudad, sector, tecnologia, "capacidadNodos" as capacidad_nodos, "capacidadNodos", barrio, "estadoCobertura" as estado_cobertura, "estadoCobertura", "areaMapa" as area_mapa, "areaMapa" FROM "Zona"');
        } catch (\Throwable $e) {}

        // 4. Recrear vista 'tecnicos' incluyendo domicilio
        try {
            DB::statement('DROP VIEW IF EXISTS tecnicos');
            DB::statement('CREATE VIEW tecnicos AS SELECT "idTecnico" as id, "idTecnico", "nombreCompleto" as nombre_completo, "nombreCompleto", telefono, especialidad, domicilio, activo FROM "Tecnico"');
        } catch (\Throwable $e) {}
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        try {
            DB::statement('DROP VIEW IF EXISTS zonas_cobertura');
            if (Schema::hasTable('Zona') && Schema::hasColumn('Zona', 'sector')) {
                Schema::table('Zona', function (Blueprint $table) {
                    $table->dropColumn('sector');
                });
            }
            DB::statement('CREATE VIEW zonas_cobertura AS SELECT "idZona" as id, "idZona", "nombreZona" as nombre, "nombreZona", descripcion, estado as activo, estado, codigo, ciudad, tecnologia, "capacidadNodos" as capacidad_nodos, "capacidadNodos", barrio, "estadoCobertura" as estado_cobertura, "estadoCobertura", "areaMapa" as area_mapa, "areaMapa" FROM "Zona"');
        } catch (\Throwable $e) {}

        try {
            DB::statement('DROP VIEW IF EXISTS tecnicos');
            if (Schema::hasTable('Tecnico') && Schema::hasColumn('Tecnico', 'domicilio')) {
                Schema::table('Tecnico', function (Blueprint $table) {
                    $table->dropColumn('domicilio');
                });
            }
            DB::statement('CREATE VIEW tecnicos AS SELECT "idTecnico" as id, "idTecnico", "nombreCompleto" as nombre_completo, "nombreCompleto", telefono, especialidad, activo FROM "Tecnico"');
        } catch (\Throwable $e) {}
    }
};
