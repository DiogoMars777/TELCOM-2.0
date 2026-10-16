<?php

namespace App\Models\Paquetes\ServiciosPlanes\CU17_AsignarCambiarPlanInternet;

use App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio\ServicioInternet;
use App\Models\Paquetes\ServiciosPlanes\CU16_GestionarCatalogoPlanes\PlanInternet;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class AsignacionPlan extends Model
{
    protected $table = 'AsignacionPlan';
    protected $primaryKey = 'idAsignacionPlan';
    public $timestamps = false;

    protected $fillable = [
        'idAsignacionPlan',
        'fechaInicio',
        'fechaFin',
        'precioAplicado',
        'motivoCambio',
        'idServicio',
        'idPlan',
        'idUsuario',
        // alias
        'servicio_id',
        'plan_id',
        'user_id',
        'fecha_inicio',
        'fecha_fin',
        'precio_aplicado',
        'motivo_cambio',
    ];

    protected $appends = [
        'servicio_id',
        'plan_id',
        'user_id',
        'fecha_inicio',
        'fecha_fin',
        'precio_aplicado',
        'motivo_cambio',
    ];

    public function newEloquentBuilder($query)
    {
        return new class($query) extends \Illuminate\Database\Eloquent\Builder {
            protected function normalizeColumn(string $column): string
            {
                return match ($column) {
                    'id', 'asignacion_id' => 'idAsignacionPlan',
                    'servicio_id' => 'idServicio',
                    'plan_id' => 'idPlan',
                    'user_id' => 'idUsuario',
                    'fecha_inicio', 'created_at' => 'fechaInicio',
                    'fecha_fin' => 'fechaFin',
                    'precio_aplicado' => 'precioAplicado',
                    'motivo_cambio' => 'motivoCambio',
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

            public function whereNull($columns, $boolean = 'and', $not = false)
            {
                if (is_string($columns)) {
                    $columns = $this->normalizeColumn($columns);
                }
                return parent::whereNull($columns, $boolean, $not);
            }

            public function orderBy($column, $direction = 'asc')
            {
                if (is_string($column)) {
                    $column = $this->normalizeColumn($column);
                }
                return parent::orderBy($column, $direction);
            }

            public function orderByDesc($column)
            {
                if (is_string($column)) {
                    $column = $this->normalizeColumn($column);
                }
                return parent::orderBy($column, 'desc');
            }

            public function latest($column = 'fechaInicio')
            {
                if (is_string($column)) {
                    $column = $this->normalizeColumn($column);
                }
                return parent::latest($column ?? 'fechaInicio');
            }

            public function oldest($column = 'fechaInicio')
            {
                if (is_string($column)) {
                    $column = $this->normalizeColumn($column);
                }
                return parent::oldest($column ?? 'fechaInicio');
            }

            public function update(array $values)
            {
                $mapped = [];
                foreach ($values as $key => $val) {
                    if ($key === 'updated_at' || $key === 'created_at') {
                        continue;
                    }
                    $k = $this->normalizeColumn((string)$key);
                    $mapped[$k] = $val;
                }
                return parent::update($mapped);
            }
        };
    }

    public function servicio()
    {
        return $this->belongsTo(ServicioInternet::class, 'idServicio', 'idServicio');
    }

    public function plan()
    {
        return $this->belongsTo(PlanInternet::class, 'idPlan', 'idPlan');
    }

    public function usuario()
    {
        return $this->belongsTo(User::class, 'idUsuario', 'idUsuario');
    }

    public function estaVigente(): bool
    {
        return $this->fechaFin === null;
    }

    public function getIdAttribute(): ?int
    {
        return isset($this->attributes['idAsignacionPlan']) ? (int) $this->attributes['idAsignacionPlan'] : null;
    }

    public function getServicioIdAttribute(): ?int
    {
        return isset($this->attributes['idServicio']) ? (int) $this->attributes['idServicio'] : null;
    }

    public function setServicioIdAttribute(?int $value): void
    {
        $this->attributes['idServicio'] = $value;
    }

    public function getPlanIdAttribute(): ?int
    {
        return isset($this->attributes['idPlan']) ? (int) $this->attributes['idPlan'] : null;
    }

    public function setPlanIdAttribute(?int $value): void
    {
        $this->attributes['idPlan'] = $value;
    }

    public function getUserIdAttribute(): ?int
    {
        return isset($this->attributes['idUsuario']) ? (int) $this->attributes['idUsuario'] : null;
    }

    public function setUserIdAttribute(?int $value): void
    {
        $this->attributes['idUsuario'] = $value;
    }

    public function getFechaInicioAttribute(): ?string
    {
        return $this->attributes['fechaInicio'] ?? null;
    }

    public function setFechaInicioAttribute(?string $value): void
    {
        $this->attributes['fechaInicio'] = $value;
    }

    public function getFechaFinAttribute(): ?string
    {
        return $this->attributes['fechaFin'] ?? null;
    }

    public function setFechaFinAttribute(?string $value): void
    {
        $this->attributes['fechaFin'] = $value;
    }

    public function getPrecioAplicadoAttribute(): ?string
    {
        $val = $this->attributes['precioAplicado'] ?? null;
        if ($val !== null && is_numeric($val)) {
            return number_format((float) $val, 2, '.', '');
        }
        return isset($this->attributes['precioAplicado']) ? (string) $this->attributes['precioAplicado'] : null;
    }

    public function setPrecioAplicadoAttribute($value): void
    {
        $this->attributes['precioAplicado'] = $value;
    }

    public function getMotivoCambioAttribute(): ?string
    {
        return $this->attributes['motivoCambio'] ?? null;
    }

    public function setMotivoCambioAttribute(?string $value): void
    {
        $this->attributes['motivoCambio'] = $value;
    }
}
