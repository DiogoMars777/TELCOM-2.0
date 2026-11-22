<?php

namespace App\Models\Paquetes\P5_EquiposProveedoresInventario\CU25_RegistrarCompraEquipo;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Entidad Canónica DetalleCompra (Líneas de detalle de equipos e insumos adquiridos).
 */
class DetalleCompra extends Model
{
    protected $table = 'DetalleCompra';
    protected $primaryKey = 'idDetalleCompra';
    public $timestamps = false;

    protected $fillable = [
        'idDetalleCompra',
        'cantidad',
        'precioUnitario',
        'subtotal',
        'idCompra',
        'idInventario',
        // alias
        'precio_unitario',
        'compra_id',
        'inventario_id',
    ];

    protected $casts = [
        'cantidad'       => 'integer',
        'precioUnitario' => 'decimal:2',
        'subtotal'       => 'decimal:2',
    ];

    protected $appends = [
        'id',
        'precio_unitario',
        'compra_id',
        'inventario_id',
    ];

    public function getIdAttribute(): int
    {
        return (int) $this->attributes['idDetalleCompra'];
    }

    public function getPrecioUnitarioAttribute(): ?string
    {
        return isset($this->attributes['precioUnitario']) ? (string) $this->attributes['precioUnitario'] : '0.00';
    }

    public function getSubtotalAttribute(): ?string
    {
        return isset($this->attributes['subtotal']) ? (string) $this->attributes['subtotal'] : '0.00';
    }

    public function getCompraIdAttribute(): ?int
    {
        return isset($this->attributes['idCompra']) ? (int) $this->attributes['idCompra'] : null;
    }

    public function getInventarioIdAttribute(): ?int
    {
        return isset($this->attributes['idInventario']) ? (int) $this->attributes['idInventario'] : null;
    }

    public function compra(): BelongsTo
    {
        return $this->belongsTo(Compra::class, 'idCompra', 'idCompra');
    }

    public function inventario(): BelongsTo
    {
        return $this->belongsTo(Inventario::class, 'idInventario', 'idInventario');
    }
}
