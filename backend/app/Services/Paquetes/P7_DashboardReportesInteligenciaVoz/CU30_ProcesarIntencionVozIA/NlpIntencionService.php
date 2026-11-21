<?php

namespace App\Services\Paquetes\P7_DashboardReportesInteligenciaVoz\CU30_ProcesarIntencionVozIA;

use App\Models\Paquetes\P2_GestionClientesZonas\CU04_ZonasCobertura\Zona;
use App\Models\Paquetes\P2_GestionClientesZonas\CU05_RegistrarCliente\Cliente;
use App\Models\Paquetes\P3_ServiciosPlanes\CU08_RegistrarActivarServicio\ServicioInternet;
use App\Models\Paquetes\P4_FacturacionCobranza\CU10_GestionarPagoMensualidad\Pago;
use App\Models\Paquetes\P5_EquiposProveedoresInventario\CU18_RegistrarCatalogoEquipos\ProductoEquipo;
use App\Models\Paquetes\P6_InstalacionesTecnicas\CU21_RegistrarSolicitudInstalacion\SolicitudInstalacion;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Throwable;

class NlpIntencionService
{
    /**
     * Catálogo exhaustivo de intenciones canónicas reconocidas por TELCOM 2.0
     */
    public const CATALOGO_INTENCIONES = [
        'CONSULTAR_CLIENTES' => [
            'categoria'       => 'Clientes y Abonados',
            'destino'         => 'CU06',
            'label'           => 'Consultar y Buscar Clientes',
            'descripcion'     => 'Búsqueda de clientes por nombre, CI, estado o zona',
            'ejemplos'        => ['buscar cliente Juan Perez', 'mostrar clientes activos de Zona Norte', 'clientes dados de baja'],
        ],
        'REGISTRAR_CLIENTE' => [
            'categoria'       => 'Clientes y Abonados',
            'destino'         => 'CU05',
            'label'           => 'Registrar Nuevo Cliente',
            'descripcion'     => 'Dar de alta un nuevo cliente o abonado en el sistema',
            'ejemplos'        => ['registrar nuevo cliente', 'dar de alta a un abonado', 'crear cliente nuevo'],
        ],
        'CONSULTAR_DEUDA' => [
            'categoria'       => 'Facturación y Cobranzas',
            'destino'         => 'CU10',
            'label'           => 'Consultar Deuda y Cobranza',
            'descripcion'     => 'Ver mensualidades pendientes y estado de cuenta de un cliente',
            'ejemplos'        => ['ver deuda del cliente con CI 8492019', 'cuánto debe Carlos Mendoza', 'consultar cuenta pendiente'],
        ],
        'REGISTRAR_PAGO' => [
            'categoria'       => 'Facturación y Cobranzas',
            'destino'         => 'CU10',
            'label'           => 'Registrar Pago de Mensualidad',
            'descripcion'     => 'Cobrar mensualidad por efectivo, QR o transferencia',
            'ejemplos'        => ['registrar pago de mensualidad', 'cobrar factura por QR', 'ingresar pago de abonado'],
        ],
        'HISTORIAL_PAGOS' => [
            'categoria'       => 'Facturación y Cobranzas',
            'destino'         => 'CU11',
            'label'           => 'Historial de Cobros y Pagos',
            'descripcion'     => 'Consulta de transacciones, recibos e ingresos cobrados',
            'ejemplos'        => ['ver historial de pagos de hoy', 'cuánto se cobró este mes', 'mostrar ingresos de la semana'],
        ],
        'ALERTAS_VENCIMIENTO' => [
            'categoria'       => 'Facturación y Cobranzas',
            'destino'         => 'CU12',
            'label'           => 'Alertas de Vencimiento',
            'descripcion'     => 'Mensualidades por vencer o en mora preventiva',
            'ejemplos'        => ['ver alertas de vencimiento', 'qué mensualidades vencen mañana', 'facturas próximas a vencer'],
        ],
        'SERVICIOS_CORTE' => [
            'categoria'       => 'Servicios y Operaciones',
            'destino'         => 'CU13',
            'label'           => 'Listado de Servicios para Corte',
            'descripcion'     => 'Servicios en mora activa elegibles para corte de señal',
            'ejemplos'        => ['mostrar servicios para corte', 'clientes con corte pendiente por mora', 'servicios con más de 5 días de deuda'],
        ],
        'REGISTRAR_CORTE' => [
            'categoria'       => 'Servicios y Operaciones',
            'destino'         => 'CU14',
            'label'           => 'Registrar Corte Realizado',
            'descripcion'     => 'Confirmación de ejecución de corte lógico o físico',
            'ejemplos'        => ['registrar corte del servicio 10001', 'ejecutar corte logico por falta de pago'],
        ],
        'CONSULTAR_REACTIVACIONES' => [
            'categoria'       => 'Servicios y Operaciones',
            'destino'         => 'CU15',
            'label'           => 'Gestión de Reactivaciones',
            'descripcion'     => 'Reconectar o habilitar servicios tras pago de deuda',
            'ejemplos'        => ['reactivar servicio cortado', 'servicios pendientes de reconexión', 'ver reactivaciones'],
        ],
        'CATALOGO_PLANES' => [
            'categoria'       => 'Planes y Velocidades',
            'destino'         => 'CU16',
            'label'           => 'Catálogo de Planes de Internet',
            'descripcion'     => 'Consulta de planes de fibra óptica, velocidad y tarifas',
            'ejemplos'        => ['ver planes de internet disponibles', 'planes de 100 megas', 'cuánto cuesta el plan fibra'],
        ],
        'EQUIPOS_INVENTARIO' => [
            'categoria'       => 'Equipos e Inventario',
            'destino'         => 'CU18',
            'label'           => 'Catálogo e Inventario de Equipos',
            'descripcion'     => 'Stock físico de routers, antenas ONU y materiales',
            'ejemplos'        => ['cuántos routers tenemos en stock', 'ver inventario de equipos', 'disponibilidad de antenas ONU'],
        ],
        'EQUIPOS_COMODATO' => [
            'categoria'       => 'Equipos e Inventario',
            'destino'         => 'CU19',
            'label'           => 'Asignar Equipo en Comodato',
            'descripcion'     => 'Entrega y vinculación de router en comodato a un abonado',
            'ejemplos'        => ['asignar router en comodato', 'entregar equipo a cliente'],
        ],
        'SOLICITUD_INSTALACION' => [
            'categoria'       => 'Instalaciones Técnicas',
            'destino'         => 'CU21',
            'label'           => 'Solicitudes de Instalación',
            'descripcion'     => 'Peticiones de nuevas instalaciones técnicas pendientes',
            'ejemplos'        => ['ver solicitudes de instalación', 'cuántas solicitudes nuevas hay', 'solicitudes pendientes'],
        ],
        'PROGRAMAR_INSTALACION' => [
            'categoria'       => 'Instalaciones Técnicas',
            'destino'         => 'CU22',
            'label'           => 'Programar Instalaciones y Técnicos',
            'descripcion'     => 'Agenda de visitas técnicas y asignación de cuadrillas',
            'ejemplos'        => ['programar instalación para mañana', 'agenda técnica de la semana', 'asignar técnico a instalación'],
        ],
        'REPORTES_SISTEMA' => [
            'categoria'       => 'Reportes y Métricas',
            'destino'         => 'CU27',
            'label'           => 'Reportes del Sistema',
            'descripcion'     => 'Generación y exportación de reportes financieros y operativos',
            'ejemplos'        => ['generar reporte de morosidad en PDF', 'exportar reporte de ingresos', 'descargar estadísticas'],
        ],
        'SEGURIDAD_BACKUP' => [
            'categoria'       => 'Seguridad y Sistema',
            'destino'         => 'CU28',
            'label'           => 'Copias de Seguridad (Backup)',
            'descripcion'     => 'Generar o restaurar respaldo de la base de datos',
            'ejemplos'        => ['generar copia de seguridad', 'crear backup del sistema', 'restaurar base de datos'],
        ],
        'AYUDA_SISTEMA' => [
            'categoria'       => 'Asistente de Voz',
            'destino'         => 'CU30',
            'label'           => 'Ayuda y Comandos Disponibles',
            'descripcion'     => 'Guía de comandos por voz e instrucciones de uso',
            'ejemplos'        => ['qué puedo decir', 'ayuda con comandos de voz', 'cómo funciona el asistente'],
        ],
    ];

    /**
     * Procesar un comando de texto/voz con IA (Gemini si está configurado + fallback NLP local)
     */
    public function procesar(string $texto): array
    {
        $inicio = microtime(true);
        $limpio = trim($texto);

        // 1. Intentar interpretación con Gemini si la API key está disponible
        $resultadoGemini = $this->intentarGemini($limpio);

        // 2. Si Gemini tuvo éxito, enriquecer con entidades locales y datos en vivo
        if ($resultadoGemini !== null && $resultadoGemini['intencion'] !== 'DESCONOCIDA') {
            $intencionCanonica = $resultadoGemini['intencion'];
            $categoria         = self::CATALOGO_INTENCIONES[$intencionCanonica]['categoria'] ?? 'General';
            $confianza         = (float) ($resultadoGemini['confianza'] ?? 0.95);
            $motor             = 'GEMINI_AI';
            $entidades         = array_merge($this->extraerEntidadesLocales($limpio), $resultadoGemini['entidades'] ?? []);
            $respuesta         = $resultadoGemini['respuesta'] ?? $this->generarRespuestaAsistente($intencionCanonica, $entidades);
        } else {
            // 3. Motor NLP Local (Determinista, instantáneo, cero fallas)
            $interpretacionLocal = $this->interpretarLocal($limpio);
            $intencionCanonica   = $interpretacionLocal['intencion'];
            $categoria           = $interpretacionLocal['categoria'];
            $confianza           = $interpretacionLocal['confianza'];
            $motor               = 'LOCAL_NLP';
            $entidades           = $interpretacionLocal['entidades'];
            $respuesta           = $interpretacionLocal['respuesta'];
        }

        // 4. Mapeo de la acción sugerida en el sistema
        $infoCatalogo   = self::CATALOGO_INTENCIONES[$intencionCanonica] ?? null;
        $accionSugerida = [
            'tipo'           => $infoCatalogo ? 'navigate_to' : 'show_alert',
            'destino'        => $infoCatalogo['destino'] ?? 'CU30',
            'modulo'         => $infoCatalogo['label'] ?? 'Asistente de Voz',
            'parametros'     => $entidades,
            'requiere_focus' => ! empty($entidades),
        ];

        // 5. Resolver datos en vivo si la intención permite consulta inmediata
        $datosEnVivo = $this->resolverDatosEnVivo($intencionCanonica, $entidades);

        $duracionMs = (int) round((microtime(true) - $inicio) * 1000);

        return [
            'texto_original'        => $limpio,
            'intencion_canonica'    => $intencionCanonica,
            'categoria'             => $categoria,
            'confianza'             => $confianza,
            'motor'                 => $motor,
            'entidades'             => $entidades,
            'accion_sugerida'       => $accionSugerida,
            'respuesta_asistente'   => $respuesta,
            'datos_en_vivo'         => $datosEnVivo,
            'tiempo_procesamiento'  => $duracionMs,
            'es_accionable'         => $intencionCanonica !== 'DESCONOCIDA',
        ];
    }

    /**
     * Motor NLP local con análisis semántico, tokenización y expresiones regulares
     */
    public function interpretarLocal(string $texto): array
    {
        $minus = mb_strtolower($texto, 'UTF-8');
        $entidades = $this->extraerEntidadesLocales($texto);

        // Reglas de coincidencia ordenadas por especificidad
        $intencion = 'DESCONOCIDA';
        $confianza = 0.50;

        if (preg_match('/(ayuda|qu[eé] puedo (hacer|decir)|comandos disponibles|c[oó]mo funciona)/u', $minus)) {
            $intencion = 'AYUDA_SISTEMA';
            $confianza = 0.98;
        } elseif (preg_match('/(backup|copia.*seguridad|respaldo|restaurar)/u', $minus)) {
            $intencion = 'SEGURIDAD_BACKUP';
            $confianza = 0.96;
        } elseif (preg_match('/(reactivar|reactivaci[oó]n|reconexi[oó]n|volver a activar)/u', $minus)) {
            $intencion = 'CONSULTAR_REACTIVACIONES';
            $confianza = 0.95;
        } elseif (preg_match('/(ejecutar corte|registrar corte|cortar servicio|corte l[oó]gico|corte f[ií]sico)/u', $minus)) {
            $intencion = 'REGISTRAR_CORTE';
            $confianza = 0.94;
        } elseif (preg_match('/(corte|cortes|para corte|morosidad|morosos|en mora|deudores)/u', $minus)) {
            $intencion = 'SERVICIOS_CORTE';
            $confianza = 0.93;
        } elseif (preg_match('/(alerta|vencimiento|vence|vencen|por vencer)/u', $minus)) {
            $intencion = 'ALERTAS_VENCIMIENTO';
            $confianza = 0.92;
        } elseif (preg_match('/(historial.*pago|ingresos|recaudaci[oó]n|cu[aá]nto se (cobro|recaud[oó]|gan[oó]))/u', $minus)) {
            $intencion = 'HISTORIAL_PAGOS';
            $confianza = 0.94;
        } elseif (preg_match('/(registrar pago|cobrar|realizar pago|pago por qr|pagar mensualidad)/u', $minus)) {
            $intencion = 'REGISTRAR_PAGO';
            $confianza = 0.95;
        } elseif (preg_match('/(deuda|cu[aá]nto debe|saldo|pendiente de pago|estado de cuenta)/u', $minus)) {
            $intencion = 'CONSULTAR_DEUDA';
            $confianza = 0.92;
        } elseif (preg_match('/(programar instalaci[oó]n|asignar t[eé]cnico|agenda t[eé]cnica|visita t[eé]cnica)/u', $minus)) {
            $intencion = 'PROGRAMAR_INSTALACION';
            $confianza = 0.94;
        } elseif (preg_match('/(solicitud.*instalaci[oó]n|nuevas instalaciones|solicitudes pendientes)/u', $minus)) {
            $intencion = 'SOLICITUD_INSTALACION';
            $confianza = 0.93;
        } elseif (preg_match('/(en comodato|asignar equipo|equipo comodato|entregar router)/u', $minus)) {
            $intencion = 'EQUIPOS_COMODATO';
            $confianza = 0.92;
        } elseif (preg_match('/(router|antena|onu|switch|inventario|stock|equipos disponibles)/u', $minus)) {
            $intencion = 'EQUIPOS_INVENTARIO';
            $confianza = 0.93;
        } elseif (preg_match('/(reporte|informe|estad[ií]stica|exportar.*pdf|exportar.*excel)/u', $minus)) {
            $intencion = 'REPORTES_SISTEMA';
            $confianza = 0.91;
        } elseif (preg_match('/(planes|plan|megas|mbps|fibra [oó]ptica|tarifa|costo del plan)/u', $minus)) {
            $intencion = 'CATALOGO_PLANES';
            $confianza = 0.90;
        } elseif (preg_match('/(nuevo cliente|registrar cliente|dar de alta cliente|crear abonado)/u', $minus)) {
            $intencion = 'REGISTRAR_CLIENTE';
            $confianza = 0.94;
        } elseif (preg_match('/(cliente|clientes|abonado|abonados|buscar|baja l[oó]gica|inactivo)/u', $minus)) {
            $intencion = 'CONSULTAR_CLIENTES';
            $confianza = 0.88;
        }

        $categoria = self::CATALOGO_INTENCIONES[$intencion]['categoria'] ?? 'No Identificada';
        $respuesta = $this->generarRespuestaAsistente($intencion, $entidades);

        return [
            'intencion' => $intencion,
            'categoria' => $categoria,
            'confianza' => $confianza,
            'entidades' => $entidades,
            'respuesta' => $respuesta,
        ];
    }

    /**
     * Extraer entidades del texto (Zonas, CI, Fechas, Estados, Códigos)
     */
    public function extraerEntidadesLocales(string $texto): array
    {
        $entidades = [];
        $minus = mb_strtolower($texto, 'UTF-8');

        // 1. Zonas
        if (preg_match('/(zona norte|zona sur|zona este|zona oeste|zona central|plan 3000|villa 1.*mayo)/u', $minus, $m)) {
            $entidades['zona'] = Str::title($m[1]);
        }

        // 2. Cédula de Identidad o Números (CI)
        if (preg_match('/(?:ci|carnet|c[eé]dula|identidad|documento)?\s*([0-9]{5,9})/u', $minus, $m)) {
            $entidades['documento_identidad'] = $m[1];
        }

        // 3. Códigos de Servicio o Cliente
        if (preg_match('/(cli-[a-z0-9-]+|srv-[a-z0-9-]+)/u', $minus, $m)) {
            $entidades['codigo'] = strtoupper($m[1]);
        }

        // 4. Estados de Clientes o Servicios
        if (preg_match('/\b(activo|activos)\b/u', $minus)) {
            $entidades['estado'] = 'ACTIVO';
        } elseif (preg_match('/\b(inactivo|inactivos|baja|dados de baja)\b/u', $minus)) {
            $entidades['estado'] = 'INACTIVO';
        } elseif (preg_match('/\b(cortado|cortados|con corte)\b/u', $minus)) {
            $entidades['estado'] = 'CORTADO';
        } elseif (preg_match('/\b(suspendido|suspendidos)\b/u', $minus)) {
            $entidades['estado'] = 'SUSPENDIDO';
        }

        // 5. Período / Fechas
        if (str_contains($minus, 'este mes') || str_contains($minus, 'mes actual')) {
            $entidades['periodo'] = now()->format('Y-m');
            $entidades['periodo_texto'] = 'Mes en curso';
        } elseif (str_contains($minus, 'mes pasado') || str_contains($minus, 'mes anterior')) {
            $entidades['periodo'] = now()->subMonth()->format('Y-m');
            $entidades['periodo_texto'] = 'Mes anterior';
        } elseif (str_contains($minus, 'hoy')) {
            $entidades['fecha'] = now()->toDateString();
            $entidades['fecha_texto'] = 'Hoy';
        }

        // 6. Tipos de equipo
        if (preg_match('/(router|antena|onu|switch|fibra|cable)/u', $minus, $m)) {
            $entidades['tipo_equipo'] = strtoupper($m[1]);
        }

        // 7. Días de mora
        if (preg_match('/([0-9]+)\s*(?:d[ií]as?)\s*(?:de\s*)?(?:mora|retraso|vencido)/u', $minus, $m)) {
            $entidades['dias_mora'] = (int) $m[1];
        }

        return $entidades;
    }

    /**
     * Resuelve datos en vivo de la BD para consultas directas del usuario
     */
    protected function resolverDatosEnVivo(string $intencion, array $entidades): ?array
    {
        try {
            switch ($intencion) {
                case 'CONSULTAR_CLIENTES':
                    $query = Cliente::query();
                    if (! empty($entidades['estado'])) {
                        $query->where('estadoCliente', $entidades['estado']);
                    }
                    if (! empty($entidades['zona'])) {
                        $query->whereHas('zona', fn ($z) => $z->where('nombreZona', 'like', "%{$entidades['zona']}%"));
                    }
                    $total = $query->count();
                    return [
                        'tipo_dato' => 'conteo_clientes',
                        'total'     => $total,
                        'estado'    => $entidades['estado'] ?? 'TODOS',
                        'zona'      => $entidades['zona'] ?? 'Todas las zonas',
                        'mensaje'   => "Se registran {$total} abonados con el criterio solicitado.",
                    ];

                case 'SERVICIOS_CORTE':
                    $mora = $entidades['dias_mora'] ?? 5;
                    $cortables = ServicioInternet::query()
                        ->where('estado_servicio', 'ACTIVO')
                        ->count();
                    return [
                        'tipo_dato' => 'servicios_corte',
                        'total'     => $cortables,
                        'dias_mora' => $mora,
                        'mensaje'   => "Existen servicios activos en seguimiento para corte técnico.",
                    ];

                case 'HISTORIAL_PAGOS':
                    $hoy = now()->toDateString();
                    $pagosHoy = Pago::whereDate('fechaPago', $hoy)->count();
                    $totalMonto = Pago::whereDate('fechaPago', $hoy)->sum('montoTotal');
                    return [
                        'tipo_dato'    => 'ingresos_hoy',
                        'pagos_hoy'    => $pagosHoy,
                        'recaudado'    => (float) $totalMonto,
                        'moneda'       => 'Bs.',
                        'fecha'        => $hoy,
                        'mensaje'      => "Hoy se registraron {$pagosHoy} pagos con un total de Bs. " . number_format($totalMonto, 2),
                    ];

                case 'EQUIPOS_INVENTARIO':
                    $totalEquipos = ProductoEquipo::count();
                    return [
                        'tipo_dato'     => 'inventario_equipos',
                        'total_modelos' => $totalEquipos,
                        'mensaje'       => "El catálogo registra {$totalEquipos} tipos de equipos tecnológicos.",
                    ];

                case 'SOLICITUD_INSTALACION':
                    $pendientes = SolicitudInstalacion::where('estadoSolicitud', 'PENDIENTE')->count();
                    return [
                        'tipo_dato'  => 'solicitudes_instalacion',
                        'pendientes' => $pendientes,
                        'mensaje'    => "Hay {$pendientes} solicitudes de instalación pendientes de agendar.",
                    ];

                default:
                    return null;
            }
        } catch (Throwable) {
            return null; // Falla silenciosa si las tablas no tienen datos o difieren
        }
    }

    /**
     * Llamada controlada a Google Gemini API
     */
    protected function intentarGemini(string $texto): ?array
    {
        $apiKey = trim((string) config('services.gemini.key', env('GEMINI_API_KEY', '')));
        if ($apiKey === '') {
            return null;
        }

        $modelo = trim((string) config('services.gemini.model', env('GEMINI_MODEL', 'gemini-1.5-flash')));
        $catalogo = array_keys(self::CATALOGO_INTENCIONES);
        $promptSistema = "Eres el asistente inteligente de NLP de TELCOM 2.0 (Telecomunicaciones).
Tu labor es clasificar la intención del usuario y devolver estrictamente un JSON con las claves:
- intencion: una de las siguientes: " . implode(', ', $catalogo) . ", o 'DESCONOCIDA'.
- confianza: número entre 0.0 y 1.0.
- entidades: objeto con claves como zona, documento_identidad, periodo, estado, etc.
- respuesta: breve explicación en español amigable para el operador.
Ejemplo: {\"intencion\":\"CONSULTAR_CLIENTES\",\"confianza\":0.95,\"entidades\":{\"zona\":\"Norte\"},\"respuesta\":\"Consultando clientes de la Zona Norte.\"}";

        try {
            $response = Http::acceptJson()
                ->timeout(6)
                ->withHeaders(['x-goog-api-key' => $apiKey])
                ->post("https://generativelanguage.googleapis.com/v1beta/models/{$modelo}:generateContent", [
                    'systemInstruction' => ['parts' => [['text' => $promptSistema]]],
                    'contents'          => [['role' => 'user', 'parts' => [['text' => $texto]]]],
                    'generationConfig'  => [
                        'responseMimeType' => 'application/json',
                        'maxOutputTokens'  => 1024,
                    ],
                ]);

            if ($response->successful()) {
                $rawJson = $response->json('candidates.0.content.parts.0.text');
                if ($rawJson) {
                    $decoded = json_decode($rawJson, true);
                    if (is_array($decoded) && isset($decoded['intencion'])) {
                        return $decoded;
                    }
                }
            }
        } catch (Throwable) {
            // Regresa null para usar el motor local
        }

        return null;
    }

    /**
     * Generar respuesta textual del asistente basada en la intención detectada
     */
    protected function generarRespuestaAsistente(string $intencion, array $entidades): string
    {
        switch ($intencion) {
            case 'CONSULTAR_CLIENTES':
                $filtro = ! empty($entidades['estado']) ? " con estado {$entidades['estado']}" : '';
                $zona = ! empty($entidades['zona']) ? " en {$entidades['zona']}" : '';
                return "Entendido. Mostrando el padrón de clientes{$filtro}{$zona}.";

            case 'REGISTRAR_CLIENTE':
                return "Abriendo el formulario de alta para registrar un nuevo cliente en el sistema.";

            case 'CONSULTAR_DEUDA':
                $ci = ! empty($entidades['documento_identidad']) ? " para el CI {$entidades['documento_identidad']}" : '';
                return "Consultando el estado de cuenta y mensualidades pendientes{$ci}.";

            case 'REGISTRAR_PAGO':
                return "Abriendo la terminal de cobranza para registrar el pago de mensualidad.";

            case 'HISTORIAL_PAGOS':
                return "Generando el historial de recaudación y pagos registrados.";

            case 'ALERTAS_VENCIMIENTO':
                return "Listando las alertas de facturas próximas a vencer para gestión preventiva.";

            case 'SERVICIOS_CORTE':
                $zona = ! empty($entidades['zona']) ? " en {$entidades['zona']}" : '';
                return "Accediendo a la lista de servicios en mora elegibles para corte de señal{$zona}.";

            case 'REGISTRAR_CORTE':
                return "Preparando el registro de ejecución de corte técnico.";

            case 'CONSULTAR_REACTIVACIONES':
                return "Consultando el panel de reactivaciones para reconectar servicios liquidados.";

            case 'CATALOGO_PLANES':
                return "Mostrando el catálogo de planes de internet y anchos de banda.";

            case 'EQUIPOS_INVENTARIO':
                return "Consultando el stock e inventario de routers y equipos técnicos.";

            case 'EQUIPOS_COMODATO':
                return "Abriendo la asignación de equipos en comodato para abonados.";

            case 'SOLICITUD_INSTALACION':
                return "Mostrando las solicitudes de nuevas instalaciones técnicas recibidas.";

            case 'PROGRAMAR_INSTALACION':
                return "Accediendo a la agenda técnica para programar cuadrillas de instalación.";

            case 'REPORTES_SISTEMA':
                return "Preparando el centro de reportes y exportación de datos de TELCOM.";

            case 'SEGURIDAD_BACKUP':
                return "Abriendo el módulo de copias de seguridad de la base de datos.";

            case 'AYUDA_SISTEMA':
                return "Puedes pedirme buscar clientes, consultar deudas, ver servicios para corte, revisar inventario o generar reportes.";

            default:
                return "No he logrado identificar una acción concreta para esa solicitud. Intenta reformularla o consultar la ayuda.";
        }
    }
}
