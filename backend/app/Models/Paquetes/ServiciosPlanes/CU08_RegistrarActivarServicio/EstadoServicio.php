<?php

namespace App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio;

use Illuminate\Database\Eloquent\Model;

class EstadoServicio extends Model
{
    protected $table = 'EstadoServicio';
    protected $primaryKey = 'idEstadoServicio';
    public $timestamps = false;

    protected $fillable = [
        'idEstadoServicio',
        'nombreEstado',
        'descripcion',
        // alias
        'nombre_estado',
    ];

    protected $appends = ['id', 'nombre_estado'];

    public function newEloquentBuilder($query)
    {
        return new class($query) extends \Illuminate\Database\Eloquent\Builder {
            public function where($column, $operator = null, $value = null, $boolean = 'and')
            {
                if (is_string($column)) {
                    $column = match ($column) {
                        'id' => 'idEstadoServicio',
                        'nombre_estado' => 'nombreEstado',
                        default => $column,
                    };
                }
                return parent::where($column, $operator, $value, $boolean);
            }

            public function value($column)
            {
                if ($column === 'id') {
                    $column = 'idEstadoServicio';
                } elseif ($column === 'nombre_estado') {
                    $column = 'nombreEstado';
                }
                return parent::value($column);
            }

            public function pluck($column, $key = null)
            {
                if ($column === 'id') {
                    $column = 'idEstadoServicio';
                } elseif ($column === 'nombre_estado') {
                    $column = 'nombreEstado';
                }
                return parent::pluck($column, $key);
            }
        };
    }

    public function servicios()
    {
        return $this->hasMany(ServicioInternet::class, 'idEstadoServicio', 'idEstadoServicio');
    }

    public function getIdAttribute(): ?int
    {
        return isset($this->attributes['idEstadoServicio']) ? (int) $this->attributes['idEstadoServicio'] : null;
    }

    public function getNombreEstadoAttribute(): ?string
    {
        return $this->attributes['nombreEstado'] ?? null;
    }

    public function setNombreEstadoAttribute(?string $value): void
    {
        $this->attributes['nombreEstado'] = $value;
    }
}
