<?php

namespace App\Http\Controllers\Paquetes\P7_DashboardReportesInteligenciaVoz\CU30_ProcesarIntencionVozIA;

use App\Http\Controllers\Controller;
use App\Models\Paquetes\P7_DashboardReportesInteligenciaVoz\CU30_ProcesarIntencionVozIA\IntencionVozIA;
use App\Services\Paquetes\P7_DashboardReportesInteligenciaVoz\CU30_ProcesarIntencionVozIA\NlpIntencionService;
use App\Support\AuditLogger;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IntencionVozController extends Controller
{
    use ApiResponse;

    protected NlpIntencionService $nlpService;

    public function __construct(NlpIntencionService $nlpService)
    {
        $this->nlpService = $nlpService;
    }

    /**
     * CU30 - Procesar texto o comando de voz con IA / NLP.
     * Extrae intención canónica, confianza, entidades, genera respuesta y datos en vivo.
     */
    public function procesar(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'texto_dictado'     => ['required', 'string', 'min:2', 'max:1000'],
            'duracion_segundos' => ['nullable', 'numeric', 'min:0', 'max:300'],
            'confianza_audio'   => ['nullable', 'numeric', 'min:0', 'max:1'],
        ], [
            'texto_dictado.required' => 'Debes proporcionar el texto o dictado de voz para procesar.',
            'texto_dictado.min'      => 'El comando debe contener al menos 2 caracteres.',
        ]);

        $texto = trim($validated['texto_dictado']);

        // 1. Procesamiento con el motor NLP / IA
        $resultado = $this->nlpService->procesar($texto);

        // Si el cliente envió confianza del motor de reconocimiento de voz del navegador, promediar
        if (! empty($validated['confianza_audio'])) {
            $resultado['confianza'] = round(($resultado['confianza'] + (float) $validated['confianza_audio']) / 2, 2);
        }

        // 2. Persistir registro en la base de datos
        $registro = IntencionVozIA::create([
            'idUsuario'             => auth()->id(),
            'textoEntrada'          => $texto,
            'intencionCanonica'     => $resultado['intencion_canonica'],
            'categoria'             => $resultado['categoria'],
            'confianza'             => $resultado['confianza'],
            'motor'                 => $resultado['motor'],
            'entidadesExtraidas'    => $resultado['entidades'],
            'accionSugerida'        => $resultado['accion_sugerida'],
            'respuestaAsistente'    => $resultado['respuesta_asistente'],
            'datosEnVivo'           => $resultado['datos_en_vivo'],
            'estado'                => 'PROCESADO',
            'tiempoProcesamientoMs' => $resultado['tiempo_procesamiento'],
        ]);

        $resultado['id_intencion'] = $registro->idIntencion;
        $resultado['fecha_hora']   = $registro->created_at?->toDateTimeString();

        // 3. Auditoría de seguridad del sistema
        AuditLogger::log(
            'CU30',
            'PROCESAR_INTENCION_NLP',
            "Comando procesado por IA [{$resultado['motor']}]: \"{$texto}\" -> {$resultado['intencion_canonica']}",
            null,
            [
                'idIntencion'       => $registro->idIntencion,
                'intencionCanonica' => $resultado['intencion_canonica'],
                'categoria'         => $resultado['categoria'],
                'motor'             => $resultado['motor'],
                'confianza'         => $resultado['confianza'],
                'destino'           => $resultado['accion_sugerida']['destino'] ?? null,
            ]
        );

        return $this->success($resultado, 'Intención de voz procesada exitosamente con IA.');
    }

    /**
     * CU30 - Historial de intenciones procesadas con filtros y paginación
     */
    public function historial(Request $request): JsonResponse
    {
        $buscar    = trim((string) $request->input('buscar', ''));
        $categoria = trim((string) $request->input('categoria', ''));
        $motor     = trim((string) $request->input('motor', ''));
        $perPage   = max(1, min(100, $request->integer('per_page', 20)));

        $query = IntencionVozIA::query()
            ->with('usuario:idUsuario,nombreCompleto,nombreUsuario')
            ->orderByDesc('idIntencion');

        if ($buscar !== '') {
            $query->where(function ($q) use ($buscar) {
                $q->where('textoEntrada', 'like', "%{$buscar}%")
                  ->orWhere('intencionCanonica', 'like', "%{$buscar}%")
                  ->orWhere('respuestaAsistente', 'like', "%{$buscar}%");
            });
        }

        if ($categoria !== '') {
            $query->where('categoria', $categoria);
        }

        if ($motor !== '') {
            $query->where('motor', $motor);
        }

        $paginador = $query->paginate($perPage);

        return $this->success($paginador, 'Historial de intenciones obtenido exitosamente.');
    }

    /**
     * CU30 - Catálogo de intenciones, comandos recomendados y módulos vinculados
     */
    public function catalogo(): JsonResponse
    {
        $catalogo = [];
        foreach (NlpIntencionService::CATALOGO_INTENCIONES as $clave => $item) {
            $catalogo[] = array_merge(['codigo' => $clave], $item);
        }

        return $this->success([
            'intenciones' => $catalogo,
            'total'       => count($catalogo),
            'motor_activo'=> config('services.gemini.key') ? 'GEMINI_AI + LOCAL_FALLBACK' : 'LOCAL_NLP_DETERMINISTA',
        ], 'Catálogo de intenciones de IA obtenido.');
    }

    /**
     * CU30 - Retroalimentación del usuario para aprendizaje de la IA
     */
    public function feedback(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id_intencion'        => ['required', 'integer', 'exists:IntencionVozIA,idIntencion'],
            'es_correcto'         => ['required', 'boolean'],
            'intencion_esperada'  => ['nullable', 'string', 'max:80'],
            'comentario'          => ['nullable', 'string', 'max:255'],
        ]);

        $intencion = IntencionVozIA::findOrFail($validated['id_intencion']);
        $estadoNuevo = $validated['es_correcto'] ? 'CONFIRMADO' : 'CORREGIDO';

        $intencion->update([
            'estado' => $estadoNuevo,
        ]);

        AuditLogger::log(
            'CU30',
            'FEEDBACK_INTENCION',
            "Retroalimentación recibida para comando #{$intencion->idIntencion}: " . ($validated['es_correcto'] ? 'Correcto' : 'Corregido'),
            ['estado' => 'PROCESADO'],
            ['estado' => $estadoNuevo, 'esperada' => $validated['intencion_esperada'] ?? null]
        );

        return $this->success([
            'id_intencion' => $intencion->idIntencion,
            'estado'       => $estadoNuevo,
        ], 'Retroalimentación registrada correctamente.');
    }

    /**
     * CU30 - Confirmar y marcar como ejecutada la acción de una intención
     */
    public function ejecutar(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id_intencion' => ['required', 'integer', 'exists:IntencionVozIA,idIntencion'],
        ]);

        $intencion = IntencionVozIA::findOrFail($validated['id_intencion']);
        $intencion->update(['estado' => 'EJECUTADO']);

        AuditLogger::log(
            'CU30',
            'EJECUTAR_ACCION_NLP',
            "Acción ejecutada desde asistente de voz: {$intencion->intencionCanonica}",
            ['estado' => 'PROCESADO'],
            ['estado' => 'EJECUTADO']
        );

        return $this->success([
            'id_intencion'    => $intencion->idIntencion,
            'accion_sugerida' => $intencion->accion_sugerida,
            'estado'          => 'EJECUTADO',
        ], 'Acción ejecutada exitosamente.');
    }
}
