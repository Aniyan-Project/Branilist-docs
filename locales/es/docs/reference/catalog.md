# Catálogo, búsqueda y versión

[Índice](../README.md) · [Modelos](models.md) · [OpenAPI](../../../../openapi.json)

Origen: `https://branilist.com`. Estas rutas no requieren OAuth. Las API keys son opcionales para consultar el catálogo y realizar búsquedas.

| Método | Ruta | Scope si se envía una API key |
| --- | --- | --- |
| GET | `/api/v1` | Esta ruta no valida la clave |
| GET | `/api/v1/search` | `search:read` |
| GET | `/api/v1/media/{id}` | `catalog:read` |
| GET | `/api/v1/media/mal/{id}` | `catalog:read` |
| GET | `/api/v1/media/anilist/{id}` | `catalog:read` |

## GET /api/v1

Devuelve 200 con `name`, `version`, `oauth`, `authorize` y `docs`. Las URL dependen del despliegue; `oauth` es una ruta relativa. Consulta el [inicio rápido](../getting-started.md).

## GET /api/v1/search

Busca títulos en romaji, inglés y portugués. Ordena por popularidad descendente y luego por ID descendente.

| Parámetro | Obligatorio | Regla |
| --- | --- | --- |
| `q` | Sí | Texto sin espacios externos; la implementación comprueba al menos 2 bytes UTF-8. Usa al menos 2 caracteres en el cliente |
| `limit` | No | Entero entre 1 y 50; predeterminado 20. Los valores inválidos o fuera de rango usan 20 |

```sh
curl --fail-with-body --get 'https://branilist.com/api/v1/search' \
  --data-urlencode 'q=Frieren' --data-urlencode 'limit=10'
```

```json
{"items":[{"id":123,"slug":"example-anime","type":"ANIME","format":"TV","title":{"romaji":"Example","english":"Example","portuguese":null},"coverImage":null,"averageScore":85,"popularity":250}]}
```

Devuelve 200, incluso con `items: []` si no hay coincidencias. No hay `page`, cursor, `total` ni filtro `type`. Para filtrar ANIME/MANGA y aplicar relevancia y preferencias personales, usa la [búsqueda autenticada](account.md).

Errores: 400 por `q` corto; 401 por clave inválida o sin scope; 429 por límites/cuota; 500 por fallos de consulta; 503 si el servicio de integración/cuotas no está disponible.

## GET /api/v1/media/{id}

Obtiene detalles mediante el ID interno de Branilist, un entero positivo de 64 bits.

```sh
curl --fail-with-body 'https://branilist.com/api/v1/media/123'
```

Devuelve 200 con un objeto [Media](models.md), sin envoltorios `data` ni `items`:

```json
{"id":123,"slug":"example-anime","type":"ANIME","status":"FINISHED","format":"TV","title":{"romaji":"Example","english":"Example","native":null,"portuguese":null},"description":"Illustrative synopsis.","coverImage":null,"bannerImage":null,"episodes":12,"chapters":null,"seasonYear":2026,"averageScore":85,"popularity":250,"isAdult":false}
```

Errores: 400 por ID inválido; 404 si no existe; 401, 429, 500 y 503 según la autenticación y disponibilidad.

## GET /api/v1/media/mal/{id}

Busca un ID numérico de **MyAnimeList**:

```sh
curl --fail-with-body 'https://branilist.com/api/v1/media/mal/5114'
```

## GET /api/v1/media/anilist/{id}

Busca un ID numérico de **AniList**:

```sh
curl --fail-with-body 'https://branilist.com/api/v1/media/anilist/16498'
```

Ambas rutas devuelven el mismo modelo Media. El `id` de respuesta siempre es el **ID de Branilist**, utilizado en la biblioteca.

Solo consultan vínculos existentes. No contactan ni importan automáticamente desde los proveedores. Un ID válido del proveedor puede devolver 404 si no existe un vínculo en Branilist. No hay parámetro de tipo. Comparten límites y reglas de caché con los detalles internos, con entradas de caché separadas por proveedor.

Los IDs mal formados, no positivos o fuera del rango de 64 bits devuelven 400. Los vínculos ausentes devuelven 404. Consulta [límites y caché](../rate-limits.md).
