<?php

namespace App\Http\Controllers\Paquetes\GestionClientesZonas\CU05_RegistrarCliente;

use App\Http\Controllers\Controller;
use App\Models\Paquetes\GestionClientesZonas\CU05_RegistrarCliente\Cliente;
use App\Support\AuditLogger;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ClienteRegistroController extends Controller
{
    use ApiResponse;

    /**
     * CU05 - Registrar nuevo cliente
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'documento_identidad' => 'required|string|unique:Cliente,ci',
            'tipo_documento'      => 'required|string|in:CI,NIT,PASAPORTE',
            'nombres'             => 'required|string|max:150',
            'apellidos'           => 'required|string|max:150',
            'telefono'            => 'required|string|max:30',
            'email'               => 'required|email|unique:Cliente,correo',
            'direccion'           => 'required|string|max:255',
            'zona_id'             => 'required|integer|exists:Zona,idZona',
        ]);

        $validated['codigo_cliente'] = $this->generarCodigoCliente();
        $validated['estado'] = 'ACTIVO';

        $cliente = Cliente::create($validated);

        AuditLogger::log('CU05', 'CREAR_CLIENTE', "Cliente {$cliente->codigo_cliente} registrado.", null, [
            'id' => $cliente->id, 'codigo_cliente' => $cliente->codigo_cliente, 'documento_identidad' => $cliente->documento_identidad,
        ]);

        return $this->success($cliente, 'Cliente registrado exitosamente.', 201);
    }

    /**
     * Genera un código de cliente único con formato CLI-XXXXXX.
     * Se reintenta si el valor aleatorio ya existe (evita colisiones).
     */
    private function generarCodigoCliente(): string
    {
        do {
            $codigo = 'CLI-' . strtoupper(Str::random(6));
        } while (Cliente::withTrashed()->where('codigo_cliente', $codigo)->exists());

        return $codigo;
    }
}
