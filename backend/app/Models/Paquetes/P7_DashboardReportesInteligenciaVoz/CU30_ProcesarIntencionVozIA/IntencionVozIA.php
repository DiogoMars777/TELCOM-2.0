<?php

namespace App\Models\Paquetes\P7_DashboardReportesInteligenciaVoz\CU30_ProcesarIntencionVozIA;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class IntencionVozIA extends Model
{
    protected $table = 'IntencionVozIA';
    protected $primaryKey = 'idIntencion';
    public $timestamps = true;

    protected $fillable = [
        'idIntencion',
        'idUsuario',
        'textoEntrada',
        'intencionCanonica',
        'categoria',
        'confianza',
        'motor',
        'entidadesExtraidas',
        'accionSugerida',
        'respuestaAsistente',
        'datosEnVivo',
        'estado',
        'tiempoProcesamientoMs',
    ];

    protected $casts = [
        'confianza'             => 'float',
        'entidadesExtraidas'    => 'array',
        'accionSugerida'        => 'array',
        'datosEnVivo'           => 'array',
        'tiempoProcesamientoMs' => 'integer',
        'created_at'            => 'datetime',
        'updated_at'            => 'datetime',
    ];

    protected $appends = [
        'id',
        'texto_entrada',
        'intencion_canonica',
        'entidades_extraidas',
        'accion_sugerida',
        'respuesta_asistente',
        'datos_en_vivo',
        'tiempo_procesamiento_ms',
    ];

    public function getIdAttribute(): ?int
    {
        return isset($this->attributes['idIntencion']) ? (int) $this->attributes['idIntencion'] : null;
    }

    public function getTextoEntradaAttribute(): ?string
    {
        return $this->attributes['textoEntrada'] ?? null;
    }

    public function getIntencionCanonicaAttribute(): ?string
    {
        return $this->attributes['intencionCanonica'] ?? null;
    }

    public function getEntidadesExtraidasAttribute(): ?array
    {
        return is_string($this->attributes['entidadesExtraidas'] ?? null)
            ? json_decode($this->attributes['entidadesExtraidas'], true)
            : ($this->attributes['entidadesExtraidas'] ?? []);
    }

    public function getAccionSugeridaAttribute(): ?array
    {
        return is_string($this->attributes['accionSugerida'] ?? null)
            ? json_decode($this->attributes['accionSugerida'], true)
            : ($this->attributes['accionSugerida'] ?? []);
    }

    public function getRespuestaAsistenteAttribute(): ?string
    {
        return $this->attributes['respuestaAsistente'] ?? null;
    }

    public function getDatosEnVivoAttribute(): ?array
    {
        return is_string($this->attributes['datosEnVivo'] ?? null)
            ? json_decode($this->attributes['datosEnVivo'], true)
            : ($this->attributes['datosEnVivo'] ?? null);
    }

    public function getTiempoProcesamientoMsAttribute(): ?int
    {
        return isset($this->attributes['tiempoProcesamientoMs'])
            ? (int) $this->attributes['tiempoProcesamientoMs']
            : 0;
    }

    public function usuario()
    {
        return $this->belongsTo(User::class, 'idUsuario', 'idUsuario');
    }
}
