<?php

namespace App\Models\Paquetes\P5_EquiposProveedoresInventario\CU25_RegistrarCompraEquipo;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Entidad Canónica EstadoCompra (Estados de orden de compra: COMPLETADO, PENDIENTE, CANCELADO).
 */
class EstadoCompra extends Model
{
    protected $table = 'EstadoCompra';
    protected $primaryKey = 'idEstadoCompra';
    public $timestamps = false;

    protected $fillable = [
        'idEstadoCompra',
        'nombreEstado',
        'descripcion',
        // alias
        'nombre_estado',
    ];

    protected $appends = [
        'id',
        'nombre_estado',
    ];

    public function getIdAttribute(): int
    {
        return (int) $this->attributes['idEstadoCompra'];
    }

    public function getNombreEstadoAttribute(): ?string
    {
        return $this->attributes['nombreEstado'] ?? null;
    }

    public function setNombreEstadoAttribute(?string $val): void
    {
        $this->attributes['nombreEstado'] = $val;
    }

    public function compras(): HasMany
    {
        return $this->hasMany(Compra::class, 'idEstadoCompra', 'idEstadoCompra');
    }
}
