<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Migración para CU30 - Procesar intención de voz con IA (NLP).
     * Crea la tabla IntencionVozIA y registra el permiso canónico voz.nlp.
     */
    public function up(): void
    {
        if (! Schema::hasTable('IntencionVozIA')) {
            Schema::create('IntencionVozIA', function (Blueprint $table) {
                $table->id('idIntencion');
                $table->foreignId('idUsuario')->nullable()->constrained('Usuario', 'idUsuario')->nullOnDelete();
                $table->text('textoEntrada');
                $table->string('intencionCanonica', 80);
                $table->string('categoria', 60)->default('General');
                $table->decimal('confianza', 4, 2)->default(0.90);
                $table->string('motor', 30)->default('LOCAL_NLP'); // 'GEMINI_AI' | 'LOCAL_NLP'
                $table->json('entidadesExtraidas')->nullable();
                $table->json('accionSugerida')->nullable();
                $table->text('respuestaAsistente')->nullable();
                $table->json('datosEnVivo')->nullable();
                $table->string('estado', 30)->default('PROCESADO'); // 'PROCESADO' | 'EJECUTADO' | 'CORREGIDO'
                $table->integer('tiempoProcesamientoMs')->default(0);
                $table->timestamps();
            });
        }

        // Vista de compatibilidad en snake_case
        try {
            DB::statement('CREATE OR REPLACE VIEW intenciones_voz_ia AS SELECT "idIntencion" as id, "idIntencion", "idUsuario" as user_id, "textoEntrada" as texto_entrada, "intencionCanonica" as intencion_canonica, categoria, confianza, motor, "entidadesExtraidas" as entidades_extraidas, "accionSugerida" as accion_sugerida, "respuestaAsistente" as respuesta_asistente, "datosEnVivo" as datos_en_vivo, estado, "tiempoProcesamientoMs" as tiempo_procesamiento_ms, created_at, updated_at FROM "IntencionVozIA"');
        } catch (\Throwable) {
            // Ignorar si el dialecto no soporta CREATE OR REPLACE VIEW
        }

        // Registrar permiso para CU30
        $permisoData = [
            'slug'        => 'voz.nlp',
            'nombre'      => 'Procesar Intenciones de Voz con IA (NLP)',
            'modulo'      => 'INTELIGENCIA_VOZ',
            'descripcion' => 'Permite procesar comandos de voz y texto con el motor NLP e Inteligencia Artificial (CU30).',
        ];

        $permisoId = DB::table('Permiso')->where('slug', $permisoData['slug'])->value('idPermiso');
        if ($permisoId === null) {
            $permisoId = DB::table('Permiso')->insertGetId($permisoData, 'idPermiso');
        }

        // Asignar permiso a roles administrativos y técnicos
        $rolesAsignar = ['admin', 'secretaria', 'tecnico'];
        foreach ($rolesAsignar as $rolSlug) {
            $rolId = DB::table('Rol')->where('slug', $rolSlug)->value('idRol');
            if ($rolId !== null && $permisoId !== null) {
                $existe = DB::table('RolPermiso')
                    ->where('idRol', $rolId)
                    ->where('idPermiso', $permisoId)
                    ->exists();

                if (! $existe) {
                    DB::table('RolPermiso')->insert([
                        'idRol'     => $rolId,
                        'idPermiso' => $permisoId,
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        try {
            DB::statement('DROP VIEW IF EXISTS intenciones_voz_ia');
        } catch (\Throwable) {}

        Schema::dropIfExists('IntencionVozIA');

        $permisoId = DB::table('Permiso')->where('slug', 'voz.nlp')->value('idPermiso');
        if ($permisoId !== null) {
            DB::table('RolPermiso')->where('idPermiso', $permisoId)->delete();
            DB::table('Permiso')->where('idPermiso', $permisoId)->delete();
        }
    }
};
