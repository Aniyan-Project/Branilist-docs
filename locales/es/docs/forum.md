# Foro y Spaces

[Índice](README.md) · [GraphQL](graphql.md) · [Comunidad y notificaciones](community.md)

Usa `POST https://branilist.com/api/graphql` con OAuth Bearer. Solicita `forum:read` para consultar y `forum:write` para publicar e interactuar. Lectura y escritura son independientes: configura los permisos de la aplicación y obtén el consentimiento del usuario. Las API keys y el acceso anónimo no autorizan estas operaciones.

## Consultar temas

```graphql
query BrowseForum($category: String) {
  forumTopics(filter: {categorySlug: $category}, sort: ACTIVITY, first: 10) {
    nodes {
      id title status pinned featured
      author { id username displayName }
      category { slug name locked }
      tags { id slug name }
      spaceSlug postCount viewerSubscribed
    }
    pageInfo { hasNextPage limit offset }
  }
}
```

`forumTopics` combina texto opcional de hasta 200 caracteres, `categorySlug`, `tagSlug`, `spaceSlug` y estado `OPEN` o `LOCKED`. Ordenaciones: `ACTIVITY`, `RELEVANCE`, `POPULARITY` y `NEWEST`. La búsqueda considera títulos, etiquetas y mensajes accesibles; el contenido oculto no produce coincidencias. `%` y `_` siguen las reglas de comodines del buscador del foro. Las consultas no incrementan las visualizaciones.

`forumTopic(id:)` consulta un tema; `forumPost(id:)` consulta un mensaje. `forumTopic.posts(first:, offset:)` devuelve mensajes en orden de creación, incluido el inicial. Los eliminados tienen `removed: true` y cuerpo vacío. `parentId` identifica el mensaje respondido del mismo tema y se oculta si no es accesible. No se exponen revisiones ni motivos históricos de edición.

## Categorías, etiquetas y Spaces

`forumCategories` y `forumTags` tienen paginación. La categoría indica si está cerrada para nuevos temas. Cada tema devuelve hasta ocho etiquetas.

`forumSpaces(first:, offset:)` lista Spaces activas. `forumSpace(slug:)` ofrece descripción, reglas, imágenes, responsable, contadores y `viewerMember`. Los contadores de miembros, temas y mensajes consideran la visibilidad actual. Responsables y moderadores no reciben excepciones de acceso en esta API. La gestión de Spaces, la asignación de roles y la moderación quedan fuera del contrato público.

## Crear, responder y editar

```graphql
mutation NewTopic($category: ID!, $tags: [ID!]!) {
  createForumTopic(input: {
    categoryId: $category
    title: "¿Qué están viendo?"
    body: "Compartan sus recomendaciones de la temporada."
    tagIds: $tags
  }) { id title }
}
```

`createForumTopic` exige título de 4–160 caracteres y cuerpo de 2–20000, después de quitar espacios en los extremos. Acepta hasta ocho IDs de etiquetas existentes y distintos. Tema, mensaje inicial, etiquetas, suscripción del autor y notificaciones se guardan juntos; etiquetas inválidas no dejan temas parciales. La creación pública no mueve temas a Spaces.

```graphql
mutation Reply($topic: ID!, $parent: ID) {
  createForumPost(topicId: $topic, parentId: $parent, body: "¡Mi recomendación!") {
    id topicId parentId body viewerOwns
  }
}
```

`createForumPost` acepta cuerpo de 2–20000 caracteres y suscribe al autor al tema. `parentId` opcional debe señalar un mensaje activo y accesible del mismo tema.

`updateForumPost(id:, body:, reason:)` modifica solamente un mensaje activo del dueño del token. El motivo opcional admite hasta 300 caracteres. El servicio registra la revisión sin exponer el historial en la API pública. Temas cerrados y participantes silenciados no pueden publicar, editar ni reaccionar.

`deleteForumPost(id:)` elimina solamente mensajes del dueño del token y devuelve `false` cuando no elimina nada, incluso al repetir la operación. Conserva la estructura de la conversación con cuerpo vacío. `setForumTopicTags(id:, tagIds:)` reemplaza las etiquetas solamente de un tema propio; una lista vacía las borra.

## Reacciones, suscripciones y participación

```graphql
mutation Interact($topic: ID!, $post: ID!, $space: ID!) {
  setForumSubscription(id: $topic, enabled: true)
  setForumReaction(id: $post, reaction: HELPFUL, enabled: true)
  setForumMembership(spaceId: $space, enabled: true)
}
```

Las operaciones `set*` reciben el estado deseado: repetir `enabled: true` lo conserva. Cada campo tiene su propia transacción; el ejemplo no es una transacción única. Reacciones: `LIKE`, `HELPFUL`, `AGREE` e `INSIGHTFUL`. No puedes reaccionar a tu propio mensaje. `reactions` muestra contadores y `viewerReacted` por tipo.

`viewer.forumSubscriptions(first:, offset:)` exige `forum:read` y lista temas suscritos que siguen accesibles. Suscribirse no concede acceso a contenido privado o archivado.

La participación en Spaces usa el rol común `MEMBER`. La API no elimina responsables/moderadores ni permite salir durante un silenciamiento activo para evadir restricciones. Salir y volver no restaura privilegios de moderación.

## Notificaciones y denuncias

`viewer.notifications` sigue exigiendo `notifications:read`. Las referencias `forumTopicId`, `forumPostId` y las vistas previas del foro exigen además `forum:read`, el foro habilitado y contenido actualmente accesible. Eliminaciones, archivos, bloqueos o cambios de visibilidad pueden volver nulos estos campos. Este contrato no ofrece subscriptions GraphQL ni entrega push.

`reportContent` acepta también `FORUM_TOPIC` y `FORUM_POST` con `reports:write`, aplicando la misma visibilidad. No exige `forum:write` y no permite denunciar contenido propio. Devuelve solo el comprobante, sin datos de moderación. Consulta los [límites de denuncias](community.md).

## Privacidad, límites y recuperación

Se excluyen temas/Spaces archivados, cuentas inactivas/eliminadas y bloqueos en cualquier dirección. Perfiles `FOLLOWERS` exigen seguir al autor; perfiles `PRIVATE` son accesibles solo a su dueño. Las reglas se aplican antes de la paginación y a los cuerpos buscados. Los mensajes de autores inaccesibles se excluyen y las referencias al padre se revalidan. Los tokens de administradores siguen limitados al contrato público.

Paginación: `first` de 1–100, `offset` de 0–10000, valores por defecto 20/0. Se aplican los [límites de costo y errores GraphQL](graphql.md). Por cuenta: 10 temas nuevos/hora, 60 respuestas/hora, 60 ediciones/hora, 60 eliminaciones/hora, 60 reemplazos de etiquetas/hora y 120 interacciones/hora. Puede exigirse email verificado. Deshabilitar el foro bloquea esta superficie.

Revisa `errors` incluso con HTTP 200. Tras un timeout al crear tema/respuesta, confirma el estado antes de reenviar: estas creaciones no tienen clave de idempotencia. Renderiza BBCode con un procesador que sanee contenido y enlaces. No trates los cuerpos como HTML confiable.
