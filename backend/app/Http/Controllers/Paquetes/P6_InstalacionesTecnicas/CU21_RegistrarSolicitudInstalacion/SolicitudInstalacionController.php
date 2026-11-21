<?php

namespace App\Http\Controllers\Paquetes\P6_InstalacionesTecnicas\CU21_RegistrarSolicitudInstalacion;

use App\Http\Controllers\Controller;
use App\Models\Paquetes\P2_GestionClientesZonas\CU04_ZonasCobertura\Zona;
use App\Models\Paquetes\P2_GestionClientesZonas\CU05_RegistrarCliente\Cliente;
use App\Models\Paquetes\P6_InstalacionesTecnicas\CU21_RegistrarSolicitudInstalacion\SolicitudInstalacion;
use App\Support\AuditLogger;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SolicitudInstalacionController extends Controller
{
    use ApiResponse;

    /**
     * CU21 - Listar solicitudes de instalación registradas (Administración)
     */
    public function index(Request $request): JsonResponse
    {
        $query = SolicitudInstalacion::with(['cliente' => function ($q) {
            $q->select('idCliente', 'codigoCliente', 'ci', 'nombreCompleto', 'telefonoPrincipal', 'correo', 'idZona', 'direccion');
        }]);

        // Filtro por estado (PENDIENTE, PROGRAMADA, INSTALADO, CANCELADA)
        if ($request->filled('estado')) {
            $query->where('estadoSolicitud', strtoupper(trim($request->input('estado'))));
        }

        // Búsqueda por número de orden, nombre de cliente o carnet
        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('numeroOrden', 'ilike', "%{$search}%")
                  ->orWhere('direccion', 'ilike', "%{$search}%")
                  ->orWhereHas('cliente', function ($qCli) use ($search) {
                      $qCli->where('nombreCompleto', 'ilike', "%{$search}%")
                           ->orWhere('ci', 'ilike', "%{$search}%")
                           ->orWhere('codigoCliente', 'ilike', "%{$search}%");
                  });
            });
        }

        // Filtro por rango de fechas
        if ($request->filled('fecha_desde')) {
            $query->whereDate('fechaSolicitud', '>=', $request->input('fecha_desde'));
        }
        if ($request->filled('fecha_hasta')) {
            $query->whereDate('fechaSolicitud', '<=', $request->input('fecha_hasta'));
        }

        $perPage = min((int) $request->input('per_page', 15), 100);
        $solicitudes = $query->orderBy('idSolicitud', 'desc')->paginate($perPage);

        return $this->success($solicitudes, 'Solicitudes de instalación obtenidas con éxito.');
    }

    /**
     * CU21 - Registrar solicitud de instalación de forma interna (Secretaría / Administrador)
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'cliente_id'      => 'required|integer|exists:Cliente,idCliente',
            'direccion'       => 'required|string|max:500',
            'referencia'      => 'nullable|string|max:500',
            'latitud'         => 'nullable|numeric|between:-90,90',
            'longitud'        => 'nullable|numeric|between:-180,180',
            'zona_id'         => 'nullable|integer|exists:Zona,idZona',
            'observacion'     => 'nullable|string|max:1000',
            'plan_sugerido'   => 'nullable|string|max:100',
        ], [
            'cliente_id.required' => 'Debe seleccionar un cliente registrado.',
            'cliente_id.exists'   => 'El cliente seleccionado no existe en el sistema.',
            'direccion.required'  => 'La dirección de instalación es obligatoria.',
            'latitud.between'     => 'La coordenada de latitud debe encontrarse entre -90 y 90.',
            'longitud.between'    => 'La coordenada de longitud debe encontrarse entre -180 y 180.',
        ]);

        $cliente = Cliente::findOrFail($validated['cliente_id']);

        // Verificar si la zona especificada tiene cobertura saturada
        $zonaId = $validated['zona_id'] ?? $cliente->idZona;
        if ($zonaId) {
            $zona = Zona::find($zonaId);
            if ($zona && strtolower($zona->estadoCobertura) === 'saturada') {
                return $this->error("La zona '{$zona->nombreZona}' se encuentra saturada técnicamente. No es posible admitir nuevas solicitudes de instalación temporalmente.", 422);
            }
        }

        return DB::transaction(function () use ($validated, $cliente) {
            $numeroOrden = $this->generarNumeroOrden();
            $fechaHoy = now()->toDateString();

            $obs = $validated['observacion'] ?? '';
            if (!empty($validated['plan_sugerido'])) {
                $obs = trim("Plan de interés: {$validated['plan_sugerido']}. " . $obs);
            }

            $solicitud = SolicitudInstalacion::create([
                'numeroOrden'     => $numeroOrden,
                'fechaSolicitud'  => $fechaHoy,
                'direccion'       => $validated['direccion'],
                'referencia'      => $validated['referencia'] ?? null,
                'latitud'         => $validated['latitud'] ?? null,
                'longitud'        => $validated['longitud'] ?? null,
                'estadoSolicitud' => 'PENDIENTE',
                'observacion'     => $obs ?: 'Solicitud de instalación pendiente de inspección técnica.',
                'idCliente'       => $cliente->idCliente,
            ]);

            // Auditoría (CU02 / CU21)
            AuditLogger::log(
                'CU21',
                'REGISTRAR_SOLICITUD_INSTALACION',
                "Solicitud de instalación {$solicitud->numeroOrden} registrada para cliente {$cliente->nombreCompleto} (CI: {$cliente->ci}).",
                null,
                [
                    'idSolicitud' => $solicitud->idSolicitud,
                    'numeroOrden' => $solicitud->numeroOrden,
                    'idCliente'   => $cliente->idCliente,
                    'direccion'   => $solicitud->direccion,
                    'estado'      => $solicitud->estadoSolicitud,
                ]
            );

            // Cargar relación para devolver la respuesta completa
            $solicitud->load('cliente');

            return $this->success($solicitud, "Solicitud de instalación {$solicitud->numeroOrden} registrada exitosamente.", 201);
        });
    }

    /**
     * CU21 - Registrar solicitud de instalación pública desde la página web (Cliente)
     */
    public function storePublica(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombres'         => 'required|string|max:100',
            'ci'              => 'required|string|max:30',
            'telefono'        => 'required|string|max:30',
            'email'           => 'nullable|email|max:100',
            'direccion'       => 'required|string|max:500',
            'referencia'      => 'nullable|string|max:500',
            'zona_id'         => 'required|integer|exists:Zona,idZona',
            'latitud'         => 'nullable|numeric|between:-90,90',
            'longitud'        => 'nullable|numeric|between:-180,180',
            'plan_sugerido'   => 'nullable|string|max:100',
            'observacion'     => 'nullable|string|max:1000',
        ], [
            'nombres.required'    => 'Por favor proporcione su nombre completo.',
            'ci.required'         => 'El carnet de identidad es obligatorio para registrar la solicitud.',
            'telefono.required'   => 'El teléfono o celular de contacto es obligatorio.',
            'direccion.required'  => 'La dirección donde requiere la instalación es obligatoria.',
            'zona_id.required'    => 'Debe seleccionar la zona o barrio de cobertura.',
        ]);

        $zona = Zona::findOrFail($validated['zona_id']);
        if (strtolower($zona->estadoCobertura) === 'saturada') {
            return $this->error("Lo sentimos, la zona '{$zona->nombreZona}' se encuentra saturada temporalmente. Por favor comuníquese con secretaría para mayor información.", 422);
        }

        return DB::transaction(function () use ($validated, $zona) {
            // Verificar si el cliente ya existe en el sistema por CI
            $cliente = Cliente::where('ci', trim($validated['ci']))->first();

            if (!$cliente) {
                // Registrar nuevo cliente prospecto
                $codigoCliente = 'CLI-' . strtoupper(Str::random(6));
                while (Cliente::withTrashed()->where('codigoCliente', $codigoCliente)->exists()) {
                    $codigoCliente = 'CLI-' . strtoupper(Str::random(6));
                }

                $cliente = Cliente::create([
                    'codigoCliente'       => $codigoCliente,
                    'ci'                  => trim($validated['ci']),
                    'nombreCompleto'      => trim($validated['nombres']),
                    'telefonoPrincipal'   => trim($validated['telefono']),
                    'correo'              => $validated['email'] ?? null,
                    'direccion'           => $validated['direccion'],
                    'referenciaUbicacion' => $validated['referencia'] ?? null,
                    'idZona'              => $zona->idZona,
                    'estadoCliente'       => 'ACTIVO',
                    'fechaRegistro'       => now(),
                ]);
            }

            $numeroOrden = $this->generarNumeroOrden();
            $obs = $validated['observacion'] ?? '';
            if (!empty($validated['plan_sugerido'])) {
                $obs = trim("Plan solicitado vía web: {$validated['plan_sugerido']}. " . $obs);
            }

            $solicitud = SolicitudInstalacion::create([
                'numeroOrden'     => $numeroOrden,
                'fechaSolicitud'  => now()->toDateString(),
                'direccion'       => $validated['direccion'],
                'referencia'      => $validated['referencia'] ?? null,
                'latitud'         => $validated['latitud'] ?? null,
                'longitud'        => $validated['longitud'] ?? null,
                'estadoSolicitud' => 'PENDIENTE',
                'observacion'     => $obs ?: 'Solicitud pública registrada desde el portal web de TELCOM.',
                'idCliente'       => $cliente->idCliente,
            ]);

            AuditLogger::log(
                'CU21',
                'SOLICITUD_WEB_CLIENTE',
                "Nueva solicitud web de instalación {$solicitud->numeroOrden} registrada por el cliente {$cliente->nombreCompleto}.",
                null,
                [
                    'idSolicitud' => $solicitud->idSolicitud,
                    'numeroOrden' => $solicitud->numeroOrden,
                    'idCliente'   => $cliente->idCliente,
                    'zona'        => $zona->nombreZona,
                ]
            );

            return $this->success([
                'solicitud' => $solicitud,
                'cliente'   => $cliente,
                'zona'      => $zona,
            ], "Su solicitud de instalación fue registrada exitosamente con el código {$numeroOrden}. Nos pondremos en contacto a la brevedad.", 201);
        });
    }

    /**
     * CU21 - Consultar detalle de una solicitud
     */
    public function show($id): JsonResponse
    {
        $solicitud = SolicitudInstalacion::with(['cliente.zona'])->findOrFail($id);

        return $this->success($solicitud, 'Detalle de la solicitud recuperado con éxito.');
    }

    /**
     * Listado rápido de clientes registrados para autocompletar en el modal
     */
    public function clientesDisponibles(Request $request): JsonResponse
    {
        $search = trim($request->input('q', ''));
        $query = Cliente::where('estadoCliente', 'ACTIVO')
            ->select('idCliente', 'codigoCliente', 'ci', 'nombreCompleto', 'telefonoPrincipal', 'correo', 'direccion', 'referenciaUbicacion', 'idZona');

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('nombreCompleto', 'ilike', "%{$search}%")
                  ->orWhere('ci', 'ilike', "%{$search}%")
                  ->orWhere('codigoCliente', 'ilike', "%{$search}%");
            });
        }

        $clientes = $query->limit(20)->get();

        return $this->success($clientes, 'Clientes disponibles obtenidos.');
    }

    /**
     * Zonas públicas con información de cobertura para el formulario
     */
    public function zonasPublicas(): JsonResponse
    {
        $zonas = Zona::where('estado', true)
            ->select('idZona', 'nombreZona', 'descripcion', 'estadoCobertura', 'ciudad', 'barrio', 'tecnologia')
            ->orderBy('nombreZona')
            ->get();

        return $this->success($zonas, 'Zonas de cobertura obtenidas.');
    }

    /**
     * Cancelar una solicitud pendiente
     */
    public function cancelar(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'motivo' => 'required|string|max:500',
        ], [
            'motivo.required' => 'Debe indicar el motivo de la cancelación de la solicitud.',
        ]);

        $solicitud = SolicitudInstalacion::findOrFail($id);

        if ($solicitud->estadoSolicitud === 'CANCELADA') {
            return $this->error('La solicitud ya se encuentra cancelada.', 400);
        }

        if (in_array($solicitud->estadoSolicitud, ['INSTALADO', 'COMPLETADA'])) {
            return $this->error('No se puede cancelar una solicitud cuya instalación ya fue realizada.', 400);
        }

        $solicitud->estadoSolicitud = 'CANCELADA';
        $solicitud->observacion = trim(($solicitud->observacion ? $solicitud->observacion . " | " : "") . "CANCELADA: " . $validated['motivo']);
        $solicitud->save();

        AuditLogger::log(
            'CU21',
            'CANCELAR_SOLICITUD',
            "Solicitud {$solicitud->numeroOrden} cancelada. Motivo: {$validated['motivo']}",
            null,
            ['idSolicitud' => $solicitud->idSolicitud, 'motivo' => $validated['motivo']]
        );

        return $this->success($solicitud, "La solicitud {$solicitud->numeroOrden} ha sido cancelada.");
    }

    /**
     * Generar número correlativo único de orden de instalación (ej. ORD-2026-00025)
     */
    private function generarNumeroOrden(): string
    {
        $anio = date('Y');
        $ultimoId = (int) DB::table('SolicitudInstalacion')->max('idSolicitud');
        $correlativo = $ultimoId + 1;

        do {
            $numero = sprintf('ORD-%s-%05d', $anio, $correlativo);
            $existe = DB::table('SolicitudInstalacion')->where('numeroOrden', $numero)->exists();
            if ($existe) {
                $correlativo++;
            }
        } while ($existe);

        return $numero;
    }
}

