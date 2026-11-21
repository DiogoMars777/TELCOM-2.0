<?php

namespace App\Models\Paquetes\P2_GestionClientesZonas\CU07_ActualizarBajaCliente;

use App\Models\Paquetes\P2_GestionClientesZonas\CU05_RegistrarCliente\Cliente;

class ClienteBajaLogica extends Cliente
{
    /**
     * Historial de motivos de baja o modificaciones
     */
    protected $fillable = [
        'codigo_cliente',
        'documento_identidad',
        'tipo_documento',
        'nombres',
        'apellidos',
        'telefono',
        'email',
        'direccion',
        'zona_id',
        'estado',
        'motivo_baja',
        'fecha_baja',
    ];

    protected $casts = [
        'fecha_baja' => 'datetime',
    ];
}
