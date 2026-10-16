<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Migración de DATOS (aditiva e idempotente): permiso `planes.manage`.
 *
 * CU16 (Gestionar catálogo de planes de Internet) corresponde al Administrador
 * según la matriz del proyecto. Los permisos existentes `planes.view` y
 * `planes.assign` los comparten Administrador y Secretaría (necesarios para
 * CU17), pero las operaciones de creación/edición/activación/desactivación del
 * catálogo deben ser EXCLUSIVAS del Administrador.
 *
 * Esquema físico canónico: tablas "Permiso", "Rol", "RolPermiso" (sin timestamps).
 */
return new class extends Migration
{
    public function up(): void
    {
        $permisoId = DB::table('Permiso')->where('slug', 'planes.manage')->value('idPermiso');

        if ($permisoId === null) {
            $permisoId = DB::table('Permiso')->insertGetId([
                'slug'        => 'planes.manage',
                'nombre'      => 'Gestionar Catálogo de Planes',
                'modulo'      => 'PLANES',
                'descripcion' => 'Permite crear, editar, activar y desactivar planes de Internet.',
            ], 'idPermiso');
        }

        $adminId = DB::table('Rol')->where('slug', 'admin')->value('idRol');

        if ($adminId !== null && $permisoId !== null) {
            $yaAsignado = DB::table('RolPermiso')
                ->where('idRol', $adminId)
                ->where('idPermiso', $permisoId)
                ->exists();

            if (! $yaAsignado) {
                DB::table('RolPermiso')->insert([
                    'idRol'     => $adminId,
                    'idPermiso' => $permisoId,
                ]);
            }
        }
    }

    public function down(): void
    {
        $permisoId = DB::table('Permiso')->where('slug', 'planes.manage')->value('idPermiso');

        if ($permisoId !== null) {
            DB::table('RolPermiso')->where('idPermiso', $permisoId)->delete();
            DB::table('Permiso')->where('idPermiso', $permisoId)->delete();
        }
    }
};
