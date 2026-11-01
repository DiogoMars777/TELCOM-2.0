<?php

namespace App\Models\Paquetes\InstalacionesTecnicas\CU23_RegistrarInstalacion;

use App\Models\Paquetes\GestionClientesZonas\CU05_RegistrarCliente\Cliente;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * Entidad Canónica SolicitudInstalacion (Orden técnica inicial generada al contratar).
 */
class SolicitudInstalacion extends Model
{
    protected $table = 'SolicitudInstalacion';
    protected $primaryKey = 'idSolicitud';
    public $timestamps = false;

    protected $fillable = [
        'idSolicitud',
        'numeroOrden',
        'fechaSolicitud',
        'direccion',
        'referencia',
        'latitud',
        'longitud',
        'estadoSolicitud',
        'observacion',
        'idCliente',
        // alias
        'numero_orden',
        'fecha_solicitud',
        'estado_solicitud',
        'cliente_id',
    ];

    protected $casts = [
        'fechaSolicitud' => 'date',
        'latitud'        => 'float',
        'longitud'       => 'float',
    ];

    protected $appends = [
        'id',
        'numero_orden',
        'fecha_solicitud',
        'estado_solicitud',
        'cliente_id',
    ];

    public function getIdAttribute(): int
    {
        return (int) $this->attributes['idSolicitud'];
    }

    public function getNumeroOrdenAttribute(): ?string
    {
        return $this->attributes['numeroOrden'] ?? null;
    }

    public function setNumeroOrdenAttribute(?string $val): void
    {
        $this->attributes['numeroOrden'] = $val;
    }

    public function getFechaSolicitudAttribute(): ?string
    {
        return $this->attributes['fechaSolicitud'] ?? null;
    }

    public function setFechaSolicitudAttribute(?string $val): void
    {
        $this->attributes['fechaSolicitud'] = $val;
    }

    public function getEstadoSolicitudAttribute(): ?string
    {
        return $this->attributes['estadoSolicitud'] ?? null;
    }

    public function setEstadoSolicitudAttribute(?string $val): void
    {
        $this->attributes['estadoSolicitud'] = $val;
    }

    public function getClienteIdAttribute(): ?int
    {
        return isset($this->attributes['idCliente']) ? (int) $this->attributes['idCliente'] : null;
    }

    public function setClienteIdAttribute(?int $val): void
    {
        $this->attributes['idCliente'] = $val;
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class, 'idCliente', 'idCliente');
    }

    public function instalacion(): HasOne
    {
        return $this->hasOne(Instalacion::class, 'idSolicitud', 'idSolicitud');
    }
}

