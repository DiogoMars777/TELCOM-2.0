# 🐳 GUÍA DE LEVANTAMIENTO CON DOCKER (TELCOM 2.0)

Este documento explica cómo levantar todo el ecosistema de **TELCOM 2.0** (Base de Datos PostgreSQL 16 + Backend Laravel 11/13 con PHP 8.3 + Frontend React SPA con Nginx) utilizando **Docker** y **Docker Compose** en un solo paso.

---

## 🚀 1. Levantamiento Rápido

Desde la raíz del proyecto (`TELCOM-2.0-main`):

```bash
docker compose up -d --build
```

> **¿Qué hace automáticamente este comando?**
> 1. Descarga e inicia **PostgreSQL 16** con comprobación de estado de salud (*healthcheck*).
> 2. Construye el contenedor del **Backend** con PHP 8.3, extensiones de PostgreSQL (`pdo_pgsql`), Composer y dependencias optimizadas.
> 3. Espera a que PostgreSQL esté 100% listo, ejecuta automáticamente las migraciones (`php artisan migrate --force`) y puebla las 28 tablas con el dataset canónico de producción (`php artisan db:seed --force`).
> 4. Construye el contenedor del **Frontend** React con Vite y lo empaqueta en un servidor web **Nginx** optimizado con compresión gzip y proxy inverso hacia el backend.

---

## 🌐 2. URLs de Acceso

| Servicio | URL Local | Descripción |
| :--- | :--- | :--- |
| **Frontend Web** | 👉 **[http://localhost:5173](http://localhost:5173)** | Panel de control SPA React de TELCOM |
| **Backend API** | 👉 **[http://localhost:8000/api](http://localhost:8000/api)** | Endpoints REST de los Casos de Uso CU01–CU17 |
| **Health Check** | 👉 **[http://localhost:8000/up](http://localhost:8000/up)** | Verificación del estado del Backend Laravel |
| **PostgreSQL** | `localhost:5432` | Base de datos `telcom_db` (usuario: `postgres`, pass: `postgres`) |

---

## 🔐 3. Credenciales de Acceso

La base de datos se inicializa con los siguientes usuarios demo:

### 👑 Super Administrador (Acceso Total: CU01 - CU17)
- **Correo:** `admin@telcom.com`
- **Contraseña:** `Admin123*`

### 💼 Soporte Administrador Secundario
- **Correo:** `soporte.admin@telcom.com`
- **Contraseña:** `Admin123*`

---

## 🛠️ 4. Comandos de Gestión y Mantenimiento

### Ver el estado de los contenedores
```bash
docker compose ps
```

### Ver logs en tiempo real
```bash
# Todos los servicios
docker compose logs -f

# Solo Backend
docker compose logs -f backend

# Solo Frontend
docker compose logs -f frontend

# Solo Base de Datos
docker compose logs -f db
```

### Detener los servicios
```bash
docker compose down
```

### Detener y borrar volúmenes (Reinicio desde cero total)
```bash
docker compose down -v
docker compose up -d --build
```

### Ejecutar comandos Artisan dentro del contenedor Backend
```bash
# Limpiar cachés
docker compose exec backend php artisan optimize:clear

# Listar rutas de la API
docker compose exec backend php artisan route:list

# Re-ejecutar seeders
docker compose exec backend php artisan db:seed --force
```

### Conectarse a la consola de PostgreSQL (psql)
```bash
docker compose exec -it db psql -U postgres -d telcom_db
```

---

## 📂 5. Estructura de Docker

```text
TELCOM-2.0-main/
├── docker-compose.yml       # Orquestación de db, backend y frontend
├── .env.example             # Variables de entorno para Docker Compose
├── .env                     # Variables de entorno activas para Docker
├── DOCKER.md                # Este manual
├── backend/
│   ├── Dockerfile           # Imagen PHP 8.3 CLI + extensiones + Composer
│   ├── docker-entrypoint.sh # Espera a PostgreSQL, migraciones, seeders y arranque
│   └── .dockerignore
└── frontend/
    ├── Dockerfile           # Multi-stage: Node.js (build Vite) + Nginx (runtime)
    ├── nginx.conf           # Servidor Nginx con proxy inverso /api/ y soporte SPA
    └── .dockerignore
```
