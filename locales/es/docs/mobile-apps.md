# Aplicaciones móviles

[Índice](README.md) · [GraphQL](graphql.md) · [OAuth y PKCE](authentication.md)

Usa `POST https://branilist.com/api/graphql` para aplicaciones de catálogo y biblioteca. La GraphQL pública usa OAuth, no las cookies de sesión del sitio.

## Autorización nativa

Registra una aplicación **PUBLIC** con un callback HTTPS bajo tu control. Configura Android App Links o iOS Universal Links para esa dirección. Habilita solamente los scopes necesarios en el panel; los permisos nuevos no se añaden automáticamente a aplicaciones ni tokens existentes.

Genera `state`, `code_verifier` y `code_challenge` S256 nuevos en cada intento. Abre la autorización en el navegador del sistema, verifica el estado recibido e intercambia el código en `/oauth/token` con el mismo callback y verifier. Una aplicación PUBLIC no debe incluir client secret ni recibir la contraseña del usuario.

Guarda los tokens en el almacenamiento seguro de la plataforma. Los refresh tokens rotan: sustituye el token almacenado después de cada renovación y evita renovaciones concurrentes. Al salir, revoca el token en `/oauth/revoke` y elimina los datos locales de esa cuenta. Consulta [OAuth](authentication.md) para los parámetros.

El callback debe coincidir exactamente con una dirección registrada. No se aceptan esquemas propios como `miapp://callback`; utiliza enlaces HTTPS asociados a la aplicación.

## Exploración del catálogo

`mediaPage` admite `search`, `type`, `first`, `offset`, `filter` y `sort`. Los filtros combinan género por slug, intervalo de años, temporada, formato y estado. Los años deben estar entre 1900 y 2200 y el límite inferior no puede superar el superior. El orden predeterminado sigue siendo `ID_DESC`.

```graphql
query Explore {
  mediaPage(type: ANIME, filter: {yearFrom: 2020, genre: "action", status: FINISHED}, sort: SCORE_DESC, first: 12) {
    nodes { id title { romaji english } coverImage averageScore }
    pageInfo { hasNextPage offset limit }
  }
  trendingMedia(type: ANIME, days: 30, first: 6) { id title { romaji } }
}
```

`mediaBySlug(slug:, type:)` resuelve enlaces de obras. `trendingMedia` acepta 1–90 días y 1–30 resultados. `media.similar(first:)` ofrece recomendaciones similares; `viewer.recommendations(first:)` usa la biblioteca del dueño del token y exige `library:read`. Las recomendaciones aceptan 1–30 resultados y pueden devolver menos después del filtro de contenido adulto.

## Biblioteca y estadísticas

```graphql
query MyLibrary {
  viewer {
    libraryPage(search: "Frieren", type: ANIME, sort: UPDATED, first: 20) {
      nodes { mediaId status progress score private media { title { romaji } } }
      pageInfo { hasNextPage }
    }
    libraryInsights {
      mediaCount animeCount mangaCount completedCount
      episodesConsumed chaptersConsumed estimatedWatchMinutes averageScore
      statuses { key label count percentage }
    }
  }
}
```

Ambos campos exigen `library:read`. `libraryPage` filtra por texto, estado y tipo; ordena por actualización, título, nota, progreso, inicio o finalización. La búsqueda acepta hasta 200 caracteres y trata `%` y `_` literalmente. Las estadísticas representan toda la biblioteca personal, con distribuciones por género, formato, año, estado, nota, país y estudio. Su escala de nota media sigue el servicio del sitio; `LibraryEntry.score` sigue usando 0,5–10.

Usa [saveLibraryEntry](graphql.md) para progreso, nota y estado. Esta mutation conserva los campos omitidos.

## Favoritos

`viewer.favourites(type:, first:, offset:)` exige `favourites:read`. Los tipos son `MEDIA`, `STAFF`, `STUDIO` y `CHARACTER`; cada resultado incluye ID, posición y el objeto correspondiente.

```graphql
mutation Favourite($id: ID!) {
  setFavourite(type: MEDIA, id: $id, enabled: true) { type id enabled }
}
```

Las escrituras exigen `favourites:write`. Repetir `setFavourite` con el mismo estado lo conserva: `true` añade y `false` elimina. `reorderFavourites(type:, ids:)` coloca entre 1 y 200 IDs distintos al principio; los demás conservan su orden relativo. Todos los IDs deben pertenecer a los favoritos del dueño del token.

## Colecciones

`collection(id:)`, `publicCollections(search:, type:, first:, offset:)` y sus elementos exigen `collections:read`. La búsqueda pública muestra solamente colecciones PUBLIC de cuentas activas con perfil y listas públicos, sin bloqueos en ninguna dirección. El dueño puede consultar colecciones privadas por ID o mediante `viewer.collections`.

```graphql
mutation CreateCollection {
  createCollection(input: {mediaType: ANIME, name: "Para el fin de semana", visibility: PRIVATE, tags: ["cortos"]}) {
    id name visibility
  }
}
```

`createCollection`, `updateCollection`, `deleteCollection` y `setCollectionItem` exigen `collections:write` y afectan solamente al dueño del token. Se aplican los mismos límites por tipo del sitio, incluidos los beneficios VIP.

`updateCollection` **sustituye los metadatos**: envía nombre, descripción, color, visibilidad, tags, portada y posición deseados. Los campos opcionales omitidos se borran o usan sus valores predeterminados; los elementos existentes no cambian. Portada y elementos deben coincidir con el tipo de la colección. El nombre acepta 1–60 caracteres, la descripción hasta 500 y las tags hasta 8 valores de 24 caracteres cada uno.

`setCollectionItem(collectionId:, mediaId:, enabled:, position:, note:)` añade, actualiza o elimina un elemento. Posición y nota sustituyen los valores anteriores; la nota acepta hasta 500 caracteres y no se expone en la API pública. `deleteCollection` devuelve `false` si no elimina ninguna colección del dueño del token.

## Perfil, preferencias y privacidad

| Recurso | Lectura | Escritura |
| --- | --- | --- |
| Perfil | `viewer.profile`, `profile:read` | `updateProfile`, `profile:write` |
| Preferencias | `viewer.preferences`, `preferences:read` | `savePreferences`, `preferences:write` |
| Privacidad | `viewer.privacy`, `privacy:read` | `savePrivacy`, `privacy:write` |

`updateProfile` sustituye nombre visible, biografía, avatar y banner. Biografía y URLs omitidas se borran; las posiciones omitidas del banner se conservan. Nombre acepta 1–60 caracteres, biografía hasta 10000 y posiciones de 0 a 100. Las imágenes deben ser uploads del dueño del token; la GraphQL pública no sube archivos. Las ediciones de perfil comparten el límite de 20 por usuario y hora con el sitio.

`savePreferences` recibe un idioma habilitado, preferencia de título, tema y ocultación de contenido adulto. Omitir `darkTheme` lo conserva; `null` explícito es inválido. Permitir contenido adulto surte efecto en la próxima petición; ocultarlo tiene efecto inmediato.

`savePrivacy` recibe la visibilidad de perfil, listas y actividad (`PUBLIC`, `FOLLOWERS` o `PRIVATE`). Los scopes de lectura no conceden escritura implícitamente. Consulta la respuesta de la mutation para confirmar el estado guardado.

## Límites del contrato

Se aplican las [reglas de privacidad, paginación, coste y errores](graphql.md). Cada campo de mutation tiene su propia transacción. Para uso sin conexión, comprueba el estado tras fallos de red y evita reintentos indiscriminados; esta API no ofrece sincronización incremental ni resolución automática de conflictos.

Feed social, foro, reviews, push y gestión sensible de cuenta quedan fuera de estas operaciones de catálogo y biblioteca. Aísla credenciales por cuenta y comprueba errores GraphQL incluso con HTTP 200.
