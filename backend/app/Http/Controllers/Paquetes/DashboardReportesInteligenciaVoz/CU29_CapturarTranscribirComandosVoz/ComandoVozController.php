<?php

namespace App\Http\Controllers\Paquetes\DashboardReportesInteligenciaVoz\CU29_CapturarTranscribirComandosVoz;

use App\Http\Controllers\Controller;
use App\Models\Paquetes\DashboardReportesInteligenciaVoz\CU29_CapturarTranscribirComandosVoz\ComandoVoz;
use App\Support\AuditLogger;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ComandoVozController extends Controller
{
    use ApiResponse;

    /**
     * CU29 - Recibe el texto capturado y transcrito por el motor Speech-to-Text,
     * lo analiza semánticamente, extrae intenciones y parámetros estructurados,
     * y registra la interacción en la bitácora de auditoría.
     */
    public function transcribir(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'texto_dictado'     => ['required', 'string', 'min:2', 'max:500'],
            'duracion_segundos' => ['nullable', 'numeric', 'min:0', 'max:300'],
            'confianza'         => ['nullable', 'numeric', 'min:0', 'max:1'],
        ], [
            'texto_dictado.required' => 'No se detectó texto en el comando de voz. Por favor repita el dictado.',
            'texto_dictado.min'      => 'El comando es demasiado corto o inaudible. Intente pronunciar su solicitud con más claridad.',
        ]);

        $texto = trim($validated['texto_dictado']);
        $interpretacion = ComandoVoz::interpretar($texto);

        $comando = ComandoVoz::create([
            'idUsuario'        => auth()->id(),
            'textoDictado'     => $texto,
            'intencion'        => $interpretacion['intencion'],
            'parametros'       => $interpretacion['parametros'],
            'confianza'        => $validated['confianza'] ?? $interpretacion['confianza'],
            'estado'           => 'TRANSCRITO',
            'duracionSegundos' => $validated['duracion_segundos'] ?? 0,
        ]);

        // Registro de auditoría obligatorio (Paso 9 del CU29)
        AuditLogger::log(
            'CU29',
            'TRANSCRIBIR_VOZ',
            "Comando de voz transcrito y procesado: \"{$texto}\" (Intención: {$interpretacion['intencion']})",
            null,
            [
                'idComando'        => $comando->idComandoVoz,
                'texto'            => $texto,
                'intencion'        => $interpretacion['intencion'],
                'reporteSugerido'  => $interpretacion['reporteSugerido'],
                'parametros'       => $interpretacion['parametros'],
            ]
        );

        return $this->success([
            'idComando'        => $comando->idComandoVoz,
            'textoDictado'     => $texto,
            'intencion'        => $interpretacion['intencion'],
            'reporteSugerido'  => $interpretacion['reporteSugerido'],
            'parametros'       => $interpretacion['parametros'],
            'resumen'          => $interpretacion['resumen'],
            'confianza'        => $comando->confianza,
            'estado'           => $comando->estado,
            'fechaHora'        => $comando->created_at?->toDateTimeString(),
        ], 'Comando de voz capturado y transcrito correctamente.');
    }

    /**
     * CU29 - Historial de comandos de voz dictados por el usuario.
     */
    public function historial(Request $request): JsonResponse
    {
        $historial = ComandoVoz::query()
            ->with('usuario:idUsuario,nombreCompleto,nombreUsuario')
            ->orderByDesc('created_at')
            ->take(15)
            ->get()
            ->map(function ($c) {
                return [
                    'id'              => $c->idComandoVoz,
                    'texto'           => $c->textoDictado,
                    'intencion'       => $c->intencion,
                    'parametros'      => $c->parametros,
                    'estado'          => $c->estado,
                    'confianza'       => $c->confianza,
                    'duracion'        => $c->duracionSegundos,
                    'fechaHora'       => $c->created_at?->format('d/m/Y H:i'),
                    'usuario'         => $c->usuario?->nombreCompleto ?? 'Usuario',
                ];
            });

        return $this->success($historial, 'Historial de comandos de voz obtenido.');
    }

    /**
     * CU29 - Confirmar la ejecución del comando tras revisión/ajuste del usuario (Paso 8).
     */
    public function confirmar(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id_comando'     => ['nullable', 'integer'],
            'texto_ajustado' => ['nullable', 'string', 'max:500'],
        ]);

        $comando = null;
        if (! empty($validated['id_comando'])) {
            $comando = ComandoVoz::find($validated['id_comando']);
        }

        $textoFinal = ! empty($validated['texto_ajustado'])
            ? trim($validated['texto_ajustado'])
            : ($comando?->textoDictado ?? '');

        $interpretacion = ComandoVoz::interpretar($textoFinal);

        if ($comando) {
            $comando->update([
                'textoDictado' => $textoFinal,
                'intencion'    => $interpretacion['intencion'],
                'parametros'   => $interpretacion['parametros'],
                'estado'       => 'CONFIRMADO',
            ]);
        }

        AuditLogger::log(
            'CU29',
            'CONFIRMAR_COMANDO',
            "Comando de voz confirmado por el Administrador: \"{$textoFinal}\"",
            null,
            ['intencion' => $interpretacion['intencion'], 'parametros' => $interpretacion['parametros']]
        );

        return $this->success([
            'textoConfirmado' => $textoFinal,
            'interpretacion'  => $interpretacion,
            'mensaje'         => 'Comando confirmado y listo para ejecución inmediata.',
        ], 'Comando de voz confirmado.');
    }

    /**
     * CU29 - Ejemplos de comandos en lenguaje natural sugeridos para el usuario.
     */
    public function ejemplos(): JsonResponse
    {
        $ejemplos = [
            [
                'texto'      => 'Mostrar ingresos de la Zona Norte del último mes',
                'intencion'  => 'Ingresos y Pagos',
                'icono'      => 'CreditCard',
                'tipo'       => 'ingresos_pagos',
            ],
            [
                'texto'      => 'Reporte de clientes morosos y cartera vencida',
                'intencion'  => 'Morosidad y Cortes',
                'icono'      => 'AlertTriangle',
                'tipo'       => 'morosidad_cortes',
            ],
            [
                'texto'      => 'Listar clientes activos de la Zona Este',
                'intencion'  => 'Clientes por Zona',
                'icono'      => 'Users',
                'tipo'       => 'clientes_zona',
            ],
            [
                'texto'      => 'Consultar equipos asignados en comodato',
                'intencion'  => 'Equipos e Instalaciones',
                'icono'      => 'HardDrive',
                'tipo'       => 'equipos_instalaciones',
            ],
            [
                'texto'      => 'Ver pagos de hoy cobrados por código QR',
                'intencion'  => 'Ingresos QR de Hoy',
                'icono'      => 'CreditCard',
                'tipo'       => 'ingresos_pagos',
            ],
        ];

        return $this->success($ejemplos, 'Ejemplos de comandos disponibles.');
    }
}
