<?php

namespace App\Models\Paquetes\GestionClientesZonas\CU06_ConsultarBuscarClientes;

use App\Models\Paquetes\GestionClientesZonas\CU05_RegistrarCliente\Cliente;

class ClienteConsulta extends Cliente
{
    /**
     * Scope para búsqueda avanzada de clientes por criterio múltiple
     */
    public function scopeBuscar($query, ?string $termino)
    {
        if (empty($termino)) {
            return $query;
        }

        // `whereLike(..., caseSensitive: false)` se traduce a ILIKE en
        // PostgreSQL y a LIKE (insensible en ASCII) en SQLite, por lo que la
        // búsqueda funciona igual en producción y en las pruebas.
        $patron = '%' . $termino . '%';

        return $query->where(function ($q) use ($patron) {
            $q->whereLike('codigo_cliente', $patron, caseSensitive: false)
              ->orWhereLike('documento_identidad', $patron, caseSensitive: false)
              ->orWhereLike('nombres', $patron, caseSensitive: false)
              ->orWhereLike('apellidos', $patron, caseSensitive: false)
              ->orWhereLike('email', $patron, caseSensitive: false)
              ->orWhereLike('telefono', $patron, caseSensitive: false);
        });
    }
}
