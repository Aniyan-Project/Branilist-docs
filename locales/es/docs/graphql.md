# API GraphQL pública

[Índice](README.md) · [OAuth y PKCE](authentication.md) · [Schema SDL](../../../graphql/schema.graphql)

Usa **`POST https://branilist.com/api/graphql`** con el schema propio de integraciones. REST continúa en `/api/v1`. El `/graphql` del sitio tiene otro contrato y autenticación.

El [explorador](https://branilist.com/api/graphql/playground) permite descubrir el schema y ejecutar operaciones. La referencia del sitio regenera queries, mutations, tipos, argumentos, valores predeterminados y enums desde el SDL en cada build. El servidor también ofrece [SDL](https://branilist.com/api/graphql/schema.graphql) e introspección GraphQL.

## Primera consulta

```sh
curl --fail-with-body 'https://branilist.com/api/graphql' \
  -H 'Content-Type: application/json' \
  --data '{"query":"query { mediaPage(search: \"Frieren\", first: 5) { nodes { id title { romaji english portuguese } coverImage } pageInfo { hasNextPage } } }"}'
```

Selecciona los campos necesarios. `mediaPage` acepta búsqueda opcional, `type: ANIME` o `MANGA`, `first` y `offset`. Sin texto, lista el catálogo por ID interno descendente. La búsqueda literal compara títulos romaji, ingleses, portugueses y nativos, con 2–200 caracteres. Los IDs se serializan como **cadenas GraphQL ID**, conservando la precisión de 64 bits.

## Credenciales y scopes

| Operación | Credencial |
| --- | --- |
| Catálogo, detalles, géneros, estudios, profesionales y personajes | Acceso anónimo o API key; OAuth también puede consultar |
| `media`, catálogo sin búsqueda y entidades relacionadas con API key | `catalog:read` |
| `mediaPage` con texto y API key | `search:read`; los relacionamientos seleccionados requieren `catalog:read` |
| `user`, `viewer.profile` | OAuth `profile:read` |
| Bibliotecas y `media.viewerEntry` | OAuth `library:read` |
| Actividad publicada e historial personal | OAuth `activity:read` |
| Colecciones y sus elementos | OAuth `collections:read` |
| Guardar o eliminar entradas | OAuth `library:write` |

Envía `Authorization: Bearer ACCESS_TOKEN` o `X-Branilist-API-Key: API_KEY`, nunca ambos. Las API keys son para servidores y no autorizan datos personales ni mutations. Las cookies del sitio no autentican esta API. Usa el [flujo OAuth PKCE existente](authentication.md), con renovación y revocación. Al retirar un scope de la aplicación, sus campos dejan de estar autorizados.

`viewer` exige OAuth válido; cada campo interno comprueba su scope. Un token solo con `library:read` puede leer la biblioteca sin `profile:read`. `user` requiere `profile:read` y los scopes de los recursos anidados seleccionados. Los errores de campos anulables pueden producir `data` parcial junto con `errors`.

## Medios y relacionamientos

```graphql
query MediaByProvider($malId: ID!) {
  media(malId: $malId) {
    id
    malId
    anilistId
    title { romaji portuguese }
    genres(first: 10) { nodes { id name } }
    relations(first: 5) { nodes { type media { id title { romaji } } } }
    studios(first: 5) { nodes { role studio { id name } } }
    staff(first: 5) { nodes { role staff { id name } } }
    characters(first: 5) { nodes { role character { id name } } }
  }
}
```

Proporciona **exactamente uno** de `id`, `malId` o `anilistId`. Los IDs externos solo consultan vínculos existentes; no importan medios. Un medio ausente, sin vínculo u oculto por el filtro adulto devuelve `null`. Las queries raíz `staff(id:)`, `character(id:)`, `studio(id:)` y `genres` ofrecen entidades del catálogo.

`averageScore` usa 0–100; la puntuación personal `score`, 0.5–10. Sanea descripciones y bios antes de renderizarlas como HTML.

## Otros usuarios y cuenta autenticada

```graphql
query PublicUser($username: String!) {
  user(username: $username) {
    id
    username
    library(first: 5) { nodes { mediaId status progress media { title { romaji } } } }
    collections(first: 5) { nodes { id name items(first: 5) { nodes { id } } } }
  }
}
```

`user` acepta exactamente uno de `id` o `username`. `username: "123456"` es inequívoco; GraphQL no deduce si un argumento es nombre o ID.

El usuario debe estar activo, tener perfil PUBLIC y no tener bloqueos en ninguna dirección con el propietario del token. Biblioteca y colecciones requieren listas PUBLIC; actividad requiere además actividad PUBLIC. Las excepciones de propietario, seguidores y administradores no omiten estas restricciones públicas. Se excluyen entradas privadas y colecciones PRIVATE/UNLISTED.

`user.activity` solo contiene eventos MEDIA_LIST publicados en el feed con entrada actual no privada. `viewer.activity` es el historial personal de auditoría, con eventos de eliminación. Son modelos distintos.

```graphql
query MyAccount {
  viewer {
    id
    scopes
    profile { username displayName }
    library(first: 10, status: CURRENT, type: ANIME) {
      nodes { mediaId progress score private }
      pageInfo { limit offset hasNextPage }
    }
    activity(first: 5) { nodes { eventType mediaId progressDelta } }
    collections(first: 5) { nodes { id name visibility } }
  }
}
```

`viewer` siempre representa al propietario del token, incluidas sus entradas y colecciones privadas cuando los scopes lo permiten. Email, credenciales, permisos administrativos y gestión del sitio no forman parte de este schema.

## Crear o actualizar una entrada

```graphql
mutation SaveProgress($mediaId: ID!, $input: LibraryEntryInput!) {
  saveLibraryEntry(mediaId: $mediaId, input: $input) {
    mediaId status progress score repeatCount private startedAt
  }
}
```

```json
{"mediaId":"123","input":{"status":"CURRENT","progress":4,"score":8.5}}
```

Requiere `library:write` y modifica solo la entrada del propietario del token. Usa el **ID interno del medio**, también devuelto por consultas MAL/AniList.

**Los campos omitidos se conservan**, incluso con actualizaciones simultáneas de campos diferentes. Las entradas nuevas usan `PLANNING`, progreso/repeticiones cero, puntuación/fechas null y `private: false`. Enviar explícitamente `CURRENT`/`COMPLETED` puede completar fechas ausentes.

- `progress` y `repeatCount`: enteros no negativos.
- `score`: `null` o 0.5–10 en pasos de 0.5; null borra la puntuación.
- `startedAt` y `completedAt`: prefiere `YYYY-MM-DD`; también acepta RFC3339. `null` o `""` borra la fecha.
- `status`, `progress`, `repeatCount` y `private` no aceptan null explícito; omítelos para conservarlos.

El PUT de REST mantiene sus valores predeterminados existentes. Ambas APIs comparten el servicio de escritura e historial. No hay comprobación de versión: escrituras simultáneas al mismo campo todavía pueden sobrescribirse.

## Eliminar una entrada

```graphql
mutation RemoveEntry($mediaId: ID!) {
  removeLibraryEntry(mediaId: $mediaId) { mediaId removed }
}
```

Requiere `library:write`. Devuelve `removed: true` al eliminar o false si ya no existe. La eliminación y el evento REMOVED se confirman en la misma transacción; los reintentos no duplican ese historial. No elimina medios del catálogo, favoritos ni colecciones.

## Paginación, contenido adulto y límites

Las listas devuelven `nodes` y `pageInfo { limit offset hasNextPage }`. `first`: 1–100, predeterminado 20; `offset`: 0–10000, predeterminado 0. Aumenta offset por first. Los cambios simultáneos pueden desplazar páginas; la privacidad y el contenido se filtran antes de paginar.

El contenido adulto se oculta en acceso anónimo/API key. OAuth necesita que la configuración global y la preferencia del propietario lo permitan. La carga por lotes y su caché solo duran una solicitud. No compartas respuestas autenticadas entre cuentas.

| Control | Límite |
| --- | --- |
| Cuerpo HTTP | 64 KiB |
| Analizador | 4000 tokens |
| Campos raíz, incluidos aliases/fragments | 20 |
| Campos expandidos | 2000 |
| Profundidad de datos | 12; introspección del schema permite 20 |
| Complejidad | 1500; las páginas multiplican el coste por `first` |
| Plazo de ejecución | 10 segundos, con cancelación de consultas a la base |
| IP | 120 solicitudes/minuto |
| Token OAuth | 300/minuto, compartido con el limitador de tokens REST |

Las aplicaciones autenticadas también usan su límite por minuto y cuota diaria. Cada POST autenticado admitido consume una solicitud, aunque falle en validación u operación. La cuota diaria se comparte con REST. CORS expone `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` y `Retry-After`. Las respuestas usan `Cache-Control: private, no-store`.

Usa páginas pequeñas en consultas anidadas. La complejidad puede impedir la consulta antes de acceder a la base. No se admiten batches HTTP, uploads, subscriptions ni autenticación por cookies. El mantenimiento puede bloquear lecturas y/o mutations.

## HTTP y errores

Envía JSON con `query`, `variables` y, cuando sea necesario, `operationName`. Solo POST ejecuta operaciones. Comprueba `errors` incluso con HTTP 200. `extensions.code` puede ser `UNAUTHENTICATED`, `FORBIDDEN`, `BAD_USER_INPUT`, `NOT_FOUND`, `QUERY_LIMIT_EXCEEDED`, `COMPLEXITY_LIMIT_EXCEEDED`, `RATE_LIMITED`, `QUOTA_EXCEEDED`, `SERVICE_UNAVAILABLE` o `TIMEOUT`. Los fallos internos no exponen SQL ni credenciales.

Fallos HTTP de autenticación: 401; límites/cuota: 429; mantenimiento/integración no disponible: 503; método inválido: 405; cuerpo declarado mayor que el máximo: 413. JSON, sintaxis y validación pueden devolver 4xx. Los campos raíz de mutation se ejecutan secuencialmente, cada uno con su transacción; la operación GraphQL completa no es una única transacción.

## Mantener la referencia

Ejecuta el [cliente Node.js](../../../examples/graphql.mjs) con `node examples/graphql.mjs`. Solo consulta por defecto, detecta errores GraphQL con HTTP 200, conserva datos parciales en el error y no reintenta operaciones automáticamente.

`graphql/schema.graphql` es la fuente de documentación. Al cambiar el contrato del backend, copia `apps/api/internal/publicgraph/schema.graphqls` a ese archivo. Cada build regenera tipos, argumentos, navegación en tres idiomas, descargas SDL e introspección JSON. `npm run check` valida los ejemplos GraphQL contra el schema.
