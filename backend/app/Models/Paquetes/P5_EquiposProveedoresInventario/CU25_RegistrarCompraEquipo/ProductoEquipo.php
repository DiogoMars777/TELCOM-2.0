<?php

namespace App\Models\Paquetes\P5_EquiposProveedoresInventario\CU25_RegistrarCompraEquipo;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * Entidad Canónica ProductoEquipo.
 */
class ProductoEquipo extends Model
{
    protected $table = 'ProductoEquipo';
    protected $primaryKey = 'idProducto';
    public $timestamps = false;

    protected $fillable = [
        'idProducto',
        'nombre',
        'tipoEquipo',
        'marca',
        'modelo',
        'descripcion',
        'estado',
        // alias
        'tipo_equipo',
    ];

    protected $appends = [
        'id',
        'tipo_equipo',
    ];

    public function getIdAttribute(): int
    {
        return (int) $this->attributes['idProducto'];
    }

    public function getTipoEquipoAttribute(): ?string
    {
        return $this->attributes['tipoEquipo'] ?? null;
    }

    public function setTipoEquipoAttribute(?string $val): void
    {
        $this->attributes['tipoEquipo'] = $val;
    }

    public function inventario(): HasOne
    {
        return $this->hasOne(Inventario::class, 'idProducto', 'idProducto');
    }

    public function equipos(): HasMany
    {
        return $this->hasMany(Equipo::class, 'idProducto', 'idProducto');
    }
}
