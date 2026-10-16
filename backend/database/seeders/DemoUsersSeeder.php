<?php

namespace Database\Seeders;

use App\Models\Paquetes\SeguridadAdministracion\CU03_UsuariosRolesPermisos\Rol;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Usuarios de DEMOSTRACIÓN para el entorno local.
 * -------------------------------------------------------------------
 * Crea (o reapunta) una cuenta por cada rol interno —admin, secretaria y
 * tecnico— para poder comparar visualmente los menús y permisos.
 *
 * Seguridades:
 *  - NO se ejecuta en producción (se omite si APP_ENV=production).
 *  	No forma parte de DatabaseSeeder, por lo que NUNCA corre de forma
 *  	automática con `php artisan migrate --seed`.
 *   - NO sobrescribe la contraseña de un usuario existente (salvo que se
 *     pida explícitamente con TELCOM_DEMO_RESET_PASSWORD=true).
 *   - La contraseña se toma de la variable de entorno TELCOM_DEMO_PASSWORD
 *     (nunca una contraseña real en el repositorio).
 *
 * Uso (solo local):
 *   php artisan db:seed --class=Database\\Seeders\DemoUsersSeeder
 *
 * Estas cuentas son SOLO para pruebas visuales; no deben usarse como
 * cuentas de operación reales.
 */
class DemoUsersSeeder extends Seeder
{
    /**
     * Correos .local para no colisionar con cuentas reales del sistema.
     *
     * @var array<int, array{name: string, email: string, slug: string}>
     */
    private array $cuentas = [
        ['name' => 'Administrador Demo', 'email' => 'admin.demo@telcom.local', 'slug' => 'admin'],
        ['name' => 'Secretaría Demo',    'email' => 'secretaria.demo@telcom.local', 'slug' => 'secretaria'],
        ['name' => 'Técnico Demo',       'email' => 'tecnico.demo@telcom.local', 'slug' => 'tecnico'],
    ];

    public function run(): void
    {
        // Barrera de seguridad: nunca en producción.
        if (app()->environment('production')) {
            $this->command?->warn('DemoUsersSeeder OMITIDO: entorno de producción.');
            return;
        }

        $password = (string) env('TELCOM_DEMO_PASSWORD', 'Demo123456!');
        $resetPassword = filter_var(
            env('TELCOM_DEMO_RESET_PASSWORD', false),
            FILTER_VALIDATE_BOOLEAN
        );

        foreach ($this->cuentas as $cuenta) {
            $rol = Rol::where('slug', $cuenta['slug'])->first();

            if (! $rol) {
                $this->command?->error(
                    "Rol '{$cuenta['slug']}' no encontrado. Ejecuta primero: php artisan db:seed"
                );
                continue;
            }

            $user = User::where('correo', $cuenta['email'])->first();

            if ($user) {
                // Nunca se sobrescribe una contraseña existente salvo petición explícita.
                $atributos = [
                    'nombreCompleto' => $cuenta['name'],
                    'idRol'          => $rol->idRol,
                    'activo'         => true,
                ];

                if ($resetPassword) {
                    $atributos['password'] = $password;
                }

                $user->forceFill($atributos)->save();

                $this->command?->info("Actualizado: {$cuenta['email']} ({$cuenta['slug']})");
            } else {
                User::create([
                    'nombreUsuario'  => explode('@', $cuenta['email'])[0],
                    'nombreCompleto' => $cuenta['name'],
                    'correo'         => $cuenta['email'],
                    'password'       => $password, // el cast 'hashed' o mutator lo cifra
                    'idRol'          => $rol->idRol,
                    'activo'         => true,
                ]);

                $this->command?->info("Creado: {$cuenta['email']} ({$cuenta['slug']})");
            }
        }

        $this->command?->warn(
            'Cuentas SOLO para desarrollo local (no usar como cuentas reales). '.
            'Contraseña: variable TELCOM_DEMO_PASSWORD (por defecto "Demo123456!").'
        );
    }
}
