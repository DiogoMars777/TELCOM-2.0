<?php

namespace App\Models\Paquetes\EquiposInventario\CU18_RegistrarCatalogoEquipos;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Entidad Canónica Inventario.
 * Control de existencias físicas para cada producto del catálogo.
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
        'stockActual' => 'integer',
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

    public function setProductoIdAttribute(?int $val): void
    {
        $this->attributes['idProducto'] = $val;
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(ProductoEquipo::class, 'idProducto', 'idProducto');
    }
}

