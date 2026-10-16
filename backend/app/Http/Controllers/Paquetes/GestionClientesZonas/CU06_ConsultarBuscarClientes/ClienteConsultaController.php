<?php

namespace App\Http\Controllers\Paquetes\GestionClientesZonas\CU06_ConsultarBuscarClientes;

use App\Http\Controllers\Controller;
use App\Models\Paquetes\GestionClientesZonas\CU06_ConsultarBuscarClientes\ClienteConsulta;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClienteConsultaController extends Controller
{
    use ApiResponse;

    /**
     * CU06 - Consultar y buscar clientes con filtros y paginación
     */
    public function index(Request $request): JsonResponse
    {
        $busqueda = $request->input('buscar');
        $estado   = $request->input('estado');
        $zonaId   = $request->input('zona_id');

        // `withTrashed()` incluye a los clientes dados de baja lógica: al
        // darlos de baja se marca estado=INACTIVO y se guarda `deleted_at`
        // (SoftDeletes), así que sin esto la consulta los ocultaría. El
        // registro, sus relaciones y el historial se conservan intactos.
        $query = ClienteConsulta::withTrashed()->buscar($busqueda);

        if ($estado) {
            $query->where('estado', $estado);
        }

        if ($zonaId) {
            $query->where('zona_id', $zonaId);
        }

        $clientes = $query->latest()->paginate(15);

        return $this->success($clientes, 'Clientes consultados exitosamente.');
    }

    /**
     * CU06 - Detalle de un cliente
     */
    public function show(int $id): JsonResponse
    {
        // Incluye también a los clientes con baja lógica (INACTIVO).
        $cliente = ClienteConsulta::withTrashed()->findOrFail($id);
        return $this->success($cliente, 'Detalle de cliente obtenido.');
    }
}
