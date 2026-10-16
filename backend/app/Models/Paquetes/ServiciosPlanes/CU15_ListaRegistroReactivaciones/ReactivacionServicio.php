<?php

namespace App\Models\Paquetes\ServiciosPlanes\CU15_ListaRegistroReactivaciones;

use App\Models\Paquetes\FacturacionCobranza\CU10_GestionarPagoMensualidad\PagoMensualidad;
use App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio\ServicioInternet;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class ReactivacionServicio extends Model
{
    protected $table = 'AccionServicio';
    protected $primaryKey = 'idAccion';
    public $timestamps = false;

    public ?float $tempCostoReactivacion = null;
    public ?int $tempPagoId = null;

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
        'codigo_reactivacion',
        'servicio_id',
        'user_id',
        'fecha_reactivacion',
        'costo_reactivacion',
        'observaciones',
        'pago_id',
    ];

    protected $appends = [
        'id',
        'codigo_reactivacion',
        'servicio_id',
        'user_id',
        'fecha_reactivacion',
        'costo_reactivacion',
        'observaciones',
        'pago_id',
    ];

    protected static function booted()
    {
        static::addGlobalScope('tipoAccion', function (Builder $builder) {
            $builder->where('tipoAccion', 'REACTIVACION');
        });

        static::creating(function (ReactivacionServicio $model) {
            if (empty($model->attributes['tipoAccion'])) {
                $model->attributes['tipoAccion'] = 'REACTIVACION';
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
                    'id', 'reactivacion_id' => 'idAccion',
                    'servicio_id' => 'idServicio',
                    'user_id' => 'idUsuario',
                    'tipo_accion' => 'tipoAccion',
                    'fecha_reactivacion' => 'fechaEjecucion',
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

    public function operador()
    {
        return $this->belongsTo(User::class, 'idUsuario', 'idUsuario');
    }

    public function pago()
    {
        return $this->belongsTo(PagoMensualidad::class, 'idPago', 'idPago');
    }

    public function getIdAttribute(): ?int
    {
        return isset($this->attributes['idAccion']) ? (int) $this->attributes['idAccion'] : null;
    }

    public function getCodigoReactivacionAttribute(): ?string
    {
        return 'REA-' . ($this->idAccion ?? '0');
    }

    public function setCodigoReactivacionAttribute(?string $value): void
    {
        // virtual
    }

    public function getCostoReactivacionAttribute(): ?string
    {
        return isset($this->tempCostoReactivacion) ? number_format($this->tempCostoReactivacion, 2, '.', '') : '0.00';
    }

    public function setCostoReactivacionAttribute($value): void
    {
        $this->tempCostoReactivacion = (float) $value;
    }

    public function getPagoIdAttribute(): ?int
    {
        return $this->tempPagoId;
    }

    public function setPagoIdAttribute(?int $value): void
    {
        $this->tempPagoId = $value;
    }

    public function getServicioIdAttribute(): ?int
    {
        return isset($this->attributes['idServicio']) ? (int) $this->attributes['idServicio'] : null;
    }

    public function setServicioIdAttribute(?int $value): void
    {
        $this->attributes['idServicio'] = $value;
    }

    public function getUserIdAttribute(): ?int
    {
        return isset($this->attributes['idUsuario']) ? (int) $this->attributes['idUsuario'] : null;
    }

    public function setUserIdAttribute(?int $value): void
    {
        $this->attributes['idUsuario'] = $value;
    }

    public function getFechaReactivacionAttribute(): ?string
    {
        return $this->attributes['fechaEjecucion'] ?? null;
    }

    public function setFechaReactivacionAttribute(?string $value): void
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
