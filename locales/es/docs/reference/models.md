# Modelos y convenciones

[Índice](../README.md) · [OpenAPI](../../../../openapi.json)

## Convenciones generales

| Tema | Contrato |
| --- | --- |
| Transporte | HTTPS |
| Datos | JSON UTF-8 en respuestas correctas, excepto la revocación vacía |
| Nombres JSON | `camelCase`, excepto campos OAuth en `snake_case` |
| IDs | Enteros; IDs positivos de 64 bits en rutas |
| Fechas de respuesta | Timestamps RFC3339, excepto `startDate`/`endDate` en búsqueda autenticada |
| Fechas de entrada de biblioteca | Prefiere `YYYY-MM-DD`; también acepta RFC3339, `null` y `""` |
| Listas | `{ "items": [...] }`, sin `data` |
| Campos no disponibles | A menudo `null`; distingue null, cero y cadenas vacías |

En JavaScript, considera la precisión de enteros mayores que `Number.MAX_SAFE_INTEGER`. Los IDs son números JSON; usa un analizador apropiado para preservar valores exactos de 64 bits.

## Media: detalles públicos

| Campo | Tipo | Significado |
| --- | --- | --- |
| `id` | integer | ID interno de Branilist |
| `slug` | string | Identificador textual |
| `type` | string | `ANIME` o `MANGA` |
| `status` | string | `UPCOMING`, `RELEASING`, `FINISHED`, `CANCELLED`, `HIATUS` |
| `format` | string | Formato como `TV` o `MANGA`; acepta valores futuros |
| `title` | object | `romaji`, `english`, `native`, `portuguese`; las traducciones pueden ser null |
| `description` | string/null | Sinopsis |
| `coverImage`, `bannerImage` | string/null | URL de imágenes |
| `episodes`, `chapters` | integer/null | Totales conocidos |
| `seasonYear` | integer/null | Año de temporada |
| `averageScore` | integer/null | Puntuación agregada del catálogo, escala porcentual 0–100 |
| `popularity` | integer | Popularidad registrada |
| `isAdult` | boolean | Indicador de contenido adulto |

`averageScore` usa una escala distinta de `score` en la biblioteca. Sanea las descripciones antes de tratarlas como HTML confiable.

## Modelos resumidos

| Modelo | Campos |
| --- | --- |
| Búsqueda pública | `id`, `slug`, `type`, `format`, `title` sin `native`, `coverImage`, `averageScore`, `popularity` |
| Medio de biblioteca | `id`, `slug`, `type`, `title` sin `native`, `coverImage` |
| Medio de historial | `id`, `slug`, `type`, `title` como cadena, `coverImage` |
| Búsqueda autenticada | Campos propios descritos en [Cuenta](account.md), incluidas fechas y sinopsis en inglés |

No son objetos Media completos. Un campo ausente no equivale necesariamente a null: cada ruta tiene su modelo de respuesta.

## LibraryEntry

`mediaId`, `status`, `progress`, `score`, `repeatCount`, `startedAt`, `completedAt`, `private`, `updatedAt`, `media`.

Los **estados de lista** son `PLANNING`, `CURRENT`, `COMPLETED`, `PAUSED` y `DROPPED`. Son distintos del estado de publicación en `media.status`. El progreso y las repeticiones son enteros. Las puntuaciones personales son 0.5–10 en incrementos de 0.5, o null.

## HistoryItem

`mediaId`, `eventType`, `status`, `previousStatus`, `progress`, `previousProgress`, `progressDelta`, `score`, `repeatCount`, `createdAt`, `media`. Los valores anteriores y las puntuaciones pueden ser null. No sumes indiscriminadamente todos los eventos para calcular el consumo.

## Collection

`id`, `mediaType`, `name`, `slug`, `description`, `color`, `visibility`, `tags`, `coverMediaId`, `position`, `publishedAt`, `itemCount`, `createdAt`, `updatedAt`.

No deduzcas `visibility` de la configuración del perfil; conserva la cadena recibida. La descripción, el ID de portada y la fecha de publicación pueden ser null. Si no se almacena un array, `tags` puede ser null; acepta tanto null como `[]`.

## Compatibilidad

Ignora los campos desconocidos. No dependas del orden de propiedades JSON o scopes, ni de listas cerradas de formatos/eventos. `/api/v1` versiona el contrato REST; la versión del producto no sustituye ese prefijo.
