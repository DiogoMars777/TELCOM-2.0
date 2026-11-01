<?php

namespace App\Models\Paquetes\InstalacionesTecnicas\CU23_RegistrarInstalacion;

use App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio\ServicioInternet;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Entidad Canónica Instalacion.
 * Representa la ejecución técnica y física de la conexión en domicilio.
 */
class Instalacion extends Model
{
    protected $table = 'Instalacion';
    protected $primaryKey = 'idInstalacion';
    public $timestamps = false;

    protected $fillable = [
        'idInstalacion',
        'fechaProgramada',
        'fechaRealizada',
        'costoInstalacion',
        'estadoInstalacion',
        'observacion',
        'idSolicitud',
        'idServicio',
        'idTecnico',
        // alias
        'fecha_programada',
        'fecha_realizada',
        'costo_instalacion',
        'estado_instalacion',
        'solicitud_id',
        'servicio_id',
        'tecnico_id',
    ];

    protected $casts = [
        'fechaProgramada'  => 'date',
        'fechaRealizada'   => 'date',
        'costoInstalacion' => 'decimal:2',
    ];

    protected $appends = [
        'id',
        'fecha_programada',
        'fecha_realizada',
        'costo_instalacion',
        'estado_instalacion',
        'solicitud_id',
        'servicio_id',
        'tecnico_id',
    ];

    public function getIdAttribute(): int
    {
        return (int) $this->attributes['idInstalacion'];
    }

    public function getFechaProgramadaAttribute(): ?string
    {
        return $this->attributes['fechaProgramada'] ?? null;
    }

    public function setFechaProgramadaAttribute(?string $val): void
    {
        $this->attributes['fechaProgramada'] = $val;
    }

    public function getFechaRealizadaAttribute(): ?string
    {
        return $this->attributes['fechaRealizada'] ?? null;
    }

    public function setFechaRealizadaAttribute(?string $val): void
    {
        $this->attributes['fechaRealizada'] = $val;
    }

    public function getCostoInstalacionAttribute(): ?string
    {
        return isset($this->attributes['costoInstalacion']) ? (string) $this->attributes['costoInstalacion'] : null;
    }

    public function setCostoInstalacionAttribute($val): void
    {
        $this->attributes['costoInstalacion'] = $val;
    }

    public function getEstadoInstalacionAttribute(): ?string
    {
        return $this->attributes['estadoInstalacion'] ?? null;
    }

    public function setEstadoInstalacionAttribute(?string $val): void
    {
        $this->attributes['estadoInstalacion'] = $val;
    }

    public function getSolicitudIdAttribute(): ?int
    {
        return isset($this->attributes['idSolicitud']) ? (int) $this->attributes['idSolicitud'] : null;
    }

    public function setSolicitudIdAttribute(?int $val): void
    {
        $this->attributes['idSolicitud'] = $val;
    }

    public function getServicioIdAttribute(): ?int
    {
        return isset($this->attributes['idServicio']) ? (int) $this->attributes['idServicio'] : null;
    }

    public function setServicioIdAttribute(?int $val): void
    {
        $this->attributes['idServicio'] = $val;
    }

    public function getTecnicoIdAttribute(): ?int
    {
        return isset($this->attributes['idTecnico']) ? (int) $this->attributes['idTecnico'] : null;
    }

    public function setTecnicoIdAttribute(?int $val): void
    {
        $this->attributes['idTecnico'] = $val;
    }

    public function solicitud(): BelongsTo
    {
        return $this->belongsTo(SolicitudInstalacion::class, 'idSolicitud', 'idSolicitud');
    }

    public function servicio(): BelongsTo
    {
        return $this->belongsTo(ServicioInternet::class, 'idServicio', 'idServicio');
    }

    public function tecnico(): BelongsTo
    {
        return $this->belongsTo(Tecnico::class, 'idTecnico', 'idTecnico');
    }
}

