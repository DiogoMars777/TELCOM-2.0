<?php

namespace App\Models\Paquetes\EquiposInventario\CU18_RegistrarCatalogoEquipos;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * Entidad Canónica ProductoEquipo (Catálogo de Equipos y Materiales).
 * Representa la definición o modelo técnico de un equipo o insumo.
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
        // alias compatibles snake_case
        'tipo_equipo',
    ];

    protected $appends = [
        'id',
        'tipo_equipo',
    ];

    // Accessors / Mutators para compatibilidad
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

    /**
     * Registro de stock actual en inventario.
     */
    public function inventario(): HasOne
    {
        return $this->hasOne(Inventario::class, 'idProducto', 'idProducto');
    }

    /**
     * Unidades físicas serializadas de este producto.
     */
    public function equipos(): HasMany
    {
        return $this->hasMany(Equipo::class, 'idProducto', 'idProducto');
    }
}

