<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * CU28: Configuración de Copias de Seguridad Automáticas / Programadas.
     */
    public function up(): void
    {
        if (! Schema::hasTable('ConfiguracionBackup')) {
            Schema::create('ConfiguracionBackup', function (Blueprint $table) {
                $table->id('idConfiguracionBackup');
                $table->boolean('activo')->default(true);
                $table->string('frecuencia', 20)->default('DIARIO'); // 'DIARIO', 'SEMANAL', 'MENSUAL'
                $table->string('horaEjecucion', 10)->default('02:00'); // 'HH:mm'
                $table->string('diasSemana', 100)->default('["1"]'); // JSON array: ["1","3","5"] (1 = Lunes)
                $table->integer('diaMes')->default(1); // 1..31
                $table->integer('retencionCopias')->default(7); // Mantener las últimas N copias automáticas
                $table->timestamp('ultimoBackupAt')->nullable();
                $table->timestamp('proximoBackupAt')->nullable();
                $table->string('ultimoEstado', 50)->default('PENDIENTE');
                $table->text('ultimoMensaje')->nullable();
                $table->timestamps();
            });

            // Registro inicial por defecto
            DB::table('ConfiguracionBackup')->insert([
                'activo'          => true,
                'frecuencia'      => 'DIARIO',
                'horaEjecucion'   => '02:00',
                'diasSemana'      => json_encode(['1', '2', '3', '4', '5', '6', '0']),
                'diaMes'          => 1,
                'retencionCopias' => 7,
                'ultimoEstado'    => 'PENDIENTE',
                'ultimoMensaje'   => 'Programación inicial configurada.',
                'proximoBackupAt' => now()->timezone('America/La_Paz')->addDay()->setTime(2, 0, 0),
                'created_at'      => now(),
                'updated_at'      => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ConfiguracionBackup');
    }
};

