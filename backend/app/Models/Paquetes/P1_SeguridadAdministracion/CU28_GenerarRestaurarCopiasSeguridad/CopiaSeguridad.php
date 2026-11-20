<?php

namespace App\Models\Paquetes\P1_SeguridadAdministracion\CU28_GenerarRestaurarCopiasSeguridad;

use App\Models\User;
use Carbon\Carbon;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Entidad Canónica CopiaSeguridad (CU28).
 * Registro y trazabilidad de copias de seguridad de la base de datos PostgreSQL.
 */
class CopiaSeguridad extends Model
{
    protected $table = 'CopiaSeguridad';
    protected $primaryKey = 'idCopiaSeguridad';
    public $timestamps = false;

    protected $fillable = [
        'idCopiaSeguridad',
        'nombreArchivo',
        'ruta',
        'tamanoBytes',
        'tamanoLegible',
        'idUsuario',
        'descripcion',
        'tipo',
        'estado',
        'fechaHora',
        // alias de compatibilidad snake_case
        'nombre_archivo',
        'tamano_bytes',
        'tamano_legible',
        'user_id',
        'fecha_hora',
        'created_at',
    ];

    protected $casts = [
        'fechaHora'   => 'datetime',
        'tamanoBytes' => 'integer',
    ];

    protected $appends = [
        'id',
        'nombre_archivo',
        'tamano_bytes',
        'tamano_legible',
        'user_id',
        'fecha_hora',
        'created_at',
        'usuario',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'idUsuario', 'idUsuario');
    }

    public function getIdAttribute(): ?int
    {
        return isset($this->attributes['idCopiaSeguridad']) ? (int) $this->attributes['idCopiaSeguridad'] : null;
    }

    public function getNombreArchivoAttribute(): ?string
    {
        return $this->attributes['nombreArchivo'] ?? null;
    }

    public function setNombreArchivoAttribute(?string $val): void
    {
        $this->attributes['nombreArchivo'] = $val;
    }

    public function getTamanoBytesAttribute(): int
    {
        return isset($this->attributes['tamanoBytes']) ? (int) $this->attributes['tamanoBytes'] : 0;
    }

    public function setTamanoBytesAttribute(int $val): void
    {
        $this->attributes['tamanoBytes'] = $val;
    }

    public function getTamanoLegibleAttribute(): ?string
    {
        if (! empty($this->attributes['tamanoLegible'])) {
            return $this->attributes['tamanoLegible'];
        }

        $bytes = $this->tamano_bytes;
        return self::formatearBytes($bytes);
    }

    public function setTamanoLegibleAttribute(?string $val): void
    {
        $this->attributes['tamanoLegible'] = $val;
    }

    public function getUserIdAttribute(): ?int
    {
        return isset($this->attributes['idUsuario']) ? (int) $this->attributes['idUsuario'] : null;
    }

    public function setUserIdAttribute(?int $val): void
    {
        $this->attributes['idUsuario'] = $val;
    }

    public function getFechaHoraAttribute($val = null): ?string
    {
        $fecha = $val ?? ($this->attributes['fechaHora'] ?? null);
        if (! $fecha) {
            return null;
        }
        return Carbon::parse($fecha)->timezone('America/La_Paz')->format('Y-m-d H:i:s');
    }

    public function getCreatedAtAttribute(): ?string
    {
        return $this->fecha_hora;
    }

    public function getUsuarioAttribute(): ?array
    {
        $u = $this->user;
        if (! $u) {
            return null;
        }

        return [
            'id'    => $u->idUsuario ?? $u->id,
            'name'  => $u->nombreCompleto ?? $u->name ?? 'Usuario',
            'email' => $u->email,
        ];
    }

    public function existeArchivo(): bool
    {
        return file_exists($this->rutaCompleta());
    }

    public function rutaCompleta(): string
    {
        if (file_exists($this->ruta)) {
            return $this->ruta;
        }

        return storage_path('app/' . ltrim($this->ruta, '/\\'));
    }

    public static function formatearBytes(int $bytes, int $precision = 2): string
    {
        if ($bytes <= 0) {
            return '0 B';
        }

        $unidades = ['B', 'KB', 'MB', 'GB', 'TB'];
        $potencia = (int) floor(log($bytes, 1024));
        $potencia = min($potencia, count($unidades) - 1);

        $valor = $bytes / pow(1024, $potencia);
        return round($valor, $precision) . ' ' . $unidades[$potencia];
    }

    protected function serializeDate(DateTimeInterface $date): string
    {
        return Carbon::instance($date)->timezone('America/La_Paz')->format('Y-m-d H:i:s');
    }
}
