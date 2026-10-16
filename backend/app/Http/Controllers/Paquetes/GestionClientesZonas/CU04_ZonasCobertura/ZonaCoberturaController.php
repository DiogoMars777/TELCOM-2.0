<?php

namespace App\Http\Controllers\Paquetes\GestionClientesZonas\CU04_ZonasCobertura;

use App\Http\Controllers\Controller;
use App\Models\Paquetes\GestionClientesZonas\CU04_ZonasCobertura\ZonaCobertura;
use App\Support\AuditLogger;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ZonaCoberturaController extends Controller
{
    use ApiResponse;

    /**
     * CU04 - Listar zonas de cobertura
     */
    public function index(): JsonResponse
    {
        $zonas = ZonaCobertura::orderBy('nombre')->get();
        return $this->success($zonas, 'Zonas de cobertura obtenidas exitosamente.');
    }

    /**
     * CU04 - Crear zona de cobertura
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $this->validarZona($request);

        $zona = ZonaCobertura::create($validated);

        AuditLogger::log('CU04', 'CREAR_ZONA', "Zona {$zona->codigo} registrada.", null, [
            'id' => $zona->id, 'codigo' => $zona->codigo, 'nombre' => $zona->nombre,
        ]);

        return $this->success($zona, 'Zona de cobertura registrada exitosamente.', 201);
    }

    /**
     * CU04 - Actualizar zona de cobertura
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $zona = ZonaCobertura::findOrFail($id);

        $validated = $this->validarZona($request, $zona);

        $camposAuditables = [
            'nombre', 'ciudad', 'barrio', 'tecnologia',
            'estado_cobertura', 'capacidad_nodos', 'area_mapa', 'activo',
        ];
        $previos = $zona->only($camposAuditables);

        $zona->update($validated);

        AuditLogger::log(
            'CU04',
            'ACTUALIZAR_ZONA',
            "Zona {$zona->codigo} actualizada.",
            $previos,
            $zona->only($camposAuditables)
        );

        return $this->success($zona, 'Zona de cobertura actualizada exitosamente.');
    }

    /**
     * Reglas de validación compartidas por crear y actualizar.
     * En creación los campos base son obligatorios; en actualización son
     * opcionales (`sometimes`) para poder completar datos de zonas antiguas.
     */
    private function validarZona(Request $request, ?ZonaCobertura $zona = null): array
    {
        $esCreacion = $zona === null;
        $req = $esCreacion ? 'required' : 'sometimes';

        // `estado_cobertura` es opcional en el backend para no romper el
        // contrato existente (los registros antiguos no tienen estado). Si se
        // envía, SIEMPRE se valida contra los cuatro valores permitidos.
        $estado = $esCreacion ? [] : ['sometimes'];
        array_push($estado, 'nullable', 'string', Rule::in(ZonaCobertura::ESTADOS_COBERTURA));

        return $request->validate([
            'codigo' => $esCreacion
                ? 'required|string|max:50|unique:Zona,codigo'
                : 'sometimes|string|max:50|unique:Zona,codigo,' . $zona->idZona . ',idZona',
            'nombre'           => $req . '|string|max:150',
            'ciudad'           => $req . '|string|max:100',
            'barrio'           => 'nullable|string|max:150',
            'tecnologia'       => $req . '|string|max:100',
            'estado_cobertura' => $estado,
            'capacidad_nodos'  => $req . '|integer|min:1',
            'activo'           => 'sometimes|boolean',
            'area_mapa'        => ['nullable', 'array', $this->reglaPoligono()],
        ]);
    }

    /**
     * Regla que valida la estructura básica de un polígono GeoJSON.
     */
    private function reglaPoligono(): \Closure
    {
        return function (string $attribute, mixed $value, \Closure $fail): void {
            $error = self::validarGeometriaArea($value);
            if ($error !== null) {
                $fail($error);
            }
        };
    }

    /**
     * Valida la estructura básica de un área GeoJSON (polígono).
     * Devuelve un mensaje de error o null si es válida. Un valor null se
     * considera válido (zona sin área dibujada).
     */
    public static function validarGeometriaArea(mixed $area): ?string
    {
        if ($area === null) {
            return null;
        }

        if (!is_array($area)) {
            return 'El área del mapa no es válida.';
        }

        if (($area['type'] ?? null) !== 'Polygon') {
            return 'El área del mapa debe ser un polígono (GeoJSON tipo Polygon).';
        }

        $coords = $area['coordinates'] ?? null;
        if (!is_array($coords) || !isset($coords[0]) || !is_array($coords[0])) {
            return 'El polígono del área no tiene anillos de coordenadas.';
        }

        $anillo = $coords[0];
        if (count($anillo) < 4) {
            return 'El polígono del área necesita al menos 3 puntos (4 con el cierre).';
        }

        foreach ($anillo as $punto) {
            if (!is_array($punto) || count($punto) < 2) {
                return 'Cada punto del polígono debe tener longitud y latitud.';
            }

            $lng = $punto[0];
            $lat = $punto[1];

            if (!is_numeric($lng) || !is_numeric($lat)) {
                return 'Las coordenadas del polígono deben ser numéricas.';
            }

            if ($lng < -180 || $lng > 180 || $lat < -90 || $lat > 90) {
                return 'Las coordenadas del polígono están fuera de rango.';
            }
        }

        return null;
    }
}
