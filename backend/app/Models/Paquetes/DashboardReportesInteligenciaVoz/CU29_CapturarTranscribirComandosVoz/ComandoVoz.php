<?php

namespace App\Models\Paquetes\DashboardReportesInteligenciaVoz\CU29_CapturarTranscribirComandosVoz;

use App\Models\Paquetes\DashboardReportesInteligenciaVoz\CU27_GenerarExportarReportesTradicionales\ReporteTradicional;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class ComandoVoz extends Model
{
    protected $table = 'ComandoVoz';
    protected $primaryKey = 'idComandoVoz';

    protected $fillable = [
        'idUsuario',
        'textoDictado',
        'intencion',
        'parametros',
        'confianza',
        'estado',
        'duracionSegundos',
    ];

    protected $casts = [
        'parametros'       => 'array',
        'confianza'        => 'float',
        'duracionSegundos' => 'float',
        'created_at'       => 'datetime',
        'updated_at'       => 'datetime',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'idUsuario', 'idUsuario');
    }

    /**
     * Interpreta un texto en lenguaje natural en español y extrae la intención
     * estructurada con parámetros de consulta para TELCOM.
     */
    public static function interpretar(string $texto): array
    {
        $limpio = mb_strtolower(trim($texto), 'UTF-8');

        $intencion = 'CONSULTA_GENERAL';
        $reporteSugerido = null;
        $parametros = [];

        // 1. Detectar Zona
        if (preg_match('/(zona norte|equipetrol|sirari|norte)/i', $limpio)) {
            $zona = \Illuminate\Support\Facades\DB::table('Zona')
                ->where(function ($q) {
                    $q->where('codigo', 'ilike', '%SCZ-NORTE%')
                      ->orWhere('nombreZona', 'ilike', '%Equipetrol%')
                      ->orWhere('codigo', 'ilike', '%NORTE%');
                })
                ->orderBy('idZona', 'asc')
                ->first();
            $parametros['zona_nombre'] = $zona ? $zona->nombreZona : 'Zona Norte - Equipetrol / Sirari';
            $parametros['zona_id'] = $zona ? $zona->idZona : 3;
        } elseif (preg_match('/(zona este|villa 1ro de mayo|plan 3000|este)/i', $limpio)) {
            $zona = \Illuminate\Support\Facades\DB::table('Zona')
                ->where('codigo', 'ilike', '%ESTE%')
                ->orWhere('nombreZona', 'ilike', '%Este%')
                ->first();
            $parametros['zona_nombre'] = $zona ? $zona->nombreZona : 'Zona Este - Villa 1ro de Mayo / Plan 3000';
            $parametros['zona_id'] = $zona ? $zona->idZona : 4;
        } elseif (preg_match('/(zona sur|casco viejo|santos dumont|sur)/i', $limpio)) {
            $zona = \Illuminate\Support\Facades\DB::table('Zona')
                ->where('codigo', 'ilike', '%SUR%')
                ->orWhere('nombreZona', 'ilike', '%Sur%')
                ->first();
            $parametros['zona_nombre'] = $zona ? $zona->nombreZona : 'Zona Sur - Casco Viejo / Santos Dumont';
            $parametros['zona_id'] = $zona ? $zona->idZona : 5;
        }

        // 2. Detectar Rango de Fechas
        $ahora = Carbon::now();
        if (preg_match('/(ultimo mes|último mes|mes pasado)/i', $limpio)) {
            $parametros['fecha_desde'] = $ahora->copy()->subMonth()->startOfMonth()->toDateString();
            $parametros['fecha_hasta'] = $ahora->copy()->subMonth()->endOfMonth()->toDateString();
            $parametros['rango_etiqueta'] = 'Último mes';
        } elseif (preg_match('/(este mes|mes actual)/i', $limpio)) {
            $parametros['fecha_desde'] = $ahora->copy()->startOfMonth()->toDateString();
            $parametros['fecha_hasta'] = $ahora->toDateString();
            $parametros['rango_etiqueta'] = 'Mes actual';
        } elseif (preg_match('/(hoy|del dia|del día)/i', $limpio)) {
            $parametros['fecha_desde'] = $ahora->toDateString();
            $parametros['fecha_hasta'] = $ahora->toDateString();
            $parametros['rango_etiqueta'] = 'Hoy';
        }

        // 3. Detectar Intención del comando
        if (preg_match('/(ingreso|ingresos|pago|pagos|recaudacion|recaudación|cobro|cobros)/i', $limpio)) {
            $intencion = 'REPORTE_INGRESOS';
            $reporteSugerido = ReporteTradicional::TIPO_INGRESOS_PAGOS;

            if (preg_match('/(qr)/i', $limpio)) {
                $parametros['metodo_pago'] = 'QR';
            } elseif (preg_match('/(efectivo)/i', $limpio)) {
                $parametros['metodo_pago'] = 'EFECTIVO';
            } elseif (preg_match('/(transferencia)/i', $limpio)) {
                $parametros['metodo_pago'] = 'TRANSFERENCIA';
            }
        } elseif (preg_match('/(moros|mora|deud|cort|cortes|atrasad)/i', $limpio)) {
            $intencion = 'REPORTE_MOROSIDAD';
            $reporteSugerido = ReporteTradicional::TIPO_MOROSIDAD_CORTES;
        } elseif (preg_match('/(cliente|clientes|abonado|abonados)/i', $limpio)) {
            $intencion = 'REPORTE_CLIENTES';
            $reporteSugerido = ReporteTradicional::TIPO_CLIENTES_ZONA;

            if (preg_match('/(activo|activos)/i', $limpio)) {
                $parametros['estado_cliente'] = 'ACTIVO';
            } elseif (preg_match('/(inactivo|inactivos|baja)/i', $limpio)) {
                $parametros['estado_cliente'] = 'INACTIVO';
            }
        } elseif (preg_match('/(equipo|equipos|comodato|onu|router|modem|instalacion|instalaciones)/i', $limpio)) {
            $intencion = 'REPORTE_EQUIPOS_INSTALACIONES';
            $reporteSugerido = ReporteTradicional::TIPO_EQUIPOS_INSTALACIONES;

            if (preg_match('/(instalacion|instalaciones|tecnico|tecnicos)/i', $limpio)) {
                $parametros['tipo_subreporte'] = 'instalaciones';
            } else {
                $parametros['tipo_subreporte'] = 'comodatos';
            }
        }

        return [
            'intencion'       => $intencion,
            'reporteSugerido' => $reporteSugerido,
            'parametros'      => $parametros,
            'confianza'       => $intencion !== 'CONSULTA_GENERAL' ? 0.98 : 0.75,
            'resumen'         => self::generarResumenInterpretacion($intencion, $parametros, $reporteSugerido),
        ];
    }

    private static function generarResumenInterpretacion(string $intencion, array $params, ?string $reporte): string
    {
        $partes = [];
        if ($reporte) {
            $nombres = [
                ReporteTradicional::TIPO_CLIENTES_ZONA       => 'Clientes por Zona',
                ReporteTradicional::TIPO_INGRESOS_PAGOS      => 'Ingresos y Recaudación',
                ReporteTradicional::TIPO_MOROSIDAD_CORTES    => 'Morosidad y Servicios para Corte',
                ReporteTradicional::TIPO_EQUIPOS_INSTALACIONES => 'Equipos en Comodato e Instalaciones',
            ];
            $partes[] = "Acción: Consultar reporte '{$nombres[$reporte]}'";
        }

        if (! empty($params['zona_nombre'])) {
            $partes[] = "Filtro Zona: {$params['zona_nombre']}";
        }
        if (! empty($params['rango_etiqueta'])) {
            $partes[] = "Período: {$params['rango_etiqueta']}";
        }
        if (! empty($params['metodo_pago'])) {
            $partes[] = "Método: {$params['metodo_pago']}";
        }

        return ! empty($partes)
            ? implode(' | ', $partes)
            : 'Comando transcrito recibido listo para su ejecución manual o búsqueda de información.';
    }
}
