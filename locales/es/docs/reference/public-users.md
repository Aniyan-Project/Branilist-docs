# Datos públicos de otros usuarios

[Índice](../README.md) · [Cuenta del propietario del token](account.md) · [OAuth](../authentication.md)

Estas rutas consultan a otro usuario sin necesitar su token. Envía un access token OAuth válido de tu integración con el scope indicado. Las API keys y sesiones del sitio no sustituyen Bearer. Solo devuelven datos **PUBLIC**, incluso si el usuario consultado es propietario del token. Sigue usando `/me` para tus datos personales autorizados.

## Rutas y autenticación

| Recurso | Por ID | Por username | Scope |
| --- | --- | --- | --- |
| Perfil | `/api/v1/users/id/{id}` | `/api/v1/users/by-username/{username}` | `profile:read` |
| Biblioteca | `/api/v1/users/id/{id}/library` | `/api/v1/users/by-username/{username}/library` | `library:read` |
| Actividad | `/api/v1/users/id/{id}/activity` | `/api/v1/users/by-username/{username}/activity` | `activity:read` |
| Colecciones | `/api/v1/users/id/{id}/collections` | `/api/v1/users/by-username/{username}/collections` | `collections:read` |

Todas usan **GET**. `id` es el ID interno positivo de 64 bits del **usuario**, no de un medio. Username acepta 3–24 letras ASCII, números o `_`, sin distinguir mayúsculas. Los prefijos explícitos distinguen usernames numéricos de IDs.

```sh
curl --fail-with-body 'https://branilist.com/api/v1/users/by-username/example' \
  -H "Authorization: Bearer $BRANILIST_ACCESS_TOKEN"
```

El perfil devuelve `id`, `username`, `displayName`, `avatarUrl`, `bannerUrl`, `bio` y `createdAt`, sin email, scopes del usuario ni información administrativa. Las imágenes y bio pueden ser `null`. Trata la bio como contenido del usuario y sanéala antes de renderizar HTML.

## Privacidad

- El perfil debe ser `PUBLIC`; la cuenta debe estar activa y no eliminada.
- Biblioteca y colecciones requieren también `list_visibility = PUBLIC`.
- Actividad requiere perfil, listas y `activity_visibility` públicos.
- Los bloqueos en cualquier dirección entre el propietario del token y el usuario impiden todas las consultas.
- No se omiten las restricciones `PRIVATE` o `FOLLOWERS`, ni para seguidores, el propietario o administradores.
- Todas las respuestas incluyen `Cache-Control: private, no-store`; se comprueba la privacidad en cada solicitud.

Un usuario ausente, no disponible, bloqueado o sin visibilidad suficiente produce el mismo **404**.

## Biblioteca pública

Usa los campos de [LibraryEntry](models.md), excluyendo entradas privadas antes de paginar. `private` siempre es `false`. Ordena por `updatedAt` descendente y, en empates, `mediaId` descendente. La escala de `score` sigue siendo 0.5–10.

## Actividad publicada

Solo devuelve eventos **MEDIA_LIST** publicados en el feed y asociados a una entrada actual no privada. No es el historial de auditoría de `/me/activity`: excluye eliminaciones, estados anteriores, puntuaciones históricas, reseñas, follows y posts.

Cada elemento tiene `id`, `type`, `mediaId`, `status`, `progress`, `createdAt` y `media`. Aquí `media` contiene `id`, `slug`, `type`, `title` como cadena y `coverImage`. Ordena por `createdAt` e `id` descendentes. Los eventos eliminados del feed o sin entrada actual pública no aparecen. La ausencia de eventos no prueba ausencia de lectura/consumo.

Biblioteca y actividad respetan la configuración global de contenido adulto y la preferencia de ocultarlo del **propietario del token**. Si el control global no está disponible, se oculta el contenido adulto.

## Colecciones públicas

Devuelve [Collection](models.md) solo con `visibility = PUBLIC`. Omite `PRIVATE` y `UNLISTED`, incluso para el propietario. Ordena por `position` ascendente y después `createdAt` e `id` descendentes. `itemCount` es una cantidad; no incluye el contenido de la colección.

## Paginación

Biblioteca, actividad y colecciones aceptan `limit` **1–100** (predeterminado **20**) y `offset` **0–10000** (predeterminado **0**). Los parámetros vacíos, repetidos, no enteros o fuera de rango devuelven 400.

```sh
curl --fail-with-body 'https://branilist.com/api/v1/users/id/42/library?limit=20&offset=0' \
  -H "Authorization: Bearer $BRANILIST_ACCESS_TOKEN"
```

```json
{"items":[],"limit":20,"offset":0,"hasMore":false}
```

`hasMore` indica resultados adicionales después de la página. Aumenta `offset` por `limit` dentro del intervalo permitido. Los cambios simultáneos pueden desplazar resultados; no es un snapshot ni una exportación completa garantizada. Las páginas vacías devuelven 200 con `items: []`.

## Errores y límites

| Status | Significado |
| --- | --- |
| 400 | ID, username o paginación inválidos |
| 401 | Bearer ausente/inválido/caducado/revocado, scope insuficiente o propietario inactivo |
| 404 | Usuario inexistente, inactivo, eliminado, bloqueado o sin visibilidad pública suficiente |
| 429 | Límite por IP/token o cuota de integración |
| 500 | Fallo de consulta |
| 503 | Servicio de integración no disponible |

Los errores OAuth usan JSON `error` y `error_description`; los de validación, visibilidad y consulta usan texto. Se aplican las [cuotas y límites OAuth existentes](../rate-limits.md), con métricas `users.profile`, `users.library`, `users.activity` y `users.collections`.
