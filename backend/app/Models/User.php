<?php

namespace App\Models;

use App\Models\Paquetes\SeguridadAdministracion\CU03_UsuariosRolesPermisos\Rol;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'Usuario';
    protected $primaryKey = 'idUsuario';
    public $timestamps = false;

    protected $fillable = [
        'idUsuario',
        'nombreUsuario',
        'passwordHash',
        'nombreCompleto',
        'telefono',
        'correo',
        'activo',
        'fechaCreacion',
        'idRol',
        // Alias de compatibilidad
        'name',
        'nombre_usuario',
        'email',
        'password',
        'rol_id',
    ];

    protected $hidden = [
        'passwordHash',
        'password',
        'remember_token',
    ];

    protected $appends = [
        'id',
        'name',
        'email',
        'rol_id',
    ];

    protected static function booted(): void
    {
        static::creating(function ($user) {
            if (empty($user->nombreUsuario)) {
                $user->nombreUsuario = $user->correo ?? $user->email ?? ('user_' . uniqid());
            }
            if (empty($user->fechaCreacion)) {
                $user->fechaCreacion = now();
            }
            if (!isset($user->activo)) {
                $user->activo = true;
            }
        });
    }

    public function getCreatedAtColumn()
    {
        return 'fechaCreacion';
    }

    public function newEloquentBuilder($query)
    {
        return new class($query) extends \Illuminate\Database\Eloquent\Builder {
            protected function normalizeColumn(string $column): string
            {
                return match ($column) {
                    'id', 'user_id' => 'idUsuario',
                    'email' => 'correo',
                    'rol_id' => 'idRol',
                    'name', 'nombre' => 'nombreCompleto',
                    'password' => 'passwordHash',
                    'created_at' => 'fechaCreacion',
                    default => $column,
                };
            }

            public function where($column, $operator = null, $value = null, $boolean = 'and')
            {
                if (is_string($column)) {
                    $column = $this->normalizeColumn($column);
                }
                return parent::where($column, $operator, $value, $boolean);
            }

            public function whereIn($column, $values, $boolean = 'and', $not = false)
            {
                if (is_string($column)) {
                    $column = $this->normalizeColumn($column);
                }
                return parent::whereIn($column, $values, $boolean, $not);
            }

            public function whereNotNull($columns, $boolean = 'and')
            {
                if (is_string($columns)) {
                    $columns = $this->normalizeColumn($columns);
                }
                return parent::whereNotNull($columns, $boolean);
            }

            public function latest($column = 'fechaCreacion')
            {
                if (is_string($column)) {
                    $column = $this->normalizeColumn($column);
                }
                return parent::latest($column ?? 'fechaCreacion');
            }

            public function oldest($column = 'fechaCreacion')
            {
                if (is_string($column)) {
                    $column = $this->normalizeColumn($column);
                }
                return parent::oldest($column ?? 'fechaCreacion');
            }

            public function orderBy($column, $direction = 'asc')
            {
                if (is_string($column)) {
                    $column = $this->normalizeColumn($column);
                }
                return parent::orderBy($column, $direction);
            }

            public function orderByDesc($column)
            {
                if (is_string($column)) {
                    $column = $this->normalizeColumn($column);
                }
                return parent::orderBy($column, 'desc');
            }

            public function select($columns = ['*'])
            {
                if (is_array($columns)) {
                    $cols = $columns;
                } else {
                    $cols = func_get_args();
                }
                $normalized = [];
                foreach ($cols as $c) {
                    if (is_string($c)) {
                        $normalized[] = $this->normalizeColumn($c);
                    } else {
                        $normalized[] = $c;
                    }
                }
                return parent::select(array_values(array_unique($normalized)));
            }

            public function addSelect($column)
            {
                $cols = is_array($column) ? $column : func_get_args();
                $normalized = [];
                foreach ($cols as $c) {
                    if (is_string($c)) {
                        $normalized[] = $this->normalizeColumn($c);
                    } else {
                        $normalized[] = $c;
                    }
                }
                return parent::addSelect(array_values(array_unique($normalized)));
            }

            public function pluck($column, $key = null)
            {
                if (is_string($column)) {
                    $column = $this->normalizeColumn($column);
                }
                if (is_string($key)) {
                    $key = $this->normalizeColumn($key);
                }
                return parent::pluck($column, $key);
            }
        };
    }

    public function getAuthIdentifierName(): string
    {
        return 'idUsuario';
    }

    public function getAuthPassword(): string
    {
        return (string) ($this->attributes['passwordHash'] ?? $this->attributes['password'] ?? '');
    }

    // --- Mapeos bidireccionales de atributos ---
    public function getEmailAttribute(): ?string
    {
        return $this->attributes['correo'] ?? null;
    }

    public function setEmailAttribute(?string $value): void
    {
        $this->attributes['correo'] = $value;
    }

    public function getCorreoAttribute(): ?string
    {
        return $this->attributes['correo'] ?? null;
    }

    public function setCorreoAttribute(?string $value): void
    {
        $this->attributes['correo'] = $value;
    }

    public function getPasswordAttribute(): ?string
    {
        return $this->attributes['passwordHash'] ?? null;
    }

    public function setPasswordAttribute(?string $value): void
    {
        if ($value !== null && !str_starts_with($value, '$2y$') && !str_starts_with($value, '$2a$')) {
            $this->attributes['passwordHash'] = \Illuminate\Support\Facades\Hash::make($value);
        } else {
            $this->attributes['passwordHash'] = $value;
        }
    }

    public function setPasswordHashAttribute(?string $value): void
    {
        if ($value !== null && !str_starts_with($value, '$2y$') && !str_starts_with($value, '$2a$')) {
            $this->attributes['passwordHash'] = \Illuminate\Support\Facades\Hash::make($value);
        } else {
            $this->attributes['passwordHash'] = $value;
        }
    }

    public function getNameAttribute(): ?string
    {
        return $this->attributes['nombreCompleto'] ?? $this->attributes['nombreUsuario'] ?? null;
    }

    public function setNameAttribute(?string $value): void
    {
        $this->attributes['nombreCompleto'] = $value;
    }

    public function getNombreUsuarioAttribute(): ?string
    {
        return $this->attributes['nombreUsuario'] ?? null;
    }

    public function setNombreUsuarioAttribute(?string $value): void
    {
        $this->attributes['nombreUsuario'] = $value;
    }

    public function getRolIdAttribute(): ?int
    {
        return isset($this->attributes['idRol']) ? (int) $this->attributes['idRol'] : null;
    }

    public function setRolIdAttribute(?int $value): void
    {
        $this->attributes['idRol'] = $value;
    }

    public function getIdAttribute(): ?int
    {
        return isset($this->attributes['idUsuario']) ? (int) $this->attributes['idUsuario'] : null;
    }

    /**
     * Rol asignado al usuario (UML: Rol [1] -> Usuario [0..*]).
     */
    public function rol(): BelongsTo
    {
        return $this->belongsTo(Rol::class, 'idRol', 'idRol');
    }

    /**
     * Comprueba si el usuario posee un permiso puntual según su rol.
     */
    public function hasPermission(string $slug): bool
    {
        if (! $this->activo) {
            return false;
        }

        $rol = $this->rol;
        if (! $rol || ! $rol->activo) {
            return false;
        }

        return $rol->permisos()
            ->where(function ($q) use ($slug) {
                $q->where('Permiso.slug', $slug)
                  ->orWhere('Permiso.nombre', $slug);
            })
            ->exists();
    }

    /**
     * Slugs de los permisos efectivos del usuario.
     */
    public function permisosSlugs(): array
    {
        if (! $this->activo) {
            return [];
        }

        $rol = $this->rol;
        if (! $rol || ! $rol->activo) {
            return [];
        }

        return $rol->permisos()
            ->pluck('Permiso.slug')
            ->filter()
            ->values()
            ->all();
    }

    protected function casts(): array
    {
        return [
            'activo'        => 'boolean',
            'fechaCreacion' => 'datetime',
            'passwordHash'  => 'hashed',
        ];
    }
}
