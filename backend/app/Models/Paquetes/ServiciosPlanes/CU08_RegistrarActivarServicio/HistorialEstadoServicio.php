<?php

namespace App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio;

use Illuminate\Database\Eloquent\Model;

class HistorialEstadoServicio extends Model
{
    protected $table = 'HistorialEstadoServicio';
    protected $primaryKey = 'idHistorialEstado';
    public $timestamps = false;

    protected $fillable = [
        'idHistorialEstado',
        'fechaHora',
        'observacion',
        'idServicio',
        'idEstadoAnterior',
        'idEstadoNuevo',
    ];

    public function servicio()
    {
        return $this->belongsTo(ServicioInternet::class, 'idServicio', 'idServicio');
    }

    public function estadoAnterior()
    {
        return $this->belongsTo(EstadoServicio::class, 'idEstadoAnterior', 'idEstadoServicio');
    }

    public function estadoNuevo()
    {
        return $this->belongsTo(EstadoServicio::class, 'idEstadoNuevo', 'idEstadoServicio');
    }
}
