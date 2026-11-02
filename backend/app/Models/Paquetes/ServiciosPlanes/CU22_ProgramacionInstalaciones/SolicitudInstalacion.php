<?php

namespace App\Models\Paquetes\ServiciosPlanes\CU22_ProgramacionInstalaciones;

use App\Models\Paquetes\GestionClientesZonas\CU05_RegistrarCliente\Cliente;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

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
                    'numero_orden' => 'numeroOrden',
                    'fecha_solicitud' => 'fechaSolicitud',
                    'estado_solicitud' => 'estadoSolicitud',
                    'cliente_id' => 'idCliente',
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

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'idCliente', 'idCliente');
    }

    public function instalacion()
    {
        return $this->hasOne(Instalacion::class, 'idSolicitud', 'idSolicitud');
    }

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
        return $this->attributes['estadoSolicitud'] ?? null;
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
