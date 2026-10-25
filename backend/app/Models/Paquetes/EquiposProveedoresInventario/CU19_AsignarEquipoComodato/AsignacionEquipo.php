<?php

namespace App\Models\Paquetes\EquiposProveedoresInventario\CU19_AsignarEquipoComodato;

use App\Models\Paquetes\EquiposProveedoresInventario\CU18_RegistrarCatalogoUnidadesEquipos\Equipo;
use App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio\ServicioInternet;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AsignacionEquipo extends Model
{
    protected $table = 'AsignacionEquipo';
    protected $primaryKey = 'idAsignacionEquipo';
    protected $dateFormat = 'Y-m-d';
    public $timestamps = false;

    protected $fillable = [
        'fechaAsignacion',
        'fechaRetiro',
        'motivoRetiro',
        'idEquipo',
        'idServicio',
    ];

    protected $casts = [
        'fechaAsignacion' => 'date:Y-m-d',
        'fechaRetiro' => 'date:Y-m-d',
    ];

    public function equipo(): BelongsTo
    {
        return $this->belongsTo(Equipo::class, 'idEquipo', 'idEquipo');
    }

    public function servicio(): BelongsTo
    {
        return $this->belongsTo(ServicioInternet::class, 'idServicio', 'idServicio');
    }
}
