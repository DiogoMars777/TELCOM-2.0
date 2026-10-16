<?php

namespace App\Models\Paquetes\SeguridadAdministracion\CU02_BitacoraAuditoria;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class BitacoraAuditoria extends Model
{
    protected $table = 'Bitacora';
    protected $primaryKey = 'idBitacora';
    public $timestamps = false;

    protected $fillable = [
        'idBitacora',
        'fechaHora',
        'accion',
        'modulo',
        'descripcion',
        'idUsuario',
        'ipOrigen',
        'datosPrevios',
        'datosNuevos',
        // alias de compatibilidad
        'user_id',
        'detalles',
        'ip_origen',
        'datos_previos',
        'datos_nuevos',
    ];

    protected $casts = [
        'fechaHora'     => 'datetime',
        'datosPrevios'  => 'array',
        'datosNuevos'   => 'array',
        'datos_previos' => 'array',
        'datos_nuevos'  => 'array',
    ];

    protected $appends = [
        'id',
        'user_id',
        'detalles',
        'ip_origen',
        'created_at',
        'fecha_hora',
    ];

    public function getCreatedAtColumn()
    {
        return 'fechaHora';
    }

    public function newEloquentBuilder($query)
    {
        return new class($query) extends \Illuminate\Database\Eloquent\Builder {
            protected function normalizeColumn(string $column): string
            {
                return match ($column) {
                    'id' => 'idBitacora',
                    'user_id' => 'idUsuario',
                    'detalles' => 'descripcion',
                    'ip_origen' => 'ipOrigen',
                    'datos_previos' => 'datosPrevios',
                    'datos_nuevos' => 'datosNuevos',
                    'created_at', 'fecha', 'fecha_hora' => 'fechaHora',
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

            public function whereNotNull($columns, $boolean = 'and')
            {
                if (is_string($columns)) {
                    $columns = $this->normalizeColumn($columns);
                }
                return parent::whereNotNull($columns, $boolean);
            }

            public function latest($column = 'fechaHora')
            {
                if (is_string($column)) {
                    $column = $this->normalizeColumn($column);
                }
                return parent::latest($column ?? 'fechaHora');
            }

            public function oldest($column = 'fechaHora')
            {
                if (is_string($column)) {
                    $column = $this->normalizeColumn($column);
                }
                return parent::oldest($column ?? 'fechaHora');
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

            public function pluck($column, $key = null)
            {
                if (is_string($column)) {
                    $column = $this->normalizeColumn($column);
                }
                if (is_string($key)) {
                    $key = $this->normalizeColumn($key);
                }
                return parent::pluck($column, $key);
            }
        };
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'idUsuario', 'idUsuario');
    }

    public function getUserIdAttribute(): ?int
    {
        return isset($this->attributes['idUsuario']) ? (int) $this->attributes['idUsuario'] : null;
    }

    public function setUserIdAttribute(?int $value): void
    {
        $this->attributes['idUsuario'] = $value;
    }

    public function getDetallesAttribute(): ?string
    {
        return $this->attributes['descripcion'] ?? null;
    }

    public function setDetallesAttribute(?string $value): void
    {
        $this->attributes['descripcion'] = $value;
    }

    public function getIpOrigenAttribute(): ?string
    {
        return $this->attributes['ipOrigen'] ?? null;
    }

    public function setIpOrigenAttribute(?string $value): void
    {
        $this->attributes['ipOrigen'] = $value;
    }

    public function getIdAttribute(): ?int
    {
        return isset($this->attributes['idBitacora']) ? (int) $this->attributes['idBitacora'] : null;
    }

    public function getCreatedAtAttribute(): ?string
    {
        $fecha = $this->attributes['fechaHora'] ?? null;
        if (! $fecha) {
            return null;
        }
        return \Carbon\Carbon::parse($fecha)->timezone('America/La_Paz')->format('Y-m-d H:i:s');
    }

    public function getFechaHoraAttribute($value = null): ?string
    {
        $fecha = $value ?? ($this->attributes['fechaHora'] ?? null);
        if (! $fecha) {
            return null;
        }
        return \Carbon\Carbon::parse($fecha)->timezone('America/La_Paz')->format('Y-m-d H:i:s');
    }

    protected function serializeDate(\DateTimeInterface $date): string
    {
        return \Carbon\Carbon::instance($date)->timezone('America/La_Paz')->format('Y-m-d H:i:s');
    }
}
