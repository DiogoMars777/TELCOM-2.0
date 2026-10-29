<?php

namespace App\Models\Paquetes\EquiposInventario\CU19_AsignarEquipoComodato;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Equipo extends Model
{
    protected $table = 'Equipo';
    protected $primaryKey = 'idEquipo';
    public $timestamps = false;

    protected $fillable = [
        'idEquipo',
        'numeroSerie',
        'mac',
        'ip',
        'asignada',
        'propiedad',
        'estadoEquipo',
        'idProducto',
        // alias compatibles
        'id',
        'numero_serie',
        'estado_equipo',
        'producto_id',
    ];

    protected $casts = [
        'asignada' => 'boolean',
    ];

    protected $appends = [
        'id',
        'numero_serie',
        'estado_equipo',
        'producto_id',
    ];

    public function producto()
    {
        return $this->belongsTo(ProductoEquipo::class, 'idProducto', 'idProducto');
    }

    public function asignaciones()
    {
        return $this->hasMany(AsignacionEquipo::class, 'idEquipo', 'idEquipo');
    }

    public function asignacionActual()
    {
        return $this->hasOne(AsignacionEquipo::class, 'idEquipo', 'idEquipo')->whereNull('fechaRetiro');
    }

    public function scopeDisponibles(Builder $query): Builder
    {
        return $query->where('asignada', false)
            ->where(function ($q) {
                $q->whereIn('estadoEquipo', ['OPERATIVO', 'DISPONIBLE'])
                  ->orWhereNull('estadoEquipo');
            });
    }

    public function scopePorTipo(Builder $query, string $tipo): Builder
    {
        return $query->whereHas('producto', function ($q) use ($tipo) {
            $q->whereRaw('LOWER("tipoEquipo") = ?', [strtolower(trim($tipo))]);
        });
    }

    public function getIdAttribute(): ?int
    {
        return isset($this->attributes['idEquipo']) ? (int) $this->attributes['idEquipo'] : null;
    }

    public function getNumeroSerieAttribute(): ?string
    {
        return $this->attributes['numeroSerie'] ?? null;
    }

    public function setNumeroSerieAttribute(?string $value): void
    {
        $this->attributes['numeroSerie'] = $value;
    }

    public function getEstadoEquipoAttribute(): ?string
    {
        return $this->attributes['estadoEquipo'] ?? null;
    }

    public function setEstadoEquipoAttribute(?string $value): void
    {
        $this->attributes['estadoEquipo'] = $value;
    }

    public function getProductoIdAttribute(): ?int
    {
        return isset($this->attributes['idProducto']) ? (int) $this->attributes['idProducto'] : null;
    }

    public function setProductoIdAttribute(?int $value): void
    {
        $this->attributes['idProducto'] = $value;
    }
}
