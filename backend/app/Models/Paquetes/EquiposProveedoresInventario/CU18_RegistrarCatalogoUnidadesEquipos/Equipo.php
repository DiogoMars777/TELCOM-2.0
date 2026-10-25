<?php

namespace App\Models\Paquetes\EquiposProveedoresInventario\CU18_RegistrarCatalogoUnidadesEquipos;

use App\Models\Paquetes\EquiposProveedoresInventario\CU19_AsignarEquipoComodato\AsignacionEquipo;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Equipo extends Model
{
    protected $table = 'Equipo';
    protected $primaryKey = 'idEquipo';
    public $timestamps = false;

    protected $fillable = [
        'numeroSerie',
        'mac',
        'ip',
        'asignada',
        'propiedad',
        'estadoEquipo',
        'idProducto',
    ];

    protected $casts = [
        'asignada' => 'boolean',
    ];

    public function producto(): BelongsTo
    {
        return $this->belongsTo(ProductoEquipo::class, 'idProducto', 'idProducto');
    }

    public function asignaciones(): HasMany
    {
        return $this->hasMany(AsignacionEquipo::class, 'idEquipo', 'idEquipo');
    }
}
