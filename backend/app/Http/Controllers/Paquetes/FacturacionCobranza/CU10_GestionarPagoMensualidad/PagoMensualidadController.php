<?php

namespace App\Http\Controllers\Paquetes\FacturacionCobranza\CU10_GestionarPagoMensualidad;

use App\Http\Controllers\Controller;
use App\Models\Paquetes\FacturacionCobranza\CU09_GenerarMensualidades\MensualidadFacturacion;
use App\Models\Paquetes\FacturacionCobranza\CU10_GestionarPagoMensualidad\PagoMensualidad;
use App\Models\Paquetes\GestionClientesZonas\CU05_RegistrarCliente\Cliente;
use App\Models\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio\ServicioInternet;
use App\Support\AuditLogger;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PagoMensualidadController extends Controller
{
    use ApiResponse;

    /**
     * CU10 - Consultar facturas/mensualidades pendientes de cobro
     */
    public function pendientes(Request $request): JsonResponse
    {
        $buscar = trim((string) $request->input('buscar', ''));
        $periodo = $request->input('periodo');

        $query = MensualidadFacturacion::with([
            'cliente',
            'servicio',
        ])
        ->where('estado_pago', '!=', 'PAGADO')
        ->where('estado_pago', '!=', 'ANULADO');

        if ($periodo) {
            $query->where('periodo', $periodo);
        }

        if ($buscar !== '') {
            $query->where(function ($q) use ($buscar) {
                $term = "%{$buscar}%";
                $q->where('codigo_factura', 'like', $term)
                  ->orWhereHas('cliente', function ($qc) use ($term) {
                      $qc->where('nombres', 'like', $term)
                         ->orWhere('apellidos', 'like', $term)
                         ->orWhere('documento_identidad', 'like', $term)
                         ->orWhere('codigo_cliente', 'like', $term);
                  })
                  ->orWhereHas('servicio', function ($qs) use ($term) {
                      $qs->where('codigo_servicio', 'like', $term);
                  });
            });
        }

        $pendientes = $query->orderBy('fecha_vencimiento', 'asc')->paginate(30);

        return $this->success($pendientes, 'Facturas pendientes de cobro obtenidas correctamente.');
    }

    /**
     * CU10 - Registrar cobro / pago de mensualidad por caja administrativa
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'mensualidad_id'     => 'required|exists:Mensualidad,idMensualidad',
            'monto_pagado'       => 'required|numeric|min:0.01',
            'metodo_pago'        => 'required|string|in:EFECTIVO,TRANSFERENCIA,QR,TARJETA,PAYPAL',
            'numero_transaccion' => 'nullable|string|max:100',
            'observaciones'      => 'nullable|string|max:255',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $mensualidad = MensualidadFacturacion::lockForUpdate()->findOrFail($validated['mensualidad_id']);

            if ($mensualidad->estado_pago === 'PAGADO') {
                return $this->error('Esta mensualidad ya se encuentra pagada.', 422);
            }

            if ($mensualidad->estado_pago === 'ANULADO') {
                return $this->error('No se puede registrar el pago de una mensualidad anulada.', 422);
            }

            // Regla de negocio: el pago debe cubrir EXACTAMENTE el monto de la
            // mensualidad. El importe se calcula/valida en el backend.
            $esperado = round((float) $mensualidad->monto, 2);
            $recibido = round((float) $validated['monto_pagado'], 2);

            if (abs($esperado - $recibido) > 0.001) {
                return $this->error(
                    'El monto pagado debe ser igual al monto de la mensualidad (Bs '.number_format($esperado, 2).').',
                    422
                );
            }

            $pago = PagoMensualidad::create([
                'codigo_recibo'      => 'REC-' . date('Ymd') . '-' . strtoupper(Str::random(4)),
                'mensualidad_id'     => $mensualidad->id,
                'monto_pagado'       => $esperado,
                'metodo_pago'        => $validated['metodo_pago'],
                'numero_transaccion' => $validated['numero_transaccion'] ?? null,
                'fecha_pago'         => now(),
                'cajero_user_id'     => $request->user()->id,
                'observaciones'      => $validated['observaciones'] ?? null,
            ]);

            $mensualidad->update([
                'estado_pago' => 'PAGADO',
            ]);

            AuditLogger::log(
                'CU10',
                'REGISTRAR_PAGO',
                "Pago {$pago->codigo_recibo} registrado para la mensualidad {$mensualidad->codigo_factura}.",
                ['estado_pago' => 'PENDIENTE'],
                ['estado_pago' => 'PAGADO', 'monto_pagado' => $esperado, 'metodo_pago' => $validated['metodo_pago']]
            );

            return $this->success([
                'pago'        => $pago,
                'mensualidad' => $mensualidad,
            ], 'Pago de mensualidad registrado exitosamente.', 201);
        });
    }

    /**
     * CU10 - Consultar estado de servicio y facturas pendientes por CI del cliente (Portal Cliente)
     */
    public function consultarPorCI(Request $request, string $ci): JsonResponse
    {
        $ciLimpio = trim($ci);
        if ($ciLimpio === '') {
            return $this->error('Debe ingresar un número de documento de identidad válido.', 422);
        }

        // Buscar cliente por CI o código de cliente
        $cliente = Cliente::where('ci', $ciLimpio)
            ->orWhere('codigo_cliente', $ciLimpio)
            ->first();


        // Si el cliente NO se encuentra registrado, no se muestra nada y se emite aviso claro
        if (!$cliente) {
            return $this->error(
                'No se encontró ningún cliente registrado con el C.I. ingresado. Verifique el número e intente de nuevo.',
                404
            );
        }

        // Obtener el servicio de internet del cliente
        $servicio = ServicioInternet::where('idCliente', $cliente->id)
            ->with(['zona'])
            ->first();

        // Buscar facturas pendientes de pago
        $pendientes = MensualidadFacturacion::with(['servicio'])
            ->where('idCliente', $cliente->id)
            ->where('estado_pago', 'PENDIENTE')
            ->orderBy('fecha_vencimiento', 'asc')
            ->get();

        // Si el cliente está al día y no tiene deudas pendientes
        if ($pendientes->isEmpty()) {
            return $this->success([
                'cliente' => [
                    'id'               => $cliente->id,
                    'nombre_completo'  => $cliente->nombre_completo,
                    'ci'               => $cliente->ci,
                    'codigo_cliente'   => $cliente->codigo_cliente,
                ],
                'tiene_deuda' => false,
                'mensaje'     => '¡Tu servicio está al día! No tienes mensualidades pendientes de pago.',
                'servicio'    => $servicio ? [
                    'codigo_servicio'  => $servicio->codigo_servicio,
                    'plan_nombre'      => $servicio->plan_nombre ?? 'Plan Internet Fibra',
                    'velocidad_mbps'   => $servicio->velocidad_mbps ?? 50,
                    'estado_servicio'  => $servicio->estado_servicio ?? 'ACTIVO',
                ] : null,
            ], 'Consulta de estado de cliente exitosa.');
        }

        // Si tiene facturas pendientes, obtener la más antigua vencida o por vencer
        $factura = $pendientes->first();

        // Cálculo de fecha programada de corte (5 días de tolerancia tras vencimiento según CU13/CU14)
        $fechaVencimiento = $factura->fecha_vencimiento
            ? Carbon::parse($factura->fecha_vencimiento)->startOfDay()
            : Carbon::today()->addDays(5);

        $fechaCorte = $fechaVencimiento->copy()->addDays(5);
        $hoy = Carbon::today()->startOfDay();

        // Días hábiles/activos de uso antes del corte
        $diasDiferencia = (int) $hoy->diffInDays($fechaCorte, false);
        $diasHabilesRestantes = max(0, $diasDiferencia);

        return $this->success([
            'cliente' => [
                'id'              => $cliente->id,
                'nombre_completo' => $cliente->nombre_completo,
                'ci'              => $cliente->ci,
                'codigo_cliente'  => $cliente->codigo_cliente,
            ],
            'tiene_deuda' => true,
            'mensaje'     => 'Tienes una mensualidad pendiente de pago. Cancela antes de la fecha de corte.',
            'factura'     => [
                'id'                => $factura->id,
                'codigo_factura'    => $factura->codigo_factura,
                'periodo'           => $factura->periodo,
                'monto'             => (float) $factura->monto,
                'fecha_emision'     => $factura->fecha_emision,
                'fecha_vencimiento' => $factura->fecha_vencimiento,
            ],
            'servicio'    => [
                'id'              => $servicio?->id,
                'codigo_servicio' => $servicio?->codigo_servicio,
                'plan_nombre'     => $servicio?->plan_nombre ?? 'Plan Internet Fibra',
                'velocidad_mbps'  => $servicio?->velocidad_mbps ?? 50,
                'ip_asignada'     => $servicio?->ip_asignada,
                'mac_router'      => $servicio?->mac_router,
                'direccion'       => $servicio?->direccion_instalacion,
                'estado_servicio' => $servicio?->estado_servicio ?? 'ACTIVO',
            ],
            'fecha_corte'               => $fechaCorte->format('Y-m-d'),
            'dias_habiles_restantes'    => $diasHabilesRestantes,
            'en_riesgo_corte'           => ($diasDiferencia <= 2),
            'total_facturas_pendientes' => $pendientes->count(),
            'monto_total_deuda'         => (float) $pendientes->sum('monto'),
        ], 'Consulta de estado de cliente exitosa.');
    }

    /**
     * CU10 - Registrar pago en línea de mensualidad por el cliente (QR, Transferencia, PayPal)
     */
    public function pagarEnLinea(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'mensualidad_id'     => 'required|exists:Mensualidad,idMensualidad',
            'monto_pagado'       => 'required|numeric|min:0.01',
            'metodo_pago'        => 'required|string|in:QR,TRANSFERENCIA,PAYPAL',
            'numero_transaccion' => 'nullable|string|max:100',
            'detalles'           => 'nullable|array',
        ]);

        return DB::transaction(function () use ($validated) {
            $mensualidad = MensualidadFacturacion::with('cliente')->lockForUpdate()->findOrFail($validated['mensualidad_id']);

            if ($mensualidad->estado_pago === 'PAGADO') {
                return $this->error('Esta factura ya se encuentra pagada.', 422);
            }

            if ($mensualidad->estado_pago === 'ANULADO') {
                return $this->error('No se puede cancelar una mensualidad anulada.', 422);
            }

            $esperado = round((float) $mensualidad->monto, 2);
            $recibido = round((float) $validated['monto_pagado'], 2);

            if (abs($esperado - $recibido) > 0.001) {
                return $this->error(
                    'El monto pagado debe ser exactamente igual al total de la factura (Bs ' . number_format($esperado, 2) . ').',
                    422
                );
            }

            // Generar número de transacción si no viene uno explícito
            $tx = !empty($validated['numero_transaccion']) ? $validated['numero_transaccion'] : ('TXN-' . strtoupper(Str::random(10)));
            $codigoRecibo = 'REC-ONL-' . date('Ymd') . '-' . strtoupper(Str::random(4));

            // Registrar el pago en la base de datos
            $pago = PagoMensualidad::create([
                'codigo_recibo'      => $codigoRecibo,
                'mensualidad_id'     => $mensualidad->id,
                'monto_pagado'       => $esperado,
                'metodo_pago'        => $validated['metodo_pago'],
                'numero_transaccion' => $tx,
                'fecha_pago'         => now(),
                'cajero_user_id'     => null, // Pago autoservicio portal cliente
                'observaciones'      => "Pago en línea vía {$validated['metodo_pago']} desde Portal Cliente (C.I. {$mensualidad->cliente?->ci}).",
            ]);

            // Marcar mensualidad como pagada
            $mensualidad->update([
                'estado_pago' => 'PAGADO',
            ]);

            // Registrar auditoría del sistema
            AuditLogger::log(
                'CU10',
                'PAGO_EN_LINEA',
                "Pago en línea {$pago->codigo_recibo} registrado para factura {$mensualidad->codigo_factura} vía {$validated['metodo_pago']}.",
                ['estado_pago' => 'PENDIENTE'],
                ['estado_pago' => 'PAGADO', 'monto_pagado' => $esperado, 'metodo_pago' => $validated['metodo_pago']]
            );

            return $this->success([
                'recibo' => [
                    'codigo_recibo'      => $codigoRecibo,
                    'fecha_hora'         => now()->format('Y-m-d H:i:s'),
                    'monto_total'        => $esperado,
                    'metodo_pago'        => $validated['metodo_pago'],
                    'numero_transaccion' => $tx,
                    'cliente_nombre'     => $mensualidad->cliente?->nombre_completo ?? 'Cliente',
                    'cliente_ci'         => $mensualidad->cliente?->ci ?? '',
                    'codigo_factura'     => $mensualidad->codigo_factura,
                    'periodo'            => $mensualidad->periodo,
                ],
                'pago'        => $pago,
                'mensualidad' => $mensualidad,
            ], '¡Pago registrado exitosamente! Su servicio se encuentra al día.', 201);
        });
    }
}
