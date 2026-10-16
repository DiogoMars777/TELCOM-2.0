<?php

namespace App\Models\Paquetes\SeguridadAdministracion\CU03_UsuariosRolesPermisos;

use Illuminate\Database\Eloquent\Model;

class Permiso extends Model
{
    protected $table = 'Permiso';
    protected $primaryKey = 'idPermiso';
    public $timestamps = false;

    protected $fillable = [
        'idPermiso',
        'nombre',
        'slug',
        'modulo',
        'descripcion',
    ];

    protected $appends = ['id'];

    public function newEloquentBuilder($query)
    {
        return new class($query) extends \Illuminate\Database\Eloquent\Builder {
            public function where($column, $operator = null, $value = null, $boolean = 'and')
            {
                if ($column === 'id' || $column === 'permisos.id') {
                    $column = 'Permiso.idPermiso';
                } elseif (is_string($column) && str_starts_with($column, 'permisos.')) {
                    $column = str_replace('permisos.', 'Permiso.', $column);
                }
                return parent::where($column, $operator, $value, $boolean);
            }

            public function pluck($column, $key = null)
            {
                if ($column === 'id' || $column === 'permisos.id') {
                    $column = 'Permiso.idPermiso';
                } elseif (is_string($column) && str_starts_with($column, 'permisos.')) {
                    $column = str_replace('permisos.', 'Permiso.', $column);
                }
                return parent::pluck($column, $key);
            }

            public function value($column)
            {
                if ($column === 'id' || $column === 'permisos.id') {
                    $column = 'Permiso.idPermiso';
                } elseif (is_string($column) && str_starts_with($column, 'permisos.')) {
                    $column = str_replace('permisos.', 'Permiso.', $column);
                }
                return parent::value($column);
            }
        };
    }

    public function roles()
    {
        return $this->belongsToMany(Rol::class, 'RolPermiso', 'idPermiso', 'idRol');
    }

    public function getIdAttribute(): ?int
    {
        return isset($this->attributes['idPermiso']) ? (int) $this->attributes['idPermiso'] : null;
    }
}
