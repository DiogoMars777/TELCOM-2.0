<?php

namespace App\Http\Controllers\Paquetes\P1_SeguridadAdministracion\CU28_GenerarRestaurarCopiasSeguridad;

use App\Http\Controllers\Controller;
use App\Models\Paquetes\P1_SeguridadAdministracion\CU28_GenerarRestaurarCopiasSeguridad\ConfiguracionBackup;
use App\Models\Paquetes\P1_SeguridadAdministracion\CU28_GenerarRestaurarCopiasSeguridad\CopiaSeguridad;
use App\Support\AuditLogger;
use App\Traits\ApiResponse;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\Process\Process;
use Throwable;

/**
 * CU28: Generar y Restaurar Copias de Seguridad (Backup / Restore).
 * Paquete P1: Seguridad y Administración del Sistema.
 */
class CopiasSeguridadController extends Controller
{
    use ApiResponse;

    /**
     * Directorio de almacenamiento para las copias de seguridad.
     */
    protected function obtenerDirectorioBackups(): string
    {
        $dir = storage_path('app/backups');
        if (! File::exists($dir)) {
            File::makeDirectory($dir, 0755, true);
        }
        return $dir;
    }

    /**
     * Obtener credenciales de la conexión PostgreSQL activa.
     *
     * @return array<string, string>
     */
    protected function obtenerCredencialesPg(): array
    {
        $config = config('database.connections.pgsql');

        return [
            'host'     => (string) ($config['host'] ?? '127.0.0.1'),
            'port'     => (string) ($config['port'] ?? '5432'),
            'database' => (string) ($config['database'] ?? 'telcom_db'),
            'username' => (string) ($config['username'] ?? 'postgres'),
            'password' => (string) ($config['password'] ?? ''),
        ];
    }

    /**
     * Resuelve la ruta ejecutable de un binario PostgreSQL (pg_dump / psql)
     * tanto en Windows/Laragon como en Docker/Linux.
     */
    protected function resolverBinario(string $binario): ?string
    {
        $esWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
        $nombreEjecutable = $esWindows ? "{$binario}.exe" : $binario;

        // 1. Intentar localizar en el PATH del sistema operativo
        $comandoBusqueda = $esWindows ? "where.exe {$nombreEjecutable} 2>NUL" : "which {$nombreEjecutable} 2>/dev/null";
        $salidaPath = trim((string) @shell_exec($comandoBusqueda));
        if (! empty($salidaPath)) {
            $lineas = preg_split('/[\r\n]+/', $salidaPath);
            if (! empty($lineas[0]) && file_exists(trim($lineas[0]))) {
                return trim($lineas[0]);
            }
        }

        // 2. Rutas conocidas comunes en entornos Windows y Laragon
        if ($esWindows) {
            $candidatos = [
                "C:\\laragon\\bin\\postgresql\\pgsql\\bin\\{$nombreEjecutable}",
                "C:\\laragon\\bin\\postgresql\\bin\\{$nombreEjecutable}",
            ];

            foreach ($candidatos as $candidato) {
                if (file_exists($candidato)) {
                    return $candidato;
                }
            }

            // Buscar mediante glob en Laragon y Program Files
            $globs = [
                "C:\\laragon\\bin\\postgresql\\*\\bin\\{$nombreEjecutable}",
                "C:\\Program Files\\PostgreSQL\\*\\bin\\{$nombreEjecutable}",
                "C:\\Program Files (x86)\\PostgreSQL\\*\\bin\\{$nombreEjecutable}",
            ];

            foreach ($globs as $patron) {
                $encontrados = glob($patron);
                if (! empty($encontrados) && file_exists($encontrados[0])) {
                    return $encontrados[0];
                }
            }
        } else {
            // Rutas conocidas en Linux / contenedores Docker
            $candidatosLinux = [
                "/usr/bin/{$nombreEjecutable}",
                "/usr/local/bin/{$nombreEjecutable}",
                "/opt/bitnami/postgresql/bin/{$nombreEjecutable}",
                "/usr/lib/postgresql/bin/{$nombreEjecutable}",
            ];

            foreach ($candidatosLinux as $candidato) {
                if (file_exists($candidato) && is_executable($candidato)) {
                    return $candidato;
                }
            }
        }

        return null;
    }

    /**
     * GET /api/cu28/backups
     * Listar el historial de copias de seguridad generadas o subidas.
     */
    public function index(): JsonResponse
    {
        $backups = CopiaSeguridad::with(['user:idUsuario,nombreCompleto,email'])
            ->orderBy('fechaHora', 'desc')
            ->get();

        $formateados = $backups->map(function (CopiaSeguridad $b) {
            return [
                'id'             => $b->id,
                'nombre_archivo' => $b->nombre_archivo,
                'tamano_bytes'   => $b->tamano_bytes,
                'tamano_legible' => $b->tamano_legible,
                'fecha_hora'     => $b->fecha_hora,
                'descripcion'    => $b->descripcion,
                'tipo'           => $b->tipo,
                'estado'         => $b->estado,
                'usuario'        => $b->usuario,
                'existe_archivo' => $b->existeArchivo(),
            ];
        });

        return $this->success(
            ['backups' => $formateados],
            'Historial de copias de seguridad consultado correctamente.'
        );
    }

    /**
     * GET /api/cu28/configuracion
     * Consultar los parámetros de automatización y programación de backups.
     */
    public function obtenerConfiguracion(): JsonResponse
    {
        $config = ConfiguracionBackup::obtenerConfiguracion();

        return $this->success([
            'configuracion' => $config,
        ], 'Configuración de respaldos programados obtenida.');
    }

    /**
     * PUT /api/cu28/configuracion
     * Actualizar la programación de copias de seguridad automáticas (Diario, Semanal, Mensual).
     */
    public function guardarConfiguracion(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'activo'           => 'required|boolean',
            'frecuencia'       => 'required|string|in:DIARIO,SEMANAL,MENSUAL',
            'hora_ejecucion'   => ['required', 'string', 'regex:/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/'],
            'dias_semana'      => 'nullable|array',
            'dia_mes'          => 'nullable|integer|between:1,31',
            'retencion_copias' => 'required|integer|between:1,100',
        ], [
            'frecuencia.in'           => 'La frecuencia debe ser DIARIO, SEMANAL o MENSUAL.',
            'hora_ejecucion.regex'    => 'La hora de ejecución debe tener formato válido HH:mm (24 horas).',
            'retencion_copias.between'=> 'La cantidad de copias a retener debe estar entre 1 y 100.',
        ]);

        $config = ConfiguracionBackup::obtenerConfiguracion();
        $datosAnteriores = $config->toArray();

        $config->activo = (bool) $validated['activo'];
        $config->frecuencia = strtoupper($validated['frecuencia']);
        $config->hora_ejecucion = $validated['hora_ejecucion'];
        $config->retencion_copias = (int) $validated['retencion_copias'];

        if (isset($validated['dias_semana'])) {
            $config->dias_semana = $validated['dias_semana'];
        }

        if (isset($validated['dia_mes'])) {
            $config->dia_mes = (int) $validated['dia_mes'];
        }

        $config->save();
        $proximo = $config->recalcularProximoBackup();

        AuditLogger::log(
            'CU28',
            'CONFIGURAR_BACKUP_AUTOMATICO',
            "Se actualizó la configuración de copias automáticas a frecuencia {$config->frecuencia} a las {$config->hora_ejecucion}",
            $datosAnteriores,
            $config->toArray()
        );

        return $this->success([
            'configuracion' => $config->fresh(),
            'proximo_backup' => $config->proximo_backup_at,
        ], 'Configuración de respaldos automáticos actualizada exitosamente.');
    }

    /**
     * POST /api/cu28/configuracion/ejecutar-ahora
     * Disparar manualmente una copia automática programada.
     */
    public function ejecutarBackupProgramado(): JsonResponse
    {
        $config = ConfiguracionBackup::obtenerConfiguracion();

        try {
            $backup = $this->ejecutarCopiaAutomatica("Respaldo automático forzado manualmente ({$config->frecuencia})");
            $this->limpiarCopiasAutomaticasAntiguas($config->retencion_copias);

            $ahora = now()->timezone('America/La_Paz');
            $config->update([
                'ultimoBackupAt' => $ahora,
                'ultimoEstado'   => 'EXITOSO',
                'ultimoMensaje'  => "Copia '{$backup->nombre_archivo}' generada exitosamente ({$backup->tamano_legible}).",
            ]);
            $config->recalcularProximoBackup();

            return $this->success([
                'backup'        => $backup,
                'configuracion' => $config->fresh(),
            ], 'Copia de seguridad programada ejecutada exitosamente.');
        } catch (Throwable $e) {
            $config->update([
                'ultimoEstado'  => 'FALLIDO',
                'ultimoMensaje' => 'Error: ' . $e->getMessage(),
            ]);

            return $this->error('No se pudo ejecutar el respaldo programado: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Generar copia automática y registrar en la base de datos.
     */
    public function ejecutarCopiaAutomatica(?string $descripcion = null): CopiaSeguridad
    {
        $dirBackups = $this->obtenerDirectorioBackups();
        $timestamp = now()->timezone('America/La_Paz')->format('Y-m-d_His');
        $nombreArchivo = "backup_auto_{$timestamp}.sql";
        $rutaCompleta = "{$dirBackups}" . DIRECTORY_SEPARATOR . "{$nombreArchivo}";
        $rutaRelativa = "backups/{$nombreArchivo}";

        $this->generarDumpSql($rutaCompleta);

        $tamanoBytes = file_exists($rutaCompleta) ? (int) filesize($rutaCompleta) : 0;
        $tamanoLegible = CopiaSeguridad::formatearBytes($tamanoBytes);

        $backup = CopiaSeguridad::create([
            'nombreArchivo' => $nombreArchivo,
            'ruta'          => $rutaRelativa,
            'tamanoBytes'   => $tamanoBytes,
            'tamanoLegible' => $tamanoLegible,
            'idUsuario'     => auth()->id(),
            'descripcion'   => $descripcion ?? 'Copia de seguridad automática programada del sistema.',
            'tipo'          => 'AUTOMATICA',
            'estado'        => 'COMPLETADO',
            'fechaHora'     => now()->timezone('America/La_Paz'),
        ]);

        AuditLogger::log(
            'CU28',
            'BACKUP_AUTOMATICO_GENERADO',
            "Se generó la copia automática '{$nombreArchivo}' ({$tamanoLegible})",
            null,
            $backup->toArray()
        );

        return $backup;
    }

    /**
     * Eliminar copias automáticas que excedan la retención configurada.
     */
    public function limpiarCopiasAutomaticasAntiguas(int $maxRetencion): void
    {
        if ($maxRetencion <= 0) return;

        $automaticas = CopiaSeguridad::where('tipo', 'AUTOMATICA')
            ->orderBy('fechaHora', 'desc')
            ->get();

        if ($automaticas->count() > $maxRetencion) {
            $sobrantes = $automaticas->slice($maxRetencion);
            foreach ($sobrantes as $copia) {
                $ruta = $copia->rutaCompleta();
                if (file_exists($ruta)) {
                    @unlink($ruta);
                }
                $copia->delete();
            }
        }
    }

    /**
     * POST /api/cu28/backups
     * Generar una nueva copia de seguridad física de PostgreSQL y guardarla.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'descripcion' => 'nullable|string|max:500',
        ]);

        $dirBackups = $this->obtenerDirectorioBackups();
        $timestamp = now()->timezone('America/La_Paz')->format('Y-m-d_His');
        $nombreArchivo = "backup_telcom_{$timestamp}.sql";
        $rutaCompleta = "{$dirBackups}" . DIRECTORY_SEPARATOR . "{$nombreArchivo}";
        $rutaRelativa = "backups/{$nombreArchivo}";

        try {
            $this->generarDumpSql($rutaCompleta);

            $tamanoBytes = file_exists($rutaCompleta) ? (int) filesize($rutaCompleta) : 0;
            $tamanoLegible = CopiaSeguridad::formatearBytes($tamanoBytes);

            $backup = CopiaSeguridad::create([
                'nombreArchivo' => $nombreArchivo,
                'ruta'          => $rutaRelativa,
                'tamanoBytes'   => $tamanoBytes,
                'tamanoLegible' => $tamanoLegible,
                'idUsuario'     => auth()->id(),
                'descripcion'   => $validated['descripcion'] ?? 'Copia de seguridad manual generada por el usuario.',
                'tipo'          => 'MANUAL',
                'estado'        => 'COMPLETADO',
                'fechaHora'     => now()->timezone('America/La_Paz'),
            ]);

            AuditLogger::log(
                'CU28',
                'GENERAR_BACKUP',
                "Se generó la copia de seguridad '{$nombreArchivo}' ({$tamanoLegible})",
                null,
                $backup->toArray()
            );

            return $this->success(
                ['backup' => $backup],
                'Copia de seguridad generada exitosamente.',
                201
            );
        } catch (Throwable $e) {
            if (file_exists($rutaCompleta)) {
                @unlink($rutaCompleta);
            }

            return $this->error(
                'No se pudo generar la copia de seguridad: ' . $e->getMessage(),
                500
            );
        }
    }

    /**
     * GET /api/cu28/backups/{id}/download
     * Descargar el archivo .sql correspondiente a una copia de seguridad.
     */
    public function download(int $id): BinaryFileResponse|JsonResponse
    {
        $backup = CopiaSeguridad::find($id);

        if (! $backup) {
            return $this->error('La copia de seguridad solicitada no existe.', 404);
        }

        $rutaArchivo = $backup->rutaCompleta();

        if (! file_exists($rutaArchivo)) {
            return $this->error('El archivo físico de la copia de seguridad no se encuentra en el servidor.', 404);
        }

        AuditLogger::log(
            'CU28',
            'DESCARGAR_BACKUP',
            "Se descargó la copia de seguridad '{$backup->nombreArchivo}' (ID: {$backup->idCopiaSeguridad})"
        );

        return response()->download($rutaArchivo, $backup->nombreArchivo, [
            'Content-Type'        => 'application/sql',
            'Content-Disposition' => "attachment; filename=\"{$backup->nombreArchivo}\"",
        ]);
    }

    /**
     * POST /api/cu28/backups/{id}/restore
     * Restaurar la base de datos PostgreSQL desde una copia existente.
     */
    public function restore(int $id): JsonResponse
    {
        $backup = CopiaSeguridad::find($id);

        if (! $backup) {
            return $this->error('La copia de seguridad solicitada no existe.', 404);
        }

        $rutaArchivo = $backup->rutaCompleta();

        if (! file_exists($rutaArchivo)) {
            return $this->error('El archivo físico de la copia de seguridad no existe en el servidor.', 404);
        }

        try {
            $this->restaurarSql($rutaArchivo);

            $backup->update([
                'estado'    => 'RESTAURADO',
                'fechaHora' => now()->timezone('America/La_Paz'),
            ]);

            AuditLogger::log(
                'CU28',
                'RESTAURAR_BACKUP',
                "Se restauró exitosamente la base de datos a partir de la copia '{$backup->nombreArchivo}' (ID: {$backup->idCopiaSeguridad})"
            );

            return $this->success(
                ['backup' => $backup->fresh(['user'])],
                "Base de datos restaurada exitosamente a partir de '{$backup->nombreArchivo}'."
            );
        } catch (Throwable $e) {
            return $this->error(
                'Fallo durante la restauración de la base de datos: ' . $e->getMessage(),
                500
            );
        }
    }

    /**
     * POST /api/cu28/backups/restore-upload
     * Subir un archivo .sql externo y restaurar la base de datos directamente con él.
     */
    public function restoreUpload(Request $request): JsonResponse
    {
        $request->validate([
            'archivo'     => 'required|file|max:51200', // Máx 50 MB
            'descripcion' => 'nullable|string|max:500',
        ], [
            'archivo.required' => 'Debe seleccionar un archivo .sql para restaurar.',
            'archivo.file'     => 'El elemento subido debe ser un archivo válido.',
            'archivo.max'      => 'El archivo no puede exceder los 50 MB de tamaño.',
        ]);

        $archivo = $request->file('archivo');
        $extension = strtolower($archivo->getClientOriginalExtension());

        if ($extension !== 'sql') {
            return $this->error('El archivo debe tener formato .sql (PostgreSQL).', 422);
        }

        $nombreOriginal = pathinfo($archivo->getClientOriginalName(), PATHINFO_FILENAME);
        $nombreSeguro = preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', $nombreOriginal);
        $timestamp = now()->timezone('America/La_Paz')->format('Y-m-d_His');
        $nombreFinal = "subido_{$timestamp}_{$nombreSeguro}.sql";

        $dirBackups = $this->obtenerDirectorioBackups();
        $rutaCompleta = "{$dirBackups}" . DIRECTORY_SEPARATOR . "{$nombreFinal}";
        $rutaRelativa = "backups/{$nombreFinal}";

        try {
            $archivo->move($dirBackups, $nombreFinal);

            $tamanoBytes = (int) filesize($rutaCompleta);
            $tamanoLegible = CopiaSeguridad::formatearBytes($tamanoBytes);

            // Ejecutar la restauración del archivo subido
            $this->restaurarSql($rutaCompleta);

            $backup = CopiaSeguridad::create([
                'nombreArchivo' => $nombreFinal,
                'ruta'          => $rutaRelativa,
                'tamanoBytes'   => $tamanoBytes,
                'tamanoLegible' => $tamanoLegible,
                'idUsuario'     => auth()->id(),
                'descripcion'   => $request->input('descripcion') ?? "Restauración desde archivo subido: {$archivo->getClientOriginalName()}",
                'tipo'          => 'SUBIDA',
                'estado'        => 'RESTAURADO',
                'fechaHora'     => now()->timezone('America/La_Paz'),
            ]);

            AuditLogger::log(
                'CU28',
                'RESTAURAR_BACKUP',
                "Se restauró la base de datos desde un archivo subido: '{$nombreFinal}' ({$tamanoLegible})",
                null,
                $backup->toArray()
            );

            return $this->success(
                ['backup' => $backup],
                "Base de datos restaurada correctamente a partir del archivo subido '{$nombreFinal}'."
            );
        } catch (Throwable $e) {
            return $this->error(
                'No se pudo restaurar el archivo subido: ' . $e->getMessage(),
                500
            );
        }
    }

    /**
     * DELETE /api/cu28/backups/{id}
     * Eliminar el registro y el archivo físico de una copia de seguridad.
     */
    public function destroy(int $id): JsonResponse
    {
        $backup = CopiaSeguridad::find($id);

        if (! $backup) {
            return $this->error('La copia de seguridad no existe.', 404);
        }

        $rutaArchivo = $backup->rutaCompleta();
        $nombreArchivo = $backup->nombreArchivo;
        $datosEliminados = $backup->toArray();

        if (file_exists($rutaArchivo)) {
            @unlink($rutaArchivo);
        }

        $backup->delete();

        AuditLogger::log(
            'CU28',
            'ELIMINAR_BACKUP',
            "Se eliminó la copia de seguridad '{$nombreArchivo}' (ID: {$id})",
            $datosEliminados,
            null
        );

        return $this->success(null, "Copia de seguridad '{$nombreArchivo}' eliminada exitosamente.");
    }

    /**
     * Generar volcado SQL usando pg_dump o fallback en PHP/PDO.
     */
    protected function generarDumpSql(string $rutaDestino): void
    {
        $pgDump = $this->resolverBinario('pg_dump');
        $cred = $this->obtenerCredencialesPg();

        if ($pgDump) {
            $cmd = [
                $pgDump,
                '-h', $cred['host'],
                '-p', $cred['port'],
                '-U', $cred['username'],
                '-d', $cred['database'],
                '--clean',
                '--if-exists',
                '--no-owner',
                '--no-privileges',
                '--exclude-table=public."CopiaSeguridad"',
                '-f', $rutaDestino,
            ];

            $env = array_merge($_ENV, $_SERVER, [
                'PGPASSWORD' => $cred['password'],
            ]);

            $process = new Process($cmd, null, $env, null, 180);
            $process->run();

            if ($process->isSuccessful() && file_exists($rutaDestino) && filesize($rutaDestino) > 0) {
                return;
            }
        }

        // Si pg_dump falló o no existe, recurrir al motor PDO integrado
        $this->exportarConPdo($rutaDestino);
    }

    /**
     * Restaurar volcado SQL usando psql o fallback en PHP/PDO.
     */
    protected function restaurarSql(string $rutaOrigen): void
    {
        $psql = $this->resolverBinario('psql');
        $cred = $this->obtenerCredencialesPg();

        if ($psql) {
            $cmd = [
                $psql,
                '-h', $cred['host'],
                '-p', $cred['port'],
                '-U', $cred['username'],
                '-d', $cred['database'],
                '-f', $rutaOrigen,
            ];

            $env = array_merge($_ENV, $_SERVER, [
                'PGPASSWORD' => $cred['password'],
            ]);

            $process = new Process($cmd, null, $env, null, 300);
            $process->run();

            if ($process->isSuccessful()) {
                return;
            }
        }

        // Si psql falló o no existe, recurrir a ejecución directa vía PDO
        $this->restaurarConPdo($rutaOrigen);
    }

    /**
     * Motor de respaldo en PHP puro mediante PDO para generar dump SQL.
     */
    protected function exportarConPdo(string $rutaDestino): void
    {
        $pdo = DB::connection()->getPdo();
        $tablasStmt = $pdo->query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' ORDER BY tablename ASC");
        $tablas = $tablasStmt->fetchAll(\PDO::FETCH_COLUMN);

        $fh = fopen($rutaDestino, 'w');
        if (! $fh) {
            throw new Exception("No se pudo abrir el archivo para escritura en {$rutaDestino}");
        }

        $now = now()->timezone('America/La_Paz')->format('Y-m-d H:i:s');
        fwrite($fh, "-- ============================================================\n");
        fwrite($fh, "-- TELCOM 2.0 - Respaldo Integral de Base de Datos PostgreSQL\n");
        fwrite($fh, "-- Generado el: {$now} (Motor PDO Fallback)\n");
        fwrite($fh, "-- ============================================================\n\n");
        fwrite($fh, "SET statement_timeout = 0;\n");
        fwrite($fh, "SET client_encoding = 'UTF8';\n");
        fwrite($fh, "SET standard_conforming_strings = on;\n");
        fwrite($fh, "SET check_function_bodies = false;\n");
        fwrite($fh, "SET client_min_messages = warning;\n");
        fwrite($fh, "SET session_replication_role = 'replica';\n\n");

        foreach ($tablas as $tabla) {
            if ($tabla === 'CopiaSeguridad') {
                continue; // Omitir historial de copias para preservar registros de restauración
            }

            // Datos de la tabla
            $dataStmt = $pdo->query("SELECT * FROM \"{$tabla}\"");
            $rows = $dataStmt->fetchAll(\PDO::FETCH_ASSOC);

            if (! empty($rows)) {
                fwrite($fh, "-- Datos para la tabla public.{$tabla}\n");
                $cols = array_keys($rows[0]);
                $quotedCols = array_map(fn ($c) => "\"{$c}\"", $cols);
                $colsStr = implode(', ', $quotedCols);

                foreach ($rows as $row) {
                    $values = [];
                    foreach ($cols as $col) {
                        $val = $row[$col];
                        if (is_null($val)) {
                            $values[] = 'NULL';
                        } elseif (is_bool($val)) {
                            $values[] = $val ? 'TRUE' : 'FALSE';
                        } elseif (is_numeric($val)) {
                            $values[] = $val;
                        } else {
                            $values[] = "'" . str_replace("'", "''", (string) $val) . "'";
                        }
                    }
                    $valsStr = implode(', ', $values);
                    fwrite($fh, "INSERT INTO public.\"{$tabla}\" ({$colsStr}) VALUES ({$valsStr});\n");
                }
                fwrite($fh, "\n");
            }
        }

        fwrite($fh, "SET session_replication_role = 'origin';\n");
        fwrite($fh, "-- Fin del respaldo.\n");
        fclose($fh);
    }

    /**
     * Motor de respaldo en PHP puro mediante PDO para restaurar script SQL.
     */
    protected function restaurarConPdo(string $rutaOrigen): void
    {
        $contenido = file_get_contents($rutaOrigen);
        if ($contenido === false) {
            throw new Exception("No se pudo leer el archivo de restauración {$rutaOrigen}");
        }

        DB::unprepared($contenido);
    }
}
