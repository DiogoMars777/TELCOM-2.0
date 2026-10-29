<?php

namespace App\Models\Paquetes\EquiposInventario\CU19_AsignarEquipoComodato;

use App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio\ServicioInternet;
use Illuminate\Database\Eloquent\Model;

class AsignacionEquipo extends Model
{
    protected $table = 'AsignacionEquipo';
    protected $primaryKey = 'idAsignacionEquipo';
    public $timestamps = false;

    protected $fillable = [
        'idAsignacionEquipo',
        'fechaAsignacion',
        'fechaRetiro',
        'motivoRetiro',
        'idEquipo',
        'idServicio',
        // alias compatibles
        'id',
        'fecha_asignacion',
        'fecha_retiro',
        'motivo_retiro',
        'equipo_id',
        'servicio_id',
    ];

    protected $appends = [
        'id',
        'fecha_asignacion',
        'fecha_retiro',
        'motivo_retiro',
        'equipo_id',
        'servicio_id',
        'es_vigente',
    ];

    public function equipo()
    {
        return $this->belongsTo(Equipo::class, 'idEquipo', 'idEquipo');
    }

    public function servicio()
    {
        return $this->belongsTo(ServicioInternet::class, 'idServicio', 'idServicio');
    }

    public function getIdAttribute(): ?int
    {
        return isset($this->attributes['idAsignacionEquipo']) ? (int) $this->attributes['idAsignacionEquipo'] : null;
    }

    public function getFechaAsignacionAttribute(): ?string
    {
        return $this->attributes['fechaAsignacion'] ?? null;
    }

    public function setFechaAsignacionAttribute(?string $value): void
    {
        $this->attributes['fechaAsignacion'] = $value;
    }

    public function getFechaRetiroAttribute(): ?string
    {
        return $this->attributes['fechaRetiro'] ?? null;
    }

    public function setFechaRetiroAttribute(?string $value): void
    {
        $this->attributes['fechaRetiro'] = $value;
    }

    public function getMotivoRetiroAttribute(): ?string
    {
        return $this->attributes['motivoRetiro'] ?? null;
    }

    public function setMotivoRetiroAttribute(?string $value): void
    {
        $this->attributes['motivoRetiro'] = $value;
    }

    public function getEquipoIdAttribute(): ?int
    {
        return isset($this->attributes['idEquipo']) ? (int) $this->attributes['idEquipo'] : null;
    }

    public function setEquipoIdAttribute(?int $value): void
    {
        $this->attributes['idEquipo'] = $value;
    }

    public function getServicioIdAttribute(): ?int
    {
        return isset($this->attributes['idServicio']) ? (int) $this->attributes['idServicio'] : null;
    }

    public function setServicioIdAttribute(?int $value): void
    {
        $this->attributes['idServicio'] = $value;
    }

    public function getEsVigenteAttribute(): bool
    {
        return empty($this->attributes['fechaRetiro']);
    }
}
