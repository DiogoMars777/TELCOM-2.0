<?php

namespace Tests\Feature;

use App\Http\Controllers\Paquetes\GestionClientesZonas\CU04_ZonasCobertura\ZonaCoberturaController;
use App\Models\Paquetes\GestionClientesZonas\CU04_ZonasCobertura\ZonaCobertura;
use App\Models\Paquetes\SeguridadAdministracion\CU03_UsuariosRolesPermisos\Rol;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * CU04 - Zonas de cobertura: campos nuevos (barrio, estado_cobertura, area_mapa).
 *
 * Se ejecuta contra SQLite en memoria con las migraciones y la matriz RBAC
 * REALES del proyecto. Verifica que la ampliación sea compatible con los
 * registros existentes y que la validación del polígono GeoJSON funcione.
 */
class ZonasCoberturaApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    private function usuarioConRol(string $slug): User
    {
        $rol = Rol::where('slug', $slug)->firstOrFail();

        return User::factory()->create([
            'rol_id' => $rol->id,
            'activo' => true,
        ]);
    }

    private function bearer(User $user): array
    {
        return [
            'Authorization' => 'Bearer ' . $user->createToken('cu04-test')->plainTextToken,
        ];
    }

    private function poligonoValido(): array
    {
        return [
            'type' => 'Polygon',
            'coordinates' => [[
                [-68.15, -16.50],
                [-68.10, -16.50],
                [-68.10, -16.45],
                [-68.15, -16.45],
                [-68.15, -16.50],
            ]],
        ];
    }

    // ---------------------------------------------------------------
    // Seguridad: esta suite NUNCA debe tocar la base de datos real
    // ---------------------------------------------------------------

    public function test_las_pruebas_usan_sqlite_en_memoria(): void
    {
        $this->assertSame('sqlite', DB::connection()->getDriverName());
        $this->assertSame(':memory:', DB::connection()->getDatabaseName());
    }

    // ---------------------------------------------------------------
    // Autenticación y autorización
    // ---------------------------------------------------------------

    public function test_sin_token_devuelve_401(): void
    {
        $this->getJson('/api/cu04/zonas')->assertStatus(401);
    }

    public function test_admin_puede_listar_zonas_sembradas(): void
    {
        $admin = $this->usuarioConRol('admin');

        $this->withHeaders($this->bearer($admin))
            ->getJson('/api/cu04/zonas')
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => [['id', 'codigo', 'nombre', 'ciudad', 'tecnologia', 'capacidad_nodos']]]);
    }

    public function test_secretaria_no_puede_crear_zona(): void
    {
        $secretaria = $this->usuarioConRol('secretaria');

        $this->withHeaders($this->bearer($secretaria))
            ->postJson('/api/cu04/zonas', [
                'codigo' => 'ZON-X',
                'nombre' => 'Zona X',
                'ciudad' => 'La Paz',
                'tecnologia' => 'FTTH GPON',
                'estado_cobertura' => 'Disponible',
                'capacidad_nodos' => 10,
            ])
            ->assertStatus(403);
    }

    // ---------------------------------------------------------------
    // Los registros antiguos conservan estado desconocido (null)
    // ---------------------------------------------------------------

    public function test_registros_antiguos_no_reciben_estado_automaticamente(): void
    {
        $norte = ZonaCobertura::where('codigo', 'ZON-NORTE')->firstOrFail();

        $this->assertNull($norte->estado_cobertura);
        $this->assertNull($norte->barrio);
        $this->assertNull($norte->area_mapa);
    }

    // ---------------------------------------------------------------
    // Creación con barrio, estado y área
    // ---------------------------------------------------------------

    public function test_admin_crea_zona_con_barrio_estado_y_area(): void
    {
        $admin = $this->usuarioConRol('admin');
        $area = $this->poligonoValido();

        $this->withHeaders($this->bearer($admin))
            ->postJson('/api/cu04/zonas', [
                'codigo' => 'ZON-ESTE',
                'nombre' => 'Zona Este',
                'ciudad' => 'La Paz',
                'barrio' => 'Sopocachi',
                'tecnologia' => 'FTTH GPON',
                'estado_cobertura' => 'Parcial',
                'capacidad_nodos' => 120,
                'area_mapa' => $area,
            ])
            ->assertStatus(201)
            ->assertJsonPath('data.barrio', 'Sopocachi')
            ->assertJsonPath('data.estado_cobertura', 'Parcial')
            ->assertJsonPath('data.area_mapa.type', 'Polygon');

        $this->assertDatabaseHas('zonas_cobertura', [
            'codigo' => 'ZON-ESTE',
            'barrio' => 'Sopocachi',
            'estado_cobertura' => 'Parcial',
        ]);

        $zona = ZonaCobertura::where('codigo', 'ZON-ESTE')->firstOrFail();
        $this->assertIsArray($zona->area_mapa);
        $this->assertSame('Polygon', $zona->area_mapa['type']);
        $this->assertCount(1, $zona->area_mapa['coordinates']);
    }

    // ---------------------------------------------------------------
    // Validaciones
    // ---------------------------------------------------------------

    public function test_rechaza_estado_de_cobertura_invalido(): void
    {
        $admin = $this->usuarioConRol('admin');

        $this->withHeaders($this->bearer($admin))
            ->postJson('/api/cu04/zonas', [
                'codigo' => 'ZON-MAL',
                'nombre' => 'Zona Mala',
                'ciudad' => 'La Paz',
                'tecnologia' => 'FTTH GPON',
                'estado_cobertura' => 'Inventado',
                'capacidad_nodos' => 10,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('estado_cobertura');
    }

    public function test_rechaza_poligono_geojson_invalido(): void
    {
        $admin = $this->usuarioConRol('admin');

        $this->withHeaders($this->bearer($admin))
            ->postJson('/api/cu04/zonas', [
                'codigo' => 'ZON-MAL2',
                'nombre' => 'Zona Mala 2',
                'ciudad' => 'La Paz',
                'tecnologia' => 'FTTH GPON',
                'estado_cobertura' => 'Disponible',
                'capacidad_nodos' => 10,
                'area_mapa' => ['type' => 'Point', 'coordinates' => [-68.1, -16.5]],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('area_mapa');
    }

    public function test_rechaza_area_con_coordenadas_fuera_de_rango(): void
    {
        $admin = $this->usuarioConRol('admin');

        $this->withHeaders($this->bearer($admin))
            ->postJson('/api/cu04/zonas', [
                'codigo' => 'ZON-MAL3',
                'nombre' => 'Zona Mala 3',
                'ciudad' => 'La Paz',
                'tecnologia' => 'FTTH GPON',
                'estado_cobertura' => 'Disponible',
                'capacidad_nodos' => 10,
                'area_mapa' => [
                    'type' => 'Polygon',
                    'coordinates' => [[
                        [-200, -16.5],
                        [-68.1, -16.5],
                        [-68.1, -16.4],
                        [-200, -16.5],
                    ]],
                ],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('area_mapa');
    }

    // ---------------------------------------------------------------
    // Actualizar una zona antigua conserva sus datos y completa el estado
    // ---------------------------------------------------------------

    public function test_actualizar_zona_antigua_conserva_datos_y_completa_estado(): void
    {
        $admin = $this->usuarioConRol('admin');
        $norte = ZonaCobertura::where('codigo', 'ZON-NORTE')->firstOrFail();

        $nombreOriginal = $norte->nombre;
        $capacidadOriginal = $norte->capacidad_nodos;

        $this->withHeaders($this->bearer($admin))
            ->putJson("/api/cu04/zonas/{$norte->id}", [
                'estado_cobertura' => 'Disponible',
                'barrio' => 'Villa Fátima',
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.estado_cobertura', 'Disponible')
            ->assertJsonPath('data.barrio', 'Villa Fátima')
            ->assertJsonPath('data.nombre', $nombreOriginal);

        $norte->refresh();
        $this->assertSame($nombreOriginal, $norte->nombre);
        $this->assertSame($capacidadOriginal, $norte->capacidad_nodos);
        $this->assertSame('Disponible', $norte->estado_cobertura);
    }

    // ---------------------------------------------------------------
    // Actualizar el área (editar y guardar) y quitarla (null)
    // ---------------------------------------------------------------

    public function test_admin_actualiza_el_area_mapa_de_una_zona_existente(): void
    {
        $admin = $this->usuarioConRol('admin');
        $norte = ZonaCobertura::where('codigo', 'ZON-NORTE')->firstOrFail();

        $areaEditada = [
            'type' => 'Polygon',
            'coordinates' => [[
                [-63.20, -17.78],
                [-63.16, -17.78],
                [-63.16, -17.81],
                [-63.20, -17.81],
                [-63.20, -17.78],
            ]],
        ];

        $this->withHeaders($this->bearer($admin))
            ->putJson("/api/cu04/zonas/{$norte->id}", ['area_mapa' => $areaEditada])
            ->assertStatus(200)
            ->assertJsonPath('data.area_mapa.type', 'Polygon');

        $norte->refresh();
        $this->assertIsArray($norte->area_mapa);
        $this->assertSame('Polygon', $norte->area_mapa['type']);
        $this->assertEquals([-63.20, -17.78], $norte->area_mapa['coordinates'][0][0]);
    }

    public function test_admin_quita_el_area_mapa_enviando_null(): void
    {
        $admin = $this->usuarioConRol('admin');
        $norte = ZonaCobertura::where('codigo', 'ZON-NORTE')->firstOrFail();
        $norte->update(['area_mapa' => $this->poligonoValido()]);

        $this->withHeaders($this->bearer($admin))
            ->putJson("/api/cu04/zonas/{$norte->id}", ['area_mapa' => null])
            ->assertStatus(200)
            ->assertJsonPath('data.area_mapa', null);

        $norte->refresh();
        $this->assertNull($norte->area_mapa);
    }

    public function test_rechaza_un_feature_collection_como_area(): void
    {
        $admin = $this->usuarioConRol('admin');
        $norte = ZonaCobertura::where('codigo', 'ZON-NORTE')->firstOrFail();

        $this->withHeaders($this->bearer($admin))
            ->putJson("/api/cu04/zonas/{$norte->id}", [
                'area_mapa' => [
                    'type' => 'FeatureCollection',
                    'features' => [[
                        'type' => 'Feature',
                        'properties' => [],
                        'geometry' => $this->poligonoValido(),
                    ]],
                ],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('area_mapa');
    }

    // ---------------------------------------------------------------
    // Validación directa de la estructura del polígono
    // ---------------------------------------------------------------

    public function test_validador_de_geometria_acepta_null_y_rechaza_estructuras_malas(): void
    {
        $validar = [ZonaCoberturaController::class, 'validarGeometriaArea'];

        $this->assertNull($validar(null));
        $this->assertNull($validar($this->poligonoValido()));
        $this->assertNotNull($validar('texto'));
        $this->assertNotNull($validar(['type' => 'Point', 'coordinates' => [0, 0]]));
        $this->assertNotNull($validar(['type' => 'Polygon', 'coordinates' => []]));
    }
}
