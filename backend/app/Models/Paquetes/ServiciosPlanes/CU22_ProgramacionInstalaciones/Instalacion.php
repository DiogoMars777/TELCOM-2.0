<?php

namespace App\Models\Paquetes\ServiciosPlanes\CU22_ProgramacionInstalaciones;

use App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio\ServicioInternet;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Instalacion extends Model
{
    protected $table = 'Instalacion';
    protected $primaryKey = 'idInstalacion';
    public $timestamps = false;

    protected $fillable = [
        'idInstalacion',
        'fechaProgramada',
        'horaProgramada',
        'fechaRealizada',
        'costoInstalacion',
        'estadoInstalacion',
        'observacion',
        'idSolicitud',
        'idServicio',
        'idTecnico',
        // alias
        'instalacion_id',
        'fecha_programada',
        'hora_programada',
        'fecha_realizada',
        'costo_instalacion',
        'estado_instalacion',
        'observaciones',
        'solicitud_id',
        'servicio_id',
        'tecnico_id',
    ];

    protected $appends = [
        'id',
        'fecha_programada',
        'hora_programada',
        'fecha_realizada',
        'costo_instalacion',
        'estado_instalacion',
        'observaciones',
        'solicitud_id',
        'servicio_id',
        'tecnico_id',
    ];

    public function newEloquentBuilder($query)
    {
        return new class($query) extends Builder {
            protected function normalizeColumn(string $column): string
            {
                return match ($column) {
                    'id', 'instalacion_id' => 'idInstalacion',
                    'fecha_programada' => 'fechaProgramada',
                    'hora_programada' => 'horaProgramada',
                    'fecha_realizada' => 'fechaRealizada',
                    'costo_instalacion' => 'costoInstalacion',
                    'estado_instalacion' => 'estadoInstalacion',
                    'observaciones' => 'observacion',
                    'solicitud_id' => 'idSolicitud',
                    'servicio_id' => 'idServicio',
                    'tecnico_id' => 'idTecnico',
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

            public function orderBy($column, $direction = 'asc')
            {
                if (is_string($column)) {
                    $column = $this->normalizeColumn($column);
                }
                return parent::orderBy($column, $direction);
            }
        };
    }

    public function solicitud()
    {
        return $this->belongsTo(SolicitudInstalacion::class, 'idSolicitud', 'idSolicitud');
    }

    public function tecnico()
    {
        return $this->belongsTo(Tecnico::class, 'idTecnico', 'idTecnico');
    }

    public function servicio()
    {
        return $this->belongsTo(ServicioInternet::class, 'idServicio', 'idServicio');
    }

    public function getIdAttribute(): ?int
    {
        return isset($this->attributes['idInstalacion']) ? (int) $this->attributes['idInstalacion'] : null;
    }

    public function getFechaProgramadaAttribute(): ?string
    {
        return $this->attributes['fechaProgramada'] ?? null;
    }

    public function setFechaProgramadaAttribute(?string $value): void
    {
        $this->attributes['fechaProgramada'] = $value;
    }

    public function getHoraProgramadaAttribute(): ?string
    {
        return $this->attributes['horaProgramada'] ?? null;
    }

    public function setHoraProgramadaAttribute(?string $value): void
    {
        $this->attributes['horaProgramada'] = $value;
    }

    public function getFechaRealizadaAttribute(): ?string
    {
        return $this->attributes['fechaRealizada'] ?? null;
    }

    public function setFechaRealizadaAttribute(?string $value): void
    {
        $this->attributes['fechaRealizada'] = $value;
    }

    public function getCostoInstalacionAttribute(): ?string
    {
        return isset($this->attributes['costoInstalacion'])
            ? number_format((float) $this->attributes['costoInstalacion'], 2, '.', '')
            : '0.00';
    }

    public function setCostoInstalacionAttribute($value): void
    {
        $this->attributes['costoInstalacion'] = $value;
    }

    public function getEstadoInstalacionAttribute(): ?string
    {
        return $this->attributes['estadoInstalacion'] ?? null;
    }

    public function setEstadoInstalacionAttribute(?string $value): void
    {
        $this->attributes['estadoInstalacion'] = $value;
    }

    public function getObservacionesAttribute(): ?string
    {
        return $this->attributes['observacion'] ?? null;
    }

    public function setObservacionesAttribute(?string $value): void
    {
        $this->attributes['observacion'] = $value;
    }

    public function getSolicitudIdAttribute(): ?int
    {
        return isset($this->attributes['idSolicitud']) ? (int) $this->attributes['idSolicitud'] : null;
    }

    public function setSolicitudIdAttribute(?int $value): void
    {
        $this->attributes['idSolicitud'] = $value;
    }

    public function getServicioIdAttribute(): ?int
    {
        return isset($this->attributes['idServicio']) ? (int) $this->attributes['idServicio'] : null;
    }

    public function setServicioIdAttribute(?int $value): void
    {
        $this->attributes['idServicio'] = $value;
    }

    public function getTecnicoIdAttribute(): ?int
    {
        return isset($this->attributes['idTecnico']) ? (int) $this->attributes['idTecnico'] : null;
    }

    public function setTecnicoIdAttribute(?int $value): void
    {
        $this->attributes['idTecnico'] = $value;
    }
}
