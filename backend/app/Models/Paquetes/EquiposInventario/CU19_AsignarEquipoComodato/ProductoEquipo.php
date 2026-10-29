<?php

namespace App\Models\Paquetes\EquiposInventario\CU19_AsignarEquipoComodato;

use Illuminate\Database\Eloquent\Model;

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
        // alias compatibles
        'tipo_equipo',
    ];

    protected $appends = [
        'id',
        'tipo_equipo',
    ];

    public function inventario()
    {
        return $this->hasOne(Inventario::class, 'idProducto', 'idProducto');
    }

    public function equipos()
    {
        return $this->hasMany(Equipo::class, 'idProducto', 'idProducto');
    }

    public function getIdAttribute(): ?int
    {
        return isset($this->attributes['idProducto']) ? (int) $this->attributes['idProducto'] : null;
    }

    public function getTipoEquipoAttribute(): ?string
    {
        return $this->attributes['tipoEquipo'] ?? null;
    }

    public function setTipoEquipoAttribute(?string $value): void
    {
        $this->attributes['tipoEquipo'] = $value;
    }
}
