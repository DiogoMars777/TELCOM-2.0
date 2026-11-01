<?php

namespace App\Models\Paquetes\EquiposInventario\CU18_RegistrarCatalogoEquipos;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Entidad Canónica Equipo (Unidad física individual serializada).
 * Representa un ONT, router o equipo físico con número de serie, MAC o IP.
 */
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
        // alias
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

    public function getIdAttribute(): int
    {
        return (int) $this->attributes['idEquipo'];
    }

    public function getNumeroSerieAttribute(): ?string
    {
        return $this->attributes['numeroSerie'] ?? null;
    }

    public function setNumeroSerieAttribute(?string $val): void
    {
        $this->attributes['numeroSerie'] = $val;
    }

    public function getEstadoEquipoAttribute(): ?string
    {
        return $this->attributes['estadoEquipo'] ?? null;
    }

    public function setEstadoEquipoAttribute(?string $val): void
    {
        $this->attributes['estadoEquipo'] = $val;
    }

    public function getProductoIdAttribute(): ?int
    {
        return isset($this->attributes['idProducto']) ? (int) $this->attributes['idProducto'] : null;
    }

    public function setProductoIdAttribute(?int $val): void
    {
        $this->attributes['idProducto'] = $val;
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(ProductoEquipo::class, 'idProducto', 'idProducto');
    }
}

