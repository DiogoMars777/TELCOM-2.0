<?php

namespace App\Models\Paquetes\P5_EquiposProveedoresInventario\CU25_RegistrarCompraEquipo;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Entidad Canónica Compra (Registro cabecera de orden de compra de equipamiento).
 */
class Compra extends Model
{
    protected $table = 'Compra';
    protected $primaryKey = 'idCompra';
    public $timestamps = false;

    protected $fillable = [
        'idCompra',
        'fechaCompra',
        'nroComprobante',
        'montoTotal',
        'observacion',
        'idProveedor',
        'idEstadoCompra',
        // alias
        'fecha_compra',
        'nro_comprobante',
        'monto_total',
        'proveedor_id',
        'estado_compra_id',
    ];

    protected $casts = [
        'fechaCompra' => 'date',
        'montoTotal'  => 'decimal:2',
    ];

    protected $appends = [
        'id',
        'fecha_compra',
        'nro_comprobante',
        'monto_total',
        'proveedor_id',
        'estado_compra_id',
    ];

    public function getIdAttribute(): int
    {
        return (int) $this->attributes['idCompra'];
    }

    public function getFechaCompraAttribute(): ?string
    {
        return $this->attributes['fechaCompra'] ?? null;
    }

    public function getNroComprobanteAttribute(): ?string
    {
        return $this->attributes['nroComprobante'] ?? null;
    }

    public function getMontoTotalAttribute(): ?string
    {
        return isset($this->attributes['montoTotal']) ? (string) $this->attributes['montoTotal'] : '0.00';
    }

    public function getProveedorIdAttribute(): ?int
    {
        return isset($this->attributes['idProveedor']) ? (int) $this->attributes['idProveedor'] : null;
    }

    public function getEstadoCompraIdAttribute(): ?int
    {
        return isset($this->attributes['idEstadoCompra']) ? (int) $this->attributes['idEstadoCompra'] : null;
    }

    public function proveedor(): BelongsTo
    {
        return $this->belongsTo(Proveedor::class, 'idProveedor', 'idProveedor');
    }

    public function estadoCompra(): BelongsTo
    {
        return $this->belongsTo(EstadoCompra::class, 'idEstadoCompra', 'idEstadoCompra');
    }

    public function detalles(): HasMany
    {
        return $this->hasMany(DetalleCompra::class, 'idCompra', 'idCompra');
    }
}
