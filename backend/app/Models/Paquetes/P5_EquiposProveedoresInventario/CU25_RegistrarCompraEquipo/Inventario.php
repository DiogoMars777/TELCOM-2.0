<?php

namespace App\Models\Paquetes\P5_EquiposProveedoresInventario\CU25_RegistrarCompraEquipo;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Entidad Canónica Inventario.
 */
class Inventario extends Model
{
    protected $table = 'Inventario';
    protected $primaryKey = 'idInventario';
    public $timestamps = false;

    protected $fillable = [
        'idInventario',
        'stockActual',
        'fechaActualizacion',
        'idProducto',
        // alias
        'stock_actual',
        'producto_id',
    ];

    protected $casts = [
        'stockActual'        => 'integer',
        'fechaActualizacion' => 'datetime',
    ];

    protected $appends = [
        'id',
        'stock_actual',
        'producto_id',
    ];

    public function getIdAttribute(): int
    {
        return (int) $this->attributes['idInventario'];
    }

    public function getStockActualAttribute(): int
    {
        return (int) ($this->attributes['stockActual'] ?? 0);
    }

    public function setStockActualAttribute(int $val): void
    {
        $this->attributes['stockActual'] = $val;
    }

    public function getProductoIdAttribute(): ?int
    {
        return isset($this->attributes['idProducto']) ? (int) $this->attributes['idProducto'] : null;
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(ProductoEquipo::class, 'idProducto', 'idProducto');
    }

    public function detallesCompra(): HasMany
    {
        return $this->hasMany(DetalleCompra::class, 'idInventario', 'idInventario');
    }
}
