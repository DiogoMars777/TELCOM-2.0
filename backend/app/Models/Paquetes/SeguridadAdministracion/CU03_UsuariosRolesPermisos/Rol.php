<?php

namespace App\Models\Paquetes\SeguridadAdministracion\CU03_UsuariosRolesPermisos;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class Rol extends Model
{
    protected $table = 'Rol';
    protected $primaryKey = 'idRol';
    public $timestamps = false;

    protected $fillable = [
        'idRol',
        'nombre',
        'slug',
        'descripcion',
        'activo',
    ];

    protected $appends = ['id'];

    public function newEloquentBuilder($query)
    {
        return new class($query) extends \Illuminate\Database\Eloquent\Builder {
            public function where($column, $operator = null, $value = null, $boolean = 'and')
            {
                if ($column === 'id') {
                    $column = 'idRol';
                }
                return parent::where($column, $operator, $value, $boolean);
            }

            public function orderBy($column, $direction = 'asc')
            {
                if ($column === 'id') {
                    $column = 'idRol';
                }
                return parent::orderBy($column, $direction);
            }
        };
    }

    public function permisos()
    {
        return $this->belongsToMany(Permiso::class, 'RolPermiso', 'idRol', 'idPermiso');
    }

    public function users()
    {
        return $this->hasMany(User::class, 'idRol', 'idRol');
    }

    public function getIdAttribute(): ?int
    {
        return isset($this->attributes['idRol']) ? (int) $this->attributes['idRol'] : null;
    }
}
