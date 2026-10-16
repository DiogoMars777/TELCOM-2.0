<?php

namespace App\Models\Paquetes\FacturacionCobranza\CU10_GestionarPagoMensualidad;

use App\Models\Paquetes\FacturacionCobranza\CU09_GenerarMensualidades\MensualidadFacturacion;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class PagoMensualidad extends Model
{
    protected $table = 'Pago';
    protected $primaryKey = 'idPago';
    public $timestamps = false;

    public ?int $pendingMensualidadId = null;

    protected $fillable = [
        'idPago',
        'fechaHora',
        'montoTotal',
        'numeroComprobante',
        'observacion',
        'idUsuario',
        'idMetodoPago',
        // alias de compatibilidad
        'codigo_recibo',
        'monto_pagado',
        'metodo_pago',
        'numero_transaccion',
        'fecha_pago',
        'cajero_user_id',
        'observaciones',
        'mensualidad_id',
    ];

    protected $appends = [
        'id',
        'codigo_recibo',
        'monto_pagado',
        'metodo_pago',
        'numero_transaccion',
        'fecha_pago',
        'cajero_user_id',
        'observaciones',
        'mensualidad_id',
    ];

    protected static function booted()
    {
        static::created(function (PagoMensualidad $pago) {
            if (!empty($pago->pendingMensualidadId)) {
                DetallePago::create([
                    'idPago' => $pago->idPago,
                    'idMensualidad' => $pago->pendingMensualidadId,
                    'subtotal' => $pago->montoTotal ?? 0,
                    'montoAplicado' => $pago->montoTotal ?? 0,
                ]);
            }
        });
    }

    public function newEloquentBuilder($query)
    {
        return new class($query) extends Builder {
            protected function normalizeColumn(string $column): string
            {
                return match ($column) {
                    'id', 'pago_id' => 'idPago',
                    'fecha_pago' => 'fechaHora',
                    'monto_pagado', 'monto_total' => 'montoTotal',
                    'codigo_recibo', 'nro_comprobante' => 'numeroComprobante',
                    'cajero_user_id', 'user_id' => 'idUsuario',
                    'observaciones' => 'observacion',
                    'metodo_pago_id' => 'idMetodoPago',
                    default => $column,
                };
            }

            public function where($column, $operator = null, $value = null, $boolean = 'and')
            {
                if (is_string($column)) {
                    if ($column === 'metodo_pago') {
                        $target = $value ?? $operator;
                        $metodoId = MetodoPago::where('nombreMetodo', $target)->value('idMetodoPago');
                        $column = 'idMetodoPago';
                        if ($value !== null) {
                            return parent::where($column, $operator, $metodoId, $boolean);
                        }
                        return parent::where($column, '=', $metodoId, $boolean);
                    }
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

            public function latest($column = 'fechaHora')
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

    public function detalles()
    {
        return $this->hasMany(DetallePago::class, 'idPago', 'idPago');
    }

    public function metodoPago()
    {
        return $this->belongsTo(MetodoPago::class, 'idMetodoPago', 'idMetodoPago');
    }

    public function cajero()
    {
        return $this->belongsTo(User::class, 'idUsuario', 'idUsuario');
    }

    public function mensualidad()
    {
        return $this->hasOneThrough(
            MensualidadFacturacion::class,
            DetallePago::class,
            'idPago',
            'idMensualidad',
            'idPago',
            'idMensualidad'
        );
    }

    public function getIdAttribute(): ?int
    {
        return isset($this->attributes['idPago']) ? (int) $this->attributes['idPago'] : null;
    }

    public function getCodigoReciboAttribute(): ?string
    {
        return $this->attributes['numeroComprobante'] ?? (isset($this->attributes['idPago']) ? "REC-{$this->attributes['idPago']}" : null);
    }

    public function setCodigoReciboAttribute(?string $value): void
    {
        $this->attributes['numeroComprobante'] = $value;
    }

    public function getMontoPagadoAttribute(): ?string
    {
        return isset($this->attributes['montoTotal']) ? (string) $this->attributes['montoTotal'] : null;
    }

    public function setMontoPagadoAttribute($value): void
    {
        $this->attributes['montoTotal'] = $value;
    }

    public function getCajeroUserIdAttribute(): ?int
    {
        return isset($this->attributes['idUsuario']) ? (int) $this->attributes['idUsuario'] : null;
    }

    public function setCajeroUserIdAttribute(?int $value): void
    {
        $this->attributes['idUsuario'] = $value;
    }

    public function getFechaPagoAttribute(): ?string
    {
        return $this->attributes['fechaHora'] ?? null;
    }

    public function setFechaPagoAttribute(?string $value): void
    {
        $this->attributes['fechaHora'] = $value;
    }

    public function getObservacionesAttribute(): ?string
    {
        return $this->attributes['observacion'] ?? null;
    }

    public function setObservacionesAttribute(?string $value): void
    {
        $this->attributes['observacion'] = $value;
    }

    public function getMetodoPagoAttribute(): ?string
    {
        return $this->metodoPago?->nombreMetodo ?? 'EFECTIVO';
    }

    public function setMetodoPagoAttribute(?string $value): void
    {
        if ($value) {
            $metodo = MetodoPago::firstOrCreate(
                ['nombreMetodo' => strtoupper($value)],
                ['descripcion' => 'Método de pago ' . strtoupper($value)]
            );
            $this->attributes['idMetodoPago'] = $metodo->idMetodoPago;
        }
    }

    public function setMensualidadIdAttribute($value): void
    {
        $this->pendingMensualidadId = $value ? (int) $value : null;
    }

    public function getMensualidadIdAttribute(): ?int
    {
        return $this->pendingMensualidadId ?? $this->detalles()->first()?->idMensualidad;
    }

    public function getNumeroTransaccionAttribute(): ?string
    {
        if (!empty($this->attributes['observacion']) && preg_match('/\[Tx:\s*([^\]]+)\]/', $this->attributes['observacion'], $m)) {
            return $m[1];
        }
        return null;
    }

    public function setNumeroTransaccionAttribute(?string $value): void
    {
        if ($value) {
            $current = $this->attributes['observacion'] ?? '';
            $this->attributes['observacion'] = trim("{$current} [Tx: {$value}]");
        }
    }
}
