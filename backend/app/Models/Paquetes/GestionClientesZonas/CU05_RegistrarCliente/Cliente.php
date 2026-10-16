<?php

namespace App\Models\Paquetes\GestionClientesZonas\CU05_RegistrarCliente;

use App\Models\Paquetes\GestionClientesZonas\CU04_ZonasCobertura\ZonaCobertura;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Cliente extends Model
{
    use SoftDeletes;

    const DELETED_AT = 'fechaBaja';

    protected $table = 'Cliente';
    protected $primaryKey = 'idCliente';
    public $timestamps = false;

    protected $fillable = [
        'idCliente',
        'codigoCliente',
        'ci',
        'nombreCompleto',
        'telefonoPrincipal',
        'telefonoSecundario',
        'email',
        'fechaRegistro',
        'estadoCliente',
        'idZona',
        'direccion',
        'referenciaUbicacion',
        'coordenadasGPS',
        'correo',
        'fechaBaja',
        'motivoBaja',
        // alias de compatibilidad
        'codigo_cliente',
        'documento_identidad',
        'nombre_completo',
        'nombres',
        'apellidos',
        'telefono',
        'zona_id',
        'estado',
        'fecha_baja',
        'motivo_baja',
    ];

    protected $appends = [
        'id',
        'codigo_cliente',
        'documento_identidad',
        'nombre_completo',
        'nombres',
        'apellidos',
        'telefono',
        'zona_id',
        'estado',
        'email',
    ];

    protected static function booted(): void
    {
        static::creating(function ($cliente) {
            if (empty($cliente->codigoCliente)) {
                $cliente->codigoCliente = 'CLI-' . str_pad((string) (static::max('idCliente') + 1), 5, '0', STR_PAD_LEFT);
            }
            if (empty($cliente->fechaRegistro)) {
                $cliente->fechaRegistro = now();
            }
            if (empty($cliente->ci)) {
                $cliente->ci = $cliente->documento_identidad ?? (string) rand(1000000, 9999999);
            }
            if (empty($cliente->nombreCompleto)) {
                $cliente->nombreCompleto = trim(($cliente->nombres ?? 'Cliente') . ' ' . ($cliente->apellidos ?? 'Demo'));
            }
            if (empty($cliente->telefonoPrincipal)) {
                $cliente->telefonoPrincipal = $cliente->telefono ?? '00000000';
            }
            if (empty($cliente->direccion)) {
                $cliente->direccion = 'Sin dirección';
            }
        });
    }

    public function newEloquentBuilder($query)
    {
        return new class($query) extends \Illuminate\Database\Eloquent\Builder {
            protected function normalizeColumn(string $column): string
            {
                return match ($column) {
                    'id', 'cliente_id' => 'idCliente',
                    'documento_identidad', 'documentoIdentidad' => 'ci',
                    'codigo_cliente' => 'codigoCliente',
                    'telefono' => 'telefonoPrincipal',
                    'zona_id' => 'idZona',
                    'email' => 'correo',
                    'estado' => 'estadoCliente',
                    'motivo_baja' => 'motivoBaja',
                    'fecha_baja' => 'fechaBaja',
                    'nombres', 'apellidos', 'nombre_completo' => 'nombreCompleto',
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

            public function orWhere($column, $operator = null, $value = null)
            {
                if (is_string($column)) {
                    $column = $this->normalizeColumn($column);
                }
                return parent::orWhere($column, $operator, $value);
            }

            public function whereLike($column, $value, $caseSensitive = false)
            {
                if (is_string($column)) {
                    $column = $this->normalizeColumn($column);
                }
                return parent::whereLike($column, $value, $caseSensitive);
            }

            public function orWhereLike($column, $value, $caseSensitive = false)
            {
                if (is_string($column)) {
                    $column = $this->normalizeColumn($column);
                }
                return parent::orWhereLike($column, $value, $caseSensitive);
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

            public function latest($column = 'fechaRegistro')
            {
                if (is_string($column)) {
                    $column = $this->normalizeColumn($column);
                }
                return parent::latest($column);
            }
        };
    }

    public function zona()
    {
        return $this->belongsTo(ZonaCobertura::class, 'idZona', 'idZona');
    }

    public function getEmailAttribute(): ?string
    {
        return $this->attributes['correo'] ?? null;
    }

    public function setEmailAttribute(?string $value): void
    {
        $this->attributes['correo'] = $value;
    }

    public function getTipoDocumentoAttribute(): ?string
    {
        return 'CI';
    }

    public function setTipoDocumentoAttribute(?string $value): void
    {
        // virtual
    }

    public function getIdAttribute(): ?int
    {
        return isset($this->attributes['idCliente']) ? (int) $this->attributes['idCliente'] : null;
    }

    public function getCodigoClienteAttribute(): ?string
    {
        return $this->attributes['codigoCliente'] ?? null;
    }

    public function setCodigoClienteAttribute(?string $value): void
    {
        $this->attributes['codigoCliente'] = $value;
    }

    public function getDocumentoIdentidadAttribute(): ?string
    {
        return $this->attributes['ci'] ?? null;
    }

    public function setDocumentoIdentidadAttribute(?string $value): void
    {
        $this->attributes['ci'] = $value;
    }

    public function getTelefonoAttribute(): ?string
    {
        return $this->attributes['telefonoPrincipal'] ?? null;
    }

    public function setTelefonoAttribute(?string $value): void
    {
        $this->attributes['telefonoPrincipal'] = $value;
    }

    public function getZonaIdAttribute(): ?int
    {
        return isset($this->attributes['idZona']) ? (int) $this->attributes['idZona'] : null;
    }

    public function setZonaIdAttribute(?int $value): void
    {
        $this->attributes['idZona'] = $value;
    }

    public function getEstadoAttribute(): ?string
    {
        return $this->attributes['estadoCliente'] ?? 'ACTIVO';
    }

    public function setEstadoAttribute(?string $value): void
    {
        $this->attributes['estadoCliente'] = $value;
    }

    public function getNombreCompletoAttribute(): ?string
    {
        if (!empty($this->attributes['nombreCompleto'])) {
            return $this->attributes['nombreCompleto'];
        }
        $n = $this->nombres ?? '';
        $a = $this->apellidos ?? '';
        $full = trim("{$n} {$a}");
        return $full !== '' ? $full : ($this->attributes['nombreCompleto'] ?? null);
    }

    public function setNombreCompletoAttribute(?string $value): void
    {
        $this->attributes['nombreCompleto'] = $value;
    }

    public function getNombresAttribute(): ?string
    {
        if (isset($this->attributes['nombres'])) return $this->attributes['nombres'];
        $full = $this->attributes['nombreCompleto'] ?? '';
        $parts = explode(' ', trim($full), 2);
        return $parts[0] ?? '';
    }

    public function setNombresAttribute(?string $value): void
    {
        $this->attributes['nombreCompleto'] = trim(($value ?? '') . ' ' . ($this->apellidos ?? ''));
    }

    public function getApellidosAttribute(): ?string
    {
        if (isset($this->attributes['apellidos'])) return $this->attributes['apellidos'];
        $full = $this->attributes['nombreCompleto'] ?? '';
        $parts = explode(' ', trim($full), 2);
        return $parts[1] ?? '';
    }

    public function setApellidosAttribute(?string $value): void
    {
        $this->attributes['nombreCompleto'] = trim(($this->nombres ?? '') . ' ' . ($value ?? ''));
    }

    public function getMotivoBajaAttribute(): ?string
    {
        return $this->attributes['motivoBaja'] ?? null;
    }

    public function setMotivoBajaAttribute(?string $value): void
    {
        $this->attributes['motivoBaja'] = $value;
    }

    public function getFechaBajaAttribute(): ?string
    {
        return $this->attributes['fechaBaja'] ?? null;
    }

    public function setFechaBajaAttribute($value): void
    {
        $this->attributes['fechaBaja'] = $value;
    }
}
