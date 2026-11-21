<?php

namespace App\Models\Paquetes\P5_EquiposProveedoresInventario\CU24_GestionarProveedores;

use Illuminate\Database\Eloquent\Model;

class Proveedor extends Model
{
    protected $table = 'Proveedor';
    protected $primaryKey = 'idProveedor';
    public $timestamps = false;

    protected $fillable = [
        'razonSocial',
        'nit',
        'telefono',
        'correo',
        'direccion',
        'estado',
    ];

    protected $casts = [
        'estado' => 'boolean',
    ];
}
