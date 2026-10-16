<?php

namespace App\Models\Paquetes\FacturacionCobranza\CU09_GenerarMensualidades;

use App\Models\Paquetes\GestionClientesZonas\CU05_RegistrarCliente\Cliente;
use App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio\ServicioInternet;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class MensualidadFacturacion extends Model
{
    protected $table = 'Mensualidad';
    protected $primaryKey = 'idMensualidad';
    public $timestamps = false;

    protected $fillable = [
        'idMensualidad',
        'periodo',
        'fechaVencimiento',
        'monto',
        'montoPagado',
        'estado',
        'idServicio',
        'codigoFactura',
        'fechaEmision',
        'idCliente',
        // alias de compatibilidad
        'servicio_id',
        'cliente_id',
        'estado_pago',
        'codigo_factura',
        'fecha_emision',
        'fecha_vencimiento',
        'monto_pagado',
    ];

    protected $casts = [
        'monto' => 'decimal:2',
    ];

    protected $appends = [
        'id',
        'servicio_id',
        'cliente_id',
        'estado_pago',
        'codigo_factura',
        'fecha_emision',
        'fecha_vencimiento',
        'monto_pagado',
    ];

    public function newEloquentBuilder($query)
    {
        return new class($query) extends Builder {
            protected function normalizeColumn(string $column): string
            {
                return match ($column) {
                    'id', 'mensualidad_id' => 'idMensualidad',
                    'servicio_id' => 'idServicio',
                    'cliente_id' => 'idCliente',
                    'estado_pago' => 'estado',
                    'codigo_factura' => 'codigoFactura',
                    'fecha_emision' => 'fechaEmision',
                    'fecha_vencimiento' => 'fechaVencimiento',
                    'monto_pagado' => 'montoPagado',
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

            public function whereIn($column, $values, $boolean = 'and', $not = false)
            {
                if (is_string($column)) {
                    $column = $this->normalizeColumn($column);
                }
                return parent::whereIn($column, $values, $boolean, $not);
            }

            public function whereNull($columns, $boolean = 'and', $not = false)
            {
                if (is_string($columns)) {
                    $columns = $this->normalizeColumn($columns);
                }
                return parent::whereNull($columns, $boolean, $not);
            }

            public function whereNotNull($columns, $boolean = 'and')
            {
                if (is_string($columns)) {
                    $columns = $this->normalizeColumn($columns);
                }
                return parent::whereNotNull($columns, $boolean);
            }

            public function orderBy($column, $direction = 'asc')
            {
                if (is_string($column)) {
                    $column = $this->normalizeColumn($column);
                }
                return parent::orderBy($column, $direction);
            }

            public function latest($column = 'fechaEmision')
            {
                if (is_string($column)) {
                    $column = $this->normalizeColumn($column);
                }
                return parent::latest($column);
            }

            public function oldest($column = 'fechaEmision')
            {
                if (is_string($column)) {
                    $column = $this->normalizeColumn($column);
                }
                return parent::oldest($column);
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

            public function value($column)
            {
                if (is_string($column)) {
                    $column = $this->normalizeColumn($column);
                }
                return parent::value($column);
            }
        };
    }

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'idCliente', 'idCliente');
    }

    public function servicio()
    {
        return $this->belongsTo(ServicioInternet::class, 'idServicio', 'idServicio');
    }

    public function getIdAttribute(): ?int
    {
        return isset($this->attributes['idMensualidad']) ? (int) $this->attributes['idMensualidad'] : null;
    }

    public function getServicioIdAttribute(): ?int
    {
        return isset($this->attributes['idServicio']) ? (int) $this->attributes['idServicio'] : null;
    }

    public function setServicioIdAttribute(?int $value): void
    {
        $this->attributes['idServicio'] = $value;
    }

    public function getClienteIdAttribute(): ?int
    {
        return isset($this->attributes['idCliente']) ? (int) $this->attributes['idCliente'] : ($this->servicio?->idCliente ?? null);
    }

    public function setClienteIdAttribute(?int $value): void
    {
        $this->attributes['idCliente'] = $value;
    }

    public function getEstadoPagoAttribute(): ?string
    {
        return $this->attributes['estado'] ?? 'PENDIENTE';
    }

    public function setEstadoPagoAttribute(?string $value): void
    {
        $this->attributes['estado'] = $value;
    }

    public function getCodigoFacturaAttribute(): ?string
    {
        return $this->attributes['codigoFactura'] ?? (isset($this->attributes['idMensualidad']) ? "FAC-{$this->attributes['idMensualidad']}" : null);
    }

    public function setCodigoFacturaAttribute(?string $value): void
    {
        $this->attributes['codigoFactura'] = $value;
    }

    public function getMontoPagadoAttribute(): ?string
    {
        return isset($this->attributes['montoPagado']) ? (string) $this->attributes['montoPagado'] : '0.00';
    }

    public function setMontoPagadoAttribute($value): void
    {
        $this->attributes['montoPagado'] = $value;
    }

    public function getFechaVencimientoAttribute($value)
    {
        $val = $this->attributes['fechaVencimiento'] ?? $value;
        return $val ? Carbon::parse($val) : null;
    }

    public function setFechaVencimientoAttribute($value): void
    {
        $this->attributes['fechaVencimiento'] = $value instanceof \DateTimeInterface ? $value->format('Y-m-d') : $value;
    }

    public function getFechaEmisionAttribute($value)
    {
        $val = $this->attributes['fechaEmision'] ?? $value;
        return $val ? Carbon::parse($val) : null;
    }

    public function setFechaEmisionAttribute($value): void
    {
        $this->attributes['fechaEmision'] = $value instanceof \DateTimeInterface ? $value->format('Y-m-d') : $value;
    }
}
