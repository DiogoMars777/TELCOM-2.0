<?php

namespace App\Models\Paquetes\P3_ServiciosPlanes\CU14_RegistrarCorteRealizado;

use App\Models\Paquetes\P3_ServiciosPlanes\CU08_RegistrarActivarServicio\ServicioInternet;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class RegistroCorte extends AccionServicio
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
            $builder->where(function ($q) {
                $q->where('tipoAccion', 'CORTE')
                  ->orWhere('tipoAccion', 'like', 'CORTE%')
                  ->orWhereIn('tipoAccion', ['LOGICO', 'FISICO']);
            });
        });

        static::creating(function (RegistroCorte $model) {
            if (empty($model->attributes['tipoAccion']) || in_array($model->attributes['tipoAccion'], ['LOGICO', 'FISICO'])) {
                $tipo = !empty($model->attributes['tipoAccion']) ? $model->attributes['tipoAccion'] : 'LOGICO';
                $model->attributes['tipoAccion'] = 'CORTE';
                $obs = $model->attributes['observacion'] ?? '';
                if (!str_contains($obs, '[Tipo:')) {
                    $model->attributes['observacion'] = trim("[Tipo: {$tipo}] " . $obs);
                }
            }
            if (empty($model->attributes['fechaEjecucion'])) {
                $model->attributes['fechaEjecucion'] = now();
            }
            if (empty($model->attributes['fechaSolicitud'])) {
                $model->attributes['fechaSolicitud'] = now();
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
        return 'COR-' . str_pad($this->idAccion ?? 0, 5, '0', STR_PAD_LEFT);
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
        $tipo = $this->attributes['tipoAccion'] ?? '';
        if (str_contains($tipo, 'FISICO')) return 'FISICO';
        if (str_contains($tipo, 'LOGICO')) return 'LOGICO';

        $obs = $this->attributes['observacion'] ?? '';
        if (preg_match('/\[Tipo:\s*(LOGICO|FISICO)\]/i', $obs, $m)) {
            return strtoupper($m[1]);
        }
        if (stripos($obs, 'FISICO') !== false) return 'FISICO';
        if (stripos($obs, 'LOGICO') !== false) return 'LOGICO';

        return 'LOGICO';
    }

    public function setTipoCorteAttribute(?string $value): void
    {
        if ($value) {
            $tipo = strtoupper($value);
            $obs = $this->attributes['observacion'] ?? '';
            if (!str_contains($obs, '[Tipo:')) {
                $this->attributes['observacion'] = trim("[Tipo: {$tipo}] " . $obs);
            }
        }
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
