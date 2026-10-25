<?php

namespace App\Models\Paquetes\EquiposProveedoresInventario\CU18_RegistrarCatalogoUnidadesEquipos;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductoEquipo extends Model
{
    protected $table = 'ProductoEquipo';
    protected $primaryKey = 'idProducto';
    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'tipoEquipo',
        'marca',
        'modelo',
        'descripcion',
        'estado',
    ];

    public function equipos(): HasMany
    {
        return $this->hasMany(Equipo::class, 'idProducto', 'idProducto');
    }
}
