# Biblioteca personal

[Índice](../README.md) · [OAuth](../authentication.md) · [Modelos](models.md)

El access token determina el usuario. Todas las operaciones usan el **ID interno de Branilist**, también después de buscar un ID de MAL/AniList.

| Método | Ruta | Scope |
| --- | --- | --- |
| GET | `/api/v1/me/library` | `library:read` |
| PUT | `/api/v1/me/library/{mediaId}` | `library:write` |
| DELETE | `/api/v1/me/library/{mediaId}` | `library:write` |

## GET /api/v1/me/library

```sh
curl --fail-with-body 'https://branilist.com/api/v1/me/library' \
  -H "Authorization: Bearer $BRANILIST_ACCESS_TOKEN"
```

Devuelve 200 con `items`, ordenados por actualización más reciente. Incluye hasta **500 entradas**, sin paginación, filtros ni cursores, incluidas las entradas privadas del propietario del token.

```json
{"items":[{"mediaId":123,"status":"CURRENT","progress":3,"score":8.5,"repeatCount":0,"startedAt":"2026-10-01T00:00:00Z","completedAt":null,"private":false,"updatedAt":"2026-10-21T12:00:00Z","media":{"id":123,"slug":"example-anime","type":"ANIME","title":{"romaji":"Example","english":"Example","portuguese":null},"coverImage":null}}]}
```

## PUT /api/v1/me/library/{mediaId}

Crea una entrada o actualiza la existente. Envía `Content-Type: application/json`.

```sh
curl --fail-with-body -X PUT 'https://branilist.com/api/v1/me/library/123' \
  -H "Authorization: Bearer $BRANILIST_ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{"status":"CURRENT","progress":3,"score":8.5,"repeatCount":0,"startedAt":"2026-10-01","private":false}'
```

| Campo | Regla | Si se omite |
| --- | --- | --- |
| `status` | Obligatorio: `PLANNING`, `CURRENT`, `COMPLETED`, `PAUSED` o `DROPPED`; normalizado a mayúsculas | Solicitud inválida |
| `progress` | Entero no negativo; episodios para anime, capítulos para manga | **0**, incluso en entradas existentes |
| `score` | `null` o **0.5–10**, en incrementos de **0.5** | **Elimina la puntuación** |
| `repeatCount` | Entero no negativo | **0**, incluso en entradas existentes |
| `startedAt` | `YYYY-MM-DD`, RFC3339, `null` o cadena vacía | Conserva el valor; `CURRENT` completa la fecha actual si no existe |
| `completedAt` | Los mismos formatos | Conserva el valor; `COMPLETED` completa la fecha actual si no existe |
| `private` | Booleano para la privacidad | Se conserva al actualizar; `false` al crear |

**PUT no es una actualización parcial.** Lee y reenvía el progreso, la puntuación y las repeticiones para conservarlos. No hay comprobación de versión; coordina las escrituras simultáneas.

Para borrar una fecha, envía explícitamente `null` o `""`. Se almacenan como fechas de calendario; prefiere `YYYY-MM-DD`. Las respuestas de lectura serializan estos campos como timestamps. La ruta pública no valida los totales de episodios/capítulos ni el orden de las fechas. No envíes valores inconsistentes aprovechando esas limitaciones.

Tanto la creación como la actualización devuelven **200**:

```json
{"ok":true,"mediaId":123}
```

Los cambios efectivos se registran en el historial. Las entradas privadas no publican actividad de lista en el feed. Este cuerpo no incluye notas de texto.

Errores: 400 por ID, JSON o campos inválidos; 401 por token inválido o insuficiente; 429 por límites/cuota; 500 por fallo de actualización, incluido un medio interno inexistente. No supongas 404 para esta escritura. Consulta las [diferencias de errores](../errors.md).

## DELETE /api/v1/me/library/{mediaId}

```sh
curl --fail-with-body -X DELETE 'https://branilist.com/api/v1/me/library/123' \
  -H "Authorization: Bearer $BRANILIST_ACCESS_TOKEN"
```

No necesita cuerpo. Solo elimina la entrada del propietario del token; el medio permanece en el catálogo. No elimina favoritos ni colecciones.

```json
{"ok":true,"mediaId":123,"removed":true}
```

Si no existe una entrada, devuelve 200 con `removed: false`, incluso para IDs positivos sin entrada del usuario. La eliminación y el evento `REMOVED` se guardan en la misma transacción. Repetir la solicitud no duplica el historial. Incluye `Cache-Control: no-store`.

Errores: 400 por ID inválido; 401 por token ausente, inválido, caducado, revocado o sin scope; 429 por límites/cuota; 500 por fallo de eliminación. Las entradas ausentes no producen 204 ni 404.
