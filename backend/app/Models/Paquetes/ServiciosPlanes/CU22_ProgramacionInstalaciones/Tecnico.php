<?php

namespace App\Models\Paquetes\ServiciosPlanes\CU22_ProgramacionInstalaciones;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

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

    protected $appends = [
        'id',
        'nombre_completo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function newEloquentBuilder($query)
    {
        return new class($query) extends Builder {
            protected function normalizeColumn(string $column): string
            {
                return match ($column) {
                    'id', 'tecnico_id' => 'idTecnico',
                    'nombre_completo' => 'nombreCompleto',
                    default => $column,
                };
            }

            public function where($column, $operator = null, $value = null, $boolean = 'and')
            {
                if (is_string($column)) {
                    $column = $this->normalizeColumn($column);
                }
                return parent::where($column, $operator, $value, $boolean);
            }

            public function orderBy($column, $direction = 'asc')
            {
                if (is_string($column)) {
                    $column = $this->normalizeColumn($column);
                }
                return parent::orderBy($column, $direction);
            }
        };
    }

    public function instalaciones()
    {
        return $this->hasMany(Instalacion::class, 'idTecnico', 'idTecnico');
    }

    public function getIdAttribute(): ?int
    {
        return isset($this->attributes['idTecnico']) ? (int) $this->attributes['idTecnico'] : null;
    }

    public function getNombreCompletoAttribute(): ?string
    {
        return $this->attributes['nombreCompleto'] ?? null;
    }

    public function setNombreCompletoAttribute(?string $value): void
    {
        $this->attributes['nombreCompleto'] = $value;
    }
}
