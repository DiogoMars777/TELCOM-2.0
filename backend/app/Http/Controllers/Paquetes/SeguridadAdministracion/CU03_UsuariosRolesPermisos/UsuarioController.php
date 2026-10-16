<?php

namespace App\Http\Controllers\Paquetes\SeguridadAdministracion\CU03_UsuariosRolesPermisos;

use App\Http\Controllers\Controller;
use App\Models\Paquetes\SeguridadAdministracion\CU03_UsuariosRolesPermisos\Rol;
use App\Models\User;
use App\Support\AuditLogger;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UsuarioController extends Controller
{
    use ApiResponse;

    /**
     * CU03 - Listar usuarios internos con sus roles
     */
    public function index(): JsonResponse
    {
        $usuarios = User::with('rol')->latest()->paginate(15);
        $roles = Rol::with('permisos')->get();

        return $this->success([
            'usuarios' => $usuarios,
            'roles'    => $roles,
        ], 'Usuarios internos obtenidos correctamente.');
    }

    /**
     * CU03 - Crear usuario interno
     *
     * Se acepta `rol_id` (recomendado) o, por compatibilidad con el formulario
     * actual, el nombre del rol en `role`. En ambos casos el rol debe existir.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'nombre_usuario' => 'nullable|string|max:100|unique:Usuario,nombreUsuario',
            'email'          => 'required|email|unique:Usuario,correo',
            // Política de contraseñas: mínimo 8 caracteres, al menos una
            // mayúscula, una minúscula, un número y un carácter especial
            // (! @ # $ % & *). Debe coincidir con el frontend
            // (`config/passwordPolicy.js`).
            'password'       => [
                'required',
                'string',
                'min:8',
                'regex:/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%&*]).+$/',
            ],
            'telefono'       => 'nullable|string|max:50',
            'activo'         => 'sometimes|boolean',
            'rol_id'         => 'required_without:role|nullable|integer|exists:Rol,idRol',
            'role'           => 'required_without:rol_id|nullable|string|exists:Rol,nombre',
        ], [
            'password.required'       => 'La contraseña es obligatoria.',
            'password.min'            => 'La contraseña debe tener al menos 8 caracteres.',
            'password.regex'          => 'La contraseña debe incluir al menos una letra mayúscula, una minúscula, un número y un carácter especial (! @ # $ % & *).',
            'rol_id.required_without' => 'Debes seleccionar un rol.',
            'rol_id.exists'           => 'El rol seleccionado no existe.',
            'role.exists'             => 'El rol seleccionado no existe.',
        ]);

        // Resolver el rol: por id o, como respaldo, por nombre.
        $rol = isset($validated['rol_id'])
            ? Rol::find($validated['rol_id'])
            : Rol::where('nombre', $validated['role'])->first();

        if (! $rol) {
            return $this->error('El rol indicado no existe.', 422);
        }

        $usuario = User::create([
            'name'           => $validated['name'],
            'nombre_usuario' => $validated['nombre_usuario'] ?? null,
            'email'          => $validated['email'],
            'password'       => Hash::make($validated['password']),
            'telefono'       => $validated['telefono'] ?? null,
            'activo'         => $validated['activo'] ?? true,
            'rol_id'         => $rol->id,
        ]);

        AuditLogger::log('CU03', 'CREAR_USUARIO', "Usuario interno {$usuario->email} creado.", null, [
            'id' => $usuario->id, 'email' => $usuario->email, 'rol_id' => $rol->id,
        ]);

        return $this->success($usuario->load('rol'), 'Usuario interno creado exitosamente.', 201);
    }

    /**
     * CU03 - Actualizar datos administrativos de un usuario interno
     * (nombre, teléfono, rol y estado activo/inactivo).
     *
     * No permite que un administrador se desactive a sí mismo para evitar
     * dejar el sistema sin acceso administrativo.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $usuario = User::findOrFail($id);

        $validated = $request->validate([
            'name'     => 'sometimes|string|max:255',
            'telefono' => 'nullable|string|max:50',
            'activo'   => 'sometimes|boolean',
            'rol_id'   => 'sometimes|integer|exists:Rol,idRol',
        ]);

        if (array_key_exists('activo', $validated)
            && $validated['activo'] === false
            && $request->user()?->id === $usuario->id) {
            return $this->error('No puedes desactivar tu propia cuenta.', 422);
        }

        $previos = $usuario->only(['name', 'telefono', 'activo', 'rol_id']);
        $usuario->update($validated);

        AuditLogger::log(
            'CU03',
            'ACTUALIZAR_USUARIO',
            "Usuario {$usuario->email} actualizado.",
            $previos,
            $usuario->only(['name', 'telefono', 'activo', 'rol_id'])
        );

        return $this->success($usuario->load('rol'), 'Usuario interno actualizado correctamente.');
    }

    /**
     * CU03 - Actualizar el rol de un usuario
     */
    public function updateRoles(Request $request, int $id): JsonResponse
    {
        $usuario = User::findOrFail($id);

        $validated = $request->validate([
            'rol_id' => 'required|integer|exists:Rol,idRol',
        ]);

        $previos = ['rol_id' => $usuario->rol_id];

        $usuario->rol_id = $validated['rol_id'];
        $usuario->save();

        AuditLogger::log(
            'CU03',
            'CAMBIAR_ROL_USUARIO',
            "Rol del usuario {$usuario->email} actualizado.",
            $previos,
            ['rol_id' => $usuario->rol_id]
        );

        return $this->success($usuario->load('rol'), 'Rol del usuario actualizado correctamente.');
    }
}
