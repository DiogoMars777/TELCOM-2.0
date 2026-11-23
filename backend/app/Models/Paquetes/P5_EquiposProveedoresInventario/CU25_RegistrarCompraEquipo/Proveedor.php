<?php

namespace App\Models\Paquetes\P5_EquiposProveedoresInventario\CU25_RegistrarCompraEquipo;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Entidad Canónica Proveedor (Importadores y proveedores de hardware).
 */
class Proveedor extends Model
{
    protected $table = 'Proveedor';
    protected $primaryKey = 'idProveedor';
    public $timestamps = false;

    protected $fillable = [
        'idProveedor',
        'razonSocial',
        'nit',
        'telefono',
        'correo',
        'direccion',
        'estado',
        // alias
        'razon_social',
    ];

    protected $casts = [
        'estado' => 'boolean',
    ];

    protected $appends = [
        'id',
        'razon_social',
    ];

    public function getIdAttribute(): int
    {
        return (int) $this->attributes['idProveedor'];
    }

    public function getRazonSocialAttribute(): ?string
    {
        return $this->attributes['razonSocial'] ?? null;
    }

    public function setRazonSocialAttribute(?string $val): void
    {
        $this->attributes['razonSocial'] = $val;
    }

    public function compras(): HasMany
    {
        return $this->hasMany(Compra::class, 'idProveedor', 'idProveedor');
    }
}
