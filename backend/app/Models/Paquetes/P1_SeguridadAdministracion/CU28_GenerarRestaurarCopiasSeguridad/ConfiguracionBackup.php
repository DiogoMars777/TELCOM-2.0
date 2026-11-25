<?php

namespace App\Models\Paquetes\P1_SeguridadAdministracion\CU28_GenerarRestaurarCopiasSeguridad;

use Carbon\Carbon;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Model;

/**
 * Modelo ConfiguracionBackup (CU28).
 * Almacena los parámetros para la ejecución periódica y automática de copias de seguridad.
 */
class ConfiguracionBackup extends Model
{
    protected $table = 'ConfiguracionBackup';
    protected $primaryKey = 'idConfiguracionBackup';

    protected $fillable = [
        'idConfiguracionBackup',
        'activo',
        'frecuencia',
        'horaEjecucion',
        'diasSemana',
        'diaMes',
        'retencionCopias',
        'ultimoBackupAt',
        'proximoBackupAt',
        'ultimoEstado',
        'ultimoMensaje',
        // alias snake_case
        'hora_ejecucion',
        'dias_semana',
        'dia_mes',
        'retencion_copias',
        'ultimo_backup_at',
        'proximo_backup_at',
        'ultimo_estado',
        'ultimo_mensaje',
    ];

    protected $casts = [
        'activo'          => 'boolean',
        'retencionCopias' => 'integer',
        'diaMes'          => 'integer',
        'ultimoBackupAt'  => 'datetime',
        'proximoBackupAt' => 'datetime',
    ];

    protected $appends = [
        'id',
        'hora_ejecucion',
        'dias_semana',
        'dia_mes',
        'retencion_copias',
        'ultimo_backup_at',
        'proximo_backup_at',
        'ultimo_estado',
        'ultimo_mensaje',
        'dias_semana_array',
    ];

    public function getIdAttribute(): ?int
    {
        return $this->attributes['idConfiguracionBackup'] ?? null;
    }

    public function getHoraEjecucionAttribute(): string
    {
        return $this->attributes['horaEjecucion'] ?? '02:00';
    }

    public function setHoraEjecucionAttribute(string $val): void
    {
        $this->attributes['horaEjecucion'] = $val;
    }

    public function getDiasSemanaAttribute(): ?string
    {
        return $this->attributes['diasSemana'] ?? '["1"]';
    }

    public function setDiasSemanaAttribute($val): void
    {
        if (is_array($val)) {
            $this->attributes['diasSemana'] = json_encode(array_values($val));
        } else {
            $this->attributes['diasSemana'] = (string) $val;
        }
    }

    public function getDiasSemanaArrayAttribute(): array
    {
        $raw = $this->dias_semana;
        if (empty($raw)) {
            return ['1'];
        }
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : ['1'];
    }

    public function getDiaMesAttribute(): int
    {
        return (int) ($this->attributes['diaMes'] ?? 1);
    }

    public function setDiaMesAttribute(int $val): void
    {
        $this->attributes['diaMes'] = max(1, min(31, $val));
    }

    public function getRetencionCopiasAttribute(): int
    {
        return (int) ($this->attributes['retencionCopias'] ?? 7);
    }

    public function setRetencionCopiasAttribute(int $val): void
    {
        $this->attributes['retencionCopias'] = max(1, min(100, $val));
    }

    public function getUltimoBackupAtAttribute(): ?string
    {
        return isset($this->attributes['ultimoBackupAt']) && $this->attributes['ultimoBackupAt']
            ? Carbon::parse($this->attributes['ultimoBackupAt'])->format('Y-m-d H:i:s')
            : null;
    }

    public function getProximoBackupAtAttribute(): ?string
    {
        return isset($this->attributes['proximoBackupAt']) && $this->attributes['proximoBackupAt']
            ? Carbon::parse($this->attributes['proximoBackupAt'])->format('Y-m-d H:i:s')
            : null;
    }

    public function getUltimoEstadoAttribute(): string
    {
        return $this->attributes['ultimoEstado'] ?? 'PENDIENTE';
    }

    public function getUltimoMensajeAttribute(): ?string
    {
        return $this->attributes['ultimoMensaje'] ?? null;
    }

    /**
     * Obtiene la configuración única del sistema o crea la inicial.
     */
    public static function obtenerConfiguracion(): self
    {
        $config = self::first();
        if (! $config) {
            $config = self::create([
                'activo'          => true,
                'frecuencia'      => 'DIARIO',
                'horaEjecucion'   => '02:00',
                'diasSemana'      => json_encode(['1', '2', '3', '4', '5', '6', '0']),
                'diaMes'          => 1,
                'retencionCopias' => 7,
                'ultimoEstado'    => 'PENDIENTE',
                'ultimoMensaje'   => 'Configuración automática inicial creada.',
            ]);
            $config->recalcularProximoBackup();
        }
        return $config;
    }

    /**
     * Recalcula la fecha y hora de la próxima ejecución en zona horaria America/La_Paz.
     */
    public function recalcularProximoBackup(): Carbon
    {
        $tz = 'America/La_Paz';
        $ahora = now()->timezone($tz);

        $partesHora = explode(':', $this->hora_ejecucion);
        $hora = (int) ($partesHora[0] ?? 2);
        $min = (int) ($partesHora[1] ?? 0);

        if (! $this->activo) {
            $this->proximoBackupAt = null;
            $this->saveQuietly();
            return $ahora;
        }

        switch (strtoupper($this->frecuencia)) {
            case 'SEMANAL':
                // Buscar el siguiente día de la semana configurado
                $dias = $this->dias_semana_array;
                if (empty($dias)) {
                    $dias = ['1']; // Por defecto Lunes
                }
                // Carbon: 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
                $candidato = $ahora->copy()->setTime($hora, $min, 0);
                if ($candidato->isPast()) {
                    $candidato->addDay();
                }

                // Iterar hasta 14 días para encontrar coincidencia con los días configurados
                for ($i = 0; $i < 14; $i++) {
                    $diaSemanaActual = (string) $candidato->dayOfWeek;
                    if (in_array($diaSemanaActual, $dias, true)) {
                        break;
                    }
                    $candidato->addDay();
                }
                $proximo = $candidato;
                break;

            case 'MENSUAL':
                $diaMesDeseado = min(28, max(1, $this->dia_mes));
                $candidato = $ahora->copy()->day($diaMesDeseado)->setTime($hora, $min, 0);
                if ($candidato->isPast()) {
                    $candidato = $candidato->addMonth()->day($diaMesDeseado)->setTime($hora, $min, 0);
                }
                $proximo = $candidato;
                break;

            case 'DIARIO':
            default:
                $candidato = $ahora->copy()->setTime($hora, $min, 0);
                if ($candidato->isPast()) {
                    $candidato->addDay();
                }
                $proximo = $candidato;
                break;
        }

        $this->proximoBackupAt = $proximo;
        $this->saveQuietly();

        return $proximo;
    }
}
