<?php

namespace App\Services\Paquetes\P7_DashboardReportesInteligenciaVoz\CU31_GenerarReporteInteligenteVoz;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/** Contrato compartido por el adaptador textual y la futura entrada de CU30. */
class IntencionReporte
{
    public const CATALOGO = [
        'clientes_por_zona' => [
            'titulo' => 'Clientes por zona',
            'filtros' => ['estado', 'zona_id'],
            'estados' => ['ACTIVO', 'INACTIVO'],
        ],
        'servicios_por_estado' => [
            'titulo' => 'Servicios por estado',
            'filtros' => ['estado', 'zona_id'],
            'estados' => ['ACTIVO', 'PENDIENTE_INSTALACION', 'SUSPENDIDO', 'CORTADO'],
        ],
        'ingresos_por_periodo' => [
            'titulo' => 'Ingresos por período',
            'filtros' => ['periodo', 'fecha_desde', 'fecha_hasta'],
        ],
        'mensualidades_por_estado' => [
            'titulo' => 'Mensualidades por estado',
            'filtros' => ['estado', 'periodo'],
            'estados' => ['PENDIENTE', 'PAGADO'],
        ],
        'inventario_disponible' => [
            'titulo' => 'Inventario disponible',
            'filtros' => ['producto_id'],
        ],
        'instalaciones_por_estado_o_periodo' => [
            'titulo' => 'Instalaciones por estado o período',
            'filtros' => ['estado', 'periodo', 'fecha_desde', 'fecha_hasta', 'fecha_campo'],
            'estados' => ['PROGRAMADA', 'ASIGNADA', 'FINALIZADA', 'FINALIZADO'],
        ],
        'proveedores_por_estado' => [
            'titulo' => 'Proveedores por estado',
            'filtros' => ['estado'],
            'estados' => ['ACTIVO', 'INACTIVO'],
        ],
    ];

    /** Rechaza campos ajenos al contrato, tanto del cliente como del modelo. */
    public function validar(array $entrada): array
    {
        $validada = Validator::make(['intencion' => $entrada], [
            'intencion' => ['required', 'array:tipo,filtros'],
            'intencion.tipo' => ['required', 'string', Rule::in(array_keys(self::CATALOGO))],
            'intencion.filtros' => ['sometimes', 'array'],
        ], [
            'intencion.tipo.in' => 'La intención no corresponde a un reporte permitido.',
            'intencion.tipo.required' => 'La intención debe indicar un tipo de reporte.',
            'intencion.tipo.string' => 'El tipo de reporte debe ser texto.',
            'intencion.array' => 'La intención solo admite tipo y filtros.',
            'intencion.filtros.array' => 'Los filtros deben ser un objeto.',
        ])->validate()['intencion'];

        $tipo = $validada['tipo'];
        $definicion = self::CATALOGO[$tipo];
        $filtros = $validada['filtros'] ?? [];
        $reglas = [
            'filtros' => ['array:'.implode(',', $definicion['filtros'])],
        ];
        foreach ($definicion['filtros'] as $campo) {
            $reglas['filtros.'.$campo] = match ($campo) {
                'estado' => ['sometimes', 'required', 'string', Rule::in($definicion['estados'])],
                'zona_id' => ['sometimes', 'required', 'integer', 'min:1', 'exists:Zona,idZona'],
                'producto_id' => ['sometimes', 'required', 'integer', 'min:1', 'exists:ProductoEquipo,idProducto'],
                'periodo' => ['sometimes', 'required', 'string', 'regex:/^(?:(?:19|20|21)\d{2}-(?:0[1-9]|1[0-2])|este_mes|mes_anterior'.($tipo === 'mensualidades_por_estado' ? '' : '|este_anio').')$/'],
                'fecha_desde', 'fecha_hasta' => ['sometimes', 'required', 'string', 'date_format:Y-m-d', 'regex:/^(?:19|20|21)\d{2}-/'],
                'fecha_campo' => ['sometimes', 'required', Rule::in(['realizada', 'programada'])],
            };
        }
        Validator::make(['filtros' => $filtros], $reglas, [
            'filtros.array' => 'El reporte contiene filtros no permitidos.',
            'in' => 'El valor del filtro no está permitido.',
            'required' => 'El filtro indicado no puede estar vacío.',
            'string' => 'El filtro indicado debe ser texto.',
            'integer' => 'El identificador del filtro debe ser un número entero.',
            'min' => 'El identificador del filtro debe ser positivo.',
            'exists' => 'El identificador del filtro no existe en el sistema.',
            'date_format' => 'La fecha debe ser válida y usar el formato YYYY-MM-DD.',
            'regex' => 'Usa un período YYYY-MM, este_mes, mes_anterior o este_anio cuando corresponda.',
        ])->validate();

        foreach (['zona_id', 'producto_id'] as $id) {
            if (isset($filtros[$id])) {
                $filtros[$id] = (int) $filtros[$id];
            }
        }
        if ($tipo === 'mensualidades_por_estado' && isset($filtros['periodo'])) {
            $filtros['periodo'] = $this->mes($filtros['periodo'])->format('Y-m');
        }
        if (in_array($tipo, ['ingresos_por_periodo', 'instalaciones_por_estado_o_periodo'], true)) {
            $filtros = $this->normalizarFechas($filtros, $tipo === 'ingresos_por_periodo');
        }
        if ($tipo === 'instalaciones_por_estado_o_periodo') {
            if (($filtros['estado'] ?? null) === 'FINALIZADO') {
                $filtros['estado'] = 'FINALIZADA';
            }
            $filtros['fecha_campo'] ??= ($filtros['estado'] ?? null) === 'FINALIZADA' ? 'realizada' : 'programada';
        }

        return ['tipo' => $tipo, 'filtros' => $filtros];
    }

    private function mes(string $periodo): CarbonImmutable
    {
        $hoy = CarbonImmutable::now(config('app.timezone'));

        return match ($periodo) {
            'este_mes' => $hoy->startOfMonth(),
            'mes_anterior' => $hoy->startOfMonth()->subMonth(),
            default => CarbonImmutable::createFromFormat('!Y-m', $periodo, config('app.timezone')),
        };
    }

    private function normalizarFechas(array $filtros, bool $porDefecto): array
    {
        $tieneFechas = isset($filtros['fecha_desde']) || isset($filtros['fecha_hasta']);
        if (isset($filtros['periodo']) && $tieneFechas) {
            throw ValidationException::withMessages(['filtros.periodo' => 'Usa un período o un rango de fechas, sin combinarlos.']);
        }
        if ($porDefecto && ! $tieneFechas && ! isset($filtros['periodo'])) {
            $filtros['periodo'] = 'este_mes';
        }
        if (isset($filtros['periodo'])) {
            $esAnio = $filtros['periodo'] === 'este_anio';
            $desde = $esAnio ? CarbonImmutable::now(config('app.timezone'))->startOfYear() : $this->mes($filtros['periodo']);
            $hasta = $esAnio ? $desde->endOfYear() : $desde->endOfMonth();
            unset($filtros['periodo']);
            $filtros['fecha_desde'] = $desde->toDateString();
            $filtros['fecha_hasta'] = $hasta->toDateString();
        }
        if (isset($filtros['fecha_desde']) || isset($filtros['fecha_hasta'])) {
            if (! isset($filtros['fecha_desde'], $filtros['fecha_hasta'])) {
                throw ValidationException::withMessages(['filtros.fechas' => 'Indica fecha_desde y fecha_hasta.']);
            }
            $desde = CarbonImmutable::parse($filtros['fecha_desde']);
            $hasta = CarbonImmutable::parse($filtros['fecha_hasta']);
            if ($desde->greaterThan($hasta) || $desde->diffInDays($hasta) > 366) {
                throw ValidationException::withMessages(['filtros.fechas' => 'El rango debe estar ordenado y abarcar como máximo 366 días.']);
            }
        }

        return $filtros;
    }
}
