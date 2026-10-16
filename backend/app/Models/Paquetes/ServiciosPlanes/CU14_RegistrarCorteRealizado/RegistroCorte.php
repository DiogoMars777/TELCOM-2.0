<?php

namespace App\Models\Paquetes\ServiciosPlanes\CU14_RegistrarCorteRealizado;

use App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio\ServicioInternet;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class RegistroCorte extends Model
{
    protected $table = 'AccionServicio';
    protected $primaryKey = 'idAccion';
    public $timestamps = false;

    protected $fillable = [
        'idAccion',
        'tipoAccion',
        'fechaSolicitud',
        'fechaEjecucion',
        'estado',
        'motivo',
        'observacion',
        'idServicio',
        'idUsuario',
        // alias
        'codigo_orden_corte',
        'servicio_id',
        'tecnico_user_id',
        'tipo_corte',
        'fecha_corte',
        'observaciones',
    ];

    protected $appends = [
        'id',
        'codigo_orden_corte',
        'servicio_id',
        'tecnico_user_id',
        'tipo_corte',
        'fecha_corte',
        'observaciones',
    ];

    protected static function booted()
    {
        static::addGlobalScope('tipoAccion', function (Builder $builder) {
            $builder->where('tipoAccion', 'CORTE');
        });

        static::creating(function (RegistroCorte $model) {
            if (empty($model->attributes['tipoAccion'])) {
                $model->attributes['tipoAccion'] = 'CORTE';
            }
            if (empty($model->attributes['fechaEjecucion'])) {
                $model->attributes['fechaEjecucion'] = now();
            }
            if (empty($model->attributes['estado'])) {
                $model->attributes['estado'] = 'COMPLETADO';
            }
        });
    }

    public function newEloquentBuilder($query)
    {
        return new class($query) extends Builder {
            protected function normalizeColumn(string $column): string
            {
                return match ($column) {
                    'id', 'corte_id' => 'idAccion',
                    'servicio_id' => 'idServicio',
                    'tecnico_user_id', 'user_id' => 'idUsuario',
                    'tipo_corte', 'tipo_accion' => 'tipoAccion',
                    'fecha_corte' => 'fechaEjecucion',
                    'observaciones' => 'observacion',
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

            public function whereDate($column, $operator = null, $value = null, $boolean = 'and')
            {
                if (is_string($column)) {
                    $column = $this->normalizeColumn($column);
                }
                return parent::whereDate($column, $operator, $value, $boolean);
            }

            public function latest($column = 'fechaEjecucion')
            {
                if (is_string($column)) {
                    $column = $this->normalizeColumn($column);
                }
                return parent::latest($column);
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

    public function servicio()
    {
        return $this->belongsTo(ServicioInternet::class, 'idServicio', 'idServicio');
    }

    public function tecnico()
    {
        return $this->belongsTo(User::class, 'idUsuario', 'idUsuario');
    }

    public function getIdAttribute(): ?int
    {
        return isset($this->attributes['idAccion']) ? (int) $this->attributes['idAccion'] : null;
    }

    public function getCodigoOrdenCorteAttribute(): ?string
    {
        return 'COR-' . ($this->idAccion ?? '0');
    }

    public function setCodigoOrdenCorteAttribute(?string $value): void
    {
        // virtual
    }

    public function getServicioIdAttribute(): ?int
    {
        return isset($this->attributes['idServicio']) ? (int) $this->attributes['idServicio'] : null;
    }

    public function setServicioIdAttribute(?int $value): void
    {
        $this->attributes['idServicio'] = $value;
    }

    public function getTecnicoUserIdAttribute(): ?int
    {
        return isset($this->attributes['idUsuario']) ? (int) $this->attributes['idUsuario'] : null;
    }

    public function setTecnicoUserIdAttribute(?int $value): void
    {
        $this->attributes['idUsuario'] = $value;
    }

    public function getTipoCorteAttribute(): ?string
    {
        return $this->attributes['tipoAccion'] ?? 'CORTE';
    }

    public function setTipoCorteAttribute(?string $value): void
    {
        $this->attributes['tipoAccion'] = $value;
    }

    public function getFechaCorteAttribute(): ?string
    {
        return $this->attributes['fechaEjecucion'] ?? null;
    }

    public function setFechaCorteAttribute(?string $value): void
    {
        $this->attributes['fechaEjecucion'] = $value;
    }

    public function getObservacionesAttribute(): ?string
    {
        return $this->attributes['observacion'] ?? null;
    }

    public function setObservacionesAttribute(?string $value): void
    {
        $this->attributes['observacion'] = $value;
    }
}
