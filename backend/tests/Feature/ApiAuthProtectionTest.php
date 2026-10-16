<?php

namespace Tests\Feature;

use App\Models\Paquetes\SeguridadAdministracion\CU03_UsuariosRolesPermisos\Permiso;
use App\Models\Paquetes\SeguridadAdministracion\CU03_UsuariosRolesPermisos\Rol;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Etapa 2 - Protección de rutas API de TELCOM.
 *
 * Verifica que las rutas privadas exigen un token Sanctum válido y que
 * el inicio de sesión permanece público. Usa la base de datos de pruebas
 * (SQLite en memoria definida en phpunit.xml); NO toca PostgreSQL.
 */
class ApiAuthProtectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_el_login_es_publico(): void
    {
        // Sin token y sin datos: debe llegar al controlador (422 de validación),
        // no ser bloqueado por el middleware de autenticación (401).
        $this->postJson('/api/cu01/login', [])->assertStatus(422);
    }

    public function test_ruta_privada_sin_token_devuelve_401(): void
    {
        $this->getJson('/api/cu04/zonas')->assertStatus(401);
    }

    public function test_ruta_privada_con_token_invalido_devuelve_401(): void
    {
        $this->withHeader('Authorization', 'Bearer token-invalido')
            ->getJson('/api/cu04/zonas')
            ->assertStatus(401);
    }

    public function test_ruta_privada_con_token_valido_es_permitida(): void
    {
        // Ahora la ruta exige además el permiso RBAC `zonas.manage`.
        $user = User::factory()->create([
            'rol_id' => $this->rolDePrueba(['zonas.manage'])->id,
        ]);
        $token = $user->createToken('prueba-etapa2')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/cu04/zonas')
            ->assertStatus(200);
    }

    public function test_logout_y_me_estan_protegidos(): void
    {
        $this->postJson('/api/cu01/logout')->assertStatus(401);
        $this->getJson('/api/cu01/me')->assertStatus(401);
    }

    public function test_cu06_sin_token_devuelve_401(): void
    {
        $this->getJson('/api/cu06/clientes')->assertStatus(401);
    }

    public function test_flujo_login_obtiene_token_y_accede_a_ruta_privada(): void
    {
        $user = User::factory()->create([
            'password' => 'secret123',
            'rol_id'   => $this->rolDePrueba(['zonas.manage'])->id,
        ]);

        $login = $this->postJson('/api/cu01/login', [
            'email'    => $user->email,
            'password' => 'secret123',
        ]);

        $login->assertStatus(200)->assertJsonPath('success', true);

        $token = $login->json('data.token');
        $this->assertNotEmpty($token, 'El login debe devolver un token Bearer.');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/cu04/zonas')
            ->assertStatus(200);
    }

    /**
     * Crea un rol de prueba con los permisos indicados (para las pruebas de
     * autenticación, que ahora también deben satisfacer el RBAC).
     */
    private function rolDePrueba(array $slugs): Rol
    {
        $sufijo = Str::random(6);

        $rol = Rol::create([
            'nombre' => 'Rol de prueba '.$sufijo,
            'slug'   => 'rol-prueba-'.$sufijo,
            'activo' => true,
        ]);

        foreach ($slugs as $slug) {
            $permiso = Permiso::firstOrCreate(
                ['slug' => $slug],
                ['nombre' => $slug, 'modulo' => 'TEST']
            );
            $rol->permisos()->attach($permiso->id);
        }

        return $rol;
    }
}
