# 📖 MANUAL OFICIAL DE LEVANTAMIENTO DESDE CERO
### Sistema de Telecomunicaciones (TELCOM) - Arquitectura MVC por Casos de Uso

Este documento detalla paso a paso cómo clonar, configurar y levantar el proyecto completo (Backend Laravel + Frontend React + Base de Datos PostgreSQL) desde una máquina limpia.

---

## 🛠️ 1. Requisitos Previos del Sistema

Antes de iniciar, asegúrate de tener instaladas las siguientes herramientas en tu sistema operativo:

1. **PHP:** Versión `>= 8.2` (Recomendado 8.3).
   - Verificar en terminal: `php -v`
   - **IMPORTANTE (Habilitar PostgreSQL en PHP):**
     En tu archivo `php.ini`, asegúrate de tener descomentadas (sin el `;` al inicio) las líneas:
     ```ini
     extension=pdo_pgsql
     extension=pgsql
     ```
2. **Composer:** Versión `>= 2.2`.
   - Verificar en terminal: `composer -v`
3. **Node.js & npm:** Node `>= 18.x` y npm `>= 9.x`.
   - Verificar en terminal: `node -v` y `npm -v`
4. **PostgreSQL:** Versión `14`, `15` o `16`.
   - Servicio PostgreSQL activo (por defecto en el puerto `5432`).
   - Puedes gestionarlo con consola `psql` o con la herramienta visual **pgAdmin 4**.
5. **Git:**
   - Verificar en terminal: `git --version`

---

## 📥 2. Clonación del Repositorio

Abre tu terminal o PowerShell y clona el proyecto:

```bash
git clone https://github.com/DiogoMars777/TELCOM.git
cd TELCOM
```

La estructura interna que encontrarás es:
```text
TELCOM/
├── backend/       # API Laravel 11/13 + PostgreSQL (MVC por Casos de Uso)
├── frontend/      # SPA React + Vite (MVC por Casos de Uso)
├── README.md      # Resumen general y tabla de Casos de Uso
└── MANUAL_DESPLIEGUE_Y_LEVANTAMIENTO.md
```

---

## 🐘 3. Configuración del Backend (Laravel + PostgreSQL)

### Paso 3.1: Entrar a la carpeta backend
```bash
cd backend
```

### Paso 3.2: Instalar dependencias PHP
```bash
composer install
```

### Paso 3.3: Configurar variables de entorno (`.env`)
Copia la plantilla de configuración:
- En Windows (PowerShell / CMD):
  ```powershell
  copy .env.example .env
  ```
- En Linux / macOS:
  ```bash
  cp .env.example .env
  ```

### Paso 3.4: Generar la clave de la aplicación
```bash
php artisan key:generate
```

### Paso 3.5: Crear y configurar la base de datos PostgreSQL

1. Abre tu gestor de PostgreSQL (**pgAdmin 4** o consola `psql`) y crea una base de datos vacía llamada `telcom_db`:
   ```sql
   CREATE DATABASE telcom_db;
   ```

2. Abre el archivo `backend/.env` con tu editor y configura las credenciales de tu PostgreSQL:
   ```env
   DB_CONNECTION=pgsql
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_DATABASE=telcom_db
   DB_USERNAME=postgres
   DB_PASSWORD=tu_contraseña_aqui
   ```

---

## 🗄️ 4. Carga de Base de Datos

Tienes dos opciones según el estado de tu proyecto:

### OPCIÓN A: Estructura Inicial Limpia (Migraciones + Seeders incluidos)
Si vas a comenzar desde cero con las tablas y datos demo predefinidos:
```bash
php artisan migrate:fresh --seed
```
*Esto creará automáticamente las tablas para los 15 Casos de Uso (sesiones, auditoría, roles, zonas, clientes, servicios, mensualidades, pagos, cortes y reactivaciones) junto con el usuario administrador demo.*

### OPCIÓN B: Importar tu propia Base de Datos (Cuando me mandes tu BD)
Cuando tengas listo tu archivo de base de datos (ejemplo: `telcom_backup.sql` o `backup.dump`):

1. **Desde la terminal con `psql`:**
   ```bash
   psql -U postgres -d telcom_db -f "ruta/hacia/tu_archivo_backup.sql"
   ```
2. **O desde pgAdmin 4:**
   - Clic derecho sobre `telcom_db` -> Seleccionar **Restore** (o abrir el **Query Tool**, cargar el archivo `.sql` y presionar `F5` para ejecutar).
3. **Limpiar cachés de Laravel tras la importación:**
   ```bash
   php artisan optimize:clear
   ```

---

### Paso 3.6: Levantar el servidor Backend
```bash
php artisan serve
```
El servidor backend quedará escuchando en:
👉 **`http://localhost:8000`**

*(Para verificar que está respondiendo, puedes abrir en el navegador `http://localhost:8000/api/cu06/clientes` o ver las rutas en terminal con `php artisan route:list`).*

---

## ⚛️ 5. Configuración y Levantamiento del Frontend (React + Vite)

Abre una **segunda terminal** (mantén el backend corriendo en la primera):

### Paso 5.1: Entrar a la carpeta frontend
```bash
cd frontend
```

### Paso 5.2: Instalar dependencias de Node.js
```bash
npm install
```

### Paso 5.3: Levantar el servidor de desarrollo Vite
```bash
npm run dev
```

La consola mostrará una URL local, usualmente:
👉 **`http://localhost:5173`**

Abre esa dirección en tu navegador preferido.

---

## 🖥️ 6. Uso y Navegación del Sistema

Al abrir la aplicación en tu navegador verás el **Dashboard Central de TELCOM ISP** con la barra lateral izquierda organizada por áreas de negocio:

1. **Seguridad & Auditoría:**
   - **CU01:** Iniciar y Cerrar Sesión (`admin@telcom.com` / `password123`).
   - **CU02:** Bitácora de Auditoría (registro de mutaciones con IP y datos).
   - **CU03:** Gestión de Usuarios Internos, Roles y Permisos.
2. **Infraestructura:**
   - **CU04:** Zonas de Cobertura (nodos de fibra óptica y microondas).
3. **Abonados & Clientes:**
   - **CU05:** Registrar Nuevo Cliente (afiliación con validaciones).
   - **CU06:** Consultar y Buscar Clientes (búsqueda en vivo por CI, código o nombre).
   - **CU07:** Actualizar Datos y Dar Baja Lógica (Soft Delete contable/legal).
4. **Servicios de Internet:**
   - **CU08:** Registrar y Activar Servicio (asignación de IP y MAC de ONT).
5. **Facturación & Cobranzas:**
   - **CU09:** Generar Mensualidades de Servicios (facturación periódica).
   - **CU10:** Gestionar Pago de Mensualidad (cobros por QR, efectivo, tarjeta y recibos).
   - **CU11:** Consultar Historial de Pagos.
6. **Operaciones Técnicas & Cortes:**
   - **CU12:** Visualizar Alertas de Vencimiento (cálculo de mora crítica/alta/media).
   - **CU13:** Consultar Listado de Servicios para Corte.
   - **CU14:** Registrar Corte Realizado (corte lógico o físico).
   - **CU15:** Gestionar Lista y Registro de Reactivaciones (reconexión tras pago).

---

## 🔧 7. Solución de Problemas Frecuentes (Troubleshooting)

- **Error: `could not find driver` en Laravel:**
  - Causa: Falta habilitar la extensión de PostgreSQL en PHP.
  - Solución: Edita `php.ini`, descomenta `extension=pdo_pgsql` y `extension=pgsql`, guarda y reinicia la terminal.
- **Error: `Connection refused` al conectar con PostgreSQL:**
  - Causa: El servicio de PostgreSQL no está corriendo o el puerto/contraseña es incorrecto en el `.env`.
  - Solución: Abre `Services` en Windows y asegúrate de que `postgresql-x64-XX` esté en estado *En ejecución*. Verifica `DB_PASSWORD` en `.env`.
- **El Frontend no conecta con el Backend:**
  - Causa: El backend no está ejecutándose en `http://localhost:8000`.
  - Solución: Ejecuta `php artisan serve` dentro de la carpeta `backend`.
