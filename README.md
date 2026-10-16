# 📡 SISTEMA DE TELECOMUNICACIONES (TELCOM)

### 🏗️ Arquitectura MVC orientada a Casos de Uso — **CU01 … CU17**

- **Backend:** Laravel `^13.17` (PHP `^8.3`) + PostgreSQL + Sanctum `^4.0`
- **Frontend:** React `^19.2.8` + Vite `^8.3.0`
- **Base de Datos:** PostgreSQL 16+
- **Alcance de este documento:** ciclo **2 de 4**. Se documentan **solo los casos de uso CU01–CU17**. Los casos CU18–CU31 **no** se documentan aquí.

> **Guía para diagramas UML.** Este documento está pensado para elaborar **diagramas de comunicación** y **diagramas de análisis de clases** por caso de uso. Todos los nombres (clases, métodos, rutas, tablas, columnas, permisos) fueron **verificados en el código fuente**. Lo que es **inferencia** (no verificable literalmente en código) se marca como tal. Lo que no existe en el código se marca `NO ENCONTRADO / SIN INFORMACIÓN`.

---

## 📑 Índice

| CU | Caso de uso | Paquete funcional |
| :--- | :--- | :--- |
| [CU01](#cu01) | Iniciar y cerrar sesión | Seguridad y Auditoría |
| [CU02](#cu02) | Consultar bitácora de auditoría | Seguridad y Auditoría |
| [CU03](#cu03) | Gestionar usuarios, roles y permisos | Seguridad y Auditoría |
| [CU04](#cu04) | Gestionar zonas de cobertura | Gestión de Clientes y Zonas |
| [CU05](#cu05) | Registrar nuevo cliente | Gestión de Clientes y Zonas |
| [CU06](#cu06) | Consultar y buscar clientes | Gestión de Clientes y Zonas |
| [CU07](#cu07) | Actualizar datos y dar de baja lógica a cliente | Gestión de Clientes y Zonas |
| [CU08](#cu08) | Registrar y activar servicio de Internet | Servicios y Planes |
| [CU09](#cu09) | Generar mensualidades | Facturación y Cobranza |
| [CU10](#cu10) | Gestionar pago de mensualidad | Facturación y Cobranza |
| [CU11](#cu11) | Consultar historial de pagos | Facturación y Cobranza |
| [CU12](#cu12) | Visualizar alertas de vencimiento | Facturación y Cobranza |
| [CU13](#cu13) | Consultar servicios para corte | Servicios y Planes |
| [CU14](#cu14) | Registrar corte realizado | Servicios y Planes |
| [CU15](#cu15) | Gestionar reactivaciones | Servicios y Planes |
| [CU16](#cu16) | Gestionar catálogo de planes de Internet | Servicios y Planes |
| [CU17](#cu17) | Asignar o cambiar plan de Internet | Servicios y Planes |

Otros apartados: [Convenciones](#convenciones) · [Instalación y ejecución](#instalación) · [Mapa global de rutas y permisos](#rutas) · [Modelo de datos](#datos).

---

<a id="convenciones"></a>
## 0. Convenciones y método

### 0.1 Cómo leer cada ficha
Cada caso de uso incluye: (1) objetivo y estado, (2) actores y permisos reales, (3) flujo / precondiciones / resultado / errores, (4) **componentes para el diagrama de comunicación**, (5) **mensajes numerados**, (6) **elementos para el diagrama de análisis de clases**, (7) validaciones y campos, (8) referencias para comprobar.

### 0.2 Estado de implementación
Los **17** casos de uso tienen backend (controlador + modelo + ruta + permiso), frontend (vista + hook controlador + modelo/servicio API) y entrada de menú donde corresponde. Estado global: **Implementado (verificado en código)**.

### 0.3 Nombres oficiales vs. nombres solicitados
Se usa el **nombre que aparece en el código** (comentarios de ruta y controladores). Diferencias con los nombres «de catálogo»:

| CU | Nombre solicitado / de catálogo | Nombre oficial en el código | Nota |
| :--- | :--- | :--- | :--- |
| CU03 | Gestionar usuarios, roles y permisos | **Gestionar usuarios internos, roles y permisos** | El código dice «internos». |
| CU09 | Generar mensualidades | **Generar mensualidades de servicios** | Comentario en `routes/api.php`. |
| CU13 | Consultar servicios para corte | **Consultar listado de servicios para corte** | Comentario en `routes/api.php` y controlador. |
| CU15 | Gestionar reactivaciones | **Gestionar lista y registro de reactivaciones** | Comentario en `routes/api.php`. |
| CU16 | Gestionar catálogo de planes de Internet | **Gestionar Planes de Internet (catálogo: entidad UML `PlanInternet`)** | Comentario en `routes/api.php`. |
| CU17 | Asignar o cambiar plan de Internet | **Asignar o cambiar el plan de un servicio** | Comentario en `routes/api.php` (entidad UML `AsignacionPlan`). |

> Las **etiquetas del menú** del frontend (`App.jsx`) son abreviaturas de los nombres anteriores (p. ej. `CU08` → «Registrar / Activar Servicio», `CU16` → «Gestionar Planes de Internet», `CU17` → «Asignar / Cambiar Plan de Servicio»). Se listan por separado en cada ficha porque **no** coinciden palabra por palabra con el nombre oficial del CU.

### 0.4 Diferencia importante: tablas base vs. vistas de compatibilidad
La migración `backend/database/migrations/0001_01_01_000000_create_telcom_28_tablas.php` crea **tablas base** (p. ej. `PlanInternet`, `AsignacionPlan`, `EstadoServicio`, `ServicioInternet`, `AccionServicio`) **y también** vistas SQL de compatibilidad en snake_case (`planes_internet`, `asignaciones_plan`, `estados_servicio`, `servicios_internet`, `cortes_servicio`, `reactivaciones_servicio`, …). **Los modelos Eloquent apuntan a las tablas base**, no a las vistas. Donde el catálogo previo mencionaba las vistas, aquí se usa la **tabla base real del modelo**.

### 0.5 Alias de columnas
Varios modelos usan **accessors/mutators alias** (camelCase ↔ snake_case) y un `newEloquentBuilder()` que traduce nombres de columnas. En las tablas de entidades se indica el `$table` real y, cuando aplica, el **alias** con el que se escribe/lee.

---

<a id="instalación"></a>
## 1. Instalación y ejecución

### 1.1 Backend (Laravel + PostgreSQL)
Requisitos: PHP `^8.3`, Composer, PostgreSQL 16+.

En `backend/.env`:
```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=telcom_db
DB_USERNAME=postgres
DB_PASSWORD=tu_contraseña
```

Instalar y levantar:
```bash
cd backend
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```
El backend queda en `http://localhost:8000` (la API bajo `http://localhost:8000/api`).

### 1.2 Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
El frontend queda en `http://localhost:5173`. El cliente HTTP (`frontend/src/services/apiClient.js`) usa `VITE_API_URL` o `http://localhost:8000/api` por defecto.

### 1.3 Usuarios y roles
Roles sembrados por `DatabaseSeeder`: **Administrador** (`admin`), **Secretaría** (`secretaria`), **Técnico** (`tecnico`). Usuario admin base: correo `admin@telcom.com`.

Cuentas de demostración (**solo local**, seeder separado `DemoUsersSeeder`, **no** forma parte de `DatabaseSeeder` ni corre en producción):

| Rol | Correo |
| --- | --- |
| Administrador | `admin.demo@telcom.local` |
| Secretaría | `secretaria.demo@telcom.local` |
| Técnico | `tecnico.demo@telcom.local` |

```bash
cd backend
php artisan db:seed --class=DemoUsersSeeder
```
La contraseña se toma de `TELCOM_DEMO_PASSWORD` (por defecto `Demo123456!`). Para restablecer contraseñas demo: definir `TELCOM_DEMO_RESET_PASSWORD=true`.

> El menú del frontend se filtra con los permisos que el backend devuelve en `GET /api/cu01/me`; **el backend sigue autorizando** cada operación (HTTP 401/403).

### 1.4 Pruebas, lint y build
```bash
# Backend (usa SQLite en memoria según phpunit.xml; no toca PostgreSQL)
cd backend && php artisan test

# Frontend
cd frontend && npm test      # node --test
cd frontend && npm run lint  # oxlint
cd frontend && npm run build # vite build
```

---

<a id="rutas"></a>
## 2. Mapa global de rutas y permisos

Prefijo común `/api`. Autenticación: Sanctum (`auth:sanctum`). Autorización: middleware `permission:<slug>` (clase `App\Http\Middleware\EnsurePermission`). La única ruta pública de CU01 es `login`; `cu10/portal-cliente/*` también es público (portal de autoservicio).

| CU | Método | Ruta | Permiso | Controlador (método) |
| :-- | :-- | :-- | :-- | :-- |
| CU01 | POST | `/api/cu01/login` | *(público)* | `AuthController@login` |
| CU01 | POST | `/api/cu01/logout` | `auth:sanctum` | `AuthController@logout` |
| CU01 | GET | `/api/cu01/me` | `auth:sanctum` | `AuthController@me` |
| CU01 | POST | `/api/cu01/cambiar-password` | `auth.login` | `AuthController@changePassword` |
| CU01 | POST | `/api/cu01/recuperar-password/solicitar` | *(público, throttle)* | `RecuperarPasswordController@solicitar` |
| CU01 | POST | `/api/cu01/recuperar-password/verificar-codigo` | *(público, throttle)* | `RecuperarPasswordController@verificarCodigo` |
| CU01 | POST | `/api/cu01/recuperar-password/restablecer` | *(público, throttle)* | `RecuperarPasswordController@restablecer` |
| CU02 | GET | `/api/cu02/auditoria` | `auditoria.view` | `AuditoriaController@index` |
| CU02 | GET | `/api/cu02/auditoria/usuarios` | `auditoria.view` | `AuditoriaController@usuarios` |
| CU03 | GET | `/api/cu03/usuarios` | `usuarios.manage` | `UsuarioController@index` |
| CU03 | POST | `/api/cu03/usuarios` | `usuarios.manage` | `UsuarioController@store` |
| CU03 | PUT | `/api/cu03/usuarios/{id}/rol` | `usuarios.manage` | `UsuarioController@updateRoles` |
| CU03 | PUT | `/api/cu03/usuarios/{id}` | `usuarios.manage` | `UsuarioController@update` |
| CU03 | GET | `/api/cu03/roles` | `usuarios.manage` | `RolController@index` |
| CU03 | PUT | `/api/cu03/roles/{id}/permisos` | `usuarios.manage` | `RolController@updatePermisos` |
| CU04 | GET | `/api/cu04/zonas` | `zonas.manage` | `ZonaCoberturaController@index` |
| CU04 | POST | `/api/cu04/zonas` | `zonas.manage` | `ZonaCoberturaController@store` |
| CU04 | PUT | `/api/cu04/zonas/{id}` | `zonas.manage` | `ZonaCoberturaController@update` |
| CU05 | GET | `/api/cu05/zonas` | `clientes.create` | `ZonaCoberturaController@index` |
| CU05 | POST | `/api/cu05/clientes` | `clientes.create` | `ClienteRegistroController@store` |
| CU06 | GET | `/api/cu06/clientes` | `clientes.view` | `ClienteConsultaController@index` |
| CU06 | GET | `/api/cu06/clientes/{id}` | `clientes.view` | `ClienteConsultaController@show` |
| CU07 | PUT | `/api/cu07/clientes/{id}` | `clientes.update` | `ClienteMantenimientoController@update` |
| CU07 | DELETE | `/api/cu07/clientes/{id}/baja` | `clientes.update` | `ClienteMantenimientoController@bajaLogica` |
| CU08 | GET | `/api/cu08/servicios` | `servicios.view` | `ServicioInternetController@index` |
| CU08 | POST | `/api/cu08/servicios` | `servicios.manage` | `ServicioInternetController@store` |
| CU08 | PUT | `/api/cu08/servicios/{id}/activar` | `servicios.manage` | `ServicioInternetController@activar` |
| CU09 | GET | `/api/cu09/mensualidades` | `mensualidades.view` | `MensualidadGeneracionController@index` |
| CU09 | POST | `/api/cu09/mensualidades/generar` | `mensualidades.generate` | `MensualidadGeneracionController@generar` |
| CU10 | GET | `/api/cu10/pendientes` | `pagos.register` | `PagoMensualidadController@pendientes` |
| CU10 | POST | `/api/cu10/pagos` | `pagos.register` | `PagoMensualidadController@store` |
| CU10 | GET | `/api/cu10/portal-cliente/consultar/{ci}` | *(público)* | `PagoMensualidadController@consultarPorCI` |
| CU10 | POST | `/api/cu10/portal-cliente/pagar` | *(público)* | `PagoMensualidadController@pagarEnLinea` |
| CU11 | GET | `/api/cu11/historial` | `pagos.history` | `HistorialPagosController@index` |
| CU12 | GET | `/api/cu12/alertas` | `alertas.view` | `AlertasVencimientoController@index` |
| CU13 | GET | `/api/cu13/servicios-corte` | `cortes.list` | `ServiciosCorteController@index` |
| CU14 | POST | `/api/cu14/cortes` | `cortes.register` | `CorteRegistroController@store` |
| CU15 | GET | `/api/cu15/reactivaciones` | `reactivaciones.manage` | `ReactivacionesController@index` |
| CU15 | POST | `/api/cu15/reactivaciones` | `reactivaciones.manage` | `ReactivacionesController@store` |
| CU16 | GET | `/api/planes` | `planes.view` | `PlanInternetController@index` |
| CU16 | GET | `/api/planes/{id}` | `planes.view` | `PlanInternetController@show` |
| CU16 | POST | `/api/planes` | `planes.assign` | `PlanInternetController@store` |
| CU16 | PUT | `/api/planes/{id}` | `planes.assign` | `PlanInternetController@update` |
| CU16 | DELETE | `/api/planes/{id}` | `planes.assign` | `PlanInternetController@destroy` |
| CU17 | GET | `/api/cu08/servicios/{servicio}/planes` | `planes.view` | `AsignacionPlanController@index` |
| CU17 | POST | `/api/cu08/servicios/{servicio}/planes` | `planes.assign` | `AsignacionPlanController@store` |

### 2.1 Permisos RBAC (slugs reales)
`auth.login`, `auditoria.view`, `usuarios.manage`, `zonas.manage`, `clientes.create`, `clientes.view`, `clientes.update`, `servicios.view`, `servicios.manage`, `mensualidades.view`, `mensualidades.generate`, `pagos.register`, `pagos.history`, `alertas.view`, `cortes.list`, `cortes.register`, `reactivaciones.manage`, `planes.view`, `planes.assign`.

### 2.2 Componentes transversales
| Componente | Archivo | Responsabilidad |
| :--- | :--- | :--- |
| `App\Traits\ApiResponse` | `backend/app/Traits/ApiResponse.php` | Envoltura estándar `{success, message, data}` / `{success:false, message, errors}` |
| `App\Support\AuditLogger` | `backend/app/Support/AuditLogger.php` | `log($modulo,$accion,$detalles,$previos,$nuevos,$userId)` → escribe `BitacoraAuditoria` |
| `App\Http\Middleware\EnsurePermission` | `backend/app/Http/Middleware/EnsurePermission.php` | Autoriza por slug; 403 si falta |
| `apiClient` / `authToken` | `frontend/src/services/apiClient.js` | Cliente HTTP con token Bearer y manejo de 401/403 |
| `CU_PERMISSIONS` / `canAccessCu` | `frontend/src/config/access.js` | Filtra el menú por permisos reales |

---

<a id="datos"></a>
## 3. Modelo de datos (tablas base verificadas)

De `0001_01_01_000000_create_telcom_28_tablas.php`. Solo se listan las tablas usadas por CU01–CU17.

| Tabla | Clave primaria | Columnas relevantes |
| :--- | :--- | :--- |
| `Usuario` | `idUsuario` | `nombreUsuario`, `passwordHash`, `nombreCompleto`, `telefono`, `correo`, `activo`, `fechaCreacion`, `idRol` |
| `Rol` | `idRol` | `nombre`, `descripcion`, `slug`, `activo` |
| `Permiso` | `idPermiso` | `nombre`, `descripcion`, `slug`, `modulo` |
| `RolPermiso` | `idRolPermiso` | `idRol`, `idPermiso` |
| `Bitacora` | `idBitacora` | `fechaHora`, `accion`, `modulo`, `descripcion`, `idUsuario`, `ipOrigen`, `datosPrevios`, `datosNuevos` |
| `user_sessions` | `id` | `user_id`, `ip_address`, `user_agent`, `login_at`, `logout_at`, `is_active` |
| `Zona` | `idZona` | `nombreZona`, `descripcion`, `estado`, `codigo`, `ciudad`, `tecnologia`, `capacidadNodos`, `barrio`, `estadoCobertura`, `areaMapa` |
| `Cliente` | `idCliente` | `codigoCliente`, `ci`, `nombreCompleto`, `telefonoPrincipal`, `telefonoSecundario`, `correo`, `direccion`, `fechaRegistro`, `estadoCliente`, `idZona`, `fechaBaja`, `motivoBaja` |
| `PlanInternet` | `idPlan` | `nombrePlan`, `velocidadMbps`, `precioMensual`, `descripcion`, `activo` |
| `EstadoServicio` | `idEstadoServicio` | `nombreEstado`, `descripcion` |
| `ServicioInternet` | `idServicio` | `fechaActivacion`, `fechaCorteBase`, `usuarioWinbox`, `direccion`, `referencia`, `latitud`, `longitud`, `observacion`, `idCliente`, `idEstadoServicio`, `idZona`, `codigoServicio`, `ipAsignada`, `macRouter`, `diaCorte` |
| `AsignacionPlan` | `idAsignacionPlan` | `fechaInicio`, `fechaFin`, `precioAplicado`, `motivoCambio`, `idServicio`, `idPlan`, `idUsuario` |
| `AccionServicio` | `idAccion` | `tipoAccion`, `fechaSolicitud`, `fechaEjecucion`, `estado`, `motivo`, `observacion`, `idServicio`, `idUsuario` |
| `Mensualidad` | `idMensualidad` | `periodo`, `fechaVencimiento`, `monto`, `estado`, `idServicio`, `codigoFactura`, `fechaEmision`, `idCliente` |
| `MetodoPago` | `idMetodoPago` | `nombreMetodo`, `descripcion`, `estado` |
| `Pago` | `idPago` | `fechaHora`, `montoTotal`, `numeroComprobante`, `observacion`, `idUsuario`, `idMetodoPago` |
| `DetallePago` | `idDetallePago` | `subtotal`, `montoAplicado`, `idPago`, `idMensualidad` |

Relaciones clave verificadas:
- `PlanInternet [1] → AsignacionPlan [0..*]` (FK `AsignacionPlan.idPlan`, `restrictOnDelete`).
- `ServicioInternet [1] → AsignacionPlan [1..*]` (historial que nunca se sobrescribe).
- `ServicioInternet [1] → Mensualidad [0..*]`; `Cliente [1] → Mensualidad [0..*]`.
- `Pago [1] → DetallePago [*]`; `Mensualidad [1] → DetallePago [*]`.
- `Usuario [1] → AsignacionPlan [0..*]` (asociación UML «registra»).

> Nota `AccionServicio`: los modelos `RegistroCorte` (CU14) y `ReactivacionServicio` (CU15) apuntan a la **misma** tabla `AccionServicio`, discriminada por la columna `tipoAccion` (`'CORTE'` / `'REACTIVACION'`) mediante un *global scope*.

---

<a id="cu01"></a>
## 4. CU01 — Iniciar y cerrar sesión

**1. Objetivo y estado.** Autenticar al usuario, emitir token, exponer usuario/permisos, cerrar sesión y gestionar contraseña y recuperación. **Implementado (verificado).**

**2. Actores y permisos.**
| Actor | Acceso | Permiso |
| :--- | :--- | :--- |
| Usuario interno | Login / logout / me / cambiar su contraseña | `auth.login` (para cambiar contraseña); login público |
| Visitante | Recuperar contraseña | *(público, throttle 10/min)* |

**3. Flujo / precondiciones / resultado / errores.**
- **Login:** precondición: cuenta existente y activa. Resultado: token Sanctum + `user` con `permisos[]`. Errores: `401 Credenciales incorrectas.`, `403 Tu cuenta está desactivada. Contacta al administrador.`
- **Logout:** revoca token actual y cierra `user_sessions`. `Sesión finalizada exitosamente.`
- **Cambiar contraseña:** verifica contraseña actual, política `min:8 + mayúscula + minúscula + número + (!@#$%&*)` y confirmación. Afecta solo al usuario de sesión.
- **Recuperación:** `solicitar` (código 6 dígitos, hash SHA-256, expira en 60 min) → `verificar-codigo` → `restablecer`.

**4. Componentes para el diagrama de comunicación.**
| Elemento | Nombre exacto | Archivo |
| :--- | :--- | :--- |
| Actor | Usuario interno / Visitante | — |
| Vista/Frontera | `LoginView`, `SesionView`, `CambiarPasswordView`, `RecuperarPasswordView` | `frontend/src/views/Paquetes/SeguridadAdministracion/CU01_IniciarCerrarSesion/*` |
| Controlador frontend | `useAuthController`, `useCambiarPasswordController`, `useRecuperarPasswordController`, `authBootstrap.runAuthBootstrap` | `frontend/src/controllers/.../CU01_IniciarCerrarSesion/*` |
| Servicio/Modelo API | `authService` (y `authToken`) | `frontend/src/models/.../CU01_IniciarCerrarSesion/authModel.js` |
| Ruta HTTP | `/api/cu01/login`, `/logout`, `/me`, `/cambiar-password`, `/recuperar-password/*` | `backend/routes/api.php` |
| Controlador backend | `AuthController`, `RecuperarPasswordController` | `backend/app/Http/Controllers/.../CU01_IniciarCerrarSesion/` |
| Modelos | `User`, `UserSession` | `backend/app/Models/User.php`, `.../CU01.../UserSession.php` |
| Tablas | `Usuario`, `user_sessions`, `password_reset_tokens`, `Bitacora` | migración |

**5. Mensajes numerados (login).**
1. `Actor → LoginView`: introduce correo y contraseña y envía.
2. `LoginView → useAuthController`: `handleSubmit`.
3. `useAuthController → authService`: `login(credentials)`.
4. `authService → apiClient`: `POST /cu01/login`.
5. `apiClient → AuthController`: `login(Request)`.
6. `AuthController → User`: verifica credenciales (`Hash::check`) y `activo`.
7. `AuthController → UserSession`: `create(login_at, ip, user_agent, is_active=true)`.
8. `AuthController → AuditLogger`: `log('CU01','INICIAR_SESION', …)`.
9. `AuthController → apiClient`: `200 {user, token}`.
10. `apiClient → authService → useAuthController → LoginView`: `onLoginSuccess(user)` → `App` (`handleLoginSuccess`) fija `currentUser` y primer CU permitido.

**Logout:** `11. SesionView/App → authService.logout → POST /cu01/logout → AuthController@logout → revoca token + cierra UserSession + auditoría → 200`.

**6. Elementos para el diagrama de análisis de clases.**
| Clase/artefacto | Archivo | Responsabilidad | Métodos / estado | Relaciones |
| :--- | :--- | :--- | :--- | :--- |
| `AuthController` | `.../CU01.../AuthController.php` | Autenticación y sesión | `login`, `logout`, `me`, `changePassword`, `presentUser` | usa `User`, `UserSession`, `AuditLogger` |
| `RecuperarPasswordController` | `.../CU01.../RecuperarPasswordController.php` | Recuperación | `solicitar`, `verificarCodigo`, `restablecer` | usa `User`, `password_reset_tokens` |
| `User` | `backend/app/Models/User.php` | Identidad y RBAC | `rol()`, `hasPermission()`, `permisosSlugs()`; `$table='Usuario'` | `rol → Rol` |
| `UserSession` | `.../CU01.../UserSession.php` | Registro de sesión | `user()`; `$table='user_sessions'` | `user → User` |
| `useAuthController` | `.../useAuthController.js` | Estado del formulario | `credentials, loading, error, handleChange, handleSubmit` | usa `authService` |
| `LoginView` | `.../LoginView.jsx` | Frontera | props `{onLoginSuccess,onBack}` | usa `useAuthController` |
| `authService` | `.../authModel.js` | Adaptador API | `login`, `logout`, `fetchCurrentUser`, `cambiarPassword`, `solicitarRecuperacionPassword`, `verificarCodigoRecuperacion`, `restablecerPassword` | usa `apiClient` |

**7. Validaciones y campos.** `login`: `email required|email`, `password required|string|min:6`. `cambiar-password`: `current_password required|string`, `new_password required|string|min:8|regex(...)|confirmed`. `solicitar/verificar/restablecer`: `email required|email`, `codigo required|string`, `password min:8 + regex + confirmed`.

**8. Referencias.** `backend/routes/api.php:56-75`; `AuthController.php:23-197`; `RecuperarPasswordController.php`; `frontend/src/config/access.js` (`CU01: null`, `CU01_PASSWORD: 'auth.login'`); `frontend/src/config/passwordPolicy.js`.

---

<a id="cu02"></a>
## 5. CU02 — Consultar bitácora de auditoría

**1. Objetivo y estado.** Consultar la bitácora con filtros y listar usuarios que aparecen en ella. **Implementado (verificado).**

**2. Actores y permisos.** Actor: Administrador. Permiso: `auditoria.view` (solo administrador).

**3. Flujo / precondiciones / resultado / errores.** Precondición: sesión con `auditoria.view`. Resultado: página (20) de `BitacoraAuditoria` con usuario cargado. Filtros: `user_id`, `modulo`, `accion`, `fecha_desde`, `fecha_hasta`. Mensaje: `Bitácora de auditoría consultada correctamente.`

**4. Componentes para el diagrama de comunicación.**
| Elemento | Nombre exacto | Archivo |
| :--- | :--- | :--- |
| Actor | Administrador | — |
| Vista/Frontera | `AuditoriaView` | `frontend/src/views/.../CU02_BitacoraAuditoria/AuditoriaView.jsx` |
| Controlador frontend | `useAuditoriaController` | `frontend/src/controllers/.../CU02.../useAuditoriaController.js` |
| Servicio/Modelo API | `auditoriaService` | `frontend/src/models/.../CU02.../auditoriaModel.js` |
| Ruta HTTP | `/api/cu02/auditoria`, `/api/cu02/auditoria/usuarios` | `backend/routes/api.php` |
| Controlador backend | `AuditoriaController` | `backend/app/Http/Controllers/.../CU02_BitacoraAuditoria/` |
| Modelos | `BitacoraAuditoria` | `backend/app/Models/.../CU02.../BitacoraAuditoria.php` |
| Tablas | `Bitacora` | migración |

**5. Mensajes numerados.**
1. `Actor → AuditoriaView`: abre el módulo.
2. `AuditoriaView → useAuditoriaController`: monta `reload` (y opcionalmente `setUsuarioFiltro`/`setAccionFiltro`).
3. `useAuditoriaController → auditoriaService`: `fetchLogs(filters)` y `fetchUsuarios()`.
4. `auditoriaService → apiClient`: `GET /cu02/auditoria`, `GET /cu02/auditoria/usuarios`.
5. `apiClient → AuditoriaController`: `index(Request)` / `usuarios()`.
6. `AuditoriaController → BitacoraAuditoria`: query paginada + `with('user')`.
7. `AuditoriaController → apiClient`: `200 {data: paginado}`.
8. `apiClient → useAuditoriaController → AuditoriaView`: `logs`, `usuarios` renderizados.

**6. Elementos para el diagrama de análisis de clases.**
| Clase/artefacto | Archivo | Responsabilidad | Métodos / estado | Relaciones |
| :--- | :--- | :--- | :--- | :--- |
| `AuditoriaController` | `.../CU02.../AuditoriaController.php` | Consulta bitácora | `index`, `usuarios`, `registrar` (static) | usa `BitacoraAuditoria` |
| `BitacoraAuditoria` | `.../CU02.../BitacoraAuditoria.php` | Registro de auditoría | `user()`; `$table='Bitacora'`; casts json | `user → User` |
| `useAuditoriaController` | `.../useAuditoriaController.js` | Filtros/estado | `logs, loading, error, usuarios, usuarioFiltro, setUsuarioFiltro, accionFiltro, setAccionFiltro, reload` | usa `auditoriaService` |
| `AuditoriaView` | `.../AuditoriaView.jsx` | Frontera | sin props | usa el hook |
| `auditoriaService` | `.../auditoriaModel.js` | Adaptador API | `fetchLogs`, `fetchUsuarios` | usa `apiClient` |

**7. Validaciones y campos.** Sin `validate()`; filtrado manual. Columnas `accion`, `modulo`, `descripcion`, `idUsuario`, `ipOrigen`, `datosPrevios`, `datosNuevos`, `fechaHora`.

**8. Referencias.** `routes/api.php:77-81`; `AuditoriaController.php`; `AuditLogger.php` (quien **escribe**, CU01–CU17).

---

<a id="cu03"></a>
## 6. CU03 — Gestionar usuarios internos, roles y permisos

**1. Objetivo y estado.** Administrar usuarios internos y la matriz rol→permiso. **Implementado (verificado).** Nombre del código: «Gestionar usuarios **internos**, roles y permisos».

**2. Actores y permisos.** Actor: Administrador. Permiso: `usuarios.manage`.

**3. Flujo / precondiciones / resultado / errores.**
- Listar usuarios (15/pág.) y roles con permisos.
- Crear usuario (rol por `rol_id` o `role`). Errores: `El rol indicado no existe.` (422).
- Actualizar datos; **bloquea autodesactivación**: `No puedes desactivar tu propia cuenta.` (422).
- Cambiar rol: `Rol del usuario actualizado correctamente.`
- Editar matriz de permisos de un rol (transacción + `sync`). Guarda: si dejaría al sistema **sin ningún rol activo** con `usuarios.manage`, error `No se puede guardar: el sistema quedaría sin ningún rol activo autorizado para administrar usuarios, roles y permisos.` (422).

**4. Componentes para el diagrama de comunicación.**
| Elemento | Nombre exacto | Archivo |
| :--- | :--- | :--- |
| Actor | Administrador | — |
| Vista/Frontera | `UsuariosView`, `RolesPermisosPanel` | `frontend/src/views/.../CU03_UsuariosRolesPermisos/` |
| Controlador frontend | `useUsuarioController`, `useRolesPermisosController` | `frontend/src/controllers/.../CU03.../` |
| Servicio/Modelo API | `usuarioService` | `frontend/src/models/.../CU03.../usuarioModel.js` |
| Ruta HTTP | `/api/cu03/usuarios*`, `/api/cu03/roles*` | `backend/routes/api.php` |
| Controlador backend | `UsuarioController`, `RolController` | `backend/app/Http/Controllers/.../CU03.../` |
| Modelos | `User`, `Rol`, `Permiso` | `backend/app/Models/.../CU03.../` |
| Tablas | `Usuario`, `Rol`, `Permiso`, `RolPermiso`, `Bitacora` | migración |

**5. Mensajes numerados (crear usuario).**
1. `Actor → UsuariosView`: «Nuevo usuario» + datos.
2. `UsuariosView → useUsuarioController`: `handleCreate`.
3. `useUsuarioController → usuarioService`: `createUsuario(data)`.
4. `usuarioService → apiClient`: `POST /cu03/usuarios`.
5. `apiClient → UsuarioController`: `store(Request)`.
6. `UsuarioController → User`: `create` (password `hashed`).
7. `UsuarioController → AuditLogger`: registro.
8. `UsuarioController → apiClient`: `201 {usuario}`.
9. `apiClient → useUsuarioController → UsuariosView`: `reload`.

**Matriz de permisos:** `10. RolesPermisosPanel → useRolesPermisosController: guardar → usuarioService.actualizarPermisosRol(id, slugs) → PUT /cu03/roles/{id}/permisos → RolController@updatePermisos → Rol::permisos()->sync(...)`.

**6. Elementos para el diagrama de análisis de clases.**
| Clase/artefacto | Archivo | Responsabilidad | Métodos / estado | Relaciones |
| :--- | :--- | :--- | :--- | :--- |
| `UsuarioController` | `.../CU03.../UsuarioController.php` | CRUD usuarios | `index, store, update, updateRoles` | usa `User`, `Rol` |
| `RolController` | `.../CU03.../RolController.php` | Matriz rol-permiso | `index, updatePermisos`; `algunRolActivoConservaAdministracion`; const `PERMISO_ADMINISTRACION='usuarios.manage'` | usa `Rol`, `Permiso` |
| `Rol` | `.../CU03.../Rol.php` | Rol RBAC | `permisos()`, `users()`; `$table='Rol'` | `permisos → Permiso` (N:M), `users → User` |
| `Permiso` | `.../CU03.../Permiso.php` | Permiso RBAC | `roles()`; `$table='Permiso'` | `roles → Rol` (N:M) |
| `useUsuarioController` | `.../useUsuarioController.js` | Estado de usuarios | `usuarios, roles, ..., handleCreate, toggleActivo, cambiarRol, reload` | usa `usuarioService` |
| `useRolesPermisosController` | `.../useRolesPermisosController.js` | Estado de matriz | `roles, permisos, selectedRolId, draft, dirty, guardar, cancelar, toggle, toggleModulo` | usa `usuarioService` |
| `UsuariosView` / `RolesPermisosPanel` | `.../*.jsx` | Frontera | props `{user,onPermissionsUpdated}` / `{onPermisosActualizados}` | hooks |
| `usuarioService` | `.../usuarioModel.js` | Adaptador API | `fetchUsuarios`, `createUsuario`, `actualizarUsuario`, `cambiarRol`, `fetchRolesPermisos`, `actualizarPermisosRol` | usa `apiClient` |

**7. Validaciones y campos.** `store`: `name required|string|max:255`, `nombre_usuario nullable|unique:Usuario,nombreUsuario`, `email required|email|unique:Usuario,correo`, `password min:8+regex`, `telefono`, `activo`, `rol_id|role` (`required_without`). `update`: `name`, `telefono`, `activo`, `rol_id` (`sometimes`). `updatePermisos`: `permisos present|array`, `permisos.* exists:Permiso,slug`.

**8. Referencias.** `routes/api.php:83-94`; `UsuarioController.php`; `RolController.php`; `frontend/src/config/access.js` (`CU03:'usuarios.manage'`).

---

<a id="cu04"></a>
## 7. CU04 — Gestionar zonas de cobertura

**1. Objetivo y estado.** Alta/listado/edición de zonas con área geográfica (polígono GeoJSON). **Implementado (verificado).**

**2. Actores y permisos.** Actor: Administrador. Permiso: `zonas.manage`.

**3. Flujo / precondiciones / resultado / errores.** Listado `orderBy('nombre')`; alta (201); edición. Errores de polígono: `El área del mapa debe ser un polígono (GeoJSON tipo Polygon).`, `El polígono del área necesita al menos 3 puntos (4 con el cierre).`, `Las coordenadas del polígono deben ser numéricas.`, `Las coordenadas del polígono están fuera de rango.`, entre otros. Mensajes: `Zonas de cobertura obtenidas exitosamente.`, `Zona de cobertura registrada exitosamente.`, `Zona de cobertura actualizada exitosamente.`

**4. Componentes para el diagrama de comunicación.**
| Elemento | Nombre exacto | Archivo |
| :--- | :--- | :--- |
| Actor | Administrador | — |
| Vista/Frontera | `ZonasCoberturaView` (+ `MapaArea` lazy) | `frontend/src/views/.../CU04_ZonasCobertura/` |
| Controlador frontend | `useZonaCoberturaController` | `frontend/src/controllers/.../CU04.../` |
| Servicio/Modelo API | `zonaService` | `frontend/src/models/.../CU04.../zonaCoberturaModel.js` |
| Ruta HTTP | `/api/cu04/zonas` | `backend/routes/api.php` |
| Controlador backend | `ZonaCoberturaController` | `backend/app/Http/Controllers/.../CU04.../` |
| Modelos | `ZonaCobertura` | `backend/app/Models/.../CU04.../ZonaCobertura.php` |
| Tablas | `Zona` | migración |

**5. Mensajes numerados (alta de zona).**
1. `Actor → ZonasCoberturaView`: «Nueva zona» + formulario (incl. polígono).
2. `ZonasCoberturaView → useZonaCoberturaController`: `openCreate` → `handleCreate`.
3. `useZonaCoberturaController → zonaService`: `createZona(data)`.
4. `zonaService → apiClient`: `POST /cu04/zonas`.
5. `apiClient → ZonaCoberturaController`: `store(Request)`.
6. `ZonaCoberturaController → validarZona/reglaPoligono`: valida (incl. polígono).
7. `ZonaCoberturaController → ZonaCobertura`: `create`.
8. `ZonaCoberturaController → AuditLogger`: `log('CU04','CREAR_ZONA', …)`.
9. `ZonaCoberturaController → apiClient`: `201 {zona}`.
10. `apiClient → hook → view`: `reload` (GET `/cu04/zonas`).

**6. Elementos para el diagrama de análisis de clases.**
| Clase/artefacto | Archivo | Responsabilidad | Métodos / estado | Relaciones |
| :--- | :--- | :--- | :--- | :--- |
| `ZonaCoberturaController` | `.../CU04.../ZonaCoberturaController.php` | CRUD zonas | `index, store, update`; `validarZona`, `reglaPoligono`, `validarGeometriaArea` (static) | usa `ZonaCobertura`, `AuditLogger` |
| `ZonaCobertura` | `.../CU04.../ZonaCobertura.php` | Zona + área | const `ESTADOS_COBERTURA`; accessors alias; `$table='Zona'` | — |
| `useZonaCoberturaController` | `.../useZonaCoberturaController.js` | Estado de zonas | `zonas, loading, error, formError, showModal, newZona, editingId, handleCreate, openCreate, openEdit, closeModal, reload` | usa `zonaService` |
| `ZonasCoberturaView` | `.../ZonasCoberturaView.jsx` | Frontera + mapa | prop `{user}` | hook, `MapaArea` |
| `zonaService` | `.../zonaCoberturaModel.js` | Adaptador API | `fetchZonas`, `createZona`, `updateZona` | usa `apiClient` |

**7. Validaciones y campos.** `codigo` (`required|...|unique:Zona,codigo`), `nombre`, `ciudad`, `barrio`, `tecnologia`, `estado_cobertura` (`in: Disponible|Parcial|Saturada|En expansión`), `capacidad_nodos` (`integer|min:1`), `activo`, `area_mapa` (polígono GeoJSON).

**8. Referencias.** `routes/api.php:96-101`; `ZonaCoberturaController.php:29-161`; `ZonaCobertura.php`; `frontend/src/config/access.js` (`CU04:'zonas.manage'`).

---

<a id="cu05"></a>
## 8. CU05 — Registrar nuevo cliente

**1. Objetivo y estado.** Registrar un cliente con su zona. **Implementado (verificado).**

**2. Actores y permisos.** Actores: Administrador, Secretaría. Permiso: `clientes.create` (también para `GET /cu05/zonas`).

**3. Flujo / precondiciones / resultado / errores.** Genera `codigoCliente` (`CLI-…`) y `estadoCliente='ACTIVO'` si no vienen. Mensaje: `Cliente registrado exitosamente.` (201).

**4. Componentes para el diagrama de comunicación.**
| Elemento | Nombre exacto | Archivo |
| :--- | :--- | :--- |
| Actor | Administrador / Secretaría | — |
| Vista/Frontera | `ClientesView` (registro embebido) · `ClienteRegistroView` (standalone) | `frontend/src/views/Paquetes/GestionClientesZonas/` |
| Controlador frontend | `useClienteRegistroController` (standalone) | `frontend/src/controllers/.../CU05.../` |
| Servicio/Modelo API | `clienteRegistroService` | `frontend/src/models/.../CU05.../clienteRegistroModel.js` |
| Ruta HTTP | `/api/cu05/zonas`, `/api/cu05/clientes` | `backend/routes/api.php` |
| Controlador backend | `ClienteRegistroController` (+ `ZonaCoberturaController@index`) | `backend/app/Http/Controllers/.../CU05.../` |
| Modelos | `Cliente` | `backend/app/Models/.../CU05.../Cliente.php` |
| Tablas | `Cliente`, `Zona` | migración |

> **Aviso de nombre:** la **vista en uso** para CU05–CU07 es `ClientesView`; `ClienteRegistroView`, `ClienteConsultaView` y `ClienteMantenimientoView` existen pero **no están importadas** por `App.jsx` (ver [§10 CU06](#cu06)). El **controlador backend** sigue siendo `ClienteRegistroController`.

**5. Mensajes numerados (registro).**
1. `Actor → ClientesView`: «Nuevo Cliente» + formulario.
2. `ClientesView → clienteRegistroService`: `fetchZonas()` (ya cargado en montaje).
3. `clienteRegistroService → apiClient`: `GET /cu05/zonas` → `ZonaCoberturaController@index`.
4. `Actor → ClientesView`: envía formulario.
5. `ClientesView → clienteRegistroService`: `registerCliente(data)`.
6. `clienteRegistroService → apiClient`: `POST /cu05/clientes`.
7. `apiClient → ClienteRegistroController`: `store(Request)`.
8. `ClienteRegistroController → Cliente`: `create` (genera `codigo_cliente`, `estado='ACTIVO'`).
9. `ClienteRegistroController → AuditLogger`: `log('CU05','CREAR_CLIENTE', …)`.
10. `ClienteRegistroController → apiClient`: `201 {cliente}`.

**6. Elementos para el diagrama de análisis de clases.**
| Clase/artefacto | Archivo | Responsabilidad | Métodos / estado | Relaciones |
| :--- | :--- | :--- | :--- | :--- |
| `ClienteRegistroController` | `.../CU05.../ClienteRegistroController.php` | Alta de clientes | `store`; `generarCodigoCliente` | usa `Cliente`, `AuditLogger` |
| `Cliente` | `.../CU05.../Cliente.php` | Entidad cliente | `zona()`; `SoftDeletes` (`DELETED_AT='fechaBaja'`); `$table='Cliente'`; accessors alias | `zona → ZonaCobertura` |
| `useClienteRegistroController` | `.../useClienteRegistroController.js` | Estado del alta | `cliente, loading, successMsg, errorMsg, zonas, handleChange, handleSubmit, reloadZonas` | usa `clienteRegistroService` |
| `ClientesView` | `.../ClientesView.jsx` | Frontera unificada CU05/06/07 | prop `{user}`; gate `canCreate=canAccessCu(user,'CU05')` | hooks/servicios |
| `clienteRegistroService` | `.../clienteRegistroModel.js` | Adaptador API | `fetchZonas`, `registerCliente` | usa `apiClient` |

**7. Validaciones y campos.** `documento_identidad required|unique:Cliente,ci`, `tipo_documento in:CI,NIT,PASAPORTE`, `nombres`, `apellidos`, `telefono`, `email required|email|unique:Cliente,correo`, `direccion`, `zona_id exists:Zona,idZona`.

**8. Referencias.** `routes/api.php:103-109`; `ClienteRegistroController.php`; `Cliente.php`; `frontend/src/config/access.js` (`CU05:'clientes.create'`).

---

<a id="cu06"></a>
## 9. CU06 — Consultar y buscar clientes

**1. Objetivo y estado.** Buscar/consultar clientes con filtros, paginado. **Implementado (verificado).**

**2. Actores y permisos.** Actores: Administrador, Secretaría, Técnico. Permiso: `clientes.view`.

**3. Flujo / precondiciones / resultado / errores.** `index` filtra por `buscar`, `estado`, `zona_id` (paginado 15, `withTrashed()`); `show` detalle. Mensajes: `Clientes consultados exitosamente.`, `Detalle de cliente obtenido.`

**4. Componentes para el diagrama de comunicación.**
| Elemento | Nombre exacto | Archivo |
| :--- | :--- | :--- |
| Actor | Admin / Secretaría / Técnico | — |
| Vista/Frontera | `ClientesView` · `ClienteConsultaView` (standalone) | `frontend/src/views/Paquetes/GestionClientesZonas/` |
| Controlador frontend | `useClienteConsultaController` (standalone) | `frontend/src/controllers/.../CU06.../` |
| Servicio/Modelo API | `clienteConsultaService` | `frontend/src/models/.../CU06.../clienteConsultaModel.js` |
| Ruta HTTP | `/api/cu06/clientes`, `/api/cu06/clientes/{id}` | `backend/routes/api.php` |
| Controlador backend | `ClienteConsultaController` | `backend/app/Http/Controllers/.../CU06.../` |
| Modelos | `ClienteConsulta` (extiende `Cliente`) | `backend/app/Models/.../CU06.../ClienteConsulta.php` |
| Tablas | `Cliente`, `Zona` | migración |

**Vista compartida CU05/CU06/CU07:** `App.jsx` renderiza `ClientesView` para los tres casos (`case 'CU05': case 'CU06': case 'CU07': return <ClientesView user={currentUser}/>`). El «modo» **no** depende del CU activo sino de permisos: `canCreate=canAccessCu(user,'CU05')` (muestra «Nuevo Cliente») y `canUpdate=canAccessCu(user,'CU07')` (muestra Editar/Baja). La búsqueda (CU06) es la vista base siempre visible. `ClienteConsultaView`/`ClienteMantenimientoView`/`ClienteRegistroView` existen pero no se importan (`NO` están enlazadas).

**5. Mensajes numerados (buscar).**
1. `Actor → ClientesView`: escribe texto de búsqueda / filtro.
2. `ClientesView → clienteConsultaService`: `fetchClientes(params)`.
3. `clienteConsultaService → apiClient`: `GET /cu06/clientes`.
4. `apiClient → ClienteConsultaController`: `index(Request)`.
5. `ClienteConsultaController → ClienteConsulta`: `withTrashed()->buscar($termino)` + filtros + `paginate(15)`.
6. `ClienteConsultaController → apiClient`: `200 {data}`.
7. `apiClient → ClientesView`: lista renderizada.

**6. Elementos para el diagrama de análisis de clases.**
| Clase/artefacto | Archivo | Responsabilidad | Métodos / estado | Relaciones |
| :--- | :--- | :--- | :--- | :--- |
| `ClienteConsultaController` | `.../CU06.../ClienteConsultaController.php` | Consulta/búsqueda | `index`, `show` | usa `ClienteConsulta` |
| `ClienteConsulta` | `.../CU06.../ClienteConsulta.php` | Búsqueda | `scopeBuscar($q,$termino)` | hereda `Cliente` |
| `useClienteConsultaController` | `.../useClienteConsultaController.js` | Estado de búsqueda | `clientes, loading, error, busqueda, setBusqueda, estadoFiltro, setEstadoFiltro, reload` | usa `clienteConsultaService` |
| `ClientesView` | `.../ClientesView.jsx` | Frontera | prop `{user}` | — |
| `clienteConsultaService` | `.../clienteConsultaModel.js` | Adaptador API | `fetchClientes(params)` | usa `apiClient` |

**7. Validaciones y campos.** Sin `validate()`; filtros `buscar`, `estado`, `zona_id`. `estado` ∈ {`ACTIVO`, `SUSPENDIDO`, `INACTIVO`} en la UI.

**8. Referencias.** `routes/api.php:111-115`; `ClienteConsultaController.php`; `ClienteConsulta.php`; `App.jsx:283-285`.

---

<a id="cu07"></a>
## 10. CU07 — Actualizar datos y dar de baja lógica a cliente

**1. Objetivo y estado.** Editar datos y **baja lógica** (no física). **Implementado (verificado).**

**2. Actores y permisos.** Actores: Administrador, Secretaría. Permiso: `clientes.update`.

**3. Flujo / precondiciones / resultado / errores.**
- **Update:** mensaje `Datos del cliente actualizados exitosamente.`
- **Baja lógica:** exige `motivo_baja`; fija `estado='INACTIVO'`, `motivo_baja`, `fecha_baja=now()` y ejecuta `delete()` (SoftDeletes con `DELETED_AT='fechaBaja'`). El registro **no** se borra físicamente. Mensaje `Cliente dado de baja lógica exitosamente.`

**4. Componentes para el diagrama de comunicación.**
| Elemento | Nombre exacto | Archivo |
| :--- | :--- | :--- |
| Actor | Admin / Secretaría | — |
| Vista/Frontera | `ClientesView` · `ClienteMantenimientoView` (standalone) | `frontend/src/views/Paquetes/GestionClientesZonas/` |
| Controlador frontend | `useClienteMantenimientoController` (standalone) | `frontend/src/controllers/.../CU07.../` |
| Servicio/Modelo API | `clienteMantenimientoService` | `frontend/src/models/.../CU07.../clienteMantenimientoModel.js` |
| Ruta HTTP | `/api/cu07/clientes/{id}`, `/api/cu07/clientes/{id}/baja` | `backend/routes/api.php` |
| Controlador backend | `ClienteMantenimientoController` | `backend/app/Http/Controllers/.../CU07.../` |
| Modelos | `ClienteBajaLogica` (extiende `Cliente`) | `backend/app/Models/.../CU07.../ClienteBajaLogica.php` |
| Tablas | `Cliente`, `Zona` | migración |

**5. Mensajes numerados (baja lógica).**
1. `Actor → ClientesView`: «Dar de baja».
2. `ClientesView → clienteMantenimientoService`: `bajaLogica(id, motivo)`.
3. `clienteMantenimientoService → apiClient`: `DELETE /cu07/clientes/{id}/baja {motivo_baja}`.
4. `apiClient → ClienteMantenimientoController`: `bajaLogica(Request,$id)`.
5. `ClienteMantenimientoController → ClienteBajaLogica`: `withTrashed()->findOrFail($id)`.
6. `ClienteMantenimientoController → ClienteBajaLogica`: `update(estado=INACTIVO, motivo_baja, fecha_baja)` + `delete()`.
7. `ClienteMantenimientoController → AuditLogger`: `log('CU07','BAJA_CLIENTE', …)`.
8. `ClienteMantenimientoController → apiClient`: `200` → recarga lista.

**6. Elementos para el diagrama de análisis de clases.**
| Clase/artefacto | Archivo | Responsabilidad | Métodos / estado | Relaciones |
| :--- | :--- | :--- | :--- | :--- |
| `ClienteMantenimientoController` | `.../CU07.../ClienteMantenimientoController.php` | Edición + baja | `update`, `bajaLogica` | usa `ClienteBajaLogica`, `AuditLogger` |
| `ClienteBajaLogica` | `.../CU07.../ClienteBajaLogica.php` | Vista de baja lógica | `$fillable` alias, `$casts[fecha_baja]`; hereda SoftDeletes | hereda `Cliente` |
| `useClienteMantenimientoController` | `.../useClienteMantenimientoController.js` | Estado | `clientes, selectedCliente, bajaMotivo, showBajaModal, handleUpdate, handleBajaLogica, reload` | usa el servicio |
| `ClientesView` | `.../ClientesView.jsx` | Frontera | `handleOpenEdit/EditSubmit/OpenBaja/BajaSubmit` | — |
| `clienteMantenimientoService` | `.../clienteMantenimientoModel.js` | Adaptador API | `updateCliente(id,data)`, `bajaLogica(id,motivo)` | usa `apiClient` |

**7. Validaciones y campos.** `update`: `nombres`, `apellidos`, `telefono`, `email unique:Cliente,correo,{id}`, `direccion`, `zona_id` (`sometimes`). `bajaLogica`: `motivo_baja required|string|max:255`.

**8. Referencias.** `routes/api.php:117-121`; `ClienteMantenimientoController.php`; `ClienteBajaLogica.php`; `Cliente.php` (`SoftDeletes`, `DELETED_AT='fechaBaja'`).

---

<a id="cu08"></a>
## 11. CU08 — Registrar y activar servicio de Internet

**1. Objetivo y estado.** Registrar la contratación (opcionalmente con IP/MAC) y activar tras verificación técnica; crea la asignación canónica del plan. **Implementado (verificado).**

**2. Actores y permisos.** Consulta: Admin, Secretaría, Técnico (`servicios.view`). Registro/activación: Admin, Secretaría (`servicios.manage`).

**3. Flujo / precondiciones / resultado / errores.** `store`: si hay `ip_asignada` + `mac_router` → estado `ACTIVO`, si no `PENDIENTE_INSTALACION`. Genera `codigo_servicio='SRV-…'`; si no hay `plan_id`, crea/recupera `PlanInternet` por nombre; crea `AsignacionPlan` («Contratación inicial del servicio.»). `activar`: exige `ip_asignada` (ip) + `mac_router`, fija estado `ACTIVO`. Mensajes: `Servicios de Internet obtenidos exitosamente.`, `Servicio de Internet registrado exitosamente.` (201), `Servicio de Internet activado exitosamente.`

**4. Componentes para el diagrama de comunicación.**
| Elemento | Nombre exacto | Archivo |
| :--- | :--- | :--- |
| Actor | Admin / Secretaría / Técnico | — |
| Vista/Frontera | `ServicioInternetView` | `frontend/src/views/.../CU08_RegistrarActivarServicio/` |
| Controlador frontend | `useServicioInternetController` | `frontend/src/controllers/.../CU08.../` |
| Servicio/Modelo API | `servicioInternetService` | `frontend/src/models/.../CU08.../servicioInternetModel.js` |
| Ruta HTTP | `/api/cu08/servicios`, `.../{id}/activar` | `backend/routes/api.php` |
| Controlador backend | `ServicioInternetController` | `backend/app/Http/Controllers/.../CU08.../` |
| Modelos | `ServicioInternet`, `EstadoServicio`, `AsignacionPlan`, `PlanInternet`, `Cliente` | `backend/app/Models/.../` |
| Tablas | `ServicioInternet`, `EstadoServicio`, `AsignacionPlan`, `PlanInternet`, `Cliente` | migración |

**5. Mensajes numerados (registrar servicio).**
1. `Actor → ServicioInternetView`: completa alta (cliente, plan, dirección, día de corte, IP/MAC opcional).
2. `ServicioInternetView → useServicioInternetController`: `handleClienteChange` / `handlePlanChange` / `handleCrear`.
3. `useServicioInternetController → servicioInternetService`: `fetchClientes()` (`GET /cu06/clientes`), `fetchPlanes()` (`GET /planes`), `registrarServicio(datos)`.
4. `servicioInternetService → apiClient`: `POST /cu08/servicios`.
5. `apiClient → ServicioInternetController`: `store(Request)`.
6. `ServicioInternetController → EstadoServicio`: resuelve id de estado inicial.
7. `ServicioInternetController → ServicioInternet`: `create`.
8. `ServicioInternetController → PlanInternet`: `firstOrCreate` (si no hay `plan_id`).
9. `ServicioInternetController → AsignacionPlan`: `create` (motivo «Contratación inicial del servicio.»).
10. `ServicioInternetController → AuditLogger`: `log('CU08','REGISTRAR_SERVICIO', …)`.
11. `ServicioInternetController → apiClient`: `201 {servicio}` → `reload` (`GET /cu08/servicios`).

**Activar:** `ServicioInternetView → handleActivar → activarServicio(id,{ip_asignada,mac_router}) → PUT /cu08/servicios/{id}/activar → ServicioInternetController@activar → update(estado ACTIVO) → auditoría → 200`.

**6. Elementos para el diagrama de análisis de clases.**
| Clase/artefacto | Archivo | Responsabilidad | Métodos / estado | Relaciones |
| :--- | :--- | :--- | :--- | :--- |
| `ServicioInternetController` | `.../CU08.../ServicioInternetController.php` | Alta/activación | `index, store, activar` | usa `ServicioInternet`, `EstadoServicio`, `PlanInternet`, `AsignacionPlan`, `AuditLogger` |
| `ServicioInternet` | `.../CU08.../ServicioInternet.php` | Servicio | `cliente, estado, zona, mensualidades, asignacionesPlan, asignacionPlanActual`; `$table='ServicioInternet'` | ver relaciones |
| `EstadoServicio` | `.../CU08.../EstadoServicio.php` | Catálogo de estados | `servicios()`; `$table='EstadoServicio'` | `servicios → ServicioInternet` |
| `useServicioInternetController` | `.../useServicioInternetController.js` | Estado del alta | `servicios, clientes, planes, formServicio, formActivar, handleClienteChange, handlePlanChange, handleCrear, handleActivar, reload` | usa el servicio |
| `ServicioInternetView` | `.../ServicioInternetView.jsx` | Frontera | prop `{user}`; gate `servicios.manage` | — |
| `servicioInternetService` | `.../servicioInternetModel.js` | Adaptador API | `fetchServicios, fetchClientes, fetchPlanes, registrarServicio, activarServicio` | usa `apiClient` |

Relaciones: `ServicioInternet [1] → AsignacionPlan [1..*]` (`asignacionesPlan`) y `asignacionPlanActual` (`hasOne … whereNull('fechaFin')`).

**7. Validaciones y campos.** `cliente_id required|exists:Cliente,idCliente`, `plan_id nullable`, `plan_nombre required|string|max:100`, `velocidad_mbps required|integer|min:10`, `precio_mensual required|numeric|min:0`, `ip_asignada nullable|ip`, `mac_router nullable|string|max:50`, `direccion_instalacion required|string|max:255`, `dia_corte required|integer|min:1|max:31`. `activar`: `ip_asignada required|ip`, `mac_router required|string`.

**8. Referencias.** `routes/api.php:123-133`; `ServicioInternetController.php:23-130`; `ServicioInternet.php`; `frontend/src/config/access.js` (`CU08:'servicios.view'`); gating de escritura con `servicios.manage`.

---

<a id="cu09"></a>
## 12. CU09 — Generar mensualidades de servicios

**1. Objetivo y estado.** Listar y **generar** mensualidades del período para servicios activos. **Implementado (verificado).**

**2. Actores y permisos.** Actores: Admin, Secretaría. `mensualidades.view` (listar), `mensualidades.generate` (generar).

**3. Flujo / precondiciones / resultado / errores.** `generar` valida `periodo` (`Y-m`); itera servicios `ACTIVO`, evita duplicados (`lockForUpdate`), calcula tarifa (`precio_mensual` → `asignacionPlanActual.precioAplicado` → plan → 150.00), `fechaVencimiento = día de corte (máx 28)`. Mensajes: `Mensualidades del período {periodo} obtenidas.`, `Se generaron exitosamente {n} mensualidades para el período {periodo}.`

**4. Componentes para el diagrama de comunicación.**
| Elemento | Nombre exacto | Archivo |
| :--- | :--- | :--- |
| Actor | Admin / Secretaría | — |
| Vista/Frontera | `MensualidadGeneracionView` | `frontend/src/views/.../CU09_GenerarMensualidades/` |
| Controlador frontend | `useMensualidadGeneracionController` | `frontend/src/controllers/.../CU09.../` |
| Servicio/Modelo API | `mensualidadService` | `frontend/src/models/.../CU09.../mensualidadModel.js` |
| Ruta HTTP | `/api/cu09/mensualidades`, `/api/cu09/mensualidades/generar` | `backend/routes/api.php` |
| Controlador backend | `MensualidadGeneracionController` | `backend/app/Http/Controllers/.../CU09.../` |
| Modelos | `MensualidadFacturacion`, `ServicioInternet` | `backend/app/Models/.../` |
| Tablas | `Mensualidad`, `ServicioInternet` | migración |

**5. Mensajes numerados (generar).**
1. `Actor → MensualidadGeneracionView`: elige período y «Generar».
2. `MensualidadGeneracionView → useMensualidadGeneracionController`: `setPeriodo` → `handleGenerar`.
3. `useMensualidadGeneracionController → mensualidadService`: `generarMensualidades(periodo)`.
4. `mensualidadService → apiClient`: `POST /cu09/mensualidades/generar {periodo}`.
5. `apiClient → MensualidadGeneracionController`: `generar(Request)`.
6. `MensualidadGeneracionController → ServicioInternet`: servicios `ACTIVO` con `asignacionPlanActual.plan`.
7. `MensualidadGeneracionController → MensualidadFacturacion`: por servicio, `lockForUpdate` + `create`.
8. `MensualidadGeneracionController → AuditLogger`: `log('CU09','GENERAR_MENSUALIDADES', …)`.
9. `MensualidadGeneracionController → apiClient`: `200 {periodo, generadas}` → `reload`.

**6. Elementos para el diagrama de análisis de clases.**
| Clase/artefacto | Archivo | Responsabilidad | Métodos / estado | Relaciones |
| :--- | :--- | :--- | :--- | :--- |
| `MensualidadGeneracionController` | `.../CU09.../MensualidadGeneracionController.php` | Listar/generar | `index`, `generar` | usa `MensualidadFacturacion`, `ServicioInternet` |
| `MensualidadFacturacion` | `.../CU09.../MensualidadFacturacion.php` | Mensualidad | `cliente()`, `servicio()`; `$table='Mensualidad'`; alias `estado_pago`, `fecha_vencimiento` | `servicio → ServicioInternet`, `cliente → Cliente` |
| `useMensualidadGeneracionController` | `.../useMensualidadGeneracionController.js` | Estado | `mensualidades, periodo, setPeriodo, loading, error, resultMsg, handleGenerar, reload` | usa el servicio |
| `MensualidadGeneracionView` | `.../MensualidadGeneracionView.jsx` | Frontera | prop `{user}`; gate `mensualidades.generate` | — |
| `mensualidadService` | `.../mensualidadModel.js` | Adaptador API | `fetchMensualidades(periodo)`, `generarMensualidades(periodo)` | usa `apiClient` |

**7. Validaciones y campos.** `periodo required|date_format:Y-m`. Campos: `periodo`, `monto`, `fechaEmision`, `fechaVencimiento`, `estado` (alias `estado_pago`), `codigoFactura`, `idServicio`, `idCliente`.

**8. Referencias.** `routes/api.php:135-141`; `MensualidadGeneracionController.php:23-101`; `MensualidadFacturacion.php`.

---

<a id="cu10"></a>
## 13. CU10 — Gestionar pago de mensualidad

**1. Objetivo y estado.** Cobranza en caja y **portal cliente** público (consulta por C.I. y pago QR/Transferencia/PayPal). **Implementado (verificado).**

**2. Actores y permisos.**
| Actor | Acceso | Permiso |
| :--- | :--- | :--- |
| Secretaría / Admin (caja) | pendientes, registrar pago | `pagos.register` |
| Cliente (público) | consultar por CI y pagar en línea | *(público)* |

**3. Flujo / precondiciones / resultado / errores.**
- `store` (caja): exige monto **exacto**; errores `Esta mensualidad ya se encuentra pagada.`, `No se puede registrar el pago de una mensualidad anulada.`, `El monto pagado debe ser igual al monto de la mensualidad (Bs N).` Mensaje `Pago de mensualidad registrado exitosamente.` (201).
- `consultarPorCI` (público): errores `Debe ingresar un número de documento de identidad válido.` (422), `No se encontró ningún cliente registrado con el C.I. ingresado. Verifique el número e intente de nuevo.` (404).
- `pagarEnLinea` (público): errores `Esta factura ya se encuentra pagada.`, `No se puede cancelar una mensualidad anulada.`, `El monto pagado debe ser exactamente igual al total de la factura (Bs N).` Mensaje `¡Pago registrado exitosamente! Su servicio se encuentra al día.` (201). Recibo `REC-ONL-…`.

**4. Componentes para el diagrama de comunicación.**
| Elemento | Nombre exacto | Archivo |
| :--- | :--- | :--- |
| Actor | Secretaría/Admin (caja); Cliente (público) | — |
| Vista/Frontera | `PagoMensualidadView`, `PortalClienteModal` | `frontend/src/views/.../CU10_GestionarPagoMensualidad/` |
| Controlador frontend | `usePagoMensualidadController` (+ estado local del modal) | `frontend/src/controllers/.../CU10.../` |
| Servicio/Modelo API | `pagoMensualidadService` | `frontend/src/models/.../CU10.../pagoMensualidadModel.js` |
| Ruta HTTP | `/api/cu10/pendientes`, `/api/cu10/pagos`, `/api/cu10/portal-cliente/*` | `backend/routes/api.php` |
| Controlador backend | `PagoMensualidadController` | `backend/app/Http/Controllers/.../CU10.../` |
| Modelos | `PagoMensualidad`, `MetodoPago`, `DetallePago`, `MensualidadFacturacion`, `Cliente`, `ServicioInternet` | `backend/app/Models/.../` |
| Tablas | `Pago`, `MetodoPago`, `DetallePago`, `Mensualidad`, `Cliente`, `ServicioInternet` | migración |

**5. Mensajes numerados (pago en línea, público).**
1. `Actor (cliente) → PortalClienteModal`: introduce C.I. y consulta.
2. `PortalClienteModal → pagoMensualidadService`: `consultarPorCI(ci)`.
3. `pagoMensualidadService → apiClient`: `GET /cu10/portal-cliente/consultar/{ci}`.
4. `apiClient → PagoMensualidadController`: `consultarPorCI(Request,$ci)`.
5. `PagoMensualidadController → Cliente / ServicioInternet / MensualidadFacturacion`: consulta deuda y calcula fecha de corte.
6. `PagoMensualidadController → PortalClienteModal`: `200 {cliente, factura, …}`.
7. `PortalClienteModal → pagoMensualidadService`: (genera QR con `qrcode`) → `pagarEnLinea(data)`.
8. `pagoMensualidadService → apiClient`: `POST /cu10/portal-cliente/pagar`.
9. `apiClient → PagoMensualidadController`: `pagarEnLinea(Request)`.
10. `PagoMensualidadController → PagoMensualidad`: `create` (recibo `REC-ONL-…`).
11. `PagoMensualidadController → MensualidadFacturacion`: `estado_pago='PAGADO'`.
12. `PagoMensualidadController → AuditLogger`: `log('CU10','PAGO_EN_LINEA', …)`.
13. `PagoMensualidadController → PortalClienteModal`: `201 {recibo,…}`.

**Caja:** `PagoMensualidadView → handleRegistrarPago → registrarPago(data) → POST /cu10/pagos → PagoMensualidadController@store → PagoMensualidad::create + mensualidad PAGADO → auditoría → 201`.

**6. Elementos para el diagrama de análisis de clases.**
| Clase/artefacto | Archivo | Responsabilidad | Métodos / estado | Relaciones |
| :--- | :--- | :--- | :--- | :--- |
| `PagoMensualidadController` | `.../CU10.../PagoMensualidadController.php` | Cobranza + portal | `pendientes, store, consultarPorCI, pagarEnLinea` | usa `PagoMensualidad`, `MensualidadFacturacion`, `Cliente`, `ServicioInternet` |
| `PagoMensualidad` | `.../CU10.../PagoMensualidad.php` | Pago | `detalles()`, `metodoPago()`, `cajero()`, `mensualidad()`; `$table='Pago'` | hasMany `DetallePago`; belongsTo `MetodoPago`,`User`; hasOneThrough `Mensualidad` |
| `MetodoPago` | `.../CU10.../MetodoPago.php` | Método | `$table='MetodoPago'` | — |
| `DetallePago` | `.../CU10.../DetallePago.php` | Aplicación a mensualidad | `pago()`, `mensualidad()`; `$table='DetallePago'` | `pago → Pago`, `mensualidad → Mensualidad` |
| `usePagoMensualidadController` | `.../usePagoMensualidadController.js` | Estado de caja | `pendientes, selectedFactura, metodoPago, montoCobrar, montoRecibido, vuelto, qrDataUrl, verificarPagoQR, procesarTransferencia, abrirPayPal, confirmarTransaccionPayPal, handleRegistrarPago, cargarPendientes` | usa el servicio |
| `PagoMensualidadView` / `PortalClienteModal` | `.../*.jsx` | Frontera | sin props / `{isOpen,onClose}` | hook / local |
| `pagoMensualidadService` | `.../pagoMensualidadModel.js` | Adaptador API | `fetchPendientes`, `registrarPago`, `consultarPorCI`, `pagarEnLinea` | usa `apiClient` |

**7. Validaciones y campos.** `store`: `mensualidad_id exists:Mensualidad,idMensualidad`, `monto_pagado numeric|min:0.01`, `metodo_pago in:EFECTIVO,TRANSFERENCIA,QR,TARJETA,PAYPAL`, `numero_transaccion`, `observaciones`. `pagarEnLinea`: `metodo_pago in:QR,TRANSFERENCIA,PAYPAL`, `detalles array`. **QR generado en el cliente** con la dependencia `qrcode` (`^1.5.4`).

**8. Referencias.** `routes/api.php:143-154`; `PagoMensualidadController.php:25-314`; `PagoMensualidad.php`, `MetodoPago.php`, `DetallePago.php`; `PortalClienteModal.jsx`, `LandingView.jsx`.

---

<a id="cu11"></a>
## 14. CU11 — Consultar historial de pagos

**1. Objetivo y estado.** Consultar pagos con filtros, paginado. **Implementado (verificado).**

**2. Actores y permisos.** Actores: Admin, Secretaría. Permiso: `pagos.history`.

**3. Flujo / precondiciones / resultado / errores.** Filtros `cliente_id` (`porCliente`), `metodo_pago`, `fecha_desde`, `fecha_hasta`; `latest('fecha_pago')`; `paginate(20)`. Mensaje: `Historial de pagos consultado correctamente.`

**4. Componentes para el diagrama de comunicación.**
| Elemento | Nombre exacto | Archivo |
| :--- | :--- | :--- |
| Actor | Admin / Secretaría | — |
| Vista/Frontera | `HistorialPagosView` | `frontend/src/views/.../CU11_ConsultarHistorialPagos/` |
| Controlador frontend | `useHistorialPagosController` | `frontend/src/controllers/.../CU11.../` |
| Servicio/Modelo API | `historialPagosService` | `frontend/src/models/.../CU11.../historialPagoModel.js` |
| Ruta HTTP | `/api/cu11/historial` | `backend/routes/api.php` |
| Controlador backend | `HistorialPagosController` | `backend/app/Http/Controllers/.../CU11.../` |
| Modelos | `HistorialPago` (extiende `PagoMensualidad`) | `backend/app/Models/.../CU11.../HistorialPago.php` |
| Tablas | `Pago` (+ `Mensualidad`, `MetodoPago`, `Usuario`) | migración |

**5. Mensajes numerados.**
1. `Actor → HistorialPagosView`: abre historial (filtros).
2. `HistorialPagosView → useHistorialPagosController`: `reload` / `setMetodoFiltro`.
3. `useHistorialPagosController → historialPagosService`: `fetchHistorial(filters)`.
4. `historialPagosService → apiClient`: `GET /cu11/historial`.
5. `apiClient → HistorialPagosController`: `index(Request)`.
6. `HistorialPagosController → HistorialPago`: `with(mensualidad.cliente, cajero)`, filtros, paginado.
7. `HistorialPagosController → apiClient`: `200 {data}` → render.

**6. Elementos para el diagrama de análisis de clases.**
| Clase/artefacto | Archivo | Responsabilidad | Métodos / estado | Relaciones |
| :--- | :--- | :--- | :--- | :--- |
| `HistorialPagosController` | `.../CU11.../HistorialPagosController.php` | Consulta pagos | `index` | usa `HistorialPago` |
| `HistorialPago` | `.../CU11.../HistorialPago.php` | Historial | `scopePorCliente($q,$id)` | hereda `PagoMensualidad` |
| `useHistorialPagosController` | `.../useHistorialPagosController.js` | Estado | `pagos, loading, error, metodoFiltro, setMetodoFiltro, reload` | usa el servicio |
| `HistorialPagosView` | `.../HistorialPagosView.jsx` | Frontera | sin props | hook |
| `historialPagosService` | `.../historialPagoModel.js` | Adaptador API | `fetchHistorial(filters)` | usa `apiClient` |

**7. Validaciones y campos.** Sin `validate()`; filtros por query. Columnas `montoTotal`, `numeroComprobante`, `fechaHora`, `idMetodoPago`, `idUsuario`.

**8. Referencias.** `routes/api.php:156-159`; `HistorialPagosController.php`; `HistorialPago.php`.

---

<a id="cu12"></a>
## 15. CU12 — Visualizar alertas de vencimiento

**1. Objetivo y estado.** Calcular alertas de facturas vencidas por severidad. **Implementado (verificado).**

**2. Actores y permisos.** Actores: Admin, Secretaría. Permiso: `alertas.view`.

**3. Flujo / precondiciones / resultado / errores.** Calcula en tiempo real: `estado_pago != 'PAGADO'` y `fecha_vencimiento <= hoy`; severidad `CRITICA` (>15 días), `ALTA` (>5), `MEDIA` (resto). Mensaje: `Alertas de vencimiento obtenidas exitosamente.`

**4. Componentes para el diagrama de comunicación.**
| Elemento | Nombre exacto | Archivo |
| :--- | :--- | :--- |
| Actor | Admin / Secretaría | — |
| Vista/Frontera | `AlertasVencimientoView` | `frontend/src/views/.../CU12_VisualizarAlertasVencimiento/` |
| Controlador frontend | `useAlertasVencimientoController` | `frontend/src/controllers/.../CU12.../` |
| Servicio/Modelo API | `alertasService` | `frontend/src/models/.../CU12.../alertaVencimientoModel.js` |
| Ruta HTTP | `/api/cu12/alertas` | `backend/routes/api.php` |
| Controlador backend | `AlertasVencimientoController` | `backend/app/Http/Controllers/.../CU12.../` |
| Modelos | `MensualidadFacturacion` (calcula en vivo); `AlertaVencimiento` (declarado, **no usado** por el controlador) | `backend/app/Models/.../CU12.../AlertaVencimiento.php` |
| Tablas | `Mensualidad` | migración |

> **Observación verificada:** el modelo `AlertaVencimiento` declara `$table='alertas_vencimiento'`, tabla que **no** existe en la migración (`NO ENCONTRADO`), y el controlador **no** lo utiliza: las alertas se calculan sobre `Mensualidad`.

**5. Mensajes numerados.**
1. `Actor → AlertasVencimientoView`: abre alertas.
2. `AlertasVencimientoView → useAlertasVencimientoController`: `reload`.
3. `useAlertasVencimientoController → alertasService`: `fetchAlertas()`.
4. `alertasService → apiClient`: `GET /cu12/alertas`.
5. `apiClient → AlertasVencimientoController`: `index(Request)`.
6. `AlertasVencimientoController → MensualidadFacturacion`: facturas vencidas impagas + severidad.
7. `AlertasVencimientoController → apiClient`: `200 {total_alertas, alertas[]}` → render.

**6. Elementos para el diagrama de análisis de clases.**
| Clase/artefacto | Archivo | Responsabilidad | Métodos / estado | Relaciones |
| :--- | :--- | :--- | :--- | :--- |
| `AlertasVencimientoController` | `.../CU12.../AlertasVencimientoController.php` | Cálculo de alertas | `index` | usa `MensualidadFacturacion` |
| `AlertaVencimiento` | `.../CU12.../AlertaVencimiento.php` | (declarado) | `mensualidad()`; `$table='alertas_vencimiento'` (no existe) | `mensualidad → MensualidadFacturacion` |
| `useAlertasVencimientoController` | `.../useAlertasVencimientoController.js` | Estado | `alertas, loading, error, severidadFiltro, setSeveridadFiltro, reload` | usa el servicio |
| `AlertasVencimientoView` | `.../AlertasVencimientoView.jsx` | Frontera | sin props | hook |
| `alertasService` | `.../alertaVencimientoModel.js` | Adaptador API | `fetchAlertas()` | usa `apiClient` |

**7. Validaciones y campos.** Sin `validate()`. Salida por alerta: `mensualidad_id`, `codigo_factura`, `cliente`, `servicio`, `monto`, `fecha_vencimiento`, `dias_retraso`, `severidad`.

**8. Referencias.** `routes/api.php:161-164`; `AlertasVencimientoController.php:20-48`; `AlertaVencimiento.php`.

---

<a id="cu13"></a>
## 16. CU13 — Consultar listado de servicios para corte

**1. Objetivo y estado.** Listar servicios activos con mora para corte. **Implementado (verificado).**

**2. Actores y permisos.** Actores: Admin, Secretaría. Permiso: `cortes.list`.

**3. Flujo / precondiciones / resultado / errores.** `dias_mora` (default 5). Devuelve servicios `ACTIVO` con ≥1 mensualidad impaga vencida hace `dias_tolerancia` días; calcula `mensualidades_pendientes`, `monto_deuda`, `dias_mora`. Mensaje: `Listado de servicios pendientes de corte obtenido.`

**4. Componentes para el diagrama de comunicación.**
| Elemento | Nombre exacto | Archivo |
| :--- | :--- | :--- |
| Actor | Admin / Secretaría | — |
| Vista/Frontera | `ServiciosCorteView` | `frontend/src/views/.../CU13_ListadoServiciosCorte/` |
| Controlador frontend | `useServiciosCorteController` | `frontend/src/controllers/.../CU13.../` |
| Servicio/Modelo API | `serviciosCorteService` | `frontend/src/models/.../CU13.../servicioCorteModel.js` |
| Ruta HTTP | `/api/cu13/servicios-corte` | `backend/routes/api.php` |
| Controlador backend | `ServiciosCorteController` | `backend/app/Http/Controllers/.../CU13.../` |
| Modelos | `ServicioParaCorte` (extiende `ServicioInternet`) | `backend/app/Models/.../CU13.../ServicioParaCorte.php` |
| Tablas | `ServicioInternet`, `Mensualidad`, `Cliente`, `EstadoServicio` | migración |

**5. Mensajes numerados.**
1. `Actor → ServiciosCorteView`: abre el listado (opcional `dias_mora`).
2. `ServiciosCorteView → useServiciosCorteController`: `reload`.
3. `useServiciosCorteController → serviciosCorteService`: `fetchServiciosCorte()`.
4. `serviciosCorteService → apiClient`: `GET /cu13/servicios-corte`.
5. `apiClient → ServiciosCorteController`: `index(Request)`.
6. `ServiciosCorteController → ServicioParaCorte`: `elegiblesParaCorte(diasMora)` + `with(mensualidades)`.
7. `ServiciosCorteController → apiClient`: `200 {data}` (con `monto_deuda`, `dias_mora`).
8. `Actor → ServiciosCorteView`: «Ir a corte» (`onIrACorte`) → CU14.

**6. Elementos para el diagrama de análisis de clases.**
| Clase/artefacto | Archivo | Responsabilidad | Métodos / estado | Relaciones |
| :--- | :--- | :--- | :--- | :--- |
| `ServiciosCorteController` | `.../CU13.../ServiciosCorteController.php` | Listado de mora | `index` | usa `ServicioParaCorte` |
| `ServicioParaCorte` | `.../CU13.../ServicioParaCorte.php` | Elegibilidad | `scopeElegiblesParaCorte($q,$dias)` | hereda `ServicioInternet` |
| `useServiciosCorteController` | `.../useServiciosCorteController.js` | Estado | `servicios, loading, error, reload` | usa el servicio |
| `ServiciosCorteView` | `.../ServiciosCorteView.jsx` | Frontera | prop `{onIrACorte}` | hook |
| `serviciosCorteService` | `.../servicioCorteModel.js` | Adaptador API | `fetchServiciosCorte()` | usa `apiClient` |

**7. Validaciones y campos.** Sin `validate()`; `dias_mora` (integer, default 5). Salida: `mensualidades_pendientes`, `monto_deuda`, `dias_mora`.

**8. Referencias.** `routes/api.php:166-169`; `ServiciosCorteController.php:23-50`; `ServicioParaCorte.php:12-19`; `App.jsx` (`CU13 → <ServiciosCorteView onIrACorte={handleIrACorte}/>`).

---

<a id="cu14"></a>
## 17. CU14 — Registrar corte realizado

**1. Objetivo y estado.** Registrar la ejecución del corte de un servicio activo. **Implementado (verificado).** (No es un stub.)

**2. Actores y permisos.** Actores: Admin, Secretaría. Permiso: `cortes.register`.

**3. Flujo / precondiciones / resultado / errores.** Precondición: servicio en estado `ACTIVO`. Transacción con `lockForUpdate`; crea `RegistroCorte` (orden `COR-…`) y deja el servicio en `CORTADO`. Error: `Solo se puede cortar un servicio ACTIVO. Estado actual: {estado}.` (422). Mensaje: `Corte de servicio registrado y ejecutado exitosamente.` (201).

**4. Componentes para el diagrama de comunicación.**
| Elemento | Nombre exacto | Archivo |
| :--- | :--- | :--- |
| Actor | Admin / Secretaría | — |
| Vista/Frontera | `CorteRegistroView` | `frontend/src/views/.../CU14_RegistrarCorteRealizado/` |
| Controlador frontend | `useCorteRegistroController` | `frontend/src/controllers/.../CU14.../` |
| Servicio/Modelo API | `corteRegistroService` (+ `serviciosCorteService` para el selector) | `frontend/src/models/.../CU14.../` |
| Ruta HTTP | `/api/cu14/cortes` | `backend/routes/api.php` |
| Controlador backend | `CorteRegistroController` | `backend/app/Http/Controllers/.../CU14.../` |
| Modelos | `RegistroCorte`, `ServicioInternet`, `EstadoServicio` | `backend/app/Models/.../` |
| Tablas | `AccionServicio`, `ServicioInternet`, `EstadoServicio` | migración |

**5. Mensajes numerados.**
1. `Actor → CorteRegistroView`: elige servicio, tipo de corte, motivo.
2. `CorteRegistroView → useCorteRegistroController`: `setSelectedServicio` / `setTipoCorte` / `handleSubmit`.
3. `useCorteRegistroController → corteRegistroService`: `registrarCorte(data)`.
4. `corteRegistroService → apiClient`: `POST /cu14/cortes`.
5. `apiClient → CorteRegistroController`: `store(Request)`.
6. `CorteRegistroController → ServicioInternet`: `lockForUpdate()->findOrFail` + verifica `ACTIVO`.
7. `CorteRegistroController → RegistroCorte`: `create` (tipoAccion=`CORTE`).
8. `CorteRegistroController → ServicioInternet`: `estado_servicio='CORTADO'`.
9. `CorteRegistroController → AuditLogger`: `log('CU14','REGISTRAR_CORTE', …)`.
10. `CorteRegistroController → apiClient`: `201 {corte, servicio}`.

**6. Elementos para el diagrama de análisis de clases.**
| Clase/artefacto | Archivo | Responsabilidad | Métodos / estado | Relaciones |
| :--- | :--- | :--- | :--- | :--- |
| `CorteRegistroController` | `.../CU14.../CorteRegistroController.php` | Registrar corte | `store` | usa `RegistroCorte`, `ServicioInternet`, `EstadoServicio` |
| `RegistroCorte` | `.../CU14.../RegistroCorte.php` | Acción CORTE | `servicio()`, `tecnico()`; scope global `tipoAccion='CORTE'`; `$table='AccionServicio'` | `servicio → ServicioInternet`, `tecnico → User` |
| `useCorteRegistroController` | `.../useCorteRegistroController.js` | Estado | `servicios, selectedServicio, tipoCorte, motivo, observaciones, handleSubmit` | usa `corteRegistroService` |
| `CorteRegistroView` | `.../CorteRegistroView.jsx` | Frontera | prop `{initialServicio}` | hook |
| `corteRegistroService` | `.../corteRegistroModel.js` | Adaptador API | `registrarCorte(data)` | usa `apiClient` |

**7. Validaciones y campos.** `servicio_id required|exists:ServicioInternet,idServicio`, `tipo_corte required|in:LOGICO,FISICO`, `motivo required|string|max:255`, `observaciones nullable|string|max:500`. Columnas `AccionServicio`: `tipoAccion`, `fechaEjecucion`, `estado`, `motivo`, `observacion`, `idServicio`, `idUsuario`.

**8. Referencias.** `routes/api.php:171-174`; `CorteRegistroController.php:23-72`; `RegistroCorte.php`; test `backend/tests/Feature/CiclosUnoDosTest.php` (`test_cu14_corta_servicio_activo_y_rechaza_estado_invalido`).

---

<a id="cu15"></a>
## 18. CU15 — Gestionar lista y registro de reactivaciones

**1. Objetivo y estado.** Listar reactivaciones y reactivar un servicio cortado. **Implementado (verificado).** (No es un stub.)

**2. Actores y permisos.** Actores: Admin, Secretaría. Permiso: `reactivaciones.manage`.

**3. Flujo / precondiciones / resultado / errores.** Precondición: servicio en estado `CORTADO`. Transacción con `lockForUpdate`; crea `ReactivacionServicio` (código `REA-…`) y deja el servicio en `ACTIVO`. Error: `Solo se puede reactivar un servicio CORTADO. Estado actual: {estado}.` (422). Mensajes: `Lista de reactivaciones obtenida exitosamente.`, `Servicio reactivado exitosamente.` (201).

**4. Componentes para el diagrama de comunicación.**
| Elemento | Nombre exacto | Archivo |
| :--- | :--- | :--- |
| Actor | Admin / Secretaría | — |
| Vista/Frontera | `ReactivacionesView` | `frontend/src/views/.../CU15_ListaRegistroReactivaciones/` |
| Controlador frontend | `useReactivacionesController` | `frontend/src/controllers/.../CU15.../` |
| Servicio/Modelo API | `reactivacionesService` | `frontend/src/models/.../CU15.../reactivacionesModel.js` |
| Ruta HTTP | `/api/cu15/reactivaciones` | `backend/routes/api.php` |
| Controlador backend | `ReactivacionesController` | `backend/app/Http/Controllers/.../CU15.../` |
| Modelos | `ReactivacionServicio`, `ServicioInternet`, `EstadoServicio`, `PagoMensualidad`, `User` | `backend/app/Models/.../` |
| Tablas | `AccionServicio`, `ServicioInternet`, `EstadoServicio`, `Pago`, `Usuario` | migración |

**5. Mensajes numerados (reactivar).**
1. `Actor → ReactivacionesView`: «Reactivar» + servicio cortado.
2. `ReactivacionesView → useReactivacionesController`: `setFormReactivacion` / `handleCrear`.
3. `useReactivacionesController → reactivacionesService`: `registrarReactivacion(data)`.
4. `reactivacionesService → apiClient`: `POST /cu15/reactivaciones`.
5. `apiClient → ReactivacionesController`: `store(Request)`.
6. `ReactivacionesController → ServicioInternet`: `lockForUpdate()->findOrFail` + verifica `CORTADO`.
7. `ReactivacionesController → ReactivacionServicio`: `create` (tipoAccion=`REACTIVACION`).
8. `ReactivacionesController → ServicioInternet`: `estado_servicio='ACTIVO'`.
9. `ReactivacionesController → AuditLogger`: `log('CU15','REACTIVAR_SERVICIO', …)`.
10. `ReactivacionesController → apiClient`: `201 {reactivacion, servicio}` → `reload`.

**6. Elementos para el diagrama de análisis de clases.**
| Clase/artefacto | Archivo | Responsabilidad | Métodos / estado | Relaciones |
| :--- | :--- | :--- | :--- | :--- |
| `ReactivacionesController` | `.../CU15.../ReactivacionesController.php` | Listar/reactivar | `index`, `store` | usa `ReactivacionServicio`, `ServicioInternet`, `EstadoServicio` |
| `ReactivacionServicio` | `.../CU15.../ReactivacionServicio.php` | Acción REACTIVACION | `servicio()`, `operador()`, `pago()`; scope `tipoAccion='REACTIVACION'`; `$table='AccionServicio'` | `servicio → ServicioInternet`, `operador → User`, `pago → Pago` |
| `useReactivacionesController` | `.../useReactivacionesController.js` | Estado | `reactivaciones, showModal, serviciosCortados, formReactivacion, handleCrear, reload` | usa el servicio |
| `ReactivacionesView` | `.../ReactivacionesView.jsx` | Frontera | sin props declaradas (App pasa `user`, no se usa) | hook |
| `reactivacionesService` | `.../reactivacionesModel.js` | Adaptador API | `fetchReactivaciones`, `fetchServicios` (`GET /cu08/servicios`), `registrarReactivacion` | usa `apiClient` |

**7. Validaciones y campos.** `servicio_id required|exists:ServicioInternet,idServicio`, `pago_id nullable|exists:Pago,idPago`, `costo_reactivacion nullable|numeric|min:0`, `observaciones nullable|string|max:500`.

**8. Referencias.** `routes/api.php:176-180`; `ReactivacionesController.php:23-84`; `ReactivacionServicio.php`; test `CiclosUnoDosTest.php` (`test_cu15_reactiva_servicio_cortado`).

---

<a id="cu16"></a>
## 19. CU16 — Gestionar Planes de Internet (catálogo)

**1. Objetivo y estado.** CRUD del catálogo de planes; **baja lógica** (desactivar). **Implementado (verificado).**

**2. Actores y permisos.** Lectura (`planes.view`): Admin, Secretaría. Escritura (`planes.assign`): Admin, Secretaría. Técnico: sin permiso → 403.

**3. Flujo / precondiciones / resultado / errores.** Listado (filtro `?activo=1|0`), detalle con historial, crear (201), editar/activar, **desactivar (`activo=false`, nunca borra)**. Mensajes: `Planes de Internet obtenidos exitosamente.`, `Plan de Internet registrado exitosamente.`, `Plan de Internet obtenido exitosamente.`, `Plan de Internet actualizado exitosamente.`, `Plan de Internet desactivado exitosamente.`

**4. Componentes para el diagrama de comunicación.**
| Elemento | Nombre exacto | Archivo |
| :--- | :--- | :--- |
| Actor | Admin / Secretaría | — |
| Vista/Frontera | `PlanesInternetView` | `frontend/src/views/.../CU16_GestionarCatalogoPlanes/` |
| Controlador frontend | `usePlanInternetController` | `frontend/src/controllers/.../CU16.../` |
| Servicio/Modelo API | `planInternetService` | `frontend/src/models/.../CU16.../planInternetModel.js` |
| Ruta HTTP | `/api/planes`, `/api/planes/{id}` | `backend/routes/api.php` |
| Controlador backend | `PlanInternetController` | `backend/app/Http/Controllers/.../CU16_GestionarCatalogoPlanes/` |
| Modelos | `PlanInternet`, `AsignacionPlan` | `backend/app/Models/.../CU16_GestionarCatalogoPlanes/`, `.../CU17_AsignarCambiarPlanInternet/` |
| Tablas | `PlanInternet`, `AsignacionPlan` | migración |

**5. Mensajes numerados (crear plan).**
1. `Actor → PlanesInternetView`: «Nuevo Plan» + datos.
2. `PlanesInternetView → usePlanInternetController`: `openCreate` / `setFormPlan` / `handleSubmit`.
3. `usePlanInternetController → planInternetService`: `createPlan(data)`.
4. `planInternetService → apiClient`: `POST /planes`.
5. `apiClient → PlanInternetController`: `store(Request)`.
6. `PlanInternetController → PlanInternet`: `validarPlan` + `create`.
7. `PlanInternetController → AuditLogger`: `log('CU16','CREAR_PLAN', …)`.
8. `PlanInternetController → apiClient`: `201 {plan}` → `reload`.

**Desactivar (baja lógica):** `PlanesInternetView → cambiarEstado(plan,false) → planInternetService.desactivarPlan(id) → DELETE /planes/{id} → PlanInternetController@destroy → update(activo=false) + auditoría('DESACTIVAR_PLAN') → 200`.

**6. Elementos para el diagrama de análisis de clases.**
| Clase/artefacto | Archivo | Responsabilidad | Métodos / estado | Relaciones |
| :--- | :--- | :--- | :--- | :--- |
| `PlanInternetController` | `.../CU16.../PlanInternetController.php` | CRUD catálogo | `index, store, show, update, destroy`; `validarPlan` | usa `PlanInternet`, `AsignacionPlan`, `AuditLogger` |
| `PlanInternet` | `.../CU16_GestionarCatalogoPlanes/PlanInternet.php` | Plan | `asignaciones()`; `$table='PlanInternet'`; alias `nombre_plan` etc. | `asignaciones → AsignacionPlan` |
| `usePlanInternetController` | `.../usePlanInternetController.js` | Estado | `planes, formPlan, setFormPlan, handleSubmit, editingId, openCreate, openEdit, closeModal, cambiarEstado, savingId, reload` | usa el servicio |
| `PlanesInternetView` | `.../PlanesInternetView.jsx` | Frontera | prop `{user}`; gate `planes.assign` | — |
| `planInternetService` | `.../planInternetModel.js` | Adaptador API | `fetchPlanes`, `createPlan`, `updatePlan`, `desactivarPlan` | usa `apiClient` |

**7. Validaciones y campos.** `nombre_plan required|string|max:50`, `velocidad_mbps required|integer|min:1`, `precio_mensual required|numeric|min:0`, `descripcion nullable|string|max:1000`, `activo sometimes|boolean` (en update, `sometimes`).

**8. Referencias.** `routes/api.php:182-208`; `PlanInternetController.php:37-158`; `PlanInternet.php`; tests `Cu16PlanInternetApiTest.php`, `PlanesApiTest.php`.

---

<a id="cu17"></a>
## 20. CU17 — Asignar o cambiar el plan de un servicio

**1. Objetivo y estado.** Asignar/cambiar plan conservando el historial completo. **Implementado (verificado).**

**2. Actores y permisos.** Historial (`planes.view`): Admin, Secretaría. Asignar (`planes.assign`): Admin, Secretaría. Técnico: 403.

**3. Flujo / precondiciones / resultado / errores.** Precondición: plan **activo**. En una transacción: cierra la asignación vigente (`fechaFin`) y crea la nueva con `precio_aplicado` y usuario autenticado. Error: `El plan indicado no existe o está inactivo.`. Mensajes: `Historial de planes del servicio obtenido exitosamente.`, `Plan asignado al servicio exitosamente.` (201).

**4. Componentes para el diagrama de comunicación.**
| Elemento | Nombre exacto | Archivo |
| :--- | :--- | :--- |
| Actor | Admin / Secretaría | — |
| Vista/Frontera | `AsignarPlanView` | `frontend/src/views/.../CU17_AsignarCambiarPlanInternet/` |
| Controlador frontend | `useAsignacionPlanController` | `frontend/src/controllers/.../CU17.../` |
| Servicio/Modelo API | `asignacionPlanService` | `frontend/src/models/.../CU17.../asignacionPlanModel.js` |
| Ruta HTTP | `/api/cu08/servicios/{servicio}/planes` | `backend/routes/api.php` |
| Controlador backend | `AsignacionPlanController` | `backend/app/Http/Controllers/.../CU17_AsignarCambiarPlanInternet/` |
| Modelos | `AsignacionPlan`, `PlanInternet`, `ServicioInternet`, `User` | `backend/app/Models/.../` |
| Tablas | `AsignacionPlan`, `PlanInternet`, `ServicioInternet`, `Usuario` | migración |

> **Contrato:** la ruta vive bajo `cu08/servicios/{servicio}/planes` (no se duplica); solo el **controlador** es de CU17. Es consumida por CU17 y CU08.

**5. Mensajes numerados (cambiar plan).**
1. `Actor → AsignarPlanView`: elige servicio y «Asignar / Cambiar».
2. `AsignarPlanView → useAsignacionPlanController`: `seleccionarServicio(id)` → `openAsignar` → `setForm` → `handleAsignar`.
3. `useAsignacionPlanController → asignacionPlanService`: `fetchHistorial(servicioId)` (`GET …/planes`), `fetchPlanes()` (`GET /planes`), `asignarPlan(servicioId, data)`.
4. `asignacionPlanService → apiClient`: `POST /api/cu08/servicios/{servicio}/planes`.
5. `apiClient → AsignacionPlanController`: `store(Request,$servicio)`.
6. `AsignacionPlanController → PlanInternet`: valida plan activo (`Rule::exists(...)->where('activo',true)`).
7. `AsignacionPlanController → AsignacionPlan` (transacción): `update(fechaFin)` a la vigente.
8. `AsignacionPlanController → AsignacionPlan`: `create` (nueva asignación, `fecha_fin=null`, `precio_aplicado`).
9. `AsignacionPlanController → ServicioInternet`: actualiza snapshot de plan.
10. `AsignacionPlanController → AuditLogger`: `log('CU17','ASIGNAR_PLAN', …)`.
11. `AsignacionPlanController → apiClient`: `201 {asignacion}`.

**6. Elementos para el diagrama de análisis de clases.**
| Clase/artefacto | Archivo | Responsabilidad | Métodos / estado | Relaciones |
| :--- | :--- | :--- | :--- | :--- |
| `AsignacionPlanController` | `.../CU17.../AsignacionPlanController.php` | Historial/asignación | `index`, `store` | usa `AsignacionPlan`, `PlanInternet`, `ServicioInternet` |
| `AsignacionPlan` | `.../CU17_AsignarCambiarPlanInternet/AsignacionPlan.php` | Asignación de plan | `servicio()`, `plan()`, `usuario()`, `estaVigente()`; `$table='AsignacionPlan'` | `servicio → ServicioInternet`, `plan → PlanInternet`, `usuario → User` |
| `PlanInternet` | `.../CU16_GestionarCatalogoPlanes/PlanInternet.php` | Catálogo | `asignaciones()` | `asignaciones → AsignacionPlan` |
| `useAsignacionPlanController` | `.../useAsignacionPlanController.js` | Estado | `servicios, planes, servicioId, servicio, asignaciones, planVigente, loadingHistorial, showModal, form, handleAsignar, seleccionarServicio, reload` | usa el servicio |
| `AsignarPlanView` | `.../AsignarPlanView.jsx` | Frontera | prop `{user}`; gate `planes.assign` | — |
| `asignacionPlanService` | `.../asignacionPlanModel.js` | Adaptador API | `fetchServicios`, `fetchPlanes`, `fetchHistorial(servicioId)`, `asignarPlan(servicioId,data)` | usa `apiClient` |

**7. Validaciones y campos.** `plan_id required|integer|exists('PlanInternet','idPlan')->where('activo',true)`, `motivo_cambio nullable|string|max:255`. `AsignacionPlan`: `fechaInicio`, `fechaFin`, `precioAplicado`, `motivoCambio`, `idServicio`, `idPlan`, `idUsuario` (alias `fecha_inicio`, `fecha_fin`, `precio_aplicado`, `motivo_cambio`).

**8. Referencias.** `routes/api.php:210-225`; `AsignacionPlanController.php:39-121`; `AsignacionPlan.php`; test `PlanesApiTest.php` (`test_cambiar_de_plan_conserva_el_historial_anterior`, `test_rechaza_plan_inactivo`).

---

## 21. Cobertura y verificabilidad

- **CU01–CU17: implementación verificada** en backend (controlador + modelo + ruta + permiso) y frontend (vista + hook + modelo/servicio).
- **Cumplimiento estricto:** no se documentaron CU18–CU31.
- **Discrepancias señaladas (verificadas, no inventadas):**
  1. Nombres oficiales vs. de catálogo: CU03, CU09, CU13, CU15, CU16, CU17 (ver [§0.3](#convenciones)).
  2. Vistas CU05/CU06/CU07: existen `ClienteRegistroView`/`ClienteConsultaView`/`ClienteMantenimientoView` pero `App.jsx` usa la vista unificada `ClientesView`; el modo se decide por permisos, no por CU.
  3. Modelos apuntan a **tablas base** (`PlanInternet`, `AsignacionPlan`, `AccionServicio`, `ServicioInternet`, `EstadoServicio`), no a las vistas de compatibilidad snake_case.
  4. `AlertaVencimiento` (CU12) declara `$table='alertas_vencimiento'`, tabla **no creada** en la migración; el controlador calcula alertas sobre `Mensualidad` y **no** usa ese modelo.
  5. CU17 actualiza `plan_nombre`/`velocidad_mbps`/`precio_mensual` sobre `ServicioInternet`, que **no** son columnas físicas (setters virtuales); los valores se derivan de `asignacionPlanActual`.

Para comprobar cualquier dato: `backend/routes/api.php`, `backend/app/Http/Controllers/...`, `backend/app/Models/...`, `frontend/src/{views,controllers,models}/...`, `backend/database/migrations/0001_01_01_000000_create_telcom_28_tablas.php` y `backend/database/seeders/DatabaseSeeder.php`.
