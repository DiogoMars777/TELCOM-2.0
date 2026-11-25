<?php

namespace App\Console\Commands\Paquetes\P1_SeguridadAdministracion\CU28_GenerarRestaurarCopiasSeguridad;

use App\Http\Controllers\Paquetes\P1_SeguridadAdministracion\CU28_GenerarRestaurarCopiasSeguridad\CopiasSeguridadController;
use App\Models\Paquetes\P1_SeguridadAdministracion\CU28_GenerarRestaurarCopiasSeguridad\ConfiguracionBackup;
use App\Models\Paquetes\P1_SeguridadAdministracion\CU28_GenerarRestaurarCopiasSeguridad\CopiaSeguridad;
use App\Support\AuditLogger;
use Illuminate\Console\Command;
use Throwable;

class EjecutarBackupProgramadoCommand extends Command
{
    /**
     * El nombre y la firma del comando de consola.
     */
    protected $signature = 'backup:programado {--force : Forzar la ejecución inmediata omitiendo la validación de fecha/hora programada}';

    /**
     * Descripción del comando de consola.
     */
    protected $description = 'Ejecuta la copia de seguridad programada según la configuración activa (CU28).';

    public function handle(CopiasSeguridadController $controller): int
    {
        $this->info('Iniciando verificación de copia de seguridad programada...');

        $config = ConfiguracionBackup::obtenerConfiguracion();

        $force = (bool) $this->option('force');

        if (! $config->activo && ! $force) {
            $this->warn('La automatización de copias de seguridad se encuentra DESACTIVADA.');
            return self::SUCCESS;
        }

        $tz = 'America/La_Paz';
        $ahora = now()->timezone($tz);

        // Si no es forzado, verificar si ya corresponde ejecutar según proximoBackupAt
        if (! $force && $config->proximoBackupAt) {
            if ($ahora->lessThan($config->proximoBackupAt)) {
                $this->info("Aún no es tiempo de ejecución. Próxima ejecución: {$config->proximo_backup_at}");
                return self::SUCCESS;
            }
        }

        $this->info("Ejecutando respaldo automático (Frecuencia: {$config->frecuencia})...");

        try {
            // Invocar la lógica de creación de backup automático en el controlador
            $backup = $controller->ejecutarCopiaAutomatica("Respaldo automático del sistema ({$config->frecuencia})");

            // Limpieza de retención: conservar solo las últimas N copias automáticas
            $this->aplicarPoliticaRetencion($config->retencion_copias);

            $config->update([
                'ultimoBackupAt' => $ahora,
                'ultimoEstado'   => 'EXITOSO',
                'ultimoMensaje'  => "Copia '{$backup->nombre_archivo}' generada exitosamente ({$backup->tamano_legible}).",
            ]);

            $config->recalcularProximoBackup();

            $this->info("Copia de seguridad automática generada exitosamente: {$backup->nombre_archivo}");
            $this->info("Próxima copia programada para: {$config->proximo_backup_at}");

            return self::SUCCESS;
        } catch (Throwable $e) {
            $this->error('Error durante la generación de la copia de seguridad programada: ' . $e->getMessage());

            $config->update([
                'ultimoEstado'  => 'FALLIDO',
                'ultimoMensaje' => 'Error: ' . $e->getMessage(),
            ]);

            return self::FAILURE;
        }
    }

    /**
     * Elimina copias automáticas antiguas que excedan el límite de retención configurado.
     */
    protected function aplicarPoliticaRetencion(int $maxRetencion): void
    {
        if ($maxRetencion <= 0) {
            return;
        }

        $copiasAutomaticas = CopiaSeguridad::where('tipo', 'AUTOMATICA')
            ->orderBy('fechaHora', 'desc')
            ->get();

        if ($copiasAutomaticas->count() > $maxRetencion) {
            $aEliminar = $copiasAutomaticas->slice($maxRetencion);

            foreach ($aEliminar as $copia) {
                $ruta = $copia->rutaCompleta();
                if (file_exists($ruta)) {
                    @unlink($ruta);
                }
                $copia->delete();
            }
        }
    }
}
