<?php

namespace App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio;

use App\Models\Paquetes\GestionClientesZonas\CU04_ZonasCobertura\ZonaCobertura;
use App\Models\Paquetes\GestionClientesZonas\CU05_RegistrarCliente\Cliente;
use App\Models\Paquetes\FacturacionCobranza\CU09_GenerarMensualidades\MensualidadFacturacion;
use App\Models\Paquetes\ServiciosPlanes\CU17_AsignarCambiarPlanInternet\AsignacionPlan;
use Illuminate\Database\Eloquent\Model;

class ServicioInternet extends Model
{
    protected $table = 'ServicioInternet';
    protected $primaryKey = 'idServicio';
    public $timestamps = false;

    protected $fillable = [
        'idServicio',
        'fechaActivacion',
        'fechaCorteBase',
        'usuarioWinbox',
        'direccion',
        'referencia',
        'latitud',
        'longitud',
        'observacion',
        'idCliente',
        'idEstadoServicio',
        'idZona',
        'codigoServicio',
        'ipAsignada',
        'macRouter',
        'diaCorte',
        // alias de compatibilidad
        'cliente_id',
        'estado_servicio_id',
        'codigo_servicio',
        'direccion_instalacion',
        'fecha_activacion',
        'dia_corte',
        'plan_nombre',
        'velocidad_mbps',
        'precio_mensual',
        'ip_asignada',
        'mac_router',
    ];

    protected $appends = [
        'id',
        'cliente_id',
        'estado_servicio_id',
        'codigo_servicio',
        'direccion_instalacion',
        'fecha_activacion',
        'dia_corte',
        'plan_nombre',
        'velocidad_mbps',
        'precio_mensual',
        'estado_servicio',
        'ip_asignada',
        'mac_router',
    ];

    public function newEloquentBuilder($query)
    {
        return new class($query) extends \Illuminate\Database\Eloquent\Builder {
            protected function normalizeColumn(string $column): string
            {
                return match ($column) {
                    'id', 'servicio_id' => 'idServicio',
                    'cliente_id' => 'idCliente',
                    'estado_servicio_id' => 'idEstadoServicio',
                    'codigo_servicio' => 'codigoServicio',
                    'zona_id' => 'idZona',
                    'dia_corte' => 'diaCorte',
                    'fecha_activacion' => 'fechaActivacion',
                    'direccion_instalacion' => 'direccion',
                    'ip_asignada' => 'ipAsignada',
                    'mac_router' => 'macRouter',
                    'created_at' => 'idServicio',
                    default => $column,
                };
            }

            public function where($column, $operator = null, $value = null, $boolean = 'and')
            {
                if (is_string($column)) {
                    if ($column === 'estado_servicio') {
                        $target = $value ?? $operator;
                        $estadoId = EstadoServicio::where('nombreEstado', $target)->value('idEstadoServicio');
                        $column = 'idEstadoServicio';
                        if ($value !== null) {
                            return parent::where($column, $operator, $estadoId, $boolean);
                        }
                        return parent::where($column, '=', $estadoId, $boolean);
                    }
                    $column = $this->normalizeColumn($column);
                }
                return parent::where($column, $operator, $value, $boolean);
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

            public function latest($column = 'idServicio')
            {
                if (is_string($column)) {
                    $column = $this->normalizeColumn($column);
                }
                return parent::latest($column ?? 'idServicio');
            }

            public function oldest($column = 'idServicio')
            {
                if (is_string($column)) {
                    $column = $this->normalizeColumn($column);
                }
                return parent::oldest($column ?? 'idServicio');
            }
        };
    }

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'idCliente', 'idCliente');
    }

    public function estado()
    {
        return $this->belongsTo(EstadoServicio::class, 'idEstadoServicio', 'idEstadoServicio');
    }

    public function zona()
    {
        return $this->belongsTo(ZonaCobertura::class, 'idZona', 'idZona');
    }

    public function mensualidades()
    {
        return $this->hasMany(MensualidadFacturacion::class, 'idServicio', 'idServicio');
    }

    public function asignacionesPlan()
    {
        return $this->hasMany(AsignacionPlan::class, 'idServicio', 'idServicio');
    }

    public function asignacionPlanActual()
    {
        return $this->hasOne(AsignacionPlan::class, 'idServicio', 'idServicio')->whereNull('fechaFin');
    }

    public function getIdAttribute(): ?int
    {
        return isset($this->attributes['idServicio']) ? (int) $this->attributes['idServicio'] : null;
    }

    public function getClienteIdAttribute(): ?int
    {
        return isset($this->attributes['idCliente']) ? (int) $this->attributes['idCliente'] : null;
    }

    public function setClienteIdAttribute(?int $value): void
    {
        $this->attributes['idCliente'] = $value;
    }

    public function getEstadoServicioIdAttribute(): ?int
    {
        return isset($this->attributes['idEstadoServicio']) ? (int) $this->attributes['idEstadoServicio'] : null;
    }

    public function setEstadoServicioIdAttribute(?int $value): void
    {
        $this->attributes['idEstadoServicio'] = $value;
        $this->unsetRelation('estado');
    }

    public function getCodigoServicioAttribute(): ?string
    {
        return $this->attributes['codigoServicio'] ?? "SRV-{$this->idServicio}";
    }

    public function setCodigoServicioAttribute(?string $value): void
    {
        $this->attributes['codigoServicio'] = $value;
    }

    public function getDireccionInstalacionAttribute(): ?string
    {
        return $this->attributes['direccion'] ?? null;
    }

    public function setDireccionInstalacionAttribute(?string $value): void
    {
        $this->attributes['direccion'] = $value;
    }

    public function getFechaActivacionAttribute(): ?string
    {
        return $this->attributes['fechaActivacion'] ?? null;
    }

    public function setFechaActivacionAttribute(?string $value): void
    {
        $this->attributes['fechaActivacion'] = $value;
    }

    public function getDiaCorteAttribute(): int
    {
        return isset($this->attributes['diaCorte']) ? (int) $this->attributes['diaCorte'] : 10;
    }

    public function setDiaCorteAttribute($value): void
    {
        $this->attributes['diaCorte'] = (int) $value;
    }

    public function getEstadoServicioAttribute(): string
    {
        if (isset($this->attributes['idEstadoServicio'])) {
            $nombre = EstadoServicio::where('idEstadoServicio', $this->attributes['idEstadoServicio'])->value('nombreEstado');
            if ($nombre) {
                return $nombre;
            }
        }
        return $this->estado?->nombreEstado ?? 'ACTIVO';
    }

    public function setEstadoServicioAttribute(?string $value): void
    {
        if ($value) {
            $estadoId = EstadoServicio::where('nombreEstado', $value)->value('idEstadoServicio');
            if ($estadoId) {
                $this->attributes['idEstadoServicio'] = $estadoId;
                $this->unsetRelation('estado');
            }
        }
    }

    public function getIpAsignadaAttribute(): ?string
    {
        return $this->attributes['ipAsignada'] ?? null;
    }

    public function setIpAsignadaAttribute(?string $value): void
    {
        $this->attributes['ipAsignada'] = $value;
    }

    public function getMacRouterAttribute(): ?string
    {
        return $this->attributes['macRouter'] ?? null;
    }

    public function setMacRouterAttribute(?string $value): void
    {
        $this->attributes['macRouter'] = $value;
    }

    public function getPlanNombreAttribute(): ?string
    {
        return $this->asignacionPlanActual?->plan?->nombrePlan ?? null;
    }

    public function setPlanNombreAttribute(?string $value): void
    {
        // virtual
    }

    public function getVelocidadMbpsAttribute(): ?int
    {
        $val = $this->asignacionPlanActual?->plan?->velocidadMbps ?? null;
        return $val !== null ? (int) $val : null;
    }

    public function setVelocidadMbpsAttribute($value): void
    {
        // virtual
    }

    public function getPrecioMensualAttribute(): ?string
    {
        $val = $this->asignacionPlanActual?->precioAplicado ?? $this->asignacionPlanActual?->plan?->precioMensual ?? null;
        if ($val !== null && is_numeric($val)) {
            return number_format((float) $val, 2, '.', '');
        }
        return $val !== null ? (string) $val : null;
    }

    public function setPrecioMensualAttribute($value): void
    {
        // virtual
    }

    public function getFechaInstalacionAttribute(): ?string
    {
        return $this->attributes['fechaActivacion'] ?? null;
    }

    public function setFechaInstalacionAttribute(?string $value): void
    {
        if (empty($this->attributes['fechaActivacion'])) {
            $this->attributes['fechaActivacion'] = $value;
        }
    }
}
