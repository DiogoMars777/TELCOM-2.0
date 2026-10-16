<?php

namespace App\Models\Paquetes\FacturacionCobranza\CU12_VisualizarAlertasVencimiento;

use Illuminate\Database\Eloquent\Model;
use App\Models\Paquetes\FacturacionCobranza\CU09_GenerarMensualidades\MensualidadFacturacion;

class AlertaVencimiento extends Model
{
    protected $table = 'alertas_vencimiento';

    protected $fillable = [
        'mensualidad_id',
        'tipo_alerta', // PROXIMO_VENCER, VENCIDO_HOY, MORA_CRITICA
        'dias_retraso',
        'notificado',
        'fecha_notificacion',
    ];

    protected $casts = [
        'dias_retraso'       => 'integer',
        'notificado'         => 'boolean',
        'fecha_notificacion' => 'datetime',
    ];

    public function mensualidad()
    {
        return $this->belongsTo(MensualidadFacturacion::class, 'mensualidad_id');
    }
}
