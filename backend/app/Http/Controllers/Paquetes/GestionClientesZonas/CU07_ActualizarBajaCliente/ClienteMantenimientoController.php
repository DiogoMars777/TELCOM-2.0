<?php

namespace App\Http\Controllers\Paquetes\GestionClientesZonas\CU07_ActualizarBajaCliente;

use App\Http\Controllers\Controller;
use App\Models\Paquetes\GestionClientesZonas\CU07_ActualizarBajaCliente\ClienteBajaLogica;
use App\Support\AuditLogger;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClienteMantenimientoController extends Controller
{
    use ApiResponse;

    /**
     * CU07 - Actualizar datos del cliente
     */
    public function update(Request $request, int $id): JsonResponse
    {
        // `withTrashed()` permite actualizar también a un cliente ya dado de
        // baja (INACTIVO), que ahora aparece en el listado de CU06/CU07.
        $cliente = ClienteBajaLogica::withTrashed()->findOrFail($id);

        $validated = $request->validate([
            'nombres'   => 'sometimes|string|max:150',
            'apellidos' => 'sometimes|string|max:150',
            'telefono'  => 'sometimes|string|max:30',
            'email'     => 'sometimes|email|unique:Cliente,correo,' . ($cliente->idCliente ?? $cliente->id) . ',idCliente',
            'direccion' => 'sometimes|string|max:255',
            'zona_id'   => 'sometimes|integer|exists:Zona,idZona',
        ]);

        $previos = $cliente->only(array_keys($validated));

        $cliente->update($validated);

        AuditLogger::log(
            'CU07',
            'ACTUALIZAR_CLIENTE',
            "Datos del cliente {$cliente->codigo_cliente} actualizados.",
            $previos,
            $cliente->only(array_keys($validated))
        );

        return $this->success($cliente, 'Datos del cliente actualizados exitosamente.');
    }

    /**
     * CU07 - Dar de baja lógica al cliente (Soft Delete / Inactivación)
     */
    public function bajaLogica(Request $request, int $id): JsonResponse
    {
        $cliente = ClienteBajaLogica::withTrashed()->findOrFail($id);

        $validated = $request->validate([
            'motivo_baja' => 'required|string|max:255',
        ]);

        $cliente->update([
            'estado'      => 'INACTIVO',
            'motivo_baja' => $validated['motivo_baja'],
            'fecha_baja'  => now(),
        ]);

        // Realizar baja lógica
        $cliente->delete();

        AuditLogger::log(
            'CU07',
            'BAJA_CLIENTE',
            "Baja lógica del cliente {$cliente->codigo_cliente}: {$validated['motivo_baja']}",
            ['estado' => 'ACTIVO'],
            ['estado' => 'INACTIVO', 'motivo_baja' => $validated['motivo_baja']]
        );

        return $this->success($cliente, 'Cliente dado de baja lógica exitosamente.');
    }
}
