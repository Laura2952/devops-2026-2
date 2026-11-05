# Express + TypeScript API (PostgreSQL + MongoDB)

API en Node.js con Express y TypeScript que expone endpoints contra PostgreSQL y MongoDB.

## Requisitos

- Node.js 18+
- Docker / Docker Compose (recomendado)
- O PostgreSQL y MongoDB locales si no usas Docker

## Configuración

Antes de ejecutar los comandos, entra a la carpeta del proyecto (la que contiene `package.json`). Si estás en la carpeta contenedora `devops-2026-2`, ejecuta:

```powershell
cd .\devops-2026-2
```

Confirma que estás en la carpeta correcta:

```powershell
Get-ChildItem package.json
```

1. Copia el archivo de entorno si vas a ejecutar la API localmente:

```powershell
Copy-Item .env.example .env
```

2. Ajusta credenciales en `.env` si hace falta.

## Arranque con Docker (API + Postgres + MongoDB + Redis)

Desde la carpeta del proyecto (donde está `package.json`), levanta todo el stack:

```powershell
npm run docker:up
```

Si Docker informa que el puerto `6379` ya está ocupado, asigna otro puerto del equipo para Redis y vuelve a levantar el stack:

```powershell
$env:REDIS_PORT = "6380"
npm run docker:up
```

Este proyecto publica Redis en el puerto `6380` del equipo y lo sigue usando en el puerto `6379` dentro de Docker. Así se evita el conflicto con otro servicio local que ya use `6379`. La API queda disponible en `http://localhost:3000`.

En otra terminal, ubicada también en la carpeta del proyecto, consulta los logs de la API:

```powershell
npm run docker:logs
```

Cuando veas `Server running on http://localhost:3000`, en una tercera terminal envía solicitudes para medir:

```powershell
curl.exe http://localhost:3000/health
curl.exe http://localhost:3000/api/mongo/health
```

La respuesta HTTP se muestra en la tercera terminal y la medición se imprime en la terminal de logs, por ejemplo:

```text
[route-timing] GET /health | 200 | 7.11 ms
```

`200` indica que la solicitud fue exitosa; `7.11 ms` es el tiempo transcurrido desde que Express recibió la solicitud hasta que terminó de enviar la respuesta. El valor observado puede variar entre solicitudes y no es una medición de carga o rendimiento sostenido.

Para detener los contenedores (desde la carpeta del proyecto):

```bash
npm run docker:down
```

Cada solicitud que llega a la API imprime el método, la ruta, el código HTTP y el tiempo de respuesta en milisegundos. Para instrucciones de medición de rutas y de conexiones/operaciones de PostgreSQL, MongoDB y Redis, consulta [src/middleware/README.md](./src/middleware/README.md). El benchmark de bases de datos se ejecuta con `npm run db:benchmark` desde la carpeta del proyecto.

Ejecutar las pruebas localmente:

```bash
npm test
```

Solo bases de datos (API en local con `npm run dev`):

```bash
docker compose up -d postgres mongo redis
```

## Instalación y arranque local

Desde la carpeta del proyecto, instala dependencias (solo la primera vez) y arranca la API:

```bash
npm install
npm run dev
```

Build de producción:

```bash
npm run build
npm start
```

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Health del API |
| GET | `/api/postgres/health` | Health de PostgreSQL |
| GET | `/api/postgres/users` | Lista usuarios (Postgres) |
| POST | `/api/postgres/users` | Crea usuario (Postgres) |
| GET | `/api/mongo/health` | Health de MongoDB |
| GET | `/api/mongo/users` | Lista usuarios (Mongo) |
| POST | `/api/mongo/users` | Crea usuario (Mongo) |
| GET | `/api/redis/health` | Health de Redis |
| GET | `/api/redis/users` | Lista usuarios (Redis) |
| POST | `/api/redis/users` | Crea usuario (Redis) |
| GET | `/api/products` | Lista productos (MongoDB) |
| POST | `/api/products` | Crea un producto (MongoDB) |

### Ejemplos

```bash
curl http://localhost:3000/health

curl http://localhost:3000/api/postgres/health
curl -X POST http://localhost:3000/api/postgres/users ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Ana\",\"email\":\"ana@example.com\"}"

curl http://localhost:3000/api/mongo/health
curl -X POST http://localhost:3000/api/mongo/users ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Luis\",\"email\":\"luis@example.com\"}"

curl http://localhost:3000/api/redis/health
curl http://localhost:3000/api/redis/users
curl -X POST http://localhost:3000/api/redis/users ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Eva\",\"email\":\"eva@example.com\"}"

curl http://localhost:3000/api/products
curl -X POST http://localhost:3000/api/products ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Teclado\",\"price\":120000}"
```

Body esperado en POST `/users`:

```json
{
  "name": "Nombre",
  "email": "correo@example.com"
}
```
