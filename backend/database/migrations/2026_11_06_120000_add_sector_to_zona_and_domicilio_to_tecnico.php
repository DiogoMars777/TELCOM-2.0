<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Agregar columna 'sector' a la tabla Zona en PostgreSQL si no existe
        DB::statement('ALTER TABLE "Zona" ADD COLUMN IF NOT EXISTS "sector" VARCHAR(150) NULL');

        // 2. Agregar columna 'domicilio' a la tabla Tecnico en PostgreSQL si no existe
        DB::statement('ALTER TABLE "Tecnico" ADD COLUMN IF NOT EXISTS "domicilio" VARCHAR(255) NULL');

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
            DB::statement('ALTER TABLE "Zona" DROP COLUMN IF EXISTS "sector"');
            DB::statement('CREATE VIEW zonas_cobertura AS SELECT "idZona" as id, "idZona", "nombreZona" as nombre, "nombreZona", descripcion, estado as activo, estado, codigo, ciudad, tecnologia, "capacidadNodos" as capacidad_nodos, "capacidadNodos", barrio, "estadoCobertura" as estado_cobertura, "estadoCobertura", "areaMapa" as area_mapa, "areaMapa" FROM "Zona"');
        } catch (\Throwable $e) {}

        try {
            DB::statement('DROP VIEW IF EXISTS tecnicos');
            DB::statement('ALTER TABLE "Tecnico" DROP COLUMN IF EXISTS "domicilio"');
            DB::statement('CREATE VIEW tecnicos AS SELECT "idTecnico" as id, "idTecnico", "nombreCompleto" as nombre_completo, "nombreCompleto", telefono, especialidad, activo FROM "Tecnico"');
        } catch (\Throwable $e) {}
    }
};
