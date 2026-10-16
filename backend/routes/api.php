<?php

use Illuminate\Support\Facades\Route;

// CU01: Iniciar y cerrar sesión
use App\Http\Controllers\Paquetes\SeguridadAdministracion\CU01_IniciarCerrarSesion\AuthController;
use App\Http\Controllers\Paquetes\SeguridadAdministracion\CU01_IniciarCerrarSesion\RecuperarPasswordController;
// CU02: Consultar bitácora de auditoría
use App\Http\Controllers\Paquetes\SeguridadAdministracion\CU02_BitacoraAuditoria\AuditoriaController;
// CU03: Gestionar usuarios internos, roles y permisos
use App\Http\Controllers\Paquetes\SeguridadAdministracion\CU03_UsuariosRolesPermisos\UsuarioController;
use App\Http\Controllers\Paquetes\SeguridadAdministracion\CU03_UsuariosRolesPermisos\RolController;
// CU04: Gestionar zonas de cobertura
use App\Http\Controllers\Paquetes\GestionClientesZonas\CU04_ZonasCobertura\ZonaCoberturaController;
// CU05: Registrar nuevo cliente
use App\Http\Controllers\Paquetes\GestionClientesZonas\CU05_RegistrarCliente\ClienteRegistroController;
// CU06: Consultar y buscar clientes
use App\Http\Controllers\Paquetes\GestionClientesZonas\CU06_ConsultarBuscarClientes\ClienteConsultaController;
// CU07: Actualizar datos y dar baja lógica a cliente
use App\Http\Controllers\Paquetes\GestionClientesZonas\CU07_ActualizarBajaCliente\ClienteMantenimientoController;
// CU08: Registrar y activar servicio de Internet
use App\Http\Controllers\Paquetes\ServiciosPlanes\CU08_RegistrarActivarServicio\ServicioInternetController;
// CU09: Generar mensualidades de servicios
use App\Http\Controllers\Paquetes\FacturacionCobranza\CU09_GenerarMensualidades\MensualidadGeneracionController;
// CU10: Gestionar pago de mensualidad
use App\Http\Controllers\Paquetes\FacturacionCobranza\CU10_GestionarPagoMensualidad\PagoMensualidadController;
// CU11: Consultar historial de pagos
use App\Http\Controllers\Paquetes\FacturacionCobranza\CU11_ConsultarHistorialPagos\HistorialPagosController;
// CU12: Visualizar alertas de vencimiento
use App\Http\Controllers\Paquetes\FacturacionCobranza\CU12_VisualizarAlertasVencimiento\AlertasVencimientoController;
// CU13: Consultar listado de servicios para corte
use App\Http\Controllers\Paquetes\ServiciosPlanes\CU13_ListadoServiciosCorte\ServiciosCorteController;
// CU14: Registrar corte realizado
use App\Http\Controllers\Paquetes\ServiciosPlanes\CU14_RegistrarCorteRealizado\CorteRegistroController;
// CU15: Gestionar lista y registro de reactivaciones
use App\Http\Controllers\Paquetes\ServiciosPlanes\CU15_ListaRegistroReactivaciones\ReactivacionesController;
// CU16: Gestionar Planes de Internet (catálogo: entidad UML PlanInternet)
use App\Http\Controllers\Paquetes\ServiciosPlanes\CU16_GestionarCatalogoPlanes\PlanInternetController;
// CU17: Asignar o cambiar el plan de un servicio (entidad UML AsignacionPlan)
use App\Http\Controllers\Paquetes\ServiciosPlanes\CU17_AsignarCambiarPlanInternet\AsignacionPlanController;

/*
|--------------------------------------------------------------------------
| RUTAS API - TELCOM SISTEMA DE TELECOMUNICACIONES
| Estructura MVC orientada a Casos de Uso (CU01 - CU17)
|--------------------------------------------------------------------------
| - CU01 /login es la ÚNICA ruta pública (permite obtener el token).
| - CU01 /logout y /me, y TODAS las rutas CU02-CU15 exigen auth:sanctum.
| - Cada operación privada exige ADEMÁS el permiso RBAC correspondiente
|   (middleware `permission:<slug>`), resuelto contra `roles`, `permisos`
|   y `rol_permiso`. Sin permiso -> HTTP 403.
|--------------------------------------------------------------------------
*/

// CU01: Iniciar y cerrar sesión
Route::prefix('cu01')->group(function () {
    // Pública: necesaria para obtener el token Bearer
    Route::post('/login', [AuthController::class, 'login'])->middleware('login.throttle');
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
    Route::get('/me', [AuthController::class, 'me'])->middleware('auth:sanctum');

    // Recuperación de contraseña
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);

    // Cambiar la contraseña del usuario AUTENTICADO. Todos los roles internos
    // (Administrador, Secretaría y Soporte Técnico) poseen `auth.login`, por lo
    // que pueden usar esta operación; el controlador actúa SIEMPRE sobre el
    // usuario de la sesión e ignora cualquier id del cuerpo.
    Route::post('/cambiar-password', [AuthController::class, 'changePassword'])
        ->middleware(['auth:sanctum', 'permission:auth.login']);

    // Recuperación de contraseña por correo (público con limitación de tasa)
    Route::middleware('throttle:10,1')->group(function () {
        Route::post('/recuperar-password/solicitar', [RecuperarPasswordController::class, 'solicitar']);
        Route::post('/recuperar-password/verificar-codigo', [RecuperarPasswordController::class, 'verificarCodigo']);
        Route::post('/recuperar-password/restablecer', [RecuperarPasswordController::class, 'restablecer']);
    });
});

// CU02: Consultar bitácora de auditoría (solo administrador)
Route::prefix('cu02')->middleware(['auth:sanctum', 'permission:auditoria.view'])->group(function () {
    Route::get('/auditoria', [AuditoriaController::class, 'index']);
    Route::get('/auditoria/usuarios', [AuditoriaController::class, 'usuarios']);
});

// CU03: Gestionar usuarios internos, roles y permisos (solo administrador)
// CU03: Gestionar usuarios internos, roles y permisos (solo administrador)
Route::prefix('cu03')->middleware(['auth:sanctum', 'permission:usuarios.manage'])->group(function () {
    Route::get('/usuarios', [UsuarioController::class, 'index']);
    Route::post('/usuarios', [UsuarioController::class, 'store']);
    Route::put('/usuarios/{id}/rol', [UsuarioController::class, 'updateRoles']);
    Route::put('/usuarios/{id}', [UsuarioController::class, 'update'])->whereNumber('id');

    // Matriz editable de roles -> permisos.
    Route::get('/roles', [RolController::class, 'index']);
    Route::put('/roles/{id}/permisos', [RolController::class, 'updatePermisos'])->whereNumber('id');
});

// CU04: Gestionar zonas de cobertura (solo administrador)
Route::prefix('cu04')->middleware(['auth:sanctum', 'permission:zonas.manage'])->group(function () {
    Route::get('/zonas', [ZonaCoberturaController::class, 'index']);
    Route::post('/zonas', [ZonaCoberturaController::class, 'store']);
    Route::put('/zonas/{id}', [ZonaCoberturaController::class, 'update']);
});

// CU05: Registrar nuevo cliente (administrador, secretaría)
Route::prefix('cu05')->middleware(['auth:sanctum', 'permission:clientes.create'])->group(function () {
    // Catálogo de zonas para el formulario de registro (mismo permiso que la
    // operación: quien puede registrar un cliente debe poder elegir su zona).
    Route::get('/zonas', [ZonaCoberturaController::class, 'index']);
    Route::post('/clientes', [ClienteRegistroController::class, 'store']);
});

// CU06: Consultar y buscar clientes (admin, secretaría, técnico)
Route::prefix('cu06')->middleware(['auth:sanctum', 'permission:clientes.view'])->group(function () {
    Route::get('/clientes', [ClienteConsultaController::class, 'index']);
    Route::get('/clientes/{id}', [ClienteConsultaController::class, 'show']);
});

// CU07: Actualizar datos y dar baja lógica a cliente (admin, secretaría)
Route::prefix('cu07')->middleware(['auth:sanctum', 'permission:clientes.update'])->group(function () {
    Route::put('/clientes/{id}', [ClienteMantenimientoController::class, 'update']);
    Route::delete('/clientes/{id}/baja', [ClienteMantenimientoController::class, 'bajaLogica']);
});

// CU08: Registrar y activar servicio de Internet
Route::prefix('cu08')->group(function () {
    // Consulta: admin, secretaría, técnico
    Route::get('/servicios', [ServicioInternetController::class, 'index'])
        ->middleware(['auth:sanctum', 'permission:servicios.view']);
    // Registro / activación administrativa: admin, secretaría
    Route::get('/servicios/{id}', [ServicioInternetController::class, 'show'])
        ->whereNumber('id')
        ->middleware(['auth:sanctum', 'permission:servicios.view']);
    Route::get('/zonas', [ZonaCoberturaController::class, 'index'])
        ->middleware(['auth:sanctum', 'permission:servicios.manage']);
    Route::get('/planes', [PlanInternetController::class, 'index'])
        ->middleware(['auth:sanctum', 'permission:servicios.manage']);
    Route::post('/servicios', [ServicioInternetController::class, 'store'])
        ->middleware(['auth:sanctum', 'permission:servicios.manage']);
    Route::put('/servicios/{id}', [ServicioInternetController::class, 'update'])
        ->whereNumber('id')
        ->middleware(['auth:sanctum', 'permission:servicios.manage']);
    Route::put('/servicios/{id}/activar', [ServicioInternetController::class, 'activar'])
        ->middleware(['auth:sanctum', 'permission:servicios.manage']);
});

// CU09: Generar mensualidades de servicios (admin, secretaría)
Route::prefix('cu09')->group(function () {
    Route::get('/mensualidades', [MensualidadGeneracionController::class, 'index'])
        ->middleware(['auth:sanctum', 'permission:mensualidades.view']);
    Route::post('/mensualidades/generar', [MensualidadGeneracionController::class, 'generar'])
        ->middleware(['auth:sanctum', 'permission:mensualidades.generate']);
});

// CU10: Gestionar pago de mensualidad y portal cliente
Route::prefix('cu10')->group(function () {
    // Portal de autoservicio para clientes (consulta por C.I. y pago en línea por QR, Transferencia y PayPal)
    Route::get('/portal-cliente/consultar/{ci}', [PagoMensualidadController::class, 'consultarPorCI']);
    Route::post('/portal-cliente/pagar', [PagoMensualidadController::class, 'pagarEnLinea']);

    // Cobranza interna y caja (requiere autenticación y permisos)
    Route::middleware(['auth:sanctum', 'permission:pagos.register'])->group(function () {
        Route::get('/pendientes', [PagoMensualidadController::class, 'pendientes']);
        Route::post('/pagos', [PagoMensualidadController::class, 'store']);
    });
});

// CU11: Consultar historial de pagos (admin, secretaría)
Route::prefix('cu11')->middleware(['auth:sanctum', 'permission:pagos.history'])->group(function () {
    Route::get('/historial/filtros', [HistorialPagosController::class, 'filtros']);
    Route::get('/historial', [HistorialPagosController::class, 'index']);
    Route::get('/historial/{id}', [HistorialPagosController::class, 'show'])->whereNumber('id');
});

// CU12: Visualizar alertas de vencimiento (admin, secretaría)
Route::prefix('cu12')->middleware(['auth:sanctum', 'permission:alertas.view'])->group(function () {
    Route::get('/alertas', [AlertasVencimientoController::class, 'index']);
});

// CU13: Consultar listado de servicios para corte (admin, secretaría)
Route::prefix('cu13')->middleware(['auth:sanctum', 'permission:cortes.list'])->group(function () {
    Route::get('/servicios-corte', [ServiciosCorteController::class, 'index']);
});

// CU14: Registrar corte realizado (admin, secretaría)
Route::prefix('cu14')->middleware(['auth:sanctum', 'permission:cortes.register'])->group(function () {
    Route::post('/cortes', [CorteRegistroController::class, 'store']);
});

// CU15: Gestionar lista y registro de reactivaciones (admin, secretaría)
Route::prefix('cu15')->middleware(['auth:sanctum', 'permission:reactivaciones.manage'])->group(function () {
    Route::get('/reactivaciones', [ReactivacionesController::class, 'index']);
    Route::post('/reactivaciones', [ReactivacionesController::class, 'store']);
});

/*
|--------------------------------------------------------------------------
| CU16 - PLANES DE INTERNET (catálogo; entidad UML PlanInternet)
|--------------------------------------------------------------------------
| Se reutilizan los permisos REALES ya existentes en la matriz RBAC:
|   - planes.view   -> consultar el catálogo (admin, secretaría).
|   - planes.assign -> crear/editar/activar/desactivar (admin, secretaría).
| El técnico NO los tiene: el middleware `permission` devuelve HTTP 403.
| El contrato de `/planes` (GET) ya lo consume CU08 -> no cambia.
| Un plan nunca se borra: DELETE = baja lógica (`activo = false`).
*/
Route::prefix('planes')->group(function () {
    // Consultar / buscar (admin y secretaría).
    Route::get('/', [PlanInternetController::class, 'index'])
        ->middleware(['auth:sanctum', 'permission:planes.view']);
    Route::get('/{id}', [PlanInternetController::class, 'show'])
        ->whereNumber('id')
        ->middleware(['auth:sanctum', 'permission:planes.view']);

    Route::post('/', [PlanInternetController::class, 'store'])
        ->middleware(['auth:sanctum', 'permission:planes.assign']);
    Route::put('/{id}', [PlanInternetController::class, 'update'])
        ->whereNumber('id')
        ->middleware(['auth:sanctum', 'permission:planes.assign']);
    Route::delete('/{id}', [PlanInternetController::class, 'destroy'])
        ->whereNumber('id')
        ->middleware(['auth:sanctum', 'permission:planes.assign']);
    Route::put('/{id}/activar', [PlanInternetController::class, 'activar'])
        ->whereNumber('id')
        ->middleware(['auth:sanctum', 'permission:planes.assign']);
    Route::put('/{id}/desactivar', [PlanInternetController::class, 'desactivar'])
        ->whereNumber('id')
        ->middleware(['auth:sanctum', 'permission:planes.assign']);
});

/*
|--------------------------------------------------------------------------
| CU17 - ASIGNAR / CAMBIAR EL PLAN DE UN SERVICIO (entidad AsignacionPlan)
|--------------------------------------------------------------------------
| Historial que nunca se sobrescribe. Se mantiene la ruta existente
| `cu08/servicios/{servicio}/planes` porque es el contrato que ya consume el
| frontend (CU08 y CU17); solo cambia el controlador al de CU17.
|   - planes.view   -> consultar el historial.
|   - planes.assign -> asignar/cambiar plan (admin, secretaría).
*/
Route::prefix('cu08/servicios/{servicio}/planes')->group(function () {
    Route::get('/', [AsignacionPlanController::class, 'index'])
        ->middleware(['auth:sanctum', 'permission:planes.view']);
    Route::post('/', [AsignacionPlanController::class, 'store'])
        ->middleware(['auth:sanctum', 'permission:planes.assign']);
});
