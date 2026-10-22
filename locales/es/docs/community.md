# Comunidad, reviews y notificaciones

[Índice](README.md) · [GraphQL](graphql.md) · [Aplicaciones móviles](mobile-apps.md) · [OAuth y PKCE](authentication.md)

Las operaciones sociales usan `POST https://branilist.com/api/graphql` con OAuth Bearer. Las API keys y cookies del sitio no las autorizan. Todas las escrituras actúan como el dueño del token; no existe un argumento para suplantar otra cuenta.

## Permisos

| Scope | Acceso |
| --- | --- |
| `social:read` | Feed, seguidores, publicaciones, reviews y comentarios accesibles; incluye mensajes privados si el dueño del token es un participante autorizado |
| `social:write` | Seguir, publicar, editar/eliminar publicaciones propias, reaccionar y eliminar eventos propios del feed |
| `reviews:write` | Crear, sustituir y eliminar tu review de una obra |
| `comments:write` | Publicar, responder y eliminar comentarios propios |
| `notifications:read` | Notificaciones personales, contador y preferencias |
| `notifications:write` | Marcar notificaciones como leídas y cambiar preferencias |
| `blocks:read` | Leer bloqueos y silenciamientos personales |
| `blocks:write` | Bloquear/desbloquear y silenciar/reactivar cuentas |
| `reports:write` | Denunciar contenido accesible |

Habilita los scopes necesarios en el panel y solicita nuevo consentimiento. Las aplicaciones y tokens existentes no reciben permisos nuevos automáticamente. La lectura no incluye escritura; las API keys siguen limitadas al catálogo.

## Feed y conexiones

```graphql
query CommunityHome {
  viewer {
    feed(scope: FOLLOWING, types: [PROFILE_POST, REVIEW, MEDIA_LIST], first: 20) {
      nodes {
        id type actor { id username displayName avatarUrl }
        post { id body visibility }
        review { id title recommendation spoilerLevel }
        media { id title { romaji } }
        status progress likeCount viewerLiked createdAt
      }
      pageInfo { hasNextPage offset limit }
    }
    followers(first: 20) { nodes { id username } pageInfo { hasNextPage } }
    following(first: 20) { nodes { id username } pageInfo { hasNextPage } }
  }
}
```

`viewer.feed` exige `social:read`. FOLLOWING es el valor predeterminado e incluye tu cuenta; GLOBAL considera la comunidad accesible. Los tipos son MEDIA_LIST, REVIEW, FOLLOW, PROFILE_POST y REPOST; una lista vacía incluye todos. Se ordenan por fecha descendente e ID.

Se aplican visibilidad de perfil/actividad/listas, cuenta activa, bloqueos, silenciamientos y preferencias de contenido adulto antes de paginar. Los eventos de entradas actualmente privadas no aparecen para terceros. Los mensajes privados o dirigidos a un perfil no entran en el feed global ni en el de cuentas seguidas.

`user(id: o username:)` también ofrece followers, following, posts y reviews. El objeto principal exige `profile:read`; estos campos exigen `social:read`. Se conservan las restricciones de usuario público: `user.posts` solo devuelve publicaciones PUBLIC y exige actividad PUBLIC. Usa el feed, `viewer.posts` y los detalles por ID para contenido personal o visible a seguidores. Los resúmenes SocialActor no incluyen email, credenciales ni permisos administrativos.

```graphql
mutation Follow($username: String!) {
  setFollow(username: $username, enabled: true)
}
```

`setFollow`, `setBlock` y `setMute` reciben username y estado deseado. Repetir el mismo estado lo conserva. El booleano representa el estado final: false después de dejar de seguir significa que la operación tuvo éxito.

## Publicaciones, respuestas y citas

```graphql
mutation Publish {
  createPost(input: {body: "Mi publicación en Branilist"}) { id body visibility createdAt }
}
```

- `createPost(input:)`: cuerpo de 1–12000 caracteres y hasta 4 IDs de imágenes POST_IMAGE ya subidas por tu cuenta.
- `updatePost(id:, body:)`: sustituye solamente el texto propio, conservando imágenes y contexto.
- `deletePost(id:)`: elimina una publicación propia y sus respuestas según las reglas del sitio.
- `post(id:)`: detalles accesibles, incluidos replies(first:, offset:) y quotedPost.
- `viewer.posts`: publicaciones principales propias y mensajes dirigidos al dueño del token, respetando los bloqueos actuales.

Para responder, envía parentId de la publicación principal. Se admite un nivel de respuestas; la conversación hereda la visibilidad principal. Para citar, envía quotedPostId: solo se permiten publicaciones principales públicas sin destinatario de perfil. Una respuesta no puede ser también una cita.

Para mensajes de perfil, envía recipientId de otra cuenta y visibilidad PRIVATE o PUBLIC. Los mensajes privados solo son accesibles al autor/destinatario autorizados; las respuestas heredan esa protección. Los roles administrativos del sitio no conceden excepciones en la API pública. Un mensaje dirigido no puede ser respuesta ni cita; las publicaciones normales sin destinatario usan PUBLIC.

El cuerpo es texto/BBCode, no HTML listo para insertar. Renderiza y sanitiza en el cliente. Este endpoint no sube archivos; los IDs adjuntos deben existir y pertenecer a la cuenta autorizada.

## Reviews

```graphql
mutation Review($mediaId: ID!) {
  saveReview(input: {
    mediaId: $mediaId
    title: "Mi opinión"
    body: "Una review con suficientes detalles sobre la obra elegida."
    recommendation: RECOMMENDED
    spoilerLevel: NONE
    aspects: {story: 8, enjoyment: 9}
  }) { id title body recommendation aspects { story enjoyment } }
}
```

`saveReview` exige `reviews:write` y crea/sustituye la review del dueño del token para un ID interno de Branilist. Cuerpo: 20–10000 caracteres; título opcional: hasta 120. Recomendaciones: RECOMMENDED, MIXED, NOT_RECOMMENDED. Spoilers: NONE, MINOR, MAJOR. Los aspectos opcionales story, characters, visuals, sound y enjoyment usan enteros de 1 a 10.

La entrada sustituye la review: título y aspectos omitidos se borran. Los intentos concurrentes de creación no duplican eventos de review en el feed. La review no modifica la nota ni el progreso de la biblioteca.

Consulta review(id:), reviews(mediaId:, first:, offset:), user.reviews o viewer.myReview(mediaId:) con `social:read`. deleteReview(id:) exige `reviews:write` y elimina solamente la review propia.

## Comentarios y reacciones

`comments(mediaId: o reviewId: o activityId:)` exige exactamente un selector y `social:read`. createComment exige `comments:write`, el mismo selector y cuerpo de 1–4000 caracteres. Añade parentId para responder a un comentario accesible de la misma discusión. Las respuestas a respuestas se asocian al comentario raíz. deleteComment elimina solamente comentarios propios. Los eliminados pueden aparecer vacíos con removed: true para conservar la conversación.

```graphql
mutation Comment($reviewId: ID!) {
  createComment(input: {reviewId: $reviewId, body: "Mi comentario sobre la review"}) {
    id body parentId createdAt
  }
}
```

setPostLike, setPostRepost, setActivityLike, setReviewLike y setCommentLike exigen `social:write`, ID y enabled. setReviewReaction añade reaction: HELPFUL, INSIGHTFUL o WELL_WRITTEN. Asignan un estado, no lo invierten. Se mantienen las reglas del sitio, incluidos bloqueos y prohibición de dar me gusta/republicar tu propia publicación. Los mensajes privados no se pueden republicar.

deleteActivity(id:) solo elimina un evento del feed propio: no borra la biblioteca, review o publicación original ni deshace automáticamente una reacción.

## Notificaciones personales

```graphql
query Notifications {
  viewer {
    unreadNotificationCount
    notifications(first: 20) {
      nodes { id type preview priority readAt createdAt postId reviewId commentId }
      pageInfo { hasNextPage }
    }
    notificationPreferences { follows replies emailMode quietHoursEnabled quietTimezone }
    notificationTypePreferences { type inAppEnabled emailEnabled mutedUntil }
  }
}
```

Estos campos exigen `notifications:read`. Las referencias y vistas previas se revalidan según el acceso actual y pueden ser null si se elimina el contenido, cambia su privacidad o no se confirma la autorización. Una vista previa antigua nunca evita las reglas de privacidad. El contador puede incluir notificaciones con vista previa oculta.

markNotificationRead(id:) y markAllNotificationsRead exigen `notifications:write`. La primera devuelve true para un ID propio, incluso si ya estaba leído; IDs ajenos devuelven false. La segunda devuelve cuántos elementos no leídos fueron marcados.

saveNotificationPreferences sustituye preferencias generales: categorías habilitadas, email OFF/IMMEDIATE/DAILY, agrupación, importantes, indicador y horario silencioso. Los horarios usan minutos de 0 a 1439 y zona IANA, por ejemplo America/Sao_Paulo. Todos sus campos son obligatorios.

saveNotificationTypePreference sustituye la configuración de un tipo conocido. Consulta los nombres en viewer.notificationTypePreferences; envía inAppEnabled, emailEnabled y mutedUntil opcional. Omitir/enviar null en mutedUntil borra el silenciamiento temporal; fechas pasadas se normalizan. Estas operaciones cambian preferencias y no permiten enviar notificaciones arbitrarias.

## Bloqueos y denuncias

viewer.blockedUsers y viewer.mutedUsers son paginados y exigen `blocks:read`; setBlock/setMute exigen `blocks:write`. Bloquear elimina relaciones de seguimiento, silenciamientos y notificaciones entre ambas cuentas según el sitio. Desbloquear no restaura esas relaciones. Silenciar filtra el feed, sin prohibir consultar contenido público directamente.

```graphql
mutation Report($postId: ID!) {
  reportContent(input: {targetType: PROFILE_POST, targetId: $postId, reason: "SPAM"}) {
    id status createdAt
  }
}
```

reportContent exige `reports:write` y admite USER, REVIEW, COMMENT o PROFILE_POST. El recurso debe ser accesible y no puede ser contenido propio. Motivo: 3–120 caracteres; detalles opcionales: hasta 2000. Las categorías conocidas, como SPAM, se normalizan. Se rechazan denuncias abiertas duplicadas. El resultado solo confirma la creación, sin vistas previas administrativas, datos de otros denunciantes ni notas de moderación.

## Límites y recuperación

Se aplican los [límites GraphQL](graphql.md), páginas de 1–100 y offset hasta 10000. Límites adicionales por cuenta: 20 publicaciones/ediciones cada 10 minutos, 10 reviews cada 10 minutos, 30 comentarios cada 5 minutos y 10 denuncias por hora, con máximo de 20 en 24 horas. Interacciones, preferencias y eliminaciones tienen límites propios. La plataforma puede exigir email verificado o deshabilitar denuncias.

Comprueba errors incluso con HTTP 200. Los roles administrativos no permiten modificar contenido ajeno. No reintentes automáticamente crear publicaciones, comentarios o denuncias después de un timeout: confirma el estado antes. Las operaciones set* conservan el estado solicitado, pero varios campos de mutation no forman una sola transacción. Las notificaciones se leen con consultas paginadas; este contrato no ofrece subscriptions ni push móvil.
