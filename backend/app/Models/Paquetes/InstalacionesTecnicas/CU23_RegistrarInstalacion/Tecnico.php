<?php

namespace App\Models\Paquetes\InstalacionesTecnicas\CU23_RegistrarInstalacion;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Entidad Canónica Tecnico (Personal técnico de cuadrillas/instalación).
 */
class Tecnico extends Model
{
    protected $table = 'Tecnico';
    protected $primaryKey = 'idTecnico';
    public $timestamps = false;

    protected $fillable = [
        'idTecnico',
        'nombreCompleto',
        'telefono',
        'especialidad',
        'activo',
        // alias
        'nombre_completo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    protected $appends = [
        'id',
        'nombre_completo',
    ];

    public function getIdAttribute(): int
    {
        return (int) $this->attributes['idTecnico'];
    }

    public function getNombreCompletoAttribute(): ?string
    {
        return $this->attributes['nombreCompleto'] ?? null;
    }

    public function setNombreCompletoAttribute(?string $val): void
    {
        $this->attributes['nombreCompleto'] = $val;
    }

    public function instalaciones(): HasMany
    {
        return $this->hasMany(Instalacion::class, 'idTecnico', 'idTecnico');
    }
}

