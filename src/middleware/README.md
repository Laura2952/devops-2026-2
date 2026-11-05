# Medición de tiempos

En esta carpeta está el middleware que mide las solicitudes HTTP de Express y el script que mide las conexiones y operaciones de prueba de las bases de datos.

## Medición de rutas

`route-timing.middleware.ts` mide cada solicitud HTTP procesada por la aplicación. Se instala antes de las rutas en `src/app.ts`, por lo que también registra respuestas de error y rutas no encontradas.

Al recibir la solicitud, guarda el tiempo con `performance.now()`. Al terminar la respuesta, imprime en los logs de la API el método, la ruta, el código HTTP y el tiempo transcurrido:

```text
[route-timing] GET /health | 200 | 7.11 ms
```

El tiempo incluye el trabajo de los middleware, el handler de la ruta y las esperas por operaciones de base de datos. No incluye el tiempo que tarda el cliente en recibir o procesar la respuesta. Los tiempos pueden variar entre solicitudes; no son una prueba de carga.

### Cómo iniciar el proyecto y medir rutas

Los siguientes pasos asumen que estás en la carpeta que contiene `package.json`. En la **terminal 1**, inicia Docker Compose:

```powershell
cd "C:\Users\laura\OneDrive\Documentos\Universidad\Octavo semestre\Devoops\devops-2026-2\devops-2026-2"
npm run docker:up
```

Si otro servicio ya ocupa el puerto `6379`, usa `6380` para Redis de este proyecto. Define la variable en la terminal antes de levantar los contenedores:

```powershell
$env:REDIS_PORT = "6380"
npm run docker:up
```

La salida de Docker confirma que los contenedores iniciaron, pero todavía no mide las rutas. Por ejemplo:

```text
 ✔ devops-2026-2-api          Built                                        0.0s 
 ✔ Container devops-redis     Healthy                                      1.5s 
 ✔ Container devops-mongo     Healthy                                      1.5s 
 ✔ Container devops-postgres  Healthy                                      1.5s 
 ✔ Container devops-api       Started                                      2.0s 
```

Espera hasta que Docker muestre los contenedores como `Healthy` o `Started`.

En la **terminal 2**, muestra los logs de la API:

```powershell
cd "C:\Users\laura\OneDrive\Documentos\Universidad\Octavo semestre\Devoops\devops-2026-2\devops-2026-2"
npm run docker:logs
```

Cuando aparezca `Server running on http://localhost:3000`, en la **terminal 3** envía solicitudes a las rutas que quieres medir. Cada solicitud generará una línea `[route-timing]` en la terminal 2:

```powershell
curl.exe http://localhost:3000/health
curl.exe http://localhost:3000/api/postgres/health
curl.exe http://localhost:3000/api/postgres/users
curl.exe http://localhost:3000/api/mongo/health
curl.exe http://localhost:3000/api/mongo/users
curl.exe http://localhost:3000/api/redis/health
curl.exe http://localhost:3000/api/redis/users
curl.exe http://localhost:3000/api/products
```

La respuesta HTTP aparece en la terminal 3; los tiempos aparecen en la terminal 2. Docker mostrando `Healthy` o `Started` solo indica que los contenedores iniciaron; no significa que se hayan enviado solicitudes a las rutas. Estos comandos miden las rutas `GET`. Las rutas `POST` también se miden si se las llama, pero crean datos nuevos.

### Resultados observados de rutas

En los logs de la API se observó esta solicitud:

```text
[route-timing] GET /health | 200 | 7.11 ms
```

También se midieron las 12 rutas en una ejecución anterior desde el cliente. Estos tiempos incluyen el recorrido de ida y vuelta a la API, por lo que no son directamente comparables con el tiempo interno `[route-timing]`. Son valores de esa ejecución y cambiarán. Se conservan como referencia: para obtener nuevas mediciones, vuelve a enviar solicitudes con los comandos `curl.exe` anteriores; no existe un comando `routes:benchmark`.

```text
[route-benchmark] GET /health | 200 | 104.38 ms
[route-benchmark] GET /api/postgres/health | 200 | 38.65 ms
[route-benchmark] GET /api/postgres/users | 200 | 97.65 ms
[route-benchmark] POST /api/postgres/users | 201 | 42.59 ms
[route-benchmark] GET /api/mongo/health | 200 | 18.11 ms
[route-benchmark] GET /api/mongo/users | 200 | 12.99 ms
[route-benchmark] POST /api/mongo/users | 201 | 41.21 ms
[route-benchmark] GET /api/redis/health | 200 | 10.61 ms
[route-benchmark] GET /api/redis/users | 200 | 12.54 ms
[route-benchmark] POST /api/redis/users | 201 | 8.52 ms
[route-benchmark] GET /api/products | 200 | 24.01 ms
[route-benchmark] POST /api/products | 201 | 40.32 ms
```

`200` indica una respuesta correcta a una solicitud `GET`; `201` indica que se creó correctamente un registro con `POST`. Las cuatro solicitudes `POST` anteriores crearon registros únicos de prueba.

## Medición de bases de datos

`db-timing.ts` mide por separado la conexión inicial y una operación de solo lectura para PostgreSQL, MongoDB y Redis. No crea ni modifica datos, y no necesita que la API (`npm run dev`) esté ejecutándose.

Con los servicios Docker levantados como en el paso anterior, abre otra terminal. Desde la carpeta del proyecto, ejecuta el benchmark. Si Redis está publicado en el puerto local `6380`, configura su URL:

```powershell
cd "C:\Users\laura\OneDrive\Documentos\Universidad\Octavo semestre\Devoops\devops-2026-2\devops-2026-2"
$env:REDIS_URL = "redis://localhost:6380"
npm run db:benchmark
```

Si Redis está publicado en el puerto predeterminado `6379`, basta con:

```powershell
npm run db:benchmark
```

El benchmark mide `SELECT 1` en PostgreSQL y un `ping` en MongoDB y Redis. Los resultados son mediciones puntuales; no constituyen una prueba de carga ni predicen el tiempo de consultas reales con datos.

Si PostgreSQL muestra `password authentication failed`, verifica que las credenciales configuradas correspondan a esa base. En Docker, cambiar las variables de entorno no cambia la contraseña de un volumen de datos ya inicializado. Si Redis no conecta, verifica que `REDIS_URL` use el puerto publicado en el equipo.

### Resultado observado del benchmark de bases de datos

En la última ejecución disponible, MongoDB y Redis conectaron y respondieron al `ping`. PostgreSQL rechazó la contraseña configurada:

```text
[db-timing] PostgreSQL connection | ERROR after 146.13 ms | la autenticación password falló para el usuario «postgres»
MongoDB connected
[db-timing] MongoDB connection | 45.15 ms
[db-timing] MongoDB ping | 5.92 ms
Redis connected
[db-timing] Redis connection | 48.24 ms
[db-timing] Redis ping | 2.05 ms
Redis URL: localhost:6380
```

El benchmark reporta el error de PostgreSQL y termina con código de error si la autenticación falla. Los valores corresponden a esa ejecución; al corregir las credenciales y repetirlo se obtendrán tiempos nuevos.
