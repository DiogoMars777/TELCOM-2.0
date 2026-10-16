<?php

namespace App\Models\Paquetes\FacturacionCobranza\CU10_GestionarPagoMensualidad;

use Illuminate\Database\Eloquent\Model;

class MetodoPago extends Model
{
    protected $table = 'MetodoPago';
    protected $primaryKey = 'idMetodoPago';
    public $timestamps = false;

    protected $fillable = [
        'idMetodoPago',
        'nombreMetodo',
        'descripcion',
        'estado',
    ];
}
