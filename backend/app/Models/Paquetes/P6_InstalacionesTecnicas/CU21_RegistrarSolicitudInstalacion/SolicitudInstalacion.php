<?php

namespace App\Models\Paquetes\P6_InstalacionesTecnicas\CU21_RegistrarSolicitudInstalacion;

use App\Models\Paquetes\P2_GestionClientesZonas\CU04_ZonasCobertura\Zona;
use App\Models\Paquetes\P2_GestionClientesZonas\CU05_RegistrarCliente\Cliente;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
        // Alias de compatibilidad snake_case
        'numero_orden',
        'fecha_solicitud',
        'estado_solicitud',
        'cliente_id',
    ];

    protected $casts = [
        'latitud'  => 'float',
        'longitud' => 'float',
    ];

    protected $appends = [
        'id',
        'numero_orden',
        'fecha_solicitud',
        'estado_solicitud',
        'cliente_id',
    ];

    public function newEloquentBuilder($query)
    {
        return new class($query) extends Builder {
            protected function normalizeColumn(string $column): string
            {
                return match ($column) {
                    'id', 'solicitud_id' => 'idSolicitud',
                    'numero_orden'       => 'numeroOrden',
                    'fecha_solicitud'    => 'fechaSolicitud',
                    'estado_solicitud'   => 'estadoSolicitud',
                    'cliente_id'         => 'idCliente',
                    default              => $column,
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

    /**
     * Relación con el Cliente solicitante
     */
    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class, 'idCliente', 'idCliente');
    }

    /* =========================================================================
     * Accesores y Mutadores de Compatibilidad
     * ========================================================================= */

    public function getIdAttribute(): ?int
    {
        return isset($this->attributes['idSolicitud']) ? (int) $this->attributes['idSolicitud'] : null;
    }

    public function getNumeroOrdenAttribute(): ?string
    {
        return $this->attributes['numeroOrden'] ?? null;
    }

    public function setNumeroOrdenAttribute(?string $value): void
    {
        $this->attributes['numeroOrden'] = $value;
    }

    public function getFechaSolicitudAttribute(): ?string
    {
        return $this->attributes['fechaSolicitud'] ?? null;
    }

    public function setFechaSolicitudAttribute(?string $value): void
    {
        $this->attributes['fechaSolicitud'] = $value;
    }

    public function getEstadoSolicitudAttribute(): ?string
    {
        return $this->attributes['estadoSolicitud'] ?? 'PENDIENTE';
    }

    public function setEstadoSolicitudAttribute(?string $value): void
    {
        $this->attributes['estadoSolicitud'] = $value;
    }

    public function getClienteIdAttribute(): ?int
    {
        return isset($this->attributes['idCliente']) ? (int) $this->attributes['idCliente'] : null;
    }

    public function setClienteIdAttribute(?int $value): void
    {
        $this->attributes['idCliente'] = $value;
    }
}

