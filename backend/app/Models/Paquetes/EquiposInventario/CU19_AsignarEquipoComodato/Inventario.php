<?php

namespace App\Models\Paquetes\EquiposInventario\CU19_AsignarEquipoComodato;

use Illuminate\Database\Eloquent\Model;

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

    protected $appends = [
        'id',
        'stock_actual',
        'producto_id',
    ];

    public function producto()
    {
        return $this->belongsTo(ProductoEquipo::class, 'idProducto', 'idProducto');
    }

    public function getIdAttribute(): ?int
    {
        return isset($this->attributes['idInventario']) ? (int) $this->attributes['idInventario'] : null;
    }

    public function getStockActualAttribute(): int
    {
        return isset($this->attributes['stockActual']) ? (int) $this->attributes['stockActual'] : 0;
    }

    public function setStockActualAttribute($value): void
    {
        $this->attributes['stockActual'] = (int) $value;
    }

    public function getProductoIdAttribute(): ?int
    {
        return isset($this->attributes['idProducto']) ? (int) $this->attributes['idProducto'] : null;
    }

    public function setProductoIdAttribute(?int $value): void
    {
        $this->attributes['idProducto'] = $value;
    }
}
