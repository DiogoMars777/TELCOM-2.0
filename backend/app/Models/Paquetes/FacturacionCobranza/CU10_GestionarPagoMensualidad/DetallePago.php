<?php

namespace App\Models\Paquetes\FacturacionCobranza\CU10_GestionarPagoMensualidad;

use App\Models\Paquetes\FacturacionCobranza\CU09_GenerarMensualidades\MensualidadFacturacion;
use Illuminate\Database\Eloquent\Model;

class DetallePago extends Model
{
    protected $table = 'DetallePago';
    protected $primaryKey = 'idDetallePago';
    public $timestamps = false;

    protected $fillable = [
        'idDetallePago',
        'subtotal',
        'montoAplicado',
        'idPago',
        'idMensualidad',
        // alias
        'monto_pagado',
        'pago_id',
        'mensualidad_id',
    ];

    protected $appends = ['id', 'pago_id', 'mensualidad_id', 'monto_pagado'];

    public function pago()
    {
        return $this->belongsTo(PagoMensualidad::class, 'idPago', 'idPago');
    }

    public function mensualidad()
    {
        return $this->belongsTo(MensualidadFacturacion::class, 'idMensualidad', 'idMensualidad');
    }

    public function getIdAttribute(): ?int
    {
        return isset($this->attributes['idDetallePago']) ? (int) $this->attributes['idDetallePago'] : null;
    }

    public function getPagoIdAttribute(): ?int
    {
        return isset($this->attributes['idPago']) ? (int) $this->attributes['idPago'] : null;
    }

    public function setPagoIdAttribute(?int $value): void
    {
        $this->attributes['idPago'] = $value;
    }

    public function getMensualidadIdAttribute(): ?int
    {
        return isset($this->attributes['idMensualidad']) ? (int) $this->attributes['idMensualidad'] : null;
    }

    public function setMensualidadIdAttribute(?int $value): void
    {
        $this->attributes['idMensualidad'] = $value;
    }

    public function getMontoPagadoAttribute(): ?string
    {
        $val = $this->attributes['subtotal'] ?? $this->attributes['montoAplicado'] ?? null;
        return $val !== null ? (string) $val : null;
    }

    public function setMontoPagadoAttribute($value): void
    {
        $this->attributes['subtotal'] = $value;
        $this->attributes['montoAplicado'] = $value;
    }

    public function setSubtotalAttribute($value): void
    {
        $this->attributes['subtotal'] = $value;
        $this->attributes['montoAplicado'] = $value;
    }
}
