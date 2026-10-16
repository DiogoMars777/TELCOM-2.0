<?php

namespace App\Http\Controllers\Paquetes\SeguridadAdministracion\CU03_UsuariosRolesPermisos;

use App\Http\Controllers\Controller;
use App\Models\Paquetes\SeguridadAdministracion\CU03_UsuariosRolesPermisos\Permiso;
use App\Models\Paquetes\SeguridadAdministracion\CU03_UsuariosRolesPermisos\Rol;
use App\Support\AuditLogger;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * CU03 - Consultar y actualizar los permisos asignados a cada rol.
 *
 * La LECTURA de roles/permisos no es sensible por sí misma, pero la
 * administración de la autorización sí: ambas operaciones quedan protegidas
 * por `auth:sanctum` + `permission:usuarios.manage` en las rutas. Así, un
 * usuario sin autorización no puede consultar ni modificar la matriz enviando
 * solicitudes directas a la API (401 sin token, 403 sin permiso).
 *
 * La única fuente de verdad son las tablas `roles`, `permisos` y `rol_permiso`;
 * este controlador NO inventa permisos ni crea un sistema paralelo.
 */
class RolController extends Controller
{
    use ApiResponse;

    /**
     * Permiso crítico que nunca debe quedarse sin ningún rol activo que lo
     * posea: permitiría dejar el sistema sin nadie capaz de recuperar el acceso.
     */
    private const PERMISO_ADMINISTRACION = 'usuarios.manage';

    /**
     * CU03 - Listar los roles reales junto al catálogo completo de permisos.
     *
     * Devuelve:
     *  - roles:    cada rol con los permisos que tiene asignados.
     *  - permisos: catálogo completo (slug, nombre, modulo) para construir la
     *              matriz agrupada por módulo en el frontend.
     */
    public function index(): JsonResponse
    {
        $roles = Rol::with('permisos')->orderBy('id')->get();
        $permisos = Permiso::orderBy('modulo')->orderBy('nombre')->get();

        return $this->success([
            'roles'    => $roles,
            'permisos' => $permisos,
        ], 'Roles y permisos obtenidos correctamente.');
    }

    /**
     * CU03 - Reemplazar la matriz de permisos de un rol.
     *
     * El cuerpo espera `permisos` como arreglo de slugs REALES del catálogo.
     * La operación es transaccional: se valida el rol y cada slug; luego se
     * sincroniza la tabla pivote `rol_permiso` (sin duplicados) y se registra
     * el cambio en la bitácora con el antes/después de los slugs.
     */
    public function updatePermisos(Request $request, int $id): JsonResponse
    {
        $rol = Rol::findOrFail($id);

        $validated = $request->validate([
            'permisos'   => ['present', 'array'],
            'permisos.*' => ['string', Rule::exists('Permiso', 'slug')],
        ]);

        // Normaliza: sin duplicados y solo slugs existentes.
        $slugs = array_values(array_unique($validated['permisos']));
        $ids = Permiso::whereIn('slug', $slugs)->pluck('idPermiso')->all();

        if (! $this->algunRolActivoConservaAdministracion($rol, $slugs)) {
            return $this->error(
                'No se puede guardar: el sistema quedaría sin ningún rol activo autorizado para administrar usuarios, roles y permisos.',
                422
            );
        }

        $permisosAntes = $rol->permisos()->pluck('permisos.slug')->sort()->values()->all();

        DB::transaction(function () use ($rol, $ids) {
            $rol->permisos()->sync($ids);
        });

        $rol->load('permisos');
        $permisosDespues = $rol->permisos->pluck('slug')->sort()->values()->all();

        AuditLogger::log(
            'CU03',
            'ACTUALIZAR_PERMISOS_ROL',
            "Permisos del rol {$rol->slug} actualizados.",
            ['permisos' => $permisosAntes],
            ['permisos' => $permisosDespues]
        );

        return $this->success($rol, 'Permisos del rol actualizados correctamente.');
    }

    /**
     * ¿Quedaría al menos un rol ACTIVO con el permiso de administración?
     *
     * Se simula el resultado de guardar `$slugs` en `$rol` y se comprueba el
     * resto de roles sin modificar. Sin esto, quitar el permiso al único rol
     * que lo tiene dejaría el sistema bloqueado sin administrador autorizado.
     *
     * @param  array<int, string>  $slugs
     */
    private function algunRolActivoConservaAdministracion(Rol $rol, array $slugs): bool
    {
        $rolConserva = $rol->activo
            && in_array(self::PERMISO_ADMINISTRACION, $slugs, true);

        if ($rolConserva) {
            return true;
        }

        return Rol::query()
            ->where('id', '!=', $rol->id)
            ->where('activo', true)
            ->whereHas('permisos', function ($query) {
                $query->where('permisos.slug', self::PERMISO_ADMINISTRACION);
            })
            ->exists();
    }
}
