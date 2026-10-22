# Perfil, búsqueda, historial y colecciones

[Índice](../README.md) · [Modelos](models.md) · [OAuth](../authentication.md)

Todas las solicitudes usan `Authorization: Bearer ACCESS_TOKEN`. Las API keys no permiten acceder a estas rutas.

Las rutas `/me` consultan al propietario del token. Para otra persona, consulta [datos públicos de usuarios](public-users.md).

| Método | Ruta | Scope |
| --- | --- | --- |
| GET | `/api/v1/me` | `profile:read` |
| GET | `/api/v1/me/search` | `library:read` |
| GET | `/api/v1/me/activity` | `activity:read` |
| GET | `/api/v1/me/collections` | `collections:read` |

## GET /api/v1/me

```sh
curl --fail-with-body 'https://branilist.com/api/v1/me' \
  -H "Authorization: Bearer $BRANILIST_ACCESS_TOKEN"
```

```json
{"id":42,"username":"example","displayName":"Example Person","avatarUrl":null,"bannerUrl":null,"bio":null,"createdAt":"2026-01-01T00:00:00Z","scopes":["profile:read","library:read"]}
```

No devuelve el correo electrónico. `scopes` enumera los permisos del token. Las cuentas no disponibles o inactivas devuelven 404.

## GET /api/v1/me/search

Búsqueda avanzada en nombre del usuario. Respeta la configuración global de contenido adulto y su preferencia de ocultarlo. La autorización no garantiza resultados adultos.

| Parámetro | Regla |
| --- | --- |
| `q` | Obligatorio; al menos 2 caracteres Unicode tras eliminar espacios externos |
| `limit` | Entero 1–30, predeterminado 20; valores inválidos o fuera de rango usan 20 |
| `type` | Opcional: `ANIME` o `MANGA`, normalizado a mayúsculas; otros valores devuelven 400 |

```sh
curl --fail-with-body --get 'https://branilist.com/api/v1/me/search' \
  -H "Authorization: Bearer $BRANILIST_ACCESS_TOKEN" \
  --data-urlencode 'q=Frieren' --data-urlencode 'type=MANGA' --data-urlencode 'limit=10'
```

Devuelve 200 con `{ "items": [...] }` por relevancia. Cada elemento contiene `id`, `slug`, `type`, `status`, `format`, `title` en cuatro idiomas, `description`, `descriptionEnglish`, `coverImage`, `chapters`, `averageScore`, `startDate`, `endDate` e `isAdult`. Las fechas usan `YYYY-MM-DD` o `null`. **No es el modelo Media completo**: por ejemplo, no incluye `episodes`.

Usa `Cache-Control: private, no-store`. Sin coincidencias devuelve un array vacío. No tiene paginación. La búsqueda no disponible puede devolver 503; las cuentas no disponibles, 404.

## GET /api/v1/me/activity

Devuelve hasta **200 registros del historial personal**, del más reciente al más antiguo, sin paginación ni cursores. No es un feed público de toda la plataforma.

```sh
curl --fail-with-body 'https://branilist.com/api/v1/me/activity' \
  -H "Authorization: Bearer $BRANILIST_ACCESS_TOKEN"
```

```json
{"items":[{"mediaId":123,"eventType":"UPDATED","status":"CURRENT","previousStatus":"CURRENT","progress":3,"previousProgress":2,"progressDelta":1,"score":8.5,"repeatCount":0,"createdAt":"2026-10-21T12:00:00Z","media":{"id":123,"slug":"example-anime","type":"ANIME","title":"Example","coverImage":null}}]}
```

Los eventos incluyen `CREATED`, `UPDATED` y `REMOVED`; acepta tipos futuros. La eliminación conserva el estado anterior y usa `progressDelta: 0`, en lugar de consumo negativo. Aquí `media.title` es una **cadena**, no un objeto multilingüe.

## GET /api/v1/me/collections

```sh
curl --fail-with-body 'https://branilist.com/api/v1/me/collections' \
  -H "Authorization: Bearer $BRANILIST_ACCESS_TOKEN"
```

```json
{"items":[{"id":7,"mediaType":"ANIME","name":"Season favorites","slug":"season-favorites","description":null,"color":"","visibility":"PRIVATE","tags":[],"coverMediaId":null,"position":0,"publishedAt":null,"itemCount":2,"createdAt":"2026-10-01T12:00:00Z","updatedAt":"2026-10-21T12:00:00Z"}]}
```

Incluye las colecciones privadas del propietario del token. Ordena por `position` y después por fecha de creación descendente. No tiene límite ni paginación actuales. `itemCount` es una cantidad; no incluye los medios de la colección. La API pública v1 no tiene rutas para crear o actualizar colecciones.

## Errores comunes

Las solicitudes correctas devuelven 200. Los tokens inválidos o sin scope devuelven 401. Los manejadores anteriores pueden devolver 429 si falta Bearer; consulta [errores](../errors.md). Las consultas pueden fallar con 500, los límites/cuota con 429 y las integraciones no disponibles con 503.
