# API Prueba Tecnica CBC

- Autor: Rafael Morales Venegas

## Indicaciones de Ejecucion:

Esta API fue escrita en TypeScript utilizando Express como base.

Para ejecutar con docker compose, ejecutar el siguiente comando:

```bash
docker compose up --build
```

Para ejecutarlo de manera directa, ejecutar los siguientes comandos:

```bash
npm install
API_KEY=dev-api-key npm run dev # inicia un ambiente con hot reloading
API_KEY=dev-api-key npm run build && npm run serve # Transpila hacia JavaScript y ejecuta
```

Se puede consumir este API con el siguiente comando de ejemplo:

```bash
curl -H "X-API-Key: dev-api-key" http://localhost:8000/proyectos
```

Se utilizan las siguientes variables de Ambiente:

| Variable             | Descripción                                                         | Por defecto              |
| -------------------- | ------------------------------------------------------------------- | ------------------------ |
| `API_KEY`            | **Obligatoria.** Clave que deben enviar los clientes en `X-API-Key` | — (el proceso no inicia) |
| `PORT`               | Puerto de esta API                                                  | `3000`                   |
| `SOURCE_BASE_URL`    | URL base de la fuente externa                                       | `http://localhost:8001`  |
| `SOURCE_API_KEY`     | Clave de la fuente externa                                          | `dev-source-key`         |
| `DB_PATH`            | Ruta del archivo SQLite                                             | `./data/proyectos.db`    |
| `DIR_DESCARTADOS`    | Carpeta del archivo de rechazados                                   | `./output`               |
| `INGEST_ON_START`    | Ejecutar una ingesta al iniciar (`true`/`false`)                    | `true`                   |
| `INGEST_INTERVAL_MS` | Intervalo de reingesta periódica en ms (`0` = desactivada)          | `0`                      |

## Endpoints

Todos requieren el header `X-API-Key`; sin el o con una clave incorrecta responden `401`.

- `GET /proyectos` — filtros opcionales `region`, `estado` (valores canónicos) y `monto_min` (millones de USD, inclusivo). Paginación con `page` (desde 1) y `page_size` (por defecto 20, máximo 100). Orden por `id` ascendente. Parámetros inválidos responden `400`.
- `GET /resumen` — cantidad y monto total (MM USD) por región con proyectos.
- `POST /ingesta` — dispara una ingesta manual y devuelve un resumen (`recibidos`, `validos`, `descartados`, `cambios`).

## Como se dispara la ingesta

1. **Al inicial** (con `INGEST_ON_START` = true). Si la fuente falla sirve solo aquello que tenga en su persistencia.

2. **Periodico** segun la variable de ambiente `INGEST_INTERVAL_MS`, y solo cuando esta tiene un valor mayor a cero.

3. **Manual** mediante un POST request hace `/ingesta`.

Esta ingesta recorre todas las paginas del mock-api con un page_size de 50; reintentos en 429 segun el header de Retry-After; y 5XX con valor incremental pero aleatoreo con el fin de no sobrecargar el API de ingesta en caso de multiples clientes reintentando. Estos reintentos ocurren un maximo de 3 veces y de forma idempotente: Se guarda via upsert por id, con un 'rompe-empate' decidido por el campo `actualizado_en` mas reciente.

## Normalizacion y rechazados

Las reglas siguen lo estipulado en `CONTRATO.md`, ontos a millones de USD, fechas ISO, region, etc.

Los registros invalidos se escriben en `./output/proyectos_descartados.csv`, via la ruta configurable mediante la variable de ambiente `DIR_DESCARTADOS` con columnas id,nombre,motivo. El archivo se sobreescribe en cada ingesta.

## Persistencia

**SQLite** mediante la dependencia `better-sqlite3`; Se elige para este proyecto debido a lo ligero y de poco mantenimiento. El archivo queda en `./data/proyectos.db`.

## Arquitectura

Capas clasicas, cada una con una responsabilidad:

```
src/
    clients/        # Clientes HTTP con manejo de timeouts y reintentos.
    controllers/    # rutas de express, validacion de parametros.
    middleware/     # Relacionado a express; aqui vive la validacion de API KEY
    model/          # Tipos de dominio y funciones de normalizacion.
    services/       # Logica de aplicacion (ingesta, consulta).
    store/          # Capa que habla con la persistencia.
```

Esta arquitectura es clasica debido a lo reemplazable de los componentes; para el caso concreto, pasar de SQLite a otro motor de base de datos solo implica un cambio en `src/store/sqlite.proyecto.store.ts` y en `src/index.js`

## Supuestos

- Al fallar la ingesta se sirven los datos anteriormente conseguidos y guardados en base de datos.
- El monto sin unidad se interpreta como unidades de dolar, o sea, 850000 equivale a 0.85
- Los filtros de region y estado no distinguen mayusculas.
- Solo una instancia del servicio escribe en la base de datos.

## Uso de IA

Use IA como apoyo en implementaciones puntuales; el parseo de fechas, paginacion, revision. La arquitectura en capas es de diseño propio, inspirada en como se estructuraria una API en C# o Rust, u otros lenguajes compilados clasicos.

## Que haria con mas tiempo

1. **Test Unitarios**. Principalmente en la normalizacion de montos, fechas, etc.
2. **Deteccion de Cambios** entre ejecuciones. No fue implementado para este proyecto.
3. **Logs estructurados** y un endpoint de `/health` con informacion realmente util.
