<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CU19_EquiposInventarioSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Productos para ONU
        $idProdOnuZte = DB::table('ProductoEquipo')->insertGetId([
            'nombre'      => 'ONU ZTE F601 GPON Gigabit Bridge',
            'tipoEquipo'  => 'ONU',
            'marca'       => 'ZTE',
            'modelo'      => 'ZXHN F601',
            'descripcion' => 'Terminal de red óptica GPON con 1 puerto Gigabit Ethernet para abonado.',
            'estado'      => 'DISPONIBLE',
        ], 'idProducto');

        $idProdOnuHuawei = DB::table('ProductoEquipo')->insertGetId([
            'nombre'      => 'ONU Huawei EchoLife HG8010H GPON',
            'tipoEquipo'  => 'ONU',
            'marca'       => 'Huawei',
            'modelo'      => 'HG8010H',
            'descripcion' => 'Terminal ONT/ONU GPON de alta velocidad con puerto 1GE.',
            'estado'      => 'DISPONIBLE',
        ], 'idProducto');

        // 2. Productos para Router
        $idProdRouterHuawei = DB::table('ProductoEquipo')->insertGetId([
            'nombre'      => 'Router ONT Huawei HG8145V5 Dual Band AC1200',
            'tipoEquipo'  => 'Router',
            'marca'       => 'Huawei',
            'modelo'      => 'EchoLife HG8145V5',
            'descripcion' => 'Router inalámbrico ONT GPON 4GE + Wi-Fi AC 1200Mbps doble banda 2.4/5GHz.',
            'estado'      => 'DISPONIBLE',
        ], 'idProducto');

        $idProdRouterTplink = DB::table('ProductoEquipo')->insertGetId([
            'nombre'      => 'Router TP-Link Archer C6 Gigabit Dual Band',
            'tipoEquipo'  => 'Router',
            'marca'       => 'TP-Link',
            'modelo'      => 'Archer C6 V4',
            'descripcion' => 'Router Wi-Fi AC1200 MU-MIMO con 4 antenas de alta ganancia y 5 puertos Gigabit.',
            'estado'      => 'DISPONIBLE',
        ], 'idProducto');

        // 3. Productos para Modem
        $idProdModemZyxel = DB::table('ProductoEquipo')->insertGetId([
            'nombre'      => 'Modem Router Zyxel VMG3926 Dual Band',
            'tipoEquipo'  => 'Modem',
            'marca'       => 'Zyxel',
            'modelo'      => 'VMG3926-B10A',
            'descripcion' => 'Modem Gateway residencial de fibra/VDSL con routing avanzado y firewall integrado.',
            'estado'      => 'DISPONIBLE',
        ], 'idProducto');

        $idProdModemArris = DB::table('ProductoEquipo')->insertGetId([
            'nombre'      => 'Modem Gateway Arris Touchstone TG3452',
            'tipoEquipo'  => 'Modem',
            'marca'       => 'Arris',
            'modelo'      => 'TG3452',
            'descripcion' => 'Gateway de ultra banda ancha con Wi-Fi 802.11ac Wave 2 y soporte para telefonía IP.',
            'estado'      => 'DISPONIBLE',
        ], 'idProducto');

        // Total de 25 equipos por cada tipo (75 equipos en total)
        $cantPorTipo = 25;

        // --- Generar 25 ONUs ---
        for ($i = 1; $i <= $cantPorTipo; $i++) {
            $numPadded = str_pad((string)$i, 4, '0', STR_PAD_LEFT);
            $macByte = str_pad(dechex($i), 2, '0', STR_PAD_LEFT);
            $prodId = ($i % 2 === 0) ? $idProdOnuHuawei : $idProdOnuZte;

            DB::table('Equipo')->insert([
                'numeroSerie'  => "SN-ONU-2026-{$numPadded}",
                'mac'          => "BC:5F:F4:11:01:{$macByte}",
                'ip'           => "10.20.11." . (100 + $i),
                'asignada'     => false,
                'propiedad'    => 'TELCOM_COMODATO',
                'estadoEquipo' => 'OPERATIVO',
                'idProducto'   => $prodId,
            ]);
        }

        // --- Generar 25 Routers ---
        for ($i = 1; $i <= $cantPorTipo; $i++) {
            $numPadded = str_pad((string)$i, 4, '0', STR_PAD_LEFT);
            $macByte = str_pad(dechex($i), 2, '0', STR_PAD_LEFT);
            $prodId = ($i % 2 === 0) ? $idProdRouterTplink : $idProdRouterHuawei;

            DB::table('Equipo')->insert([
                'numeroSerie'  => "SN-RTR-2026-{$numPadded}",
                'mac'          => "D8:07:B6:22:02:{$macByte}",
                'ip'           => "10.20.12." . (100 + $i),
                'asignada'     => false,
                'propiedad'    => 'TELCOM_COMODATO',
                'estadoEquipo' => 'OPERATIVO',
                'idProducto'   => $prodId,
            ]);
        }

        // --- Generar 25 Modems ---
        for ($i = 1; $i <= $cantPorTipo; $i++) {
            $numPadded = str_pad((string)$i, 4, '0', STR_PAD_LEFT);
            $macByte = str_pad(dechex($i), 2, '0', STR_PAD_LEFT);
            $prodId = ($i % 2 === 0) ? $idProdModemArris : $idProdModemZyxel;

            DB::table('Equipo')->insert([
                'numeroSerie'  => "SN-MDM-2026-{$numPadded}",
                'mac'          => "E4:AA:5D:33:03:{$macByte}",
                'ip'           => "10.20.13." . (100 + $i),
                'asignada'     => false,
                'propiedad'    => 'TELCOM_COMODATO',
                'estadoEquipo' => 'OPERATIVO',
                'idProducto'   => $prodId,
            ]);
        }

        // Registrar stock en Inventario
        $productosIds = [
            $idProdOnuZte       => 13,
            $idProdOnuHuawei    => 12,
            $idProdRouterHuawei => 13,
            $idProdRouterTplink => 12,
            $idProdModemZyxel   => 13,
            $idProdModemArris   => 12,
        ];

        foreach ($productosIds as $pId => $stock) {
            DB::table('Inventario')->insert([
                'stockActual'        => $stock,
                'fechaActualizacion' => now(),
                'idProducto'         => $pId,
            ]);
        }
    }
}

