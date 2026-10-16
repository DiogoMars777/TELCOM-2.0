<?php

namespace App\Models\Paquetes\SeguridadAdministracion\CU03_UsuariosRolesPermisos;

use Illuminate\Database\Eloquent\Model;

class RolPermiso extends Model
{
    protected $table = 'RolPermiso';
    protected $primaryKey = 'idRolPermiso';
    public $timestamps = false;

    protected $fillable = [
        'idRolPermiso',
        'idRol',
        'idPermiso',
    ];

    public function rol()
    {
        return $this->belongsTo(Rol::class, 'idRol', 'idRol');
    }

    public function permiso()
    {
        return $this->belongsTo(Permiso::class, 'idPermiso', 'idPermiso');
    }
}
